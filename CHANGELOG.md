# Changelog

All notable changes to NRB Launcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.1] - 2026-09-24

### Changed
- CI: also produce Windows `.msi` bundle (in addition to NSIS `.exe`) for enterprise/GPO deployment
- Docs: comprehensive README + SHA256SUMS for verification
- CI: code signing infrastructure (GPG for Linux, ready for Windows cert and macOS Developer ID)

### Verification
All 7 artifacts from v0.1.0 smoke-tested on Linux x86_64:
- `.deb` installs cleanly via dpkg, binary runs under xvfb
- `.AppImage` extracts and runs under xvfb
- `.exe` valid NSIS-3 PE32+ Unicode installer
- macOS `.app` bundles (x64 + aarch64) have correct structure
- macOS `.dmg` (x64 + aarch64) are valid Apple HFS disk images

## [0.1.0] - 2026-09-24

### Added
- Initial public release of NRB Launcher
- Multi-platform binaries:
  - Windows: NSIS installer (.exe)
  - Linux: .deb package and AppImage
  - macOS: Apple Silicon + Intel builds (.dmg + .app)
- Built automatically via GitHub Actions on every push to a `v*` tag

### Notes
- SmartScreen on Windows: unsigned binary — users see a warning on first launch.
- macOS: unsigned — users need to right-click + Open the first time.
- Code signing and auto-updater planned for a future release.
