// ══════════════════════════════════════════════════════════════
//  STATE.JS — Game State & Save/Load System
// ══════════════════════════════════════════════════════════════

const GameState = {
    // Runtime state
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    
    // Player state
    lives: CONFIG.INITIAL_LIVES,
    coins: 0,
    score: 0,
    currentZoneIndex: 0,
    
    // Power-ups
    shieldActive: false,
    darkMatterTimer: 0,
    gravityTimer: 0,
    warpTimer: 0,
    magnetTimer: 0,
    
    // Position
    ufoZPos: 0,
    currentLane: 0,
    isJumping: false,
    ufoVelocityY: 0,
    
    // Timers
    invincibleTimer: 0,
    playTime: 0,
    sensoryBlindTimer: 0, // Used for Venus Acid Cloud Walls or Mars Dust Storms
    
    // Speed
    currentSpeed: CONFIG.BASE_SPEED,
    
    // Spawning
    nextObstacleZ: -30,
    
    // Checkpoints achieved
    checkpointsReached: [],
    
    // Initialize state
    init() {
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.lives = CONFIG.INITIAL_LIVES;
        this.coins = 0;
        this.score = 0;
        
        // Reset powerups
        this.shieldActive = false;
        this.darkMatterTimer = 0;
        this.gravityTimer = 0;
        this.warpTimer = 0;
        this.magnetTimer = 0;

        this.currentZoneIndex = 0;
        this.ufoZPos = 0;
        this.currentLane = 0;
        this.isJumping = false;
        this.ufoVelocityY = 0;
        this.invincibleTimer = 0;
        this.playTime = 0;
        this.sensoryBlindTimer = 0;
        this.currentSpeed = CONFIG.BASE_SPEED;
        this.nextObstacleZ = -30;
    },
    
    // Start from a specific zone (checkpoint)
    startFromZone(zoneIndex) {
        this.init();
        if (zoneIndex > 0 && zoneIndex < ZONES.length) {
            const zone = ZONES[zoneIndex];
            this.currentZoneIndex = zoneIndex;
            this.ufoZPos = -zone.distance;
            this.nextObstacleZ = -zone.distance - 30;
            this.currentSpeed = CONFIG.BASE_SPEED * zone.speedMultiplier;
        }
        this.isPlaying = true;
    },
    
    // Get current zone
    getCurrentZone() {
        return ZONES[this.currentZoneIndex];
    },
    
    // Get next zone
    getNextZone() {
        return ZONES[Math.min(this.currentZoneIndex + 1, ZONES.length - 1)];
    },
    
    // Check zone transition
    checkZoneTransition() {
        const dist = -this.ufoZPos;
        if (this.currentZoneIndex < ZONES.length - 1) {
            if (dist >= ZONES[this.currentZoneIndex + 1].distance) {
                this.currentZoneIndex++;
                // Mark checkpoint
                if (!this.checkpointsReached.includes(this.currentZoneIndex)) {
                    this.checkpointsReached.push(this.currentZoneIndex);
                    SaveSystem.saveCheckpoint(this.currentZoneIndex);
                }
                return true; // Zone changed
            }
        }
        return false;
    },
    
    // Get interpolation factor between zones
    getZoneInterpolation() {
        const dist = -this.ufoZPos;
        const current = this.getCurrentZone();
        const next = this.getNextZone();
        if (next.distance > current.distance) {
            return Math.max(0, Math.min(1, 
                (dist - current.distance) / (next.distance - current.distance)
            ));
        }
        return 0;
    }
};

// ══════════════════════════════════════════════════════════════
//  SAVE SYSTEM
// ══════════════════════════════════════════════════════════════

const SaveSystem = {
    // Get all saves
    getSaves() {
        const base = {
            checkpoints: [],
            highScore: 0,
            totalCoins: 0,
            wallet: 0,
            ownedVehicles: []
        };
        try {
            const data = localStorage.getItem(CONFIG.SAVE_KEY);
            if (!data) return base;
            const parsed = JSON.parse(data);
            return {
                ...base,
                ...parsed,
                wallet: typeof parsed.wallet === 'number'
                    ? parsed.wallet
                    : (typeof parsed.totalCoins === 'number' ? parsed.totalCoins : 0),
                ownedVehicles: Array.isArray(parsed.ownedVehicles) ? parsed.ownedVehicles : []
            };
        } catch (e) {
            console.error('Failed to parse saves', e);
            return base;
        }
    },
    
    // Save checkpoint
    saveCheckpoint(zoneIndex) {
        try {
            const saves = this.getSaves();
            if (!saves.checkpoints.includes(zoneIndex)) {
                saves.checkpoints.push(zoneIndex);
                saves.checkpoints.sort((a, b) => a - b);
            }
            localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(saves));
            console.log(`Checkpoint saved: ${ZONES[zoneIndex].name}`);
            return true;
        } catch (e) {
            console.warn('Failed to save checkpoint:', e);
            return false;
        }
    },
    
    // Update high score
    updateHighScore(score, coins) {
        try {
            const saves = this.getSaves();
            if (score > saves.highScore) {
                saves.highScore = score;
            }
            const earned = Math.max(0, Number(coins) || 0);
            const currentWallet = typeof saves.wallet === 'number'
                ? saves.wallet
                : (saves.totalCoins || 0);
            saves.totalCoins = (saves.totalCoins || 0) + earned;
            saves.wallet = currentWallet + earned;
            localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(saves));
            return true;
        } catch (e) {
            console.warn('Failed to save score:', e);
            return false;
        }
    },
    
    // Get available checkpoints (for menu UI)
    getUnlockedCheckpoints() {
        const saves = this.getSaves();
        const indices = [0, ...(saves.checkpoints || [])]; // Always include Pluto (index 0)
        const unique = [...new Set(indices)].filter(i => i >= 0 && i < ZONES.length).sort((a, b) => a - b);

        return unique.map(idx => ({
            zoneIndex: idx,
            zoneName: ZONES[idx].name,
            color: ZONES[idx].objColor,
            icon: idx === 0 ? '❄️' : (idx === ZONES.length - 1 ? '☀️' : '🪐'),
            highScore: saves.highScore || 0
        }));
    },

    getLatestCheckpoint() {
        const checkpoints = this.getUnlockedCheckpoints();
        if (checkpoints.length === 0) {
            return null;
        }
        // The checkpoints are sorted by zoneIndex, so the last one is the latest
        return checkpoints[checkpoints.length - 1];
    },
    
    // Clear all saves
    clearSaves() {
        try {
            localStorage.removeItem(CONFIG.SAVE_KEY);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Get high score
    getHighScore() {
        return this.getSaves().highScore || 0;
    },
    
    // Get total coins collected
    getTotalCoins() {
        const saves = this.getSaves();
        return saves.totalCoins || 0;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, SaveSystem };
}
