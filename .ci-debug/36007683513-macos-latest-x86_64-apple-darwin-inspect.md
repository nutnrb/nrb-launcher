## Bundle inspection

Platform: `macos-latest`  Target: `x86_64-apple-darwin`  Run: `36007683513`  SHA: `d187b3f1fe2d22633ee52c9862711f5261d8d2a0`

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
drwxr-xr-x   5 runner  staff  160 Sep 24 13:50 .
drwxr-xr-x  13 runner  staff  416 Sep 24 13:50 ..
drwxr-xr-x   5 runner  staff  160 Sep 24 13:51 dmg
drwxr-xr-x   4 runner  staff  128 Sep 24 13:51 macos
drwxr-xr-x   3 runner  staff   96 Sep 24 13:50 share

src-tauri/target/x86_64-apple-darwin/release/bundle/dmg:
total 15056
drwxr-xr-x  5 runner  staff      160 Sep 24 13:51 .
drwxr-xr-x  5 runner  staff      160 Sep 24 13:50 ..
-rwxrwxrwx  1 runner  staff    19300 Sep 24 13:50 bundle_dmg.sh
-rw-r--r--@ 1 runner  staff  7306819 Sep 24 13:51 NRB Launcher_0.1.0_x64.dmg
-rw-r--r--  1 runner  staff   379633 Sep 24 13:50 NRB Launcher.icns

src-tauri/target/x86_64-apple-darwin/release/bundle/macos:
total 14888
drwxr-xr-x  4 runner  staff      128 Sep 24 13:51 .
drwxr-xr-x  5 runner  staff      160 Sep 24 13:50 ..
drwxr-xr-x  3 runner  staff       96 Sep 24 13:50 NRB Launcher.app
-rw-r--r--  1 runner  staff  7195350 Sep 24 13:51 NRB Launcher.app.tar.gz

src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 13:50 .
drwxr-xr-x  4 runner  staff  128 Sep 24 13:51 ..
drwxr-xr-x  5 runner  staff  160 Sep 24 13:50 Contents

src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents:
total 8
drwxr-xr-x  5 runner  staff   160 Sep 24 13:50 .
drwxr-xr-x  3 runner  staff    96 Sep 24 13:50 ..
-rw-r--r--  1 runner  staff  1071 Sep 24 13:50 Info.plist
drwxr-xr-x  3 runner  staff    96 Sep 24 13:50 MacOS
drwxr-xr-x  3 runner  staff    96 Sep 24 13:50 Resources

src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents/MacOS:
total 44928
drwxr-xr-x  3 runner  staff        96 Sep 24 13:50 .
drwxr-xr-x  5 runner  staff       160 Sep 24 13:50 ..
-rwxr-xr-x  1 runner  staff  23002888 Sep 24 13:50 nrb-launcher

src-tauri/target/x86_64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents/Resources:
total 744
drwxr-xr-x  3 runner  staff      96 Sep 24 13:50 .
drwxr-xr-x  5 runner  staff     160 Sep 24 13:50 ..
-rw-r--r--  1 runner  staff  379633 Sep 24 13:50 NRB Launcher.icns

src-tauri/target/x86_64-apple-darwin/release/bundle/share:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 13:50 .
drwxr-xr-x  5 runner  staff  160 Sep 24 13:50 ..
drwxr-xr-x  3 runner  staff   96 Sep 24 13:50 create-dmg

src-tauri/target/x86_64-apple-darwin/release/bundle/share/create-dmg:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 13:50 .
drwxr-xr-x  3 runner  staff   96 Sep 24 13:50 ..
drwxr-xr-x  4 runner  staff  128 Sep 24 13:50 support

src-tauri/target/x86_64-apple-darwin/release/bundle/share/create-dmg/support:
total 16
drwxr-xr-x  4 runner  staff   128 Sep 24 13:50 .
drwxr-xr-x  3 runner  staff    96 Sep 24 13:50 ..
-rw-r--r--  1 runner  staff  2376 Sep 24 13:50 eula-resources-template.xml
-rw-r--r--  1 runner  staff  1828 Sep 24 13:50 template.applescript
```

### releases (via curl)
```
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest/releases/releases#get-a-release-by-tag-name",
  "status": "404"
}

```
