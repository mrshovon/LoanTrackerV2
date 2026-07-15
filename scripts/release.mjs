// One-command release for the Arclend Android app.
//
//   npm run release -- <versionName> "<notes>" [--mandatory]
//   e.g. npm run release -- 1.1 "• Faster alerts\n• Bug fixes"
//
// It bumps the version, builds a signed release APK, replaces the single
// committed artifact releases/Arclend.apk, updates the Firebase node that drives
// the in-app "Update available" popup, then commits and pushes to master.
//
// Requirements on this machine (already set up): a JDK 21+, the Android SDK, and
// the signing keystore referenced by android/keystore.properties.

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, copyFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// --- config -----------------------------------------------------------------
const DATABASE_URL = 'https://loantracker-35688-default-rtdb.asia-southeast1.firebasedatabase.app';
const GITHUB_REPO = 'mrshovon/LoanTrackerV2';
const RELEASE_BRANCH = 'master';                 // raw URL branch (no slashes!)
const JAVA_HOME = process.env.JAVA_HOME || 'C:\\Program Files\\Java\\jdk-22';
const BUILD_GRADLE = join(root, 'android', 'app', 'build.gradle');
const RELEASES_DIR = join(root, 'releases');
const CANONICAL_APK = join(RELEASES_DIR, 'Arclend.apk');
// Tracked version source of truth (android/ is git-ignored, so build.gradle can't
// be committed). This file records the published version and is committed each release.
const LATEST_JSON = join(RELEASES_DIR, 'latest.json');
const BUILT_APK = join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

// --- args --------------------------------------------------------------------
const argv = process.argv.slice(2);
const mandatory = argv.includes('--mandatory');
const positional = argv.filter((a) => !a.startsWith('--'));
const versionName = positional[0];
const notes = (positional[1] || '').replace(/\\n/g, '\n');

if (!versionName) {
    console.error('Usage: npm run release -- <versionName> "<notes>" [--mandatory]');
    console.error('Example: npm run release -- 1.1 "• Faster alerts\\n• Bug fixes"');
    process.exit(1);
}

function step(msg) { console.log(`\n▶ ${msg}`); }
// shell:true so Windows .cmd/.bat launchers (npx, gradlew) spawn correctly.
function run(cmd, args, opts = {}) {
    return execFileSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true, ...opts });
}

// --- 1. bump version in build.gradle ----------------------------------------
step('Bumping version in android/app/build.gradle');
if (!existsSync(BUILD_GRADLE)) {
    console.error(`Missing ${BUILD_GRADLE}. Run "npx cap add android" first.`);
    process.exit(1);
}
// Version source of truth is releases/latest.json (tracked); fall back to
// build.gradle for the very first release, then to 0.
let oldCode = 0;
if (existsSync(LATEST_JSON)) {
    try { oldCode = parseInt(JSON.parse(readFileSync(LATEST_JSON, 'utf8')).versionCode, 10) || 0; } catch { /* ignore */ }
}
let gradle = readFileSync(BUILD_GRADLE, 'utf8');
if (!oldCode) {
    const m = gradle.match(/versionCode\s+(\d+)/);
    oldCode = m ? parseInt(m[1], 10) : 0;
}
const newCode = oldCode + 1;
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
writeFileSync(BUILD_GRADLE, gradle);
console.log(`  versionCode ${oldCode} → ${newCode}, versionName "${versionName}"`);

// --- 2. build signed release APK --------------------------------------------
step('Building signed release APK');
run('node', ['scripts/build-www.js']);
run('npx', ['cap', 'copy', 'android']);
const gradlew = process.platform === 'win32'
    ? join(root, 'android', 'gradlew.bat')
    : join(root, 'android', 'gradlew');
run(gradlew, ['assembleRelease', '--no-daemon', '--console=plain'], {
    cwd: join(root, 'android'),
    env: { ...process.env, JAVA_HOME }
});
if (!existsSync(BUILT_APK)) { console.error(`Build did not produce ${BUILT_APK}`); process.exit(1); }

// --- 3. replace the single committed artifact --------------------------------
step('Replacing releases/Arclend.apk');
if (!existsSync(RELEASES_DIR)) mkdirSync(RELEASES_DIR, { recursive: true });
for (const f of readdirSync(RELEASES_DIR)) {
    if (f.toLowerCase().endsWith('.apk')) rmSync(join(RELEASES_DIR, f));
}
copyFileSync(BUILT_APK, CANONICAL_APK);
console.log(`  → ${CANONICAL_APK}`);

// --- 4. update the Firebase version node -------------------------------------
step('Updating Firebase appConfig/latest');
const apkUrl = `https://github.com/${GITHUB_REPO}/raw/${RELEASE_BRANCH}/releases/Arclend.apk?v=${newCode}`;
const payload = { versionCode: newCode, versionName, apkUrl, notes, mandatory };
// Record the published version in a tracked file (committed below).
writeFileSync(LATEST_JSON, JSON.stringify(payload, null, 2) + '\n');
const res = await fetch(`${DATABASE_URL}/appConfig/latest.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});
if (!res.ok) {
    console.error(`  Firebase update failed (HTTP ${res.status}). Set appConfig/latest manually:`);
    console.error('  ' + JSON.stringify(payload));
} else {
    console.log('  ' + JSON.stringify(payload));
}

// --- 5. commit + push --------------------------------------------------------
// Only tracked files (android/ is git-ignored). versionCode lives in the tracked
// releases/latest.json, so build.gradle never needs committing.
step('Committing and pushing');
let committed = false, pushed = false;
try {
    run('git', ['add', 'releases/Arclend.apk', 'releases/latest.json']);
    execSync(`git commit -m "Release v${versionName} (versionCode ${newCode})"`, { cwd: root, stdio: 'inherit' });
    committed = true;
} catch (e) {
    console.error('  git commit failed:', e.message);
}
if (committed) {
    try {
        run('git', ['push', 'origin', RELEASE_BRANCH]);
        pushed = true;
    } catch (e) {
        console.error(`  git push failed — run "git push origin ${RELEASE_BRANCH}" yourself.`);
    }
}

// --- summary -----------------------------------------------------------------
console.log(`\n✅ Released v${versionName} (versionCode ${newCode})`);
console.log(`   APK URL: ${apkUrl}`);
console.log(`   Firebase appConfig/latest updated${res.ok ? '' : ' — FAILED, set manually'}.`);
console.log(`   Git commit ${committed ? 'done' : 'FAILED'}; push ${pushed ? 'done' : 'PENDING (push manually)'}.`);
if (pushed) console.log('   Users on older versions will see the update popup on next launch (allow ~5 min for GitHub CDN).');
