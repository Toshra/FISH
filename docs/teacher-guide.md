# Grow & Build — Teacher Guide & Classroom Operations Manual

Grow & Build is a positive recognition web application designed for teacher-led classroom instruction. It celebrates individual participation, effort, teamwork, and shared goals through virtual fish growth, collaborative house construction, and class-wide challenges.

---

## 1. Core Principles

- **One Aquarium per Class**: Each class section maintains its own private aquarium. Student data and progress are strictly isolated between classes and teachers.
- **Individual Fish Ownership**: Every enrolled student has their own personal fish that reflects their participation points. Progress is never pooled into a single collective fish.
- **Three Separate Balances**:
  1. *Individual Participation Points* grow the student's fish and unlock milestone evolutions.
  2. *Group Building Points* construct temporary houses during cooperative activities.
  3. *Class Challenge Progress* unlocks shared classroom aquarium decorations.
- **No Negative Punishments or Attendance Penalties**: Fish never become sick, shrink, or lose progress due to absence or inactivity.
- **Zero Student Device Requirement**: The app is designed for projector display at the front of the classroom, operated exclusively by the teacher.

---

## 2. Getting Started

### Teacher Registration & Sign In
1. Navigate to `/sign-in` or `/register`.
2. Register using your email address and a secure password.
3. Access your private **Teacher Dashboard** (`/app`).

### Creating & Managing Classes
- Click **Create New Class** on the dashboard.
- Provide a class name (e.g., *Grade 9 - Ruby*), optional subject, and grade level.
- Archived classes are read-only and preserved safely; they can be restored at any time.

### Roster Management
- In the **Students** tab of your class workspace, add students manually or use **Paste Roster** to import names (one per line).
- Duplicate names are fully supported through unique underlying enrollment IDs.
- Optional display names and custom fish names can be set for each student.

---

## 3. Individual Fish & Evolution System

### The Starter Fish
Every student begins with the exact same tiny goldfish (**Starter**, 0 points).

### Continuous Visual Growth
- Fish grow continuously and smoothly from **scale 0.55** (0 points) up to a visual cap of **scale 1.45** (100 points), increasing by approximately `+0.009` scale units per participation point.
- Visual size is smoothly preserved across evolutions while respecting unique species proportions.

### Milestone Evolutions (41 Unique Designs)
When a student reaches milestone thresholds, their fish independently evolves into a random design from that tier's collection:

| Milestone | Threshold | Collection | Designs Available |
| :--- | :--- | :--- | :--- |
| **Starter** | 0 pts | Starter Goldfish | 1 design (`starter`) |
| **Natural** | 10 pts | Freshwater & River Species | 10 designs (`N01`–`N10`: Guppy, Neon Tetra, Zebra Danio, Harlequin Rasbora, Cherry Barb, Platy, Swordtail, Gourami, Corydoras, Loach) |
| **Rare** | 25 pts | Exotic Tropical & Reef Species | 10 designs (`R01`–`R10`: Discus, Angelfish, Betta, Koi, Boesemani, Blue Ram, Pearl Danio, Threadfin, Pearl Gourami, Blue Acara) |
| **Magical** | 50 pts | Bioluminescent & Elemental | 10 designs (`MG01`–`MG10`: Moonbeam, Crystalfin, Emberfin, Frostveil, Blossomtail, Aurora, Stormspark, Sunburst, Mossglow, Starlight) |
| **Mythical** | 100 pts | Legendary Aquatic Creatures | 10 designs (`MY01`–`MY10`: Dragonfin, Phoenix Fish, Celestial Leviathan, Pearl Guardian, Abyssal Monarch, Cloud Serpent, Solar Sovereign, Lunar Oracle, Tidal Titan, Dreamweaver) |

### Independent Random Outcomes & Persistence
- Every qualifying student receives an **independent random selection**. A single random roll is *never* applied to the whole class.
- Once unlocked, a student's chosen fish design is permanently recorded in Firestore (`student.evolutionHistory`).
- Reloading the page, grouping, moving groups, or re-rendering will never reroll an earned fish.

### First-10 Cosmetic Milestone Glows
- The first **10 students in each class** to cross each milestone earn a special cosmetic aura:
  - *Natural (10 pts)*: Soft Aqua Glow
  - *Rare (25 pts)*: Sapphire Blue Glow
  - *Magical (50 pts)*: Violet Sparkles Glow
  - *Mythical (100 pts)*: Golden Halo Glow
- **Batch Ties**: If a batch award results in a tie across the 10th spot, all tied students receive the glow. Arbitrary tie-breaking is strictly prohibited.
- Glow entitlement is purely cosmetic and decoupled from species randomization.

### Award Undo & Re-Earning
- Reversing an award restores the student's points, form, and scale matching the corrected balance.
- Unlocked outcomes remain preserved in evolution history. Re-crossing the threshold restores the exact same fish.
- Undo recalculates glow entitlement from authoritative award ledger events.

### Evolution Integrity Audit & Repair Preview
- Located in the **Settings** tab and flagged with a warning banner if legacy sample defaults or unassigned histories are detected.
- Displays a side-by-side comparison of current vs. proposed independent selections with image previews.
- Repairs are only committed upon explicit teacher confirmation.

---

## 4. Aquarium Display Modes & Size Controls

The classroom aquarium offers three view modes to suit different presentation setups:

1. **Standard Mode**: Aquarium sits alongside the student roster, spotlight card, and quick-award controls.
2. **Expanded Mode**: Aquarium fills the viewport width and height, collapsing sidebars to maximize tank visibility while providing compact floating controls.
3. **Full Screen Mode**: Requests native browser fullscreen (`F11`/Fullscreen API) on the tank container. Falls back gracefully to Expanded mode if fullscreen is blocked.

### Controls in Expanded & Full Screen Modes
- **Exit Button & `Escape` Key**: Smoothly returns to Standard view at any time.
- **Search & Quick Award**: Search students and award points directly from a compact floating overlay without leaving the presentation.
- **Label Density Selector**: Toggle labels between *All*, *Selected Only*, or *Off*.
- **Motion Pause**: Pause swimming animation for focused classroom discussions or projector legibility.
- **Layout Memory**: Remembers the teacher's preferred view mode across sessions in `localStorage`.

---

## 5. Group Activities & House Builder

### Starting an Activity
1. Click **Group Activities** from the class workspace.
2. Choose participants (absent students can be excluded for this activity without affecting their fish points).
3. Select grouping mode:
   - **Group Count Mode**: Divides students into a fixed number of groups with maximum size difference of 1.
   - **Target Group Size Mode**: Divides into groups of target size; handles remainders by either creating a smaller final group or distributing remainders evenly.
4. **Locks & Reshuffling**: Pin specific students to groups, then reshuffle remaining unpinned students using an unbiased Fisher–Yates shuffle.
5. Review the local preview and click **Confirm & Start**. (Only one active activity per class is permitted).

### Cooperative House Construction
Each group starts with an empty lot (0 building points). Awards advance the house through 6 distinct stages:
- **0 pts**: Empty Lot
- **5 pts**: Foundation Laid
- **10 pts**: Floor & Frame Raised
- **20 pts**: Walls Erected
- **30 pts**: Roof Completed
- **40 pts**: Doors & Windows Installed
- **50 pts**: Complete House
- **+10 pts thereafter**: Earned House Decoration Entitlements (Custom Paint, Plants, Fences, Stone Paths).

### Moving Members & Ending Activities
- Moving a member requires confirmation; group points stay with the earning group.
- **End Activity & Ungroup**: Atomically completes the activity, records final rosters in activity history, clears the active grouping, and returns to the aquarium.
- Individual fish points and growth are completely unaffected by grouping or ungrouping.

---

## 6. Shared Class Challenges

Class challenges rally the entire class toward a common goal to earn classroom aquarium decorations:

### Challenge Tracking Modes
1. **Reason Count**: Automatically tracks awards matching a specific reason (e.g., *Question Quest*, *Explain Your Thinking*).
2. **Distinct Contributors**: Tracks the number of unique participating students from the frozen eligibility pool (e.g., *Everyone Contributes*).
3. **Manual Progress**: Teacher enters verified class progress increments.

### Unlockable Aquarium Decorations
Completing a challenge unlocks one of four permanent aquarium decorations chosen by the teacher:
- **Coral Reef Formation**
- **Aquatic Plants & Sea Kelp**
- **Sunken Treasure Chest**
- **Special Oceanic Backdrop**

Reversing an award updates challenge progress. If points drop below the target, the decoration becomes inactive but preserves the teacher's selection for immediate reactivation once re-earned.

---

## 7. Classroom Projector Views

Direct projection routes are available from the **Classroom Display** tab:
- **Aquarium Display** (`/app/classes/:classId/display/aquarium`): Large-format swimming fish with active milestone glows and unlocked decorations.
- **Village Display** (`/app/classes/:classId/display/village`): Active group houses and member cards.
- **Challenge Display** (`/app/classes/:classId/display/challenge`): Progress orb, percentage bar, and active challenge target.

**Projector Features**:
- Sound is muted by default.
- High-contrast typography optimized for classroom projectors.
- Toggle student names and point totals on or off.
- Press `Escape` or click the exit button to return to the teacher workspace.
