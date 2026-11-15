# Development decisions and resume record

2026-11-15: audited uploaded MVP before changing code. Baseline preserved as root commit. Existing stable lesson IDs m01-l01…m02-l05 retained. Books downloaded under /workspace/attachments and extracted only under /workspace/work/book-extracts, outside this repository. No proprietary book bytes are included.

2026-11-15: retain React/TypeScript curriculum and learning domain. Add a packaged Electron desktop host; optional Docker serves the same compiled web app. Normal Windows use must require no installed Node.js, Docker, development tools, or external server. Package runtime and static assets with the application. Desktop protocol and browser security will be explicitly tested.

2026-11-15: private GitHub creation authorized but current integration returns HTTP 403 for createRepository and POST /user/repos. User asked to provide an empty private repository accessible to the connection. Do not modify the unrelated repositories on this account to work around permissions.

Resume from this directory; inspect git status and docs/QA.md before further changes. Never infer release success from a workflow file alone. Record actual builds, artifact hashes, and run links.
