# Architecture — shared learning application, SQLite authority

Status: implementing and validating. Baseline uses IndexedDB; target behavior must not be claimed until its checks pass.

## Layers

1. Shared React/TypeScript curriculum, educational domain, backup schemas and assessment IDs remain independent of transport.
2. A learner repository presents typed records and transactions. The native/API client keeps a memory read model; state becomes visible only after an acknowledged durable commit. No native account keys or credentials are stored in renderer persistence.
3. Electron main owns SQLite, cryptography, authentication and authorization. A sandboxed preload exposes an allowlisted request API, never SQL, filesystem paths, Node or arbitrary IPC channels. Sender origin and main-frame ownership are checked in main.
4. Optional same-origin HTTP API reuses the same engine. It uses HttpOnly sessions, strict origin/JSON checks, rate limits, bounded bodies and TLS requirements for non-loopback deployment. Desktop never needs that HTTP server.
5. Static PWA remains a supported legacy/offline adapter. API outage must not silently create a second local account store.

## Persistence and migration

SQLite schema migrations use user_version, foreign keys, WAL, busy timeout and FULL durability. Accounts use slow salted password hashing and a wrapped random data key. Learner record bodies are independently authenticated/encrypted per user; query metadata and usernames are not full-disk encrypted. Every query is scoped by authenticated user ID. Revisions prevent stale concurrent writes; an owner-ID check also prevents a cookie change in another tab from writing one user's read model into another user's account.

Migration authenticates the old account, validates its decrypted state, commits and reads back the SQLite copy, then switches the UI. Keep the source IndexedDB unchanged. Existing native username collisions cannot be overwritten by a forged/old credential record. Anonymous MVP data is claimed once explicitly. Backups remain portable and do not contain account credentials.

## Deployment boundaries

Electron packages its runtime and local assets and loads academy://app without an HTTP listener. Docker API deployment is optional and has its own persistent volume and operational backup needs. Static web progress remains browser/origin scoped. No proprietary PDFs, runtime databases, session tokens or backup files are repository assets.
