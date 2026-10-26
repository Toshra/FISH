# Grow & Build — Agent Implementation Instructions

## Role and source of truth
You are the implementation agent working in Antigravity. Read `master.md` completely before planning or coding. It defines product scope, behavior, data rules, and acceptance criteria. This file defines how to implement it. Follow newer explicit client instructions; record material specification updates in `master.md`. Preserve the requested lowercase filenames. Do not assume this file is automatically discovered: the launch prompt should explicitly instruct the agent to read both files.

## First actions
1. Inspect the repository, existing instructions, package manifests, and environment examples before changing files. Preserve existing work.
2. Summarize current implementation and list a short phased plan mapped to master.md.
3. If no implementation exists, use the proposed React/TypeScript + Firebase stack as a documented working default. State that Firebase was proposed, not previously confirmed. Inspect current official documentation before depending on version-sensitive APIs.
4. Implement useful local work without waiting for optional preferences. Missing Firebase credentials do not block UI/domain logic/emulator work; clearly report that production integration remains incomplete. Never invent credentials.

## Non-negotiable behavior
- Each class owns its aquarium; each enrollment owns a fish.
- Every student starts with the exact same tiny goldfish (0 points, `/assets/fish/starter.png`).
- Each participation point increases visual size smoothly up to the configured cap (0.55 to 1.45).
- Random milestone evolution: Natural (10 pts, 10 designs `N01`..`N10`), Rare (25 pts, 10 designs `R01`..`R10`), Magical (50 pts, 10 designs `MG01`..`MG10`), Mythical (100 pts, 10 designs `MY01`..`MY10`). All 41 designs are active with dedicated transparent artwork assets.
- Independent selection per student: Batch awards must make separate selections for each qualifying student. Never assign one random result to the entire class.
- Persistence: Saved fish ID is permanently recorded per student and milestone in Firestore and localStore (`evolutionHistory`). Reloading, grouping, or re-rendering never rerolls it.
- Non-destructive repair: Never silently reroll existing saved evolutions. Provide an Evolution Integrity Audit and Repair Preview displaying current vs proposed independent selections before committing.
- Deterministic fallback: For records lacking saved history, fallback to a deterministic student-specific hash (`hash(studentId:milestone)`) rather than class-wide sample constants, ensuring different students never render identical fallbacks.
- Undo restores fish form and size to matched points while retaining unlocked outcomes in evolution history. Re-crossing restores the exact same fish.
- First 10 students per class to reach each milestone earn that milestone's cosmetic glow (Natural aqua, Rare sapphire, Magical violet sparkles, Mythical golden halo). Batch ties across 10th place give glow to everyone tied. Glow eligibility is strictly decoupled from species randomization.
- Undo recalculates glow qualification from valid award events.
- Never pool students into one fish or merge class balances.
- Individual, group, and challenge progress remain separate.
- Group/ungroup operations preserve fish points and growth.
- No progress penalties for absence; no negative punishment awards.
- No student login requirement in MVP.
- Teacher data isolation is enforced server-side.
- Randomization preview never silently changes an active activity.
- Historical awards, membership changes, and corrections remain traceable.

## Implementation structure
Keep presentation separate from domain functions and persistence. Suggested modules: auth, classes/roster, aquarium/fish, awards/ledger, grouping, activities/houses, challenges/rewards, projector, history, settings. Centralize threshold calculation, random evolution outcomes, per-class glow eligibility, award reversal, participant validation, group capacity allocation, and randomization. Use stable IDs and typed domain models. Avoid putting business rules in animation components.
Use authoritative award ledger events to determine milestone qualification timestamps for glow allocation. Ensure batch awards with ties at the 10th spot include all tied recipients. Reversals must update active glow entitlements.
Create an injectable random source for deterministic randomizer tests; use an unbiased shuffle in production. Validate locks, capacity, exclusions, uniqueness, remainder strategy, and complete membership before confirmation. Never hide infeasible constraints with a silently invalid grouping.

## Persistence and security
Use Firebase emulators for local integration when Firebase is selected. Commit rules and required indexes. Enforce owner/class consistency and restrict aggregate writes to trusted operations. Prefer an authenticated transactional backend for award, reverse, start activity, edit membership, and end activity commands. All trusted endpoints verify auth and ownership; Admin SDK bypasses rules and therefore needs explicit authorization checks.
Use immutable ledger events, request idempotency keys, atomic changes, server timestamps, and exactly-once reversal semantics. Do not calculate authoritative balances from stale UI state. Do not expose service account keys. Use environment examples with placeholders and ignore private local secrets.
For local demos, use a clearly labeled fictional dataset isolated from actual teacher data. Do not make localStorage the production database or claim persistence/auth is complete when mocked.

## UX execution
Build functional workflows, not disconnected screens. Include landing, sign-in/recovery, class cards, aquarium/roster, award controls, grouping modal, group village, end/ungroup, activity history, challenges, settings, full-screen modes. Clearly display active class and selected recipient. Provide loading/empty/error/saving states and prevent repeated submission.
Implement aquarium size controls: Standard (side-by-side with sidebar roster), Expanded (viewport width/height with collapsed sidebars), and Full Screen (browser Fullscreen API with fallback). Provide a visible exit button and Escape key support. In Expanded and Full Screen modes, keep compact floating controls for student search, points award, label density, and motion pause. Persist the teacher's layout preference in localStorage while only requesting native browser fullscreen on user click. Ensure swimming boundaries scale percentage-wise so fish never teleport, reset, or stretch.
Use keyboard-accessible static roster controls alongside animated fish. Respect reduced motion and projector readability. Use soft aquatic visuals appropriate for secondary students. Implement actual growth/house stage artwork with local/licensed assets or code-native SVG; document asset sources. Do not add public rankings by default. Do not invent support contacts, certification, or DepEd endorsement.

## Build sequence and completion gates
### A. Foundation
Landing, navigation, responsive shell, fictional preview, stack/environment setup. Gate: routes and production build work.
### B. Individual classroom core
Auth, owner access, class/roster CRUD and archival, unique enrollments, aquarium, award ledger, fish thresholds and undo. Gate: two-class/two-teacher isolation and persisted points verified.
### C. Group activities
Participant selection, manual/random grouping, both modes, remainders, locks, reshuffle, review/confirm, templates, house awards/decorations, member moves, end/ungroup, history. Gate: randomizer invariants and lifecycle preservation verified.
### D. Shared goals and delivery
Class challenges, corrected reward entitlements, projector/accessibility/performance polish, guide and deployment docs. Gate: master.md acceptance checklist reviewed and material limitations stated.
Complete phases in order; do not treat optional classroom ideas as a substitute for unfinished core behavior. Do not introduce student accounts, attendance analytics, grading formulas, monetization, or school administration unless requested.

## Verification requirements
Write meaningful domain/integration tests for:
- Exact growth and construction boundaries, zero points, decoration entitlements, reversal.
- Group-count and target-size modes, uneven divisions, empty/single participant input, invalid values, duplicate participants, locks, infeasible capacity, exclusion, and template roster changes.
- Preservation of fish points through member movement and ungrouping.
- Idempotent awards/end commands, concurrent awards/starts, double undo, transaction failure.
- Automatic challenge source filters, distinct contributors, period boundaries, manual changes, and undo.
- Unauthenticated and other-owner reads/writes, cross-class recipient injection, direct total tampering.
Run repository checks/build/type checks and emulator-backed security tests where available. Exercise landing → sign-in → class → award → group → house → end → history, then reload. Test at least 40 students with keyboard and reduced motion. Report skipped checks honestly; do not invent successful results. Avoid cosmetic snapshot tests that merely mirror implementation.

## Working and reporting
Make small coherent changes. Explain meaningful assumptions and material scope changes. Update documentation when decisions change. Keep a completion checklist linked to master.md requirements. Ask only when an unresolved choice blocks correct behavior or changes scope materially; continue independent work meanwhile. Never discard user changes or run destructive resets. Do not purchase services, publish student data, or deploy to a live target without the client's explicit instruction. Provide a concise handoff covering implemented behavior, validation, setup steps, and unresolved limitations. Do not call a mock or partial build production-ready.

## Suggested first Antigravity prompt
Read master.md and agent.md completely. Inspect the current project, summarize the requirements and any gaps, and implement Phase A followed by the remaining phases in order. Preserve the individual fish, per-class aquarium, random grouping, house-building, and ungrouping rules. Use fictional data for previews. Validate each phase and update the completion checklist. If Firebase access is unavailable, use emulators and clearly identify the remaining setup rather than fabricating a connection. Do not deploy yet.
