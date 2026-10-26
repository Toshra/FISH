# Grow & Build — Deployment Guide & System Limitations

This document provides setup, configuration, security, and deployment procedures for Grow & Build, along with an explicit accounting of system boundaries and known limitations.

---

## 1. System Requirements & Environment

- **Node.js**: v20 LTS or v22 LTS
- **Package Manager**: npm (v10+)
- **TypeScript**: v5.9+
- **Vite**: v8.3+
- **Optional for Rules Unit Testing**: Java Development Kit (JDK 21+) for Firebase Local Emulator Suite.

---

## 2. Local Development & Firebase Emulators

The repository includes a ready-to-run configuration for Firebase Local Emulators (`grow-build-local`).

### Step 1: Environment Configuration
Copy `.env.example` to `.env.local`:
```sh
cp .env.example .env.local
```
Ensure `.env.local` contains:
```env
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_PROJECT_ID=grow-build-local
```

### Step 2: Running Development Servers
In terminal 1, start the Firebase emulators:
```sh
npm run emulators
```
The Emulator Suite UI will be accessible at `http://127.0.0.1:4000`.

In terminal 2, start the Vite development server:
```sh
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3. Production Firebase Project Setup

To connect to a live Firebase project:

1. **Create Project**: In the [Firebase Console](https://console.firebase.google.com/), create a new Firebase project.
2. **Enable Authentication**:
   - Navigate to **Authentication** > **Sign-in method**.
   - Enable **Email/Password**.
3. **Create Cloud Firestore**:
   - Navigate to **Firestore Database** > **Create database**.
   - Select **Production mode** and choose your preferred primary region (e.g., `asia-southeast1`).
4. **Register Web App**:
   - In Project Settings, register a Web App.
   - Note the provided web configuration parameters.
5. **Configure `.env.local`**:
   ```env
   VITE_USE_FIREBASE_EMULATORS=false
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
   *(Note: These are public web configuration values, not service account secrets. Never store private server credentials in the client repository).*

---

## 4. Security Rules & Index Deployment

Firestore security rules are strictly enforced server-side in `firestore.rules`.

### Key Security Invariants Enforced:
- **Owner Scoping**: All operations are nested under `/teachers/{teacherId}/...` and require `request.auth.uid == teacherId`.
- **Atomic Operations**: Single and batch awards must be committed atomically with matching immutable ledger records. Direct client tampering with `points` is denied.
- **Activity Guard**: At most one active group activity per class is permitted.
- **Challenge Guard**: At most one active class challenge per class is permitted.
- **Reward Entitlement Integrity**: Rewards cannot be marked active unless earned and validated by rule logic.

### Deploying Rules (Requires Explicit Authorization):
```sh
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 5. Production Application Build & Hosting

To build the static application bundle:
```sh
npm run build
```
The optimized bundle is written to `dist/`.

To deploy to Firebase Hosting:
```sh
firebase deploy --only hosting
```

---

## 6. Known Limitations & Explicit Non-MVP Boundaries

As defined by `master.md` and `agent.md`, the following architectural boundaries are intentional:

1. **Teacher-Led Display Model (No Student Accounts)**:
   - Students do not log into the application or operate devices in class.
   - Displays are managed by the teacher at the front of the classroom via projector or presentation screen.
2. **No Attendance Penalties or Negative Points**:
   - Absence exclusions apply only to the specific group activity session; excluded students never lose points, size, or evolution status.
   - Points are additive only; deductions exist exclusively through auditable undo/reversal operations.
3. **No Automatic Academic Grading**:
   - Participation points reflect engagement and effort. The system intentionally excludes formulas converting points to academic marks or DepEd quarterly grading rubrics.
4. **Single Active Activity & Single Active Challenge**:
   - Each class supports at most one active cooperative group activity and at most one active class challenge at a time to prevent cognitive overload during classroom lessons.
5. **Native Fullscreen Browser Security Constraint**:
   - The browser Fullscreen API strictly requires a direct user gesture (button click). It cannot be triggered programmatically on initial page navigation. If fullscreen is blocked or unsupported, the app seamlessly defaults to Expanded Viewport mode.
6. **Local Emulator Testing Host Dependency**:
   - The security rules test suite (`tests/firestore.rules.test.ts`) interacts directly with `@firebase/rules-unit-testing` and requires Java 21+ installed on the host machine to spin up the local Firestore emulator process.
7. **No Live Deployment Executed**:
   - The repository is pre-configured and tested for deployment, but live cloud deployment is deferred until explicit client confirmation and provision of target credentials.
