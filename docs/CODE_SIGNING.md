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
- [ ] Updated README to advertise that binaries are signed