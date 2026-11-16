# Release gates

Applies to2.1.0 audit source. Published v2.0.0 is unchanged. AI_PROGRESS records final executed evidence and CI links; a workflow definition alone is never a pass.

|Gate|Evidence / condition|Status|
|---|---|---|
|G01 Preserve source and progress|Stable app origin/IDs, inventory, retained IDB sources, no runtime data in Git|Passed code/fixture checks; unseen real learner profile not supplied|
|G02 Real SQLite|Node and Electron actual engine, schema/open/reopen/integrity|Passed local unit/Electron and actual Windows EXE; run43749095271|
|G03 Migration|Actual legacy-IDB→SQLite login, readback, completed state/note/quiz/project/source fingerprint|Passed Linux Electron and built Windows EXE; unchanged source fingerprint|
|G04 Account isolation|Wrong password, per-owner encrypted records, owner mismatch, revision conflicts, concurrent password changes|Passed automated engine/repository/API checks|
|G05 Atomicity|Invalid restore and actual SQL trigger abort preserve old snapshot; no unacknowledged UI success|Passed engine and repository tests|
|G06 IPC/API|Narrow sender/command boundary, CSRF/origin/cookies/body limits/rate/session tests|Passed checks within documented threat model; no external penetration test|
|G07 Learning regressions|Original domain + full60-lesson browser path, notes/missions/projects/backups|32 unit/integration +12 browser checks passed; run43749095271|
|G08 Accessibility|Keyboard/dialog, RTL320/390/1280 widths, reduced motion, light/dark axe|12 browser checks passed, including axe; manual assistive-user review unverified|
|G09 Packaging|Actual built x64 portable EXE + SQLite and legacy migration smoke, restart, PE header/digests|Passed for484c80a in run43749095271; later release commit still requires exact verification. Unsigned|
|G10 Supply chain|No production advisories, no high/critical tooling findings, source guard, pinned actions|Dependency report records exact counts; low/moderate tooling residual accepted/disclosed|
|G11 Educational audit coverage|60-row matrix +3-PDF metadata/source inspection +question/case/depth metrics|Completed bounded audit; evidence depth clearly labeled|
|G12 Advanced educational readiness|Expand remaining45 flagged micro-lessons (module3 batch implemented), independent cases/summaries, item moderation, claim-level current sources, qualified independent Arabic review|OPEN; blocks advanced/professionally-reviewed completion claims|
|G13 Publication|Exact-commit web/Windows verification, asset digests/source archive/readback, correct release notes|Not executed for2.1.0; this audit does not publish a new release|
|G14 GitHub configuration assurance|Admin-setting readback, branch/rules protections, signing configuration if claimed|PARTIAL: read endpoints403. Do not infer missing controls from denial|

Automated technical gates may pass while educational readiness remains open. Structural60/300/12 counts do not override G12. No release or deployment may be described as verified solely because scripts or workflow files exist. Keep unverified claims explicit and retain the prior release until any replacement's gates pass.


Account completion revision: G04/G05 now also cover profile ownership and seven-collection target-account restore; G06 has nine commands and final UI lock/heartbeat tests; G09 now requires native profile persistence and G13 requires14 browser paths and Docker profile restart evidence. Earlier passing source remains historical; exact new source must pass CI before publication. Accounts do not provide cloud synchronization.

Final account implementation verified at17d2597 by run43767675728 (both jobs passed). G04–G09 extended account checks passed, including actual EXE profile persistence. See ACCOUNTS_VERIFICATION.json. No new publication; any subsequent release commit needs exact-commit evidence.


Interface revision extends G07/G08 with17 browser paths, library/stats and notes search/timestamps/mobile interactions. G09 now also requires actual portable-EXE noteTimestampPersistence after process restart. New proof must correspond to the exact source; prior account-only success remains historical. No new release is implied by passing these technical UI gates.

Interface source d086d20 passed run43770162463: G07/G08 checks17/17 browser paths, and G09 native noteTimestampPersistence=true after actual EXE restart. UI_VERIFICATION.json records the evidence. Any future release still requires exact-final-commit proof and honest remaining educational gates.

Interactive revision extends G07 to20 browser paths and G09 to actual built-EXE interactiveActivityPersistence after restart. Grade/state validity, saved attempts/retries, due dates and Baghdad day stability require real tests. New interactive source needs exact-commit CI; earlier UI-only artifacts are historical. G12 human/advanced content readiness remains open.

Interactive source a0bf129 passed run43773926758: G07 includes44 unit/integration +20 browser paths, and G09 interactiveActivityPersistence=true on the actual built EXE. Existing progress/source retained. INTERACTIVE_VERIFICATION.json records provenance and grading limits; G12 remains open. Any future release still needs exact-final-commit verification.

Editorial revision: G12 depth/case/source agent-remediation backlog implemented for all60; qualified independent Arabic review, learner validation and psychometric moderation remain OPEN. Source registry explicitly distinguishes original simulations and bounded factual/platform references from optional human-only resources. G04/G07 now additionally require version1 history/active-draft preservation, version2 retry/reopen and old/new backup validation. G09 requires an EXE built from this exact revision; old a0bf129 artifacts do not prove new content packaging. G13 replacement Release remains blocked by outstanding readiness/verification; keep v2.0.0 and do not call agent review professional independent approval.

G12 is now enforced in `scripts/release-proof.mjs` through `scripts/educational-gate.mjs` and `docs/EDUCATIONAL_READINESS.json`. Its current independent-review/learner-validation status is explicitly open, so the public-release workflow cannot silently publish despite these documented blockers. This does not block build/test artifacts or ask for routine user approval. Release proof also requires all21 browser paths. Future readiness must link actual review evidence; never invent a reviewer or completion to change the flags.

### Publication-channel clarification

The original implementation contract requires available quality gates and honest disclosure; it does not require asking the user for routine approval or prohibit a clearly labeled working preview. G12 blocks **stable/professionally-complete claims**. A GitHub prerelease may distribute the verified working EXE with exact-source evidence and explicit open independent-review/learner-validation limits. It must not replace v2.0.0 as latest stable. `assertPublicationReadiness` enforces known channels and complete agent60-lesson review; stable additionally requires G12. Release workflow defaults to `preview` and passes `--prerelease`; stable cannot silently bypass the educational gate. This clarification supersedes the broader publication-block wording above; no human-review evidence or completion flag is changed.

Authorized transport fallback: `verify.yml` has a one-shot, explicit-release-subject publication job, depending on web/Windows success, exact same-run artifacts and preview proof. It verifies published downloads and prerelease metadata. Ordinary pushes/PRs skip it; stable still requires G12. This exists because the local upload endpoint rejected credentials and the dispatch-only run did not start during observation. It is not evidence of successful publication until the job passes.

Patch2.1.1 adds a required regression: every expanded guide-v1 must retain an earned baseline result with only the original acknowledgements; optional depth must save/reopen without revoking credit or pretending it was read. Immutable baseline counts preserve guide IDs/data. G07 now requires50 tests and22 browser paths. The explicit preview publication subject is version-independent (`release: publish verified Marketing Academy preview…`); artifacts/version/readback still come from the same verified commit/run. v2.1.0 preview was actually published by run43855378686, but is superseded by the pending compatibility fix rather than silently rewritten.
