# System Architecture

The application is a dependency-free static web app served from the repository root.

The root entry page owns setup, previews, gameplay, completion, accessibility announcements, and feedback controls.

The runtime is divided into deterministic level generation, a testable simulation core, and canvas rendering/input adapters.

Photo-derived terrain and all generated option data are created once per photo and retained unchanged when an option is selected or reset.

The simulation uses terrain-cell world coordinates and a fixed level coordinate system independent of camera zoom.

The browser stores only player names and leaderboard entries in cookies; photos remain in memory and are never uploaded.

The game loop advances simulation state from elapsed frame time and draws cosmetic effects without changing physics or race timing.

Mobile controls and the follow camera are presentation adapters over the same movement and simulation rules used by keyboard play.

## Requirement Coverage

The system shell covers REQ-SYS-01/02/03/04/05/06/08/10/11/12/14/15/16/17/18/19/20.

The generator covers REQ-LVL-01/03/04/05/07/08/09/10/11/12/15/16/17/18/19/21/22/23/24.

The renderer covers REQ-LVL-02/06/10/13/14/20 and REQ-CHR-01/02/03/04/05.

The simulation covers REQ-MOV-01/02/03/04/05/06/07/10/11 and REQ-SYS-04/08/10/14/15.
