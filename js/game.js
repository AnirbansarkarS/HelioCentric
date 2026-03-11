// ══════════════════════════════════════════════════════════════
//  GAME.JS — Main Game Loop & Integration
// ══════════════════════════════════════════════════════════════

const Game = {
    // Three.js core
    scene: null,
    camera: null,
    renderer: null,
    
    // Timing
    clock: null,
    
    // Initialize the game
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000022, 0.01);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, -10);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);
        
        // Clock
        this.clock = new THREE.Clock();
        
        // Lighting
        this.setupLighting();
        
        // Initialize all modules
        Player.init(this.scene);
        Environment.init(this.scene);
        Obstacles.init(this.scene);
        ZoneManager.init(this.scene);
        Particles.init(this.scene);
        UI.init(document.body);
        
        // UI callbacks
        UI.onStartGame = (checkpoint) => this.startGame(checkpoint);
        UI.onResumeCheckpoint = (checkpoint) => this.startGame(checkpoint);
        
        // Input handling
        this.setupInput();
        
        // Window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Show menu
        UI.showMenu();
        
        // Start render loop
        this.animate();
    },
    
    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x333344, 0.5);
        this.scene.add(ambient);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffee, 0.8);
        dirLight.position.set(5, 10, -20);
        this.scene.add(dirLight);
        
        // Point light on player
        const playerLight = new THREE.PointLight(0x00ffff, 0.5, 15);
        playerLight.position.set(0, 2, 0);
        this.scene.add(playerLight);
        this.playerLight = playerLight;
    },
    
    setupInput() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (GameState.isGameOver || GameState.isPaused) {
                if (e.code === 'KeyP' && GameState.isPaused) {
                    UI.hidePause();
                    GameState.isPaused = false;
                }
                return;
            }
            
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    Player.moveLeft();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    Player.moveRight();
                    break;
                case 'Space':
                case 'ArrowUp':
                case 'KeyW':
                    Player.jump();
                    break;
                case 'KeyP':
                    GameState.isPaused = true;
                    UI.showPause();
                    break;
            }
        });
        
        // Mobile touch controls
        this.setupTouchControls();
    },
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        const minSwipeDistance = 30;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (GameState.isGameOver || GameState.isPaused) return;
            
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            // Horizontal swipe (lane change)
            if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
                if (deltaX > 0) {
                    Player.moveRight();
                } else {
                    Player.moveLeft();
                }
            }
            // Vertical swipe up (jump)
            else if (absDeltaY > absDeltaX && deltaY < -minSwipeDistance) {
                Player.jump();
            }
        }, { passive: true });
    },
    
    startGame(checkpoint) {
        // Determine starting zone index
        const startZoneIndex = checkpoint && typeof checkpoint.zoneIndex === 'number'
            ? checkpoint.zoneIndex
            : 0;

        // Reset and start from zone
        GameState.startFromZone(startZoneIndex);

        // Clear existing objects
        Obstacles.clear();
        Obstacles.resetAlgorithm();
        ZoneManager.clear();
        Particles.clear();
        
        // Reset player
        Player.reset();
        const playerPos = Player.getPosition();

        // Update camera
        this.camera.position.z = playerPos.z + 10;
        
        // Show HUD
        UI.hideMenu();
        UI.hideGameOver();
        UI.showHUD();
        
        // Reset clock
        this.clock.start();
        
        // Show zone notification
        const zone = GameState.getCurrentZone();
        UI.showZoneNotification(zone.name, zone.description);
    },
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (GameState.isGameOver || GameState.isPaused) {
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        const delta = Math.min(this.clock.getDelta(), 0.05);

        if (!UI.hudOverlay || UI.hudOverlay.style.display === 'none') {
            // Menu state - just render background
            Environment.update(delta, this.camera.position.z);
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        this.update(delta);
        this.renderer.render(this.scene, this.camera);
    },
    
    update(delta) {
        // Distance travelled (positive value)
        const dist = -GameState.ufoZPos;
        const zone = GameState.getCurrentZone();
        const speedMultiplier = zone.speedMultiplier || 1.0;

        // Update speed with gentle ramp based on distance
        GameState.currentSpeed = (CONFIG.BASE_SPEED + dist * CONFIG.SPEED_INCREMENT * 0.001) * speedMultiplier;

        // Score
        GameState.score = Math.floor(dist);

        // Update Powerups
        ['shield', 'darkMatter', 'gravity', 'warp', 'magnet'].forEach(p => { if (GameState[p + 'Timer'] > 0) GameState[p + 'Timer'] -= delta; });
        if (GameState.shieldTimer <= 0) GameState.shieldActive = false;

        // Update player (handles forward motion)
        Player.update(delta);
        const playerPos = Player.getPosition().clone();
        
        // Camera follow
        this.camera.position.z = playerPos.z + 10;
        this.camera.position.y = 5 + Math.sin(Date.now() * 0.001) * 0.2;
        
        // Player light
        if (this.playerLight) {
            this.playerLight.position.copy(playerPos);
            this.playerLight.position.y += 2;
        }
        
        // Spawn obstacles ahead of the player
        while (GameState.ufoZPos - GameState.nextObstacleZ < CONFIG.SPAWN_AHEAD_DISTANCE) {
            this.spawnObstacles(GameState.nextObstacleZ);
            GameState.nextObstacleZ -= CONFIG.OBSTACLE_SPACING;
        }
        
        // Update obstacles and check collisions
        const collision = Obstacles.update(delta, playerPos);
        if (collision) {
            this.handleCollision(collision, playerPos);
        }
        
        // Update zone-specific obstacles
        const zoneCollision = ZoneManager.update(delta, playerPos);
        if (zoneCollision) {
            this.handleCollision(zoneCollision, playerPos);
        }
        
        // Update environment
        Environment.update(delta, playerPos.z);
        
        // Update particles
        Particles.update(delta, playerPos, GameState.speed);
        
        // Check zone transitions (update state + visual feedback)
        const zoneChanged = GameState.checkZoneTransition();
        if (zoneChanged) {
            const currentZone = GameState.getCurrentZone();
            const prevZone = ZONES[Math.max(0, GameState.currentZoneIndex - 1)];
            UI.showCheckpointSaved(currentZone.name);
            UI.showZoneNotification(currentZone.name, currentZone.description);
            Particles.spawnZoneTransition(playerPos, prevZone.objColor, currentZone.objColor);
        }
        
        // Update UI
        UI.updateHUD();
    },
    
    spawnObstacles(z) {
        const zone = GameState.getCurrentZone();
        const distance = -GameState.ufoZPos;

        // Use the advanced obstacle algorithm
        Obstacles.spawnRow(z, zone, distance);

        // Also spawn zone-specific special mechanics (Uranus rings, Saturn cross rings, etc)
        const zoneName = zone.name;
        if (zoneName === 'Uranus' && Math.random() < 0.15) {
            ZoneManager.spawnUranusRing(z);
        } else if (zoneName === 'Saturn' && Math.random() < 0.15) {
            ZoneManager.spawnSaturnCrossRing(z);
        }
    },
    
    handleCollision(collision, playerPos) {
        if (collision.isCollectible) {
            Particles.spawnCoinCollect(playerPos);
            
            if (collision.type === 'powerup') {
                // Activate powerup timer
                GameState[`${collision.powerupType}Timer`] = CONFIG.POWERUP_DURATION;
                if (collision.powerupType === 'shield') {
                    GameState.shieldActive = true;
                }
                UI.showPowerupMessage(collision.powerupType);
            } else {
                // All collectible tiers feed into unified coins
                GameState.coins += (collision.coinValue || 1);
                GameState.score += (collision.scoreValue || 5);
                
                // Show collect message for rare tiers
                if (collision.coinValue >= 10) {
                    const tier = CONFIG.COLLECTIBLES[collision.type];
                    if (tier) {
                        UI.showCollectMessage(tier.emoji + ' ' + tier.label, collision.coinValue);
                    }
                }
            }
        } else if (collision.type === 'obstacle') {
            if (GameState.shieldActive) {
                // Break shield instead of taking damage
                GameState.shieldActive = false;
                GameState.shieldTimer = 0;
                Particles.spawnDamageBurst(playerPos); // shield break particles
            } else {
                const gameOver = Player.takeDamage();
                Particles.spawnDamageBurst(playerPos);
                if (gameOver) {
                    this.gameOver();
                }
            }
        } else if (collision.type === 'hazard') {
            if (GameState.shieldActive) {
                GameState.shieldActive = false;
                GameState.shieldTimer = 0;
                Particles.spawnDamageBurst(playerPos);
            } else {
                // Hazards are instant kill unless shielded
                GameState.lives = 0;
                Particles.spawnDamageBurst(playerPos);
                this.gameOver();
            }
        }
    },
    
    gameOver() {
        GameState.isGameOver = true;
        UI.showGameOver();
    },
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
