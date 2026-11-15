# Feature matrix — audited source vs published baseline

Baseline `1eecadb` / published v2.0.0. Branch implements2.1.0; this matrix does not change the existing release binary.

|Capability|Baseline|Audited source / evidence / remaining limit|
|---|---|---|
|60 lessons,12 modules,300 questions|Present structurally|Preserved;60-row CONTENT_MATRIX and machine metrics. Advanced depth/professional review open|
|60 lesson activities and daily missions|Present|Preserved; bounds/shared validation added; completion remains self-reviewed|
|Lesson circular notes editor|Present; encrypted IndexedDB|Preserved; native/API encrypted SQLite with process/server restart evidence|
|Quizzes, sequential unlocking, mistake review|Present|Stable IDs/scoring retained; domain regressions pass. Assessment editorial flags remain|
|12 worked module projects and capstone|Present|Preserved;26 portfolio fields and saved/exported submissions. No instructor grading|
|Accounts/login/logout/password change|Renderer/Dexie|Main/API authority; encrypted per-user SQLite; idle/absolute expiry and password-version revocation|
|SQLite persistence/migrations|Missing|Schema1, app identity, WAL/FULL, integrity checks, actual rollback/reopen/corruption tests|
|Legacy progress preservation|IDB schema1–3 and MVP claim|Authenticated IDB→SQLite transfer, readback inside transaction, collision rejection, source retained; synthetic fixture verified in Electron|
|Renderer-safe IPC|No native data API|Seven allowlisted commands, sandbox/context isolation, main-frame/origin checks, no key/SQL/path exposure|
|Docker web/API|Static nginx only|Optional same-engine API with HttpOnly sessions and durable volume; original static profile retained|
|Concurrent save safety|IDB transactions|Explicit scoped repository transactions, owner checks, revision compare-and-swap, stale/late response tests|
|Validated encrypted backup/restore|Present|Shared frontend/backend schemas; owner-scoped atomic restore, legacy input compatibility, bounded size|
|Responsive RTL/motion/accessibility|Present|Existing keyboard, mobile, dark/light, reduced-motion and axe browser checks retained; no screen-reader certification|
|Portable Windows packaging|Published2.0.0|Version-aware CI/launcher and built-EXE SQLite/migration gates; see linked verification status in AI_PROGRESS|
|CI/CD and release proofs|Present|Extended SQLite/API/restart gates; pinned actions, source guard, checksums, exact-commit publication|
|Independent Arabic instructional approval|Not performed|Open. No claim of advanced certification or professional human review|
|Full GitHub admin-settings audit|Partial access|Public visibility authorized; rulesets empty. Actions permission settings/main protection/secret-name endpoints returned403; unverified|
