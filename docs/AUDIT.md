# Marketing Academy — technical and educational audit

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
| E02 | Medium depth | Later micro-lessons have roughly140–180 reading words; generated mini-cases reuse a quiz question and summaries repeat objectives | Mark per-lesson depth/case/summary limitations; avoid treating word count as a quality score |
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
