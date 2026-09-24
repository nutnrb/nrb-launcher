## Bundle inspection

Platform: `macos-latest`  Target: `aarch64-apple-darwin`  Run: `36009508785`  SHA: `43dc2acacdf9031bf439291ac639cb0985aaeb67`

### tauri version
```

> nrb-launcher@0.1.0 tauri /Users/runner/work/nrb-launcher/nrb-launcher
> tauri --version
```

### bundle target tree
```
src-tauri/target/aarch64-apple-darwin/release
src-tauri/target/aarch64-apple-darwin/release/bundle
src-tauri/target/release
```

### bundle files (msi, exe, nsis, deb, AppImage, app, dmg, pkg)
```
find: -printf: unknown primary or operator
```

### bundle dir listing
```
total 0
drwxr-xr-x   5 runner  staff  160 Sep 24 14:01 .
drwxr-xr-x  13 runner  staff  416 Sep 24 14:01 ..
drwxr-xr-x   5 runner  staff  160 Sep 24 14:02 dmg
drwxr-xr-x   4 runner  staff  128 Sep 24 14:02 macos
drwxr-xr-x   3 runner  staff   96 Sep 24 14:01 share

src-tauri/target/aarch64-apple-darwin/release/bundle/dmg:
total 14536
drwxr-xr-x  5 runner  staff      160 Sep 24 14:02 .
drwxr-xr-x  5 runner  staff      160 Sep 24 14:01 ..
-rwxrwxrwx  1 runner  staff    19300 Sep 24 14:01 bundle_dmg.sh
-rw-r--r--@ 1 runner  staff  7038031 Sep 24 14:02 NRB Launcher_0.1.0_aarch64.dmg
-rw-r--r--  1 runner  staff   379633 Sep 24 14:01 NRB Launcher.icns

src-tauri/target/aarch64-apple-darwin/release/bundle/macos:
total 13528
drwxr-xr-x  4 runner  staff      128 Sep 24 14:02 .
drwxr-xr-x  5 runner  staff      160 Sep 24 14:01 ..
drwxr-xr-x  3 runner  staff       96 Sep 24 14:01 NRB Launcher.app
-rw-r--r--  1 runner  staff  6924497 Sep 24 14:02 NRB Launcher.app.tar.gz

src-tauri/target/aarch64-apple-darwin/release/bundle/macos/NRB Launcher.app:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 14:01 .
drwxr-xr-x  4 runner  staff  128 Sep 24 14:02 ..
drwxr-xr-x  5 runner  staff  160 Sep 24 14:01 Contents

src-tauri/target/aarch64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents:
total 8
drwxr-xr-x  5 runner  staff   160 Sep 24 14:01 .
drwxr-xr-x  3 runner  staff    96 Sep 24 14:01 ..
-rw-r--r--  1 runner  staff  1071 Sep 24 14:01 Info.plist
drwxr-xr-x  3 runner  staff    96 Sep 24 14:01 MacOS
drwxr-xr-x  3 runner  staff    96 Sep 24 14:01 Resources

src-tauri/target/aarch64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents/MacOS:
total 43408
drwxr-xr-x  3 runner  staff        96 Sep 24 14:01 .
drwxr-xr-x  5 runner  staff       160 Sep 24 14:01 ..
-rwxr-xr-x  1 runner  staff  22221392 Sep 24 14:01 nrb-launcher

src-tauri/target/aarch64-apple-darwin/release/bundle/macos/NRB Launcher.app/Contents/Resources:
total 744
drwxr-xr-x  3 runner  staff      96 Sep 24 14:01 .
drwxr-xr-x  5 runner  staff     160 Sep 24 14:01 ..
-rw-r--r--  1 runner  staff  379633 Sep 24 14:01 NRB Launcher.icns

src-tauri/target/aarch64-apple-darwin/release/bundle/share:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 14:01 .
drwxr-xr-x  5 runner  staff  160 Sep 24 14:01 ..
drwxr-xr-x  3 runner  staff   96 Sep 24 14:01 create-dmg

src-tauri/target/aarch64-apple-darwin/release/bundle/share/create-dmg:
total 0
drwxr-xr-x  3 runner  staff   96 Sep 24 14:01 .
drwxr-xr-x  3 runner  staff   96 Sep 24 14:01 ..
drwxr-xr-x  4 runner  staff  128 Sep 24 14:01 support

src-tauri/target/aarch64-apple-darwin/release/bundle/share/create-dmg/support:
total 16
drwxr-xr-x  4 runner  staff   128 Sep 24 14:01 .
drwxr-xr-x  3 runner  staff    96 Sep 24 14:01 ..
-rw-r--r--  1 runner  staff  2376 Sep 24 14:01 eula-resources-template.xml
-rw-r--r--  1 runner  staff  1828 Sep 24 14:01 template.applescript
```

### releases (via curl)
```
{"message":"API rate limit exceeded for 13.105.117.137. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)","documentation_url":"https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"}

```
