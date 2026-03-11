// ══════════════════════════════════════════════════════════════
//  OBSTACLES.JS — Obstacle Spawning & Management
// ══════════════════════════════════════════════════════════════

const Obstacles = {
    scene: null,
    obstacles: [],
    items: [],
    hazards: [],
    
    // Initialize
    init(scene) {
        this.scene = scene;
    },
    
    // ── ASTEROID GEOMETRY GENERATOR ──
    createAsteroidGeo(size = 0.8) {
        const geo = new THREE.IcosahedronGeometry(size, 1);
        const pos = geo.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            const offset = 0.15 + Math.random() * 0.15;
            pos[i] *= 1 + offset;
            pos[i + 1] *= 1 + (Math.random() - 0.5) * 0.3;
            pos[i + 2] *= 1 + offset;
        }
        geo.computeVertexNormals();
        return geo;
    },
    
    // ── STANDARD OBSTACLE (Procedural Asteroid) ──
    spawnStandardObstacle(lane, z, color = 0x888888, scale = 0.8) {
        const group = new THREE.Group();
        
        // Main body
        const geo = this.createAsteroidGeo(scale);
        const mat = new THREE.MeshPhongMaterial({
            color: color,
            flatShading: true
        });
        const main = new THREE.Mesh(geo, mat);
        group.add(main);
        
        // Add smaller rocks
        const rockCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < rockCount; i++) {
            const rGeo = this.createAsteroidGeo(0.2 + Math.random() * 0.2);
            const rMat = new THREE.MeshPhongMaterial({
                color: new THREE.Color(color).multiplyScalar(0.8 + Math.random() * 0.4),
                flatShading: true
            });
            const rock = new THREE.Mesh(rGeo, rMat);
            rock.position.set(
                (Math.random() - 0.5) * scale * 1.5,
                (Math.random() - 0.5) * scale * 1.5,
                (Math.random() - 0.5) * scale * 1.5
            );
            group.add(rock);
        }
        
        group.position.set(lane * CONFIG.LANE_WIDTH, 0.5, z);
        group.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            0
        );
        group.userData.type = 'obstacle';
        group.userData.rotSpeed = {
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5
        };
        
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    },
    
    // ── ICY ASTEROID (Pluto) ──
    spawnIcyAsteroid(lane, z, scale = 1.0) {
        const group = new THREE.Group();
        
        // Core rock
        const geo = this.createAsteroidGeo(scale * 0.8);
        const mat = new THREE.MeshPhongMaterial({
            color: 0x8899cc,
            flatShading: true
        });
        const core = new THREE.Mesh(geo, mat);
        group.add(core);
        
        // Ice crystals
        const crystalCount = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < crystalCount; i++) {
            const cGeo = new THREE.OctahedronGeometry(0.15 + Math.random() * 0.15);
            const cMat = new THREE.MeshPhongMaterial({
                color: 0xaaccff,
                transparent: true,
                opacity: 0.7,
                shininess: 100
            });
            const crystal = new THREE.Mesh(cGeo, cMat);
            const angle = (i / crystalCount) * Math.PI * 2;
            const dist = scale * 0.7;
            crystal.position.set(
                Math.cos(angle) * dist,
                (Math.random() - 0.5) * scale,
                Math.sin(angle) * dist
            );
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                0
            );
            group.add(crystal);
        }
        
        group.position.set(lane * CONFIG.LANE_WIDTH, 0.5, z);
        group.userData.type = 'obstacle';
        group.userData.rotSpeed = {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.3
        };
        
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    },
    
    // ── HAZARD (Black Hole) ──
    spawnHazard(lane, z) {
        const group = new THREE.Group();
        
        // Event horizon
        const coreGeo = new THREE.SphereGeometry(0.6, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);
        
        // Accretion disk
        const discGeo = new THREE.RingGeometry(0.8, 2.0, 32);
        const discMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.rotation.x = Math.PI / 2 + 0.3;
        group.add(disc);
        
        // Inner glow ring
        const ringGeo = new THREE.TorusGeometry(0.7, 0.1, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 + 0.3;
        group.add(ring);
        
        // Glow sprite
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 64;
        glowCanvas.height = 64;
        const ctx = glowCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const glowTex = new THREE.CanvasTexture(glowCanvas);
        const glowMat = new THREE.SpriteMaterial({
            map: glowTex,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.7
        });
        const glow = new THREE.Sprite(glowMat);
        glow.scale.set(4, 4, 1);
        group.add(glow);
        
        group.position.set(lane * CONFIG.LANE_WIDTH, 0.5, z);
        group.userData.type = 'hazard';
        group.userData.disc = disc;
        group.userData.ring = ring;
        
        this.scene.add(group);
        this.hazards.push(group);
        return group;
    },
    
    // ── OLD ALIAS FOR ZONE SPAWNER ──
    spawnCoin(x, z) {
        // Randomly pick a collectible or powerup
        const rand = Math.random();
        if (rand < 0.05) { // 5% chance for a powerup
            const powerups = ['shield', 'darkMatter', 'gravity', 'warp', 'magnet'];
            const type = powerups[Math.floor(Math.random() * powerups.length)];
            return this.spawnPowerup(x, z, type);
        } else if (rand < 0.15) { // 10% chance for an alien artifact
            return this.spawnAlienArtifact(x, z);
        } else if (rand < 0.40) { // 25% chance for an energy orb
            return this.spawnEnergyOrb(x, z);
        } else { // 60% chance for a star fragment
            return this.spawnStarFragment(x, z);
        }
    },

    // ── STAR FRAGMENT (formerly Coin) ──
    spawnStarFragment(x, z) {
        const group = new THREE.Group();
        
        const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xffdd44,
            emissive: 0x553300,
            shininess: 80
        });
        const coin = new THREE.Mesh(geo, mat);
        coin.rotation.z = Math.PI / 2;
        group.add(coin);
        
        // Sparkle
        const sparkleGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const sparkleMat = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.7
        });
        const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
        sparkle.position.set(0.15, 0.15, 0);
        group.add(sparkle);
        
        group.position.set(x, 1.2, z);
        group.userData.type = 'starFragment';
        group.userData.isCollectible = true;
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ── ENERGY ORB ──
    spawnEnergyOrb(x, z) {
        const group = new THREE.Group();
        
        const geo = new THREE.SphereGeometry(0.5, 16, 16);
        const mat = new THREE.MeshPhongMaterial({
            color: 0x44ffaa,
            emissive: 0x11aa55,
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });
        const orb = new THREE.Mesh(geo, mat);
        group.add(orb);
        
        const haloGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x88ffcc,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        group.add(halo);

        group.position.set(x, 1.2, z);
        group.userData.type = 'energyOrb';
        group.userData.isCollectible = true;
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ── ALIEN ARTIFACT ──
    spawnAlienArtifact(x, z) {
        const group = new THREE.Group();
        
        const geo = new THREE.OctahedronGeometry(0.5);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xcc44ff,
            emissive: 0x441188,
            flatShading: true,
            shininess: 90
        });
        const artifact = new THREE.Mesh(geo, mat);
        group.add(artifact);
        
        group.position.set(x, 1.2, z);
        group.userData.type = 'alienArtifact';
        group.userData.isCollectible = true;
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ── POWER-UP ──
    spawnPowerup(x, z, powerupType) {
        const group = new THREE.Group();
        
        // Base diamond shape
        const geo = new THREE.DodecahedronGeometry(0.6);
        
        let color, emissive;
        switch(powerupType) {
            case 'shield': color = 0x4488ff; emissive = 0x1133aa; break;
            case 'darkMatter': color = 0x110033; emissive = 0x330066; break;
            case 'gravity': color = 0x44ff44; emissive = 0x11aa11; break;
            case 'warp': color = 0xff44aa; emissive = 0xaa1166; break;
            case 'magnet': color = 0xff4444; emissive = 0xaa1111; break;
            default: color = 0xffffff; emissive = 0xaaaaaa;
        }

        const mat = new THREE.MeshPhongMaterial({
            color: color,
            emissive: emissive,
            flatShading: true,
            shininess: 100
        });
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);
        
        // Inner spinning ring
        const ringGeo = new THREE.RingGeometry(0.8, 0.9, 16);
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        group.userData.ring = ring;

        group.position.set(x, 1.5, z);
        group.userData.type = 'powerup';
        group.userData.powerupType = powerupType;
        group.userData.isCollectible = true;
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },
    
    // ── SATELLITE DEBRIS (Earth) ──
    spawnSatelliteDebris(lane, z) {
        const group = new THREE.Group();
        
        // Main body
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.5, 0.3);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0xaaaaaa,
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Solar panels
        const panelGeo = new THREE.BoxGeometry(1.5, 0.05, 0.5);
        const panelMat = new THREE.MeshPhongMaterial({
            color: 0x2244aa,
            flatShading: true
        });
        const leftPanel = new THREE.Mesh(panelGeo, panelMat);
        leftPanel.position.x = -1.1;
        group.add(leftPanel);
        
        const rightPanel = new THREE.Mesh(panelGeo, panelMat);
        rightPanel.position.x = 1.1;
        group.add(rightPanel);
        
        // Broken antenna
        const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
        const antennaMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.y = 0.4;
        antenna.rotation.z = 0.5;
        group.add(antenna);
        
        group.position.set(lane * CONFIG.LANE_WIDTH, 0.5, z);
        group.rotation.set(
            Math.random() * 0.5,
            Math.random() * Math.PI,
            Math.random() * 0.5
        );
        group.userData.type = 'obstacle';
        group.userData.rotSpeed = {
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.3
        };
        
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    },
    
    // ── ACID CLOUD (Venus) ──
    spawnAcidCloud(lane, z) {
        const group = new THREE.Group();
        
        // Cloud particles
        const count = 50;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 3;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
            sizes[i] = 0.3 + Math.random() * 0.4;
        }
        
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const mat = new THREE.PointsMaterial({
            color: 0xaaff44,
            size: 0.5,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const cloud = new THREE.Points(geo, mat);
        group.add(cloud);
        
        // Glow sphere
        const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xccff66,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);
        
        group.position.set(lane * CONFIG.LANE_WIDTH, 0.5, z);
        group.userData.type = 'hazard';
        group.userData.cloud = cloud;
        
        this.scene.add(group);
        this.hazards.push(group);
        return group;
    },
    
    // ── HEAT ROCK (Mercury) ──
    spawnHeatRock(lane, z) {
        const group = new THREE.Group();
        
        // Core rock
        const geo = this.createAsteroidGeo(0.8);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xff4400,
            emissive: 0x883300,
            flatShading: true
        });
        const rock = new THREE.Mesh(geo, mat);
        group.add(rock);
        
        // Heat glow
        const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);
        
        // Heat distortion particles
        const heatCount = 20;
        const heatGeo = new THREE.BufferGeometry();
        const heatPos = new Float32Array(heatCount * 3);
        
        for (let i = 0; i < heatCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            heatPos[i * 3] = Math.cos(angle) * 0.8;
            heatPos[i * 3 + 1] = Math.random() * 2;
            heatPos[i * 3 + 2] = Math.sin(angle) * 0.8;
        }
        
        heatGeo.setAttribute('position', new THREE.BufferAttribute(heatPos, 3));
        
        const heatMat = new THREE.PointsMaterial({
            color: 0xffaa44,
            size: 0.15,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const heat = new THREE.Points(heatGeo, heatMat);
        heat.userData.isHeat = true;
        group.add(heat);
        
        group.position.set(lane * CONFIG.LANE_WIDTH, 0.5, z);
        group.userData.type = 'obstacle';
        group.userData.isHeatRock = true;
        group.userData.glow = glow;
        group.userData.rotSpeed = {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.3
        };
        
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    },
    
    // ── SOLAR DEBRIS (Sun) ──
    spawnSolarDebris(lane, z) {
        const group = new THREE.Group();
        
        // Molten core
        const geo = this.createAsteroidGeo(0.7);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffff00
        });
        const core = new THREE.Mesh(geo, mat);
        group.add(core);
        
        // Intense glow
        const glowGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);
        
        group.position.set(lane * CONFIG.LANE_WIDTH, 0.5, z);
        group.userData.type = 'obstacle';
        group.userData.rotSpeed = {
            x: (Math.random() - 0.5) * 0.6,
            y: (Math.random() - 0.5) * 0.6
        };
        
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    },
    
    // ── SOLAR FLARE HAZARD (Sun) ──
    spawnSolarFlareHazard(lane, z) {
        const group = new THREE.Group();
        
        // Flare line
        const points = [];
        for (let i = 0; i < 10; i++) {
            points.push(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                i * 0.5,
                (Math.random() - 0.5) * 0.5
            ));
        }
        
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);
        
        // Glow
        const glowGeo = new THREE.SphereGeometry(2, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);
        
        group.position.set(lane * CONFIG.LANE_WIDTH, -1, z);
        group.userData.type = 'hazard';
        
        this.scene.add(group);
        this.hazards.push(group);
        return group;
    },
    
    // ── UPDATE ──
    update(delta, playerPos) {
        // Update regular obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            
            // Rotation
            if (obs.userData.rotSpeed) {
                obs.rotation.x += obs.userData.rotSpeed.x * delta;
                obs.rotation.y += obs.userData.rotSpeed.y * delta;
            }
            
            // Heat rock effects
            if (obs.userData.isHeatRock && obs.userData.glow) {
                obs.userData.glow.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.15;
            }
            
            // Collision detection
            if (this.checkCollision(obs, playerPos)) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
                return { type: 'obstacle' };
            }
            
            // Cleanup
            if (obs.position.z > playerPos.z + 30) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
            }
        }
        
        // Update hazards
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const haz = this.hazards[i];
            
            // Rotate accretion disk
            if (haz.userData.disc) {
                haz.userData.disc.rotation.z += delta * 2;
            }
            if (haz.userData.ring) {
                haz.userData.ring.rotation.z -= delta * 3;
            }
            
            // Collision detection
            if (this.checkCollision(haz, playerPos, 1.0)) {
                this.scene.remove(haz);
                this.hazards.splice(i, 1);
                return { type: 'hazard' };
            }
            
            // Cleanup
            if (haz.position.z > playerPos.z + 30) {
                this.scene.remove(haz);
                this.hazards.splice(i, 1);
            }
        }
        
        // Update coins
        for (let i = this.items.length - 1; i >= 0; i--) {
            const coin = this.items[i];
            coin.rotation.y += delta * 3;
            
            // Collection detection
            if (this.checkCollision(coin, playerPos, 1.2)) {
                this.scene.remove(coin);
                this.items.splice(i, 1);
                return { type: 'coin' };
            }
            
            // Cleanup
            if (coin.position.z > playerPos.z + 30) {
                this.scene.remove(coin);
                this.items.splice(i, 1);
            }
        }
        
        return null;
    },
    
    // Collision helper
    checkCollision(obj, playerPos, radius = 0.8) {
        const dist = new THREE.Vector3(
            obj.position.x - playerPos.x,
            obj.position.y - playerPos.y,
            obj.position.z - playerPos.z
        ).length();
        return dist < radius + 0.5;
    },
    
    // Clear all
    clear() {
        this.obstacles.forEach(o => this.scene.remove(o));
        this.obstacles = [];
        
        this.hazards.forEach(h => this.scene.remove(h));
        this.hazards = [];
        
        this.items.forEach(c => this.scene.remove(c));
        this.items = [];
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Obstacles };
}
