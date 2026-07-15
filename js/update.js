// js/update.js — manual in-app update prompt for the Android app.
//
// You control releases from Firebase: set the node `appConfig/latest` to
//   { versionCode: <int>, versionName: "1.1", apkUrl: "<download link>",
//     notes: "what changed", mandatory: false }
// On launch (native only) the app compares its own versionCode (from the APK)
// with appConfig/latest.versionCode. If Firebase is higher, it shows a
// "new version available" popup with an Update button that opens apkUrl so the
// user can download and install the new APK. Bump versionCode in
// android/app/build.gradle for each release and set the same number in Firebase.

(function () {
    'use strict';

    var Cap = window.Capacitor;
    var IS_NATIVE = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
    var AppPlugin = (Cap && Cap.Plugins && Cap.Plugins.App) || null;
    var Browser = (Cap && Cap.Plugins && Cap.Plugins.Browser) || null;

    var dismissedFor = null; // versionCode the user tapped "Later" on this session

    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function openUrl(url) {
        if (!url) return;
        if (Browser && Browser.open) {
            Browser.open({ url: url }).catch(function () {
                try { window.open(url, '_blank'); } catch (e) { /* ignore */ }
            });
        } else {
            try { window.open(url, '_blank'); } catch (e) { /* ignore */ }
        }
    }

    function closeModal() {
        var el = document.getElementById('arclendUpdateModal');
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    function showUpdateModal(cfg) {
        if (document.getElementById('arclendUpdateModal')) return;
        var mandatory = cfg.mandatory === true;
        var overlay = document.createElement('div');
        overlay.id = 'arclendUpdateModal';
        overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4';
        overlay.innerHTML =
            '<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">' +
              '<div class="flex items-center gap-3">' +
                '<div class="p-2.5 bg-blue-100 dark:bg-blue-900 rounded-full">' +
                  '<i data-lucide="download" class="w-6 h-6 text-blue-600 dark:text-blue-300"></i>' +
                '</div>' +
                '<div>' +
                  '<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Update available</h3>' +
                  (cfg.versionName ? '<p class="text-sm text-gray-500 dark:text-gray-400">Version ' + esc(cfg.versionName) + '</p>' : '') +
                '</div>' +
              '</div>' +
              (cfg.notes ? '<p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">' + esc(cfg.notes) + '</p>' : '') +
              '<p class="text-xs text-gray-400 dark:text-gray-500">Tap Update to download the new version, then open it to install.</p>' +
              '<div class="flex justify-end gap-2 pt-1">' +
                (mandatory ? '' : '<button id="arclendUpdateLater" class="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Later</button>') +
                '<button id="arclendUpdateNow" class="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"><i data-lucide="download" class="w-4 h-4"></i>Update</button>' +
              '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        if (window.lucide && lucide.createIcons) lucide.createIcons();

        var later = document.getElementById('arclendUpdateLater');
        if (later) later.addEventListener('click', function () {
            dismissedFor = parseInt(cfg.versionCode, 10) || 0;
            closeModal();
        });
        var now = document.getElementById('arclendUpdateNow');
        if (now) now.addEventListener('click', function () {
            openUrl(cfg.apkUrl);
            if (!mandatory) closeModal();
        });
    }

    function check() {
        // `database` is a top-level `const` in index.html's head script; top-level
        // const doesn't attach to window, so reference the shared global binding.
        var db = (typeof database !== 'undefined' && database) ? database : (window.database || null);
        if (!IS_NATIVE || !AppPlugin || !db) return;
        AppPlugin.getInfo().then(function (info) {
            var current = parseInt(info.build, 10) || 0;
            db.ref('appConfig/latest').once('value').then(function (snap) {
                var cfg = snap.val();
                if (!cfg) return;
                var latest = parseInt(cfg.versionCode, 10) || 0;
                if (latest > current && latest !== dismissedFor) {
                    showUpdateModal(cfg);
                }
            }).catch(function (e) { console.warn('Update check failed:', e); });
        }).catch(function () { /* App plugin unavailable */ });
    }

    // --- "Download Android app" button (web only) ---------------------------
    var DEFAULT_APK_URL = 'https://github.com/mrshovon/LoanTrackerV2/raw/master/releases/Arclend.apk';

    function getDb() {
        return (typeof database !== 'undefined' && database) ? database : (window.database || null);
    }

    // Open the latest published APK for download. Prefers appConfig/latest.apkUrl,
    // falls back to the canonical master URL.
    function download() {
        var db = getDb();
        if (!db) { openUrl(DEFAULT_APK_URL); return; }
        db.ref('appConfig/latest').once('value')
            .then(function (snap) { openUrl((snap.val() || {}).apkUrl || DEFAULT_APK_URL); })
            .catch(function () { openUrl(DEFAULT_APK_URL); });
    }

    // Wire the download buttons on web; hide them inside the native app (it's
    // already installed there).
    function initDownloadUI() {
        var els = document.querySelectorAll('.arclend-download');
        if (IS_NATIVE) {
            els.forEach(function (el) { el.style.display = 'none'; });
            return;
        }
        var db = getDb();
        if (db) {
            db.ref('appConfig/latest').once('value').then(function (snap) {
                var cfg = snap.val() || {};
                var label = document.getElementById('downloadAppVersion');
                if (label && cfg.versionName) label.textContent = '(v' + cfg.versionName + ')';
            }).catch(function () { /* leave label empty */ });
        }
    }

    window.ArclendUpdate = { check: check, download: download };

    initDownloadUI();

    if (IS_NATIVE) {
        // Give Firebase a moment to connect, then check; re-check on resume.
        setTimeout(check, 3000);
        if (AppPlugin && AppPlugin.addListener) {
            AppPlugin.addListener('resume', function () { setTimeout(check, 800); });
        }
    }
})();
