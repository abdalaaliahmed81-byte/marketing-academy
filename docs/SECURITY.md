# Security model and boundaries

The application is local first. The optional Docker service serves static assets; it does not receive account credentials or learner data. Desktop content is loaded from the private academy://app protocol without an HTTP listener. No third-party analytics are included. External educational references open only after user action; the desktop host allowlists HTTPS reference hosts and blocks renderer network requests outside the local application origin.

## Accounts and storage

- Passwords: Web Crypto PBKDF2-HMAC-SHA-256, 600,000 iterations, unique random 128-bit salt. Registration requires 12–128 characters. NFKC-normalized, case-insensitive usernames are unique. A SHA-256 verifier over half the derived output validates login; the other half wraps a random 256-bit account data key using AES-256-GCM. Passwords are never stored or logged. This portable browser/desktop choice follows the PBKDF2 option in the OWASP Password Storage Cheat Sheet; Argon2id remains the preferred default where a reviewed implementation is available.
- Each account has its own random-ID IndexedDB database. Non-indexed learner record contents are AES-256-GCM encrypted using @noble/ciphers, with a fresh random 96-bit nonce on each write. Ciphertext is authenticated to table and primary key. Indexed metadata such as lesson ID, timestamps, and activity dates is visible; this is not full-disk encryption.
- The random account key exists in memory only while logged in. Logout closes the active database and zeros the held key buffer. Process/browser reload requires login. JavaScript garbage collection and OS memory are outside a guaranteed secure erasure model.
- Repeated failed login attempts receive a bounded persistent delay. A local administrator can reset storage or the device clock; this is a convenience abuse barrier rather than a security boundary against OS control.
- Password changes re-wrap the same account key and do not destroy progress. There is no email reset or hidden administrator password. A forgotten password requires a separately protected exported progress backup to import into a new account.

## Backup and migrations

New backups encrypt learner records with AES-256-GCM and an independent PBKDF2-derived passphrase key. Credentials and account key material are excluded. Import checks file size, envelope version and fixed KDF parameters before decryption, then validates schema, IDs, score calculations, completion prerequisites, dates, duplicate records, and module-project state. Writes replace only the signed-in account in one IndexedDB transaction. Invalid files leave records intact. A backup passphrase is necessary to decrypt that backup; it need not equal the account password.

Legacy JSON v1/v2 backups are supported as plaintext inputs and must be handled privately. Original anonymous MVP data is never silently copied to all accounts: an explicit onboarding action claims it once, preserves the original database, and validates the import. Existing Dexie v1/v2 structures migrate to v3 with module-project persistence. App updates must retain the academy://app origin and application ID to keep desktop data accessible.

## Renderer and build

Electron uses context isolation, sandboxed renderers, no Node integration, web security, no webviews, denied permission requests, denied in-app external navigation, a narrow external-link allowlist and CSP. There is no privileged IPC surface. The custom protocol restricts method, origin and resolved path to packaged dist. HTML is rendered through React text nodes; user notes and project content are not interpreted as HTML. Markdown exports remain text; take care when opening untrusted Markdown in a separate tool.

CI uses pinned action commit SHAs, read-only default token permissions and no persisted checkout credentials. The release job has contents:write only for publishing after exact-commit verification succeeds. PDF books and user databases are excluded from Git and Docker contexts. Pattern scanning supplements review; it cannot prove absence of every possible secret. No signing certificate or token is embedded.

## Threat boundary and verification limits

The goal is separate authenticated learner sessions and protected saved content on a shared device. A compromised OS, malicious browser extension with page access, developer-tools access to a live authenticated renderer, or an attacker who replaces application source can access or destroy data. Use separate OS accounts and disk encryption when stronger local separation is required. Copies of an unlocked process are not covered by at-rest encryption.

No external penetration test or independent human security certification is claimed. See QA.md for executed checks and dependency findings. Unsigned Windows builds are disclosed; no digital-signature identity is fabricated.

Reference checked 2026-11-15: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html and https://www.electronjs.org/docs/latest/tutorial/security .
