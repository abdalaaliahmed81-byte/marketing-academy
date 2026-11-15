# Feature matrix

Baseline1eecadb; statuses below describe intake, not unverified target behavior.

| Capability | Baseline | Audit target / evidence |
|---|---|---|
|60 lessons /12 modules /300 questions|Present structurally|Per-lesson quality/provenance matrix; not equivalent to expert approval|
|Notes beside each lesson|Present; encrypted IndexedDB|Preserve UI and IDs; verify native/API durability and isolation|
|Quizzes, locking, missions, reviews|Present|Preserve domain semantics and validate trusted commits|
|12 worked projects and capstone|Present; self-reviewed|Preserve all outputs/exports; document depth and grading limits|
|Local registration/password change/logout|Present in renderer|SQLite/main process authority and migration|
|SQLite accounts and progress|Missing|Implement schema, encrypted records, rollback/reopen/isolation tests|
|Renderer-safe IPC|No data IPC required in baseline|Allowlist, sender validation and schema bounds|
|Docker web/API|Static web only|Optional authenticated API + durable volume; retain static profile|
|Backup/restore|Encrypted v1 envelope; progress v1–v3|Shared schemas and atomic account-scoped restore|
|Windows portable packaging|Published v2.0.0|Version-aware build; SQLite capability and actual EXE migration smoke|
|CI/release evidence|Present|Preserve exact-commit gate, checksums, source guard; extend SQLite/API gates|
|Six audit/resume documents|Missing|Create and update all requested documents|
|Independent Arabic instructor review|Not performed|Open educational gate; never infer from automated counts|
