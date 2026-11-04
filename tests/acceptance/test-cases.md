# Acceptance Test Cases

## AT-01: Setup and Photo Acceptance

Requirements: REQ-SYS-01/03/05/11 and REQ-LVL-03/04/05/12/17.

Enter two letter-only runner names, select a photo using upload, and verify three distinct biome/layout previews appear.

Select a featureless image and verify that the game clearly asks for another photo without leaving setup.

Regenerate suggestions from the same photo and verify the labels, terrain, endpoints, and route remain identical.

## AT-02: Movement and Reset

Requirements: REQ-CHR-02/04/05 and REQ-MOV-01/02/03/04/05/06/07/10.

Verify six-by-nine character collision, walking speed, fixed floor jump, one airborne double jump, wall jump, and ceiling collision.

Attach to the background, climb diagonally, release to hold, then press jump and verify immediate drop without a launch.

Drill horizontally, diagonally, and vertically and verify open-space speed, active excavation speed, preserved support, and reset restoration.

## AT-03: Course, Failure, and Completion

Requirements: REQ-LVL-01/06/07/08/09/10/11/13/14/15/16/17/18/19/20/21/22/23/24 and REQ-SYS-04/08/10/14/15/17/18/19/20.

Verify a preview exactly matches selected gameplay and that the course contains a route, locked exit, checkpoints, moving platforms, pickups, and seeded patrols.

Collect all checkpoints, complete the course, and verify score attribution, stable top-ten ranking, the exact Your run row, and next-player selection.

Trigger a patrol collision and a bottom fall and verify both restart the same option without saving an attempt.

Verify full-screen entry and exit, keyboard controls, touch controls, mobile follow framing, and reduced-motion behavior.

## AT-04: Feedback and Deployment

Requirements: REQ-SYS-12/13 and REQ-CHR-03.

Verify the favicon is available before photo selection and feedback links expose category, severity, branch, and full commit metadata without private game data.

Run the Pages workflow from `develop` and verify the artifact contains only runtime files with its exact branch and commit injected.
