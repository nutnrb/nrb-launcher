# Changelog

All notable changes to NRB Launcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.5.0-preview-cutai-phase0] - 2026-10-02

### CutAI v3 — Phase 0 "Hello GPU". Verification only — no jobs yet.

- New `cutai` Cargo feature flag (off by default). Enable with
  `cargo check --features cutai` or `pnpm tauri build --features cutai`.
  Default build is identical to v0.4.x.
- `src-tauri/src/api.rs`: new `HubClient::post<TReq, TRes>` mirroring the
  existing `get()` — same bearer-auth helper, same error mapping.
  Subagents: Phase 1 will add CutAI POST shapes to this same method.
- `src-tauri/src/agent/` (new module, feature-gated)
    - `gpu.rs`: GPU detection cascade — NVML via `nvml-wrapper` →
      `nvidia-smi --query-gpu=name,memory.total` → CPU fallback. Exposes
      a serializable `GpuInfo` struct.
    - `hub_client.rs`: Tauri commands `cutai_register_device` and
      `cutai_heartbeat`. Reads the OS keyring via the existing
      `crate::store` helpers; persists `cutai_device_token` +
      `cutai_device_id`. Heartbeat re-detects GPU at most once per 60s.
    - `mod.rs`: feature-gated submodule declarations.
- `src-tauri/src/lib.rs`: registers the new commands via a second
  `tauri::generate_handler!` invocation guarded by `#[cfg(feature =
  "cutai")]`. The macro doesn't expand `#[cfg(...)]` inside its body, so
  the CutAI handlers live in their own invocation.
- `src-tauri/Cargo.toml`: add `nvml-wrapper = "0.13"` (optional, behind
  `cutai` feature); add `process` + `io-util` to tokio features (for
  Phase 1's `tokio::process::Command`).
- `src/hooks/useCutaiHeartbeat.ts` (new): polls `cutai_heartbeat`
  every 30s while the user is logged in.
- `src/components/CutaiStatusBadge.tsx` (new): 🟢/⚪ dot + "CutAI"
  label rendered in the titlebar. Read-only indicator.
- `src/components/TitleBar.tsx`: new optional `loggedIn` prop renders
  the badge. (Spec said "TopBar"; App.tsx actually mounts `TitleBar`,
  so the badge lands there.)
- `src/App.tsx`: passes `loggedIn={user !== null}` to TitleBar.

### Changed
- Version bumped 0.4.2 → 0.5.0 in `package.json`, `src-tauri/Cargo.toml`,
  `src-tauri/tauri.conf.json`, and the hardcoded `LAUNCHER_VERSION` in
  `src/App.tsx` (which was previously stale at 0.4.1).

### Acceptance
- `cargo check` succeeds (default features).
- `cargo check --features cutai` succeeds.
- `pnpm tsc --noEmit` succeeds.

## [0.4.1] - 2026-09-25

### Auto Pre-release + In-app Update

- Every push to `main` now automatically publishes a GitHub **Pre-release** (`preview-<sha>`) with the Windows installer attached.
- A rolling `preview-latest` tag is repointed to the newest preview so the in-app updater can always fetch the latest manifest via a fixed URL.
- App checks for updates on launch and shows a one-click update banner with download progress. _Requires `TAURI_SIGNING_PRIVATE_KEY` + `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repo secrets to be set manually._
- Stable releases still happen via `v*` tags (handled by `release.yml`).

### Technical
- New: `.github/workflows/preview.yml` (replaces `dev-build.yml` for the pre-release channel).
- Removed: `.github/workflows/dev-build.yml` (functionality now covered by `preview.yml`).
- `src-tauri/tauri.conf.json`: `plugins.updater.endpoints` now includes `releases/download/preview-latest/latest.json` as the first endpoint.
- New: `src/components/UpdateBanner.tsx` — uses `@tauri-apps/plugin-updater`'s `check()` + `Update.downloadAndInstall()` for one-click updates.
- `src/App.tsx`: renders `<UpdateBanner />` above `<Banner />`; `LAUNCHER_VERSION` bumped to 0.4.1.
- Versions bumped in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` to 0.4.1.

### Workflow
- Preview (push to main): always publishes a pre-release installer + repoints `preview-latest`.
- Stable (tag v*): handled by `release.yml` (unchanged).

## [0.4.0] - 2026-09-25

### Modern Frameless UI (Game Launcher Style)

- Frameless window with transparent backdrop (no OS titlebar) — desktop shows through the rounded corners.
- Custom titlebar with logo + version pill + Online status dot + theme toggle + Minimize + Close (no Maximize, game-launcher style).
- 16px rounded window corners; full-window glass blur (40px blur + 180% saturate).
- All UI elements rounded (cards, buttons, inputs, tags, panels).
- Seamless iframe integration: injects CSS into hub iframe on load to strip its nav/sidebar/footer so the embedded login looks like part of the app.
- Hover lift effect on program cards (translateY -2px + primary glow shadow).
- Pulse glow animation for online status dot.
- Window resizing via OS edges only (no maximize button); titlebar is the drag region.

### Technical
- `tauri.conf.json`: `decorations: false`, `transparent: true`, `maximizable: false`, `shadow: true`, new size 1100x720.
- New `TitleBar` component using `getCurrentWindow()` from `@tauri-apps/api/window` (no extra plugin needed).
- Drag-region pattern: header is `app-region: drag`, buttons/inputs override with `app-region: no-drag`.
- Version bumped in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` to 0.4.0.
- `App.tsx` rewritten to use `app-shell` layout (vertical flex with scrollable inner region).
- Old `TopBar.tsx` retained but no longer imported (kept for rollback safety).

## [0.3.1] - 2026-09-25

### Changed
- **UI/layout restructure: single scrollable page with login at the bottom.** Removed the 2-column grid (left program list + sticky right LoginPanel). The home page now flows top-to-bottom: TopBar -> Banner -> ProgramList (Legacy + Member, full width) -> LoginPanel (full width, at the bottom) -> footer. The whole page is a single scroll container.
- `.app` switched from `height: 100vh; overflow: hidden` to `min-height: 100vh; overflow: visible` so the page scrolls naturally.
- Added a small footer line (NRB Launcher v0.3.1 · {year}).
- Dev-override "Simulate login" pill remains pinned to the bottom-right corner.

### Notes
- All existing functionality preserved: QueryClientProvider, sonner toasts, hub iframe postMessage bridge, light/dark theme, and dev override.
- LoginPanel and ProgramList APIs unchanged.
- Bumped package.json, src-tauri/tauri.conf.json, and src-tauri/Cargo.toml to 0.3.1.
