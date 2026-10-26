# Phase C completion checklist

## Implemented

- [x] Named activity creation within a selected class
- [x] Active-roster participant selection and per-activity absence exclusion
- [x] Transactional one-active-activity guard
- [x] Manual grouping review and movement
- [x] Random grouping by group count or target size
- [x] Smaller-final-group and balanced-remainder choices
- [x] Injected random source and Fisher–Yates shuffle
- [x] Locked assignments and unlocked reshuffle
- [x] Editable group names and exact-once participant validation
- [x] Local-only preview before Confirm & Start
- [x] Saved grouping templates containing memberships only
- [x] Roster-change warnings when templates are reused
- [x] Fresh zero-point houses for every new activity
- [x] Snapshotted house milestones and group-award reasons
- [x] Separate transactional group building awards
- [x] Immutable group award and reversal records
- [x] Construction-stage and next-milestone progress
- [x] Earned paint, plant, fence, and path selections
- [x] Decoration selections become inactive after entitlement-removing undo and reappear when re-earned
- [x] Confirmed membership moves with immutable audit events
- [x] Group points remain with the group after member moves
- [x] Transactional, idempotent End Activity & Ungroup
- [x] Final memberships preserved in completed history
- [x] Completed group award corrections recalculate archived house totals
- [x] Individual enrollment points are never written by Phase C services
- [x] Owner/class-scoped Firestore rules for activities, groups, templates, awards, reversals, and membership events
- [x] Group updates are field-scoped so award transactions cannot alter membership and membership updates cannot alter points
- [x] Decoration writes are limited to earned entitlements and supported choices
- [x] Membership events must match the post-transaction source and destination groups

## Verification status

- [x] ESLint passes
- [x] Strict TypeScript passes
- [x] 32 domain tests pass
- [x] Grouping tests cover even/uneven counts, exclusions through participant sets, locks, infeasible capacities, duplicate placement, single/empty inputs, target-size remainder strategies, and template roster changes
- [x] House tests cover exact milestones, zero points, and decoration entitlements
- [x] Manual-board creation is deterministic and does not randomize participants
- [x] Production build passes
- [ ] Emulator-backed security/integration suite execution — authored and extended, but blocked because Java is unavailable on this machine
- [ ] Real Firebase smoke test — requires owner-provided Firebase configuration

## Deliberately deferred

Class challenges, shared aquarium rewards, and dedicated projector displays belong to Phase D.
