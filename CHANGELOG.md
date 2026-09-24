# Changelog

All notable changes to NRB Launcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
