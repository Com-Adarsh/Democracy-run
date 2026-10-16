# The Democracy Run — DYFI Edition

A complete, independent browser arcade game prepared for **Com-Adarsh**. It is based on the gameplay and publicly served source of The Democracy Run v1.3, supplied by the user at https://reclaimjantarmantardyfi.netlify.app/.

**This project does not modify, deploy to, or depend on the original Netlify site.** Publish it as its own GitHub repository and its own Vercel project.

## Play

- For an immediate offline try, open `PLAY.html` from this project folder in a modern browser. That file bundles the same game, styles, and character assets into one document.
- For normal development, install Node.js 20 or newer, open a terminal in this folder, and run `npm start`. Open `http://localhost:3000`.
- No `npm install` is needed: there are no runtime or development dependencies.
- The deployable website lives in `public/`. Do not open `public/index.html` using `file://`; its JavaScript modules require an HTTP server. Use `PLAY.html` for double-click/offline play.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Start | Enter or Space on the home screen | Let's Run |
| Jump | Space, Up, or W | JUMP, or tap the game area |
| Slide | Down or S | SLIDE |
| Pause/resume | P or Escape | Pause button / Keep Running |
| Restart after game over | R | Run It Back |

Jump over cones, barricades, and police obstacles. Slide under hanging banners marked with a down arrow. Flags add 10 points; surviving adds 24 points per second. The game accelerates from 330 to a maximum of 650 logical pixels per second.

## What changed

- A redesigned home screen, score display, instruction panel, settings, pause screen, and results screen.
- The original 17 runner sprite frames, Delhi scenery, three original obstacle types, music motif, jump velocity, gravity, score rate, flag bonus, and speed progression are retained.
- New hanging banners appear after 240 points, giving the slide action a clear gameplay purpose.
- Sliding has a road-anchored collision box; a narrow-barricade generation bug is fixed.
- A fixed 120 Hz simulation makes physics consistent across screen refresh rates; long frame gaps are capped.
- Restart clears pending jumps; input repeat no longer continually retriggers jumps.
- Switching tabs or losing window focus pauses the game.
- Audio settings and best score are saved locally, with safe fallback when storage is unavailable.
- Reduced-motion preference, keyboard controls, focus indicators, native dialogs, touch buttons, and screen-reader status messages.
- Score sharing uses integer scores and excludes tracking query strings. Clipboard failure shows selectable score text.
- Artwork is served locally. The app needs no third-party CDN, analytics, backend, API keys, or account sign-in for players.

## GitHub setup

Create a **new repository** named `democracy-run` under `Com-Adarsh`. A private repository is fine; Vercel can deploy from it after receiving access. Do not use the existing `Digital-Wall` repository.

If using GitHub's website, unzip this project and upload its contents to the new repository. `package.json`, `vercel.json`, and the `public` folder must appear at the repository root, not inside another `democracy-run` folder. Uploading only the ZIP will not produce a runnable site.

Alternatively, create an empty repository without a starter README, then run these commands in this folder:

```bash
git init -b main
git add .
git commit -m "Add The Democracy Run arcade game"
git remote add origin https://github.com/Com-Adarsh/democracy-run.git
git push -u origin main
```

The example remote above is a proposed destination, not a claim that the repository already exists. Change it if you choose a different name. Authenticate using your normal GitHub method; no credentials belong in this project.

## Vercel deployment

1. In Vercel, choose **Add New → Project** and import the new game repository.
2. Create a new Vercel project. Do not select or replace an existing application.
3. The included `vercel.json` configures these values:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Root directory | Repository root |
| Build command | Empty / disabled |
| Install command | Empty / disabled |
| Output directory | `public` |
| Environment variables | None |

4. Deploy. Use the URL returned by Vercel for your new game.
5. Later commits to the connected production branch can trigger automatic redeployment.

Official references: [Vercel GitHub deployment](https://vercel.com/docs/git/vercel-for-github), [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build), and [GitHub file uploads](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

## Project layout

| Path | Purpose |
| --- | --- |
| `public/index.html` | Screens and accessible controls |
| `public/styles.css` | Responsive visual design |
| `public/core.js` | Simulation, scoring, physics, collisions, game states |
| `public/renderer.js` | Canvas scenery and sprite rendering |
| `public/app.js` | Controls, menus, sharing, pause behavior |
| `public/audio.js` | Synthesized effects and the original melody |
| `public/storage.js` | Best score and settings |
| `public/sprites.js`, `public/assets/` | Animation manifest, PNGs, favicon |
| `tests/core.test.js` | Gameplay and persistence regression tests |
| `scripts/check.mjs` | Asset, syntax, and configuration checks |
| `scripts/serve.mjs` | Dependency-free local development server |
| `scripts/build-standalone.mjs` | Rebuild the offline `PLAY.html` file |
| `PLAY.html` | Self-contained offline game |
| `SOURCE-NOTES.md` | Source provenance and verification limits |

## Verification

```bash
npm test
npm run check
node scripts/build-standalone.mjs
```

The 17 automated tests cover scoring, speed, jumps, buffered input, collision handling, sliding, flag collection, pause/resume, restart, object cleanup, 30/60/144 Hz consistency, and unavailable/invalid browser storage. All tests and file checks passed during preparation.

Interactive browser testing and Vercel production deployment have **not** been completed. Before launch, play on a desktop and a phone, check sound after a user tap, test every dialog, try the new banners, and confirm pause/resume after switching tabs.

Best scores are local to each browser and origin. A score on the original Netlify address will not automatically transfer to a new Vercel address. The same key is retained for same-origin compatibility. Scores are not a verified online leaderboard.
