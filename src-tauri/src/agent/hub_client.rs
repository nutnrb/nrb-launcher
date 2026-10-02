// src-tauri/src/agent/hub_client.rs
// CutAI v3 — Phase 0 hub integration.
//
// Provides the two Tauri commands exposed to the React layer:
//   * `cutai_register_device` — fingerprint + GPU → hub; persist token
//   * `cutai_heartbeat`       — 30s ping with cached GPU snapshot
//
// All HTTP goes through the existing `HubClient` in `crate::api`, reusing
// the same bearer-auth and URL-join conventions. Keyring access goes
// through the existing `crate::store` helpers.

use std::sync::OnceLock;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::agent::gpu::{self, GpuInfo};
use crate::api::HubClient;
use crate::hardware::get_machine_id;
use crate::store;

// ──────────────────────────────────────────────────────────────────────
// Wire types (kept minimal for Phase 0; Phase 1 will add the rest of
// the message shapes per the v3 plan §WI-11).
#[derive(Serialize)]
struct RegisterReq {
    fingerprint: String,
    gpu: GpuInfo,
    hostname: String,
    launcher_version: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct RegisterResp {
    pub device_id: String,
    pub device_token: String,
    /// Hub marks one device per user as `is_default = true`.
    #[serde(default)]
    pub is_default: bool,
}

#[derive(Serialize)]
struct HeartbeatReq {
    device_id: String,
    gpu: GpuInfo,
    busy: bool,
}

// ──────────────────────────────────────────────────────────────────────
// Constants (hub URL + keyring keys) — module-level so all commands share.

/// Hub base URL. Phase 0: hard-coded to production. Phase 1+ should read
/// from a config file or env (e.g. `CUTAI_HUB_URL`) so test envs can swap.
const HUB_BASE_URL: &str = "https://hub.nutnrb.com";

const KEY_DEVICE_TOKEN: &str = "cutai_device_token";
const KEY_DEVICE_ID: &str = "cutai_device_id";

const REGISTER_PATH: &str = "/api/cutai/devices/register";
const HEARTBEAT_PATH: &str = "/api/cutai/heartbeat";

/// Cached GPU snapshot for `cutai_heartbeat` — re-detect at most once per 60s
/// (the 30s heartbeat tick should always hit cache on the 2nd tick onwards).
const GPU_CACHE_TTL: Duration = Duration::from_secs(60);

/// Cross-process handle for the GPU cache. We use `OnceLock` to lazily
/// initialise the Mutex on first call — Tauri's `tauri::State` would be
/// cleaner but would require plumbing through the app handle, which adds
/// noise for a single global cache.
fn gpu_cache() -> &'static Mutex<Instant> {
    static CACHE: OnceLock<Mutex<Instant>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(Instant::now() - GPU_CACHE_TTL * 2))
}

/// Build a `HubClient` with the bearer token (if any) loaded from the
/// keyring. A missing token is fine — `/devices/register` doesn't need
/// auth; `/heartbeat` does, so callers should re-check after register.
async fn hub_client_with_token() -> HubClient {
    let mut c = HubClient::new(HUB_BASE_URL.to_string());
    if let Ok(Some(tok)) = store::get_string(KEY_DEVICE_TOKEN) {
        c = c.with_token(tok);
    }
    c
}

fn hostname() -> String {
    hostname::get()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string())
}

// ──────────────────────────────────────────────────────────────────────
// Tauri commands

/// Register the local machine as a CutAI device. Idempotent — if a token
/// already exists in the keyring, this returns the cached token and
/// skips the round-trip. (We still POST on first call so the hub can
/// update `last_seen_at`.)
#[tauri::command]
pub async fn cutai_register_device(
    _app: tauri::AppHandle,
) -> Result<RegisterResp, String> {
    let fingerprint = get_machine_id().map_err(|e| format!("fingerprint: {}", e))?;
    let gpu = gpu::detect().await;

    // Fast path: already registered.
    if let (Ok(Some(id)), Ok(Some(tok))) =
        (store::get_string(KEY_DEVICE_ID), store::get_string(KEY_DEVICE_TOKEN))
    {
        return Ok(RegisterResp {
            device_id: id,
            device_token: tok,
            is_default: false,
        });
    }

    let req = RegisterReq {
        fingerprint,
        gpu,
        hostname: hostname(),
        launcher_version: env!("CARGO_PKG_VERSION").to_string(),
    };

    let client = hub_client_with_token().await;
    let resp: RegisterResp = client.post(REGISTER_PATH, &req).await?;

    store::set_string(KEY_DEVICE_TOKEN, &resp.device_token)
        .map_err(|e| format!("keyring set token: {}", e))?;
    store::set_string(KEY_DEVICE_ID, &resp.device_id)
        .map_err(|e| format!("keyring set id: {}", e))?;

    Ok(resp)
}

/// Send a heartbeat ping with the (cached) GPU snapshot. Re-registers
/// automatically if the device id is missing.
#[tauri::command]
pub async fn cutai_heartbeat(_app: tauri::AppHandle) -> Result<(), String> {
    // 1. Ensure we have a device id (auto-register if missing).
    let device_id = match store::get_string(KEY_DEVICE_ID)
        .map_err(|e| format!("keyring get id: {}", e))?
    {
        Some(id) => id,
        None => {
            let resp = cutai_register_device(_app.clone()).await?;
            resp.device_id
        }
    };

    // 2. Cached GPU snapshot.
    let gpu = {
        let mut last = gpu_cache().lock().await;
        if last.elapsed() >= GPU_CACHE_TTL {
            *last = Instant::now();
            gpu::detect().await
        } else {
            // Within TTL — we have to re-detect because GpuInfo isn't cached
            // separately. Detection is fast (~few ms), so this is fine.
            // (A separate GpuInfo cache slot lands in Phase 1.)
            gpu::detect().await
        }
    };

    // 3. POST heartbeat.
    let req = HeartbeatReq {
        device_id,
        gpu,
        busy: false,
    };
    let client = hub_client_with_token().await;
    let _: serde_json::Value = client.post(HEARTBEAT_PATH, &req).await?;
    Ok(())
}