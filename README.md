# Grow & Build

Grow & Build is a teacher-led classroom recognition app concept for DepEd teachers. Phases A–D are now complete, covering the public experience, Firebase-backed private classroom core, group activities with house building, and shared class challenges with projector views and aquarium decorations.

The project is independent and is not affiliated with or endorsed by DepEd.

## Stack

- React, TypeScript, Vite, and React Router
- Firebase Authentication with email/password accounts
- Cloud Firestore with owner-scoped paths and security rules
- Firebase Local Emulator Suite for safe local development
- Vitest and Firebase Rules Unit Testing
- Original code-native SVG/CSS artwork

## Firebase status

No production Firebase credentials are included. The application supports either:

1. Local Auth and Firestore emulators using the included `grow-build-local` configuration.
2. A Firebase project configured by its owner.

Firebase web configuration identifies a project but does not replace Firestore Security Rules. Deploying rules or the application is not authorized by this repository.

## Local emulator setup

1. Install Node.js and Java 21 or newer. Confirm with `node --version` and `java -version`.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`. Keep these values for emulator mode:

```env
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_PROJECT_ID=grow-build-local
```

4. Start Auth and Firestore emulators:

```sh
npm run emulators
```

5. In another terminal, start the app:

```sh
npm run dev
```

The Emulator Suite UI is at `http://127.0.0.1:4000`. Data survives browser refresh and sign-out/sign-in while the emulators remain running, but emulator data is cleared when they stop unless import/export options are added. Password-reset emails in emulator mode appear in the Auth emulator UI/logs rather than being delivered.

## Real Firebase setup

1. Create or select a Firebase project and register a Web app.
2. Enable Authentication → Sign-in method → Email/Password.
3. Create a Firestore database in Native mode.
4. Copy `.env.example` to `.env.local`, set `VITE_USE_FIREBASE_EMULATORS=false`, and fill the six `VITE_FIREBASE_*` values from Firebase Console. These are public web-app configuration values, not service-account credentials.
5. Review and test `firestore.rules` and `firestore.indexes.json` against the intended project.
6. Only with explicit deployment authorization, deploy rules separately using Firebase CLI. This task did not deploy anything.

Never add service-account keys or private credentials to this repository.

## Commands

```sh
npm run dev          # application development server
npm run emulators    # local Auth and Firestore emulators
npm run lint         # static lint checks
npm run typecheck    # strict TypeScript checks
npm test             # domain tests
npm run test:rules   # emulator-backed security-rule tests (requires Java)
npm run build        # production bundle
```

## Phase B behavior

- `/register`, `/sign-in`, and `/forgot-password` use Firebase Authentication when configured.
- `/app` and `/app/classes/:classId` require an authenticated teacher.
- Each teacher’s classes live below `teachers/{uid}/classes/{classId}`.
- Students, awards, and reversals are nested within their class, preventing cross-class IDs from being accepted.
- Awards use Firestore transactions. Deterministic award document IDs deduplicate retried requests, and transactions recalculate from current point totals during concurrent writes.
- Undo creates a linked reversal and never deletes award history.
- Archived classes preserve data and remain read-only until restored.
- Names are labels only; unique enrollment IDs allow duplicate names.

## Phase C behavior

- Group activities are available from each active class card through **Group activities**.
- A class can have only one active activity. The class and activity records are committed together transactionally.
- Participant exclusions apply only to the activity and never change enrollment or fish points.
- Group-count mode differs in size by at most one. Target-size mode offers a smaller final group or even redistribution.
- Draft groups remain local until **Confirm & Start**.
- Locks preserve selected assignments during reshuffle; every selected participant is validated exactly once.
- Saved arrangements copy names and membership IDs only. New activities always create fresh zero-point houses.
- Group awards and corrections update only group documents and their own immutable ledger.
- Membership moves require confirmation and create audit events; group points stay with the original group.
- Ending an activity snapshots final membership, clears the active class grouping, and leaves every fish unchanged.
- Completed activities retain read-only memberships and permit traceable award corrections.

## Phase D behavior

- Shared class challenges allow time-bound class-wide goals with three tracking modes: matching award reasons, distinct student contributors, or manual teacher entries.
- Challenge eligibility is snapshotted at start; any attendance adjustments are explicitly logged.
- Only one active challenge can exist per class, enforced via transactional guard and security rules.
- Reversing qualifying awards automatically recalculates challenge progress and disables reward entitlements if thresholds drop below target.
- Reward selections are preserved: if a reward becomes inactive after an award undo, it reactivates automatically once re-earned.
- Unlocked aquarium rewards (coral, aquatic plants, treasure chest, special background) display in both the teacher workspace and classroom displays.
- Dedicated classroom projector views (`/app/classes/:classId/display/:mode`) for Aquarium, Group Village, and Challenges feature large-format typography, sound muted by default, name/point toggles, and Esc key exit.
- Workspace navigation tabs provide direct access to Aquarium, Students, Award History, Settings, Group Activities, Challenges, and Classroom Display.

All public-preview people, class names, totals, and activity data remain fictional. No student photos, addresses, birth dates, analytics, or student accounts are used.

See the project documentation for comprehensive operational, asset, and deployment details:
- [Teacher Guide & Classroom Operations](docs/teacher-guide.md)
- [Asset Catalog & Licensing Documentation](docs/asset-and-license-notes.md)
- [Deployment Guide & Known Limitations](docs/deployment-and-limitations.md)
- [Phase B checklist](docs/phase-b-checklist.md)
- [Phase C checklist](docs/phase-c-checklist.md)
- [Phase D checklist](docs/phase-d-checklist.md)

## Status

All planned phases (A through D) are fully implemented, strictly typechecked, linted, tested, and bundled for production.

No deployment was performed.

