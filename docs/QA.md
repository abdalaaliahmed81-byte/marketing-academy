# QA execution record

Status: verification in progress. Do not treat this document as a completion certificate. Final results, commit SHAs and CI links will be appended after checks finish.

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
