use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Runtime};
use tauri_plugin_updater::UpdaterExt;

/// Cached update metadata (so the frontend can poll status).
#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct UpdateState {
    pub current_version: String,
    pub available_version: Option<String>,
    pub notes: Option<String>,
    pub checking: bool,
    pub downloading: bool,
    pub install_ready: bool,
    pub last_error: Option<String>,
}

pub struct UpdateStateHandle(pub Mutex<UpdateState>);

impl UpdateStateHandle {
    pub fn new(current: String) -> Self {
        Self(Mutex::new(UpdateState {
            current_version: current,
            ..Default::default()
        }))
    }
}

/// Check GitHub Releases for a newer version of the Launcher.
/// Emits `update_available` event with the latest version + notes.
/// Emits `update_error` if the check fails.
#[tauri::command]
pub async fn check_for_update<R: Runtime>(
    app: AppHandle<R>,
    state: tauri::State<'_, UpdateStateHandle>,
) -> Result<UpdateState, String> {
    {
        let mut s = state.0.lock().map_err(|e| e.to_string())?;
        s.checking = true;
        s.last_error = None;
    }

    let updater = app.updater().map_err(|e| format!("updater init failed: {e}"))?;
    let update_result = updater.check().await;

    let current = env!("CARGO_PKG_VERSION").to_string();

    match update_result {
        Ok(Some(update)) => {
            let new_ver = update.version.clone();
            let notes = update.body.clone();

            {
                let mut s = state.0.lock().map_err(|e| e.to_string())?;
                s.checking = false;
                s.available_version = Some(new_ver.clone());
                s.notes = notes.clone();
            }

            let _ = app.emit(
                "update_available",
                serde_json::json!({
                    "version": new_ver,
                    "notes": notes,
                }),
            );

            Ok(UpdateState {
                current_version: current,
                available_version: Some(new_ver),
                notes,
                checking: false,
                downloading: false,
                install_ready: false,
                last_error: None,
            })
        }
        Ok(None) => {
            let mut s = state.0.lock().map_err(|e| e.to_string())?;
            s.checking = false;
            Ok(UpdateState {
                current_version: current,
                available_version: None,
                notes: None,
                checking: false,
                downloading: false,
                install_ready: false,
                last_error: None,
            })
        }
        Err(e) => {
            let err_msg = format!("Update check failed: {e}");
            let mut s = state.0.lock().map_err(|e2| e2.to_string())?;
            s.checking = false;
            s.last_error = Some(err_msg.clone());

            let _ = app.emit("update_error", &err_msg);

            Err(err_msg)
        }
    }
}

/// Download and install the latest update.
/// Emits `update_download_progress` events with `{downloaded, total, percent}`.
/// Emits `update_installed` once finished; then exits the app for update to apply.
#[tauri::command]
pub async fn download_and_install_update<R: Runtime>(
    app: AppHandle<R>,
    state: tauri::State<'_, UpdateStateHandle>,
) -> Result<String, String> {
    {
        let mut s = state.0.lock().map_err(|e| e.to_string())?;
        s.downloading = true;
        s.last_error = None;
    }

    let updater = app.updater().map_err(|e| format!("updater init failed: {e}"))?;
    let update = match updater.check().await {
        Ok(Some(u)) => u,
        Ok(None) => return Err("No update available".to_string()),
        Err(e) => return Err(format!("Update check failed: {e}")),
    };

    let new_version = update.version.clone();
    let app_clone = app.clone();

    let install_result = update
        .download_and_install(
            move |chunk_size, total| {
                let percent = total
                    .filter(|t| *t > 0)
                    .map(|t| (chunk_size as f64 / t as f64) * 100.0)
                    .unwrap_or(0.0);
                let _ = app_clone.emit(
                    "update_download_progress",
                    serde_json::json!({
                        "downloaded": chunk_size,
                        "total": total.unwrap_or(0u64),
                        "percent": percent,
                    }),
                );
            },
            move || {
                // Download finished, install starting
            },
        )
        .await;

    match install_result {
        Ok(()) => {
            {
                let mut s = state.0.lock().map_err(|e| e.to_string())?;
                s.downloading = false;
                s.install_ready = true;
            }
            let _ = app.emit(
                "update_installed",
                serde_json::json!({ "version": new_version }),
            );

            // Return Ok first, then restart (so the response reaches frontend).
            // Note: restart() exits the app, so any code after won't run on most platforms.
            app.restart();
        }
        Err(e) => {
            let err_msg = format!("Install failed: {e}");
            {
                let mut s = state.0.lock().map_err(|e2| e2.to_string())?;
                s.downloading = false;
                s.last_error = Some(err_msg.clone());
            }
            let _ = app.emit("update_error", &err_msg);
            Err(err_msg)
        }
    }
}

/// Read cached update state.
#[tauri::command]
pub fn get_update_state(state: tauri::State<'_, UpdateStateHandle>) -> Result<UpdateState, String> {
    state.0.lock().map(|s| s.clone()).map_err(|e| e.to_string())
}

/// Read the current launcher version.
#[tauri::command]
pub fn get_launcher_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
