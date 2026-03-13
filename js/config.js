// ══════════════════════════════════════════════════════════════
//  CONFIG.JS — Game Configuration & Constants
// ══════════════════════════════════════════════════════════════

const CONFIG = {
    // Movement
    LANE_WIDTH: 3,
    BASE_SPEED: 15,
    SPEED_INCREMENT: 0.4,
    
    // Player
    JUMP_FORCE: 12,
    GRAVITY: -30,
    UFO_BASE_Y: 0,
    INVINCIBLE_DURATION: 1.5,
    INITIAL_LIVES: 3,
    
    // Spawning
    OBSTACLE_SPACING: 15,
    SPAWN_AHEAD_DISTANCE: 100,
    CLEANUP_BEHIND_DISTANCE: 25,
    
    // Collision
    UFO_COLLISION_RADIUS: 1.2,
    COIN_COLLECTION_RADIUS: 1.3,
    ICY_COLLISION_RADIUS: 1.6,
    HAZARD_COLLISION_RADIUS: 1.5,
    HAZARD_JUMP_CLEARANCE: 1.0,
    
    // Camera
    CAM_OFFSET: { x: 0, y: 3, z: 6 },
    CAM_LOOK_AHEAD: 10,
    
    // Powerup durations (seconds)
    POWERUP_DURATION: 10,
    DARK_MATTER_SPEED_MULTI: 1.5,
    GRAVITY_LIFT: 1.5, // multiplier to jump duration/force

    // Visual
    RIM_LIGHT_COUNT: 10,
    STAR_COUNT: 3000,
    NEBULA_PARTICLE_COUNT: 500,
    
    // Storage Keys
    SAVE_KEY: 'heliocentric_saves',
    SETTINGS_KEY: 'heliocentric_settings',
    
    // Collectible Tiers
    COLLECTIBLES: {
        starFragment:   { coinValue: 1,  scoreValue: 5,   rarity: 0.62, emoji: '⭐', label: 'Star Fragment' },
        darkMatterShard:{ coinValue: 5,  scoreValue: 25,  rarity: 0.18, emoji: '🟣', label: 'Dark Matter Shard' },
        cometCrystal:   { coinValue: 3,  scoreValue: 15,  rarity: 0.08, emoji: '🌠', label: 'Comet Crystal' },
        alienTechPart:  { coinValue: 10, scoreValue: 50,  rarity: 0.10, emoji: '🛸', label: 'Alien Tech Part' },
        solarEnergyCell:{ coinValue: 15, scoreValue: 75,  rarity: 0.05, emoji: '☀️', label: 'Solar Energy Cell' },
        planetRelic:    { coinValue: 50, scoreValue: 250, rarity: 0.02, emoji: '🪐', label: 'Planet Relic' }
    }
};

// Planet/Zone definitions with all visual and gameplay parameters
const ZONES = [
    {
        name: "Pluto",
        distance: 0,
        bgColor: 0x030308,
        objColor: 0x99bbcc,
        fogDensity: 0.025,
        ambientIntensity: 0.4,
        speedMultiplier: 1.0,
        description: "Kuiper Belt - Icy Debris Field"
    },
    {
        name: "Neptune",
        distance: 1000,
        bgColor: 0x000833,
        objColor: 0x2244ff,
        fogDensity: 0.018,
        ambientIntensity: 0.5,
        speedMultiplier: 1.1,
        description: "Blue Giant - Swirling Storms"
    },
    {
        name: "Uranus",
        distance: 2000,
        bgColor: 0x001133,
        objColor: 0x44ffff,
        fogDensity: 0.018,
        ambientIntensity: 0.5,
        speedMultiplier: 1.15,
        description: "Tilted World - Rotating Rings"
    },
    {
        name: "Saturn",
        distance: 3000,
        bgColor: 0x1a1500,
        objColor: 0xddaa55,
        fogDensity: 0.016,
        ambientIntensity: 0.55,
        speedMultiplier: 1.2,
        description: "Ring Lord - Crossing Debris"
    },
    {
        name: "Jupiter",
        distance: 4000,
        bgColor: 0x221100,
        objColor: 0xffaa88,
        fogDensity: 0.015,
        ambientIntensity: 0.6,
        speedMultiplier: 1.25,
        description: "Gas Giant - Intense Gravity"
    },
    {
        name: "Mars",
        distance: 5000,
        bgColor: 0x330500,
        objColor: 0xff3300,
        fogDensity: 0.014,
        ambientIntensity: 0.65,
        speedMultiplier: 1.3,
        description: "Red Planet - Dust Storms"
    },
    {
        name: "Earth",
        distance: 6000,
        bgColor: 0x001144,
        objColor: 0x0088ff,
        fogDensity: 0.012,
        ambientIntensity: 0.7,
        speedMultiplier: 1.35,
        description: "Home World - Orbital Debris"
    },
    {
        name: "Venus",
        distance: 7000,
        bgColor: 0x443311,
        objColor: 0xffcc44,
        fogDensity: 0.022,
        ambientIntensity: 0.75,
        speedMultiplier: 1.4,
        description: "Hellscape - Toxic Atmosphere"
    },
    {
        name: "Mercury",
        distance: 8000,
        bgColor: 0x331108,
        objColor: 0xff6622,
        fogDensity: 0.012,
        ambientIntensity: 0.85,
        speedMultiplier: 1.5,
        description: "Scorched World - Extreme Heat"
    },
    {
        name: "Sun",
        distance: 9000,
        bgColor: 0x551100,
        objColor: 0xffff00,
        fogDensity: 0.006,
        ambientIntensity: 1.2,
        speedMultiplier: 2.0,
        description: "Solar Core - Maximum Velocity"
    }
];

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ZONES };
}
