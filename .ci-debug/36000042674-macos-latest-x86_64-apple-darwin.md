## Tauri build diagnostic

Run: `36000042674`  SHA: `803f7a3883e312a3e8a569ec31033ef20645dd53`  Platform: `macos-latest`  Target: `x86_64-apple-darwin`

### environment
```
Darwin sjc22-be107-0c04c95e-e72c-42ff-9f46-dc8cfc590977-96EA0FAEA893.local 25.6.0 Darwin Kernel Version 25.6.0: Fri Jul 31 19:16:43 PDT 2026; root:xnu-12377.161.14~5/RELEASE_ARM64_VMAPPLE arm64
rustc 1.98.1 (48a229cea 2026-09-01)
cargo 1.98.1 (797e8a9bc 2026-08-05)
v22.23.2
9.15.9

> nrb-launcher@0.1.0 tauri /Users/runner/work/nrb-launcher/nrb-launcher
> tauri --version

tauri-cli 2.11.5
```
### platform tools
```
makensis: NOT FOUND
candle: NOT FOUND
light: NOT FOUND
/usr/bin/codesign
png2icns: NOT FOUND
/usr/bin/iconutil
```
### target dirs
```
total 16
drwxr-xr-x   7 runner  staff   224 Sep 24 12:36 .
drwxr-xr-x  10 runner  staff   320 Sep 24 12:39 ..
-rw-r--r--   1 runner  staff  3064 Sep 24 12:41 .rustc_info.json
drwxr-xr-x   4 runner  staff   128 Sep 24 11:15 aarch64-apple-darwin
-rw-r--r--   1 runner  staff   177 Sep 24 11:15 CACHEDIR.TAG
drwxr-xr-x  10 runner  staff   320 Sep 24 12:36 release
drwxr-xr-x@  4 runner  staff   128 Sep 24 12:36 x86_64-apple-darwin
src-tauri/target/x86_64-apple-darwin/release/bundle
```
### icons
```
total 248
drwxr-xr-x   8 runner  staff    256 Sep 24 12:36 .
drwxr-xr-x  10 runner  staff    320 Sep 24 12:39 ..
-rw-r--r--   1 runner  staff   8643 Sep 24 12:36 128x128.png
-rw-r--r--   1 runner  staff  22558 Sep 24 12:36 128x128@2x.png
-rw-r--r--   1 runner  staff    901 Sep 24 12:36 32x32.png
-rw-r--r--   1 runner  staff  22580 Sep 24 12:36 icon.ico
-rw-r--r--   1 runner  staff  53940 Sep 24 12:36 icon.png
-rw-r--r--   1 runner  staff   2875 Sep 24 12:36 tray.png
src-tauri/icons/128x128.png:    PNG image data, 128 x 128, 8-bit/color RGBA, non-interlaced
src-tauri/icons/128x128@2x.png: PNG image data, 256 x 256, 8-bit/color RGBA, non-interlaced
src-tauri/icons/32x32.png:      PNG image data, 32 x 32, 8-bit/color RGBA, non-interlaced
src-tauri/icons/icon.ico:       MS Windows icon resource - 1 icon, 256x1 with PNG image data, 256 x 256, 8-bit/color RGBA, non-interlaced, 32 bits/pixel
src-tauri/icons/icon.png:       PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
src-tauri/icons/tray.png:       PNG image data, 64 x 64, 8-bit/color RGBA, non-interlaced
```
### tauri build --no-bundle --verbose (last 400 lines)
```

> nrb-launcher@0.1.0 tauri /Users/runner/work/nrb-launcher/nrb-launcher
> tauri build --no-bundle --verbose

       Debug [tauri_cli::helpers::app_paths] Found Tauri project inside /Users/runner/work/nrb-launcher/nrb-launcher/src-tauri on early lookup
        Info [tauri_cli::build] Looking up installed tauri packages to check mismatched versions...
     Running [tauri_cli::helpers] beforeBuildCommand `pnpm build`
       Debug [tauri_cli::helpers] Setting environment for hook {"TAURI_ENV_FAMILY": "unix", "TAURI_ENV_PLATFORM": "darwin", "TAURI_ENV_TARGET_TRIPLE": "aarch64-apple-darwin", "TAURI_ENV_PLATFORM_VERSION": "26.6.2", "TAURI_ENV_ARCH": "aarch64"}
     Running [tauri_cli] Command `sh -c pnpm build`

> nrb-launcher@0.1.0 build /Users/runner/work/nrb-launcher/nrb-launcher
> tsc && vite build

[33mThe CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.[39m
[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 34 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                 [39m[1m[2m  0.46 kB[22m[1m[22m[2m │ gzip:  0.30 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-Cqcb4vqz.css  [39m[1m[2m  3.61 kB[22m[1m[22m[2m │ gzip:  1.21 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-B10yp_Re.js   [39m[1m[2m146.81 kB[22m[1m[22m[2m │ gzip: 47.66 kB[22m
[32m✓ built in 698ms[39m
     Running [tauri_cli] Command `cargo build --bins --features tauri/custom-protocol --release`
[1m[92m   Compiling[0m nrb-launcher v0.1.0 (/Users/runner/work/nrb-launcher/nrb-launcher/src-tauri)
[1m[92m    Finished[0m `release` profile [optimized] target(s) in 1m 21s
       Built [tauri_cli::build] application at: /Users/runner/work/nrb-launcher/nrb-launcher/src-tauri/target/release/nrb-launcher
```
### full tauri build with bundling (last 200 lines)
```

> nrb-launcher@0.1.0 tauri /Users/runner/work/nrb-launcher/nrb-launcher
> tauri build --target x86_64-apple-darwin --bundles app\,dmg --verbose

       Debug [tauri_cli::helpers::app_paths] Found Tauri project inside /Users/runner/work/nrb-launcher/nrb-launcher/src-tauri on early lookup
        Info [tauri_cli::build] Looking up installed tauri packages to check mismatched versions...
     Running [tauri_cli::helpers] beforeBuildCommand `pnpm build`
       Debug [tauri_cli::helpers] Setting environment for hook {"TAURI_ENV_ARCH": "x86_64", "TAURI_ENV_TARGET_TRIPLE": "x86_64-apple-darwin", "TAURI_ENV_FAMILY": "unix", "TAURI_ENV_PLATFORM": "darwin", "TAURI_ENV_PLATFORM_VERSION": "26.6.2"}
     Running [tauri_cli] Command `sh -c pnpm build`

> nrb-launcher@0.1.0 build /Users/runner/work/nrb-launcher/nrb-launcher
> tsc && vite build

[33mThe CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.[39m
[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 34 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                 [39m[1m[2m  0.46 kB[22m[1m[22m[2m │ gzip:  0.30 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-Cqcb4vqz.css  [39m[1m[2m  3.61 kB[22m[1m[22m[2m │ gzip:  1.21 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-B10yp_Re.js   [39m[1m[2m146.81 kB[22m[1m[22m[2m │ gzip: 47.66 kB[22m
[32m✓ built in 862ms[39m
     Running [tauri_cli] Command `cargo build --bins --features tauri/custom-protocol --release --target x86_64-apple-darwin`
[1m[92m   Compiling[0m nrb-launcher v0.1.0 (/Users/runner/work/nrb-launcher/nrb-launcher/src-tauri)
[1m[92m    Finished[0m `release` profile [optimized] target(s) in 1m 26s
       Built [tauri_cli::build] application at: /Users/runner/work/nrb-launcher/nrb-launcher/src-tauri/target/x86_64-apple-darwin/release/nrb-launcher
    Bundling [tauri_bundler::bundle::macos::app] NRB Launcher.app (/Users/runner/work/nrb-launcher/nrb-launcher/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app)
failed to bundle project: Failed to create app icon: `Format error decoding Ico: Entry(256, 1) and PNG(256, 256) dimensions do not match!`
       Error [tauri_cli_node] failed to bundle project: Failed to create app icon: `Format error decoding Ico: Entry(256, 1) and PNG(256, 256) dimensions do not match!`
 ELIFECYCLE  Command failed with exit code 1.
```
