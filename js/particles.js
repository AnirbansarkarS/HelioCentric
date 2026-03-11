// ══════════════════════════════════════════════════════════════
//  PARTICLES.JS — Particle System Management
// ══════════════════════════════════════════════════════════════

const Particles = {
    scene: null,
    
    // Particle pools
    damageParticles: [],
    coinParticles: [],
    trailParticles: null,
    speedLines: null,
    
    // Initialize
    init(scene) {
        this.scene = scene;
        this.createTrailSystem();
        this.createSpeedLines();
    },
    
    // ── TRAIL PARTICLES (Behind UFO) ──
    createTrailSystem() {
        const count = 100;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const opacities = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = i * 0.5;
            sizes[i] = 0.1 + Math.random() * 0.1;
            opacities[i] = 1 - (i / count);
        }
        
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        const mat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.15,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.trailParticles = new THREE.Points(geo, mat);
        this.scene.add(this.trailParticles);
    },
    
    // ── SPEED LINES ──
    createSpeedLines() {
        const count = 50;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 6); // 2 vertices per line
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 10;
            const z = -Math.random() * 50;
            
            positions[i * 6] = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;
            
            positions[i * 6 + 3] = x;
            positions[i * 6 + 4] = y;
            positions[i * 6 + 5] = z - 2;
        }
        
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const mat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        
        this.speedLines = new THREE.LineSegments(geo, mat);
        this.scene.add(this.speedLines);
    },
    
    // ── DAMAGE BURST ──
    spawnDamageBurst(position) {
        const count = 30;
        const group = new THREE.Group();
        
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5),
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geo, mat);
            
            particle.position.copy(position);
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 8 + 2,
                (Math.random() - 0.5) * 10
            );
            particle.userData.life = 1.0;
            
            group.add(particle);
        }
        
        group.userData.type = 'damageBurst';
        this.scene.add(group);
        this.damageParticles.push(group);
    },
    
    // ── COIN COLLECT EFFECT ──
    spawnCoinCollect(position) {
        const count = 15;
        const group = new THREE.Group();
        
        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffdd44,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geo, mat);
            
            particle.position.copy(position);
            const angle = (i / count) * Math.PI * 2;
            particle.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * 3,
                Math.random() * 5 + 3,
                Math.sin(angle) * 3
            );
            particle.userData.life = 1.0;
            
            group.add(particle);
        }
        
        // Plus one text sprite
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffdd44';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+1', 32, 32);
        
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(position);
        sprite.position.y += 1;
        sprite.scale.set(0.8, 0.8, 1);
        sprite.userData.life = 1.0;
        group.add(sprite);
        group.userData.textSprite = sprite;
        
        group.userData.type = 'coinCollect';
        this.scene.add(group);
        this.coinParticles.push(group);
    },
    
    // ── ZONE TRANSITION EFFECT ──
    spawnZoneTransition(position, color1, color2) {
        const count = 80;
        const group = new THREE.Group();
        
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? color1 : color2,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geo, mat);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 5;
            particle.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + (Math.random() - 0.5) * 3,
                position.z + Math.sin(angle) * radius
            );
            
            particle.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * 2,
                Math.random() * 4 - 2,
                Math.sin(angle) * 2
            );
            particle.userData.life = 1.5;
            
            group.add(particle);
        }
        
        group.userData.type = 'zoneTransition';
        this.scene.add(group);
        this.damageParticles.push(group);
    },
    
    // ── UPDATE ──
    update(delta, playerPos, speed) {
        // Update trail
        this.updateTrail(playerPos, speed);
        
        // Update speed lines
        this.updateSpeedLines(speed, playerPos.z);
        
        // Update damage particles
        this.updateDamageBursts(delta);
        
        // Update coin particles
        this.updateCoinParticles(delta);
    },
    
    updateTrail(playerPos, speed) {
        if (!this.trailParticles) return;
        
        const positions = this.trailParticles.geometry.attributes.position.array;
        const count = positions.length / 3;
        
        // Shift positions back
        for (let i = count - 1; i > 0; i--) {
            positions[i * 3] = positions[(i - 1) * 3];
            positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
            positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
        }
        
        // Set first position to player
        positions[0] = playerPos.x + (Math.random() - 0.5) * 0.2;
        positions[1] = playerPos.y + (Math.random() - 0.5) * 0.2;
        positions[2] = playerPos.z + 1;
        
        this.trailParticles.geometry.attributes.position.needsUpdate = true;
        
        // Color based on zone
        const zone = GameState.getCurrentZone();
        this.trailParticles.material.color.setHex(zone.objColor);
        this.trailParticles.material.opacity = Math.min(0.8, speed / CONFIG.BASE_SPEED * 0.3);
    },
    
    updateSpeedLines(speed, playerZ) {
        if (!this.speedLines) return;
        
        const positions = this.speedLines.geometry.attributes.position.array;
        const speedFactor = speed / CONFIG.BASE_SPEED;
        
        for (let i = 0; i < positions.length / 6; i++) {
            positions[i * 6 + 2] += speedFactor * 2;
            positions[i * 6 + 5] += speedFactor * 2;
            
            // Reset lines that pass player
            if (positions[i * 6 + 2] > playerZ + 20) {
                const x = (Math.random() - 0.5) * 20;
                const y = (Math.random() - 0.5) * 10;
                const z = playerZ - 30 - Math.random() * 30;
                
                positions[i * 6] = x;
                positions[i * 6 + 1] = y;
                positions[i * 6 + 2] = z;
                
                positions[i * 6 + 3] = x;
                positions[i * 6 + 4] = y;
                positions[i * 6 + 5] = z - 2 * speedFactor;
            }
        }
        
        this.speedLines.geometry.attributes.position.needsUpdate = true;
        this.speedLines.material.opacity = Math.min(0.5, speedFactor * 0.2);
    },
    
    updateDamageBursts(delta) {
        for (let i = this.damageParticles.length - 1; i >= 0; i--) {
            const group = this.damageParticles[i];
            let allDead = true;
            
            group.children.forEach(particle => {
                if (particle.userData.life > 0) {
                    particle.userData.life -= delta;
                    
                    if (particle.userData.velocity) {
                        particle.position.add(
                            particle.userData.velocity.clone().multiplyScalar(delta)
                        );
                        particle.userData.velocity.y -= delta * 15; // Gravity
                    }
                    
                    if (particle.material) {
                        particle.material.opacity = Math.max(0, particle.userData.life);
                    }
                    
                    allDead = false;
                }
            });
            
            if (allDead) {
                this.scene.remove(group);
                this.damageParticles.splice(i, 1);
            }
        }
    },
    
    updateCoinParticles(delta) {
        for (let i = this.coinParticles.length - 1; i >= 0; i--) {
            const group = this.coinParticles[i];
            let allDead = true;
            
            group.children.forEach(particle => {
                if (particle.userData.life > 0) {
                    particle.userData.life -= delta;
                    
                    if (particle.userData.velocity) {
                        particle.position.add(
                            particle.userData.velocity.clone().multiplyScalar(delta)
                        );
                        particle.userData.velocity.y -= delta * 10;
                    } else if (particle === group.userData.textSprite) {
                        particle.position.y += delta * 2;
                    }
                    
                    if (particle.material) {
                        particle.material.opacity = Math.max(0, particle.userData.life);
                    }
                    
                    allDead = false;
                }
            });
            
            if (allDead) {
                this.scene.remove(group);
                this.coinParticles.splice(i, 1);
            }
        }
    },
    
    // Clear all particles
    clear() {
        this.damageParticles.forEach(g => this.scene.remove(g));
        this.damageParticles = [];
        
        this.coinParticles.forEach(g => this.scene.remove(g));
        this.coinParticles = [];
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Particles };
}
