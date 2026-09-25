// Typed wrappers around Tauri invoke() + listen()
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// ──────────────────────────────────────────────────────────────────────
// Read-only
// ──────────────────────────────────────────────────────────────────────

/** Resolves to the per-user programs directory (created if missing). */
export async function getProgramsDir(): Promise<string> {
  return await invoke<string>("get_programs_dir");
}

/** True if a program with `slug` has been extracted under the programs dir. */
export async function checkProgramInstalled(slug: string): Promise<boolean> {
  return await invoke<boolean>("check_program_installed", { slug });
}

/**
 * Returns the license state for `slug`. Backend reads `license.json` next to
 * the program; absent file → "unlicensed".
 */
export type LicenseStatus = "licensed" | "unlicensed" | "expired" | "unknown";
export interface LicenseInfo {
  status: LicenseStatus;
  expiresAt?: string | null;
  holder?: string | null;
}

export async function readLicenseStatus(slug: string): Promise<LicenseInfo> {
  return await invoke<LicenseInfo>("read_license_status", { slug });
}

// ──────────────────────────────────────────────────────────────────────
// Mutating
// ──────────────────────────────────────────────────────────────────────

export interface DownloadResult {
  slug: string;
  version: string;
  installPath: string;
  sha256: string;
}

/**
 * Downloads + verifies + extracts a program ZIP.
 * Emits `download_progress` events while running.
 */
export async function downloadProgram(args: {
  slug: string;
  version: string;
  sha256: string;
  downloadUrl: string;
}): Promise<DownloadResult> {
  return await invoke<DownloadResult>("download_program", { args });
}

/** Extract a ZIP already on disk. Used by the dev override / repair path. */
export async function extractZip(zipPath: string, destDir: string): Promise<void> {
  await invoke("extract_zip", { zipPath, destDir });
}

/** Launch an installed program by path. */
export async function launchProgram(exePath: string): Promise<void> {
  await invoke("launch_program", { exePath });
}

// ──────────────────────────────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────────────────────────────

export interface DownloadProgress {
  slug: string;
  version: string;
  downloaded: number;
  total: number;
  percent: number;
  stage: "downloading" | "verifying" | "extracting" | "done" | "error";
  message?: string;
}

export function onDownloadProgress(
  cb: (p: DownloadProgress) => void,
): Promise<UnlistenFn> {
  return listen<DownloadProgress>("download_progress", (e) => cb(e.payload));
}
