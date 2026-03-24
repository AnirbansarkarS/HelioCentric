# HelioCentric

An endless-runner style space trek built with Three.js. Pilot a neon UFO from the Kuiper Belt all the way to the Sun, threading through procedurally generated asteroid fields, collecting exotic space loot, and surviving each planet's unique hazards.

## Gameplay Overview
- Progress through ten handcrafted solar zones (Pluto ➜ Sun) that blend seamlessly via color-graded fog, distant planets, and ambient particles.
- Dodge lane-based obstacle patterns that escalate in difficulty, including rotating Uranus rings, Saturn cross-rings, Venus acid clouds, and Jupiter gravity storms.
- Hoard collectibles (Star Fragments up to ultra-rare Planet Relics) to boost score and wallet, and chase powerups like `darkMatter`, `shield`, `warp`, `gravity`, and `magnet` for clutch assists.
- Checkpoints auto-unlock per planet and can be resumed from the main menu thanks to the local `SaveSystem` (high score + wallet recorded in `localStorage`).
- Fully playable with keyboard or swipe gestures; HUD includes pause, lives, zone info, and dynamic notifications.

## Core Features
- **Dynamic Environment** – Massive starfields, nebulae, distant planet renders, asteroid belts, and zone-specific atmospheric effects (Venus haze, Mercury heat shimmer, solar flares).
- **Procedural Obstacles** – Advanced spawn algorithm balances safe lanes, pattern variety, collectibles, hazards, and adaptive difficulty across 1,700+ lines of obstacle logic.
- **Particle FX** – Engine trails, speed lines, damage bursts, coin pops, warp portals, and zone transition blooms handled via pooled particle systems.
- **Responsive UI** – In-game overlays for menu, HUD, pause, game over, and victory; mobile-targeted controls, checkpoint list, and high-score surfacing.
- **Stateful Progression** – `GameState` tracks lives, speed, timers, powerups, and interpolates between zones while `SaveSystem` persists checkpoints/high scores.

## Controls
- **Desktop**: `A / ←` move left, `D / →` move right, `Space / W / ↑` jump, `P` pause.
- **Mobile / Touch**: swipe left or right to change lanes, swipe up to jump.

## Tech Stack
- Three.js (WebGL rendering)
- Vanilla HTML/CSS/JavaScript (no framework build step)
- LocalStorage for persistence

## Project Structure
```
HelioCentric/
├─ index.html          # Main game entry point
├─ landing.html        # Optional marketing/landing page
├─ README.md
└─ js/
	├─ config.js        # Global CONFIG + ZONES definitions
	├─ environment.js   # Scene dressing (stars, nebulae, atmosphere)
	├─ game.js          # Bootstraps Three.js, main loop, input
	├─ player.js        # UFO model, controls, damage & FX
	├─ obstacles.js     # Procedural obstacle + collectible logic
	├─ particles.js     # Particle pools (trail, damage, warp, etc.)
	├─ state.js         # GameState + SaveSystem
	├─ ui.js            # Menu, HUD, overlays, styling
	└─ zones.js         # Zone-specific hazards & set pieces
```

## Getting Started
1. **Clone** the repo and `cd` into `HelioCentric`.
2. **Install a static server** (any works). Example: `npm install -g serve` or use `npx http-server`.
3. **Run the server** from the project root, e.g. `serve .` or `npx http-server -p 8080`.
4. **Open** `http://localhost:3000` (or your chosen port) and load `index.html`.

> Tip: Serving over HTTP ensures Three.js loads assets correctly and allows LocalStorage saves. Opening the file directly may block some browser features.

## Saving & Data
- Save key: `heliocentric_saves`. Delete this entry from devtools > Application > Local Storage to reset progress/high score.
- Data stored: unlocked checkpoints, global high score, lifetime coins/wallet, owned vehicles (future use).

## Development Notes
- Obstacles and hazards are purely procedural; tweak pacing via `CONFIG` constants (lane width, spawn distance, speed increments, collectible rarities, etc.).
- Zone visuals live in `ZONES` (colors, fog density, speed multipliers). Updating a zone entry auto-propagates to environment gradients, UI callouts, and challenge pacing.
- Touch controls share the same move/jump hooks as keyboard, making it easy to add controller support via the `Player` API.

## Contributing
Issues and pull requests are welcome! Please open an issue describing new mechanics, visual polish ideas, or bug reports before submitting major changes.

## License
Add your preferred license here (MIT, Apache-2.0, etc.).
