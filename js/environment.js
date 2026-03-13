// ══════════════════════════════════════════════════════════════
//  ENVIRONMENT.JS — Dynamic Space Environment
// ══════════════════════════════════════════════════════════════

const Environment = {
    scene: null,
    
    // Components
    stars: null,
    starsGeo: null,
    
    nebulae: [],
    nebulaParticles: null,
    
    distantPlanets: [],
    planetGroup: null,
    
    asteroidBelts: [],
    
    ambientParticles: null,
    ambientParticlePositions: null,
    
    gridHelper: null,
    ambientLight: null,
    dirLight: null,
    
    // Zone-specific effects
    venusAtmosphere: null,
    mercuryHeatGlow: null,
    solarFlares: [],
    sunCorona: null,
    
    // Initialize environment
    init(scene) {
        this.scene = scene;
        
        this.createStarfield();
        this.createNebulae();
        this.createDistantPlanets();
        this.createAsteroidBelts();
        this.createAmbientParticles();
        this.createGrid();
        this.createLighting();
        this.createZoneEffects();
    },
    
    // ── STARFIELD ──
    createStarfield() {
        this.starsGeo = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
            positions.push(
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 500
            );
            
            // Varying star colors (white, blue-white, yellow)
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                colors.push(1, 1, 1); // White
            } else if (colorChoice < 0.85) {
                colors.push(0.8, 0.9, 1); // Blue-white
            } else {
                colors.push(1, 0.95, 0.8); // Yellow
            }
        }
        
        this.starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const starsMat = new THREE.PointsMaterial({ 
            size: 0.3, 
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });
        
        this.stars = new THREE.Points(this.starsGeo, starsMat);
        this.scene.add(this.stars);
    },
    
    // ── NEBULAE ──
    createNebulae() {
        // Create multiple nebula clouds at different positions
        const nebulaColors = [0xff4488, 0x4488ff, 0x88ff44, 0xff8844, 0x8844ff];
        
        for (let n = 0; n < 5; n++) {
            const geo = new THREE.BufferGeometry();
            const positions = [];
            const count = 200;
            
            const centerX = (Math.random() - 0.5) * 300;
            const centerY = (Math.random() - 0.5) * 100 + 50;
            const centerZ = -n * 2000 - 500;
            
            for (let i = 0; i < count; i++) {
                positions.push(
                    centerX + (Math.random() - 0.5) * 80,
                    centerY + (Math.random() - 0.5) * 40,
                    centerZ + (Math.random() - 0.5) * 80
                );
            }
            
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            
            const mat = new THREE.PointsMaterial({
                color: nebulaColors[n % nebulaColors.length],
                size: 3,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const nebula = new THREE.Points(geo, mat);
            this.nebulae.push({ mesh: nebula, baseZ: centerZ });
            this.scene.add(nebula);
        }
    },
    
    // ── DISTANT PLANETS ──
    createDistantPlanets() {
        this.planetGroup = new THREE.Group();
        
        ZONES.forEach((zone, idx) => {
            // Main planet
            const size = zone.name === "Sun" ? 35 : (zone.name === "Jupiter" ? 28 : 20);
            const geo = new THREE.SphereGeometry(size, 32, 32);
            
            let mat;
            if (zone.name === "Sun") {
                mat = new THREE.MeshBasicMaterial({ 
                    color: zone.objColor,
                    emissive: zone.objColor
                });
            } else {
                mat = new THREE.MeshPhongMaterial({ 
                    color: zone.objColor,
                    shininess: 30
                });
            }
            
            const mesh = new THREE.Mesh(geo, mat);
            const side = idx % 2 === 0 ? 1 : -1;
            mesh.position.set(50 * side, 25, -zone.distance - 400);
            
            zone.mesh = mesh;
            this.planetGroup.add(mesh);
            
            // Saturn rings
            if (zone.name === "Saturn") {
                const ringGeo = new THREE.RingGeometry(28, 45, 64);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xccaa66,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.6
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2.3;
                mesh.add(ring);
            }
            
            // Uranus tilt + rings
            if (zone.name === "Uranus") {
                mesh.rotation.z = Math.PI / 2.2;
                const ringGeo = new THREE.RingGeometry(26, 32, 64);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0x88cccc,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.4
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2;
                mesh.add(ring);
            }
            
            // Earth with moon
            if (zone.name === "Earth") {
                // Clouds
                const cloudGeo = new THREE.SphereGeometry(20.3, 32, 32);
                const cloudMat = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.3
                });
                const clouds = new THREE.Mesh(cloudGeo, cloudMat);
                mesh.add(clouds);
                mesh.userData.clouds = clouds;
                
                // Moon
                const moonGeo = new THREE.SphereGeometry(5, 16, 16);
                const moonMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
                const moon = new THREE.Mesh(moonGeo, moonMat);
                moon.position.set(35, 10, 0);
                mesh.add(moon);
            }
            
            // Venus thick atmosphere
            if (zone.name === "Venus") {
                const atmoGeo = new THREE.SphereGeometry(22, 32, 32);
                const atmoMat = new THREE.MeshBasicMaterial({
                    color: 0xffcc88,
                    transparent: true,
                    opacity: 0.4
                });
                const atmo = new THREE.Mesh(atmoGeo, atmoMat);
                mesh.add(atmo);
                mesh.userData.atmosphere = atmo;
            }
            
            // Sun corona
            if (zone.name === "Sun") {
                const coronaGeo = new THREE.SphereGeometry(45, 32, 32);
                const coronaMat = new THREE.MeshBasicMaterial({
                    color: 0xff6600,
                    transparent: true,
                    opacity: 0.2,
                    blending: THREE.AdditiveBlending
                });
                const corona = new THREE.Mesh(coronaGeo, coronaMat);
                mesh.add(corona);
                this.sunCorona = corona;
                
                // Add point light for sun
                const sunLight = new THREE.PointLight(0xffaa44, 2, 500);
                mesh.add(sunLight);
            }
        });
        
        this.scene.add(this.planetGroup);
    },
    
    // ── ASTEROID BELTS ──
    createAsteroidBelts() {
        // Create background asteroid belts between zones
        const beltPositions = [-1500, -3500, -5500];
        
        beltPositions.forEach(z => {
            const geo = new THREE.BufferGeometry();
            const positions = [];
            const count = 100;
            
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 60 + Math.random() * 40;
                positions.push(
                    Math.cos(angle) * radius,
                    (Math.random() - 0.5) * 20,
                    z + (Math.random() - 0.5) * 100
                );
            }
            
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            
            const mat = new THREE.PointsMaterial({
                color: 0x888888,
                size: 0.8,
                transparent: true,
                opacity: 0.6
            });
            
            const belt = new THREE.Points(geo, mat);
            this.asteroidBelts.push({ mesh: belt, baseZ: z });
            this.scene.add(belt);
        });
    },
    
    // ── AMBIENT PARTICLES ──
    createAmbientParticles() {
        const geo = new THREE.BufferGeometry();
        this.ambientParticlePositions = new Float32Array(CONFIG.NEBULA_PARTICLE_COUNT * 3);
        
        for (let i = 0; i < CONFIG.NEBULA_PARTICLE_COUNT; i++) {
            this.ambientParticlePositions[i * 3] = (Math.random() - 0.5) * 100;
            this.ambientParticlePositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
            this.ambientParticlePositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        
        geo.setAttribute('position', new THREE.BufferAttribute(this.ambientParticlePositions, 3));
        
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.ambientParticles = new THREE.Points(geo, mat);
        this.scene.add(this.ambientParticles);
    },
    
    // ── GRID ──
    createGrid() {
        this.gridHelper = new THREE.GridHelper(200, 40, 0x444444, 0x222222);
        this.gridHelper.position.y = -1;
        this.scene.add(this.gridHelper);
    },
    
    // ── LIGHTING ──
    createLighting() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        
        this.dirLight = new THREE.DirectionalLight(0xfffff0, 0.8);
        this.dirLight.position.set(10, 20, 10);
        this.scene.add(this.dirLight);
    },
    
    // ── ZONE-SPECIFIC EFFECTS ──
    createZoneEffects() {
        // Venus thick atmosphere particles
        const venusGeo = new THREE.BufferGeometry();
        const venusPositions = new Float32Array(400 * 3);
        for (let i = 0; i < 400; i++) {
            venusPositions[i * 3] = (Math.random() - 0.5) * 80;
            venusPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            venusPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
        venusGeo.setAttribute('position', new THREE.BufferAttribute(venusPositions, 3));
        const venusMat = new THREE.PointsMaterial({
            color: 0xffcc66,
            size: 0.2,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.venusAtmosphere = new THREE.Points(venusGeo, venusMat);
        this.scene.add(this.venusAtmosphere);
        
        // Mercury heat shimmer
        const mercuryGeo = new THREE.BufferGeometry();
        const mercuryPositions = new Float32Array(300 * 3);
        for (let i = 0; i < 300; i++) {
            mercuryPositions[i * 3] = (Math.random() - 0.5) * 60;
            mercuryPositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
            mercuryPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
        mercuryGeo.setAttribute('position', new THREE.BufferAttribute(mercuryPositions, 3));
        const mercuryMat = new THREE.PointsMaterial({
            color: 0xff4400,
            size: 0.15,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.mercuryHeatGlow = new THREE.Points(mercuryGeo, mercuryMat);
        this.scene.add(this.mercuryHeatGlow);
        
        // Solar flares (created dynamically)
        this.solarFlares = [];
    },
    
    // ── UPDATE ──
    update(delta, playerZ) {
        const zone = GameState.getCurrentZone();
        const nextZone = GameState.getNextZone();
        const t = GameState.getZoneInterpolation();
        
        // Update starfield position
        if (this.stars) {
            this.stars.position.z = playerZ;
        }
        
        // Update grid position
        if (this.gridHelper) {
            this.gridHelper.position.z = playerZ - (playerZ % 5);
        }
        
        // Update ambient particles
        if (this.ambientParticles) {
            this.ambientParticles.position.z = playerZ;
            this.ambientParticles.rotation.y += delta * 0.05;
        }
        
        // Update background colors
        const bgColor = new THREE.Color(zone.bgColor).lerp(
            new THREE.Color(nextZone.bgColor), t
        );
        this.scene.fog.color.copy(bgColor);
        this.scene.background = bgColor;
        
        // Update fog density
        let targetFogDensity = zone.fogDensity + (nextZone.fogDensity - zone.fogDensity) * t;
        if (GameState.sensoryBlindTimer && GameState.sensoryBlindTimer > 0) {
            targetFogDensity = 0.15; // Visibly thicker fog for the "blindness" challenge
            // Also shift fog color more towards toxic green/orange if applicable
            this.scene.fog.color.lerp(new THREE.Color(0x88aa22), 0.5);
        }
        
        if (this.scene.fog.density !== undefined) {
             this.scene.fog.density += (targetFogDensity - this.scene.fog.density) * delta * 2.0;
        } else {
             this.scene.fog.density = targetFogDensity;
        }
        
        // Update ambient light intensity
        if (this.ambientLight) {
            this.ambientLight.intensity = zone.ambientIntensity + 
                (nextZone.ambientIntensity - zone.ambientIntensity) * t;
        }
        
        // Animate planets
        this.animatePlanets(delta);
        
        // Zone-specific effects
        this.updateZoneEffects(delta, zone.name, playerZ);
    },
    
    // Animate planets
    animatePlanets(delta) {
        ZONES.forEach(zone => {
            if (zone.mesh) {
                // Slow rotation
                zone.mesh.rotation.y += delta * 0.1;
                
                // Earth clouds
                if (zone.mesh.userData.clouds) {
                    zone.mesh.userData.clouds.rotation.y += delta * 0.15;
                }
                
                // Venus atmosphere pulse
                if (zone.mesh.userData.atmosphere) {
                    const pulse = 0.35 + Math.sin(Date.now() * 0.002) * 0.1;
                    zone.mesh.userData.atmosphere.material.opacity = pulse;
                }
            }
        });
        
        // Sun corona pulse
        if (this.sunCorona) {
            const pulse = 0.15 + Math.sin(Date.now() * 0.003) * 0.1;
            this.sunCorona.material.opacity = pulse;
            this.sunCorona.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);
        }
    },
    
    // Zone-specific effect updates
    updateZoneEffects(delta, zoneName, playerZ) {
        // Venus atmosphere
        const venusActive = (zoneName === "Venus");
        if (this.venusAtmosphere) {
            this.venusAtmosphere.material.opacity = venusActive ? 0.5 : 
                Math.max(0, this.venusAtmosphere.material.opacity - delta * 0.5);
            if (venusActive) {
                this.venusAtmosphere.position.z = playerZ;
                this.venusAtmosphere.rotation.y += delta * 0.3;
                // Swirl particles
                const pos = this.venusAtmosphere.geometry.attributes.position.array;
                for (let i = 0; i < pos.length / 3; i++) {
                    const angle = delta * 0.2;
                    const x = pos[i * 3];
                    const z = pos[i * 3 + 2];
                    pos[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
                    pos[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
                }
                this.venusAtmosphere.geometry.attributes.position.needsUpdate = true;
            }
        }
        
        // Mercury heat glow
        const mercuryActive = (zoneName === "Mercury");
        if (this.mercuryHeatGlow) {
            this.mercuryHeatGlow.material.opacity = mercuryActive ? 0.6 : 
                Math.max(0, this.mercuryHeatGlow.material.opacity - delta * 0.5);
            if (mercuryActive) {
                this.mercuryHeatGlow.position.z = playerZ;
                // Heat shimmer effect
                const pos = this.mercuryHeatGlow.geometry.attributes.position.array;
                for (let i = 0; i < pos.length / 3; i++) {
                    pos[i * 3 + 1] += Math.sin(Date.now() * 0.01 + i) * delta * 2;
                    if (pos[i * 3 + 1] > 20) pos[i * 3 + 1] = -20;
                }
                this.mercuryHeatGlow.geometry.attributes.position.needsUpdate = true;
            }
        }
        
        // Sun solar flares
        const sunActive = (zoneName === "Sun");
        if (sunActive) {
            this.updateSolarFlares(delta, playerZ);
        }
    },
    
    // Solar flare system
    updateSolarFlares(delta, playerZ) {
        // Spawn new flares occasionally
        if (Math.random() < delta * 0.5) {
            this.spawnSolarFlare(playerZ);
        }
        
        // Update existing flares
        for (let i = this.solarFlares.length - 1; i >= 0; i--) {
            const flare = this.solarFlares[i];
            flare.life -= delta;
            
            if (flare.life <= 0) {
                this.scene.remove(flare.mesh);
                flare.mesh.geometry.dispose();
                flare.mesh.material.dispose();
                this.solarFlares.splice(i, 1);
                continue;
            }
            
            // Expand and fade
            flare.mesh.scale.addScalar(delta * 5);
            flare.mesh.material.opacity = flare.life * 0.4;
            flare.mesh.position.z += delta * 30;
        }
    },
    
    spawnSolarFlare(playerZ) {
        const geo = new THREE.SphereGeometry(1, 8, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10,
            playerZ - 50 - Math.random() * 30
        );
        
        this.scene.add(mesh);
        this.solarFlares.push({ mesh, life: 1.5 });
    },
    
    // Dispose
    dispose() {
        // Cleanup all geometries and materials
        if (this.stars) {
            this.stars.geometry.dispose();
            this.stars.material.dispose();
        }
        // ... cleanup other resources
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Environment };
}
