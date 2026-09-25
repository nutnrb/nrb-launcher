// src-tauri/src/launcher.rs
// v0.3.0 — new Tauri commands used by the single-screen UI:
//   get_programs_dir, check_program_installed, read_license_status,
//   download_program (with progress events), extract_zip, launch_program.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub slug: String,
    pub version: String,
    pub downloaded: u64,
    pub total: u64,
    pub percent: u8,
    pub stage: String, // "downloading" | "verifying" | "extracting" | "done" | "error"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LicenseInfo {
    pub status: String, // "licensed" | "unlicensed" | "expired" | "unknown"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub holder: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadResult {
    pub slug: String,
    pub version: String,
    pub install_path: String,
    pub sha256: String,
}

#[derive(Debug, Deserialize)]
pub struct DownloadArgs {
    pub slug: String,
    pub version: String,
    #[serde(default)]
    pub sha256: String,
    pub download_url: String,
}

fn programs_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .ok_or_else(|| "Cannot determine local data directory".to_string())?;
    let dir = base.join("NRB Launcher").join("programs");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn emit_progress(
    app: &AppHandle,
    slug: &str,
    version: &str,
    downloaded: u64,
    total: u64,
    stage: &str,
) {
    let percent = if total > 0 {
        ((downloaded as f64 / total as f64) * 100.0).min(100.0) as u8
    } else {
        0
    };
    let _ = app.emit(
        "download_progress",
        DownloadProgress {
            slug: slug.to_string(),
            version: version.to_string(),
            downloaded,
            total,
            percent,
            stage: stage.to_string(),
            message: None,
        },
    );
}

#[tauri::command]
pub fn get_programs_dir() -> Result<String, String> {
    Ok(programs_dir()?.to_string_lossy().to_string())
}

#[tauri::command]
pub fn check_program_installed(slug: String) -> Result<bool, String> {
    let p = programs_dir()?.join(&slug);
    // Installed = directory exists and contains at least one file.
    if !p.exists() {
        return Ok(false);
    }
    Ok(fs::read_dir(&p)
        .map_err(|e| e.to_string())?
        .next()
        .is_some())
}

#[tauri::command]
pub fn read_license_status(slug: String) -> Result<LicenseInfo, String> {
    let lic_path = programs_dir()?.join(&slug).join("license.json");
    if !lic_path.exists() {
        return Ok(LicenseInfo {
            status: "unlicensed".into(),
            expires_at: None,
            holder: None,
        });
    }
    let raw = fs::read_to_string(&lic_path).map_err(|e| e.to_string())?;
    // The license file is expected to be a JSON object; if parsing fails, fall
    // back to "unlicensed" rather than crashing.
    let v: serde_json::Value = match serde_json::from_str(&raw) {
        Ok(v) => v,
        Err(_) => {
            return Ok(LicenseInfo {
                status: "unknown".into(),
                expires_at: None,
                holder: None,
            })
        }
    };
    let status = v
        .get("status")
        .and_then(|s| s.as_str())
        .unwrap_or("unknown")
        .to_string();
    let expires_at = v
        .get("expiresAt")
        .and_then(|s| s.as_str())
        .map(|s| s.to_string());
    let holder = v
        .get("holder")
        .and_then(|s| s.as_str())
        .map(|s| s.to_string());
    Ok(LicenseInfo {
        status,
        expires_at,
        holder,
    })
}

#[tauri::command]
pub async fn download_program(
    app: AppHandle,
    args: DownloadArgs,
) -> Result<DownloadResult, String> {
    let programs_dir = programs_dir()?;
    let install_path = programs_dir.join(&args.slug);
    fs::create_dir_all(&install_path).map_err(|e| e.to_string())?;

    let download_dir = programs_dir.join(".cache");
    fs::create_dir_all(&download_dir).map_err(|e| e.to_string())?;
    let zip_path = download_dir.join(format!("{}-{}.zip", args.slug, args.version));

    // 1. Download with progress events.
    emit_progress(&app, &args.slug, &args.version, 0, 0, "downloading");

    let client = reqwest::Client::new();
    let res = client
        .get(&args.download_url)
        .send()
        .await
        .map_err(|e| format!("Download failed: {}", e))?;
    if !res.status().is_success() {
        return Err(format!("HTTP {}", res.status()));
    }
    let total = res.content_length().unwrap_or(0);

    let mut file = File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        emit_progress(
            &app,
            &args.slug,
            &args.version,
            downloaded,
            total,
            "downloading",
        );
    }
    drop(file);

    // 2. Verify sha256 (if provided).
    if !args.sha256.is_empty() {
        emit_progress(&app, &args.slug, &args.version, downloaded, total, "verifying");
        let mut hasher = Sha256::new();
        let mut f = File::open(&zip_path).map_err(|e| e.to_string())?;
        let mut buf = [0u8; 64 * 1024];
        loop {
            let n = f.read(&mut buf).map_err(|e| e.to_string())?;
            if n == 0 {
                break;
            }
            hasher.update(&buf[..n]);
        }
        let digest = format!("{:x}", hasher.finalize());
        if !digest.eq_ignore_ascii_case(&args.sha256) {
            return Err(format!(
                "Checksum mismatch (expected {}, got {})",
                args.sha256, digest
            ));
        }
    }

    // 3. Extract zip into install dir.
    emit_progress(&app, &args.slug, &args.version, downloaded, total, "extracting");
    extract_zip_impl(&zip_path, &install_path)?;

    // 4. Done.
    emit_progress(&app, &args.slug, &args.version, total, total, "done");

    Ok(DownloadResult {
        slug: args.slug.clone(),
        version: args.version.clone(),
        install_path: install_path.to_string_lossy().to_string(),
        sha256: args.sha256.clone(),
    })
}

fn extract_zip_impl(zip_path: &Path, dest_dir: &Path) -> Result<(), String> {
    let f = File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(f).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = match entry.enclosed_name() {
            Some(p) => dest_dir.join(p),
            None => continue,
        };
        if entry.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut out = File::create(&out_path).map_err(|e| e.to_string())?;
            io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn extract_zip(zip_path: String, dest_dir: String) -> Result<(), String> {
    let zip_path = PathBuf::from(zip_path);
    let dest_dir = PathBuf::from(dest_dir);
    fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    extract_zip_impl(&zip_path, &dest_dir)
}

#[tauri::command]
pub fn launch_program(exe_path: String) -> Result<(), String> {
    // Use the shell plugin via std::process so we don't need to plumb the
    // AppHandle through; shell-allow-execute is granted in capabilities.
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &exe_path])
            .spawn()
            .map_err(|e| format!("Launch failed: {}", e))?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new(&exe_path)
            .spawn()
            .map_err(|e| format!("Launch failed: {}", e))?;
    }
    Ok(())
}
