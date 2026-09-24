// src-tauri/src/hardware.rs
// Hardware fingerprint for license validation
use sha2::{Digest, Sha256};

#[cfg(target_os = "windows")]
fn get_machine_guid() -> Result<String, String> {
    use winreg::enums::*;
    use winreg::RegKey;
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm
        .open_subkey("SOFTWARE\\Microsoft\\Cryptography")
        .map_err(|e| e.to_string())?;
    key.get_value("MachineGuid").map_err(|e| e.to_string())
}

#[cfg(target_os = "linux")]
fn get_machine_guid() -> Result<String, String> {
    std::fs::read_to_string("/var/lib/dbus/machine-id")
        .or_else(|_| std::fs::read_to_string("/etc/machine-id"))
        .map(|s| s.trim().to_string())
        .map_err(|e| e.to_string())
}

#[cfg(target_os = "macos")]
fn get_machine_guid() -> Result<String, String> {
    use std::process::Command;
    let out = Command::new("ioreg")
        .args(&["-rd1", "-c", "IOPlatformExpertDevice"])
        .output()
        .map_err(|e| e.to_string())?;
    let s = String::from_utf8_lossy(&out.stdout);
    for line in s.lines() {
        if line.contains("IOPlatformUUID") {
            if let Some(v) = line.split('"').nth(3) {
                return Ok(v.to_string());
            }
        }
    }
    Err("UUID not found".to_string())
}

#[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
fn get_machine_guid() -> Result<String, String> {
    Err("Unsupported platform".to_string())
}

#[tauri::command]
pub fn get_machine_id() -> Result<String, String> {
    let mut hasher = Sha256::new();
    if let Ok(guid) = get_machine_guid() {
        hasher.update(guid.as_bytes());
    }
    // Include hostname for additional entropy
    if let Ok(hostname) = hostname::get() {
        hasher.update(hostname.to_string_lossy().as_bytes());
    }
    Ok(format!("{:x}", hasher.finalize()))
}
