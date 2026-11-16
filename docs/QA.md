> Historical2.0.0 execution below is retained. Current2.1.0 audit adds real SQLite/API/migration checks; see [AI_PROGRESS.md](AI_PROGRESS.md) and [AUDIT.md](AUDIT.md) for current counts and CI evidence. Existing release assets were not replaced.

# QA execution record

Release policy: publish only after the exact source commit passes both web and Windows verification jobs. The release includes verification.json with the actual commit, run URL, checksums, Windows executable smoke results, browser counts, Docker evidence and dependency audit. That machine-generated record is the authority for the published build; this document defines scope and limits.

## Baseline

Uploaded MVP preserved in commit 34f03dc. Its nine original tests passed before implementation (2026-11-15). The baseline had ten lessons, no account system and no desktop/CI/Docker packaging.

## Implemented checks

- Unit/integration tests: quiz scoring, sequential unlocking, persistent notes, daily Baghdad date boundaries, mission completion, v1 migration, capstone merging, multi-account isolation, slow password KDF, wrong passwords, password changes, authenticated encrypted storage, wrong encryption keys, encrypted backups and invalid-import atomicity.
- Educational checks: module/lesson/question uniqueness and counts; required lesson fields and references; worked-project structure and capstone field coverage; independent recalculation of campaign arithmetic and cost sensitivity.
- Browser: full 60-lesson completion with actual quiz/practice UI, failed quiz feedback and locking, persistent notes across login, account separation, project editing, encrypted export/restore, offline reload, RTL, mobile overflow, reduced motion and axe WCAG checks.
- Desktop: actual Electron launch, sandboxed renderer APIs, local protocol, account and note save/restart/login, no external server dependency and blocked external fetch. Development-runtime Linux diagnostics are separate from built Windows-EXE validation.
- Infrastructure: real Docker build/start/HTTP/health checks, GitHub Windows packaging and testing of the built portable EXE, plus release checksums and source archive.

## Limits that must be disclosed

No independent human Arabic instructor, assistive-technology user or external penetration tester has reviewed this application. Automated axe checks cannot establish complete WCAG conformance. Browser checks cover Chromium; Windows CI tests its runner OS, not every supported physical device. Source links were selectively checked, not universally exhaustively reviewed. No promise of business returns or professional accreditation is made.

The production dependency audit initially reported zero known vulnerabilities after upgrading the uploaded dependency set. Build/test tooling still has low/moderate advisories; the exact final audit is recorded separately. Do not describe all dependencies as vulnerability-free. PDFs and extracted copyrighted text are outside the repository.

## Executed local pre-release evidence (2026-11-15)

- 18 unit/integration/content tests passed with TypeScript checking and production build. The added legacy migration test confirms a once-only explicit account claim and prevents copying old anonymous data into a second account.
- The eight core Chromium end-to-end tests passed, including completing all 60 lessons using all 300 correct answers, saving each practical activity and entering every module review. The suite also covers failed answers, persistence, backup integrity, project exports, offline reload, 320/390/1280 widths and keyboard dialogs.
- Automated accessibility scans passed the path at those widths and the login, dashboard, lesson reading, quiz, module projects, capstone and settings views in light and dark themes, where applicable. This is bounded automated evidence, not a screen-reader certification.
- A built Linux Electron directory passed registration, 60-lesson display, encrypted note persistence across process restart and re-login, lack of renderer Node APIs and a blocked external fetch. Linux headless tests require a test-only no-sandbox flag because this managed machine lacks the desktop SUID helper setup; production Windows configuration retains renderer sandboxing.
- Docker image built and served HTTP200, Arabic RTL HTML and the script asset. Inspection and actual write rejection confirmed user101:101, a read-only root, dropped capabilities and no-new-privileges. Health probes passed. Root HTML retained CSP, nosniff and frame protections after fixing nginx header inheritance. A session-only BuildKit CA secret was needed for this managed proxy; no CA or TLS bypass was added to source/image layers.
- All12 curriculum web reference URLs returned HTTP200 on selective checks. A bounded normalized20-word exact-window comparison found no matches against the private book extracts; that is not legal clearance or an exhaustive originality proof.
- Production npm dependencies:0 known vulnerabilities. Complete toolchain:2 low and9 moderate,0 high/critical in the recorded audit. Remaining findings concern deepmerge/glob/minimatch and their build-tool consumers. Build inputs and glob patterns are controlled repository inputs; macOS universal/DMG and Squirrel targets are not shipped. These are disclosed residual build-tool risks, not an assertion of zero risk. CI blocks high/critical findings and any production finding.

A ninth browser check additionally saved all12 module projects independently, reloaded and verified the first submission, and read back the full worked-project Markdown export. Worked deliverables include a303-word original article, complete message sets, query groups, data dictionaries and the portfolio defense; templates and calculations are explicitly simulations. Final aggregate pass counts are taken from the exact-commit CI artifact.

## Defects found and corrected

Committed-state review navigation race; desktop protocol requests blocked by its own file-fetch interception; premature test actions before async saves acknowledged; hidden print heading selected by a test; root-owned restrictive Docker config permissions; nginx location headers masking inherited security headers; proxy-sensitive local health probes; and portable-wrapper inspector stdout unsuitable for Electron's direct launch helper. The portable EXE is now launched as the shipped file and tested via a loopback CDP endpoint supplied only by the test harness. This endpoint is not enabled for normal application use.

The Windows runner builds the portable EXE, drives its UI, closes and relaunches it, verifies login and saved notes, and checks the unpacked payload's x64 PE architecture before generating release assets. Actual success must be read from verification.json and the linked run; a successful packaging step alone is insufficient.


## 2.1.0 audit verification (unreleased)

Final source484c80a passed both jobs in [run43749095271](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43749095271):32 unit/integration tests per OS,12 browser paths, real Docker SQLite/restart checks, and actual built Windows-EXE isolation/persistence/legacy migration. Local download/readback verified EXE/source digests. See AUDIT_VERIFICATION.json and AI_PROGRESS.md. The educational audit identified50 short micro-lessons with repeated cases/summaries and item-quality flags; previous structural checks are not professional content approval. These findings remain open.

## Educational revision, module3 —2026-11-16 Baghdad

Inspected prior CI evidence and confirmed run43749753438 succeeded before resuming. Added explanatory material, independent worked simulation cases and summaries for m03-l01–m03-l05. Current32 unit/integration tests, TypeScript and production build passed. Actual old/new esbuild exports were compared: all50 advanced IDs and250 questions/options/answer keys, assignments, missions and rubrics match; no historical attempt rescoring is introduced. Reading counts for the revised lessons are348/326/318/295/306 words. Counts are descriptive; human instructional approval remains open. Pricing case independently recalculated: (10000−6000−1500)=2500; after20% discount (8000−6000−1500)=500;10×2500/500=50 orders. This is a simulation with fixed acquisition cost, not a forecast.

Module3 revision browser run:12/12 passed locally (2.3 minutes), including full60-lesson progression and API safeguards. New Windows packaging is not inferred from the previous checkpoint.


## Account/profile completion —2026-11-16 Baghdad

35 actual unit/integration tests passed with TypeScript/build: profile persistence and cross-owner rejection, idle expiry preserving data, edited legacy display-name migration and all seven learner collections isolated under restore.14 browser flows passed before the final heartbeat revision; final targeted profile/switch/heartbeat/idle checks passed2/2 after correcting fake-clock installation order. Local Electron launched without HTTP backend, preserved profile and notes after restart, and migrated the old IDB fixture without changing original ciphertext. Real Docker build/start/smoke verified HttpOnly login, profile update, encrypted-note persistence across API restart, non-root/read-only services and security headers. New CI reruns the full14-browser suite and actually packaged Windows EXE for the final source. No previous binary proof is substituted for this build. No independent penetration test or broad device guarantee is claimed.


## Final account CI evidence

[Run43767675728](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43767675728) passed both jobs for `17d2597ab620226fb058b1c92b02a2c919b0ee88`. Actual Windows x64 portable EXE passed profile/name persistence through preload, note save/restart/login, blocked external fetch and non-destructive IDB→SQLite migration.35 tests passed on each OS;14 browser paths passed on CI, including switching, active heartbeat and idle lock. Docker passed health/security headers/non-root/read-only checks and retained profile/note after API restart. Native SQLite schema1:2 synthetic accounts/9 encrypted records; source ciphertext preserved. [ACCOUNTS_VERIFICATION.json](ACCOUNTS_VERIFICATION.json) records CI-generated asset digests and exact source. No local download/readback is claimed for these new assets, and no new Release was published. Source/learner history remains intact; the test-only Docker stack was stopped with its private volume retained. Only documentation/evidence follows this verified source.


## Interface and lesson notebook verification

36 unit/integration tests +type/build passed. New timestamp compatibility test confirms meaningful edits only, stable time on no-op/bookmark saves, backup/reopen persistence, old no-timestamp import and invalid-date rejection without loss. Three targeted real-browser tests passed for note autosave/search/selection/timestamp reload and per-account isolation in static/API editions, live quiz statistics and75-resource filtering, nine routes at320/390/1280, modal keyboard/44px targets, reduced motion and light/dark axe. Captured/inspected actual screenshots in artifacts/ui-*.png. Linux Electron smoke verified note text/timestamp after process restart, profile persistence, native isolation and retained legacy source. Screenshots are synthetic test accounts only. Full17-path suite and actual Windows EXE are reverified by CI for the final source; no previous artifact substitutes for it. No universal WCAG/screen-reader/device certification.


## Verified interface checkpoint

[Run43770162463](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43770162463) passed both jobs for `d086d2028c5a05c619b803d2b3c86f1654be7aa7`:36 unit/integration tests on each OS, all17 browser paths, real Docker health/persistence checks and actual portable Windows x64 EXE. Its note text and **unchanged timestamp survived a process restart**, profile persisted, renderer Node APIs stayed unavailable and legacy-IDB source remained intact. Local complete17-path run also passed (2.6m). Separate Chromium mobile/touch emulation at390×844 passed actual tap/open/autosave/timestamp/save-close with unchanged lesson URL and zero closed editors mounted. This does not claim a physical phone or Safari test.

Actual desktop and320/390/1280 screenshots are in CI web-evidence artifacts. UI_VERIFICATION.json contains exact source, CI-generated asset digests and test scope. Only evidence/documentation follows this tested implementation; no new release published and curriculum G12 remains open. Resume from this design/account implementation, not a new template.


## Interactive learning checks —2026-11-16 Baghdad

44 unit/integration tests passed with TypeScript/build:360 definitions over60 lessons, matching/order/blank/branches, invalid state/unknown IDs,70% threshold, budget vectors and null denominators/Arabic digits, spaced review dates, real SQLite reopen/owner isolation/backup and nine-field plan transfer. Full20 browser paths passed locally, including all60 existing lessons, actual dragging and keyboard ordering, all studio families, persisted answers/retries/reviews and mobile axe. Native development Electron passed interactive activity persistence across process restart alongside original migration/note/profile checks; packaged Windows gate extended to require interactiveActivityPersistence. See INTERACTIVE_LEARNING.md for assessment limits and exact-source CI outcome in AI_PROGRESS.md.


## Verified interactive checkpoint

[Run43773926758](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43773926758) passed both jobs for `a0bf1297ce5d59501bfc519688edeb6c411100f8`:44 unit/integration tests on each OS,20 browser paths (CI2.4m; local final2.9m), real Docker/API restart checks and actual built Windows x64 EXE. Its saved matching activity survived a full process restart (`interactiveActivityPersistence=true`), with notes/timestamps/profile and untouched legacy source also verified. Native fixture:2 accounts/10 encrypted records/schema1. [INTERACTIVE_VERIFICATION.json](INTERACTIVE_VERIFICATION.json) records exact source, CI-generated asset digests, test scope and grading limits. New EXE/source artifacts are CI outputs, not a new published Release; no separate download/readback is claimed.

Every lesson has6 versioned activity definitions (360 total). Closed tasks/quiz grading are objective against shared keys; free-text studios are explicit structural/self-review.12 branch/order templates are shared by module, not misrepresented as60 uniquely authored trees. Meaningful discrete actions commit immediately, drafts display their650ms pending-save state, and portfolio overwrite remains previewed/confirmed. Earlier instructional depth/item moderation/professional-review gates remain open. Only documentation/evidence follows this tested implementation; retain existing account data/history on resume.

## Project learning2.2.0 — local execution2026-11-16

`npm run check`:55/55 tests and typecheck/production build passed. New tests exercise12 guide/60 mini-project coverage, three complete case economics, saved-draft serialization/stale acknowledgment/failure/retry, real SQLite completed-credit preservation, idempotent append/oversize rollback and backup/second-owner isolation. `npx playwright test tests/project-learning.spec.ts`:3/3 passed across local/API autosave, transfer, reports, encrypted restore and independent accounts; offline mobile keyboard/axe path passed. A duplicate settings accessible-link name found during testing was corrected; backup confirmation test now targets its specific live message. Sensitivity arithmetic no longer leaks binary fractions into integer dinar totals.

Actual Linux development Electron native smoke passed module/capstone autosave after process restart, encrypted SQLite/schema1 (two synthetic accounts/11 records), existing profile/note/timestamp/activity retention and unchanged legacy source fixture. This is not a Windows EXE claim. Production audit:0 advisories; tooling2 low/9 moderate,0 high/critical. Source guard/diff checks passed. Final full browser suite and exact-commit Windows/Docker/publication evidence are recorded in PROJECT_LEARNING_VERIFICATION.json when complete; the prior2.1.1 release proof does not substitute for them.

The twelve-module browser roundtrip now runs after service-worker readiness with network disabled. This establishes that instructions/templates/solutions/save/export need no external paid service. It is not an independently observed novice usability study. All new case observations/performance are simulations; checks do not certify professional learning outcomes or universal accessibility.

Final local suite before exact-source CI:56 tests/25 browser paths passed. Added a regression for reverting to a previously acknowledged value while another queued write is in flight; pending writes now prevent skipping that revert. Backup/export handlers pin the initiating authenticated repository across asynchronous encryption/decryption so user switching cannot redirect a pending restore. These changes receive a focused browser rerun and exact-source CI before release claims.

CI43865973839 at0ead2fd: Windows56 tests/build/actual EXE autosave+restart+legacy preservation passed. Web56 tests/build passed,24/25 browser paths passed; new API project registration hit the unchanged production10-registration/minute/IP limit shared with earlier test files. Downloaded failed web artifact14225297976, matched its SHA25665c9f443755b6212e93f9f61cc01abbe0afb815058d6b33b050be480635b7cc3 and inspected trace: HTTP429, RATE_LIMIT. Docker/publication were skipped; no2.2.0 release was published by that run. Fix: independent temporary API/SQLite fixture on4175 for project tests, original fixture4174 retained, production limiter unchanged. Registration precondition now fails within10 seconds with UI context instead of consuming the full test timeout. Exact-source verification must be rerun before publishing.

Corrected fixture regression: all3 project browser paths passed locally with independent temporary API on4175; typecheck/source guard/diff check passed. No production authentication or rate-limit code changed. A new push reruns Windows/web/Docker against the corrected exact source.
