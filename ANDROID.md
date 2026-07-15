# Arclend on Android (Capacitor)

The web app is wrapped as a native Android app with [Capacitor](https://capacitorjs.com/).
All web libraries are vendored into `vendor/` so the app launches without a
network connection. Custom alerts are delivered as **on-device local
notifications** — they appear in the phone's notification tray, fire at the
interval you set across the day you choose, and work with no server.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html`, `css/`, `js/`, `public/` | the web app (unchanged flow) |
| `vendor/` | locally-bundled jQuery, Firebase, Chart.js, Lucide, Tailwind |
| `js/alerts.js` | alert scheduling engine (local notifications) |
| `scripts/build-www.js` | assembles the web root into `www/` (Capacitor's `webDir`) |
| `capacitor.config.json` | appId `com.arclend.app`, appName `Arclend` |
| `android/` | generated native project (git-ignored) |
| `assets/icon.png` | source for the launcher icon |

## Prerequisites

- Node.js 18+
- Android Studio + Android SDK (an emulator or a USB device with USB debugging)
- **JDK 21 or newer** — Capacitor 8's `capacitor-android` compiles at Java
  source level 21. A JDK 22 works (it can target release 21). Note the JDK that
  Android Studio bundles at `…/Android Studio/jbr` is only 17 and will fail with
  `invalid source release: 21`.

## Build the debug APK

```bash
npm install
npm run build:www          # assemble www/ from the web sources
npx cap sync android       # copy web assets + native plugins into android/

# Build with a JDK 21+ (Capacitor 8 compiles at Java source level 21)
cd android
JAVA_HOME="/c/Program Files/Java/jdk-22" ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

Install on a connected device/emulator:

```bash
"$ANDROID_SDK_ROOT/platform-tools/adb" install -r \
  app/build/outputs/apk/debug/app-debug.apk
```

Or open the project in Android Studio and press **Run**:

```bash
npm run open:android
```

## Everyday workflow

After changing any web file, re-sync before rebuilding:

```bash
npm run sync:android       # build:www + cap sync android
```

A change to `index.html`/`css`/`js` is **not** live in an installed APK — the app
ships a snapshot baked in at build time. Re-sync + rebuild + reinstall to ship it.
(Firebase *data* still syncs live; only code is frozen per build.)

## Signed release APK (shareable / Play Store)

Signing keys live in `keystore/arclend-release.jks` and `android/keystore.properties`
— both **git-ignored**. `build.gradle` reads them for the `release` build type.

```bash
npm run sync:android
cd android
JAVA_HOME="/c/Program Files/Java/jdk-22" ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk  (signed)
```

**⚠ Back up `keystore/arclend-release.jks` and its password.** Lose them and you
can never ship an update that installs over an existing install (or update a
Play Store listing). The password lives only in `android/keystore.properties`
(git-ignored) — never commit it. To change it, regenerate the keystore
(`keytool -genkeypair …`) and update `android/keystore.properties`.

To regenerate the keystore from scratch:

```bash
keytool -genkeypair -v -keystore keystore/arclend-release.jks -alias arclend \
  -keyalg RSA -keysize 2048 -validity 10000
```

## Shipping an update (manual, with in-app prompt)

The installed app can't auto-update its code (it ships a snapshot). Instead it
shows a **"Update available"** popup driven by one Firebase node, so publishing an
update is: build a new APK, host it, bump one number.

**One-time:** host the APK somewhere with a direct-download URL (GitHub Releases,
Firebase Storage, your Vercel `public/`, etc.).

**Each release:**
1. Bump `versionCode` (and `versionName`) in `android/app/build.gradle`
   (`versionCode 2`, `versionName "1.1"`, …).
2. `npm run sync:android` + `assembleRelease` (see above) → new signed APK.
   **Sign every release with the same keystore** or it won't install over the old one.
3. Upload the new APK to your download URL.
4. In the **Firebase console → Realtime Database**, set `appConfig/latest`:
   ```json
   {
     "versionCode": 2,
     "versionName": "1.1",
     "apkUrl": "https://your-host/arclend-1.1.apk",
     "notes": "• What changed\n• Another line",
     "mandatory": false
   }
   ```
   Any installed app whose `versionCode` is lower shows the update popup on next
   launch/resume; tapping **Update** opens `apkUrl` to download + install.
   `mandatory: true` hides the "Later" button.

The popup logic lives in `js/update.js`; it reads the app's own `versionCode`
via `@capacitor/app` and compares it to `appConfig/latest`.

## If notifications don't arrive on a phone

Open the **Alerts** page — it shows a notification status card:
- **"Send test"** posts a notification in ~5s (quickest way to confirm they work).
- If it says **"Notifications are off"**, tap **Enable notifications** (or, if
  previously blocked, allow them in Settings → Apps → Arclend → Notifications).

Other causes on real (esp. Chinese-OEM) phones:
- **Battery optimisation** killing scheduled alarms → exclude Arclend
  (Settings → Apps → Arclend → Battery → Unrestricted).
- Reminders only fire at the **future interval times within the day/window** you
  set — creating an alert does not post an immediate one (use "Send test" for that).
- Exact alarms are enabled via `USE_EXACT_ALARM`/`SCHEDULE_EXACT_ALARM` so they
  fire on time even in Doze; the plugin also restores them after a reboot.

## Regenerate launcher icons

The Arclend icon is generated from `assets/icon.png` into all densities:

```bash
npx @capacitor/assets generate --android
```

## Notes / caveats

- **Welcome email on native:** signup's welcome email calls the Vercel
  `/api/send-welcome` endpoint. Inside the app the origin is
  `http(s)://localhost`, which has no `/api`, so set `API_BASE` in `js/app.js`
  to your deployed URL (e.g. `https://arclend.vercel.app`). Left blank, the
  email is skipped and **signup still works** — only the welcome mail is missed.
- **Notification permission** is requested at runtime on Android 13+ the first
  time you create an alert (and before each scheduling pass).
- **Exactness:** reminders use `allowWhileIdle` alarms. Without the
  `SCHEDULE_EXACT_ALARM` permission (not requested here) Android may fire them a
  few minutes off under Doze — fine for reminders. The plugin also restores
  scheduled notifications after a reboot (`RECEIVE_BOOT_COMPLETED`).
- **Offline:** the UI shell and libraries load offline; Firebase still needs a
  connection to *sync* loan/alert data.
- **Gradle distribution:** `android/gradle/wrapper/gradle-wrapper.properties`
  was pointed at a locally-downloaded Gradle zip
  (`android/gradle-dist/`) because the wrapper's online fetch timed out in this
  environment. To build elsewhere, restore the standard
  `distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-bin.zip`.
