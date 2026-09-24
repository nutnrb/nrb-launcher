# NRB Launcher

Modern desktop launcher for NRB — manage and run your NRB programs from a single, lightweight app.

[![Release](https://img.shields.io/github/v/release/nutnrb/nrb-launcher)](https://github.com/nutnrb/nrb-launcher/releases/latest)
[![Build Status](https://github.com/nutnrb/nrb-launcher/actions/workflows/release.yml/badge.svg)](https://github.com/nutnrb/nrb-launcher/actions)
[![License](https://img.shields.io/github/license/nutnrb/nrb-launcher)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-blueviolet)](https://tauri.app/)

Built with [Tauri 2](https://v2.tauri.app/) (Rust + WebView) and React + Vite — small binaries, instant UI updates, native OS integration.

---

## Screenshots

> _Screenshots will be added here once the UI stabilizes. If you'd like to contribute, drop a PNG in `docs/screenshots/` and open a PR._

---

## Features

- **Cross-platform desktop** — Windows, Linux, and macOS (Intel + Apple Silicon) from a single codebase
- **Lightweight** — ~10 MB installer; uses the OS's WebView instead of bundling a browser
- **One-click program install** — downloads NRB programs as ZIPs, verifies SHA-256, extracts, and runs
- **Safe upgrades with rollback** — every install is backed up so you can revert in one click
- **Auto-update** — the launcher checks GitHub Releases and updates itself in the background
- **Secure auth** — JWTs stored in the OS keychain (Windows Credential Manager / Linux Secret Service / macOS Keychain)
- **Hardware fingerprinting** — stable machine ID derived from MAC + CPU + disk serial, hashed client-side
- **Tray icon** — keep the launcher in the system tray for quick access
- **Subscription & wallet** — view credit balance and active subscription directly in the app
- **Offline-friendly** — once installed, programs run locally; only updates and Hub calls hit the network

---

## Installation

Download the latest release from the [Releases page](https://github.com/nutnrb/nrb-launcher/releases).

| Platform | File | Instructions |
|---|---|---|
| Windows | `NRB.Launcher_0.1.0_x64-setup.exe` | Run the installer |
| Linux (Debian / Ubuntu) | `NRB.Launcher_0.1.0_amd64.deb` | `sudo dpkg -i NRB.Launcher_0.1.0_amd64.deb` |
| Linux (other distros) | `NRB.Launcher_0.1.0_amd64.AppImage` | `chmod +x NRB.Launcher_0.1.0_amd64.AppImage && ./NRB.Launcher_0.1.0_amd64.AppImage` |
| macOS (Apple Silicon) | `NRB.Launcher_0.1.0_aarch64.dmg` | Open DMG, drag to Applications |
| macOS (Intel) | `NRB.Launcher_0.1.0_x64.dmg` | Open DMG, drag to Applications |
| macOS (alternative, `.app.tar.gz`) | `NRB.Launcher_aarch64.app.tar.gz` / `NRB.Launcher_x64.app.tar.gz` | Extract and drag the `.app` to Applications |

> **Note:** Binaries in v0.1.0 are **not code-signed**. First launch may show a Windows SmartScreen warning (click **More info → Run anyway**) or require **right-click → Open** on macOS. Signing is planned for a future release.

---

## Verify your download (SHA-256)

Every published artifact has its SHA-256 checksum recorded in [`SHA256SUMS.txt`](SHA256SUMS.txt) for v0.1.0. Verify before installing:

```bash
# Linux / macOS
sha256sum -c SHA256SUMS.txt --ignore-missing
```

```powershell
# Windows (PowerShell 5+)
Get-FileHash .\<artifact-name> -Algorithm SHA256
```

Compare the output against the line in `SHA256SUMS.txt` for the file you downloaded.

---

## Development

### Prerequisites

- **Node.js** ≥ 20 (we test on 22.x)
- **pnpm** ≥ 8 — `npm install -g pnpm`
- **Rust** stable — install via [rustup](https://rustup.rs)
- Platform-specific dependencies:
  - **Windows:** WebView2 (preinstalled on Windows 11; Windows 10 needs the [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)) and the **MSVC C++ build tools** (Visual Studio Build Tools or a recent Visual Studio with the C++ workload)
  - **Linux (Debian / Ubuntu):** `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`, `libxdo-dev`, `build-essential`, `pkg-config`, `curl`
  - **macOS:** Xcode Command Line Tools — `xcode-select --install`

### Setup

```bash
git clone https://github.com/nutnrb/nrb-launcher.git
cd nrb-launcher
pnpm install
```

### Run in development mode (hot reload)

```bash
pnpm tauri dev
```

This launches the Vite dev server on `http://localhost:1420` and opens the Tauri window. Frontend edits hot-reload; Rust changes trigger an automatic rebuild.

### Build for your current platform

```bash
pnpm tauri build
```

Artifacts land in `src-tauri/target/release/bundle/` (`.exe`/`.msi` on Windows, `.deb` + `.AppImage` on Linux, `.dmg` + `.app` on macOS).

### Build for all platforms

Push a `v*` tag — GitHub Actions builds Windows, Ubuntu, and both macOS variants automatically and uploads them to a GitHub Release:

```bash
git tag v0.2.0
git push origin v0.2.0
```

See `.github/workflows/release.yml` for the full matrix.

### Local development tips

- Point the launcher at a local Hub by setting `HUB_API_BASE` in a `.env` file:
  ```bash
  echo 'HUB_API_BASE=http://localhost:3000/api/v1' > .env
  ```
- Logs are written to `%APPDATA%\com.nutnrb.launcher\logs\` (Windows) / `~/.local/share/com.nutnrb.launcher/logs/` (Linux) / `~/Library/Logs/com.nutnrb.launcher/` (macOS) and to stdout when launched from a terminal.

---

## Project Structure

```
.
├── src/                       # React + TypeScript frontend (Vite)
│   ├── App.tsx                # Main UI (login, dashboard, programs, wallet)
│   ├── main.tsx
│   ├── api.ts                 # Thin wrapper around the Rust commands
│   └── styles.css
├── src-tauri/                 # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs            # Entry — delegates to lib::run
│   │   ├── lib.rs             # Plugin + command registration
│   │   ├── auth.rs            # Login + JWT storage (OS keyring)
│   │   ├── api.rs             # Hub HTTP client
│   │   ├── download.rs        # ZIP download + extract + SHA-256 verify
│   │   ├── hardware.rs        # Machine fingerprint (MAC + CPU + disk)
│   │   ├── store.rs           # Local state persistence
│   │   └── update.rs          # Auto-update integration
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── .tauri-keygen          # Private signing key — NEVER COMMIT
├── .github/
│   └── workflows/
│       └── release.yml        # Multi-platform build + GitHub Release
├── CHANGELOG.md
├── SHA256SUMS.txt             # v0.1.0 artifact checksums
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Configuration

By default, the launcher talks to:

- **Hub API:** `https://hub.nutnrb.com/api/v1`
- **Download CDN:** `https://downloads.nutnrb.com`
- **Update channel:** `https://github.com/nutnrb/nrb-launcher/releases/latest/download/latest.json`

To customize, edit the constants in `src-tauri/src/api.rs` and the updater block in `src-tauri/tauri.conf.json`.

---

## Security

- JWT tokens live in the OS-native secret store (via the [`keyring`](https://crates.io/crates/keyring) crate) — never written to disk in plaintext.
- Hardware fingerprints are one-way hashed with SHA-256 before leaving the machine.
- All downloads are over HTTPS and verified against published SHA-256 hashes.
- The Tauri CSP is currently permissive (`null`) for development — tighten it once production CSP rules are finalized.
- **Never commit `src-tauri/.tauri-keygen`.** It is already in `.gitignore`.

---

## Contributing

Contributions of all sizes are welcome — bug reports, feature requests, docs, and pull requests.

1. Open an [Issue](https://github.com/nutnrb/nrb-launcher/issues) for anything that might need discussion before code lands.
2. For ideas or questions, use [GitHub Discussions](https://github.com/nutnrb/nrb-launcher/discussions).
3. For pull requests:
   - Fork the repo and create a feature branch (`git checkout -b feat/your-thing`)
   - Keep changes focused; one logical change per PR
   - Run `pnpm tauri build` locally to make sure both frontend and Rust compile clean
   - Open a PR against `main` with a clear description and screenshots if UI changed

Please be kind and patient — this is an early-stage project.

---

## Release Process (maintainers)

1. Bump `version` in `package.json` and `src-tauri/tauri.conf.json` (keep them in sync).
2. Add a new entry to [`CHANGELOG.md`](CHANGELOG.md).
3. Regenerate `SHA256SUMS.txt` once the artifacts are built:
   ```bash
   sha256sum NRB.Launcher_* > SHA256SUMS.txt
   ```
4. Commit and push to `main`.
5. Tag and push the release:
   ```bash
   git tag v0.X.Y
   git push origin v0.X.Y
   ```
6. GitHub Actions (`.github/workflows/release.yml`) builds all platform binaries and publishes a GitHub Release automatically.

---

## Roadmap

- [ ] Code-signing for Windows + macOS
- [ ] Production CSP and additional webview hardening
- [ ] Auto-updater signed releases wired into CI
- [ ] Expanded Linux distribution support (RPM, Flatpak)
- [ ] In-app program marketplace

---

## License

[MIT](LICENSE) © NRB Team.

## Acknowledgments

Built with [Tauri](https://tauri.app/) — tiny, blazingly fast binaries.
Icons by the Tauri project and the NRB design team.
