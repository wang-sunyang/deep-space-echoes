# Changelog

## v1.0 — 2026-11-19 — First release
- 7,000-word original sci-fi story, 57 story nodes, 7 endings
- Resource system (O₂ / EN / HP), flags & conditional choices
- 3 turn-based battles, auto-save, ending gallery, sound effects

## v1.1 — Same day — 3D visuals
- From-scratch software 3D renderer on Canvas 2D (no WebGL): low-poly Firefly ship, rotating Eden ark, breathing sanctum, dream sea, danger scenes
- 3D battle models (drone / memories / guardian) with laser beams, explosions, shield rings and hit flashes
- Fixed: battle-loss death check blocking retry; battle node id lost on defeat

## v1.2 — Same day — Sound & battle depth
- Procedural WebAudio ambient soundtrack, per-scene modes (space / ark / sanctum / dream / danger / void)
- Enemy signature skills (burst fire, memory heal, memory flood with energy drain)
- Battle consumables (oxygen tank, spare battery) with pickups
- Chapter replay with auto-unlock

## v1.7 — 2026-11-26 — Journey stats & speedrun records
- Per-run stats on the ending screen: play time, nodes traversed, battles fought, items used
- Personal speedrun records per ending (stored locally), with "first arrival" and "new record" callouts
- Title screen now shows total voyages and cumulative play time
- Chinese README (README.zh-CN.md) + bilingual link in the English README
- First public release pushed to GitHub with Pages enabled

## v1.6 — 2026-11-26 — World bible & in-game Codex
- Full world bible in [docs/CODEX.md](docs/CODEX.md): 2079–2289 timeline, four factions, lens-jump physics ("three iron laws"), consciousness science, the Great Silence paradox, the Forefleet/Ark/Far Shore cosmology, terminology, and 7 future-story hooks
- In-game Codex: 16 lore entries unlocked as the story progresses (default entries + node-triggered unlocks), readable from the title screen
- Every number in the story is now traceable to the bible (5126 souls, 400 lifeboats, 48 hours, 214 refusers, 73,050 awakenings, 2000 distress calls)

## v1.5 — 2026-11-26 — Easter eggs & farewell walk
- Hidden chapter "Whispers of the Echo": tap the title 7 times on the title screen for a secret first-person tale told by the Echo itself
- New walkable scene "The Last Door": the "turn away" route now ends with a first-person walk down a dark corridor toward the glowing airlock
- 2 new achievements (13 total): "First Star" (crack the signal *and* be gentle to Aiden), "Whispers of the Stars" (finish the hidden chapter)
- Node effects can now unlock achievements directly (`ach` key)

## v1.4 — 2026-11-26 — Walkable 3D scenes
- Four playable first-person segments: the ark main corridor (choose doors by walking), the shadow chase, the sanctum gauntlet march, and the sunset pier walk toward grandfather
- First-person camera for the software renderer, touch controls (drag left half to move, right half to look), locked-door hints, per-scene ambient lighting
- Fixed: `flag:` condition prefix parsing (flags never matched before — conditional choices/doors now actually work)

## v1.3 — Same day — Differentiation & virality
- ✦ Echo Mode (New Game+): 13 hidden inner monologues revealed after any ending
- Captain's log: automatic decision journal + one-tap copy-paste recap for sharing
- Share cards: personalized 3:4 ending card generated in-browser (long-press to save)
- 11 achievements with a title-screen gallery
- Repository packaging: README, LICENSE, social preview image, publish playbook
