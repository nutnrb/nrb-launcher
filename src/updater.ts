// src/updater.ts
// Frontend bridge for the Tauri auto-updater.
//
// The Rust side (src-tauri/src/update.rs) already exposes:
//   - check_for_update()
//   - download_and_install_update()
//   - get_update_state() / get_launcher_version()
//
// We call those via `invoke()` so we get the same UpdateState shape that the
// backend emits to the `update_available` / `update_download_progress` /
// `update_installed` / `update_error` events.

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface UpdateState {
  current_version: string;
  available_version: string | null;
  notes: string | null;
  checking: boolean;
  downloading: boolean;
  install_ready: boolean;
  last_error: string | null;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
  percent: number;
}

/**
 * Ask the backend to check GitHub Releases for a newer version.
 * Returns the latest UpdateState. Errors are returned as a string.
 */
export async function checkForUpdate(): Promise<UpdateState> {
  return invoke<UpdateState>("check_for_update");
}

/**
 * Read the cached update state without performing a network call.
 */
export async function getUpdateState(): Promise<UpdateState> {
  return invoke<UpdateState>("get_update_state");
}

/**
 * Trigger download + install of the latest update.
 * The Rust handler emits `update_download_progress` events and calls
 * `app.restart()` once install completes — no need to relaunch from JS.
 */
export async function downloadAndInstallUpdate(): Promise<string> {
  return invoke<string>("download_and_install_update");
}

/**
 * Listen for download progress events. Returns an unlisten function.
 */
export async function onUpdateProgress(
  cb: (p: UpdateProgress) => void
): Promise<UnlistenFn> {
  return listen<UpdateProgress>("update_download_progress", (e) => cb(e.payload));
}

/**
 * Listen for the "update installed" event (fires just before the app restarts).
 */
export async function onUpdateInstalled(
  cb: (version: string) => void
): Promise<UnlistenFn> {
  return listen<{ version: string }>("update_installed", (e) => cb(e.payload.version));
}

/**
 * Listen for update errors emitted by the backend.
 */
export async function onUpdateError(
  cb: (msg: string) => void
): Promise<UnlistenFn> {
  return listen<string>("update_error", (e) => cb(e.payload));
}
