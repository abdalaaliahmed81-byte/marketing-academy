# AI progress and resume record

## Current execution —2026-11-15

Task: full accessible technical/educational audit and necessary architecture implementation. Baseline `1eecadbf3e1811e31dc2eafe274487ecb8a15e57` / published v2.0.0. Branch `audit/sqlite-architecture`; source version2.1.0 is unreleased. The public repository is authorized by the user. All source and3 supplied PDFs/ZIP were accessible; real learner profiles were not supplied.

Completed: created six requested documents; read/file-hashed and syntax-inventoried accessible sources; inspected routes/components/crypto/backups/dependencies/Docker/build/GitHub configuration; produced60-row educational matrix and PDF/reference metadata. Implemented trusted SQLite account/record engine, narrow Electron IPC, same-engine optional HTTP API, transport-neutral UI operations, atomic revision repository, authenticated non-destructive IDB migration and expanded security/regression checks. Existing lessons, IDs and legacy source stores remain intact.

## Executed checks

|Command / evidence|Observed result|
|---|---|
|Baseline `npm run check`|18 tests passed before architecture changes|
|Current `npm test`|32 tests passed across7 files, including actual SQLite rollback/reopen/isolation/corruption and concurrent password-change interleaving|
|`npm run typecheck` and `npm run build`|Passed; Vite warns about the large bundled JS chunk|
|`npm run test:e2e`|12/12 passed:9 retained learning/accessibility/offline/project paths +3 API isolation/outage/late-response paths|
|`node scripts/desktop-smoke.mjs` on local Linux Electron|Passed real SQLite registration/restart/login/note, no renderer Node APIs, blocked external fetch, synthetic legacy-IDB migration with unchanged source fingerprint;2 accounts/9 encrypted records/schema1|
|`node scripts/audit-dependencies.mjs`|Production0; full tooling2 low/9 moderate/0 high/0 critical|
|`node scripts/check-source.mjs`|Passed bounded books/databases/private-key/token filename/pattern guard|
|`npm run audit:project`|60 lessons/300 questions;50 short/generated-case/repeated-summary lessons,37 distractor flags and118 longest-correct cues. Not professional approval|
|`node scripts/audit-project.mjs --check-links`|15 reference/publisher URLs HTTP200, with actual redirect destinations recorded; claim-level completeness not verified|
|Docker new API profile|Build/run/restart smoke being finalized; do not infer pass until evidence below is updated|
|Built Windows portable EXE for2.1.0|CI execution pending; previous v2.0.0 success is not evidence for SQLite changes|

The managed Docker host's VFS storage initially filled its disk; failed task build caches and disposable dependency/download caches were removed, without deleting learner data/volumes. Dockerfile layers were reduced and npm cache cleared in its build layer. Local proxy CA is supplied only as a BuildKit secret for this environment; no TLS bypass or CA is committed.

## Open findings and limits

Educational E01–E05 remain open: advanced lesson depth, independent cases/summaries, assessment moderation, precise source mapping, qualified independent Arabic review. No false professional-review or accreditation claim. No external security test/screen-reader user review, full container OS scan or broad performance/device coverage. EXE unsigned. GitHub admin read endpoints returned403; settings remain unverified. Published v2.0.0 and its release assets are unchanged; no new release is published by this audit.

## Resume rules

Read git status, this file and AUDIT.md before edits. Continue this branch, do not restart/replace the app. Keep `academy://app`, app ID, lesson/question/option IDs and userData location. Never delete learner IDB/SQLite to fix an error. Use temporary synthetic fixture databases and never upload them/PDFs/extracts/secrets. Keep migrations transactional and sources recoverable. A semantic quiz correction needs content versioning/history preservation. Record actual checks and exact CI/source commits; only publish with RELEASE_GATES evidence. Do not require the user to run routine developer commands.
