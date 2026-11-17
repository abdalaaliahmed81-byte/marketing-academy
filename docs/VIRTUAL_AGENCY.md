# Virtual agency and campaign simulator2.8.0 — implementation checkpoint

Continues verified2.7.0 / source2873580, documentation3e3be9e. This phase is not yet a published release. Preserve existing repo/user data, no restart.

## Model and educational boundary

Three original fictional Iraqi clients reuse the existing restaurant/clothing/e-commerce context with independent agency-model-v1 inputs. Client brief, seven editable deliverables (brief/hypothesis, targeting/exclusions, copyA/B, landing flow, analysis, recommendation),8 guided steps, prerequisites/materials/expected outputs, full worked solution and4-item0–2 self-review rubric. No paid platform/account, actual ad call, audience upload, or external service.

Meta/Google and local/intent/broad are planning contexts, not secret performance multipliers. Explicit assumptions: spend entire budget (integer IQD,0–1M), common hypothetical CPM100–100000, CTR/CVR0–100. Budget and weekly client capacity split50/50 with odd remainder toB. Impressions=floor(spend/CPM×1000), clicks=floor(impressions×CTR/100), demand=floor(clicks×CVR/100), fulfilled orders=min(demand,assigned capacity). One order=one unit. Revenue=orders×fictional price; contribution=revenue−variable cost−spend, before fixed/admin/returns not entered. Zero denominators return null, not0/infinity.

A/B is explicitly descriptive synthetic comparison, not randomized market evidence or statistical significance. Worked ads share the same body and differ only in headline; CTR/CVR are user-defined hypothetical inputs, so changing them cannot prove headline causality. Seven-day analytics are equal arithmetic allocation preserving total spend/impressions/clicks/orders; no observed seasonality. Every UI/export labels synthetic.

Independent restaurant oracle: budget24000/CPM4000. A12000 spend,3000 impressions,60 clicks,6 orders,48000 revenue,7200 contribution. B12000/3000/45/9/72000/16800. Total15 orders/120000 revenue/72000 variable/24000 spend/24000 contribution, ROAS5. Clothing capacity caps B at12 from13 assumed demand. All cases are separate from earlier capstone data; do not add their totals.

## Persistence and exports

Optional validated agency array (max3 unique clients) inside existing encrypted portfolio record. SQLite schema1/seven collections/app identities remain unchanged; no SQL migration or data reset. Old states without agency parse unchanged. Current-owner transactional upsert preserves capstone fields/other clients; generic capstone save/activity export retain agency; module-append writer updated to preserve it. Completed projects remain completed and invalid destructive edits fail without overwriting stored data. Explicit saves/exports create a real draft even if untouched.

Client switching flushes acknowledged autosave before loading another; render checks clientId, rejecting stale display. Capture authenticated repository on mount; no cross-account global storage. Plain Markdown/JSON exports include source inputs/assumptions/results and synthetic/self-review status, not login/session secrets. Markdown escapes user text so embedded HTML/links are literal; raw editable source remains in JSON/encrypted backup. Full portfolio Markdown includes saved agency projects; full encrypted Settings backup/restore includes the optional field automatically. Agency JSON is an analysis report, not a full account backup. Older app versions may reject this newly extended record; keep backup and avoid assuming downgrade compatibility.

## Actual local evidence / pending

87 unit/integration tests across18 files/typecheck/build PASS, including independent arithmetic/caps/zero/invalid bounds, real SQLite encrypted restart and owner mismatch, account/client separation, backup/restore, unchanged capstone+module append, completion validation and safe exports. Initial2 focused failures were test-fixture mistakes (raw record id passed to strict Capstone and an expected phrase absent); validation was retained and corrected fixtures passed. First browser run found an actual serious scrollable-table keyboard-access issue; made the region focusable and named. Select locators exposed ambiguous inline option text; explicit visible-matching accessible names added. Browser retest in progress at this checkpoint; no actual Windows2.8.0 or new release is yet claimed.

Next: finish browser completion/export/isolation/mobile tests, fix failures, exact-source both Windows/offline/restart/agency persistence plus Docker and full32 browser gates, publish/readback6 assets, record final evidence. G12 independent educational review/novice validation remains OPEN; synthetic/self-review output is not professional approval or a platform benchmark.

## Completion/close defect reproduced and fixed

Prototype manual completion wrote the row, then set the entire returned server row into the autosave draft. Its acknowledged completed flag/new updatedAt became a new dirty signature, causing a spurious beforeunload guard immediately after successful completion. A temporary reversal to that exact completion behavior failed the new browser regression (expected false/received true); working source restored automatically. Fixed by keeping acknowledged completion UI state separate from editable autosave fields; future valid edits still preserve completed status transactionally. After correction2 browser tests PASS12.1s and Production dev-Electron exited normally (0), reopened completed Google/restaurant project with exact synthetic24000 contribution, retained legacy notes and isolated another account.

Two earlier local diagnostic runs were deliberately stopped while investigating unbounded development-Electron close; their intermediate metadata is not counted as final success. Harness now has30s action and15s dev-exit limits that fail on forced exit rather than hanging. No user-app security/beforeunload behavior was disabled. Scrollable table/solution regions now focusable and explicitly named; opened-solution axe/mobile/invalid-budget feedback test PASS. Full exact-source CI is still pending.

Final local verification completed:87 tests/typecheck/build PASS,2 browser paths PASS12.1s, independent3-client model oracle PASS, Production and isolated QA development Electron exited0 with all4 agency flags plus retained existing lifecycle/Studio/skillTree checks. Web32-path/Docker/actual Windows packaged validation and publication still pending exact-source CI.
