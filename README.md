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

- **Windows-native desktop** — built with Tauri 2 using the OS WebView; small installer, instant UI
- **Lightweight** — ~10 MB installer; uses the OS's WebView instead of bundling a browser
- **One-click program install** — downloads NRB programs as ZIPs, verifies SHA-256, extracts, and runs
- **Safe upgrades with rollback** — every install is backed up so you can revert in one click
- **Auto-update** — the launcher checks GitHub Releases and updates itself in the background
- **Hub-style UI** — single-screen glassmorphism layout (Electric Blue + Kanit) matching `hub.nutnrb.com`
- **Embed login** — iframe of `hub.nutnrb.com/login?embed=1` with `postMessage` bridge for auth sync
- **Tray icon** — keep the launcher in the system tray for quick access
- **Offline-friendly** — once installed, programs run locally; only updates and Hub calls hit the network

---

## Development Workflow

### Quick iterate (local)

```bash
pnpm install
pnpm tauri dev          # hot-reload desktop window
```

The first `tauri dev` will compile Rust dependencies (~3–5 min). After that, Vite HMR keeps the React UI hot and Rust changes rebuild automatically.

Use the **Simulate login (dev)** pill in the bottom-right corner of the window to test the logged-in state without wiring hub postMessage.

### Test latest build (CI artifact)

Every push to `main` / `dev` / `feat/*` triggers [`.github/workflows/dev-build.yml`](.github/workflows/dev-build.yml). The latest Windows installer is uploaded as a downloadable artifact:

→ <https://github.com/nutnrb/nrb-launcher/actions> → select **"Dev Build"** → scroll to **Artifacts** → download `nrb-launcher-dev.zip`

Two artifacts are produced:

- `nrb-launcher-dev` — NSIS `.exe` installer
- `nrb-launcher-dev-msi` — MSI installer for enterprise deployment

### Production release

Push a version tag:

```bash
git tag v0.3.0
git push origin v0.3.0
```

This triggers [`.github/workflows/release.yml`](.github/workflows/release.yml) and publishes a GitHub Release with the signed NSIS + MSI installers.

---

## Installation

Download the latest release from the [Releases page](https://github.com/nutnrb/nrb-launcher/releases).

| Platform | File | Instructions |
|---|---|---|

