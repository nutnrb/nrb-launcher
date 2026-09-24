# Code Signing Guide

Why sign binaries? Unsigned binaries trigger:
- **Windows SmartScreen**: "Windows protected your PC" — scary red warning. Most users abandon.
- **macOS Gatekeeper**: "Cannot be opened because it is from an unidentified developer"
- **Linux**: Not enforced, but GPG-signed packages gain user trust

## Per-platform overview

| Platform | Cost | Difficulty | Notes |
|---|---|---|---|
| Windows (EV cert) | $300–$500/yr | Easy | EV gives instant SmartScreen reputation |
| Windows (regular cert) | $70–$200/yr | Easy | Builds reputation after ~100 downloads |
| macOS | $99/yr Apple Developer Program | Medium | Requires notarization (Apple API) |
| Linux (GPG) | **Free** | Easy | Recommended — do this first |

---

## Windows (NSIS / MSI)

### Buy a certificate
Recommended: **Certum** (~$27/yr for open-source projects) or **SignPath.io** (free for OSS).

### Encode PFX as base64
```powershell
certutil -encode MyCert.pfx MyCert_base64.txt
```
On macOS/Linux:
```bash
base64 -i MyCert.pfx -o MyCert_base64.txt
```

### Add to GitHub Secrets
Settings → Secrets and variables → Actions → New repository secret

| Name | Value |
|---|---|
| `WINDOWS_CERT_FILE` | Contents of MyCert_base64.txt |
| `WINDOWS_CERT_PASSWORD` | Password you set when exporting |

### Workflow snippet
```yaml
env:
  WINDOWS_CERT_FILE: ${{ secrets.WINDOWS_CERT_FILE }}
  WINDOWS_CERT_PASSWORD: ${{ secrets.WINDOWS_CERT_PASSWORD }}
```
Tauri's tauri-action reads these automatically.

---

## macOS

### Prerequisites
1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/yr)
2. Create a **Developer ID Application** certificate in Xcode
3. Export as `.p12` (Keychain Access → My Certificates → Export)

### App Store Connect API key
Generate at https://appstoreconnect.apple.com/access/api
- Issuer ID
- Key ID
- `.p8` key file (base64)

### Add to GitHub Secrets
| Name | Value |
|---|---|
| `APPLE_CERTIFICATE` | base64 of .p12 |
| `APPLE_CERTIFICATE_PASSWORD` | p12 password |
| `APPLE_SIGNING_IDENTITY` | Developer ID Application: Your Name (TEAMID) |
| `APPLE_ID` | Apple ID email |
| `APPLE_PASSWORD` | App-specific password (appleid.apple.com) |
| `APPLE_TEAM_ID` | 10-char team ID |
| `API_KEY_ID` | App Store Connect API Key ID |
| `API_ISSUER_ID` | App Store Connect API Issuer ID |
| `API_KEY_FILE` | base64 of AuthKey_XXXXXX.p8 |

### Workflow snippet
```yaml
env:
  APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
  APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
  APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
  API_KEY_ID: ${{ secrets.API_KEY_ID }}
  API_KEY_FILE: ${{ env.API_KEY_FILE }}
  API_ISSUER_ID: ${{ secrets.API_ISSUER_ID }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  CSC_IDENTITY_AUTO_DISCOVERY: 'true'
```

---

## Linux GPG (free, do it now)

### Generate a GPG key
```bash
gpg --full-generate-key
# Choose: RSA and RSA, 4096 bits, 0 = key never expires (or set expiry)
```

### Export
```bash
gpg --armor --export-secret-keys YOUR_KEY_ID > gpg-private.asc
gpg --armor --export YOUR_KEY_ID > gpg-public.asc
```

### Add to GitHub Secrets
| Name | Value |
|---|---|
| `GPG_PRIVATE_KEY` | Contents of `gpg-private.asc` |
| `GPG_PASSPHRASE` | Passphrase you set |

### Step in workflow (Linux job, BEFORE pnpm tauri build)
```yaml
- name: Import GPG key
  if: matrix.platform == 'ubuntu-22.04'
  env:
    GPG_PRIVATE_KEY: ${{ secrets.GPG_PRIVATE_KEY }}
    GPG_PASSPHRASE: ${{ secrets.GPG_PASSPHRASE }}
  run: |
    echo "$GPG_PRIVATE_KEY" | gpg --import --batch
    echo "allow-preset-passphrase
default-cache-ttl 600
max-cache-ttl 7200" | gpgconf --change-options gpg-agent
    echo "$GPG_PASSPHRASE" | gpg --pinentry-mode loopback --passphrase-fd 0 --sign --detach-sign /dev/stdin < /dev/null

- name: Sign .deb and AppImage
  if: matrix.platform == 'ubuntu-22.04'
  env:
    GPG_PASSPHRASE: ${{ secrets.GPG_PASSPHRASE }}
  run: |
    cd src-tauri/target/release/bundle/deb/
    for f in *.deb; do
      echo "$GPG_PASSPHRASE" | gpg --pinentry-mode loopback --passphrase-fd 0 \
        --armor --detach-sign --sign \
        "$f"
    done
    cd ../appimage/
    for f in *.AppImage; do
      echo "$GPG_PASSPHRASE" | gpg --pinentry-mode loopback --passphrase-fd 0 \
        --armor --detach-sign --sign \
        "$f"
    done
```

### Upload signed files to release
The signing commands above produce `.sig` files. After Tauri uploads artifacts, do:
```yaml
- name: Upload signature files
  if: matrix.platform == 'ubuntu-22.04'
  uses: softprops/action-gh-release@v2
  with:
    files: |
      src-tauri/target/release/bundle/deb/*.sig
      src-tauri/target/release/bundle/appimage/*.sig
```

---

## End-to-end checklist

- [ ] Generated GPG key, added to GitHub Secrets (FREE — do now)
- [ ] Bought Windows code signing cert, added to Secrets (when ready)
- [ ] Enrolled Apple Developer Program, added API keys to Secrets (when ready)
- [ ] Verified signed artifacts on each platform
- [ ] Updated README to advertise that binaries are signed---

## Auto-Updater (Tauri)

NRB Launcher uses the Tauri 2.x auto-updater (`tauri-plugin-updater`), which talks
to a JSON manifest published at the GitHub Releases URL.

### Signing key (already generated)

A dedicated **ed25519** keypair exists for the updater (separate from GPG code signing):

| File | Purpose |
|---|---|
| `src-tauri/.tauri-keygen` | **Private** key — gitignored, never commit. Used by CI to sign `latest.json`. |
| `src-tauri/.tauri-keygen.pub` | **Public** key — checked into the repo (already wired into `tauri.conf.json`). |

> ⚠ The private key file currently lives on `NRB-Server` only. **Back it up to a
> safe place (password manager / encrypted backup) and add it to GitHub Secrets**
> (see below). Without it, future releases cannot be signed and users will not
> be able to install updates.

### Add to GitHub Secrets

Go to: `https://github.com/nutnrb/nrb-launcher/settings/secrets/actions`

| Secret name | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | `cat src-tauri/.tauri-keygen` (entire file contents) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | The passphrase used when generating the key |

`tauri-action` (already used in `.github/workflows/release.yml`) automatically picks
up these secrets when present, signs every platform bundle, and publishes a
signed `latest.json` to the GitHub Release.

### Generate a new key (one-time, only if the existing one is lost)

```bash
pnpm tauri signer generate \
  -w ~/.tauri/nrb-launcher.key \
  -p ~/.tauri/nrb-launcher.pub
```

Then update `src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "pubkey": "<base64 string from .pub file>"
    }
  }
}
```

The current public key is already configured — **only re-generate if you've lost
the private key**. Re-generating requires updating both the secret AND the
pubkey in `tauri.conf.json` AND shipping a new release for users to receive it.

### Updater configuration (already in `src-tauri/tauri.conf.json`)

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "dialog": true,
      "endpoints": [
        "https://github.com/nutnrb/nrb-launcher/releases/latest/download/latest.json",
        "https://github.com/nutnrb/nrb-launcher/releases/download/v{{version}}/latest.json"
      ],
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEZGMjA0RENFNEI0MjYxODAKUldTQVlVSkx6azBnL3pvZlJUNjI1TnNlZDZMT1hUUkU1cnJpZUdsbnY3NUVUNCt0dkVUM0N1Z1gK",
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

Public key (decoded): ed25519 key `FF204DCE4B426180` (minisign format).

### Backend commands (already in `src-tauri/src/update.rs`)

- `check_for_update` → calls `app.updater().check()`, emits `update_available`
  / `update_error` events, returns cached `UpdateState`.
- `download_and_install_update` → downloads the bundle with progress
  events, installs it, calls `app.restart()` to apply.
- `get_update_state` / `get_launcher_version` → read cached state.

### Frontend (already in `src/updater.ts` + `src/App.tsx`)

`src/updater.ts` wraps `invoke()` + event listeners. `App.tsx` exposes a
"ตรวจสอบอัปเดต" (Check for updates) button in the dashboard header that triggers
`checkForUpdate()` and auto-downloads + installs if a new version is found.

### How it works on release

1. Push a `v*` tag (or trigger `workflow_dispatch`).
2. CI builds all platform bundles (Linux .deb/.AppImage, Windows .msi/.nsis, macOS .app/.dmg).
3. If `TAURI_SIGNING_PRIVATE_KEY` is set, `tauri-action` signs each artifact
   and generates a signed `latest.json` listing them.
4. `latest.json` is uploaded to the GitHub Release.
5. On next launch, the user's app calls `check()` → verifies signature with
   the embedded public key → shows update prompt → downloads → installs →
   restarts.

### Gitignore

The existing `.gitignore` already excludes `*.key` and `.tauri-keygen*`, so
the private key cannot be accidentally committed.