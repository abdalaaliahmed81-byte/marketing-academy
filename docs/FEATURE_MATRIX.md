# Feature matrix — audited source vs published baseline

Baseline `1eecadb` / published v2.0.0. Current preview2.2.0 is published from9121cb1; verification run43868000336 passed Windows/web/Docker/publication-readback. v2.0.0 remains latest stable.

|Capability|Baseline|Audited source / evidence / remaining limit|
|---|---|---|
|60 lessons,12 modules,300 questions|Present structurally|All60 agent-reviewed with worked cases/summaries;45 later depth extensions;26-source registry mapped to60 lessons. Independent professional review/learner validation open|
|60 lesson activities and daily missions|Present|Preserved; bounds/shared validation added; completion remains self-reviewed|
|Lesson circular notes editor|Present; encrypted IndexedDB|Title-adjacent44px target; lazy modal, autosave/search/timestamps/status; account-isolated native/API SQLite with restart tests|
|Quizzes, sequential unlocking, mistake review|Present|84 revised items; historical version1 wording/grades and active drafts retained; retries use2.57 tests/25 browser paths;109 length cues remain moderation candidates|
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
|Portable Windows packaging|Published2.0.0|Actual2.2.0 Windows EXE/SQLite/project-autosave/migration/restart passed run43868000336; publicly published, downloaded and SHA256/source-commit verified. Preview/unsigned|
|CI/CD and release proofs|Present|Exact-source Windows/web/Docker + explicit preview publication job and published-asset readback passed; stable professional claims gated separately|
|Independent Arabic instructional approval|Not performed|Open. No claim of advanced certification or professional human review|
|Full GitHub admin-settings audit|Partial access|Public visibility authorized; rulesets empty. Actions permission settings/main protection/secret-name endpoints returned403; unverified|


Interface revision adds `/library` (60 lessons/15 references with type/module/query and private-note search) and `/stats` (real attempt/activity/project/note/completion records). Shared responsive light/dark RTL design and restrained CSS motion apply across existing learning/work/account screens. See UI_DESIGN.md and final CI evidence in AI_PROGRESS.md.


Interactive revision: every lesson now has6 saved activities (360), with12 reusable families including guide/match/order/blank/branches and studios. Quiz drafts/retry rounds preserve all300 question IDs/keys and attempts; due-date review derives from real errors. Baghdad missions remain stable after refresh/progress updates and now autosave drafts. Confirmed studio transfers write actual portfolio fields without changing unrelated fields. See INTERACTION_MATRIX.md and INTERACTIVE_LEARNING.md; completion of open-ended workshops is explicitly self-reviewed, not independent certification.

Editorial revision (verification pending):45 later lessons now have original additional explanations and worked cases/summaries;10 foundational cases have solutions and module3 depth is retained. All60 lessons have bounded source mappings and simulated-example labels.84 question revisions retain original history through explicit assessment versions. The registry and UI disclose agent review and the absence of independent human approval. Counts do not close G12; actual technical evidence must be recorded after final tests/CI.

Guide-v1 compatibility patch2.1.1: immutable baseline completion counts retain previously earned activity credit; appended paragraphs are optional guided depth with real saved acknowledgements. All50 tests and22 browser paths passed locally, including old3-step guide restore/reopen. No learner records or IDs are rewritten. Native Linux restart/migration passed again. Exact-source Windows/Docker/prerelease verification follows; previous2.1.0 preview is retained with a compatibility notice.

Project learning2.2.0 final verification:57 tests per OS/25 browser paths, Windows portable EXE and Docker restart persistence passed exact source9121cb1. All4 public assets anonymously downloaded and SHA256/source archive comment matched.12 module roundtrips and mini-project/capstone export run offline; independent beginner learner validation remains open. See PROJECT_LEARNING_VERIFICATION.json.


## Verified security checkpoint2.2.1

Source f846b96d118ff161019825b065ec390a70fd3e18; run43900670375 passed Windows, web/Docker and publication/readback.59 unit/integration tests per OS and25 browser paths passed. Full60-lesson quiz/practice and12-module paths ran offline after cache readiness. Actual built Windows EXE retained encrypted SQLite/profile/note/timestamp/activity/project state across restart and legacy source remained intact. Docker built successfully and passed health/read-only/non-root/capability/security/header checks and API-restart persistence. API/browser encrypted restore and invalid-backup preservation passed; a separate-host Docker volume disaster-restore was not performed.

Published [v2.2.1 Preview](https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/tag/v2.2.1). All4 assets downloaded anonymously; SHA256/GitHub asset digests and source ZIP commit comment matched. Source filename scan excluded PDFs/databases/env files. Production advisories0; tooling2 low/9 moderate/0 high/critical. No known critical/high release-blocking issue within this reviewed scope. Windows is unsigned. Physical version-to-version updates, power-cut testing, independent penetration testing and every activity combination remain unverified. See SECURITY_VERIFICATION.json for exact proof.


Final QA completed: source2682e2d/run43902315808,59 tests per OS/25 browser paths, fresh Windows EXE/Linux Electron restart+migration and Docker build/health/security/restart PASS. Safety lint84 files PASS; fixed source-link checker omission and locally verified31 endpoints HTTP200. FINAL_QA.md/FINAL_QA_RESULTS.json classify every check PASS/FAIL/NOT RUN;109 assessment cues remain unmoderated and human instructional/novice validation remains NOT RUN. Technical tests do not close professional approval. No application/data/grading changes;2.2.1 release history retained.


## Verified portable delivery2.2.2

[Marketing-Academy-Portable-Windows-x64.exe](https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/download/v2.2.2/Marketing-Academy-Portable-Windows-x64.exe) is published in [v2.2.2 Preview](https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/tag/v2.2.2), exact source80b8af4dffdcea56ad8bbc20fe4620e12fe96c48/[run43905101635](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43905101635). All3 jobs passed:59 tests per OS/25 browser paths, actual normal Windows ShellExecute with no application arguments/visible responding Arabic window and a system-only PATH; actual shipped EXE registration/note/offline quiz+lesson completion/restart/new-account isolation/legacy migration. SQLite schema1, three synthetic accounts/14 encrypted records. Renderer remains sandboxed and external fetch blocked; Docker remains optional and its tests passed independently.

EXE112414596 bytes, SHA256c0f78f378061c3e3f682f25326d0688f3ccc5d6689780299ea53ef59ad4e5a46. Outer MZ/PE and inner x64 PE verified. Independently downloaded all5 public assets anonymously, matched GitHub digests and all4 checksum entries; source ZIP commit comment and bounded forbidden-file check passed. START_AR.md in release matches both source/bundled guide copies. See WINDOWS_PORTABLE_VERIFICATION.json and START_AR.md. Existing releases, app identity/userData/schema/IDs remain unchanged.

This is actual Windows execution, not just source compilation. The Actions runner contains developer tools for automation; the app child PATH deliberately excludes them. It is still not a pristine consumer PC or a manual Explorer double-click/hardware/all-policy/antivirus/physical-update test. EXE unsigned; SmartScreen/unknown-publisher warning possible. No claim of independent instructional/learner validation or professional approval; working preview retained separately from stable2.0.0.


Dual Windows2.3.0 delivered from7c8ed9d/run43930298980:60 tests per OS/25 browser paths, both actual EXE normal-start/lifecycle checks and concurrent profile/unchanged-Production-DB verification passed. All6 release assets re-downloaded via authorized connection and SHA256/PE/source-comment checked. Production data identity preserved; QA isolated; both unsigned and professional/physical-machine limits remain open. See DUAL_WINDOWS.md and DUAL_WINDOWS_VERIFICATION.json. Existing repository/history retained, no new repository.


Latest verified2.4.0 recovery/Unicode delivery: exact0d0c0c5/run43953301188, all3 jobs PASS,70 tests per OS/27 browser paths/Docker/both actual Production+QA Windows EXEs/concurrent isolation and6-asset re-download/checksum readback PASS. AUTH_RECOVERY_VERIFICATION.json is the newest evidence; AUTH_AUDIT_VERIFICATION.json remains immutable2.3.1 baseline proof. Secure backup-assisted recovery creates a new account and preserves the original; Arabic combining names and long Unicode passwords corrected. Schema1 and existing learner data preserved. G12 independent human review/learner validation and pristine physical-device/manual-click acceptance remain OPEN/NOT RUN. Earlier counts/pending statements above are historical, not latest verification.
