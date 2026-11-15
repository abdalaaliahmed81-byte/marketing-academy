# Development decisions and resume record

2026-11-15: audited uploaded MVP before changing code. Baseline preserved as root commit. Existing stable lesson IDs m01-l01…m02-l05 retained. Books downloaded under /workspace/attachments and extracted only under /workspace/work/book-extracts, outside this repository. No proprietary book bytes are included.

2026-11-15: retain React/TypeScript curriculum and learning domain. Add a packaged Electron desktop host; optional Docker serves the same compiled web app. Normal Windows use must require no installed Node.js, Docker, development tools, or external server. Package runtime and static assets with the application. Desktop protocol and browser security will be explicitly tested.

2026-11-15: private GitHub creation authorized but current integration returns HTTP 403 for createRepository and POST /user/repos. User asked to provide an empty private repository accessible to the connection. Do not modify the unrelated repositories on this account to work around permissions.

Resume from this directory; inspect git status and docs/QA.md before further changes. Never infer release success from a workflow file alone. Record actual builds, artifact hashes, and run links.

2026-11-15: repository abdalaaliahmed81-byte/marketing-academy became accessible, empty and PUBLIC. Attempt to change visibility to private returned HTTP 403. User then explicitly replied «اكمل عليه كما هو» to the public/private clarification. Public source publication is therefore authorized for this repository. Proprietary PDFs, extracted text, secrets, and runtime databases remain excluded. Initial baseline and contract are pushed before ongoing changes.

2026-11-15 QA fixes: full-course browser testing exposed an end-of-module navigation race: the route guarded against stale live-query state immediately after a committed completion. Module review now reads committed persistence on mount before deciding access. A separate fast DOM test clicked a still-disabled practice button; it now waits for UI readiness, matching actual browser interaction. The desktop protocol initially fetched file URLs through its own network blocker; serving validated local bytes fixes that without widening renderer network access.
