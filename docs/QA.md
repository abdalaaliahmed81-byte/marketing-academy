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
