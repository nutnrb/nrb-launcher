## Bundle inspection

Platform: `macos-latest`  Target: `x86_64-apple-darwin`  Run: `36009508785`  SHA: `43dc2acacdf9031bf439291ac639cb0985aaeb67`

### tauri version
```

> nrb-launcher@0.1.0 tauri /Users/runner/work/nrb-launcher/nrb-launcher
> tauri --version
```

### bundle target tree
```
src-tauri/target/x86_64-apple-darwin/release
src-tauri/target/x86_64-apple-darwin/release/bundle
src-tauri/target/aarch64-apple-darwin/release
src-tauri/target/release
```

### bundle files (msi, exe, nsis, deb, AppImage, app, dmg, pkg)
```
find: -printf: unknown primary or operator
```

### bundle dir listing
```
total 0
drwxr-xr-x   5 runner  staff  160 Sep 24 14:05 .
drwxr-xr-x  13 runner  staff  416 Sep 24 14:05 ..
drwxr-xr-x   5 runner  staff  160 Sep 24 14:06 dmg
drwxr-xr-x   4 runner  staff  128 Sep 24 14:06 macos
drwxr-xr-x   3 runner  staff   96 Sep 24 14:05 share

src-tauri/target/x86_64-apple-darwin/release/bundle/dmg:
total 15056
drwxr-xr-x  5 runner  staff      160 Sep 24 14:06 .
drwxr-xr-x  5 runner  staff      160 Sep 24 14:05 ..
-rwxrwxrwx  1 runner  staff    19300 Sep 24 14:05 bundle_dmg.sh
-rw-r--r--@ 1 runner  staff  7306819 Sep 24 14:06 NRB Launcher_0.1.0_x64.dmg
-rw-r--r--  1 runner  staff   379633 Sep 24 14:05 NRB Launcher.icns

src-tauri/target/x86_64-apple-darwin/release/bundle/macos:
total 14056
drwxr-xr-x  4 runner  staff      128 Sep 24 14:06 .
drwxr-xr-x  5 runner  staff      160 Sep 24 14:05 ..
drwxr-xr-x  3 runner  staff       96 Sep 24 14:05 NRB Launcher.app
-rw-r--r--  1 runner  staff  7195352 Sep 24 14:06 NRB Launcher.app.tar.gz

src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 14:05 .
drwxr-xr-x  4 runner  staff  128 Sep 24 14:06 ..
drwxr-xr-x  5 runner  staff  160 Sep 24 14:05 Contents

src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents:
total 8
drwxr-xr-x  5 runner  staff   160 Sep 24 14:05 .
drwxr-xr-x  3 runner  staff    96 Sep 24 14:05 ..
-rw-r--r--  1 runner  staff  1071 Sep 24 14:05 Info.plist
drwxr-xr-x  3 runner  staff    96 Sep 24 14:05 MacOS
drwxr-xr-x  3 runner  staff    96 Sep 24 14:05 Resources

src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents/MacOS:
total 44928
drwxr-xr-x  3 runner  staff        96 Sep 24 14:05 .
drwxr-xr-x  5 runner  staff       160 Sep 24 14:05 ..
-rwxr-xr-x  1 runner  staff  23002888 Sep 24 14:05 nrb-launcher

src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents/Resources:
total 744
drwxr-xr-x  3 runner  staff      96 Sep 24 14:05 .
drwxr-xr-x  5 runner  staff     160 Sep 24 14:05 ..
-rw-r--r--  1 runner  staff  379633 Sep 24 14:05 NRB Launcher.icns

src-tauri/target/x86_64-apple-darwin/release/bundle/share:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 14:05 .
drwxr-xr-x  5 runner  staff  160 Sep 24 14:05 ..
drwxr-xr-x  3 runner  staff   96 Sep 24 14:05 create-dmg

src-tauri/target/x86_64-apple-darwin/release/bundle/share/create-dmg:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 14:05 .
drwxr-xr-x  3 runner  staff   96 Sep 24 14:05 ..
drwxr-xr-x  4 runner  staff  128 Sep 24 14:05 support

src-tauri/target/x86_64-apple-darwin/release/bundle/share/create-dmg/support:
total 16
drwxr-xr-x  4 runner  staff   128 Sep 24 14:05 .
drwxr-xr-x  3 runner  staff    96 Sep 24 14:05 ..
-rw-r--r--  1 runner  staff  2376 Sep 24 14:05 eula-resources-template.xml
-rw-r--r--  1 runner  staff  1828 Sep 24 14:05 template.applescript
```

### releases (via curl)
```
{
  "url": "https://api.github.com/repos/nutnrb/nrb-launcher/releases/395749941",
  "assets_url": "https://api.github.com/repos/nutnrb/nrb-launcher/releases/395749941/assets",
  "upload_url": "https://uploads.github.com/repos/nutnrb/nrb-launcher/releases/395749941/assets{?name,label}",
  "html_url": "https://github.com/nutnrb/nrb-launcher/releases/tag/v0.1.0",
  "id": 395749941,
  "author": {
    "login": "github-actions[bot]",
    "id": 41898282,
    "node_id": "MDM6Qm90NDE4OTgyODI=",
    "avat
```
