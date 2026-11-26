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
