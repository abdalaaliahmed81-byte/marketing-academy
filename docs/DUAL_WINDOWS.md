# Production and isolated QA Windows delivery

Continue the existing project/history. Production retains `com.marketingacademy.desktop`, `academy://app`, existing package name/userData, schema1 and learner IDs. QA is an additional packaged variant, not a reset or replacement of Production.

|Variant|EXE|Identity|Persistent data|
|---|---|---|---|
|Production|Marketing-Academy-Portable-Windows-x64.exe|com.marketingacademy.desktop|Existing Electron userData location unchanged|
|QA|Marketing-Academy-QA-Windows-x64.exe|com.marketingacademy.desktop.qa|appData/marketing-academy-qa; browser storage under its chromium subfolder|

QA uses immutable packaged `electron/flavor.json`; filename changes and command-line channel selection do not choose the storage profile. A named QA window and persistent Arabic QA banner identify the test app before/after login. No Node integration, remote backend or relaxed IPC/security setting is added. Nine storage commands remain; one read-only trusted-main-frame IPC endpoint exposes only the packaged channel, not keys, SQL, paths or credentials.

Each profile has a separate SQLite file, Chromium/IndexedDB/local storage/cache and single-instance lock. The same login name can exist independently in both. Both can run concurrently. Production data is never automatically imported into QA; intentional backup import copies data only into the current profile/account. Use synthetic QA accounts/archives; importing a personal backup deliberately creates a copy of that personal data in QA. Local accounts do not cloud-sync.

`ACADEMY_TEST_DATA_DIR` remains a lifecycle-test override. Production uses the fixture root, while QA appends marketing-academy-qa even under the SAME override. This permits an automated same-root isolation test without opening a real user's database. Production default session location is untouched; QA explicitly pins sessionData to its own subfolder before app readiness/locking.

## Build and evidence

`npm run package:windows:dual` builds Production once, then stages the same dist/backend/Electron code into ignored work/qa-package with a QA marker/package identity and its own build output. All application dependencies are already bundled; the QA staging manifest requires no separate runtime npm packages. The original source marker remains production. No mutable shared stage is read by the running EXEs.

Windows CI must test normal no-argument startup for BOTH EXEs under a system-only child PATH, run the full native registration/notes/offline quiz+lesson/restart/account-isolation/legacy-migration smoke on EACH, then execute both simultaneously. The dual test uses identical login names, distinct saved notes, process restarts and a SHA256 comparison of the closed Production database before/after QA writes. PE/x64 payload, file sizes, separate checksums/source archive and published-asset readback are required. Only successful same-run evidence can authorize publication.

Local Linux Electron tests are development evidence, not Windows EXE proof. No pristine consumer-PC/manual Explorer double-click/every-OS/physical update/power-cut claim follows from CI. Both EXEs are unsigned; SmartScreen/enterprise-policy restrictions may apply. Production denotes the normal user data profile, not independent professional approval of educational content; the open human/learner review gates remain open.
