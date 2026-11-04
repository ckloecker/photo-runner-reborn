# Level Design

See "REQ-SYS-03: Level Setup".

## REQ-LVL-01: Basic Level Design

A level consists of "open space" and solid obstacles/ground.
The outlines of the solid level components shall follow visible lines in the input image, except for bounded gap filling, biome obstacles, and route clearance approved in REQ-LVL-10/11/16 (see "REQ-SYS-03").
The generator shall favor substantial photo-derived shapes and suppress tiny isolated terrain fragments.
Generation shall prioritize accepting photos with usable visible structure and producing safe playable options over numeric density targets.
55–70% open collision-mask cells is a quality target, not a rejection condition.
Sparse photos shall not receive filler merely to reach a ground percentage.
Safe starts and finish areas shall remain clear, with a validated no-drilling main route under REQ-LVL-16.

## REQ-LVL-02: Level Aesthetics

The generated level overlay (see "REQ-SYS-03") shall use a general retro
pixel-art platformer aesthetic and shall not reproduce the distinctive
artwork of an existing game.

## REQ-LVL-03: Automatic Terrain Generation

The game shall normalize image contrast and automatically generate solid
terrain from visible edges in the selected image without requiring the player
to trace the terrain manually.
Terrain selection shall satisfy the clutter and traversal policy in REQ-LVL-01.

## REQ-LVL-04: Image Input

The player shall be able to select an image by uploading a file or by taking a
photo with the device camera. Upload shall remain available when camera access
is unavailable or denied.

## REQ-LVL-05: No Usable Edge

If contrast normalization and edge detection cannot find a usable visible edge
in the selected image, the game shall reject that image and clearly ask the
player to select another one.
Photos with usable edges shall undergo strongest-edge selection and route repair rather than rejection for density, duration, section count, or missing natural supports.

## REQ-LVL-06: Transparent Terrain Overlay

All exposed terrain outlines, including sides, undersides, and excavated boundaries, shall be fully opaque.
Only interior filling shall be 20% transparent (80% opaque), keeping the original image visible through it.

## REQ-LVL-07: Fixed Finish Gate

The exit shall be a conspicuous two-pole gate with a checkered finish banner, approximately twice the character's width and height.
The complete gate artwork and completion area shall remain within the image bounds.
Its initial position shall use safe support within the outer ten percent of a randomly selected level edge, not always the right edge, subject to the non-walking-route rule.
The player shall start at a safe position within the outer ten percent of the opposing edge.
Edge proximity shall be measured from the nearest side of each endpoint's collision footprint, while keeping both complete footprints inside the image.
Placement shall reject start/finish pairs reachable by walking alone, including automatic small steps, slopes, and gravity-driven falls along the solid picture bottom.
Generation shall try alternative safe placements and edges and repair terrain with supplemental platforms before reporting an inability to construct a safe non-walking route.
Within the first sampled edge that admits safe opposing-edge endpoints, generation shall prefer routes that meet the four-to-six-section and twenty-to-forty-second quality targets, selecting the longest verified no-drill route within that preferred set.
If no candidate meets those quality targets, generation shall select the longest verified route among the otherwise valid candidates without rejecting routes solely for missing the targets.
The gate shall remain fixed for the run, even if its supporting terrain is drilled away.
No undrillable terrain shall be added to support it.

## REQ-LVL-08: Image-Aligned Vertical Terrain

Generated terrain shall follow visible features at multiple heights in the
input image rather than reduce the image to one continuous, gently ramped
floor. Separate platforms shall support jumping between image features.
Detected photo edges shall guide generated support, with supplemental bridges and stepping platforms permitted under REQ-LVL-16.
Fixed-height jumps and double jumps under REQ-MOV-05 and background climbing remain available, and drilling is an optional shortcut rather than a requirement to finish.

## REQ-LVL-09: Sparse Platforms and Photo-Aligned Walls

The generator shall retain strong horizontal/slanted and vertical photo
edges as platforms and walls, favoring substantial strong features rather than many tiny fragments.
Platform interruptions shall serve the validated route rather than unconditionally cut filled shapes into artificial rectangular walls.
Generated walls shall follow detected vertical photo edges and support
wall jumping.
Supplemental horizontal platforms and bridges may repair traversal under REQ-LVL-16, but freestanding vertical walls shall not be invented to fake verticality;
photos without usable vertical edges need not produce walls.
Diagonal contours shall remain connected through noise suppression, including shoulder-like slopes.

## REQ-LVL-10: Random Biomes

Status: Approved.

Each generated option shall have a randomly assigned jungle, desert, or underwater biome.
Jungle shall use leafy surfaces, soil filling, solid roots/rocks, and an explorer hat.
Desert shall use sand surfaces, bone-patterned filling, solid rocks/cacti, and an original fedora.
Underwater shall use seabed sand, solid coral/rocks, and a diving bell.
Randomly placed biome elements shall be part of the drillable collision mask, not merely background decoration.
Headwear shall be cosmetic and shall not change character size, controls, gravity, or movement.
Jungle scenery shall include trees approximately three to five character heights tall, layered leafy canopies, ground grass, climbing plants, and hanging vines anchored to terrain.
Desert scenery shall include larger branching cacti, layered rock formations, and bone clusters.
Underwater scenery shall include branching coral, kelp, and layered rocks.
Substantial scenery shall collide and drill along its visible solid silhouette.
Thin grass and leaf accents may be cosmetic.
Solid scenery shall not overlap the start or finish.

## REQ-LVL-11: Random Base Layouts

Status: Approved.

Each generated option shall randomly favor horizontal, vertical, or balanced photo-edge geometry using local detected edge directions rather than whole-object bounding boxes.
Horizontal layouts shall prioritize horizontal/sloped traversal edges, vertical layouts shall prioritize vertical-ish traversal edges, and balanced layouts shall consider both.
Layout preference may outrank raw edge strength to make horizontal and vertical suggestions clearly distinct when the image provides usable edges in both orientations.
Mixed-orientation photos shall produce measurably different collision geometry, not merely different feature processing order.
Small gaps in detected photo contours shall be bridged using morphological closing before enclosed-region filling and platform splitting.
Enclosed photo-derived regions may be filled only as compatible with route clearance and breathing room.
Strong useful edges shall be prioritized over weak clutter when route repair is needed.
Traversal gaps shall remain open after filling.
No global 80% open-space cap shall apply.
The generator shall retain photo alignment, usable traversal gaps, and rejection of images without usable edges.

## REQ-LVL-12: Choose Between Three Suggestions

Status: Approved.

After selecting a photo, the player shall see three playable thumbnails with biome and layout labels before play.
The options shall have distinct biome/layout pairs.
Repeated generation from the same image shall reproduce the same three suggestions under REQ-LVL-17.
Selecting an option shall start exactly its previewed terrain, biome, spawn, and gate.
Reset shall restore that chosen option without rerandomizing.
Scores shall be keyed by the photo and exact generated option, not mixed across different layouts.
The same option shall be retained for both players in a sequential session under REQ-SYS-15.

## REQ-LVL-13: Biome Background Effects

Status: Approved.

Desert shall have sunshine with slowly shimmering rays.
Underwater shall have rising bubbles and soft light shafts.
Jungle shall have dappled sunbeams and drifting leaf motes.
Effects shall be subtle cosmetic layers behind terrain, scenery, player, and finish, keeping the photo and finish readable.
Effects shall not affect collision, movement, or race timing.
Effects shall become static when the player requests reduced motion.

## REQ-LVL-14: Readable Photo Background and Terrain

Status: Approved.

The displayed photo shall be darkened and desaturated while remaining recognizable.
Generated terrain shall have a narrow dark outer border or shadow that does not change collision geometry.
Opaque terrain outlines and 80%-opaque interiors shall remain as specified in REQ-LVL-06.
Exposed terrain edges shall contrast clearly against the displayed photo.
Interior filling shall use a uniform color per biome rather than checker or alternating tile patterns, while preserving the opacity in REQ-LVL-06.
Decorative design elements shall appear occasionally and shall not obscure terrain or the photo.
Thumbnails and gameplay shall use the same background and terrain treatment.
Image analysis shall continue to use the unfiltered original photo.

## REQ-LVL-15: Flying Patrol Enemies

Status: Approved.

Levels shall include predictable flying patrol enemies with wasp artwork in jungle, hovering scarab artwork in desert, and jellyfish artwork underwater.
Each level option shall contain either three avoidable patrols or four to eight combat patrols, selected reproducibly rather than increasing linearly across options.
Combat options shall visibly identify their combat mode with a cartoonish gun in the player's hands.
Patrols shall follow the reproducibly randomized flying paths in REQ-LVL-21 within checked, obstacle-free areas without chasing, becoming stuck, leaving the image, or passing through terrain.
The entire swept enemy footprint shall avoid the spawn and finish with a safety margin.
Thumbnails shall show the initial enemies and selecting or resetting an option shall retain its exact patrol definitions.
Enemy motion shall begin with the race timer, leaving the initial previewed scene and idle player safe.
Contact with a living patrol shall reset the entire run as specified in REQ-SYS-10/14.
Patrols defeated by a stomp or permitted projectile shall no longer collide with the player.

## REQ-LVL-16: Photo-Aligned Reference Route

Status: Approved.

Generation shall plan a contiguous traversal corridor aligned to the strongest detected photo edges before finalizing filling, scenery, checkpoints, and enemies.
Every offered option shall include a reference route verified with the actual movement and enemy simulation without drilling and shall visit every generated checkpoint before reaching the exit.
Four to six traversal sections and twenty to forty seconds are quality targets rather than rejection conditions.
The planner shall compare its bounded valid candidates and select the longest verified no-drill route among candidates meeting both quality targets, falling back to the longest otherwise valid route if none meet them.
The route shall provide varied traversal and breathing room rather than a straight walk or continuous digging.
Idle waiting shall not be used to inflate the reference duration.
The corridor shall normally provide at least twelve cells of width and eighteen cells of height, with larger clearance for jump arcs.
Generation shall progressively repair traversal by connecting useful edges, adding longer bridges, and adding horizontal stepping platforms where natural supports are missing.
There is no universal eighteen-cell limit or two-ended attachment requirement for supplemental platforms.
The strongest usable photo edges shall take priority over secondary playability preferences, while safe endpoints, clear movement space, and a validated no-drill route remain mandatory.
Additions shall serve specific route or safe-area needs rather than an arbitrary occupancy quota.
Connectors and supplemental platforms shall be visible, collidable, drillable, previewed, and restored on reset.
No unsupported freestanding vertical walls shall be invented to achieve verticality.
Filling and scenery shall not obstruct the validated route, and enemy timing shall be included in final route verification.
Walking-only finishes shall remain rejected.
Existing free background climbing, fixed-height jumps and double jumps under REQ-MOV-05, and drilling shall remain available, including skilled shortcuts.
The reference duration is not a guaranteed minimum completion time for other routes.
Generation shall use bounded planning and repair stages, preserving hard safety and no-drill completion guarantees instead of relaxing them.
Validation shall cover diverse sparse, busy, horizontal, and vertical images and the supplied portrait rather than only a specially suitable fixture.

## REQ-LVL-17: Reproducible Random Generation

Status: Approved.

The random number engine used for level generation shall be initialized with the same fixed seed and initial state at the start of every generation of three suggestions.
All random choices affecting the suggestions shall use this reproducible random sequence, including biome/layout assignment, route and endpoint selection, scenery, checkpoints, non-drillable terrain, moving platforms, pickups, enemy mode, and initial patrol definitions.
The same input image shall always produce the very same three suggestions in the same order, with identical previews, terrain, biome/layout labels, start and finish positions, checkpoints, scenery, moving platforms, pickups, enemy mode, and initial patrol definitions.
Results shall not depend on previous generations, player name, current time, or browser session.
Random biome, layout, and edge selection under REQ-LVL-07/10/11 shall remain pseudorandom within this reproducible sequence rather than being resampled unpredictably.

## REQ-LVL-18: Temporary Pickups

Status: Approved.

Each generated level option shall contain one to three speed pickups and one to three mushroom pickups.
Touching a speed pickup shall double the character's movement speed in every locomotion mode for five seconds.
Touching a mushroom pickup shall subtract two seconds from the player's elapsed time, and repeated mushrooms may produce negative times.
Speed effects shall not stack, and collecting another speed pickup while the effect is active shall refresh its five-second duration.
Each collected mushroom shall apply its own two-second time subtraction.
Each mushroom collection shall visibly announce the amount subtracted in a transient, screen-reader-readable gameplay status message.
The visual "-2s" label shall appear at the collected mushroom's position and fade away, including during fullscreen play.
Pickups shall be visible, collectible, and outside the required no-drill route clearance.
Pickup artwork and collection bounds shall measure eight by eight terrain cells, twice the former width and height.
Speed pickups shall be recognizable bright-yellow lightning bolts, and mushrooms shall be vivid magenta/red with contrasting spots, stems, and dark outlines.
Both types shall have a soft colored aura in previews and gameplay.
The aura shall be decorative only: touching it shall neither collect an item nor block movement, and pickups themselves shall not be solid obstacles.
Run reset shall restore collected pickups and clear active effects.

## REQ-LVL-22: Non-Drillable Terrain

Where safe photo-derived solid terrain exists outside the protected route and exit, generated levels shall mark a clearly visible non-drillable stretch that looks distinct from drillable terrain.
With a vertical finish edge, the stretch shall be at least twelve cells wide and one fifth of the level height, rounded up to whole cells.
With a horizontal finish edge, the stretch shall be at least one fifth of the level width, rounded up to whole cells, and four cells high.
If no qualifying photo-derived stretch exists, the option shall preserve photo-derived geometry and remain playable without adding non-drillable terrain.
Each option shall retain a drillable path to the exit, even when that path is longer than the most direct route.
Non-drillable terrain shall not support or protect the finish gate or obstruct the validated no-drill route.

## REQ-LVL-23: Required Checkpoints

Each generated level option shall contain one or two reproducibly placed intermediate checkpoints on the validated route, with the count chosen randomly.
Placement shall maximize geographic spread of mandatory visits across the image rather than randomly clustering checkpoints near the start, finish, or one another.
Among equally spread placements, generation shall prefer the longer minimum direct travel distance through all mandatory visits, allowing checkpoints to be collected in either order.
Every checkpoint shall be clearly visible with a glow and must be touched before the exit opens.
Collected checkpoints shall disappear completely, including their glow, while retaining collection progress until reset.
The closed exit shall show a conspicuous red barrier across its opening and a contrasting padlock, and touching all checkpoints shall remove both indicators to visibly open it.
While locked, the exit shall also show a bright red X spanning the black-and-white finish banner, drawn over the checks and removed immediately when the exit opens.
Reset shall restore all checkpoint markers and close the exit.

## REQ-LVL-24: Strongest-Edge Priority

Terrain selection shall prioritize usable photo edges matching the selected horizontal or vertical layout, ranking matching edges by strength before filling remaining slots from the other orientation.
Balanced layouts shall rank all usable photo edges by strength without an orientation preference.
Strongest-edge selection shall remain subject to the safe-start, no-drill completion, clear-route, and in-bounds requirements in REQ-LVL-07/16.

## REQ-LVL-19: Optional Moving Platforms

Status: Approved.

Each generated level option shall contain two visible, collidable moving platforms, each twelve cells wide and three cells high.
Platforms shall move horizontally at eighteen terrain cells per second within bounded obstacle-free paths.
Platforms shall remain optional shortcuts and shall not be required by the verified no-drill route.
When the player drills away terrain blocking a platform path, that platform's movement bounds shall extend into the newly cleared space.
When a platform's horizontal movement would intersect the player, it shall stop before contact without pushing the player, and resume in its current direction when the path is clear.
Fractional platform contact shall not embed or trap the player, and carrying a rider shall stop before the rider intersects terrain, another platform, or an image boundary.
Platform motion shall begin with the race timer.
Previews shall show each platform at its initial position, and reset shall restore the initial positions.

## REQ-LVL-20: Uniform Terrain Fill and Edge Contrast

Status: Approved.

Exposed terrain edges shall have sufficient contrast against the displayed photo to remain readily distinguishable.
Interior terrain filling shall use a uniform color per biome without checker or alternating tile patterns.
Interior opacity shall remain as specified by REQ-LVL-06.
Decorative design elements shall be occasional, photo-compatible, and shall not obscure the terrain or the photo.

## REQ-LVL-21: Reproducible Random Flying Paths

Status: Approved.

Enemy flight paths shall be randomly generated rather than limited to horizontal back-and-forth movement.
Paths shall vary both horizontal and vertical position while preserving the safe-area and route-clearance constraints in REQ-LVL-15/16.
The selected option shall retain each enemy's path and initial motion state so that resetting the level replays the same flight.
Path generation shall use the reproducible random sequence required by REQ-LVL-17.