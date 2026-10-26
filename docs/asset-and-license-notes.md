# Grow & Build — Asset Catalog & Licensing Documentation

This document inventories all visual assets, illustrations, animations, and licensing notes used within Grow & Build.

---

## 1. Visual Design Philosophy

Grow & Build is designed for Philippine secondary school classrooms. Visuals are vibrant and engaging while avoiding juvenile or overly cartoonish elements:
- Soft ocean blues, aquatic teals, and warm sand tones.
- High-contrast typography optimized for classroom projectors.
- Transparent background fish sprites allowing seamless layering over procedural water backgrounds.
- High-performance CSS transforms and canvas-friendly rendering respecting reduced-motion accessibility settings.

---

## 2. Fish Art Assets Catalog (41 Unique Designs)

All fish assets are located in `public/assets/fish/` as transparent PNG files. Each species has distinct visual characteristics:

### A. Shared Starter (0 Points)
- `starter.png`: Common Starter Goldfish (1 design)

### B. Natural Milestone Collection (10 Points — 10 Designs)
- `N01.png`: Guppy (*Poecilia reticulata*) — vivid fan tail and iridescent body
- `N02.png`: Neon Tetra (*Paracheirodon innesi*) — electric blue and ruby red stripes
- `N03.png`: Zebra Danio (*Danio rerio*) — horizontal zebra stripes and sleek profile
- `N04.png`: Harlequin Rasbora (*Trigonostigma heteromorpha*) — distinctive triangular black patch
- `N05.png`: Cherry Barb (*Puntius titteya*) — deep crimson coloration
- `N06.png`: Southern Platy (*Xiphophorus maculatus*) — compact orange-gold body
- `N07.png`: Green Swordtail (*Xiphophorus hellerii*) — elongated lower caudal fin
- `N08.png`: Honey Gourami (*Trichogaster chuna*) — warm amber tones and delicate feelers
- `N09.png`: Bronze Corydoras (*Corydoras aeneus*) — armored plated catfish with whisker barbels
- `N10.png`: Kuhli Loach (*Pangio kuhlii*) — slender serpentine body with alternating dark bands

### C. Rare Milestone Collection (25 Points — 10 Designs)
- `R01.png`: Sapphire Discus (*Symphysodon aequifasciatus*) — large disc-shaped sapphire body
- `R02.png`: Marble Angelfish (*Pterophyllum scalare*) — tall triangular fins with marbled patterns
- `R03.png`: Crown Betta (*Betta splendens*) — dramatic spiked crowntail fins
- `R04.png`: Butterfly Koi (*Cyprinus carpio*) — long flowing fins with calico patterns
- `R05.png`: Boesemani Rainbowfish (*Melanotaenia boesemani*) — half deep blue, half golden yellow
- `R06.png`: German Blue Ram (*Mikrogeophagus ramirezi*) — brilliant iridescent blue and gold dwarf cichlid
- `R07.png`: Celestial Pearl Danio (*Danio margaritatus*) — galaxy-like white spots with fiery orange fins
- `R08.png`: Threadfin Rainbowfish (*Iriatherina werneri*) — delicate filament-like dorsal fins
- `R09.png`: Pearl Gourami (*Trichopodus leerii*) — shimmering pearl spots and orange breast
- `R10.png`: Electric Blue Acara (*Andinoacara pulcher*) — radiant electric neon-blue scales

### D. Magical Milestone Collection (50 Points — 10 Designs)
- `MG01.png`: Moonbeam — translucent pearlescent fish emitting a soft lunar sheen
- `MG02.png`: Crystalfin — geometric crystalline fins refracting prismatic light
- `MG03.png`: Emberfin — flame-tipped fins with glowing amber embers
- `MG04.png`: Frostveil — icy crystalline spines trailing chilled vapour
- `MG05.png`: Blossomtail — petal-shaped caudal fin blooming like a lotus
- `MG06.png`: Aurora — undulating waves of emerald and violet northern lights
- `MG07.png`: Stormspark — crackling electric arcs running along dorsal spines
- `MG08.png`: Sunburst — radiant solar corona flare around fins
- `MG09.png`: Mossglow — bioluminescent deep-forest moss patterns
- `MG10.png`: Starlight — midnight blue silhouette speckled with twinkling constellations

### E. Mythical Milestone Collection (100 Points — 10 Designs)
- `MY01.png`: Dragonfin — majestic eastern dragon whiskered leviathan
- `MY02.png`: Phoenix Fish — reborn in aquatic solar fire with sweeping golden plumage
- `MY03.png`: Celestial Leviathan — cosmic serpent coiled with spiral galaxies
- `MY04.png`: Pearl Guardian — armored behemoth cradling a radiant pearl
- `MY05.png`: Abyssal Monarch — crowned deep-sea sovereign with bioluminescent runes
- `MY06.png`: Cloud Serpent — soaring sky-swimming dragon draped in mist
- `MY07.png`: Solar Sovereign — golden armored deity radiant with solar rays
- `MY08.png`: Lunar Oracle — mysterious silver serpent trailing moon phases
- `MY09.png`: Tidal Titan — ancient primal beast crowned with coral horns
- `MY10.png`: Dreamweaver — ethereal shimmering entity weaving ribbons of twilight

### Backward Compatibility Sample Aliases
- `natural_sample.png`, `rare_sample.png`, `magical_sample.png`, `mythical_sample.png` are maintained as legacy aliases pointing to primary collection designs for smooth migration.

---

## 3. Code-Native SVG Visuals

To maximize performance, crisp scalability on high-resolution displays, and minimal bundle overhead, architectural and background visuals are rendered using code-native SVGs:

1. **House Construction Stages** (`HouseVisual.tsx`):
   - Stage 0: Empty lot with grassy plots and markers.
   - Stage 1: Concrete foundation and perimeter trenches.
   - Stage 2: Timber frame, upright posts, and floorboards.
   - Stage 3: Insulated walls, siding, and window openings.
   - Stage 4: Angled gable roof, eaves, and weatherproofing.
   - Stage 5: Front door, double-hung glass windows, and trim.
   - Stage 6: Complete family house with chimney, warm lighting, and porch.

2. **House Architectural Upgrades & Decorations**:
   - Custom Exterior Paint (Aqua, Coral, Forest Green, Sunshine Yellow, Slate).
   - Landscaping: Garden bushes, blooming flowerbeds, and palm shrubs.
   - Perimeter: Picket fencing and modern stone borders.
   - Pathways: Cobblestone walkways and stepping stones.

3. **Shared Aquarium Decorations**:
   - Living Coral Reef formation.
   - Deep-sea kelp forest and waving aquatic flora.
   - Sunken treasure chest with gold coin particle accents.
   - Procedural ocean gradient backdrops with underwater lighting caustics.

---

## 4. Milestone Glow Visuals & Accessibility

Milestone glows are rendered independently of fish sprites via CSS filters and pseudo-elements:
- **Natural**: `drop-shadow(0 0 10px rgba(45, 212, 191, 0.85))` (Soft Aqua)
- **Rare**: `drop-shadow(0 0 14px rgba(59, 130, 246, 0.90))` (Sapphire Blue)
- **Magical**: `drop-shadow(0 0 16px rgba(168, 85, 247, 0.95))` with violet sparkles
- **Mythical**: `drop-shadow(0 0 20px rgba(234, 179, 8, 0.95))` with golden halo ring

**Reduced-Motion Mode**:
When `prefers-reduced-motion: reduce` is detected or toggled by the teacher:
- Dynamic pulsing and swimming oscillations stop.
- Glows render as clean, static, non-strobing outlines.
- Background caustics and bubble particle generators are disabled.

---

## 5. Licensing & Attribution Notice

- All digital fish illustrations and code-native SVG artwork in this project were created specifically for Grow & Build.
- They are provided under the same open-source MIT license governing this repository.
- No third-party copyrighted stock photography, trademarked assets, or proprietary character likenesses are used.
- **DepEd Non-Affiliation**: This software and its visual assets are independent educational materials and are not affiliated with, sponsored by, or endorsed by the Department of Education of the Philippines.
