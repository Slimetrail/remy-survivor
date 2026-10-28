# Remy Survivor
Original goofy zombie survivor-style phone game. Help Remy fight from Niceville, FL home to Pamplico, SC with rubber chickens, banana boomerangs and whoopee cushions. Play: https://slimetrail.github.io/remy-survivor/

## v11: zombie tiers, comic intro, town panels
- Tier 1 (horde): shamb, runner, dog, spit, clown. Tier 2 (mutated): charger (telegraphed rush), spewer (vomit -> INFESTED 10s: double horde from screen edges, x1.25 speed; death glob lures tier-1 within 300px for 6s), grabber (0.7s stun, 2s cooldown), bloat, tank (lunge). Tier 3: boss (red-lane charge + ground-slam shockwave). All stats in `ZT` in game.js.
- Scene density per town comes from `tier(pop)` in towns-data.js (2020 Census via Wikipedia): major >=150k, mid >=50k, town >=10k, small >=3k, rural <3k. Add a new town by adding its population to `TOWNS`.
