# Security/reliability hardening —2.2.1

Baseline: released2.2.0 source9121cb1; its real Windows/web/Docker/publication evidence is retained in PROJECT_LEARNING_VERIFICATION.json. This phase does not overwrite existing databases, schema1, account IDs, origin, passwords or progress. Desktop still uses bundled SQLite/IPC and never requires Docker.

## Findings and corrections

- Static API host checked lexical paths but followed filesystem symlinks. A locally planted link inside the distribution could disclose files readable by the process outside it. This requires control of distribution files, not merely submitting lesson text. Canonical real paths now must remain inside the canonical static root. A real temporary-file/symlink regression verifies403. This does not claim protection against a privileged process racing filesystem mutations.
- Direct API JSON responses lacked anti-framing/referrer headers (nginx already supplied them). Added DENY, no-referrer and restrictive JSON CSP while retaining no-store/nosniff. Tested on the real HTTP server.
- Rate-limit responses lacked retry guidance; now send Retry-After60, preserving existing registration/authentication throttles.
- Backup decryption accepted an unbounded phrase before key derivation; now validates12–128 characters, matching backup creation. Existing valid archives remain compatible.
- Expanded the full60-lesson quiz/practice completion browser path to disable networking after service-worker readiness. Existing offline12-module, mini-project/capstone/export, notes and activity persistence paths remain.

## Reviewed boundaries

Native authority uses PBKDF2-HMAC-SHA256600000 with random salts, constant-time verifier comparison, random data keys/AES-GCM authenticated encrypted records, owner-bound AAD, idle30min/absolute12h sessions and password-version invalidation. Existing tests exercise actual crypto, isolation, stale owners, logout/password change races, SQLite rollback/reopen/corruption, schema identity and non-destructive legacy migration. No password hashes were weakened or bulk-rewritten.

Electron has sandbox/context isolation, no renderer Node, nine allowlisted commands, trusted main-frame/origin validation, payload limits, main-process tokens, permission denial, webview/window restrictions, HTTPS host allowlist and restrictive CSP. Existing actual native smoke tests verify renderer isolation/external-fetch blocking and restart/migration. User notes/assignments render as React text; Markdown exports are text downloads with fixed filenames, not raw HTML execution. Backup import is size/schema/version/ID bounded and transactionally scoped to its captured authenticated repository; exported archives do not contain login passwords or live sessions. Local-account backup is not cloud synchronization.

Compose publishes only127.0.0.1:8080 by default, exposes no host API port, uses a named data volume, non-root/read-only services, dropped capabilities, no-new-privileges and image healthchecks. No secret is embedded in Compose; passwords and sessions remain runtime data. Container restarts invalidate memory-only sessions and require login; durable learning state survives. Host administrators can inspect/replace files; encryption does not defend a compromised running OS. Do not delete the data volume to upgrade.

## Verification and honest limits

Actual results are appended below after execution. Existing2.2.0 Windows evidence is historical, not proof of this new revision. CI must build/test a fresh Windows EXE and Docker image from the exact new source. No physical Windows update from every prior release, power-cut recovery, independent penetration test, every screen reader, or every one of360 activity input combinations is claimed. All content/activities are bundled; browser/API deployment accounts still require their server, whereas standalone Electron works offline. Independent instructional review remains separate and open.


## Verified security checkpoint2.2.1

Source f846b96d118ff161019825b065ec390a70fd3e18; run43900670375 passed Windows, web/Docker and publication/readback.59 unit/integration tests per OS and25 browser paths passed. Full60-lesson quiz/practice and12-module paths ran offline after cache readiness. Actual built Windows EXE retained encrypted SQLite/profile/note/timestamp/activity/project state across restart and legacy source remained intact. Docker built successfully and passed health/read-only/non-root/capability/security/header checks and API-restart persistence. API/browser encrypted restore and invalid-backup preservation passed; a separate-host Docker volume disaster-restore was not performed.

Published [v2.2.1 Preview](https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/tag/v2.2.1). All4 assets downloaded anonymously; SHA256/GitHub asset digests and source ZIP commit comment matched. Source filename scan excluded PDFs/databases/env files. Production advisories0; tooling2 low/9 moderate/0 high/critical. No known critical/high release-blocking issue within this reviewed scope. Windows is unsigned. Physical version-to-version updates, power-cut testing, independent penetration testing and every activity combination remain unverified. See SECURITY_VERIFICATION.json for exact proof.
