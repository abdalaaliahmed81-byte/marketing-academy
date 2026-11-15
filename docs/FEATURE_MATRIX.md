# Feature matrix — audited source vs published baseline

Baseline `1eecadb` / published v2.0.0. Branch implements2.1.0; this matrix does not change the existing release binary.

|Capability|Baseline|Audited source / evidence / remaining limit|
|---|---|---|
|60 lessons,12 modules,300 questions|Present structurally|Preserved; module3 five readings/cases/summaries deepened.45 later lessons still flagged; CONTENT_MATRIX regenerated. Professional review open|
|60 lesson activities and daily missions|Present|Preserved; bounds/shared validation added; completion remains self-reviewed|
|Lesson circular notes editor|Present; encrypted IndexedDB|Title-adjacent44px target; lazy modal, autosave/search/timestamps/status; account-isolated native/API SQLite with restart tests|
|Quizzes, sequential unlocking, mistake review|Present|Stable IDs/scoring retained; domain regressions pass. Assessment editorial flags remain|
|12 worked module projects and capstone|Present|Preserved;26 portfolio fields and saved/exported submissions. No instructor grading|
|Accounts/login/logout/password change|Renderer/Dexie|Main/API authority; encrypted per-user SQLite; idle/absolute expiry and password-version revocation|
|Profile and explicit user switching|Display name not editable|Arabic profile controls; stable login identity; authenticated update; lock/logout before next login; backend and both browser editions tested|
|SQLite persistence/migrations|Missing|Schema1, app identity, WAL/FULL, integrity checks, actual rollback/reopen/corruption tests|
|Legacy progress preservation|IDB schema1–3 and MVP claim|Authenticated IDB→SQLite transfer, readback inside transaction, collision rejection, source retained; synthetic fixture verified in Electron|
|Renderer-safe IPC|No native data API|Nine allowlisted commands, sandbox/context isolation, main-frame/origin checks, no key/SQL/path exposure|
|Docker web/API|Static nginx only|Optional same-engine API with HttpOnly sessions and durable volume; original static profile retained|
|Concurrent save safety|IDB transactions|Explicit scoped repository transactions, owner checks, revision compare-and-swap, stale/late response tests|
|Validated encrypted backup/restore|Present|Shared frontend/backend schemas; owner-scoped atomic restore, legacy input compatibility, bounded size|
|Responsive RTL/motion/accessibility|Present|Existing keyboard, mobile, dark/light, reduced-motion and axe browser checks retained; no screen-reader certification|
|Portable Windows packaging|Published2.0.0|Version-aware CI/launcher; actual2.1.0 EXE SQLite/migration/restart passed in run43749095271; locally verified digests. Unreleased/unsigned|
|CI/CD and release proofs|Present|Extended SQLite/API/restart gates; pinned actions, source guard, checksums, exact-commit publication|
|Independent Arabic instructional approval|Not performed|Open. No claim of advanced certification or professional human review|
|Full GitHub admin-settings audit|Partial access|Public visibility authorized; rulesets empty. Actions permission settings/main protection/secret-name endpoints returned403; unverified|


Interface revision adds `/library` (60 lessons/15 references with type/module/query and private-note search) and `/stats` (real attempt/activity/project/note/completion records). Shared responsive light/dark RTL design and restrained CSS motion apply across existing learning/work/account screens. See UI_DESIGN.md and final CI evidence in AI_PROGRESS.md.


Interactive revision: every lesson now has6 saved activities (360), with12 reusable families including guide/match/order/blank/branches and studios. Quiz drafts/retry rounds preserve all300 question IDs/keys and attempts; due-date review derives from real errors. Baghdad missions remain stable after refresh/progress updates and now autosave drafts. Confirmed studio transfers write actual portfolio fields without changing unrelated fields. See INTERACTION_MATRIX.md and INTERACTIVE_LEARNING.md; completion of open-ended workshops is explicitly self-reviewed, not independent certification.
