# Changelog

All notable changes to NRB Launcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
