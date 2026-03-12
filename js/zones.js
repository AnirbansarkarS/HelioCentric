// ══════════════════════════════════════════════════════════════
//  ZONES.JS — Zone-Specific Logic & Spawning
// ══════════════════════════════════════════════════════════════

const ZoneManager = {
    scene: null,
    
    // Zone-specific particle systems
    neptuneSwirl: null,
    neptuneGeo: null,
    neptuneMat: null,
    
    // Zone obstacle arrays
    uranusRings: [],
    saturnCrossRings: [],
    
    // Initialize
    init(scene) {
        this.scene = scene;
        this.createNeptuneSwirl();
    },
    
    // Create Neptune swirl particle system
    createNeptuneSwirl() {
        const count = 300;
        this.neptuneGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
        
        this.neptuneGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        this.neptuneMat = new THREE.PointsMaterial({
            color: 0x4488ff,
            size: 0.15,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.neptuneSwirl = new THREE.Points(this.neptuneGeo, this.neptuneMat);
        this.scene.add(this.neptuneSwirl);
    },
    
    // Spawn based on current zone
    spawn(zoneName, lane, z) {
        switch (zoneName) {
            case "Pluto":
                return this.spawnPlutoObstacles(lane, z);
            case "Neptune":
                return this.spawnNeptuneObstacles(lane, z);
            case "Uranus":
                return this.spawnUranusObstacles(lane, z);
            case "Saturn":
                return this.spawnSaturnObstacles(lane, z);
            case "Jupiter":
                return this.spawnJupiterObstacles(lane, z);
            case "Mars":
                return this.spawnMarsObstacles(lane, z);
            case "Earth":
                return this.spawnEarthObstacles(lane, z);
            case "Venus":
                return this.spawnVenusObstacles(lane, z);
            case "Mercury":
                return this.spawnMercuryObstacles(lane, z);
            case "Sun":
                return this.spawnSunObstacles(lane, z);
            default:
                return this.spawnDefaultObstacles(lane, z);
        }
    },
    
    // ── PLUTO: Icy Kuiper Belt ──
    spawnPlutoObstacles(lane, z) {
        if (Math.random() > 0.35) {
            Obstacles.spawnIcyAsteroid(lane, z, 1.2 + Math.random() * 0.6);
        }
        if (Math.random() > 0.5) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── NEPTUNE: Blue Storms ──
    spawnNeptuneObstacles(lane, z) {
        if (Math.random() > 0.3) {
            Obstacles.spawnStandardObstacle(lane, z, 0x2266ff);
        } else {
            Obstacles.spawnHazard(lane, z);
        }
        if (Math.random() > 0.45) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── URANUS: Rotating Ring Belts ──
    spawnUranusObstacles(lane, z) {
        if (Math.random() > 0.4) {
            this.spawnUranusRing(z);
        } else if (Math.random() > 0.3) {
            Obstacles.spawnStandardObstacle(lane, z, 0x44dddd);
        } else {
            Obstacles.spawnHazard(lane, z);
        }
        if (Math.random() > 0.5) {
            Obstacles.spawnCoin(lane * CONFIG.LANE_WIDTH, z - 7);
        }
    },
    
    // ── SATURN: Crossing Rings ──
    spawnSaturnObstacles(lane, z) {
        if (Math.random() > 0.4) {
            this.spawnSaturnCrossRing(z);
        } else if (Math.random() > 0.3) {
            Obstacles.spawnStandardObstacle(lane, z, 0xddaa55);
        } else {
            Obstacles.spawnHazard(lane, z);
        }
        if (Math.random() > 0.5) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── JUPITER: Heavy Asteroids ──
    spawnJupiterObstacles(lane, z) {
        // Jupiter has larger, denser asteroids
        if (Math.random() > 0.25) {
            Obstacles.spawnStandardObstacle(lane, z, 0xffaa88, 1.0 + Math.random() * 0.4);
        } else {
            Obstacles.spawnHazard(lane, z);
        }
        if (Math.random() > 0.5) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── MARS: Red Dust Rocks ──
    spawnMarsObstacles(lane, z) {
        if (Math.random() > 0.3) {
            Obstacles.spawnStandardObstacle(lane, z, 0xff3300);
        } else {
            Obstacles.spawnHazard(lane, z);
        }
        if (Math.random() > 0.55) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── EARTH: Space Debris ──
    spawnEarthObstacles(lane, z) {
        if (Math.random() > 0.35) {
            // Mix of natural and artificial debris
            if (Math.random() > 0.5) {
                Obstacles.spawnStandardObstacle(lane, z, 0x888888);
            } else {
                Obstacles.spawnSatelliteDebris(lane, z);
            }
        } else {
            Obstacles.spawnHazard(lane, z);
        }
        if (Math.random() > 0.5) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── VENUS: Thick Atmosphere Hazards ──
    spawnVenusObstacles(lane, z) {
        // Venus has more hazards due to toxic atmosphere
        if (Math.random() > 0.5) {
            Obstacles.spawnStandardObstacle(lane, z, 0xffcc44);
        } else if (Math.random() > 0.3) {
            Obstacles.spawnHazard(lane, z);
        } else {
            // Acid cloud (acts like damage zone)
            Obstacles.spawnAcidCloud(lane, z);
        }
        if (Math.random() > 0.6) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── MERCURY: Heat Rocks ──
    spawnMercuryObstacles(lane, z) {
        // Mercury has glowing hot rocks
        if (Math.random() > 0.3) {
            Obstacles.spawnHeatRock(lane, z);
        } else {
            Obstacles.spawnHazard(lane, z);
        }
        if (Math.random() > 0.55) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── SUN: Solar Flares ──
    spawnSunObstacles(lane, z) {
        // Sun has extreme hazards
        if (Math.random() > 0.4) {
            Obstacles.spawnSolarDebris(lane, z);
        } else if (Math.random() > 0.3) {
            Obstacles.spawnSolarFlareHazard(lane, z);
        }
        // More coins as reward for reaching sun
        if (Math.random() > 0.35) {
            Obstacles.spawnCoin(lane * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // Default spawning
    spawnDefaultObstacles(lane, z) {
        const zone = GameState.getCurrentZone();
        if (Math.random() > 0.3) {
            Obstacles.spawnStandardObstacle(lane, z, zone.objColor);
        } else {
            Obstacles.spawnHazard(lane, z);
        }
        if (Math.random() > 0.55) {
            Obstacles.spawnCoin(((lane + 2) % 3 - 1) * CONFIG.LANE_WIDTH, z - 5);
        }
    },
    
    // ── URANUS RING (Now acting as Saturn Cross Ring) ──
    spawnUranusRing(z) {
        // SWAPPED: Uses Saturn's logic (moving torus pieces side-to-side)
        const group = new THREE.Group();
        const n = 10 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < n; i++) {
            const geo = new THREE.TorusGeometry(0.2 + Math.random() * 0.15, 0.06, 8, 12);
            // Use Uranus colors for the swapped obstacle
            const mat = new THREE.MeshPhongMaterial({ 
                color: 0x66cccc, 
                flatShading: true, 
                emissive: 0x224444 
            });
            const piece = new THREE.Mesh(geo, mat);
            piece.position.set(
                i * 0.7 - n * 0.35, 
                (Math.random() - 0.5) * 0.4, 
                (Math.random() - 0.5) * 0.6
            );
            piece.rotation.set(
                Math.random() * Math.PI, 
                Math.random() * Math.PI, 
                Math.random() * Math.PI
            );
            group.add(piece);
        }
        
        group.position.set(0, 0.3, z);
        group.userData.type = 'uranusRing';
        group.userData.speed = 1.0 + Math.random() * 1.5;
        group.userData.time = Math.random() * Math.PI * 2;
        this.scene.add(group);
        this.uranusRings.push(group);
    },
    
    // ── SATURN CROSS RING (Now acting as Uranus Ring) ──
    spawnSaturnCrossRing(z) {
        // SWAPPED: Uses Uranus logic (rotating ring of obstacles)
        const group = new THREE.Group();
        const count = 8 + Math.floor(Math.random() * 5);
        const radius = 4;
        const gapAngle = Math.random() * Math.PI * 2;
        const gapSize = 0.8;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            let diff = Math.abs(angle - gapAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < gapSize) continue;
            
            const geo = Obstacles.createAsteroidGeo(0.4);
            // Use Saturn colors for the swapped obstacle
            const mat = new THREE.MeshPhongMaterial({ 
                color: 0xccaa55, 
                flatShading: true 
            });
            const rock = new THREE.Mesh(geo, mat);
            rock.position.set(
                Math.cos(angle) * radius, 
                Math.sin(angle) * radius * 0.3, 
                0
            );
            group.add(rock);
        }
        
        group.position.set(0, 0.5, z);
        group.userData.type = 'saturnCrossRing';
        // Random rotation speed: between 1.2 and 3.7 radians/sec, random direction
        group.userData.rotSpeed = (1.2 + Math.random() * 2.5) * (Math.random() < 0.5 ? 1 : -1);
        group.userData.varySpeed = Math.random() > 0.4; // 60% chance to have varying speed
        
        // Randomize initial rotation so gaps aren't aligned
        group.rotation.y = Math.random() * Math.PI * 2;
        
        this.scene.add(group);
        this.saturnCrossRings.push(group);
    },
    
    // ── UPDATE ──
    update(delta, playerPos) {
        const zoneName = GameState.getCurrentZone().name;
        
        // Neptune swirl
        this.updateNeptuneSwirl(delta, zoneName === "Neptune", playerPos);
        
        // Uranus rotating rings (Swapped update logic)
        const uranusCollision = this.updateUranusRings(delta, playerPos);
        if (uranusCollision) return { type: 'hazard' };
        
        // Saturn crossing rings (Swapped update logic)
        const saturnCollision = this.updateSaturnCrossRings(delta, playerPos);
        if (saturnCollision) return { type: 'hazard' };
        
        return null;
    },
    
    updateNeptuneSwirl(delta, active, playerPos) {
        if (!this.neptuneSwirl) return;
        
        this.neptuneMat.opacity = active ? 0.5 : 
            Math.max(0, this.neptuneMat.opacity - delta * 0.5);
        
        if (active) {
            this.neptuneSwirl.position.z = playerPos.z;
            this.neptuneSwirl.position.x = playerPos.x * 0.3;
            this.neptuneSwirl.rotation.y += delta * 0.4;
            
            // Swirl particles
            const pos = this.neptuneGeo.attributes.position.array;
            const angle = delta * 0.3;
            for (let i = 0; i < pos.length / 3; i++) {
                const x = pos[i * 3];
                const z = pos[i * 3 + 2];
                pos[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
                pos[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
            }
            this.neptuneGeo.attributes.position.needsUpdate = true;
        }
    },
    
    updateUranusRings(delta, playerPos) {
        // SWAPPED: Uses Saturn update logic (side-to-side movement)
        let collision = false;
        
        for (let i = this.uranusRings.length - 1; i >= 0; i--) {
            const ring = this.uranusRings[i];
            
            // Side to side movement (Saturn style)
            ring.userData.time = (ring.userData.time || 0) + delta;
            ring.position.x = Math.sin(ring.userData.time * ring.userData.speed) * 8;
            ring.rotation.z += delta * 0.5;
            
            // Collision check
            ring.children.forEach(child => {
                const wp = new THREE.Vector3();
                child.getWorldPosition(wp);
                if (playerPos.distanceTo(wp) < 1.0) {
                    collision = true;
                }
            });
            
            // Cleanup
            if (ring.position.z > playerPos.z + 30) {
                this.scene.remove(ring);
                this.uranusRings.splice(i, 1);
            }
        }
        
        return collision;
    },
    
    updateSaturnCrossRings(delta, playerPos) {
        // SWAPPED: Uses Uranus update logic (rotation)
        let collision = false;
        
        for (let i = this.saturnCrossRings.length - 1; i >= 0; i--) {
            const ring = this.saturnCrossRings[i];
            
            // Randomized variable rotation
            let speed = ring.userData.rotSpeed || 1.5;
            
            // Apply speed variation to some rings for unpredictability
            if (ring.userData.varySpeed) {
                // Modulate speed by ±40% using sine wave
                speed *= (1 + Math.sin(Date.now() * 0.003 + ring.id) * 0.4);
            }
            
            ring.rotation.y += delta * speed;
            
            // Collision check
            ring.children.forEach(child => {
                const wp = new THREE.Vector3();
                child.getWorldPosition(wp);
                if (playerPos.distanceTo(wp) < 1.0) {
                    collision = true;
                }
            });
            
            // Cleanup
            if (ring.position.z > playerPos.z + 30) {
                this.scene.remove(ring);
                this.saturnCrossRings.splice(i, 1);
            }
        }
        
        return collision;
    },
    
    // Clear all zone-specific obstacles
    clear() {
        this.uranusRings.forEach(r => this.scene.remove(r));
        this.uranusRings = [];
        
        this.saturnCrossRings.forEach(r => this.scene.remove(r));
        this.saturnCrossRings = [];
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZoneManager };
}
