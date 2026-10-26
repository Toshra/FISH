# Phase D completion checklist

## Implemented

- [x] Time-bound shared class challenges with configurable targets and modes
- [x] Three challenge tracking modes:
  - `reason-count`: automatically tracks matching award reasons
  - `distinct-contributors`: tracks count of unique contributing students from eligible pool
  - `manual`: auditable teacher-confirmed progress additions
- [x] Frozen eligibility pool snapshotted at challenge creation
- [x] Auditable eligibility changes with historical events logged
- [x] Transactional guard enforcing at most one active challenge per class
- [x] Automatic challenge progress updates through `awardStudents` and `reverseAward`
- [x] Correct reversal behavior: undoing awards or progress recalculates progress and revokes reward entitlement if threshold drops
- [x] Reward entitlement preservation: if reward qualification is revoked by undo, the teacher's selection remains preserved and reactivates once re-earned
- [x] Four unlockable aquarium rewards: Coral, Aquatic Plants, Treasure Chest, Special Background
- [x] Earned rewards visible in classroom workspace aquarium and classroom displays
- [x] Classroom display modes (`/app/classes/:classId/display/:mode`):
  - Aquarium display: animated swimming fish, earned decorations, configurable name and point visibility
  - Village display: active group houses, member rosters, building points
  - Challenge display: progress orb, percentage bar, unlocked reward badge
- [x] Teacher projector controls:
  - Sound muted by default
  - Full-screen display mode
  - Student names toggle
  - Point totals toggle (rankings remain off by default)
  - `Escape` key quick exit back to class workspace
- [x] Direct navigation tabs in Class Workspace connecting Aquarium, Students, Award History, Settings, Group Activities, Class Challenges, and Classroom Display
- [x] Active challenge banner displayed on the class aquarium header
- [x] Firestore security rules covering `challenges` and subcollections:
  - `challenges/{challengeId}`: owner-scoped, active class only, one active challenge guard, target validation
  - `progressEvents/{eventId}`: immutable manual progress log with reversal tracking
  - `progressReversals/{reversalId}`: exactly-once reversal validation
  - `eligibilityEvents/{eventId}`: student membership audit trail
  - `projectionEvents/{eventId}`: immutable audit trail for award/reversal-triggered projections
  - Strict reward selection rule: cannot select rewards unless `rewardActive == true`

## Verification status

- [x] ESLint passes (0 errors, 0 warnings)
- [x] Strict TypeScript (`tsc -b --pretty false`) passes
- [x] 39 domain tests pass (including comprehensive challenge projection, distinct contributors, and boundary tests)
- [x] Production build (`npm run build`) passes cleanly
- [x] Firestore security rules tests updated with challenge isolation and atomic start tests

## Deliverables

- Complete application source code
- Full domain logic and unit tests
- Owner-scoped Firestore security rules
- Developer setup documentation and checklists
