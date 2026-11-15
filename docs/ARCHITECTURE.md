# Architecture — SQLite authority with shared learning code

Audit branch implementation for **2.1.0 (unreleased)**. Published v2.0.0 remains the historical IndexedDB build. See AUDIT.md and RELEASE_GATES.md for executed checks and open gates.

## Runtime map

| Layer | Files | Responsibility |
|---|---|---|
|Curriculum and learning rules|`src/lessons/`, `curriculum.ts`, `projects.ts`, `domain.ts`|Stable lesson/question/option IDs, scoring, unlocking, missions and portfolio; shared by all deployments|
|Shared state schemas|`src/data-schema.ts`, `validation.ts`|Canonical v3 state, legacy v1/v2 import, completion/score/ID/size validation; Zod JIT explicitly disabled for strict CSP|
|UI and business operations|React views, `src/db.ts`, `backup.ts`|Accessible Arabic RTL UI, educational transactions and encrypted portable backups; independent of native/API transport|
|Repository|`src/storage/repository.ts`, `query.ts`|Memory-only committed read model for native/API; explicit transaction-scoped views and serialized writes; retains legacy Dexie observation|
|Transport|`protocol.ts`, `transport.ts`|Nine typed commands; no SQL or file paths. Detect desktop first, then same-origin API, else legacy PWA; pinned API never silently falls back during outage|
|Trusted persistence|`backend/engine.ts`|Actual Node/Electron built-in SQLite, authentication, session/owner authorization, crypto, schema migration and atomic revision commits|
|Desktop host|`electron/main.cjs`, `preload.cjs`|Bundled Electron runtime, sandboxed renderer, origin/main-frame validation, private token in main, frozen narrow context bridge|
|Optional HTTP host|`backend/server.ts`|Same engine, same-origin JSON API, HttpOnly cookies, bounded requests, rate limits and origin/CSRF checks|
|Legacy adapter|`src/legacy-auth.ts`, AcademyDB in `src/db.ts`|Original encrypted per-account IndexedDB and once-only anonymous MVP claim; retained for migration and static PWA|

React routes: `/`, `/path`, `/lesson/:id/:section`, `/review/:module`, `/projects`, `/project`, `/mission`, `/settings`, plus fallback. They use HashRouter, so packaged paths need no remote routing service. HTTP routes: GET `/api/health` and POST `/api/command`; unknown API paths reject. Commands: `register`, `login`, `logout`, `changePassword`, `read`, `commit`, `migrateLegacy`, `profile`, `updateProfile`.

## SQLite model and durability

The desktop database is `academy.sqlite` inside the **unchanged** Electron userData directory; the app ID remains `com.marketingacademy.desktop`, origin `academy://app`. Do not move these on update. The app does not open an HTTP listener. Node >=24.13 and Electron45.3.2 supply built-in `node:sqlite`; there is no separately rebuilt SQLite addon.

SQLite application_id is 0x4d414332 and user_version is1. `schema_migrations` records applied versions; `accounts` holds normalized usernames, salts, verifiers and wrapped random data keys; `account_state` holds owner revision; `learner_records` holds `(user_id, collection, record_id, authenticated_ciphertext)`. Collections: settings, lessonStates, attempts, missions, projects, activity, moduleProjects. Foreign keys, WAL, FULL synchronous durability, busy timeout, trusted_schema OFF, disabled extensions and startup integrity checks are enabled. Future, foreign or corrupt databases fail closed and are never reset. Subsequent schema changes require numbered transactional migrations, not table replacement.

PBKDF2-HMAC-SHA256 uses600,000 iterations, random128-bit salts and64 derived bytes. One half supplies the password verifier; the other wraps a random256-bit data key with AES256-GCM. Each learner record uses a fresh96-bit nonce and owner/collection/record-ID associated data. Keys stay in the trusted engine; renderer state contains only the current authenticated learning data. Usernames and record IDs remain visible metadata; this is not full-disk encryption. Password changes rewrap the key and revoke other sessions. Authentication rechecks password version after asynchronous hashing to reject a login racing a password change.

A write clones the committed view, runs shared domain operations and validates the whole state. The engine authenticates the requested owner, compares expectedRevision inside BEGIN IMMEDIATE, updates changed rows and revision, and commits atomically. UI success follows the acknowledged durable result. A stale revision refreshes the view and rejects the attempted overwrite for explicit retry. Another tab changing a shared API cookie cannot write the old account's view into the new account. Late responses from closed repositories cannot invalidate a different account's session.

## Migration and recovery

On native/API login, authenticate the native account first. If absent/incorrect and matching legacy credentials exist locally, authenticate/decrypt the legacy account, validate/export its state, verify credentials again in the trusted engine, and create/read back the SQLite copy within a single transaction. The source IDB and ciphertext remain unchanged. Native name collisions reject; migration never overwrites an existing native account. The source legacy ID is unique in SQLite. Anonymous original MVP data requires the preserved explicit once-only claim. No destructive background conversion runs at startup.

Backups retain the v1 encrypted envelope with independent passphrase; contents use progress v3, accepting validated v1/v2 imports. Credentials/session tokens are excluded. Restore replaces only the authenticated owner's state in one transaction. Keep original backups and database copies when diagnosing corruption; do not reset storage to make an error disappear. A real learner's Windows profile was not supplied: compatibility is proven against synthetic fixtures, not that unseen profile.

## Deployments

- Desktop: local packaged assets + main-process SQLite; no Node installation, Docker, API service or normal-use setup required.
- Default `compose.yaml`: nginx101:101 proxies `/api` to a separate Node24 API running as node, backed by named `academy_data` volume. Read-only roots, tmpfs, dropped capabilities and no-new-privileges. Bind defaults to loopback8080. Set exact APP_ORIGIN to the externally served HTTPS origin for remote deployment; terminate TLS at a trusted reverse proxy. API cookies are Secure on HTTPS. Login sessions expire after30 minutes idle/12 hours absolute and are intentionally invalidated by API restart; progress survives in SQLite.
- `compose.static.yaml` / `Dockerfile.static`: original browser-local/offline IndexedDB model, no API or central account database. Keep old browser origin/profile for migration. API mode requires its server for reads/writes; the EXE and static PWA remain independent.

The simple API rate limiter sees the direct peer (nginx in Compose), so rate budgets are shared behind that proxy. It does not trust arbitrary X-Forwarded-For. Large public multi-tenant operation needs a trusted-edge rate policy, operational backup/restore drills and capacity testing. There is no telemetry, email reset, synchronization between desktop and web, instructor grading, or accreditation service.

## Build and release boundary

Vite builds the same UI/curriculum. esbuild bundles engine.cjs for Electron and server.mjs for Node. electron-builder packages dist/build/electron; PDF books, test fixtures and runtime databases are excluded. Windows verification drives the **built portable EXE**, tests SQLite persistence and authenticated legacy migration, verifies x64 PE and produces digests/source archive. A release requires successful exact-commit web+Windows evidence; no new release is created by this audit. Windows signing is absent and disclosed, not simulated.


## Account/profile completion —2026-11-16 Baghdad

`profile` returns only owner ID, immutable normalized login name, display name and creation timestamp. `updateProfile` validates1–80 trimmed display characters (no control characters), checks authenticated owner and atomically updates only display_name. No schema replacement is needed: existing SQLite schema1 already contains this field. It never changes password keys, IDs, progress or username. Legacy static PWA supports the same UI; authenticated migration retains an edited legacy display name while preserving its original login identity.

Settings now offers profile editing, existing password/study-plan controls and explicit user switching. Switching closes the current read model immediately, waits for remote logout acknowledgement (bounded request timeout), then exposes login for the next user. Expired/mismatched sessions are already invalid and safely close locally. A genuine server-contact failure is disclosed rather than claimed as revoked. UI locks after30 minutes without input/scroll and at12 hours; trusted engine independently expires sessions by protected-request idle/absolute time. A five-minute owner-scoped profile heartbeat renews the trusted idle lease only while interaction is recent; it does not extend the absolute lifetime. Focus checks an overdue lock before activity can refresh it. Browser timer throttling and OS clock tampering are outside a hard real-time guarantee. Save drafts before leaving a shared device. Profiles are account metadata; progress backups exclude credentials and do not rename the target account.

`compose.env.example` documents the loopback defaults and exact HTTPS-origin override. Both services have real health checks; API receives only its private volume, and the EXE starts no API/HTTP listener. Backup transfer is manual, passphrase-encrypted and target-account-scoped; no automatic cloud sync is provided.
