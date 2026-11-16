# QA Studio2.5.0

Verified release: exact488fa0e/run43957964750; all3 jobs PASS,73 tests per OS/27 browser paths/Docker/both actual EXEs/concurrent isolation/readback. [QA_STUDIO_VERIFICATION.json](QA_STUDIO_VERIFICATION.json) is authoritative. Pending statements below are implementation history.

Dedicated existing appId `com.marketingacademy.desktop.qa`, immutable channel `qa`, appData/marketing-academy-qa/academy.sqlite and separate chromium/session/cache/settings. Existing QA data remains; Production app identity/path/engine/authentication unchanged. No new IPC command, auth bypass, global reset or cross-owner read.

A separate Vite build includes lazily loaded QA tools only in the QA package. Both compile capability and trusted readonly main-channel metadata are required for unrestricted lesson/review navigation. Production build excludes tool code/assets, denies the Studio route and retains normal prerequisite rules. check-editions.mjs asserts artifact boundaries; dual-isolation-smoke verifies concurrent profiles and unchanged Production DB hash.

Register normally and finish initial study settings; banner links to Studio. Every published lesson/read/activity/quiz/practice,12 unit reviews,12 worked projects and capstone are accessible without prior lesson completion. Grading and owner validation remain real, not bypassed. Studio exposes all question solutions/why text explicitly for inspection.

Presets0/5/30/60 generate marked synthetic notes/assignments/valid attempts. Applying requires explicit confirmation and atomically replaces ONLY authenticated current QA owner's learning state using existing restore validation.0 resets learning data while retaining credentials. No account deletion or automatic deletion of existing QA data. Back up before replacement. Synthetic account generation uses ordinary register with random visible name and tester-selected password; original account preserved. Re-login after reload/restart. No fixed test password ships.

Bug reports are manual bounded/validated local JSON in isolated QA Chromium storage, shared across synthetic QA accounts on this profile, preserved across restart. They collect title/steps/lesson/time only; never attach databases/passwords/logs automatically or send to GitHub. Export is local. Content diagnostics cover counts/question answer references/explanations/activity presence, not factual currency/professional approval. QA settings remain per-account; local reports intentionally belong to the QA device profile.

Test evidence pending final exact-source CI:73 unit/integration tests expected; native smoke exercises180 lesson routes,12 review routes,12 project selectors/capstone, synthetic registration,30-lesson preset+restart, report+restart and reset; retained both-channel auth/legacy migration/data lifecycle plus Production denial and concurrent storage isolation. Do not label a configured check PASS before execution.

Local development verification:73 tests PASS, both native channels PASS including Production denial and all9 Studio flags; final QA-only heading/layout refinement rerun and packaged Windows exact-source validation still pending. Single-frame axe mode used because Electron disallows the default auxiliary browser target; no security setting changed.

## Final acceptance results

|Check|Status|Evidence|
|---|---|---|
|Dedicated identity, database, settings, Chromium/session/cache and concurrent isolation|PASS|Immutable QA appId/profile, same username independent notes/restart; Production DB SHA unchanged after QA writes|
|Production security/authentication preserved|PASS|Seven protected source files byte-identical to2.4.0,73 tests per OS, native auth lifecycle; Studio route denied and QA tool chunks absent|
|Unrestricted published content|PASS|Actual QA Windows180 lesson section routes/12 review routes/12 project selectors/capstone; original progress prerequisites retained in Production|
|Synthetic registration, presets, reset and restart|PASS|Normal PBKDF2 registration, valid0/5/30/60 fixtures; actual30 preset persisted across process restart, reset0|
|Local bug reports|PASS|Real manual save/restart persistence; bounded validated local storage and view/export implementation; no automatic network submission|
|Mobile accessibility|PASS, bounded|390px single-frame axe; screenshot inspected. Default new-target axe unsupported by Electron, legacy single-frame mode used|
|Published artifacts|PASS|6 downloads, GitHub digests/5 checksum entries/source comment/PE/x64 proofs matched|
|Clean physical Windows/every real upgrade/device issue|NOT RUN|Actual Actions Windows execution is narrower; unsigned EXEs|
|Professional instructional/human learner validation|NOT RUN|Structural diagnostics do not close G12|

Both actual EXEs and all published links belong to2.5.0 Preview; earlier releases/profiles untouched. No known unresolved release-blocking Studio defect within executed checks.
