# Arclend — Android app + Interval Alerts: Task Tracker

Two epics, delivered in full. This file is the living progress log — update it as
work proceeds. Branch: `feature/android-capacitor-alerts`.

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## Epic 1 — Capacitor Android wrapper (offline-safe, installable APK)

### 1a. Vendor CDN libraries locally  ✅
- [x] Download to `vendor/`: jQuery 3.7.1, Firebase 9.22.1 (`app-compat`,
      `database-compat`), Chart.js 4.5.1, Lucide UMD, Tailwind Play CDN
- [x] Repoint the 5 CDN references in `index.html` head to `vendor/...`

### 1b. Capacitor project + web-root assembly  ✅
- [x] Add deps (Capacitor 8.x): `@capacitor/core` `@capacitor/cli`
      `@capacitor/android` `@capacitor/local-notifications` `@capacitor/app`
- [x] `build:www` (scripts/build-www.js) assembles index.html + css/ + js/ +
      public/ + vendor/ into `www/`
- [x] `capacitor.config.json` (appId `com.arclend.app`, appName `Arclend`,
      webDir `www`); `npx cap add android` → both plugins detected
- [x] `.gitignore`: added `www/`, `android/`, `.gradle`

### 1c. Native config + API fix  ✅
- [x] `API_BASE` + `apiUrl()` in `js/app.js`; `send-welcome` fetch skips safely
      on native until API_BASE is set (relative path breaks under
      `capacitor://localhost`) — **TODO(user): set API_BASE to your Vercel URL**
- [x] Runtime notification permission handled in `js/alerts.js`
      (`ensurePermission`, requested on first alert create + before scheduling)
- [x] App name "Arclend" + branded launcher icons for all densities
      (regenerate with: `npx @capacitor/assets generate --android`, source in
      `assets/icon.png`)

### 1d. Build the debug APK
- [x] Gradle distribution pre-fetched locally (`android/gradle-dist/`) — the
      wrapper's online fetch timed out in this environment
- [x] **Build with JDK 21+** (`/c/Program Files/Java/jdk-22`) — Capacitor 8
      compiles at Java source 21; Android Studio's JBR 17 fails with
      `invalid source release: 21`
- [~] `gradlew assembleDebug` → `app-debug.apk` (rebuilding with JDK 22)

## Epic 2 — Freeform interval-alert system (on-device local notifications)

### 2a. Data model + persistence  ✅
- [x] `userData/<uid>/alerts`: `{ id, title, message, date, startTime, endTime,
      intervalMinutes, enabled, createdAt }` (notification ids tracked
      device-side in localStorage, not Firebase)
- [x] `saveAlertsToFirebase` + `addAlert`/`updateAlert`/`toggleAlert`/
      `deleteAlert`; alerts listener wired into `loadUserData()`

### 2b. UI  ✅
- [x] "Alerts" nav entry (bell) + page (list, enable/disable, edit, delete)
- [x] New/edit alert form: title, message, date, start/end time, interval; live
      "≈N reminders" preview; web platform banner

### 2c. Scheduling engine (`js/alerts.js`)  ✅
- [x] `computeFireTimes(alert)` — step date+startTime by interval to endTime,
      drop past times; `previewCount`/`totalCount` for UI
- [x] Schedule/cancel via reconcile on every alert change (Firebase listener)
- [x] Reconcile on launch + `App` resume (RTDB is source of truth; ids tracked
      in localStorage so no write-back loop)
- [x] Native-guarded (`Capacitor.isNativePlatform()`); web UI still functions;
      high-importance notification channel `arclend-alerts`

## Epic 3 — Verification
- [x] Web: server serves app + all vendored assets (200); `alerts.js` pure
      scheduling math unit-tested in Node — **11/11 pass** (`computeFireTimes`,
      `totalCount`, past-drop, ordering)
- [x] Native (Pixel_7_Pro_API_36 emulator, Android 16):
  - [x] APK installs; app launches; WebView loads **all 10 bundled assets** via
        `capacitor://localhost` (offline bundling confirmed) — no JS/asset errors
  - [x] Demo login → dashboard renders with branded mobile header
  - [x] Alerts page: form, live "≈7 reminders" preview, create → toast → list
        card "5 left today"
  - [x] Scheduling engine registered **5 real RTC_WAKEUP AlarmManager alarms**
        (13/15/17/19/21:00), past times (09/11:00) correctly dropped; via
        Capacitor `TimedNotificationPublisher`; POST_NOTIFICATIONS granted
  - [x] **Notification actually fired** at the 13:00 alarm: system posted
        `NotificationRecord pkg=com.arclend.app` title/text "Pay-reminder-test"
        on channel `arclend-alerts`, and it appeared in the notification shade
        ("Arclend • now"). Tapping opens the app.

## Status: ✅ BOTH EPICS COMPLETE & VERIFIED ON DEVICE

---

## Epic 4 — Follow-ups (notifications reliability + manual update prompt)

### 4a. Notification reliability & diagnosis  ✅
- [x] Alerts page shows a **notification status card**: "on/off", **Enable**
      button (requests permission + reschedules), **Send test** (fires in ~5s)
- [x] `USE_EXACT_ALARM` + `SCHEDULE_EXACT_ALARM` in manifest → exact alarms fire
      in Doze; battery-optimisation guidance in the UI + `ANDROID.md`
- [x] Verified on emulator: "Send test" posted "Arclend test" notification

### 4b. Manual in-app update prompt  ✅
- [x] `js/update.js`: on launch/resume (native), compares app `versionCode`
      (`@capacitor/app`) with Firebase `appConfig/latest.versionCode`; shows an
      "Update available" popup (version, notes, Later/Update)
- [x] Update button opens `apkUrl` via `@capacitor/browser` (verified: launches
      browser to the download URL)
- [x] Firebase `appConfig/latest` reset to baseline (versionCode 1) after test
- [x] Release workflow documented in `ANDROID.md`

### 4c. Signed release  ✅
- [x] Rebuilt signed `app-release.apk` (4.0 MB, v2 signature) with 4a+4b
- Distributable copy: `Arclend-release.apk` at repo root

---

## Notes / decisions
- Notifications: **local only** (no FCM/push) — appear in the tray like a normal app.
- Alerts: **freeform** (title/date/window/interval), not loan-due-date-derived.
- Libraries: **bundled locally** for offline launch.
- Tailwind Play CDN vendored locally works offline but isn't production-optimized;
  optional later swap to a compiled Tailwind build.
- Firebase RTDB still needs network to *sync*; "offline launch" = UI shell loads,
  not data sync.
- Build with Android Studio's bundled JBR to avoid the JDK 22 / Gradle mismatch.

## Next (optional follow-ups — core work is done)
- Set `API_BASE` in `js/app.js` to your Vercel URL so the welcome email sends
  from the native app (signup already works without it).
- Commit the branch `feature/android-capacitor-alerts` and merge when ready.
- Optional polish: custom small notification icon; swap Tailwind Play CDN for a
  compiled build; add a signed release APK (`assembleRelease` + keystore).
- Build artifact: `android/app/build/outputs/apk/debug/app-debug.apk` (5.1 MB).
