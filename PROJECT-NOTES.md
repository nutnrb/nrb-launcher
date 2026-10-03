# nrb-launcher — Project Knowledge

> Read this file FIRST when resuming work on this repo. It captures the deployment pipeline, dev workflow, and decisions that are not obvious from code alone.

## TL;DR

- **What this project is:** Tauri 2 desktop launcher (`nrb-launcher`) for the NRB suite — a Windows-only (currently) app built with Rust + React + Vite.
- **How releases happen:** `git push origin vX.Y.Z` → GitHub Actions builds, signs, uploads a NSIS installer to Cloudflare R2 → installed apps auto-update on next launch via `tauri-plugin-updater`.

## Identity

- Repo: `nutnrb/nrb-launcher`
- Bundle identifier: `com.nutnrb.launcher` (verified in `src-tauri/tauri.conf.json` — the file is the source of truth, not this doc)
- R2 public URL: `https://releases.nutnrb.com/nrb-launcher/`
- Tauri version: 2.x (verified in `src-tauri/Cargo.toml`)
- `tauri-plugin-updater`: `=2.12.0`
- Ed25519 updater pubkey fingerprint: `AC88C130D84E558B` (corrected from earlier typo `...558E`; encoded value lives in `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`)
- Bundle target: NSIS. `tauri.conf.json` lists both `msi` and `nsis`, but `upload.yml` passes `--bundles nsis` to `tauri-action` and `preview.yml` does the same — msi is effectively inactive for release builds.

## Release pipeline (what GitHub Actions does on `git push origin vX.Y.Z`)

Workflow file: `.github/workflows/upload.yml`.

1. Trigger — fires on `push: tags: ['v*']` and on `workflow_dispatch`.
2. Job — `build-and-upload` runs on `windows-latest`, `timeout-minutes: 30`.
3. Steps (high level):
   - Checkout (`fetch-depth: 0`)
   - Install Rust (`dtolnay/rust-toolchain@stable`), Node 22, pnpm 9
   - `pnpm install --frozen-lockfile`
   - `pnpm build` (frontend bundle)
   - Resolve version from `package.json` (or `inputs.version` if dispatched manually)
   - Run `tauri-apps/tauri-action@v0` with secrets (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, plus the standard `GITHUB_TOKEN`). This compiles Rust, creates a non-draft, non-prerelease GitHub Release, and generates `latest.json` for the updater.
   - Find the produced NSIS `.exe`
   - Re-sign the `.exe` locally with `pnpm tauri signer sign --private-key-path …` (the local sign step is necessary because `tauri-action` does NOT write a `${EXE_PATH}.sig` next to the bundle, only into the GH Release)
   - `aws s3 cp` the `.exe` and `.sig` to `s3://${R2_BUCKET}/nrb-launcher/…` using `AWS_ENDPOINT_URL_S3=https://<account>.r2.cloudflarestorage.com`
   - Generate `latest.json` via `jq` and upload it to `s3://${R2_BUCKET}/nrb-launcher/latest.json` with `--cache-control "no-cache"`
   - Print final R2 + GH release URLs

4. Result:
   - R2: `nrb-launcher/NRB Launcher_<v>_x64-setup.exe` + `.sig` + `latest.json`
   - GitHub: release page at `/releases/tag/vX.Y.Z`
   - Installed users: `UpdateBanner` fires on next launch, offers the update, atomic install on accept.

## Secrets referenced by the workflows

| Secret | Where used |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Ed25519 minisign key, base64-encoded (348 bytes). Used by both `tauri-action` and the local re-sign step. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the above. |
| `R2_ACCESS_KEY_ID` | R2 static key. |
| `R2_SECRET_ACCESS_KEY` | R2 static key secret. |
| `R2_ACCOUNT_ID` | Cloudflare account ID; used to build `AWS_ENDPOINT_URL_S3`. |
| `GITHUB_TOKEN` | Provided automatically. |

Other env on the job (non-secret): `R2_BUCKET="nrb-releases"`, `R2_PUBLIC_URL="https://releases.nutnrb.com"`, `AWS_REGION=auto`, `AWS_S3_ADDRESSING_STYLE=path`.

> Note on bucket vs URL: the R2 bucket is `nrb-releases` (per `upload.yml` `env.R2_BUCKET`), but the public-facing object prefix is `/nrb-launcher/…`. The custom domain `releases.nutnrb.com` fronts the bucket. So an object path inside the bucket is `nrb-launcher/<file>` even though the bucket itself is named `nrb-releases`.

## Dev workflow — local (no CI)

### Hot-reload matrix

| Change target | Tool | Reload time | What you do |
|---|---|---|---|
| React/TS in `src/` (UI, hooks, styles) | Vite HMR | < 1s | Save file, browser reflects |
| Tauri Rust in `src-tauri/src/` | `tauri dev` recompiles | 30s – 2min | App auto-restarts |
| `src-tauri/Cargo.toml` (new dep) | `tauri dev` re-fetches | 1–5min | App auto-restarts |
| `src-tauri/tauri.conf.json` (window config, identifiers, updater endpoints, pubkey) | `tauri dev` re-applies | a few seconds | App auto-restarts |
| `package.json` (new JS dep) | `pnpm install` + `tauri dev` re-bundles | 30s–1min | Run `pnpm install` then restart |

### Dev command

```bash
pnpm install
pnpm tauri dev
```

This launches the dev window. It watches `src/` for HMR and `src-tauri/` for Rust rebuilds. First run compiles Rust deps (~3–5 min).

### Quick test build (no upload, no publish)

For a smoke test that mirrors what CI does locally without uploading:

```bash
pnpm tauri build --bundles nsis
```

Output: `src-tauri/target/release/bundle/nsis/NRB Launcher_<v>_x64-setup.exe` (the version comes from `src-tauri/tauri.conf.json`). Takes 5–9 min on a typical machine.

### Why CI takes ~9 minutes

`tauri build` is mostly Rust compilation: cold cache pulls ~250 crates, then incremental rebuilds. On `windows-latest`, that's typically 7–9 minutes for a clean check, plus ~30s for the NSIS bundler + the re-sign step + the S3 uploads. Once the cache is warm, subsequent runs on the same commit can drop to 3–4 minutes.

## Version bump — always 4 files

Before every `git tag vX.Y.Z`, these must all match the new version:

| File | Field |
|---|---|
| `src-tauri/tauri.conf.json` | top-level `"version"` |
| `src-tauri/Cargo.toml` | `[package] version` |
| `src-tauri/Cargo.lock` | auto-updated by `cargo update -p nrb-launcher` or by CI |
| `package.json` | top-level `"version"` |
| `src/App.tsx` | the constant `LAUNCHER_VERSION` (currently `"0.5.1"`) |

`CHANGELOG.md` is NOT required to update — historical entries stay.

## Release procedure (the 4 commands)

```bash
# 1. Edit code
# 2. Bump version in 4 files (see table above)
# 3. Commit + push
git add -A
git commit -m "feat: ..."
git push origin main
# 4. Tag + push tag (this triggers CI)
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

CI takes ~9 min. Watch at https://github.com/nutnrb/nrb-launcher/actions.

## Preview workflow

`.github/workflows/preview.yml` builds an installable preview for any non-`main` branch (and skips on tag pushes). The result is uploaded to R2 under a per-branch key prefix so it can never collide with stable releases. The workflow:

1. Triggers on push to any branch except `main`, and on `workflow_dispatch`. Tag pushes are excluded so they fall through to `upload.yml`.
2. Concurrency group `preview-${{ github.ref }}` with `cancel-in-progress: true` so pushing a new commit cancels the in-flight build for the same branch.
3. Resolves a synthetic version `BASE_VERSION-preview.<short-sha>.<sanitized-branch>`.
4. Overwrites `version` in `src-tauri/tauri.conf.json`, `package.json`, and `src-tauri/Cargo.toml` (the same four files you bump for a real release).
5. Runs `pnpm tauri build --bundles nsis` (same as CI, no `tauri-action` — we don't want a GitHub Release).
6. Re-signs the `.exe` with `pnpm tauri signer sign` (same pattern as `upload.yml`'s local re-sign step — secrets come from the same GitHub Secrets).
7. Uploads the `.exe` and `.sig` to `s3://${R2_BUCKET}/nrb-launcher/preview/<sanitized-branch>-<short-sha>/` via `aws s3 cp` (same R2 endpoint as `upload.yml`).
8. Generates a per-preview `latest.json` that points at the preview `.exe` URL and uploads it to the same preview prefix.
9. Does NOT touch the root `nrb-launcher/latest.json`, so no installed user is offered a preview build as an auto-update.
10. Writes a `$GITHUB_STEP_SUMMARY` table with the direct `.exe` / `.sig` / `latest.json` URLs and install instructions.

To install a preview: download `NRB Launcher_<preview-version>_x64-setup.exe` from the URLs in the summary, run it. The NSIS installer installs side-by-side with the stable build because the version differs, so previews do not displace your stable install.

## Auto-update mechanics

When a user has v0.5.0 installed:

1. On launch, `src/components/UpdateBanner.tsx` calls `tauri-plugin-updater`'s `check()`.
2. The plugin fetches `latest.json` from the endpoints below (the plugin tries each in order).
3. If `version > app.version` AND signature verifies against the embedded pubkey, an update is offered.
4. User clicks "Update" → download streams to a temp dir → signature re-verified → atomic swap on app close.
5. Next launch is the new version.

Updater endpoints (from `src-tauri/tauri.conf.json` → `plugins.updater.endpoints`, exact order):

- `https://releases.nutnrb.com/nrb-launcher/latest.json` — production (R2, custom domain)
- `https://github.com/nutnrb/nrb-launcher/releases/download/preview-latest/latest.json` — rolling preview tag (historical; current preview workflow does not push to it)
- `https://github.com/nutnrb/nrb-launcher/releases/latest/download/latest.json` — fallback to GH latest
- `https://github.com/nutnrb/nrb-launcher/releases/download/v{{version}}/latest.json` — version-specific fallback

## Things to be careful about

- **Don't tag without bumping version.** If you tag `v0.5.x` while files still say `0.5.0`, the running binary self-reports `0.5.0` and the updater thinks no update is needed.
- **Don't delete tags you might want to keep.** Tags are how users roll back. The user has already deleted one tag (`v0.5.0-preview-cutai-phase0`) — verify before any other tag operations.
- **Don't push to `main` with broken builds.** Main is the source of truth for the next release. Use a branch + PR.
- **Pubkey rotation is risky.** Once users have v0.5.0 with the current pubkey, changing the pubkey in `tauri.conf.json` will block their updates until they manually reinstall. The v0.5.0 release already rotated the key once (see CHANGELOG) — that rotation bricked the auto-update path for all v0.4.x and earlier-v0.5.0-preview installs.
- **R2 endpoint ownership.** `nutnrb.com` is on Cloudflare R2, public bucket. The user can move it, but then must update all 4 endpoints in `tauri.conf.json`.
- **`tauri-action` insists on a tag.** That's why the preview workflow does not use `tauri-action` — it manually does `pnpm tauri build` + `pnpm tauri signer sign` + `aws s3 cp`.
- **Local re-sign step is required.** `tauri-action` produces a signed asset in the GitHub Release manifest but does NOT write `${EXE_PATH}.sig` next to the local bundle. Without the local re-sign, the `.sig` upload is silently skipped and the updater's signature check fails on the client.
- **Tauri signer key-env pitfall.** `tauri-cli`'s `signer sign` rejects `TAURI_SIGNING_PRIVATE_KEY` in env if `--private-key-path` is also passed (clap exit-2 conflict). The CI workflow captures the key string, unsets it, and writes it to a temp file before invoking the signer.

## Verified history (releases we know are good)

| Version | Tag SHA | Run | Notes |
|---|---|---|---|
| v0.5.0 | `3f1b82b` | #16 (`37034196482`) | First release with new Tauri 2 + R2 pipeline; key rotation |
| v0.5.1 | `bb93630` | #17 (`37045429746`) | Noop release — validated auto-update works end-to-end |

(Values `HEAD`/`bb93630` etc. verified from `git log` at time of writing.)

## What is NOT in this doc

- Per-feature design (read `src/`)
- Visual design (read `src/components/`)
- Game launcher protocols (read `src-tauri/src/`)

If you are an AI agent picking this up: skim the doc, then run `git log --oneline -20` and read the top 3 files referenced in the most recent change.

---

Last verified: 2026-10-03<!-- preview handoff 2026-10-03T06:12:13Z -->
