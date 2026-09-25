// src-tauri/src/lib.rs
pub mod api;
pub mod auth;
pub mod download;
pub mod hardware;
pub mod launcher;
pub mod store;
pub mod update;

use update::UpdateStateHandle;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let current_version = env!("CARGO_PKG_VERSION").to_string();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(UpdateStateHandle::new(current_version))
        .invoke_handler(tauri::generate_handler![
            auth::login,
            auth::logout,
            auth::get_cached_auth,
            download::download_and_install,
            download::rollback,
            hardware::get_machine_id,
            update::check_for_update,
            update::download_and_install_update,
            update::get_update_state,
            update::get_launcher_version,
            // v0.3.0 — launcher surface
            launcher::get_programs_dir,
            launcher::check_program_installed,
            launcher::read_license_status,
            launcher::download_program,
            launcher::extract_zip,
            launcher::launch_program,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
