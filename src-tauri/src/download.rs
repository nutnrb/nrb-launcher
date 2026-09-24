// src-tauri/src/download.rs
// ZIP download + extract + replace + backup
use crate::hardware::get_machine_id;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use tauri::AppHandle;
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub slug: String,
    pub version: String,
    pub downloaded: u64,
    pub total: u64,
    pub percent: u8,
    pub stage: String, // "downloading" | "verifying" | "extracting" | "done"
}

fn get_programs_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .ok_or_else(|| "Cannot determine local data directory".to_string())?;
    let dir = base.join("NRB Launcher").join("programs");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn get_backup_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .ok_or_else(|| "Cannot determine local data directory".to_string())?;
    let dir = base.join("NRB Launcher").join("backup");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

#[tauri::command]
pub async fn download_and_install(
    app: AppHandle,
    slug: String,
    version: String,
    sha256: String,
    download_url: String,
) -> Result<String, String> {
    let programs_dir = get_programs_dir()?;
    let backup_dir = get_backup_dir()?;
    let install_path = programs_dir.join(&slug);
    let backup_path = backup_dir.join(&slug);

    let machine_id = get_machine_id()?;

    // 1. Download with progress
    let download_dir = programs_dir.join(".cache");
    fs::create_dir_all(&download_dir).map_err(|e| e.to_string())?;
    let zip_path = download_dir.join(format!("{}-{}.zip", slug, version));

    emit_progress(&app, &slug, &version, 0, 0, "downloading");

    let res = reqwest::Client::new()
        .get(&download_url)
        .header("X-Machine-Id", &machine_id)
        .send()
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    let total = res.content_length().unwrap_or(0);
    let mut file = File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        let percent = if total > 0 {
            ((downloaded as f64 / total as f64) * 100.0) as u8
        } else {
            0
        };
        emit_progress(&app, &slug, &version, downloaded, total, "downloading");
        if percent % 5 == 0 {
            let _ = app.emit(
                "download_progress",
                DownloadProgress {
                    slug: slug.clone(),
                    version: version.clone(),
                    downloaded,
                    total,
                    percent,
                    stage: "downloading".to_string(),
                },
            );
        }
    }
    drop(file);

    // 2. Verify SHA-256
    emit_progress(&app, &slug, &version, downloaded, total, "verifying");
    let actual_sha = sha256_file(&zip_path)?;
    if actual_sha.to_lowercase() != sha256.to_lowercase() {
        fs::remove_file(&zip_path).ok();
        return Err(format!(
            "Checksum mismatch: expected {}, got {}",
            sha256, actual_sha
        ));
    }

    // 3. Backup existing
    if install_path.exists() {
        if backup_path.exists() {
            fs::remove_dir_all(&backup_path).ok();
        }
        copy_dir(&install_path, &backup_path)?;
    }

    // 4. Extract
    emit_progress(&app, &slug, &version, downloaded, total, "extracting");
    extract_zip(&zip_path, &install_path)?;

    // 5. Write version marker
    fs::write(install_path.join(".version"), version.as_bytes())
        .map_err(|e| e.to_string())?;

    // 6. Cleanup zip
    fs::remove_file(&zip_path).ok();

    emit_progress(&app, &slug, &version, downloaded, total, "done");

    Ok(install_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn rollback(slug: String) -> Result<(), String> {
    let programs_dir = get_programs_dir()?;
    let backup_dir = get_backup_dir()?;
    let install_path = programs_dir.join(&slug);
    let backup_path = backup_dir.join(&slug);

    if backup_path.exists() {
        if install_path.exists() {
            fs::remove_dir_all(&install_path).map_err(|e| e.to_string())?;
        }
        copy_dir(&backup_path, &install_path)?;
        Ok(())
    } else {
        Err("No backup found".to_string())
    }
}

fn emit_progress(
    app: &AppHandle,
    slug: &str,
    version: &str,
    downloaded: u64,
    total: u64,
    stage: &str,
) {
    let _ = app.emit(
        "download_progress",
        DownloadProgress {
            slug: slug.to_string(),
            version: version.to_string(),
            downloaded,
            total,
            percent: if total > 0 {
                ((downloaded as f64 / total as f64) * 100.0) as u8
            } else {
                0
            },
            stage: stage.to_string(),
        },
    );
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];
    loop {
        let n = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn copy_dir(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;
    for entry in fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let from = entry.path();
        let to = dst.join(entry.file_name());
        if from.is_dir() {
            copy_dir(&from, &to)?;
        } else {
            fs::copy(&from, &to).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn extract_zip(zip_path: &Path, dest: &Path) -> Result<(), String> {
    let file = File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    fs::create_dir_all(dest).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = dest.join(file.name());

        if file.is_dir() {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
