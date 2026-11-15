# Arabic academy interface revision

Continue the existing React/TypeScript application and its authenticated repositories. No mock data, parallel prototype, hosted font dependency or replacement storage was introduced.

## Visual and interaction system

Forest/cream surfaces with restrained warm accents; shared light/dark tokens, Arabic system-font stack and logical RTL spacing. Dashboard, learning path, reading/quiz/practice, daily mission, module/portfolio workspaces and account settings share the revised components. Sidebar becomes eight44px-minimum navigation targets in two mobile rows; content padding avoids covering actions. Header search opens the actual library. No fictitious keyboard shortcut is advertised.

New authenticated routes `/library` and `/stats` use the same local/API repository. Library indexes60 lessons and15 existing official/publisher resources, with query/type/module filters, Arabic diacritic/alef normalization, empty states, private note-text search, and real locked/unlocked links. It does not distribute book files. External references require internet; local curriculum/search does not. Statistics derive from actual completion, saved quiz attempts, activity days, self-reviewed projects, notes and practice submissions. Daily study target is labeled a target rather than fabricated measured study time.

## Mandatory notebook

Notes glyphs are immediately beside lesson titles in path, reading, saved lessons and library. Buttons are siblings of title links; preventDefault/stopPropagation prevents accidental lesson navigation. Small glyphs retain44px touch targets and keyboard names. Only an open editor is mounted; modal portals avoid invalid nested heading markup and hidden forms across60 lessons. Native dialog handles modal focus; Escape attempts an acknowledged save and restores trigger focus. Failed saves retain text/editor. The account-scoped repository is captured at open, so pending work never changes owner after switching accounts.

Debounced650ms autosave, explicit save/close, dirty/saving/saved/error states, character count, last-modified time and literal in-note search with next-selection are implemented. Library “ملاحظاتي” searches private saved note bodies. `notesUpdatedAt` is an optional validated ISO field in encrypted lesson state; old records/backups stay valid and are not assigned invented timestamps. Only a text change sets a new timestamp; opening or bookmarking does not. No physical SQLite/IndexedDB schema/index reset is needed because the optional field is inside the existing encrypted record. New exports retain it; older app versions with strict old schemas may not understand new exports (downgrading is not promised).

## Motion and accessibility

CSS uses short opacity/transform transitions, a one-off chart-line reveal, progress fill transitions, hover icon feedback and success feedback. Load indicators exist only while loading. Reduced-motion disables transitions/animations, including progress pseudo-elements; values and focus remain usable. No new animation dependency. Native controls, labels, heading hierarchy, keyboard dialogs, visible focus,44px note targets and mobile overflow checks are part of verification. UI timer/cryptographic account controls remain unchanged.

## Verification scope

Existing learning/account/API flows remain in the browser suite. New real-browser cases exercise autosave, timestamp persistence through reload, literal search selection, account isolation, real quiz statistics,75-resource/type/module filtering,320/390/1280 layouts across nine routes, keyboard modal behavior, reduced motion and light/dark axe scans. Desktop smoke additionally checks the new note timestamp after a full process restart. QA.md/AI_PROGRESS.md record observed results and CI source provenance. Automated checks do not certify all screen-reader/device combinations.

Initial checks found an unnamed compact search link and ambiguous select labels; explicit Arabic labels were added. Visual inspection found a modal displaced by reset margins; explicit centered modal bounds corrected it. Invalid overlapping Playwright runs shared report/server resources; their results were discarded and checks rerun serially. No checks were weakened to conceal application defects.

Final source d086d20 passed both jobs in run43770162463:36 unit/integration tests per OS,17 browser paths, Docker and actual built EXE including note timestamps across restart. See UI_VERIFICATION.json. Local Chromium touch emulation also passed at390×844; no physical mobile/Safari certification is implied.
