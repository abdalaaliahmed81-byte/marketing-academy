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

Inventory, route/database maps, baseline and changed checks, current dependency results, PDF metadata and content metrics will be appended as execution completes. An unexecuted check is not a pass. The published2.0.0 release remains intact during this audit; no new release is implied by this branch.
