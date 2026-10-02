// src-tauri/src/agent/mod.rs
// CutAI v3 — Phase 0 agent scaffolding.
// All submodules are feature-gated behind `cutai` so the default build
// (without --features cutai) does not pay the nvml-wrapper compile cost.

#[cfg(feature = "cutai")]
pub mod gpu;

#[cfg(feature = "cutai")]
pub mod hub_client;