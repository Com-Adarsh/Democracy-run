# Source and implementation notes

## Source recovered

- Source page: https://reclaimjantarmantardyfi.netlify.app/
- Page title: Reclaim Jantar Mantar — DYFI Edition.
- Visible version in the recovered HTML: DYFI Edition v1.3.
- Retrieved for this user-requested rebuild on 2026-10-16.
- Original delivery: one HTML page, inline CSS and JavaScript, 17 embedded PNG frames.
- Reused: 9 running frames, 4 jump frames, 4 slide frames; scenery and original obstacle drawing routines; the synthesized soundtrack motif; the core runner/scoring design.
- This is a new implementation package; no changes were sent to the original host.
- The initially uploaded `main jantar dyfi.js` contained unrelated Kaspersky browser-injection code and is not included.

Original art and reused source retain their original rights. No new license is asserted for those assets. This package does not represent official endorsement by any organization.

## Deliberate gameplay differences from v1.3

- Hanging banners are a new obstacle after 240 points (the top 6% of the spawn random draw). In that range they replace part of the original police-obstacle probability. Other obstacle probabilities remain unchanged.
- Slide hitboxes now sit at the road rather than floating above it. Their size remains 40 × 29 logical pixels. A slide lasts 0.58 seconds, as in v1.3.
- The simulation uses a fixed 1/120-second step with the original semi-implicit jump integrator; timing may differ slightly from the original variable-step implementation.
- Barricades consistently use width 76. Originally, a 6% range of random draws produced a barricade with width 34.
- Paused/background tabs do not advance scoring, object motion, or game audio.
- A stored best score and shared score are whole points; their fractional display bug is fixed.

## Verification boundary

Gameplay tests and asset/syntax checks passed. The live site's source was downloaded before browser inspection was denied. No browser workaround or subsequent live-site access was used. No visual browser QA, mobile device run, or Vercel deployment was completed during this preparation.
