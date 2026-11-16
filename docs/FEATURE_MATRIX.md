# Feature matrix — audited source vs published baseline

Baseline `1eecadb` / published v2.0.0. Current preview2.1.1 is published from28d6622; verification run43857954333 passed Windows/web/Docker/publication-readback. v2.0.0 remains latest stable.

|Capability|Baseline|Audited source / evidence / remaining limit|
|---|---|---|
|60 lessons,12 modules,300 questions|Present structurally|All60 agent-reviewed with worked cases/summaries;45 later depth extensions;26-source registry mapped to60 lessons. Independent professional review/learner validation open|
|60 lesson activities and daily missions|Present|Preserved; bounds/shared validation added; completion remains self-reviewed|
|Lesson circular notes editor|Present; encrypted IndexedDB|Title-adjacent44px target; lazy modal, autosave/search/timestamps/status; account-isolated native/API SQLite with restart tests|
|Quizzes, sequential unlocking, mistake review|Present|84 revised items; historical version1 wording/grades and active drafts retained; retries use2.50 tests/22 browser paths;109 length cues remain moderation candidates|
|12 worked module projects and capstone|Present|2.2.0 source:12 expanded guides,60 worked mini-projects,3 complete27-field cases/12 stages, queued autosave, safe append transfer, report/portfolio/backup export. Existing IDs/credit retained. No instructor grading; see PROJECT_LEARNING.md and exact-source evidence|
|Accounts/login/logout/password change|Renderer/Dexie|Main/API authority; encrypted per-user SQLite; idle/absolute expiry and password-version revocation|
|Profile and explicit user switching|Display name not editable|Arabic profile controls; stable login identity; authenticated update; lock/logout before next login; backend and both browser editions tested|
|SQLite persistence/migrations|Missing|Schema1, app identity, WAL/FULL, integrity checks, actual rollback/reopen/corruption tests|
|Legacy progress preservation|IDB schema1–3 and MVP claim|Authenticated IDB→SQLite transfer, readback inside transaction, collision rejection, source retained; synthetic fixture verified in Electron|
|Renderer-safe IPC|No native data API|Nine allowlisted commands, sandbox/context isolation, main-frame/origin checks, no key/SQL/path exposure|
|Docker web/API|Static nginx only|Optional same-engine API with HttpOnly sessions and durable volume; original static profile retained|
|Concurrent save safety|IDB transactions|Explicit scoped repository transactions, owner checks, revision compare-and-swap, stale/late response tests|
|Validated encrypted backup/restore|Present|Shared frontend/backend schemas; owner-scoped atomic restore, legacy input compatibility, bounded size|
|Responsive RTL/motion/accessibility|Present|Existing keyboard, mobile, dark/light, reduced-motion and axe browser checks retained; no screen-reader certification|
|Portable Windows packaging|Published2.0.0|Actual2.1.1 Windows EXE/SQLite/migration/restart passed run43857954333; publicly published, downloaded and SHA256/source-commit verified. Preview/unsigned|
|CI/CD and release proofs|Present|Exact-source Windows/web/Docker + explicit preview publication job and published-asset readback passed; stable professional claims gated separately|
|Independent Arabic instructional approval|Not performed|Open. No claim of advanced certification or professional human review|
|Full GitHub admin-settings audit|Partial access|Public visibility authorized; rulesets empty. Actions permission settings/main protection/secret-name endpoints returned403; unverified|


Interface revision adds `/library` (60 lessons/15 references with type/module/query and private-note search) and `/stats` (real attempt/activity/project/note/completion records). Shared responsive light/dark RTL design and restrained CSS motion apply across existing learning/work/account screens. See UI_DESIGN.md and final CI evidence in AI_PROGRESS.md.


Interactive revision: every lesson now has6 saved activities (360), with12 reusable families including guide/match/order/blank/branches and studios. Quiz drafts/retry rounds preserve all300 question IDs/keys and attempts; due-date review derives from real errors. Baghdad missions remain stable after refresh/progress updates and now autosave drafts. Confirmed studio transfers write actual portfolio fields without changing unrelated fields. See INTERACTION_MATRIX.md and INTERACTIVE_LEARNING.md; completion of open-ended workshops is explicitly self-reviewed, not independent certification.

Editorial revision (verification pending):45 later lessons now have original additional explanations and worked cases/summaries;10 foundational cases have solutions and module3 depth is retained. All60 lessons have bounded source mappings and simulated-example labels.84 question revisions retain original history through explicit assessment versions. The registry and UI disclose agent review and the absence of independent human approval. Counts do not close G12; actual technical evidence must be recorded after final tests/CI.

Guide-v1 compatibility patch2.1.1: immutable baseline completion counts retain previously earned activity credit; appended paragraphs are optional guided depth with real saved acknowledgements. All50 tests and22 browser paths passed locally, including old3-step guide restore/reopen. No learner records or IDs are rewritten. Native Linux restart/migration passed again. Exact-source Windows/Docker/prerelease verification follows; previous2.1.0 preview is retained with a compatibility notice.
