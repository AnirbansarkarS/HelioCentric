// ══════════════════════════════════════════════════════════════
//  OBSTACLES.JS — Obstacle Spawning & Management
// ══════════════════════════════════════════════════════════════

const Obstacles = {
    scene: null,
    obstacles: [],
    items: [],
    hazards: [],
    
    // ═══════════════════════════════════════════════════
    //  ADVANCED SPAWN ALGORITHM STATE
    // ═══════════════════════════════════════════════════
    patternHistory: [],       // last N safe-lane choices
    lastSafeLane: 0,          // -1, 0, or 1
    lastPatternType: '',      // 'single', 'double', 'corridor', 'gap', etc.
    rowsSinceCollectible: 0,
    rowsSinceHazard: 0,
    rowsSincePowerup: 0,
    comboCounter: 0,          // sequential rows with same safe lane
    
    // Constants for the algorithm
    MAX_PATTERN_MEMORY: 8,
    MAX_COMBO: 3,             // max consecutive same safe-lane
    
    // Initialize
    init(scene) {
        this.scene = scene;
        this.resetAlgorithm();
    },
    
    resetAlgorithm() {
        this.patternHistory = [];
        this.lastSafeLane = 0;
        this.lastPatternType = '';
        this.rowsSinceCollectible = 0;
        this.rowsSinceHazard = 0;
        this.rowsSincePowerup = 0;
        this.comboCounter = 0;
    },
    
    // ═══════════════════════════════════════════════════
    //  CORE ALGORITHM: spawnRow(z, zone, distance)
    // ═══════════════════════════════════════════════════
    spawnRow(z, zone, distance) {
        // ── 1. DIFFICULTY SCALING ──
        const difficulty = this.getDifficulty(distance);
        
        // ── 2. PICK SAFE LANE (anti-repeat) ──
        const safeLane = this.pickSafeLane();
        
        // ── 3. SELECT PATTERN TYPE ──
        const pattern = this.selectPattern(difficulty);
        
        // ── 4. EXECUTE PATTERN ──
        this.executePattern(pattern, safeLane, z, zone, difficulty);
        
        // ── 5. SPAWN COLLECTIBLES IF DUE ──
        this.maybeSpawnCollectibles(safeLane, z, difficulty);
        
        // ── 6. UPDATE HISTORY ──
        this.recordPattern(safeLane, pattern);
    },
    
    // ── DIFFICULTY CURVE ──
    // Returns 0.0 (trivial) to 1.0 (maximum) based on distance
    getDifficulty(distance) {
        // Smooth S-curve: ramps slowly at first, accelerates mid-game, plateaus late
        // Reaches ~0.5 at distance 4000 (Jupiter), ~0.85 at 8000 (Mercury)
        const t = distance / 10000;
        return Math.min(1.0, 3 * t * t - 2 * t * t * t); // smoothstep
    },
    
    // ── SAFE LANE PICKER (anti-repeat) ──
    pickSafeLane() {
        const lanes = [-1, 0, 1];
        
        // If we've used the same safe lane too many times, force a change
        if (this.comboCounter >= this.MAX_COMBO) {
            const alternatives = lanes.filter(l => l !== this.lastSafeLane);
            const pick = alternatives[Math.floor(Math.random() * alternatives.length)];
            this.comboCounter = 1;
            this.lastSafeLane = pick;
            return pick;
        }
        
        // Weight lanes: previous safe lane gets lower weight to encourage movement
        const weights = lanes.map(l => {
            if (l === this.lastSafeLane) return 0.25; // low chance to repeat
            // Adjacent lanes to last safe get higher weight (natural flow)
            if (Math.abs(l - this.lastSafeLane) === 1) return 0.5;
            return 0.25; // opposite lane
        });
        
        const totalW = weights.reduce((a, b) => a + b);
        let r = Math.random() * totalW;
        let pick = 0;
        for (let i = 0; i < lanes.length; i++) {
            r -= weights[i];
            if (r <= 0) { pick = lanes[i]; break; }
        }
        
        if (pick === this.lastSafeLane) {
            this.comboCounter++;
        } else {
            this.comboCounter = 1;
        }
        this.lastSafeLane = pick;
        return pick;
    },
    
    // ── PATTERN SELECTOR ──
    // Choose obstacle layout based on difficulty and history
    selectPattern(difficulty) {
        // Available patterns with minimum difficulty thresholds
        const patterns = [
            { name: 'single',    minDiff: 0.0,  weight: 3.0 },  // 1 obstacle
            { name: 'double',    minDiff: 0.1,  weight: 2.5 },  // 2 obstacles (1 safe lane)
            { name: 'stagger',   minDiff: 0.2,  weight: 2.0 },  // 2 obstacles offset in Z
            { name: 'corridor',  minDiff: 0.35, weight: 1.5 },  // 2 obstacles creating a corridor
            { name: 'gauntlet',  minDiff: 0.5,  weight: 1.0 },  // dense section w/ tight gap
            { name: 'hazardRow', minDiff: 0.4,  weight: 0.8 },  // includes a hazard
        ];
        
        // Filter by current difficulty and avoid immediate repeats
        const eligible = patterns.filter(p => {
            if (difficulty < p.minDiff) return false;
            if (p.name === this.lastPatternType && Math.random() < 0.7) return false;
            return true;
        });
        
        if (eligible.length === 0) return { name: 'single' };
        
        // Scale weights by how deep into difficulty we are past the threshold
        const scaled = eligible.map(p => ({
            ...p,
            w: p.weight * (1 + (difficulty - p.minDiff) * 2)
        }));
        
        const totalW = scaled.reduce((a, b) => a + b.w, 0);
        let r = Math.random() * totalW;
        for (const p of scaled) {
            r -= p.w;
            if (r <= 0) return p;
        }
        return scaled[scaled.length - 1];
    },
    
    // ── PATTERN EXECUTOR ──
    executePattern(pattern, safeLane, z, zone, difficulty) {
        const lanes = [-1, 0, 1];
        const dangerLanes = lanes.filter(l => l !== safeLane);
        const zoneName = zone.name;
        const zoneColor = zone.objColor;
        
        switch (pattern.name) {
            case 'single': {
                // One obstacle on a random danger lane
                const lane = dangerLanes[Math.floor(Math.random() * dangerLanes.length)];
                this.spawnZoneObstacle(zoneName, lane, z, zoneColor);
                break;
            }
            
            case 'double': {
                // Both danger lanes blocked — player must use safe lane
                dangerLanes.forEach(lane => {
                    this.spawnZoneObstacle(zoneName, lane, z, zoneColor);
                });
                break;
            }
            
            case 'stagger': {
                // Two obstacles on danger lanes, offset in Z for a weaving feel
                const first = dangerLanes[0];
                const second = dangerLanes[1];
                this.spawnZoneObstacle(zoneName, first, z, zoneColor);
                this.spawnZoneObstacle(zoneName, second, z - 6, zoneColor);
                break;
            }
            
            case 'corridor': {
                // Two obstacles creating a narrow corridor the player threads through
                dangerLanes.forEach(lane => {
                    this.spawnZoneObstacle(zoneName, lane, z, zoneColor);
                });
                // Add a trailing obstacle that closes behind
                if (difficulty > 0.5 && Math.random() < difficulty * 0.5) {
                    this.spawnZoneObstacle(zoneName, safeLane === 0 ? 
                        (Math.random() < 0.5 ? -1 : 1) : 0, z - 8, zoneColor);
                }
                break;
            }
            
            case 'gauntlet': {
                // Dense section: staggered obstacles across multiple Z steps
                const shuffled = [...lanes].sort(() => Math.random() - 0.5);
                // First wall
                dangerLanes.forEach(lane => {
                    this.spawnZoneObstacle(zoneName, lane, z, zoneColor);
                });
                // Second wall (different safe lane) offset back
                const secondSafe = dangerLanes[Math.floor(Math.random() * dangerLanes.length)];
                const secondDanger = lanes.filter(l => l !== secondSafe);
                secondDanger.forEach(lane => {
                    this.spawnZoneObstacle(zoneName, lane, z - 10, zoneColor);
                });
                // Place collectible in the threading path
                this.spawnCoin(secondSafe * CONFIG.LANE_WIDTH, z - 5);
                this.rowsSinceCollectible = 0;
                break;
            }
            
            case 'hazardRow': {
                // One hazard + one obstacle
                this.rowsSinceHazard = 0;
                const hazardLane = dangerLanes[Math.floor(Math.random() * dangerLanes.length)];
                const obstLane = dangerLanes.find(l => l !== hazardLane) ?? hazardLane;
                
                this.spawnZoneHazard(zoneName, hazardLane, z);
                if (obstLane !== hazardLane) {
                    this.spawnZoneObstacle(zoneName, obstLane, z, zoneColor);
                }
                break;
            }
        }
    },
    
    // ── COLLECTIBLE/POWERUP SCHEDULER ──
    maybeSpawnCollectibles(safeLane, z, difficulty) {
        this.rowsSinceCollectible++;
        this.rowsSinceHazard++;
        this.rowsSincePowerup++;
        
        // Guaranteed collectible every 2-4 rows (tighter at high difficulty)
        const collectibleInterval = Math.max(2, Math.floor(4 - difficulty * 1.5));
        
        if (this.rowsSinceCollectible >= collectibleInterval) {
            this.rowsSinceCollectible = 0;
            const zone = GameState.getCurrentZone();
            const zoneName = zone.name;
            const rand = Math.random();
            
            // ── TIER SPAWN BEHAVIORS ──
            
            // Planet Relic: super rare (~2% chance, only after difficulty 0.3)
            if (rand < 0.02 && difficulty > 0.3) {
                this.spawnPlanetRelic(safeLane * CONFIG.LANE_WIDTH, z - 3, zoneName);
            }
            // Solar Energy Cell: Mercury/Sun zones only (~8% chance there)
            else if (rand < 0.10 && (zoneName === 'Mercury' || zoneName === 'Sun')) {
                this.spawnSolarEnergyCell(safeLane * CONFIG.LANE_WIDTH, z - 3);
            }
            // Alien Tech Part: rare, spawn between obstacle lanes (guarded)
            else if (rand < 0.15 && difficulty > 0.2) {
                // Place on a danger lane (not safe lane) — player must weave to get it
                const lanes = [-1, 0, 1];
                const dangerLanes = lanes.filter(l => l !== safeLane);
                const guardLane = dangerLanes[Math.floor(Math.random() * dangerLanes.length)];
                this.spawnAlienTechPart(guardLane * CONFIG.LANE_WIDTH, z - 5);
            }
            // Dark Matter Shard: clusters of 2-3 at elevated Y
            else if (rand < 0.30 && difficulty > 0.15) {
                const clusterSize = 2 + (Math.random() < 0.3 ? 1 : 0);
                for (let c = 0; c < clusterSize; c++) {
                    const cx = safeLane * CONFIG.LANE_WIDTH + (Math.random() - 0.5) * 1.5;
                    this.spawnDarkMatterShard(cx, z - 3 - c * 2.5);
                }
            }
            // Comet Crystal: diagonal trail across lanes (3-5 crystals)
            else if (rand < 0.40) {
                const trailLen = 3 + Math.floor(Math.random() * 3); // 3-5
                const startLane = safeLane;
                const direction = (startLane <= 0) ? 1 : -1; // move towards open lanes
                for (let t = 0; t < trailLen; t++) {
                    const laneT = Math.max(-1, Math.min(1, startLane + direction * (t % 3 === 2 ? 1 : 0)));
                    const tx = (startLane + direction * Math.floor(t / 2) * 0.5);
                    const clampedX = Math.max(-1, Math.min(1, tx)) * CONFIG.LANE_WIDTH;
                    this.spawnCometCrystal(clampedX, z - 3 - t * 3);
                }
            }
            // Star Fragment: lines of 3-5 in safe lane (most common)
            else {
                const lineLen = 3 + Math.floor(Math.random() * 3); // 3-5
                for (let l = 0; l < lineLen; l++) {
                    this.spawnStarFragment(safeLane * CONFIG.LANE_WIDTH, z - 3 - l * 2);
                }
            }
        }
        
        // Powerups: rare, scaling slightly with difficulty (every 12-25 rows)
        const powerupInterval = Math.max(12, Math.floor(25 - difficulty * 10));
        if (this.rowsSincePowerup >= powerupInterval) {
            const powerups = ['shield', 'darkMatter', 'gravity', 'warp', 'magnet'];
            const type = powerups[Math.floor(Math.random() * powerups.length)];
            this.spawnPowerup(safeLane * CONFIG.LANE_WIDTH, z - 4, type);
            this.rowsSincePowerup = 0;
        }
    },
    
    // ── ZONE-THEMED OBSTACLE DISPATCH ──
    spawnZoneObstacle(zoneName, lane, z, fallbackColor) {
        switch (zoneName) {
            case 'Pluto':
                return this.spawnIcyAsteroid(lane, z, 0.9 + Math.random() * 0.5);
            case 'Neptune':
                return this.spawnStandardObstacle(lane, z, 0x2266ff);
            case 'Uranus':
                return this.spawnStandardObstacle(lane, z, 0x44dddd);
            case 'Saturn':
                return this.spawnStandardObstacle(lane, z, 0xddaa55);
            case 'Jupiter':
                return this.spawnStandardObstacle(lane, z, 0xffaa88, 1.0 + Math.random() * 0.4);
            case 'Mars':
                return this.spawnStandardObstacle(lane, z, 0xff3300);
            case 'Earth':
                return Math.random() < 0.5 ? 
                    this.spawnStandardObstacle(lane, z, 0x888888) :
                    this.spawnSatelliteDebris(lane, z);
            case 'Venus':
                return this.spawnStandardObstacle(lane, z, 0xffcc44);
            case 'Mercury':
                return this.spawnHeatRock(lane, z);
            case 'Sun':
                return this.spawnSolarDebris(lane, z);
            default:
                return this.spawnStandardObstacle(lane, z, fallbackColor);
        }
    },
    
    // ── ZONE-THEMED HAZARD DISPATCH ──
    spawnZoneHazard(zoneName, lane, z) {
        switch (zoneName) {
            case 'Venus':
                return Math.random() < 0.5 ? 
                    this.spawnAcidCloud(lane, z) : this.spawnHazard(lane, z);
            case 'Sun':
                return Math.random() < 0.5 ? 
                    this.spawnSolarFlareHazard(lane, z) : this.spawnHazard(lane, z);
            default:
                return this.spawnHazard(lane, z);
        }
    },
    
    // ── HISTORY TRACKING ──
    recordPattern(safeLane, pattern) {
        this.patternHistory.push({ safeLane, pattern: pattern.name });
        if (this.patternHistory.length > this.MAX_PATTERN_MEMORY) {
            this.patternHistory.shift();
        }
        this.lastPatternType = pattern.name;
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
    // Spawns across two adjacent lanes - deadly on both!
    spawnHazard(lane, z) {
        const group = new THREE.Group();
        
        // Determine which two lanes this black hole covers
        // If lane is -1 (left), covers -1 and 0
        // If lane is 0 (middle), covers 0 and random side (-1 or 1)
        // If lane is 1 (right), covers 0 and 1
        let lane1 = lane;
        let lane2 = (lane === -1) ? 0 : (lane === 1) ? 0 : (Math.random() < 0.5 ? -1 : 1);
        
        // Center position between the two lanes
        const centerX = (lane1 + lane2) * CONFIG.LANE_WIDTH / 2;
        
        // Event horizon - HUGE and flat (spanning 2 lanes)
        const coreGeo = new THREE.CircleGeometry(3.2, 32);
        const coreMat = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            side: THREE.DoubleSide
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.rotation.x = Math.PI / 2; // Lay flat on ground
        group.add(core);
        
        // Accretion disk - massive and flat
        const discGeo = new THREE.RingGeometry(3.3, 5.5, 32);
        const discMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.rotation.x = Math.PI / 2; // Flat on ground
        group.add(disc);
        
        // Inner glow ring - flat
        const ringGeo = new THREE.TorusGeometry(3.0, 0.2, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2; // Flat on ground
        group.add(ring);
        
        // Outer warning ring
        const warnRingGeo = new THREE.TorusGeometry(4.2, 0.15, 16, 32);
        const warnRingMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        const warnRing = new THREE.Mesh(warnRingGeo, warnRingMat);
        warnRing.rotation.x = Math.PI / 2;
        group.add(warnRing);
        
        // Glow sprite - massive
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 64;
        glowCanvas.height = 64;
        const ctx = glowCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 50, 0, 0.4)');
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
        glow.scale.set(11, 11, 1); // Massive glow
        group.add(glow);
        
        group.position.set(centerX, 0.05, z); // Very close to ground, centered between lanes
        group.userData.type = 'hazard';
        group.userData.disc = disc;
        group.userData.ring = ring;
        group.userData.warnRing = warnRing;
        group.userData.occupiedLanes = [lane1, lane2]; // Track both lanes
        
        this.scene.add(group);
        this.hazards.push(group);
        return group;
    },
    
    // ── COLLECTIBLE DISPATCHER ──
    // Picks a collectible tier based on rarity weights, zone, and difficulty
    spawnCoin(x, z, forceType) {
        if (forceType) {
            return this._spawnCollectibleByType(forceType, x, z);
        }
        
        // Build weighted pool based on zone
        const zone = GameState.getCurrentZone();
        const zoneName = zone.name;
        const tiers = CONFIG.COLLECTIBLES;
        const pool = [];
        
        for (const [key, tier] of Object.entries(tiers)) {
            // Solar Energy Cells only in Mercury/Sun
            if (key === 'solarEnergyCell' && zoneName !== 'Mercury' && zoneName !== 'Sun') continue;
            // Planet Relics are spawned separately via dedicated logic
            if (key === 'planetRelic') continue;
            pool.push({ type: key, weight: tier.rarity });
        }
        
        // Weighted random pick
        const totalW = pool.reduce((s, p) => s + p.weight, 0);
        let r = Math.random() * totalW;
        let picked = pool[0].type;
        for (const p of pool) {
            r -= p.weight;
            if (r <= 0) { picked = p.type; break; }
        }
        
        return this._spawnCollectibleByType(picked, x, z);
    },
    
    _spawnCollectibleByType(type, x, z) {
        switch (type) {
            case 'starFragment':    return this.spawnStarFragment(x, z);
            case 'darkMatterShard': return this.spawnDarkMatterShard(x, z);
            case 'cometCrystal':    return this.spawnCometCrystal(x, z);
            case 'alienTechPart':   return this.spawnAlienTechPart(x, z);
            case 'solarEnergyCell': return this.spawnSolarEnergyCell(x, z);
            case 'planetRelic':     return this.spawnPlanetRelic(x, z);
            default:                return this.spawnStarFragment(x, z);
        }
    },

    // ═══════════════════════════════════════════════════════
    //  TIER 1 — STAR FRAGMENT  ⭐  (+1 coin, common)
    // ═══════════════════════════════════════════════════════
    spawnStarFragment(x, z) {
        const group = new THREE.Group();
        
        // 5-pointed star shape using extruded shape
        const starShape = new THREE.Shape();
        const outerR = 0.35, innerR = 0.15, points = 5;
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) starShape.moveTo(px, py);
            else starShape.lineTo(px, py);
        }
        starShape.closePath();
        
        const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 };
        const geo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xffdd44,
            emissive: 0x886611,
            shininess: 100
        });
        const star = new THREE.Mesh(geo, mat);
        star.rotation.x = Math.PI / 2;
        group.add(star);
        
        // Sparkle glow
        const sparkleGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const sparkleMat = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.6
        });
        const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
        sparkle.position.set(0.2, 0.2, 0);
        group.add(sparkle);
        
        group.position.set(x, 1.2, z);
        group.userData = {
            type: 'starFragment',
            isCollectible: true,
            coinValue: CONFIG.COLLECTIBLES.starFragment.coinValue,
            scoreValue: CONFIG.COLLECTIBLES.starFragment.scoreValue,
            baseY: 1.2
        };
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ═══════════════════════════════════════════════════════
    //  TIER 2 — DARK MATTER SHARD  🟣  (+5 coins, rare clusters)
    // ═══════════════════════════════════════════════════════
    spawnDarkMatterShard(x, z) {
        const group = new THREE.Group();
        
        // Dark crystalline core
        const geo = new THREE.OctahedronGeometry(0.4);
        const mat = new THREE.MeshPhongMaterial({
            color: 0x6611cc,
            emissive: 0x330066,
            flatShading: true,
            shininess: 120,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(geo, mat);
        group.add(core);
        
        // Distortion halo (dark purple glow)
        const haloGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x8833ff,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        group.add(halo);
        
        // Orbiting particle ring
        const ringGeo = new THREE.RingGeometry(0.55, 0.65, 16);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xaa44ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI * 0.3;
        group.add(ring);
        group.userData.ring = ring;
        
        group.position.set(x, 2.5, z); // Above normal jump height
        group.userData.type = 'darkMatterShard';
        group.userData.isCollectible = true;
        group.userData.coinValue = CONFIG.COLLECTIBLES.darkMatterShard.coinValue;
        group.userData.scoreValue = CONFIG.COLLECTIBLES.darkMatterShard.scoreValue;
        group.userData.baseY = 2.5;
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ═══════════════════════════════════════════════════════
    //  TIER 3 — COMET CRYSTAL  🌠  (+3 coins, diagonal trails)
    // ═══════════════════════════════════════════════════════
    spawnCometCrystal(x, z) {
        const group = new THREE.Group();
        
        // Icy blue crystal
        const geo = new THREE.TetrahedronGeometry(0.35);
        const mat = new THREE.MeshPhongMaterial({
            color: 0x66ccff,
            emissive: 0x1155aa,
            shininess: 150,
            transparent: true,
            opacity: 0.85
        });
        const crystal = new THREE.Mesh(geo, mat);
        group.add(crystal);
        
        // Comet tail (trailing particles)
        const tailGeo = new THREE.ConeGeometry(0.15, 0.8, 8);
        const tailMat = new THREE.MeshBasicMaterial({
            color: 0x88ddff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.position.set(0, 0, 0.5);
        tail.rotation.x = -Math.PI / 2;
        group.add(tail);
        
        // Outer glow
        const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);
        
        group.position.set(x, 1.2, z);
        group.userData = {
            type: 'cometCrystal',
            isCollectible: true,
            coinValue: CONFIG.COLLECTIBLES.cometCrystal.coinValue,
            scoreValue: CONFIG.COLLECTIBLES.cometCrystal.scoreValue,
            baseY: 1.2
        };
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ═══════════════════════════════════════════════════════
    //  TIER 4 — ALIEN TECH PART  🛸  (+10 coins, rare, obstacle-guarded)
    // ═══════════════════════════════════════════════════════
    spawnAlienTechPart(x, z) {
        const group = new THREE.Group();
        
        // Metallic rotating fragment (complex shape)
        const geo = new THREE.DodecahedronGeometry(0.45);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xbbbbcc,
            emissive: 0x334455,
            metalness: 0.8,
            flatShading: true,
            shininess: 200
        });
        const part = new THREE.Mesh(geo, mat);
        group.add(part);
        
        // Tech glow lines (wireframe overlay)
        const wireGeo = new THREE.DodecahedronGeometry(0.48);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x00ffaa,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        group.add(wire);
        
        // Scanning beam ring
        const ringGeo = new THREE.TorusGeometry(0.6, 0.04, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        group.userData.ring = ring;
        
        group.position.set(x, 1.4, z);
        group.userData.type = 'alienTechPart';
        group.userData.isCollectible = true;
        group.userData.coinValue = CONFIG.COLLECTIBLES.alienTechPart.coinValue;
        group.userData.scoreValue = CONFIG.COLLECTIBLES.alienTechPart.scoreValue;
        group.userData.baseY = 1.4;
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ═══════════════════════════════════════════════════════
    //  TIER 5 — SOLAR ENERGY CELL  ☀️  (+15 coins, Mercury/Sun only)
    // ═══════════════════════════════════════════════════════
    spawnSolarEnergyCell(x, z) {
        const group = new THREE.Group();
        
        // Golden hexagonal cell
        const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.15, 6);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xffcc00,
            emissive: 0xaa6600,
            shininess: 150
        });
        const cell = new THREE.Mesh(geo, mat);
        cell.rotation.x = Math.PI / 2;
        group.add(cell);
        
        // Solar corona aura
        const auraGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        group.add(aura);
        
        // Pulsing ring
        const ringGeo = new THREE.TorusGeometry(0.55, 0.06, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        group.userData.ring = ring;
        
        group.position.set(x, 1.5, z);
        group.userData.type = 'solarEnergyCell';
        group.userData.isCollectible = true;
        group.userData.coinValue = CONFIG.COLLECTIBLES.solarEnergyCell.coinValue;
        group.userData.scoreValue = CONFIG.COLLECTIBLES.solarEnergyCell.scoreValue;
        group.userData.baseY = 1.5;
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ═══════════════════════════════════════════════════════
    //  TIER 6 — PLANET RELIC  🪐  (+50 coins, super rare, unique per planet)
    // ═══════════════════════════════════════════════════════
    spawnPlanetRelic(x, z, zoneName) {
        const group = new THREE.Group();
        
        // Unique color per planet
        const relicColors = {
            Pluto:    { color: 0xaaccff, emissive: 0x335577 },
            Neptune:  { color: 0x2266ff, emissive: 0x112266 },
            Uranus:   { color: 0x44ffdd, emissive: 0x116655 },
            Saturn:   { color: 0xddaa55, emissive: 0x665522 },
            Jupiter:  { color: 0xff8844, emissive: 0x884422 },
            Mars:     { color: 0xff3300, emissive: 0x881100 },
            Earth:    { color: 0x0088ff, emissive: 0x004488 },
            Venus:    { color: 0xffcc44, emissive: 0x886622 },
            Mercury:  { color: 0xff6622, emissive: 0x883311 },
            Sun:      { color: 0xffff00, emissive: 0xaa8800 }
        };
        
        const name = zoneName || GameState.getCurrentZone().name;
        const palette = relicColors[name] || { color: 0xffffff, emissive: 0x888888 };
        
        // Ornate sphere with engraved rings
        const coreGeo = new THREE.IcosahedronGeometry(0.5, 2);
        const coreMat = new THREE.MeshPhongMaterial({
            color: palette.color,
            emissive: palette.emissive,
            shininess: 200,
            flatShading: true
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);
        
        // Double orbital rings
        for (let i = 0; i < 2; i++) {
            const rGeo = new THREE.TorusGeometry(0.7 + i * 0.15, 0.03, 8, 32);
            const rMat = new THREE.MeshBasicMaterial({
                color: palette.color,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(rGeo, rMat);
            ring.rotation.x = Math.PI / 2 + i * 0.8;
            ring.rotation.y = i * 1.2;
            group.add(ring);
        }
        
        // Grand aura
        const auraGeo = new THREE.SphereGeometry(1.0, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
            color: palette.color,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        group.add(aura);
        
        group.position.set(x, 1.8, z);
        group.userData = {
            type: 'planetRelic',
            isCollectible: true,
            coinValue: CONFIG.COLLECTIBLES.planetRelic.coinValue,
            scoreValue: CONFIG.COLLECTIBLES.planetRelic.scoreValue,
            baseY: 1.8,
            planetName: name
        };
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },

    // ── POWER-UP ──
    spawnPowerup(x, z, powerupType) {
        const group = new THREE.Group();
        
        // Special handling for WARP - create a door/portal shape
        if (powerupType === 'warp') {
            return this.spawnWarpPortal(x, z);
        }
        
        // Base diamond shape for other powerups
        const geo = new THREE.DodecahedronGeometry(0.6);
        
        let color, emissive;
        switch(powerupType) {
            case 'shield': color = 0x44ff44; emissive = 0x11aa11; break; // Green for extra life
            case 'darkMatter': color = 0x8800ff; emissive = 0x4400aa; break; // Purple for speed+invincibility
            case 'gravity': color = 0x44ffff; emissive = 0x11aaaa; break;
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
        
        // Shield gets a heart/plus symbol overlay
        if (powerupType === 'shield') {
            const plusGeo = new THREE.BoxGeometry(0.15, 0.5, 0.1);
            const plusMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const plusV = new THREE.Mesh(plusGeo, plusMat);
            const plusH = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.1), plusMat);
            group.add(plusV);
            group.add(plusH);
        }
        
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
        group.userData.baseY = 1.5;
        
        this.scene.add(group);
        this.items.push(group);
        return group;
    },
    
    // ── WARP PORTAL (Door shape - 90 degrees to lane plane) ──
    spawnWarpPortal(x, z) {
        const group = new THREE.Group();
        
        // Door frame - vertical rectangle
        const frameGeo = new THREE.BoxGeometry(2.5, 3.5, 0.15);
        const frameMat = new THREE.MeshPhongMaterial({
            color: 0xff44aa,
            emissive: 0x661133,
            shininess: 100
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 1.75;
        group.add(frame);
        
        // Inner portal surface (swirling effect)
        const portalGeo = new THREE.PlaneGeometry(2.2, 3.2);
        const portalMat = new THREE.MeshBasicMaterial({
            color: 0xaa00ff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        portal.position.y = 1.75;
        portal.position.z = 0.01;
        group.add(portal);
        group.userData.portal = portal;
        
        // Swirl rings inside portal
        for (let i = 0; i < 3; i++) {
            const swirlGeo = new THREE.TorusGeometry(0.4 + i * 0.35, 0.08, 8, 24);
            const swirlMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0xff66cc : 0xcc44ff,
                transparent: true,
                opacity: 0.6
            });
            const swirl = new THREE.Mesh(swirlGeo, swirlMat);
            swirl.position.y = 1.75;
            swirl.position.z = 0.02;
            swirl.userData.swirlSpeed = (i + 1) * 2;
            swirl.userData.isSwirl = true;
            group.add(swirl);
        }
        
        // Glow aura around portal
        const glowGeo = new THREE.PlaneGeometry(3.2, 4.2);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 1.75;
        glow.position.z = -0.02;
        group.add(glow);
        
        // Edge particles
        const particleCount = 30;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            particlePos[i * 3] = Math.cos(angle) * 1.3;
            particlePos[i * 3 + 1] = 1.75 + Math.sin(angle) * 1.6;
            particlePos[i * 3 + 2] = 0;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xff88ff,
            size: 0.15,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        group.add(particles);
        group.userData.particles = particles;
        
        group.position.set(x, 0, z);
        // Standing upright, facing the player (portal perpendicular to lane)
        group.rotation.y = 0; // Facing -Z direction (towards player)
        
        group.userData.type = 'powerup';
        group.userData.powerupType = 'warp';
        group.userData.isCollectible = true;
        group.userData.isWarpPortal = true;
        group.userData.baseY = 0;
        
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
            if (haz.userData.warnRing) {
                haz.userData.warnRing.rotation.z += delta * 4;
            }
            
            // Collision detection - check if player is in one of the occupied lanes
            if (haz.userData.occupiedLanes) {
                // Get player's current lane based on X position
                const playerLane = Math.round(playerPos.x / CONFIG.LANE_WIDTH);
                const zDistance = Math.abs(haz.position.z - playerPos.z);
                
                // If player is in one of the black hole's lanes and close in Z
                if (haz.userData.occupiedLanes.includes(playerLane) && zDistance < 3) {
                    this.scene.remove(haz);
                    this.hazards.splice(i, 1);
                    return { type: 'hazard' };
                }
            } else {
                // Fallback for old-style hazards
                if (this.checkCollision(haz, playerPos, 1.8)) {
                    this.scene.remove(haz);
                    this.hazards.splice(i, 1);
                    return { type: 'hazard' };
                }
            }
            
            // Cleanup
            if (haz.position.z > playerPos.z + 30) {
                this.scene.remove(haz);
                this.hazards.splice(i, 1);
            }
        }
        
        // Update collectibles & powerups
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.rotation.y += delta * 3;
            
            // Powerup ring spin
            if (item.userData.ring) {
                item.userData.ring.rotation.z += delta * 4;
            }
            
            // Warp portal special animations
            if (item.userData.isWarpPortal) {
                // Don't rotate the whole portal, just the inner swirl rings
                item.rotation.y = 0; // Keep portal facing player
                
                // Animate swirl rings inside the portal
                item.children.forEach(child => {
                    if (child.userData && child.userData.isSwirl) {
                        child.rotation.z += delta * child.userData.swirlSpeed;
                    }
                });
                
                // Pulsing portal glow
                if (item.userData.portal) {
                    item.userData.portal.material.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.25;
                }
                
                // Rotate edge particles
                if (item.userData.particles) {
                    item.userData.particles.rotation.z += delta * 2;
                }
            }
            
            // Bobbing animation (skip for warp portal which is grounded)
            if (!item.userData.isWarpPortal) {
                item.position.y = item.userData.baseY + Math.sin(Date.now() * 0.003 + i) * 0.15;
            }
            
            // MAGNET FIELD: Attract all collectibles towards player
            if (GameState.magnetTimer > 0 && item.userData.isCollectible) {
                const attractionSpeed = 12; // units per second
                const dir = new THREE.Vector3(
                    playerPos.x - item.position.x,
                    playerPos.y - item.position.y,
                    playerPos.z - item.position.z
                );
                const distance = dir.length();
                
                // Only attract items that are close enough (within visual range)
                if (distance < 25 && distance > 0.1) {
                    dir.normalize();
                    item.position.x += dir.x * attractionSpeed * delta;
                    item.position.y += dir.y * attractionSpeed * delta;
                    item.position.z += dir.z * attractionSpeed * delta;
                }
            }
            
            // Collection detection
            if (this.checkCollision(item, playerPos, 1.2)) {
                const result = {
                    type: item.userData.type,
                    isCollectible: item.userData.isCollectible || false,
                    powerupType: item.userData.powerupType || null,
                    coinValue: item.userData.coinValue || 0,
                    scoreValue: item.userData.scoreValue || 0
                };
                this.scene.remove(item);
                this.items.splice(i, 1);
                return result;
            }
            
            // Cleanup
            if (item.position.z > playerPos.z + 30) {
                this.scene.remove(item);
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
        
        this.resetAlgorithm();
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Obstacles };
}
