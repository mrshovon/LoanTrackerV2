// js/alerts.js — on-device scheduling for custom interval alerts.
//
// Each enabled alert definition (a date + an active window + an interval) is
// expanded into a set of local notifications that fire on the phone throughout
// that day. Uses Capacitor Local Notifications on native. On the web this is a
// no-op for scheduling — the alerts management UI still works in a browser, but
// a web page cannot post background OS notifications, so nothing is scheduled.
//
// Firebase holds only the alert *definition*. The concrete notification ids are
// device-specific, so we track them here in localStorage (keyed per user) and
// reconcile the device schedule against window.app.alerts whenever alerts change
// or the app resumes.

(function () {
    'use strict';

    var Cap = window.Capacitor;
    var IS_NATIVE = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
    var LocalNotifications = (Cap && Cap.Plugins && Cap.Plugins.LocalNotifications) || null;
    var AppPlugin = (Cap && Cap.Plugins && Cap.Plugins.App) || null;
    var CHANNEL_ID = 'arclend-alerts';
    var MAX_PER_ALERT = 90; // safety cap on notifications scheduled for one alert

    // Stable non-negative base id per alert (Capacitor ids must be 32-bit ints).
    function hashId(str) {
        var h = 0;
        for (var i = 0; i < str.length; i++) {
            h = ((h << 5) - h + str.charCodeAt(i)) | 0;
        }
        return Math.abs(h) % 1000000; // 0..999,999 -> *100 leaves room for <100/alert
    }

    // --- device-local tracking of scheduled notification ids -----------------
    function schedKey() {
        var uid = (window.app && window.app.currentUser && window.app.currentUser.uid) || 'anon';
        return 'arclend_alert_sched_' + uid;
    }
    function readTracked() {
        try { return JSON.parse(localStorage.getItem(schedKey()) || '{}'); }
        catch (e) { return {}; }
    }
    function writeTracked(map) {
        try { localStorage.setItem(schedKey(), JSON.stringify(map)); } catch (e) { /* ignore */ }
    }

    // --- fire-time computation (also used by the UI preview) -----------------
    // Returns an array of future Date objects: from date+startTime, stepping by
    // intervalMinutes up to and including endTime, dropping times already past.
    function computeFireTimes(alert) {
        var out = [];
        if (!alert || !alert.date || !alert.startTime || !alert.endTime) return out;
        var interval = Number(alert.intervalMinutes) || 60;
        if (interval < 1) interval = 1;

        var dp = String(alert.date).split('-').map(Number);      // [Y,M,D]
        var sp = String(alert.startTime).split(':').map(Number); // [h,m]
        var ep = String(alert.endTime).split(':').map(Number);   // [h,m]
        if (dp.length < 3 || sp.length < 2 || ep.length < 2) return out;
        if (dp.some(isNaN) || sp.some(isNaN) || ep.some(isNaN)) return out;

        var start = new Date(dp[0], dp[1] - 1, dp[2], sp[0], sp[1], 0, 0);
        var end = new Date(dp[0], dp[1] - 1, dp[2], ep[0], ep[1], 0, 0);
        if (end.getTime() < start.getTime()) return out;

        var now = Date.now();
        var t = start.getTime();
        var endMs = end.getTime();
        var step = interval * 60000;
        var guard = 0;
        while (t <= endMs && guard < 1000) {
            if (t > now) out.push(new Date(t));
            t += step;
            guard++;
        }
        return out;
    }

    // Reminders that would still fire from now (used by the form preview).
    function previewCount(alert) {
        return computeFireTimes(alert).length;
    }

    // Total reminders across the whole window ignoring "now" — useful when the
    // user is composing a future-dated alert and wants the full count.
    function totalCount(alert) {
        if (!alert || !alert.startTime || !alert.endTime) return 0;
        var interval = Number(alert.intervalMinutes) || 60;
        if (interval < 1) interval = 1;
        var sp = String(alert.startTime).split(':').map(Number);
        var ep = String(alert.endTime).split(':').map(Number);
        if (sp.length < 2 || ep.length < 2 || sp.some(isNaN) || ep.some(isNaN)) return 0;
        var startMin = sp[0] * 60 + sp[1];
        var endMin = ep[0] * 60 + ep[1];
        if (endMin < startMin) return 0;
        return Math.floor((endMin - startMin) / interval) + 1;
    }

    // --- native plumbing -----------------------------------------------------
    function ensurePermission() {
        if (!IS_NATIVE || !LocalNotifications) return Promise.resolve(false);
        return LocalNotifications.checkPermissions().then(function (res) {
            if (res && res.display === 'granted') return true;
            return LocalNotifications.requestPermissions().then(function (r) {
                return !!(r && r.display === 'granted');
            });
        }).catch(function () { return false; });
    }

    function ensureChannel() {
        if (!IS_NATIVE || !LocalNotifications || !LocalNotifications.createChannel) {
            return Promise.resolve();
        }
        return LocalNotifications.createChannel({
            id: CHANNEL_ID,
            name: 'Arclend Alerts',
            description: 'Custom interval reminders',
            importance: 5,   // heads-up with sound
            visibility: 1
        }).catch(function () { /* channel may already exist */ });
    }

    var reconciling = false;
    var reconcileQueued = false;

    // Cancel everything we previously scheduled on this device, then reschedule
    // every currently-enabled alert that still has future fire times. Idempotent
    // and native-guarded; writes only to localStorage so it never loops back
    // through the Firebase alerts listener that calls it.
    function reconcile() {
        if (!IS_NATIVE || !LocalNotifications) return Promise.resolve();
        if (reconciling) { reconcileQueued = true; return Promise.resolve(); }
        reconciling = true;

        return ensureChannel().then(ensurePermission).then(function (granted) {
            var tracked = readTracked();
            var toCancel = [];
            Object.keys(tracked).forEach(function (aid) {
                (tracked[aid] || []).forEach(function (nid) { toCancel.push({ id: nid }); });
            });
            var cancelP = toCancel.length
                ? LocalNotifications.cancel({ notifications: toCancel }).catch(function () {})
                : Promise.resolve();

            return cancelP.then(function () {
                if (!granted) { writeTracked({}); return; }

                var newMap = {};
                var toSchedule = [];
                var alerts = (window.app && window.app.alerts) || [];
                alerts.forEach(function (alert) {
                    if (!alert || alert.enabled === false) return;
                    var times = computeFireTimes(alert);
                    if (!times.length) return;
                    var base = hashId(String(alert.id)) * 100;
                    var ids = [];
                    times.forEach(function (when, i) {
                        if (i >= MAX_PER_ALERT) return;
                        var nid = base + i;
                        ids.push(nid);
                        toSchedule.push({
                            id: nid,
                            title: alert.title || 'Reminder',
                            body: alert.message || alert.title || 'Reminder',
                            channelId: CHANNEL_ID,
                            schedule: { at: when, allowWhileIdle: true }
                        });
                    });
                    if (ids.length) newMap[alert.id] = ids;
                });

                var scheduleP = toSchedule.length
                    ? LocalNotifications.schedule({ notifications: toSchedule }).catch(function (e) {
                        console.warn('Alert scheduling failed:', e);
                      })
                    : Promise.resolve();

                return scheduleP.then(function () { writeTracked(newMap); });
            });
        }).catch(function (e) {
            console.warn('Alert reconcile error:', e);
        }).then(function () {
            reconciling = false;
            if (reconcileQueued) { reconcileQueued = false; return reconcile(); }
        });
    }

    // Current notification permission: 'granted' | 'denied' | 'prompt' | 'unsupported'.
    function getPermissionState() {
        if (!IS_NATIVE || !LocalNotifications) return Promise.resolve('unsupported');
        return LocalNotifications.checkPermissions()
            .then(function (res) { return (res && res.display) || 'prompt'; })
            .catch(function () { return 'prompt'; });
    }

    // Ask for permission and, if granted, immediately (re)schedule existing alerts.
    // Used by the "Enable notifications" button so alerts created before the grant
    // get scheduled without waiting for the next resume/restart.
    function requestAndReconcile() {
        return ensurePermission().then(function (granted) {
            if (granted) return reconcile().then(function () { return true; });
            return false;
        });
    }

    // Fire a one-off notification a few seconds out so the user can confirm
    // notifications actually work on their device (and trigger the permission
    // prompt). Resolves { ok, reason }.
    function sendTestNotification() {
        if (!IS_NATIVE || !LocalNotifications) {
            return Promise.resolve({ ok: false, reason: 'web' });
        }
        return ensureChannel().then(ensurePermission).then(function (granted) {
            if (!granted) return { ok: false, reason: 'denied' };
            var when = new Date(Date.now() + 5000);
            return LocalNotifications.schedule({
                notifications: [{
                    id: 1999999999,
                    title: 'Arclend test',
                    body: 'Notifications are working. Your alerts will appear like this.',
                    channelId: CHANNEL_ID,
                    schedule: { at: when, allowWhileIdle: true }
                }]
            }).then(function () { return { ok: true, reason: 'scheduled' }; })
              .catch(function (e) {
                  console.warn('Test notification failed:', e);
                  return { ok: false, reason: 'error' };
              });
        });
    }

    // --- public API ----------------------------------------------------------
    window.ArclendAlerts = {
        isNative: IS_NATIVE,
        computeFireTimes: computeFireTimes,
        previewCount: previewCount,
        totalCount: totalCount,
        reconcile: reconcile,
        requestPermission: ensurePermission,
        requestAndReconcile: requestAndReconcile,
        getPermissionState: getPermissionState,
        sendTestNotification: sendTestNotification
    };

    // Reconcile on cold start (covers reboot/reinstall clearing the OS schedule)
    // and whenever the app returns to the foreground.
    if (IS_NATIVE) {
        ensureChannel();
        if (AppPlugin && AppPlugin.addListener) {
            AppPlugin.addListener('resume', function () { reconcile(); });
        }
        // Give app.js a tick to log in / populate app.alerts, then sync.
        setTimeout(function () { reconcile(); }, 1500);
    }
})();
