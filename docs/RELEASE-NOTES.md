# Marketing Academy2.5.0 — isolated QA Studio

QA edition adds a dedicated Studio with unrestricted published lesson/quiz/activity/practice/review navigation, all-question explanations,12 worked projects and capstone. Existing dedicated appId/database/Chromium/settings/profile remain isolated from Production and existing QA data is retained. Production authentication, encryption, owner isolation and prerequisite policy remain unchanged. QA tool chunks are excluded from Production build and its Studio route is denied.

Synthetic accounts use ordinary secure registration with generated visible names and tester-selected passwords. Progress presets0/5/30/60 are explicitly synthetic; confirmation required before atomic replacement of current QA owner state.0 resets progress without deleting credentials/other accounts. Manual local bug reports support save/view/export and restart persistence; no automatic private-data collection or external submission. Structural diagnostics do not imply factual/professional review.

See QA_STUDIO.md and verification.json for actual tests/limits. Both Production and QA Windows EXEs bundle runtime/SQLite and run independently of Docker/backend installation. Start QA, register/login, finish initial settings, then select the QA Studio banner link. Back up before applying a preset. QA data does not migrate to Production automatically.

Unsigned Windows EXEs may trigger SmartScreen. Automated Windows Actions does not cover every physical clean PC/manual Explorer/upgrade scenario. Independent human curriculum review and learner validation remain open. Working preview only; previous releases/data remain intact.
