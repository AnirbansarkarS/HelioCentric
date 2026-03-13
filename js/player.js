// ══════════════════════════════════════════════════════════════
//  PLAYER.JS — UFO/Player Management
// ══════════════════════════════════════════════════════════════

const Player = {
    group: null,
    engineGlowMat: null,
    ufoLight: null,
    rimLights: [],
    ufo: null,
    
    // Initialize player and model
    init(scene) {
        this.create(scene);
        this.ufo = this.group;
        return this.group;
    },
    
    // Create UFO model
    create(scene) {
        this.group = new THREE.Group();
        
        // Main disc body
        const discGeo = new THREE.SphereGeometry(0.8, 32, 16);
        discGeo.scale(1, 0.3, 1);
        const discMat = new THREE.MeshPhongMaterial({ 
            color: 0x44aaff, 
            flatShading: true,
            shininess: 80
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        this.group.add(disc);
        
        // Glass dome
        const domeGeo = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshPhongMaterial({ 
            color: 0xaaffff, 
            transparent: true, 
            opacity: 0.8,
            shininess: 120
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 0.1;
        this.group.add(dome);
        
        // Rim lights
        const rimGeo = new THREE.SphereGeometry(0.05, 8, 8);
        this.rimLights = [];
        for (let i = 0; i < CONFIG.RIM_LIGHT_COUNT; i++) {
            const angle = (i / CONFIG.RIM_LIGHT_COUNT) * Math.PI * 2;
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            const rimLight = new THREE.Mesh(rimGeo, mat);
            rimLight.position.set(
                Math.cos(angle) * 0.78, 
                -0.02, 
                Math.sin(angle) * 0.78
            );
            this.group.add(rimLight);
            this.rimLights.push(rimLight);
        }
        
        // Engine glow
        this.engineGlowMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ccff, 
            transparent: true, 
            opacity: 0.45 
        });
        const engineGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 16, 16), 
            this.engineGlowMat
        );
        engineGlow.position.y = -0.18;
        engineGlow.scale.set(1, 0.5, 1);
        this.group.add(engineGlow);
        
        // Point light under UFO
        this.ufoLight = new THREE.PointLight(0x00ccff, 1.2, 8);
        this.ufoLight.position.set(0, -0.4, 0);
        this.group.add(this.ufoLight);
        
        scene.add(this.group);
        // Alias for external access
        this.ufo = this.group;
        return this.group;
    },
    
    // Update player position and animations
    update(delta) {
        if (!this.group) return;
        
        // Forward movement
        GameState.ufoZPos -= GameState.currentSpeed * delta;
        this.group.position.z = GameState.ufoZPos;
        
        // Lane switching (smooth)
        const targetX = GameState.currentLane * CONFIG.LANE_WIDTH;
        this.group.position.x += (targetX - this.group.position.x) * 10 * delta;
        
        // Jumping
        if (GameState.isJumping) {
            this.group.position.y += GameState.ufoVelocityY * delta;
            const gravityMultiplier = GameState.gravityTimer > 0 ? CONFIG.GRAVITY_LIFT : 1;
            const effectiveGravity = CONFIG.GRAVITY / gravityMultiplier;
            GameState.ufoVelocityY += effectiveGravity * delta;
            
            if (this.group.position.y <= CONFIG.UFO_BASE_Y) {
                this.group.position.y = CONFIG.UFO_BASE_Y;
                GameState.isJumping = false;
                GameState.ufoVelocityY = 0;
            }
        }
        
        // Invincibility blink
        if (GameState.invincibleTimer > 0) {
            GameState.invincibleTimer -= delta;
            this.group.visible = Math.floor(GameState.invincibleTimer * 10) % 2 === 0;
        } else {
            this.group.visible = true;
        }
        
        // Animations
        this.animateEffects(delta);
    },
    
    // Animate visual effects
    animateEffects(delta) {
        const time = Date.now();
        
        // Rim light color cycling
        const rimHue = (time * 0.001) % 1;
        this.rimLights.forEach((light, i) => {
            if (light && light.material) {
                const h = (rimHue + i * 0.1) % 1;
                light.material.color.setHSL(h, 1, 0.6);
            }
        });
        
        // Engine glow pulse
        if (this.engineGlowMat) {
            this.engineGlowMat.opacity = 0.35 + Math.sin(time * 0.008) * 0.15;
        }
        
        // UFO light intensity pulse
        if (this.ufoLight) {
            this.ufoLight.intensity = 1.0 + Math.sin(time * 0.006) * 0.4;
        }
        
        // Hover spin
        this.group.rotation.y -= delta;
    },
    
    // Handle damage
    takeDamage() {
        if (GameState.invincibleTimer > 0) return false;
        
        GameState.lives--;
        GameState.invincibleTimer = CONFIG.INVINCIBLE_DURATION;
        
        // Screen flash
        UI.showHitFlash();
        UI.updateLives();
        
        if (GameState.lives <= 0) {
            GameState.isGameOver = true;
            UI.showGameOver();
            SaveSystem.updateHighScore(GameState.score, GameState.coins);
            return true; // Game over
        }
        return false;
    },
    
    // Jump
    jump() {
        if (!GameState.isJumping && !GameState.isGameOver) {
            GameState.isJumping = true;
            const jumpMultiplier = GameState.gravityTimer > 0 ? CONFIG.GRAVITY_LIFT : 1;
            GameState.ufoVelocityY = CONFIG.JUMP_FORCE * jumpMultiplier;
        }
    },
    
    // Move left
    moveLeft() {
        if (GameState.currentLane > -1 && !GameState.isGameOver) {
            GameState.currentLane--;
        }
    },
    
    // Move right
    moveRight() {
        if (GameState.currentLane < 1 && !GameState.isGameOver) {
            GameState.currentLane++;
        }
    },
    
    // Get position
    getPosition() {
        return this.group ? this.group.position : new THREE.Vector3();
    },
    
    // Reset position
    reset() {
        if (this.group) {
            this.group.position.set(0, 0, GameState.ufoZPos);
            this.group.rotation.set(0, 0, 0);
            this.group.visible = true;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player };
}
