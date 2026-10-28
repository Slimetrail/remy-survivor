# Remy Survivor
Original goofy zombie survivor-style phone game. Help Remy fight from Niceville, FL home to Pamplico, SC with rubber chickens, banana boomerangs and whoopee cushions. Play: https://slimetrail.github.io/remy-survivor/

## v11: zombie tiers, comic intro, town panels
- Tier 1 (horde): shamb, runner, dog, spit, clown. Tier 2 (mutated): charger (telegraphed rush), spewer (vomit -> INFESTED 10s: double horde from screen edges, x1.25 speed; death glob lures tier-1 within 300px for 6s), grabber (0.7s stun, 2s cooldown), bloat, tank (lunge). Tier 3: boss (red-lane charge + ground-slam shockwave). All stats in `ZT` in game.js.
- Scene density per town comes from `tier(pop)` in towns-data.js (2020 Census via Wikipedia): major >=150k, mid >=50k, town >=10k, small >=3k, rural <3k. Add a new town by adding its population to `TOWNS`.

## v12: unique between-town cutscenes, full-body heroes, sprite atlas
- Every transition has its own scene (`CSC` in game.js, keyed by the town you drive into): Crestview gas station, Tallahassee road sign, Valdosta car-roof barricade, Waycross stray dog, Savannah night bridge, Charleston roadside radio, Kingstree cap on a fence, Florence military roadblock, Pamplico hometown sign. Each is 2-3 beats (comic panels plus slow zoom / pan / passing shadow / flicker), 12-13.5 s, with Skip. Progress is saved before it starts. The skyline scale still comes from `tier(population)`.
- After a stage clear the game goes cutscene -> next town directly (the map screen is skipped).

### Editing Remy's lines (Jeremy)
Open `cutscene-lines.js`. There is one entry per transition:
`{id:'valdosta', caption:'VALDOSTA', line:'[JEREMY LINE HERE]'}`
Replace `[JEREMY LINE HERE]` with the line, e.g. `line:'Your line here.'` (keep the quotes; escape an apostrophe as `\'`).
- While a line is still a placeholder (anything in `[ ]`, or empty), the bubble shows `...` and nothing is spoken.
- A real line appears in the bubble and is spoken aloud (pitch 0.7, rate 0.85) unless the game is muted.
- After editing, bump `?v=` in index.html and `VER` in sw.js so phones pick up the change.

- Heroes (Remy, Granddad Paul, Turbo Tina, DJ Dee) and the garden gnome are now full-body figures with 4 walk frames, facing their movement.
- All zombie and hero frames are packed into one cropped, pre-flipped sprite atlas, so each is drawn with one `drawImage` (no save/scale/rotate per zombie).
- Tests: `python3 test.py`, `python3 v11test.py`, `python3 cuttest.py`, `python3 killpaths.py` (needs `python3 -m http.server 8823`), `python3 playtest.py`, `python3 endless_ap.py move|still`, perf: `python3 perf.py <port> <root>`.
