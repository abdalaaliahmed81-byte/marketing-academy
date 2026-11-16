# Authentication incident audit — released2.3.0 and corrective2.3.1

This is a separate agent audit, not an independent penetration test. No real learner database, device error log, credentials or device-specific reproduction was supplied. **I don't know yet the cause of any unspecified failure on a user's device.** The confirmed findings below must not be presented as proof that every registration/login in2.3.0 fails. Normal registration/restart/login previously passed both actual EXEs; fresh negative probes distinguish expected refusals from defects.

## Scope and evidence provenance

Baseline source7c8ed9d (published2.3.0); documentation-only HEAD50b2666 before this audit. Inspected src/Account.tsx Login/AuthGate, src/auth.ts, legacy-auth.ts, storage transport/repository/protocol, backend engine/server and tests, electron main/preload/profile/flavor, packaged-lifecycle tests and prior Windows proofs. Production/QA profile separation is preserved. Audit fixtures are synthetic, isolated temporary directories; no actual user data was opened/reset.

Before-fix reproduction: `npx vitest run backend/engine.test.ts` produced11 PASS/2 FAIL. Both new assertions failed against the unchanged baseline engine before fixes: account count1 instead of0 after rejected creation, and retry_at not greater than current time after overlapping failures. Initial two-fix focused suite13 PASS and full suite62 PASS/typecheck/build. AUTH-03 was then reproduced separately (13 PASS/1 FAIL); final three-fix suite/results are recorded after execution. Before/after logs are outside Git in /workspace/work/auth-repro-before.log and auth-repro-after.log; scoped regression details are committed in backend/engine.test.ts. Windows baseline/current execution results are appended after actual CI completion, not inferred from these Linux tests.

## AUTH-01 — rejected registration nevertheless creates a durable account

**Confirmed; moderate availability/consistency issue at a capacity boundary.** Affects backend/engine.ts AcademyEngine.create/start. The engine supports at most1000 live sessions. Original create committed accounts/account_state before start checked session capacity. At capacity the registration returned RATE_LIMIT while its username remained reserved. A later registration could then return DUPLICATE even though the first attempt appeared to fail.

Reproduction: open a fresh actual SQLite engine; populate its session map with1000 fresh synthetic session records (instrumented capacity fixture, not1000 live desktop users); call register for a new valid name/password; observe RATE_LIMIT; query accounts using a second SQLite connection. Before fix count=1. Regression requires count=0; after releasing fixture capacity, registering the same name succeeds. The test uses actual PBKDF2 and SQL transactions.

Fix: extracted ensureSessionCapacity; recheck after asynchronous KDF and before BEGIN IMMEDIATE. No await occurs between that recheck and start, so another JS authentication completion cannot consume the slot during that synchronous transaction. start retains its own guard/key zeroing. No password, account ID or migration is rewritten. Accounts already created by an older failed attempt are not deleted or silently recreated; no claim is made about any unsupplied real account. This boundary is primarily relevant to shared API use; normal single-window desktop IPC retains one current token per window. **Not reproduced as a1000-session packaged-UI incident.**

## AUTH-02 — overlapping failed logins lose their required backoff

**Confirmed; moderate throttle-consistency issue.** Affects backend/engine.ts AcademyEngine.login, the failed-password branch after await stretch. It used account.failed captured before asynchronous PBKDF2. SQL incremented the current counter, but retry_at was calculated from the stale earlier counter for every overlapping call.

Reproduction: create a real account, set its failed counter to3/retry_at0 through a synthetic SQL boundary fixture, then Promise.allSettled four wrong-password logins. Before fix all reject, failed becomes7, but retry_at is at/past completion time instead of future backoff. Regression requires failed7 and retry_at>Date.now(). This is actual overlapping PBKDF2, not a mocked KDF. The fixture seeding is explicit; no real account was tampered with.

Fix: read the current account counter after KDF immediately before the synchronous UPDATE. With no intervening await, each completion sees earlier increments; existing threshold/exponential delay/max60s policy is preserved. This fixes throttle enforcement, not password acceptance. Correct passwords/keys and existing sessions remain unchanged. The API's separate per-IP limits/KDF concurrency cap also remain unchanged. **No credential leak or successful unauthorized login was demonstrated.**

## AUTH-03 — absolute-expired sessions incorrectly consume capacity

**Confirmed; conditional availability/key-retention issue.** Affects backend/engine.ts ensureSessionCapacity (originally cleanup inside start). authenticated already rejected tokens older than12h, but capacity cleanup only removed30min-idle sessions. Thus1000 absolute-expired sessions whose lastSeen was recent still caused RATE_LIMIT for fresh registration/login, despite none being usable. It also retained their data keys longer than necessary.

Reproduction: create an existing real account, end its original session, then seed1000 synthetic session-map records with createdAt13h ago, lastSeen now and distinct32-byte keys filled with nonzero bytes. Login to the existing account with the correct password; reseed after ending that new session, and register another account. Before correction the original registration fixture failed with RATE_LIMIT (13 prior engine tests passed/1 new failed). A second targeted before-fix run of the expanded fixture confirmed RATE_LIMIT from start during login with the CORRECT password (auth-expiry-login-before.log). Corrected cleanup uses the same idle OR absolute-expiry conditions as authenticated. Regression requires both successful correct-password login and registration, map size1 after each, and every expired key buffer zeroed. This is a boundary fixture, not a1000-client live Windows reproduction. No existing durable account/data/credentials are removed by session cleanup.

## Expected rejections and diagnostic map

|Case|Expected result / owner|Classification|
|---|---|---|
|Confirmation differs|Account.tsx Login.onSubmit rejects before register IPC|Expected validation; native negative probe|
|Slash/unsupported username characters|engine.validName / legacy-auth.register normalized3–40 allowed letters/digits/space/underscore/dot/hyphen|Expected policy; native slash probe. Do not silently change identity normalization|
|Duplicate normalized username|engine.create DUPLICATE; no replacement of old account|Expected protection; native duplicate probe|
|Unknown username or wrong password|engine.login AUTH_FAILED with same generic public message; legacy migration fallback only for known old account|Expected refusal; native probes|
|Repeated failures or too many requests/KDF jobs|RATE_LIMIT with current wait policy / HTTP429|Expected throttling; race above was a distinct enforcement defect|
|Production credentials entered into empty QA|Independent QA SQLite/profile has no such account|Expected isolation, not lost Production data|
|Changed display name used instead of fixed login name|Profile name is editable, username remains fixed|Expected identity policy; existing profile regressions|
|Logout, process restart,30min idle/12h lifetime or password-version change|Session absent/revoked; require authentication|Expected session protection; existing engine/native regressions|
|Legacy account with changed native password|authenticate native first; old-source fallback cannot overwrite an existing native identity|Expected non-destructive migration protection|
|Corrupt/foreign/future DB, invalid encrypted records, unwritable directory|Fail closed; no database reset|Storage/migration guard, not proven wrong-password cause; synthetic corruption/schema tests cover selected cases|

No password trimming/normalization is applied: whitespace, case and keyboard input matter. NFKC/trim/en-US case folding applies to usernames consistently in native and legacy code. Username policy does not permit every Unicode combining mark; broader name-policy changes were not made without a requirement. Arbitrary real-world filesystem corruption, antivirus, disk-full, Windows ACL issues or user keyboard mistakes are **unverified hypotheses**, not diagnosed causes here.

## IPC, hashing, paths and migrations reviewed

- Electron preload exposes nine allowlisted business commands plus read-only channel metadata; main verifies trusted academy main frame, request shape/size and keeps raw session tokens out of renderer replies. AUTH_FAILED does not mean IPC transport is broken. Actual packaged negative probes exercise this path.
- PBKDF2-HMAC-SHA256600000/random16-byte salt derives64 bytes; verifier comparison uses timingSafeEqual, data keys are wrapped and records authenticated with AES-GCM/owner-bound AAD. Unknown accounts still perform KDF. This does not claim identical end-to-end timings. Keys are cleared on rejected capacity/session end and during idle/absolute-expiry cleanup. No hashing parameter or stored verifier was changed.
- Sessions use random32-byte tokens,30min idle/12h absolute limits and password-version invalidation. Old delayed responses cannot switch ownership; existing race/session/repository regressions remain. Browser HttpOnly/SameSite/origin/per-IP controls and native window-scoped token handling differ intentionally.
- Immutable packaged channel resolves paths before locks/storage. Production identity/default userData unchanged; QA appData/marketing-academy-qa and chromium subfolder remain separate. Filename changes do not select a profile. A read-only channel IPC returns no filesystem paths/keys. Same-root/concurrent notes and Production DB SHA256 tests are retained.
- Schema1/app identity/quick_check/foreign-key checks and encrypted-source legacy migration remain intact. Native auth checks legacy IndexedDB to avoid duplicate ownership; a failure of that safety check may fail closed. No supplied device demonstrated that condition, so it was not bypassed. No destructive migration or data reset was added.

## Packaged audit and open checks

Windows CI is configured to download BOTH published2.3.0 EXEs, compare hashes to the recorded original asset digests, and run registration/login negative probes plus restart/notes/quiz/completion/isolation/legacy migration in temporary profiles. It then tests BOTH newly built2.3.1 EXEs and concurrent profile isolation. These steps are now **PASS**, executed in run43938048471; detailed outcomes follow below. A successful source build alone does not establish packaged behavior.

A pristine consumer PC, manual Explorer double-click, real user's DB/ACL/antivirus state,1000 live desktop sessions and multi-client live-server attack simulation are NOT RUN. No exact error/steps from a user's device were provided; optional diagnosis would need only version/channel and nonsecret error text/steps, never passwords or public upload of personal data. Both EXEs remain unsigned. Independent educational/human validation is unrelated and still open.


Local final source checks:63 unit/integration tests across13 files PASS; strict TypeScript/build/safety lint/source guard PASS. Both corrected development Electron profiles passed all five expected-refusal probes and subsequent successful registration/login/restart/notes/quiz/completion/migration; concurrent profile isolation passed. The QA stage engine bytes match the final root engine bundle. These are not yet Windows packaged-audit results.


## Final verified results —2.3.1

Exact corrected source `00e1dca9b67c7607f5b49ee2196d07d90847e81f` /[run43938048471](https://github.com/abdalaaliahmed81-byte/marketing-academy/actions/runs/43938048471): Windows, web/Docker and preview-publication/readback jobs PASS. Actual job logs show63 unit/integration tests on each OS; browser report25 PASS/0 FAIL/0 SKIP. Full before-source reproduction was repeated against the exact engine file from the released7c8ed9d commit:11 original tests PASS/3 new tests FAIL. Restoring the committed correction yielded14/14 engine PASS. No baseline-source mutation was committed.

|Audit check|Status|Evidence / limit|
|---|---|---|
|AUTH-01/02/03 engine root causes|CONFIRMED/FIXED|Three actual before-fix failures; matching after-fix regressions PASS|
|Original2.3.0 Production and QA EXEs|PASS|Both downloaded from GitHub on Windows; original SHA256 compared before launch; both ran confirmation/invalid-name/unknown-account/wrong-password/duplicate refusals, then successful auth/restart/data/migration|
|Corrected2.3.1 Production and QA EXEs|PASS|Both actual newly built files, normal startup under system-only PATH and same five refusal probes, correct login/offline lesson/quiz/restart/notes/projects/migration; schema1/three accounts/14 encrypted records each|
|Concurrent profile isolation|PASS|Same username in both, independent notes/restarts, closed Production DB SHA256 unchanged after QA writes|
|Hashing/session/owner/migration regressions|PASS|Real PBKDF2/AES-GCM, rollback/reopen/corruption/future schema/owner mismatch/password-change interleaving tests retained|
|Published corrective assets|PASS|All6 downloaded again through authorized connection; GitHub digests and5 checksum entries, both PE/x64 payload proofs and source archive comment matched|
|General correct-login failure in released fresh profiles|NOT REPRODUCED|Ordinary correct registration/login worked; expected refusals must not be called bugs|
|Three boundary incidents as1000-session/live multi-client packaged-GUI attack|NOT RUN|Root-cause reproduction uses explicitly instrumented real-engine boundary fixtures; no such UI claim|
|An unspecified user's actual device failure|NOT RUN|No error text/version/profile/DB/device log supplied; cause unknown|
|Pristine PC/manual Explorer click/every physical upgrade/ACL/antivirus/power-loss state|NOT RUN|Windows Actions is a narrower real execution environment|

### Confirmed-error summary

AUTH-01: create/start previously returned a session-cap error after durable account creation. AUTH-02: login computed retry delay from stale pre-KDF state. AUTH-03: start/capacity cleanup counted absolute-expired sessions even though authenticated would reject them. All three are conditional defects; no successful unauthorized login/password disclosure or generic inability to authenticate was demonstrated. The patch changes only proven session/counter ordering, preserves hashing/keys/schema/IDs/data and does not delete earlier partial accounts.

[Corrective working preview2.3.1](https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/tag/v2.3.1) contains both EXEs; prior2.3.0 remains intact as the pinned audit baseline. [AUTH_AUDIT_VERIFICATION.json](AUTH_AUDIT_VERIFICATION.json) retains exact assets, native baseline/current results, CI IDs, before/after log hashes and limitations. No real user password/database was collected, and no speculative IndexedDB reset, name-normalization change or permission workaround was applied.
