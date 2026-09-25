# Changelog

All notable changes to NRB Launcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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

## [0.3.0] - 2026-09-25

### Added
- **Single-screen home UI**: Hub-style glassmorphism layout with `TopBar`, dismissible `Banner`, search + 2 program sections, and a side `LoginPanel`.
- **Program catalog** (`src/lib/programs.ts`): 2 legacy + 3 member programs with status dots (gray / green / red) and a locked overlay for `requiresLogin` items.
- **Tauri command bridge** (`src/lib/tauri.ts`, `src-tauri/src/launcher.rs`): typed wrappers around `get_programs_dir`, `check_program_installed`, `read_license_status`, `download_program` (with `download_progress` events), `extract_zip`, `launch_program`.
- **Announcement banner** (`src/lib/announcements.ts`): fetches `https://hub.nutnrb.com/api/v1/announcements?active=true`, gracefully degrades to `[]` offline.
- **Hub iframe login** (`src/components/LoginPanel.tsx`): embeds `hub.nutnrb.com/login?embed=1` with `postMessage('hub-login')` bridge.
- **Auth state helper** (`src/lib/auth.ts`): localStorage-backed `AuthUser`, `onHubMessage()` listener, `saveAuth/loadAuth/clearAuth`.
- **Light/dark theme** (`src/hooks/useTheme.ts`, `src/index.css`): Hub palette (Electric Blue `#00b4ff`, Kanit font, glass surfaces, dark variant).
- **Dev override button**: "Simulate login (dev)" pill in the corner so local iteration works without a wired hub postMessage.
- **`@tanstack/react-query`, `lucide-react`, `sonner`** added to `package.json`.
- **`dev-build.yml` workflow**: every push to `main`, `dev`, `feat/**` builds the Windows NSIS + MSI and uploads them as workflow artifacts (no release, no tag).
- **`release.yml` updated**: `branches-ignore: [main, "feat/**"]` on the push trigger so `dev-build.yml` doesn't double-fire the release pipeline.

### Hub-side dependencies
- Hub login page must `window.parent.postMessage({ type: 'hub-login', user: { name, email } }, '*')` on successful sign-in when `?embed=1` is present.
- `/api/v1/announcements?active=true` already exists in hub; launcher degrades to `[]` if it 404s.

### Notes
- First release that **depends on hub-side embed support** for full login flow; dev override covers local iteration in the meantime.
- `tauri-plugin-shell` and `tauri-plugin-fs` are now used; capabilities/permissions updated accordingly.

## [0.2.0] - 2026-09-25

### Breaking
- **Windows-only build.** Removed Linux and macOS from the build matrix. NRB Launcher is a Windows application and the project no longer produces `.deb`, `.AppImage`, `.dmg`, or `.app` bundles.
- Build pipeline reduced to one job (`windows-latest`) producing only the NSIS `.exe` and MSI installers.

### Changed
- CI workflow: stripped from 4 matrix entries to 1, faster release cycle.
- README installation table: now Windows-only.

### Migration
- macOS / Linux users should run the prebuilt Windows `.exe` / `.msi` in a VM, or build from source on Windows.
