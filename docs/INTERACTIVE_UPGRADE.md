# Interactive learning upgrade2.7.0

Continues fa36ab3/verified2.6.0. Preserves all60 lessons,360 existing versioned activities, assessment1/2/3 snapshots/keys, notes/attempts/assignments/missions/projects and owner encryption. No authentication/IPC/schema/profile change or data rewrite.

## Existing working interactions retained

Guided reading/reflection, branched scenarios with explained outcomes, matching, sequence drag+keyboard alternatives, blanks and lesson-specific builders/calculators/calendar/plan remain real saved activities. Existing grader, persistence, keyboard, quiz retry, backup, Baghdad midnight/stable persisted missions and spaced-review tests remain required. Daily missions use Asia/Baghdad and persist once chosen, even when further lessons complete the same day. No paid campaign/account is needed.

## Skill mastery tree

Dashboard and Statistics link to /skills:12 module branches/60 lesson nodes, with actual account-specific evidence and small circle notes beside each title. Weighted indicator40% best quiz score +40% six activity results +20% saved practical assignment with its self-review checks. Training criteria complete means quiz>=70, all6 activities and reviewed application; an80% quiz can satisfy criteria without100% numerical score. Open tasks remain structural/self-review, not certified human grading. Prior lesson completion has a separate retained badge and is not withdrawn if interactions are missing. This derived view writes no data and cannot unlock a Production lesson. QA remains unrestricted without invented mastery.

CSS entrance/hover/status transitions are restrained; reduced-motion disables animations/transforms/transitions. Semantic lists/headings/native progress and real links/buttons support keyboard and mobile. Readable Arabic counts use «0 من6» rather than bidi-ambiguous slash. No new global persisted score or schema migration.

## Confirmed defects and actual reproductions

1. Library all-resources search promised notes but only included note text under notes-only filter. Actual browser failed expected1 result/received0 after confirmed autosave. General search now includes own note text; lessons-only search remains a content-title/goal filter. Existing normalizer supports Arabic marks/hamza for library search.
2. reviewSchedule accepted now but ignored it, so a future-dated successful retrieval could hide a currently due mistake. New real-function regression failed1/2 before correction; now ignores future events in derived schedule until timestamp arrives. Records are not deleted/rewritten. Existing test dates made explicit rather than depending on host clock. Baghdad day/1,3,7,14,30 schedule unchanged.

## Local evidence before exact-source CI

80 unit/integration tests PASS; strict TypeScript/build PASS;2 new browser paths PASS12.9s: autosave/notes-icon no navigation/default search/offline cached restart/account switching isolation;60 circles/59 locked nodes for new Production account/390px axe/reduced-motion/overflow. Initial offline fixture incorrectly expected first navigation already controlled by Service Worker; normal reload acquired control, then actual offline reload/login/search passed. No runtime PWA security setting changed. Screenshot inspected; QA-only/Production source build boundary still passes.

Production dev Electron PASS: all original auth/password/recovery/Unicode/offline/notes/quiz/completion/migration +new60 nodes/circles/old completion and computed60%/notes staying on tree/general search. QA final local rerun pending when this paragraph was written. Full30-browser/Docker/real both Windows EXEs/readback pending; workflow configuration alone is not execution proof. Physical clean Windows/manual assistive-user/universal WCAG/human mastery validation NOT RUN.
