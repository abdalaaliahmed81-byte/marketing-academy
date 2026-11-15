# Release gates

| Gate | Required evidence | Initial state |
|---|---|---|
|G01 Source preservation|Stable app origin/IDs, source inventory, no user-data deletion|In progress|
|G02 SQLite runtime|Actual Electron and Node SQLite capability; transactional schema/reopen test|In progress|
|G03 Migration|Real legacy-IDB account → SQLite; readback equality, source preserved, collision/retry tests|Not run|
|G04 Account isolation|Wrong password, per-user encrypted rows, no cross-owner commits, stale revision rejection|Not run for new engine|
|G05 Atomicity|Failure/invalid restore leaves old progress intact; acknowledged write before success|Not run for new engine|
|G06 IPC/API|Sender allowlist, no raw SQL/path interface, origin/CSRF/session/rate/body-limit tests|Not run|
|G07 Learning regressions|All lessons and existing flows, notes, missions, projects, backup/restore|Baseline running|
|G08 Accessibility|Keyboard/dialog/reduced motion, mobile/dark views, automated axe; manual limits disclosed|Baseline exists; rerun changes|
|G09 Packaging|Version-aware x64 EXE runs with SQLite and restart persistence; unsigned status disclosed|Pending|
|G10 Supply chain|Production audit and full tooling findings; no proprietary books/data/secrets; action pinning|Running|
|G11 Educational completeness|60-row source/depth/assessment review; corrections preserve historical scoring|Pending audit|
|G12 Professional educational approval|Named competent independent Arabic instructional review and learner feedback if claimed|Not performed; blocks that claim|
|G13 Publish|Exact-commit checks, asset digests, source archive and readback|No new release requested by this audit|

Audit documentation may be completed with open educational approval gates if they are explicitly recorded. Do not present an architecture design as implemented, or an implementation as tested, without evidence. Existing v2.0.0 assets remain unchanged.
