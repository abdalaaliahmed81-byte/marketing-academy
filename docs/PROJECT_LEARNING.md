# Project-based learning —2.2.0

This extension continues the verified2.1.1 source; it does not replace working lessons or reset accounts. It adds original training simulations, not real client engagements. Independent Arabic instructional review and novice learner validation remain open. No professional accreditation is implied.

## Coverage and workflow

-12 module guides retain their existing complete worked artifacts and four deliverables/rubric criteria; each now includes objectives, prerequisites, materials, concepts, six execution steps, an appendable editable template, common mistakes and improvement advice. The full guide and the learner submission export as Markdown.
-60 authored mini-projects each provide a topic-specific task, two outputs, a complete small solution and template, prerequisites/materials, steps and mistake/advice checks. They are preparatory additions to the original lesson assignment, not a claim that copying a short example satisfies that larger assignment. Original assignment IDs, three-item rubrics and earned credit are retained.
-Three completely worked27-field capstones: a Baghdad restaurant, Mosul clothing shop and Basra e-commerce business. Each has research, persona, competitors/alternatives, positioning, story, SMART goals, the nine-part plan, six calendar entries, five social posts, two ad variations, budget, KPI calculations, contribution/sensitivity analysis and client report. Cases reuse consistent assumptions across all fields.
-Twelve capstone stages expose actual filled-field counts and instructions. Filling fields is a self-review signal, not evidence of competence. A new optional `competitors` field preserves the earlier26-field records and imports.
-Module submissions can be previewed and explicitly appended to an appropriate portfolio field, transactionally. Existing text and unrelated fields survive. An identical saved block is idempotent. Oversized or invalid writes fail without changing the prior record.
-Full portfolio Markdown includes the capstone plus saved lesson assignments and module submissions; focused client-report export contains goals, budget, KPIs, analysis and recommendations. Printable outputs carry the training/simulation caveat. Markdown output is text, not rendered unsanitized HTML.

## Persistence and compatibility

`useSavedDraft` debounces650ms, serializes writes (including reverting to a prior value while another write is pending), acknowledges only the latest successfully stored snapshot, exposes errors and allows retry. Module-tab switching and export await a flush. The unloading page warns about unacknowledged changes; in-app unmount attempts the final draft using the captured authenticated repository. An abrupt power loss before acknowledgment can lose the pending edit; wait for the saved indicator before closing. This is not a promise of crash-proof keystroke storage.

All meaningful outputs use existing authenticated `lessonStates`, `moduleProjects` and `projects` collections. UI case selection is a reading preference, not a completed learning action. Native Electron/API use the same SQLite repository, owner authorization, atomic revision writes and encrypted backups. No new physical SQLite migration or IPC command is needed. Existing completed module credit cannot silently be downgraded by an invalid edit. Legacy26-field portfolios and guide/assessment versions remain valid. Same-field concurrent edits retain the existing conflict semantics; this feature does not promise automatic collaborative merging.

Local accounts do not synchronize devices. Settings exports a password-encrypted validated backup containing assignments, notes, history, projects and progress. Restore explicitly replaces the current account's learning data after validation, without overwriting another account. Handlers capture the initiating authenticated repository before asynchronous encryption/decryption; a later user switch cannot retarget a pending restore. Markdown/PDF are shareable portfolio outputs, not restorable backups. Protect export files and remove personal/client information before sharing.

## Simulation assumptions and reproducible calculations

All prices, capacity, interview observations, competitor alternatives, audience descriptions and campaign results in the new cases are authored assumptions. They are neither market statistics nor actual testimonials. Every simulated order is one unit; the constructed table has no cancellations or duplication. E-commerce example price excludes optional delivery, which must be agreed separately. Contribution below excludes fixed/administrative costs and is not net profit.

|Case|Price / variable cost IQD|A revenue / contribution|B revenue / contribution|A / B contribution with variable cost+10%|
|---|---|---|---|---|
|Restaurant|8000 /4800|48000 /7200|64000 /13600|4320 /9760|
|Clothing|25000 /15000|100000 /24000|150000 /42000|18000 /33000|
|E-commerce|18000 /11000|54000 /12000|108000 /27000|8700 /20400|

Revenue=orders×price; contribution=orders×(price−variable cost)−simulated spend. CTR=clicks/impressions; CPC=spend/clicks; CPA=spend/orders; ROAS=revenue/spend. These fixed examples have positive denominators; they do not establish causality, statistical significance or a future guarantee. Increased variable cost is calculated as cost×110/100 to avoid spurious floating-point fractions in the dinar totals.

## Free completion and QA boundaries

All required instructions, data, examples and text editors ship with the application. A local calculator or paper is sufficient. No real interview, platform account, paid ads, premium images, live storefront, email send, tracking installation or external subscription is required to submit. Optional real-world validation requires consent and truthful source attribution; unperformed checks must be marked unperformed. Supplied books and proprietary PDFs are not redistributed.

Tests cover structural coverage and recomputed case economics, queued save/failure/retry, completed-credit retention, atomic transfer, old/new backups, SQLite account isolation, both browser storage editions, encrypted restore and exports. Browser offline/mobile/keyboard/axe checks exercise the mini-project/capstone route. Native smoke checks actual module/capstone autosave across process restart; Windows CI runs that check against the built portable EXE. Docker smoke checks saved module/capstone fields after API restart. These tests establish technical executability, not independent observation that a novice understands every instruction. See PROJECT_LEARNING_VERIFICATION.json for executed results; do not infer a pass from this test inventory.
