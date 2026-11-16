# Marketing Academy — technical and educational audit

Current delivery:2.1.1 Preview from28d6622, published and verified by run43857954333 plus anonymous local asset readback.50 tests/22 browser paths and actual Windows/Docker checks passed. All60 lessons have agent editorial/source remediation; independent instructional approval remains open. Historical findings below retain their original baseline scope. See EDITORIAL_VERIFICATION.json.

Audit baseline: `1eecadbf3e1811e31dc2eafe274487ecb8a15e57` / published `v2.0.0`. Audit started 2026-11-15. Branch: `audit/sqlite-architecture`. This record supersedes assumptions in earlier completion summaries; every conclusion is scoped to inspected evidence.

## Preservation boundary

The repository and the three supplied PDF books are accessible. The working tree was clean and matched origin/main at intake. No learner database is supplied by the user; accessible test databases are synthetic. Never infer that test data represents the user's real progress. Preserve the existing Electron origin `academy://app`, app ID, userData location, lesson IDs, v1/v2/v3 backup compatibility, and every legacy IndexedDB source. No proprietary book bytes or user databases enter Git, image contexts, source archives, or CI artifacts.

## Confirmed baseline findings

| ID | Severity / area | Evidence | Required action / status |
|---|---|---|---|
| T01 | High architecture gap | `src/auth.ts`, `src/db.ts`: Dexie/IndexedDB owns accounts and records; no SQLite code or DB schema | Implement SQLite authority outside renderer; authenticated, non-destructive migration |
| T02 | High deployment gap | Dockerfile is static nginx; compose has no API/database | Add optional same-origin API using the same SQLite engine; retain static PWA option |
| T03 | High trust boundary | Renderer owns credentials, data key, record validation and persistence; acceptable local-browser boundary but insufficient for a server API | Move native/API auth, authorization and durable commit into trusted host; narrow validated IPC |
| T04 | Medium persistence | Components directly use Dexie; useLiveQuery couples React to storage | Introduce repository contract and reactive read model with acknowledged commits |
| T05 | Medium backup consistency | Runtime write functions do not consistently apply the strict backup schema; mission checkbox indices and response limits can diverge from UI | Apply shared validation at write and trust boundaries; reject without destroying prior data |
| T06 | Medium packaging | Version2.0.0 is hardcoded in Windows CI and launcher; signing absent; native runtime compatibility untested for SQLite | Make artifact selection version-aware; test actual built EXE and SQLite file, including migration |
| T07 | Medium dependency risk | Previously recorded11 low/moderate build-tool advisories; audit must be rerun, not assumed current | Record complete and production graphs separately; prohibit high/critical and production vulnerabilities |
| E01 | High educational claim gap | Tests check counts/lengths; no independent expert review or learner validation | Distinguish structural completion from advanced instructional readiness |
| E02 | Medium depth | Later micro-lessons have 143–191 reading words; generated mini-cases reuse a quiz question and summaries repeat objectives | Mark per-lesson depth/case/summary limitations; avoid treating word count as a quality score |
| E03 | Medium assessment | Many distractors are unrelated/easily eliminated; all raw correct options start first (UI shuffles) | Review every item for plausibility and alignment; preserve IDs and historical scoring |
| E04 | Medium provenance | References often identify a topic/chapter or course portal rather than claim-level evidence; HTTP200 alone is insufficient | Produce60-row content matrix and source/PDF inventory; flag evidence depth |
| E05 | Medium evaluation | Practical/module/capstone completion is self-assessed; no instructor grading or accreditation | Keep rubric and self-review labels explicit; gate professional approval separately |

## Scope and evidence

The sections below record inventory, route/database maps, changed checks, dependencies, PDF scope and content metrics. An unexecuted check is not a pass. The published2.0.0 release remains intact during this audit; no new release is implied by this branch.

## Implemented disposition (2.1.0 source, unreleased)

T01–T04: addressed by the shared SQLite engine, memory repository, narrow Electron preload and optional same-origin API. T05: addressed by shared strict schemas, bounded unique rubric indices and runtime project/lesson validation. T06: version hardcodes removed from CI and launcher; actual built-EXE migration/SQLite evidence required. Signing remains absent and explicitly disclosed. T07: rerun production audit0; full tooling2 low/9 moderate/0 high/0 critical. These are residual build-tool findings, not a clean full dependency graph. No forced dependency update was used to conceal them.

Additional faults found and fixed during implementation:

- API tabs share HttpOnly cookies: stale Alice state could otherwise be written after a Bob login. Every authenticated request carries expected owner ID checked against the server session; cross-owner attempts reject. CAS revisions prevent lost writes between tabs of the same account.
- An old account's delayed commit response could invalidate the newly logged-in account. Session-invalid events are now owner-scoped; closed read models cannot publish late data. Browser regression exercises the delayed acknowledgement.
- Authentication performs asynchronous password hashing. A concurrent password change must invalidate the pre-change credential snapshot; login now rechecks password version/salt before creating a session. A deterministic interleaving test verifies it.
- Zod's runtime code-generation optimization conflicted with strict CSP under the real Electron migration fixture. Shared validation explicitly disables JIT rather than weakening script policy.
- Renderer state must not show a write before SQLite acknowledges it. Repository transactions clone a scoped view and publish only after success; injected SQL abort rolls back all rows, revision unchanged.
- API mode could silently revert to browser-local storage after server outage. Provider pinning now displays an Arabic retry error and preserves the original data location.
- Docker COPY file permissions also applied to a newly created parent directory, leaving the non-root API unable to traverse its bundle path. The bundle now copies into the existing application directory; the container smoke checks actual non-root startup and durable writes.
- New API deployment initially inherited UI text saying data was saved on the device. Save indicators now avoid that location claim and settings distinguish API connectivity from offline static/desktop use.
- Docker VFS in this managed test host exhausted its small disk with repeated dependency-containing COPY layers. Build copies source in one layer and clears npm cache in the dependency layer; temporary failed build cache was removed. No learner volume or legacy data was deleted.

E01–E05 remain **open quality findings**, not silently reclassified as completed content. No lesson/question/option IDs, historical correct answers, course sequencing or saved learner achievements were rewritten during this audit. A future content revision must version changed assessments and preserve historical attempts rather than rescoring them against a different key.

## Complete accessible-file and runtime scope

`AUDIT_INVENTORY.json` lists every accessible Git source file by byte length/SHA256 and syntax diagnostics. Machine inventory reads all tracked/untracked nonignored sources; manifests and lockfile are additionally consumed by type/build/dependency tools. Manual review concentrated on authentication/crypto, storage/transactions/migration/backup, every React view/route, schemas/domain/curriculum construction, Electron protocol/preload, API, Docker and CI/release scripts. This is not a claim of independent human line-by-line certification of every generated lock entry.

Actual UI routes are `/`, `/path`, `/lesson/:id/:section`, `/review/:module`, `/mission`, `/projects`, `/project`, `/settings` and a redirect fallback, under HashRouter. Existing UI includes account/onboarding, dashboard/path cards and circular note editor, reading/quiz/practice, module reviews, daily mission, module-project editor, capstone editor/export, settings/password/backup controls and shared dialogs/motion styles. HTTP and IPC maps and all database tables are documented in ARCHITECTURE.md.

Accessible databases were generated exclusively from synthetic fixtures: original MVP schema1, account IndexedDB schema1–3, and actual SQLite schema1 in Node, Electron and the optional API. No real learner database was supplied, so unseen user-profile recovery is unverified. No production database was reset or uploaded. The original ZIP, three PDFs and private extracts were inspected outside Git; inputs are reference material, not instructions overriding the user's request.

## Educational and source evidence

`CONTENT_MATRIX.md` covers every one of60 lessons; `CONTENT_METRICS.json` includes exact IDs, reference mappings, counts and item-level heuristic flags. Confirmed totals:12 modules,60 lessons,300 explained questions,60 practical activities and12 worked module projects; capstone26 fields. Presence does not establish advanced competence.

- 50 lessons contain under200 reading words, use a generated case that reuses quiz content, and repeat the objective as the summary. These are useful micro-lesson scaffolds, but do not meet the requested depth of a complete advanced professionally reviewed curriculum without further editorial work.
- 37 questions are flagged by a bounded unrelated-distractor heuristic, and118 have a uniquely longest correct response. These flags require item moderation; they do not prove that118 answers are wrong. Correct answers are first in raw data but options are shuffled by the UI; this was examined and is not logged as a display defect.
- Each lesson has an activity, daily mission and rubric. Most assessment is recognition/self-check; no instructor evaluation, transfer-of-learning study, learner pilot or independent Arabic instructional review was performed. Projects and worked numbers are explicitly simulations; recalculation tests verify selected arithmetic, not business outcomes.
- 15 official/publisher reference URLs returned HTTP200 on2026-11-15. The Google bulk-sender URL redirected from support.google.com/a to support.google.com/mail; keep resolved destination under editorial review. Generic course portals do not substantiate every technical claim. No dead URL was demonstrated by this check, and no platform claim is labeled outdated solely because its foundational book is older. Claim-level coverage and a scheduled update process remain open.
- PDF audit: «هذا هو التسويق»230 PDF pages; «كل المسوقون يسردون قصصا»144; «خطة تسويقية في صفحة واحدة»203. `PDF_AUDIT.json` records bytes/digests. Metadata, extraction, contents and topic-directed passages were inspected. This does not mean every page received expert instructional review. No copyrighted PDF/extract/page image is redistributed.

Before claiming advanced completion: expand the50 flagged readings with concrete decisions/edge cases; author independent transfer cases and useful summaries; moderate all300 questions with plausible same-domain distractors and rationale; provide claim-level official sources for platform-dependent guidance; review activities/projects against explicit performance criteria; obtain qualified independent Arabic review and learner feedback. Preserve IDs/progress and version semantic assessment changes. These are release-readiness actions, not work claimed as done by this audit.

## Security, supply-chain and packaging residuals

Encryption protects saved learning content but not a compromised OS, unlocked session, developer-tool attacker or malicious same-origin code. Renderer memory necessarily contains current learner content; main-process/session keys are not renderer storage. Indexed usernames/record IDs are visible metadata. Use OS account separation/disk encryption for stronger device protection. No independent penetration test was performed.

Windows EXE is unsigned; reputation prompts remain possible. Windows x64 CI covers its runner, not every physical device or ARM64. Docker base tags are floating (resolved digests visible in build logs); no full OS-image vulnerability scan/SBOM or broad capacity benchmark was performed. Vite emits an approximately863kB JS bundle/chunk-size warning; code splitting and large-history performance are follow-up work. Snapshot validation and IPC/API commits are bounded at9MB learner plaintext /10MB request, not unbounded storage. Encryption export rejects oversized data before creating an unrestorable file.

The optional API has exact-origin/JSON/custom-header checks, HttpOnly SameSiteStrict cookies, Secure cookies for HTTPS, private owner checks, rate/body/time limits and non-loopback TLS-origin requirements. Compose binds loopback by default; remote TLS termination and operational backups remain operator responsibilities. Rate budgets are shared behind nginx's direct peer. Server restart invalidates in-memory sessions and requires login; database progress is durable. Static PWA and EXE retain offline learning independently; API mode requires a reachable server and does not promise offline writes.

## GitHub access and publication

Repository visibility is public under the user's explicit permission to continue as-is. Source/actions/releases are accessible. Rulesets endpoint returned an empty array. Admin endpoints for Actions settings, main protection and signing-secret names returned403 (`GITHUB_AUDIT.json`); this is an access limitation, not evidence that those controls/secrets are absent. No token or secret values were requested or exported. Current workflows pin actions by SHA, avoid persisted checkout credentials, default to contents:read and restrict release writes to the publication job.

This audit preserves v2.0.0 and does not publish a new2.1.0 release. Exact build/run evidence and final statuses are maintained in AI_PROGRESS.md; do not infer CI success from configuration files or local passes alone.


## Final executed technical evidence

Both jobs passed in [GitHub run43749095271](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43749095271), source `484c80a136b5544ae11d777e6bec5abf08f3bd83`.32 unit/integration tests passed on Linux and Windows;12 Chromium paths passed; the non-root/read-only Docker API retained its note after restart. The built portable Windows EXE ran registration/login, note persistence across process restart and authenticated legacy migration; SQLite schema1 contained2 fixture accounts/9 encrypted records, and original legacy ciphertext was unchanged. The x64 payload PE header was verified. Downloaded the CI Windows artifact and independently recomputed its EXE/source-archive digests; both matched SHA256SUMS. [AUDIT_VERIFICATION.json](AUDIT_VERIFICATION.json) records exact provenance and limits.

Follow-up changes after this source proof are documentation/evidence only; existing release remains v2.0.0. The audit is complete within accessible scope, while G12 educational readiness and G14 inaccessible admin-setting assurance remain open. No2.1.0 release or public web deployment is claimed. CI additionally warns that the SHA-pinned actions use Node20 and are forced to Node24, and ubuntu-latest is transitioning runner images; refresh/test action pins and choose an explicit runner image in a future infrastructure change. This did not fail the verified jobs and is not a claim of broad runner compatibility.

## Editorial remediation —2026-11-16 (supersedes earlier content counts)

E02:45 short later lessons expanded with topic-specific procedures, counterexamples, Iraqi simulated worked cases and independent summaries;10 foundational cases now include solutions; module3 expansion preserved. Actual audit now0 short(<200-word) lessons/0 quiz-reuse cases/0 goal-copy summaries. E03:84 items revised, including44 contextual applications and corrections to an ambiguous SEO item/funnel denominator/unit-cost prompt. Original questions preserved with version-aware history/draft validation.0 unrelated-distractor heuristic flags;109 longest-answer cues remain **review candidates**, not a proof of invalidity or a validated psychometric outcome. E04:26-entry registry and60 bounded lesson mappings integrated into references UI; specific official documentation scopes/rights recorded. Catalogues with unestablished permission are navigation-only, not evidence for platform claims. See SOURCE_REGISTRY.md.

This closes the identified agent-authored depth/case/source-remapping backlog within its stated scope. E01/E05 and qualified independent Arabic review/learner validation remain open. Agent moderation is not instructor or legal certification. Old audit observations remain historical; this amendment does not claim every assertion has an external citation or all references/rights have universal clearance. Auth/account/data architecture and published release remain unchanged. Initial test-harness/import-attribute failures and final verification are recorded in AI_PROGRESS.md; do not infer new Windows/EXE/Docker success from older evidence.

## Project learning follow-up —2.2.0 source

The2.1.1 checkpoint contained12 worked projects and60 assignments, but module/capstone edits required manual save, guides lacked explicit prerequisite/material/mistake sections, and capstone competitor analysis had no dedicated field. Added the PBL model/UI described in PROJECT_LEARNING.md while preserving worked artifacts, original rubrics and credit. Account-isolated SQLite/backup architecture is reused; no destructive migration or dependency addition. New synthetic tests cover credit retention, atomic append rollback, restore and source-owner isolation. Browser export test initially found a duplicate settings-link accessible name; the new backup link now has a distinct descriptive name. A currency sensitivity test found binary fractional drift; multiplication by110/100 yields exact integer dinar case results. Independent learner validation remains open.

Project-learning final execution: source9121cb1/[run43868000336](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43868000336) passed57 tests per OS,25 browser paths, actual portable Windows project-autosave/restart/migration, Docker health/security/module+capstone restart and published-asset readback. All4 assets downloaded anonymously; SHA256 and source ZIP commit comment verified locally. Detailed scoped evidence and the failed-rate-limit/cancelled-intermediate history are retained in PROJECT_LEARNING_VERIFICATION.json and QA.md. Independent novice/human instructional validation remains open.


## Verified security checkpoint2.2.1

Source f846b96d118ff161019825b065ec390a70fd3e18; run43900670375 passed Windows, web/Docker and publication/readback.59 unit/integration tests per OS and25 browser paths passed. Full60-lesson quiz/practice and12-module paths ran offline after cache readiness. Actual built Windows EXE retained encrypted SQLite/profile/note/timestamp/activity/project state across restart and legacy source remained intact. Docker built successfully and passed health/read-only/non-root/capability/security/header checks and API-restart persistence. API/browser encrypted restore and invalid-backup preservation passed; a separate-host Docker volume disaster-restore was not performed.

Published [v2.2.1 Preview](https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/tag/v2.2.1). All4 assets downloaded anonymously; SHA256/GitHub asset digests and source ZIP commit comment matched. Source filename scan excluded PDFs/databases/env files. Production advisories0; tooling2 low/9 moderate/0 high/critical. No known critical/high release-blocking issue within this reviewed scope. Windows is unsigned. Physical version-to-version updates, power-cut testing, independent penetration testing and every activity combination remain unverified. See SECURITY_VERIFICATION.json for exact proof.


Final QA completed: source2682e2d/run43902315808,59 tests per OS/25 browser paths, fresh Windows EXE/Linux Electron restart+migration and Docker build/health/security/restart PASS. Safety lint84 files PASS; fixed source-link checker omission and locally verified31 endpoints HTTP200. FINAL_QA.md/FINAL_QA_RESULTS.json classify every check PASS/FAIL/NOT RUN;109 assessment cues remain unmoderated and human instructional/novice validation remains NOT RUN. Technical tests do not close professional approval. No application/data/grading changes;2.2.1 release history retained.


## Verified portable delivery2.2.2

[Marketing-Academy-Portable-Windows-x64.exe](https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/download/v2.2.2/Marketing-Academy-Portable-Windows-x64.exe) is published in [v2.2.2 Preview](https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/tag/v2.2.2), exact source80b8af4dffdcea56ad8bbc20fe4620e12fe96c48/[run43905101635](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43905101635). All3 jobs passed:59 tests per OS/25 browser paths, actual normal Windows ShellExecute with no application arguments/visible responding Arabic window and a system-only PATH; actual shipped EXE registration/note/offline quiz+lesson completion/restart/new-account isolation/legacy migration. SQLite schema1, three synthetic accounts/14 encrypted records. Renderer remains sandboxed and external fetch blocked; Docker remains optional and its tests passed independently.

EXE112414596 bytes, SHA256c0f78f378061c3e3f682f25326d0688f3ccc5d6689780299ea53ef59ad4e5a46. Outer MZ/PE and inner x64 PE verified. Independently downloaded all5 public assets anonymously, matched GitHub digests and all4 checksum entries; source ZIP commit comment and bounded forbidden-file check passed. START_AR.md in release matches both source/bundled guide copies. See WINDOWS_PORTABLE_VERIFICATION.json and START_AR.md. Existing releases, app identity/userData/schema/IDs remain unchanged.

This is actual Windows execution, not just source compilation. The Actions runner contains developer tools for automation; the app child PATH deliberately excludes them. It is still not a pristine consumer PC or a manual Explorer double-click/hardware/all-policy/antivirus/physical-update test. EXE unsigned; SmartScreen/unknown-publisher warning possible. No claim of independent instructional/learner validation or professional approval; working preview retained separately from stable2.0.0.


Dual Windows2.3.0 delivered from7c8ed9d/run43930298980:60 tests per OS/25 browser paths, both actual EXE normal-start/lifecycle checks and concurrent profile/unchanged-Production-DB verification passed. All6 release assets re-downloaded via authorized connection and SHA256/PE/source-comment checked. Production data identity preserved; QA isolated; both unsigned and professional/physical-machine limits remain open. See DUAL_WINDOWS.md and DUAL_WINDOWS_VERIFICATION.json. Existing repository/history retained, no new repository.


Auth incident2.3.1: three proven engine defects corrected; before11 PASS/3 FAIL vs after14 engine/63 full PASS. Exact00e1dca/run43938048471 passed Windows/web/Docker/publication, both original2.3.0 and corrected2.3.1 EXE negative-auth/success/restart/migration probes and concurrent isolation. All6 current assets downloaded/checksummed. AUTH_INCIDENT_REPORT.md/AUTH_AUDIT_VERIFICATION.json distinguish conditional fixtures from normal UI and unspecified device issues; no hashing/schema/data/path reset or speculative fix.


Latest verified2.4.0 recovery/Unicode delivery: exact0d0c0c5/run43953301188, all3 jobs PASS,70 tests per OS/27 browser paths/Docker/both actual Production+QA Windows EXEs/concurrent isolation and6-asset re-download/checksum readback PASS. AUTH_RECOVERY_VERIFICATION.json is the newest evidence; AUTH_AUDIT_VERIFICATION.json remains immutable2.3.1 baseline proof. Secure backup-assisted recovery creates a new account and preserves the original; Arabic combining names and long Unicode passwords corrected. Schema1 and existing learner data preserved. G12 independent human review/learner validation and pristine physical-device/manual-click acceptance remain OPEN/NOT RUN. Earlier counts/pending statements above are historical, not latest verification.


QA Studio2.5.0 verified:488fa0e/run43957964750 all3 jobs PASS,73 tests per OS/27 browser paths/Docker, both real Windows EXEs, Production tool exclusion/route denial and simultaneous storage isolation. QA dedicated appId/profile/database/settings unchanged; separate renderer build opens published content and adds synthetic register/presets/reset/diagnostics/manual local reports.180 QA lesson routes/12 reviews/12 projects/capstone and preset/report/restart/reset PASS. All6 release assets re-downloaded/checksummed/PE/source checked. See QA_STUDIO.md/QA_STUDIO_VERIFICATION.json. No auth bypass or automatic existing-data reset. G12 independent human validation and pristine physical-device checks remain OPEN/NOT RUN.


Latest2.6.0 content audit verified:164b818/run43967296356 all3 jobs PASS,78 tests per OS/28 browser paths/Docker/both actual Windows EXEs/QA Studio/concurrent isolation/publication6-asset readback. CONTENT_AUDIT.md and CONTENT_AUDIT_VERIFICATION.json are authoritative.26 item revisions/frozen historicalv2/currentv3, all43,740 grade combinations/28 sources/12 complete projects checked. Confirmed citation allowlist defect fixed with red/green and actual Electron dispatch; default browser launch itself NOT RUN. Source/learner IDs, keys, assignments/rubrics and old data preserved. G12 human/novice moderation and109 length-cue candidates remain OPEN; physical clean Windows/every update NOT RUN. Initial cancelled43964781164 is not a final release proof.
