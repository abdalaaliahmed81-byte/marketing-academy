# Marketing Academy · أكاديمية التسويق

Arabic RTL, local-first PWA. Phase 1 includes ten original lessons, 50 questions, ten daily-mission variants, reviews for both units, and the editable Before/During/After canvas and portfolio editor.

## Run the included build on Windows

Install Node.js 22.12+ (Node 24 LTS recommended), extract the ZIP, and open PowerShell in the extracted project folder:

```powershell
node .\scripts\serve.mjs
Start-Process http://127.0.0.1:4173/
```

Run the second line in a separate window while the server is active, or double-click `Start-Windows.cmd` and refresh the browser if it opens before the server. The included `dist` needs no package installation. Keep using the same URL and browser profile. IndexedDB and the installed app are specific to the origin, so changing the host or port opens a separate copy of progress.

## Develop or rebuild

```powershell
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run preview -- --host 127.0.0.1 --strictPort
```

Use the production URL above for offline and installation testing. Open it once and wait for the service worker to cache the app. External references require a connection. On Android or iPad, use a trusted **HTTPS** static origin serving `dist/` at its root. Localhost on the Windows PC works there, while a plain LAN HTTP address will not provide secure-context PWA features on the mobile device. In iPad Safari use Share → Add to Home Screen. Use Settings → JSON backup to move progress between devices or origins.

## Learning flow

Set a goal, time and project type. Read a lesson, pass its quiz (70% threshold; four of five questions), save the assignment and check its rubric. A passed quiz and self-check unlock the next lesson. The dashboard resumes at the last section of an unfinished lesson. Quiz attempts are retained. Module review repeats missed questions from the latest attempts or gives a sample from each lesson. Daily missions start after the first completed lesson. The first mission assigned on a Baghdad calendar date stays fixed for that day, even when more lessons are completed.

The portfolio editor accepts real project notes or explicitly labelled simulations, including a sample ad-results table in the measurement section. Save edits explicitly. Export a full Markdown portfolio or the nine-field Markdown plan. Print either view and select Save as PDF in the browser. Short entries fit the compact three-column plan layout more reliably.

## Source and data handling

Lesson references name the books and relevant chapters or sections from the supplied Arabic PDFs, link to author or publisher pages and official online training, and show the review date. The app includes original summaries and local training scenarios. The original PDFs are excluded. Platform instructions in Phase 1 are introductory and use public Google, Meta, HubSpot and Semrush resources, with no dependency on third-party accounts at runtime.

Dexie v2 keeps lesson content separate from user state, stores quiz attempts and study activity transactionally, and migrates completed missions into activity. Seed updates use stable lesson IDs. JSON backup restoration validates with Zod and atomically replaces local user records. Backups include written responses and are intended for the learner to keep or transfer.

`src/lessons/` contains the curriculum, `src/domain.ts` holds schemas and pure domain logic, `src/db.ts` owns persistence, and `src/*test*` contains the test suite. The remaining 50 lessons belong to Phase 2. Test real-device installation before a wider release.
