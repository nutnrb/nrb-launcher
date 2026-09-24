# NRB Launcher (Tauri)

Desktop launcher for NRB Hub (`hub.nutnrb.com`). Built with Tauri 2 (Rust + WebView2) + React/Vite frontend. Lightweight (~10 MB installer), embeds WebView for instant UI updates, downloads programs from `downloads.nutnrb.com` as ZIP, verifies SHA-256, extracts to local install dir, and auto-updates itself via GitHub Releases.

---

## Quick Start

```bash
# Install deps
pnpm install

# Dev (hot reload)
pnpm tauri dev

# Build production installer (Windows: MSI + NSIS)
pnpm tauri build
```

---

## Project Layout

```
launcher/
├── src/                       # React frontend (Vite)
│   ├── App.tsx                # Main UI (login, dashboard, programs, wallet)
│   ├── main.tsx
│   └── components/            # UI components
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   ├── main.rs            # Entry (delegates to lib::run)
│   │   ├── lib.rs             # Plugin/command registration
│   │   ├── auth.rs            # Login + JWT storage (keyring)
│   │   ├── api.rs             # Hub HTTP client
│   │   ├── download.rs        # ZIP download + extract + SHA-256 verify
│   │   ├── hardware.rs        # Machine fingerprint (MAC + CPU + disk)
│   │   ├── store.rs           # Local state persistence
│   │   └── update.rs          # Auto-update (tauri_plugin_updater)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── .tauri-keygen          # Private signing key (NEVER COMMIT)
└── .github/workflows/release.yml
```

---

## Configuration

All API endpoints are hardcoded to:
- Hub API: `https://hub.nutnrb.com/api/v1`
- Download CDN: `https://downloads.nutnrb.com`
- Update endpoint: `https://github.com/nutnrb/nrb-launcher/releases/latest/download/latest.json`

To customize, edit constants in `src-tauri/src/api.rs` and `src-tauri/tauri.conf.json`.

---

## Auto-Update Setup

This repo uses `tauri_plugin_updater` with GitHub Releases as the update channel.

### One-time setup (already done)

1. Generated signing keypair (stored at `src-tauri/.tauri-keygen` and `.tauri-keygen.pub`)
2. Public key embedded in `tauri.conf.json` → `plugins.updater.pubkey`
3. Private key kept locally — must be configured as GitHub secret `TAURI_SIGNING_PRIVATE_KEY` (base64-encoded contents) and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` so CI can sign updates.

### Add secrets to GitHub

```bash
# Show private key (base64-encode if needed for secret)
cat src-tauri/.tauri-keygen

# Go to: Settings → Secrets and variables → Actions
# Add: TAURI_SIGNING_PRIVATE_KEY = (full contents of .tauri-keygen)
# Add: TAURI_SIGNING_PRIVATE_KEY_PASSWORD = NRBLauncherAutoUpdate2026
```

### Release flow

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions (`release.yml`) automatically:
1. Builds the frontend (`pnpm build`)
2. Builds the Tauri binary on `windows-latest` runner → `.msi` + `.nsis` installer
3. Signs the update with the private key
4. Uploads artifacts to a **draft** GitHub Release
5. Publishes `latest.json` (the manifest the launcher polls)

Users receive the update next time they launch the app.

---

## Commands Exposed to Frontend

| Command | Description |
|---------|-------------|
| `login(email, password)` | Authenticate against Hub, store JWT in OS keyring |
| `logout()` | Clear cached auth |
| `get_cached_auth()` | Read stored JWT + user info |
| `download_and_install(slug, version, sha256)` | Download ZIP → SHA-256 verify → backup existing → extract → write version marker |
| `rollback(slug)` | Restore from backup |
| `get_machine_id()` | Hardware fingerprint (MAC + CPU ID + disk serial → SHA-256) |
| `check_for_update()` | Query GitHub Releases for newer version |
| `download_and_install_update()` | Stream download + auto-install + restart |
| `get_update_state()` | Cached update metadata |
| `get_launcher_version()` | Current version string |

---

## API Endpoints Used

The launcher calls these Hub API endpoints (defined in `src-tauri/src/api.rs`):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Email/password login |
| GET | `/auth/me` | Verify cached JWT |
| GET | `/wallet` | Current credit balance |
| GET | `/programs` | List available programs |
| GET | `/programs/{slug}` | Program details + versions |
| POST | `/programs/{slug}/use` | Deduct credit for program use |
| GET | `/announcements` | Show news/updates |
| GET | `/subscription/my` | Subscription status |

---

## Storage Layout (on user's machine)

```
%APPDATA%\com.nutnrb.launcher\
├── programs/                  # Installed program ZIPs extracted
│   ├── nrb-postbot\
│   │   ├── (Python + plugins + portable EXE)
│   │   └── .version
│   └── .backup\
│       └── nrb-postbot\       # Rollback target
└── cache\
    └── nrb-postbot-1.2.0.zip  # Downloaded but not yet extracted
```

---

## Local Dev Tips

- Set `HUB_API_BASE=http://localhost:3000/api/v1` in `.env` to point at local Hub.
- Use `pnpm tauri dev --no-watch` if hot reload gets noisy.
- Logs go to `%APPDATA%\com.nutnrb.launcher\logs\` and stdout (when run from terminal).

---

## Security Notes

- **Never commit `.tauri-keygen`** (private signing key). Add to `.gitignore`.
- JWT tokens stored in OS-native secure storage (Windows Credential Manager via `keyring` crate).
- Hardware fingerprint is one-way hashed (SHA-256) — never sent in plain form.
- All download URLs use HTTPS. SHA-256 verification prevents MITM.
- Tauri CSP disabled (`null`) for dev — re-enable for production once CSP rules are finalized.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `cargo check` fails on missing `pkg-config` | `apt install pkg-config libssl-dev` |
| `cargo check` fails on missing `glib-2.0` | `apt install libgtk-3-dev libwebkit2gtk-4.1-dev` |
| `frontendDist not found` | Run `pnpm build` first |
| `updater.check()` returns None on dev build | Expected — dev builds use a fake version that won't match releases |
| `pubkey mismatch` error on update | Public key in `tauri.conf.json` must match the key used to sign |

---

## See also

- [Hub (Next.js) source](../apps/web/)
- [Tauri 2 docs](https://v2.tauri.app/)
- [tauri_plugin_updater](https://v2.tauri.app/plugin/updater/)
