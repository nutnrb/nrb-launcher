// src-tauri/src/agent/gpu.rs
// CutAI v3 — Phase 0 GPU detection cascade.
//
// Cascade (returns first success):
//   1. NVML via `nvml-wrapper` (Windows; NVIDIA driver loaded)
//   2. `nvidia-smi --query-gpu=name,memory.total --format=csv,noheader`
//      (cross-platform; works when nvidia-smi is on PATH)
//   3. CPU fallback: GpuInfo { mode: "cpu", .. }
//
// Only the shapes for Phase 0 are exposed (name + vram). Driver version
// and encoder enumeration land in Phase 1 when needed for job routing.

use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct GpuInfo {
    /// One of `"nvidia"` | `"amd"` | `"intel"` | `"cpu"`.
    pub mode: String,
    pub name: Option<String>,
    /// Total VRAM in MiB (NVIDIA reports this natively; AMD/Intel fall back to None).
    pub vram_mb: Option<u32>,
    /// Hardware encoder names reported by the driver (e.g. `["h264_nvenc", "hevc_nvenc"]`).
    /// Empty in Phase 0 — populated in Phase 1 once job routing needs it.
    pub encoders: Vec<String>,
    /// Driver version string (Phase 0 best-effort).
    pub driver: Option<String>,
}

impl GpuInfo {
    pub fn cpu() -> Self {
        Self {
            mode: "cpu".to_string(),
            name: None,
            vram_mb: None,
            encoders: vec![],
            driver: None,
        }
    }
}

/// Detect GPU hardware. Awaits for API consistency with future async
/// tiers (e.g. wgpu-based detection); the current cascade is sync
/// because NVML init blocks at the C-call and nvidia-smi is short-lived.
pub async fn detect() -> GpuInfo {
    if let Some(info) = detect_nvml() {
        return info;
    }
    if let Some(info) = detect_nvidia_smi() {
        return info;
    }
    GpuInfo::cpu()
}

/// Tier 1 — NVML direct query (Windows + driver loaded).
/// Wrapped in `cfg(feature = "cutai")` because `nvml-wrapper` is optional.
#[cfg(feature = "cutai")]
fn detect_nvml() -> Option<GpuInfo> {
    use nvml_wrapper::Nvml;
    let nvml = Nvml::init().ok()?;
    let device = nvml.device_by_index(0).ok()?;
    let name = device.name().ok().map(|s| s.to_string());
    let mem = device.memory_info().ok();
    let vram_mb = mem.map(|m| (m.total / (1024 * 1024)) as u32);
    let driver = nvml.sys_driver_version().ok().map(|s| s.to_string());
    Some(GpuInfo {
        mode: "nvidia".to_string(),
        name,
        vram_mb,
        encoders: vec![],
        driver,
    })
}

/// Stub for non-cutai builds so the symbol exists when the gpu.rs module
/// is compiled standalone (defensive — mod.rs already gates this module).
#[cfg(not(feature = "cutai"))]
fn detect_nvml() -> Option<GpuInfo> {
    None
}

/// Tier 2 — parse `nvidia-smi` CSV output. Output format with target 0:
///
///     NVIDIA GeForce RTX 3060, 12288 MiB
///
/// We split on the first comma and strip the ` MiB` suffix.
fn detect_nvidia_smi() -> Option<GpuInfo> {
    let out = Command::new("nvidia-smi")
        .args([
            "--query-gpu=name,memory.total",
            "--format=csv,noheader,nounits",
        ])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&out.stdout);
    let line = stdout.lines().next()?.trim();
    if line.is_empty() {
        return None;
    }
    let (name, vram) = match line.split_once(',') {
        Some((n, v)) => (n.trim().to_string(), v.trim().parse::<u32>().ok()),
        None => (line.to_string(), None),
    };
    Some(GpuInfo {
        mode: "nvidia".to_string(),
        name: if name.is_empty() { None } else { Some(name) },
        vram_mb: vram,
        encoders: vec![],
        driver: None,
    })
}