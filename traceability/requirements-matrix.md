# Requirements Traceability Matrix

Each active requirement is linked to its design, implementation, and verification.

Browser unit and system pages are executable checks; acceptance cases are planned manual verification and are not represented as executed evidence.

| Requirement | Design | Implementation | Verification |
|---|---|---|---|
| REQ-SYS-01 | [System architecture](../design/system/system-architecture.md) | [Entry page](../index.html), [app](../src/app.js) | AT-01; root-entry system check |
| REQ-SYS-02 | [System architecture](../design/system/system-architecture.md) | [Canvas renderer](../src/renderer.js) | AT-03 |
| REQ-SYS-03 | [System architecture](../design/system/system-architecture.md) | [Photo setup and generator](../src/app.js), [engine](../src/game-core.js) | AT-01; root-entry system check |
| REQ-SYS-04 | [System architecture](../design/system/system-architecture.md) | [Timer and completion](../src/game-core.js), [app](../src/app.js) | AT-03; movement timer system check |
| REQ-SYS-05 | [System architecture](../design/system/system-architecture.md) | [Name validation](../src/game-core.js), [setup form](../index.html) | Player-name unit check |
| REQ-SYS-06 | [System architecture](../design/system/system-architecture.md) | [Leaderboard and cookies](../src/app.js), [ranking](../src/game-core.js) | Leaderboard unit checks; AT-03 |
| REQ-SYS-08 | [System architecture](../design/system/system-architecture.md) | [Run reset](../src/game-core.js), [reset controls](../src/app.js) | Reset unit and system checks; AT-03 |
| REQ-SYS-10 | [System architecture](../design/system/system-architecture.md) | [Patrol collision and reset](../src/game-core.js) | AT-03 |
| REQ-SYS-11 | [System architecture](../design/system/system-architecture.md) | [Root entry and relative assets](../index.html) | Root-entry system check |
| REQ-SYS-12 | [System architecture](../design/system/system-architecture.md) | [Feedback controls](../index.html), [feedback links](../src/app.js), [issue form](../.github/ISSUE_TEMPLATE/feedback.yml) | AT-04 |
| REQ-SYS-13 | [System architecture](../design/system/system-architecture.md) | [Pages workflow](../.github/workflows/pages.yml), [metadata stamper](../scripts/stamp-deployment.py) | Deployment-stamper unit tests; AT-04 |
| REQ-SYS-14 | [System architecture](../design/system/system-architecture.md) | [Failure reset](../src/game-core.js) | AT-03 |
| REQ-SYS-15 | [System architecture](../design/system/system-architecture.md) | [Round and player selection](../src/app.js), [run state](../src/game-core.js) | AT-03 |
| REQ-SYS-16 | [System architecture](../design/system/system-architecture.md) | [Gameplay instructions](../index.html), [responsive styles](../styles.css) | AT-03 |
| REQ-SYS-17 | [System architecture](../design/system/system-architecture.md) | [Completion messages](../src/app.js) | AT-03 |
| REQ-SYS-18 | [System architecture](../design/system/system-architecture.md) | [Full-screen control](../src/app.js), [game frame](../styles.css) | AT-04 |
| REQ-SYS-19 | [System architecture](../design/system/system-architecture.md) | [Touch camera](../src/renderer.js) | AT-03 |
| REQ-SYS-20 | [System architecture](../design/system/system-architecture.md) | [Joystick and action controls](../index.html), [touch input](../src/app.js), [touch styles](../styles.css) | AT-03 |
| REQ-CHR-01 | [System architecture](../design/system/system-architecture.md) | [Pixel-art player](../src/renderer.js) | AT-02 |
| REQ-CHR-02 | [Engine design](../design/detailed/game-engine.md) | [Player dimensions](../src/game-core.js), [player renderer](../src/renderer.js) | Player-size unit check |
| REQ-CHR-03 | [System architecture](../design/system/system-architecture.md) | [Favicon](../assets/favicon.svg), [entry declaration](../index.html) | AT-04 |
| REQ-CHR-04 | [System architecture](../design/system/system-architecture.md) | [Biome headwear](../src/renderer.js) | AT-02 |
| REQ-CHR-05 | [System architecture](../design/system/system-architecture.md) | [Underwater climbing pose](../src/renderer.js) | AT-02 |
| REQ-MOV-01 | [Engine design](../design/detailed/game-engine.md) | [Keyboard and touch input](../src/app.js), [simulation](../src/game-core.js) | AT-02 |
| REQ-MOV-02 | [Engine design](../design/detailed/game-engine.md) | [Wall jump and dust](../src/game-core.js), [renderer](../src/renderer.js) | Wall-jump unit check; AT-02 |
| REQ-MOV-03 | [Engine design](../design/detailed/game-engine.md) | [Directional drill](../src/game-core.js) | AT-02 |
| REQ-MOV-04 | [Engine design](../design/detailed/game-engine.md) | [Air movement](../src/game-core.js) | AT-02 |
| REQ-MOV-05 | [Engine design](../design/detailed/game-engine.md) | [Jump and double jump](../src/game-core.js) | Jump unit checks; AT-02 |
| REQ-MOV-06 | [Engine design](../design/detailed/game-engine.md) | [Bounds and ceiling collision](../src/game-core.js) | AT-02 |
| REQ-MOV-07 | [Engine design](../design/detailed/game-engine.md) | [Contact and jump grace](../src/game-core.js) | AT-02 |
| REQ-MOV-10 | [Engine design](../design/detailed/game-engine.md) | [Background climbing](../src/game-core.js), [swim/climb visuals](../src/renderer.js) | Climbing unit check; AT-02 |
| REQ-MOV-11 | [Engine design](../design/detailed/game-engine.md) | [Projectiles and stomps](../src/game-core.js), [combat art](../src/renderer.js) | AT-03 |
| REQ-LVL-01 | [System architecture](../design/system/system-architecture.md) | [Terrain and route generation](../src/game-core.js) | AT-01/03 |
| REQ-LVL-02 | [System architecture](../design/system/system-architecture.md) | [Original pixel-art rendering](../src/renderer.js) | AT-03 |
| REQ-LVL-03 | [Engine design](../design/detailed/game-engine.md) | [Photo edge analysis](../src/game-core.js) | Suggestion unit and unusable-image system checks |
| REQ-LVL-04 | [System architecture](../design/system/system-architecture.md) | [Upload and camera inputs](../index.html), [photo reader](../src/app.js) | AT-01 |
| REQ-LVL-05 | [Engine design](../design/detailed/game-engine.md) | [Edge rejection](../src/game-core.js), [setup error](../src/app.js) | Unusable-image system check |
| REQ-LVL-06 | [System architecture](../design/system/system-architecture.md) | [Terrain opacity and outlines](../src/renderer.js) | AT-03 |
| REQ-LVL-07 | [Engine design](../design/detailed/game-engine.md) | [Endpoint and gate generation](../src/game-core.js), [gate rendering](../src/renderer.js) | AT-01/03 |
| REQ-LVL-08 | [Engine design](../design/detailed/game-engine.md) | [Photo platforms and route supports](../src/game-core.js) | AT-01/03 |
| REQ-LVL-09 | [Engine design](../design/detailed/game-engine.md) | [Oriented edge selection](../src/game-core.js) | AT-01/03 |
| REQ-LVL-10 | [System architecture](../design/system/system-architecture.md) | [Biome generation](../src/game-core.js), [scenery and art](../src/renderer.js) | AT-03 |
| REQ-LVL-11 | [Engine design](../design/detailed/game-engine.md) | [Layout selection](../src/game-core.js) | Deterministic suggestion unit check; AT-01 |
| REQ-LVL-12 | [System architecture](../design/system/system-architecture.md) | [Preview cards and selection](../src/app.js), [preview renderer](../src/renderer.js) | AT-01 |
| REQ-LVL-13 | [System architecture](../design/system/system-architecture.md) | [Biome effects](../src/renderer.js) | AT-03 |
| REQ-LVL-14 | [System architecture](../design/system/system-architecture.md) | [Photo and terrain treatment](../src/renderer.js) | AT-03 |
| REQ-LVL-15 | [Engine design](../design/detailed/game-engine.md) | [Patrol paths and collision](../src/game-core.js), [enemy art](../src/renderer.js) | AT-03 |
| REQ-LVL-16 | [Engine design](../design/detailed/game-engine.md) | [Route supports and simulation replay](../src/game-core.js) | Route-replay unit check; approved-fixture system check; AT-01/03 |
| REQ-LVL-17 | [Engine design](../design/detailed/game-engine.md) | [Seeded random generator](../src/game-core.js), [photo hash seed](../src/app.js) | Random and suggestion unit checks |
| REQ-LVL-18 | [Engine design](../design/detailed/game-engine.md) | [Pickups and speed/time effects](../src/game-core.js), [pickup rendering](../src/renderer.js) | AT-03 |
| REQ-LVL-19 | [Engine design](../design/detailed/game-engine.md) | [Moving-platform state](../src/game-core.js), [platform rendering](../src/renderer.js) | AT-03 |
| REQ-LVL-20 | [System architecture](../design/system/system-architecture.md) | [Terrain fill and edge contrast](../src/renderer.js) | AT-03 |
| REQ-LVL-21 | [Engine design](../design/detailed/game-engine.md) | [Seeded two-axis patrol paths](../src/game-core.js) | Deterministic suggestion unit check; AT-03 |
| REQ-LVL-22 | [Engine design](../design/detailed/game-engine.md) | [Non-drillable terrain mask](../src/game-core.js), [marked rendering](../src/renderer.js) | AT-03 |
| REQ-LVL-23 | [Engine design](../design/detailed/game-engine.md) | [Checkpoint gating](../src/game-core.js), [gate/checkpoint rendering](../src/renderer.js) | AT-03 |
| REQ-LVL-24 | [Engine design](../design/detailed/game-engine.md) | [Strongest-edge ranking](../src/game-core.js) | Deterministic suggestion unit check; AT-01 |

REQ-SYS-07 and REQ-SYS-09 are superseded in the requirements; REQ-MOV-08 and REQ-MOV-09 are superseded and are therefore not active implementation targets.

REQ-LVL-16's route `verified` flag is set only after collision-free waypoint paths are executed through the movement, checkpoint, platform, and enemy simulation without drilling.
