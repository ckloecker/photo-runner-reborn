# Character Movements

## REQ-MOV-01: Controls

If the game is accessed from a device with a keyboard, the controls shall be:
* D or right arrow: Move right
* A or left arrow: Move left
* W or up arrow: Enter background climbing (see "REQ-MOV-10")
* S or down arrow: Climb down or aim the drill down
* Space: Press to jump immediately; press again in the air to double jump
* Return: Use the drill (see "REQ-MOV-03")

If the game is accessed from a mobile/touch-only device, the controls shall be:
* Left thumb: Controls left and right
* Right thumb: Controls jump
* A dedicated on-screen drill button: Use the drill (see "REQ-MOV-03")

Touch controls shall provide up/down buttons as well as left/right buttons.
Return or the dedicated drill button shall remain held to drill.
W/up shall not jump.
Space shall be the only keyboard jump control; the touch JUMP control shall retain the same behavior.
While background climbing, pressing either jump control shall drop immediately instead of jumping (REQ-MOV-10).

## REQ-MOV-02: Wall Jump

The character shall jump immediately on pressing the jump control within three terrain cells of a floor, either side of a terrain wall, or either vertical image side border (REQ-MOV-07).
A wall jump shall launch upward and away from the wall at normal horizontal movement speed, with the same fixed vertical height as a floor jump.
Outside the surface-distance tolerance and contact-loss grace distance under REQ-MOV-07, a press shall use the single airborne double jump under REQ-MOV-05 if it is available, and otherwise shall not launch unless buffered until contact.
A wall-grace jump shall launch upward and away from the last-contacted wall.
Every wall jump, including a wall-grace jump, shall show a brief visual burst of dust puffs on the side of the wall the character kicked off from, lasting about 300 milliseconds and staying within the image.
The burst shall be cosmetic only, shall not appear for floor or double jumps, and shall clear on run reset.
While background climbing, the jump control drops instead, as specified by REQ-MOV-10.
While actively excavating, horizontal travel uses the limit in REQ-MOV-03.

## REQ-MOV-03: Drill

Holding Return or the touch DRILL control shall operate a visible directional drill, not a surrounding bubble.
The drill shall cut a narrow tunnel in the pressed direction, including diagonally, upward while climbing, and downward while standing.
With no direction pressed it shall drill in the character's horizontal facing direction.
When drilling horizontally while walking, the tunnel shall not excavate cells below the player's feet or remove the supporting floor.
The horizontal cut shall preserve the first supporting row below the character's footprint, including when floating-point rounding puts the feet infinitesimally beyond an integer row.
Repeated left/right excavation shall not deepen its own floor.
Background-climbing horizontal excavation shall retain its vertical position when no vertical direction is pressed.
Excavated terrain shall remain removed for the current run, including terrain supporting the finish gate.
While the drill is actively excavating intact terrain, movement shall be limited to ten terrain cells per second in every controlled direction, with normalized diagonals and the existing speed-pickup multiplier.
Holding the drill in already-open space shall retain normal eighty-cell-per-second horizontal movement.
Background climbing shall remain twenty cells per second with normalized diagonals when not actively excavating, including while holding the drill in open space.
Excavation shall not change double-jump availability or vertical jump velocity, and shall not enable hovering outside background climbing.
Movement limits shall hold across supported frame durations and repeated resets without duplicate animation loops.
Drilling while airborne shall switch the player into background-climbing movement while the drill remains active.
Downward drilling shall limit vertical travel to ten terrain cells per second while actively excavating.

## REQ-MOV-04: Air Movement

While "in air", i.e., executing a jump or falling, the character shall move left or right at normal speed unless a temporary speed pickup is active under REQ-LVL-18.
Background climbing and active excavation are exceptions: REQ-MOV-10 specifies climbing speed and suspension of gravity, and REQ-MOV-03 limits horizontal active excavation without changing gravity.

## REQ-MOV-05: Fixed-Height Jumps and Double Jump

Pressing Space or touch JUMP near an eligible surface shall immediately launch a jump of fixed height, approximately 38.6 terrain cells in unobstructed space.
Holding or releasing the control shall not change jump height or launch again.
While airborne and outside floor/wall contact and grace, a fresh press shall launch exactly one double jump.
A double jump shall reset vertical velocity to the same fixed launch velocity, rising approximately another 38.6 cells, regardless of whether the character was rising or falling.
A double jump shall keep normal player-controlled horizontal movement and shall not launch away from any wall.
The double jump shall be restored on landing, on wall contact within the REQ-MOV-07 tolerance, and on background attachment under REQ-MOV-10.
A character that walks or falls off a ledge without jumping shall keep its double jump available.
There shall be no further airborne jumps until the double jump is restored.
Holding the control through landing shall not automatically jump again.
Gravity and collision shall remain active, and ceiling contact shall stop upward movement.
Background attachment shall retain press-to-drop under REQ-MOV-10.
There shall be no hold meter and no charge bar above the character.
Normal horizontal movement shall remain available while jumping, subject to the active-excavation limit.
An immediate jump shall start the run timer.

## REQ-MOV-06: Level Ceiling

The top boundary of the image shall act as a solid ceiling. The character
shall remain inside that boundary; hitting it shall stop upward movement
and allow the character to fall.
An attached background climber shall instead remain gripping the wall under REQ-MOV-10.
The camera shall remain fixed except for the touch-first mobile follow behavior in REQ-SYS-19.

## REQ-MOV-07: Forgiving Surface Contact

Floor and wall contact for launching shall allow a distance of up to three terrain cells.
Jump presses shall be buffered for 150 milliseconds before contact, allowing a still-held control to launch immediately on arrival.
A press is only buffered when no double jump is available, and a release before contact shall cancel the buffered press rather than queue a later launch.

After walking off a cliff, having support removed, or otherwise losing floor contact, a jump press shall still launch a floor jump while the character remains within three terrain cells of its position at the last floor contact.
After losing wall contact, a jump press shall still launch a wall jump while the character remains within four terrain cells of its position at the last wall contact.
Grace distances shall be straight-line distances, so falling straight down cannot extend grace indefinitely.
Floor grace shall take precedence over wall grace, and current contact shall take precedence over both.
A launch shall consume both graces, and background attachment shall clear them, so grace never grants an additional airborne jump.
A grace jump is a floor or wall jump and shall not consume the double jump.

Walking shall follow inclines and declines, including descending floor snapping within three cells.
Floor snapping shall never pull a rising jump back onto the floor.
Terrain walls shall be actual terrain, while the left and right image borders shall also grant wall contact and wall jumps.
The top image boundary remains the ceiling specified by REQ-MOV-06, and the bottom remains the floor specified by REQ-MOV-08; neither shall grant wall jumps.

## REQ-MOV-08: Bottom-Edge Run Reset

Status: Superseded by REQ-SYS-14.

Falling to the image bottom shall reset the entire run under REQ-SYS-14.
The image bottom shall no longer be a safe surface for continued play.

## REQ-MOV-09: Superseded Charge-and-Release Interaction

Status: Superseded by the approved fixed-height double-jump revision in REQ-MOV-01/02/05/07.

The previous hold-to-charge and release-to-launch interaction, and the later 250-millisecond hold-to-boost variable-height jump, are both replaced by fixed-height launch-on-press with one airborne double jump.
Failure resets under REQ-MOV-08/REQ-SYS-14 and background press-to-drop under REQ-MOV-10 remain unchanged.

## REQ-MOV-10: Background Climbing

Pressing W/up or touch UP shall enter background-climbing mode without requiring nearby terrain.
The character shall visibly grip the background with alternating hand and foot movements, as though climbing the back wall rather than floating inside a bubble.
Directional controls shall move the climbing character at one quarter of normal walking speed, with diagonal movement normalized.
Releasing directional controls shall hold position without gravity.
When the character's feet meet terrain or the solid image bottom while descending, climbing shall end and normal walking shall resume.
Holding Up shall allow climbing away from a standing position.
Pressing Space or touch JUMP while attached shall immediately detach and drop the character, restoring gravity without an upward launch.
Holding or releasing that same jump press shall not launch, even if the character lands before release.
After dropping, the restored double jump shall remain available for a fresh press.
Held Up shall not automatically reattach after dropping; a new Up press shall be required.
Climbing shall respect terrain collisions and the image boundaries unless the directional drill removes terrain.
Climbing movement and immediate jumping shall count as elapsed race time.

## REQ-MOV-11: Enemy Combat

Jumping onto a flying patrol from above shall defeat that patrol and bounce the player upward.
Combat level options with four to eight patrols shall allow shooting, while three-patrol options shall not.
The player's hands shall visibly hold a cartoonish gun in combat options.
Pressing X or the touch SHOOT control shall fire one straight projectile in the facing direction.
Shooting shall have unlimited ammunition and a 0.5-second cooldown, and a projectile hit shall defeat one patrol.
Enemy defeat and projectiles shall be cleared by run reset.
