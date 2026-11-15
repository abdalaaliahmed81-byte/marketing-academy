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
