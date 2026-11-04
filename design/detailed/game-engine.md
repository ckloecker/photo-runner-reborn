# Game Engine Design

The engine exposes deterministic generation and simulation functions from `src/game-core.js` so browser tests can exercise gameplay rules without relying on drawing output.

`createRandom(seed)` supplies reproducible pseudo-random choices for every generated feature.

`generateSuggestions(image, seed)` returns exactly three immutable option descriptions with distinct biome/layout pairs, photo-derived terrain, safe endpoints, route data, checkpoints, moving platforms, pickups, and patrol paths.

`createRun(option, players)` creates fresh mutable state while retaining the selected immutable option as the reset source.

`pressJump(run, timestampMs)` handles surface/grace jumps, a single airborne double jump, and climbing press-to-drop.

`stepRun(run, input, deltaSeconds, timestampMs)` advances controls, collisions, excavation, enemies, platforms, pickups, checkpoints, timer, and completion in world coordinates.

`resetRun(run)` restores all mutable state from the selected option and clears elapsed time and held input.

`verifyCourse(level)` validates route geometry, then `replayCourse(level)` searches collision-free movement paths between waypoints and executes them through the simulation until all checkpoints and the exit are reached without drilling.

`getLeaderboardRows(entries, currentAttemptId)` sorts stable score rows, returns at most ten persisted rows, and separately identifies the exact current attempt.

The canvas renderer consumes engine state and never owns collision or progression decisions.

All document sentences remain on individual lines so changes can be reviewed cleanly.
