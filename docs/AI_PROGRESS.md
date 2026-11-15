# AI progress and resume record

## Current execution

- Task: comprehensive technical/educational audit plus necessary architecture changes.
- Baseline:1eecadbf3e1811e31dc2eafe274487ecb8a15e57, published v2.0.0.
- Branch:audit/sqlite-architecture. Preserve published release and all legacy sources.
- Accessible: full source, test/build tools, GitHub connection, all three PDF books and private extracted text outside Git.
- Initial confirmed gaps: no SQLite; no HTTP API; renderer-owned persistence; storage-coupled components; educational checks prove structure rather than advanced quality.
- Actions: inspected baseline/remote and primary runtime/data/CI files; started baseline checks and a real Electron node:sqlite capability probe; created all six requested documents.

## Resume rules

Read git status, this file and AUDIT.md before edits. Continue the existing branch, do not restart or replace the application. Retain the origin/app ID and lesson IDs. Never delete learner IndexedDB or SQLite to resolve a migration/test failure. Use temporary synthetic fixtures and keep databases/PDFs/secrets out of Git and CI artifacts. Record actual commands, outcomes and unverified aspects. No new release unless its explicit gates pass and publication is authorized.
