# Grow & Build — Master Project Specification

Version: 1.0 | Date: 2026-10-25 | Status: implementation-ready brief

## Purpose
Build a web application for DepEd teachers using Antigravity. Recognize participation, effort, reasoning, improvement, and teamwork through individual virtual fish, group house construction, and shared class challenges. Support teacher-led classroom projection without student devices.

## Product invariants
- One separate aquarium per class; never mix class records.
- One fish per student enrollment within a class, not one collective fish.
- Individual participation points grow the student's fish.
- Group building points construct a temporary group's house.
- Class challenge progress unlocks shared aquarium decorations.
- These three balances are separate; no implicit point transfers.
- Grouping, moving members, and ungrouping never reset individual fish.
- No illness, punishment, or growth loss for absence or inactivity.
- Private classroom records; public previews use fictional data.

## Users and technology
MVP users are authenticated teachers; students view progress through a teacher-controlled display. Student accounts and school administrators are future work.
Antigravity is the development environment. Proposed implementation: React, TypeScript, responsive CSS, Firebase Authentication, Firestore, and Firebase Hosting. Firebase remains a proposed choice; document the selected stack before implementation. Do not claim DepEd affiliation or endorsement.

## Pages and navigation
1. Public landing page: product explanation, fictional aquarium preview, fish growth, group houses, shared achievements, how it works, Get Started, Teacher Sign In, privacy and support links. Suggested headline: “Grow participation. Build teamwork. Celebrate every contribution.”
2. Registration/sign-in and password recovery.
3. Teacher dashboard: class cards with name, optional subject/grade, enrollment count, aquarium preview, current challenge, Open Class; create/edit/archive controls.
4. Class workspace tabs: Aquarium, Students, Group Activities, Class Challenges, Award History, Activity History, Settings.
5. Full-screen teacher-controlled displays: Aquarium, Group Village, Class Challenge; switching display does not change data.

## Class and roster management
Create/edit/archive classes. Archive is reversible and preserves history; archived classes are read-only until restored. Add students manually or paste one name per line with a review step. Use unique IDs, allow duplicate names, and provide optional display names and fish names. Search students and select several for batch awards. Removing students from future activities must preserve historical records. A person enrolled in multiple classes has independent class fish/progress.

## Individual fish and evolution system
- **Shared starter**: Every student begins with the exact same tiny goldfish (Starter, 0 points, `/assets/fish/starter.png`).
- **Continuous growth**: Every individual participation point increases the current fish's visual size slightly, up to a configurable cap (baseline scale 0.55 at 0 pts, growing continuously +0.009 per point up to cap at 1.45 at 100 points). Visual size is preserved when transforming across milestones while respecting unique species proportions. Student name labels remain readable at a constant size. Group building points never alter fish size or individual milestones.
- **Milestones and collections (41 unique designs cataloged and active)**:
  - 0 points: Shared Starter — 1 design (`starter`, Starter Goldfish).
  - 10 points: Natural — independently select with equal probability from 10 distinct designs (`N01` through `N10`: Guppy, Neon Tetra, Zebra Danio, Harlequin Rasbora, Cherry Barb, Southern Platy, Green Swordtail, Honey Gourami, Bronze Corydoras, Kuhli Loach).
  - 25 points: Rare — independently select with equal probability from 10 distinct designs (`R01` through `R10`: Sapphire Discus, Marble Angelfish, Crown Betta, Butterfly Koi, Boesemani Rainbowfish, German Blue Ram, Celestial Pearl Danio, Threadfin Rainbowfish, Pearl Gourami, Blue Acara).
  - 50 points: Magical — independently select with equal probability from 10 distinct designs (`MG01` through `MG10`: Moonbeam, Crystalfin, Emberfin, Frostveil, Blossomtail, Aurora, Stormspark, Sunburst, Mossglow, Starlight).
  - 100 points: Mythical — independently select with equal probability from 10 distinct designs (`MY01` through `MY10`: Dragonfin, Phoenix Fish, Celestial Leviathan, Pearl Guardian, Abyssal Monarch, Cloud Serpent, Solar Sovereign, Lunar Oracle, Tidal Titan, Dreamweaver).
  - Every catalog entry has its own transparent asset file (`/assets/fish/{id}.png`). Fallback rendering is student-specific and deterministic (`hash(studentId:milestone)`), preventing different students from ever rendering identical fallback designs.
- **Independent permanent random outcomes**: Students cannot choose or reroll their fish. Different students may receive the same fish design, but outcomes are rolled independently per student and milestone. A random result is NEVER shared across the class. Batch awards must make separate selections for each qualifying student. The selected fish for each milestone is stored permanently upon first reaching that threshold (`student.evolutionHistory`). If a single award crosses multiple milestones, each missing milestone outcome is generated and stored in ascending sequence. Refreshing, signing in, grouping, or ungrouping never rerolls fish.
- **Non-destructive repair preview**: Existing saved evolutions are never silently rerolled. The teacher workspace provides an Evolution Integrity Audit and Repair Preview interface that identifies records with missing histories or legacy uniform sample defaults, displaying a side-by-side comparison of current vs proposed independent selections with images before requiring teacher confirmation.
- **Undo and re-earning**: An undo restores the fish form and size matching the corrected points balance while preserving all unlocked outcomes in the student's evolution history. Re-crossing a previously reached milestone restores the exact same fish.
- **Evolution history**: Each student record preserves unlocked milestones, fish forms, and earned glow achievements.
- **Evolution glow reward (strictly separated from species selection)**:
  - The first 10 students in EACH CLASS to reach EACH milestone receive that milestone's distinct glow:
    - Natural (10 pts): Soft aqua glow.
    - Rare (25 pts): Sapphire blue glow.
    - Magical (50 pts): Violet sparkles glow.
    - Mythical (100 pts): Golden halo glow.
  - Tracked independently per class and per milestone based on award ledger qualification timestamps.
  - Glow eligibility is purely cosmetic and does not affect points, species selection, growth, or future eligibility.
  - Current evolution's active glow surrounds the swimming fish; earlier glows are kept in evolution history.
  - Glow effects are rendered separately from fish sprite artwork. Reduced-motion mode renders a static halo.
  - **Ties across 10th place**: A batch award creating a tie spanning tenth place awards the glow to all tied students, even if recipients exceed 10. Arbitrary tie-breaking is strictly prohibited.
  - **Undo glow recalculation**: Reversals recalculate glow eligibility from valid award history. If points drop below a milestone, glow entitlement is revoked/reassigned; re-earning after falling below receives a new qualification timestamp unless the original qualification award was not undone. Concurrent awards are validated transactionally.

## Group activities and randomizer
Create a named activity within a class; select participants, with active roster selected by default. MVP permits one active activity per class. Absence exclusions apply only to that activity and do not alter fish points.
- Manual grouping; randomize by group count or target group size.
- Group-count mode distributes sizes with maximum difference one unless locks make that impossible; explain infeasible settings.
- Target-size mode previews full groups and remainder. Teacher chooses a smaller final group or even distribution of remaining students.
- Every selected student appears exactly once; unselected students never appear.
- Rename groups; manually move members; lock specific student-to-group assignments; reshuffle unlocked students; save/reuse membership arrangements.
- Shuffle uses unbiased sampling among eligible assignments for the chosen capacities, such as Fisher–Yates over unassigned students before filling slots. Do not claim equal probability over all arrangements when constraints apply.
- Preview is local draft state; Confirm & Start creates the activity. It must not overwrite an existing activity.
- Reused arrangements are copied, not linked; flag unavailable members and newly added/unassigned students for review.
- Editing membership requires explicit save. No student may occupy two groups in one activity.

Example: 32 participants / five groups = 7, 7, 6, 6, 6. Target size five = six groups of five plus two students; offer a final group of two or balanced groups 6, 6, 5, 5, 5, 5.

## Group house builder
Each activity group starts with zero building points and an empty lot. Suggested stages: foundation 5; floor/frame 10; walls 20; roof 30; doors/windows 40; complete house 50; one decoration entitlement per additional 10 points. Every point advances the bar even before a stage changes. Configure lower thresholds for short activities. Suggested reasons: everyone contributes +3; clear explanation +3; cooperation +2; completion +2; improvement +2.
Group cards show name, members with fish icons, points, house stage, next threshold, and award controls. Completed houses unlock teacher-applied choices such as paint, plants, fences, paths. No drag-and-drop editor in MVP. Enforce earned decoration entitlements and preserve selections; if undo removes an entitlement, mark that selection inactive until re-earned.
Moving students does not transfer group points. Prior awards stay with the earning group. Membership changes are logged so earlier results remain explainable.

## End Activity & Ungroup
Confirm the concrete end action, save final member snapshots, houses, points, and award references, mark the activity completed, clear active grouping, and return to aquarium. Ending must be atomic/idempotent. Never delete individual progress. History includes final membership and changes, so moved members are traceable. New activities have fresh houses even when reusing an arrangement. Completed activity membership is read-only; award undo remains possible and updates archived totals with an audit record.

## Shared class challenges
Teacher defines title, target, period, eligible participants where relevant, reward, and tracking mode. Automatic challenges count matching award reasons or distinct contributing students; manual challenges use teacher-confirmed progress entries. Start tracking from activation, never retroactively. Freeze eligible participation pool at start, with explicit auditable edits for attendance adjustments.
Examples: Everyone Contributes (distinct contributors / eligible pool); Question Quest (question awards); Explain Your Thinking (explanation awards); Teamwork Week (cooperation awards); shared improvement (manual).
MVP supports one active challenge per class. Completion unlocks coral, plants, treasure chest, or background. Undo qualifying entries recalculates progress and entitlement; a reward becomes inactive if its qualification is removed, preserving its selection for re-earning. Class challenge progress never deducts or duplicates individual/group points.

## Award ledger and integrity
Record immutable award ID, owner ID, class ID, recipient type/ID, integer amount, stable reason ID and label snapshot, timestamp, request idempotency key, and activity/group references when relevant. Batch awards create separate student entries under one operation ID and are committed together for supported class size. Disable duplicate submission while pending; deduplicate on the backend. An undo creates a linked reversal, never deletes history; each award can be reversed only once. Derived totals exclude reversed awards. Atomic updates must cover points, stage, challenge effects, and reward entitlements, or use authoritative ledger-derived values with consistent transactional projections.
Show active class and recipient clearly. Include loading, empty, error, retry, and saved states. Never present a failed write as saved. Use server timestamps and Asia/Manila display defaults. Concurrent awards must not overwrite each other.

## Configuration policy
Store ordered, validated threshold arrays and stable reason IDs. Activity house rules and challenge rules are snapshotted at start. Fish threshold edits show a preview and explicitly recalculate current class stages without changing point history. Renaming reasons does not rewrite historical label snapshots. No silent resets between terms; create/archive classes deliberately.

## Data model (conceptual)
- Teacher: auth identity, display preferences.
- Class: ownerId, name, optional grade/subject, theme, fish thresholds, award reasons, archivedAt, activeActivityId, activeChallengeId.
- Enrollment: classId, ownerId, student name/display name, fish name/style, status; points derived from ledger or transactional projection.
- Activity: classId, ownerId, title, status, participant IDs, snapshotted rules, groups, member-change events, timestamps.
- Group: activityId, member IDs, final member snapshots, house selections and derived points/stage.
- GroupingTemplate: classId, saved membership layout, name; no points.
- Award/Reversal: audit ledger described above.
- Challenge/ProgressEntry: rules, eligibility snapshot, target, tracking mode, lifecycle, linked sources.
- RewardEntitlement: owner scope, source milestone/challenge, selection, active state.
Use owner-scoped Firestore paths or equivalent enforced ownership. IDs, not names, establish relationships. Never store authoritative randomizer previews as active groups.

## Security and privacy
Authenticate all private reads/writes and enforce ownership in backend rules/services, not only UI. Validate recipient, class, activity, reason, amount, and owner consistency. Client cannot directly forge totals/unlocks. No public classroom database access, student photos, addresses, birth dates, or required student accounts. Public demo data is separate. Keep secrets out of source control; publish setup placeholders, never credentials. Provide truthful privacy/support content; do not invent contacts or legal assurances. Student/class records remain private even if a landing page is publicly hosted.

## Visual and accessibility requirements
Cheerful but suitable for secondary learners: soft blue/green/warm neutrals, original/licensed fish and house assets, large touch targets, readable text and names. Responsive laptop/tablet layouts. Test with 40 students and support larger rosters through search, filtering, layout, or paging. Labels must remain usable without precise clicks on moving fish. Sound off; brief animations; reduced-motion/static mode; keyboard navigation, focus states, accessible labels and sufficient contrast. Rankings optional/off by default. No UI links or buttons that silently do nothing.

## Aquarium size controls
Provide three display size modes for the classroom aquarium:
1. **Standard**: Default workspace mode where the aquarium is positioned beside teacher controls (searchable roster, spotlight card, and award actions).
2. **Expanded**: Fills available page viewport width and height, collapsing sidebar panels to maximize tank visibility during classroom presentations while retaining compact floating tools.
3. **Full Screen**: Requests browser Fullscreen API on the aquarium container when supported, falling back to Expanded mode if blocked or unsupported. Native browser full screen is only requested upon explicit teacher click, never automatically on page load.
- **Exit and Escape**: Clearly visible exit button on floating overlay; pressing Escape exits browser fullscreen or Expanded mode and returns smoothly to Standard view.
- **Compact floating controls**: In Expanded and Full Screen modes, provide floating overlays for student search, award points CTA, student selection, label visibility (All / Selected / Off), and Pause Motion.
- **Physics and boundary adaptation**: Fish positions scale percentage-wise without teleporting, resetting, or jumping out of bounds during window or container resizes.
- **Artwork scale fidelity**: Fish visual scale strictly reflects earned points; expanding the aquarium never stretches or over-inflates fish sprites.
- **Layout preference persistence**: Remembers the teacher's preferred layout mode in local storage (`aquarium_size_mode`).
- **Device support**: Seamless on laptops, tablets, and classroom projectors, tested with 40+ fish.

## Delivery phases
1. Foundation: routes, responsive shell, landing, fictional demo, documented stack.
2. Private core: authentication, owner rules, dashboard, roster, per-class aquarium, saved fish awards and undo.
3. Teamwork: grouping preview/randomizer/locks/templates, activities, houses, membership edits, end/ungroup, history.
4. Shared goals and polish: challenges, decorations, full-screen modes, accessibility, security/concurrency checks, teacher guide and deployment documentation.
Do not substitute localStorage for production persistence or label mock authentication complete. Demonstration mode must be clearly marked.

## Later classroom ideas (not MVP)
Random student picker with no-repeat cycle; think-time and group timers; exit-ticket recognition; personal-best badges; class celebration screen; saved activity templates; weekly teacher participation summary; student accounts; drag-and-drop decoration; roster file import/export; reduce-repeat-teammate grouping; offline support. Random selection never automatically awards points. Any summary supports teacher judgment, not automatic student grading.

## Acceptance and delivery checklist
- Landing → sign-in → dashboard → correct class aquarium works.
- Two classes and two teachers remain isolated; duplicate names work.
- Each fish tracks its own points; milestone boundaries and undo are correct.
- Reload/sign-out/sign-in preserve saved data.
- Every selected participant appears once in valid groups; exclusions and locks respected; remainder choices correct; infeasible input explained.
- Preview does not mutate saved activities; concurrent starts cannot create two active activities.
- Group points build correct house; member moves do not transfer points.
- End/ungroup saves history and leaves fish intact; reused templates start fresh houses.
- Challenges count only configured qualifying sources within their period; reversal updates rewards.
- Duplicate requests, concurrent awards, unauthorized writes, and double undo are handled safely.
- Keyboard/reduced-motion/projector views and a 40-student class remain usable.
- Build, type checks, relevant unit/integration/security-rule checks pass.
Deliver source, asset/license notes, configuration example, security rules/backend code, tests, teacher guide, setup/deployment instructions, and known limitations. Deployment requires a configured target and explicit deployment instruction; creating these specification files does not authorize deployment.
