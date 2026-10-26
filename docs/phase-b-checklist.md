# Phase B completion checklist

## Implemented

- [x] Firebase email/password registration and sign-in
- [x] Sign-out and password-reset request
- [x] Protected private application routes
- [x] Create, edit, archive, and restore classes
- [x] Owner-scoped Firestore paths and deny-by-default rules
- [x] Separate roster and aquarium per class
- [x] Individual add, paste-with-preview, edit, and search
- [x] Separate enrollment IDs allow duplicate student names
- [x] One persistent fish state per enrollment
- [x] Configurable recognition reasons and growth thresholds
- [x] Single and batch participation awards
- [x] Immutable award records and linked reversal records
- [x] Transactional point changes and deterministic request deduplication
- [x] Searchable static roster alongside animated fish
- [x] Loading, empty, error, saving, and archived/read-only states
- [x] Reduced-motion behavior inherited from Phase A
- [x] Domain tests for milestone boundaries, award, and reversal logic
- [x] Firestore rules tests authored for unauthenticated access, two-owner isolation, duplicate names, cross-class injection, and direct total tampering

## Verification status

- [x] ESLint passes
- [x] TypeScript passes
- [x] Domain tests pass
- [x] Production build passes
- [ ] Firestore rules suite executed locally — blocked on this machine because Java is not installed. Run `npm run test:rules` after installing Java 21+.
- [ ] Real Firebase project smoke test — requires client-provided Firebase project configuration and enabled Email/Password provider.

## Deliberately deferred

Group activities and houses were added in Phase C. Shared challenges and projector modes remain deferred to Phase D.
