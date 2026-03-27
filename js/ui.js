// ══════════════════════════════════════════════════════════════
//  UI.JS — User Interface & Menu System
// ══════════════════════════════════════════════════════════════

const UI = {
    // DOM elements
    container: null,
    menuOverlay: null,
    hudOverlay: null,
    
    // Callbacks
    onStartGame: null,
    onResumeCheckpoint: null,
    
    // Initialize
    init(container) {
        this.container = container;
        this.createMenuOverlay();
        this.createHUD();
        this.createGameOverOverlay();
        this.createVictoryOverlay();
        this.createPauseOverlay();
    },
    
    // ══════════════════════════════════════════════════════════
    //  MAIN MENU
    // ══════════════════════════════════════════════════════════
    createMenuOverlay() {
        this.menuOverlay = document.createElement('div');
        this.menuOverlay.id = 'menu-overlay';
        this.menuOverlay.innerHTML = `
            <div class="menu-container">
                <h1 class="game-title">🌌 HelioCentric</h1>
                <p class="game-subtitle">Journey from Pluto to the Sun</p>
                
                <div class="menu-buttons">
                    <button class="menu-btn primary" id="btn-new-game">
                        <span class="btn-icon">🚀</span>
                        <span class="btn-text">New Game</span>
                    </button>
                    
                    <div class="checkpoint-section" id="checkpoint-section" style="display: none;">
                        <h3>Resume from Checkpoint</h3>
                        <div class="checkpoint-list" id="checkpoint-list"></div>
                    </div>
                </div>
                
                <div class="high-score" id="high-score-display"></div>
                
                <div class="controls-info">
                    <h3>Controls</h3>
                    <p class="desktop-controls">← → or A/D : Move lanes</p>
                    <p class="desktop-controls">Space or W : Jump</p>
                    <p class="desktop-controls">P : Pause</p>
                    <p class="mobile-controls" style="display: none;">👆 Swipe left/right to change lanes</p>
                    <p class="mobile-controls" style="display: none;">👆 Swipe up to jump</p>
                </div>
            </div>
        `;
        this.applyMenuStyles();
        this.container.appendChild(this.menuOverlay);
        
        // Bind events
        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.hideMenu();
            if (this.onStartGame) this.onStartGame(null);
        });
        
        // Load checkpoints
        this.loadCheckpoints();
    },
    
    loadCheckpoints() {
        const checkpoints = SaveSystem.getUnlockedCheckpoints();
        const section = document.getElementById('checkpoint-section');
        const list = document.getElementById('checkpoint-list');
        
        if (checkpoints.length > 0) {
            section.style.display = 'block';
            list.innerHTML = '';
            
            checkpoints.forEach(cp => {
                const btn = document.createElement('button');
                btn.className = 'checkpoint-btn';
                btn.innerHTML = `
                    <span class="cp-icon">${cp.icon || '🪐'}</span>
                    <span class="cp-name">${cp.zoneName}</span>
                    <span class="cp-details">Zone ${cp.zoneIndex + 1} | Best: ${cp.highScore || 0}</span>
                `;
                btn.style.borderColor = '#' + cp.color.toString(16).padStart(6, '0');
                
                btn.addEventListener('click', () => {
                    this.hideMenu();
                    if (this.onResumeCheckpoint) this.onResumeCheckpoint(cp);
                });
                
                list.appendChild(btn);
            });
        }
        
        // High score
        const highScore = SaveSystem.getHighScore();
        if (highScore > 0) {
            document.getElementById('high-score-display').textContent = 
                `🏆 High Score: ${highScore}`;
        }
    },
    
    applyMenuStyles() {
        if (document.getElementById('menu-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'menu-styles';
        style.textContent = `
            #menu-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: radial-gradient(ellipse at center, #0a0a2e 0%, #000011 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            
            .menu-container {
                text-align: center;
                color: white;
                padding: 40px;
            }
            
            .game-title {
                font-size: 4rem;
                margin: 0;
                background: linear-gradient(135deg, #ffd700, #ff8c00, #ff6347);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: none;
                filter: drop-shadow(0 0 20px rgba(255, 165, 0, 0.5));
                line-height: 1.2;
            }
            
            .game-subtitle {
                font-size: 1.2rem;
                color: #88aadd;
                margin: 10px 0 40px;
            }
            
            /* Mobile Responsive Styles */
            @media (max-width: 768px) {
                .menu-container {
                    padding: 20px 15px;
                    max-width: 100vw;
                    overflow-x: hidden;
                }
                
                .game-title {
                    font-size: 2.5rem;
                    margin-bottom: 5px;
                }
                
                .game-subtitle {
                    font-size: 0.9rem;
                    margin: 5px 0 25px;
                }
                
                .menu-btn {
                    font-size: 1rem;
                    padding: 12px 25px;
                }
                
                .controls-info {
                    font-size: 0.85rem;
                }
                
                .controls-info h3 {
                    font-size: 1rem;
                }
            }
            
            @media (max-width: 480px) {
                .game-title {
                    font-size: 2rem;
                }
                
                .game-subtitle {
                    font-size: 0.8rem;
                }
                
                .menu-container {
                    padding: 15px 10px;
                }
            }
            
            .menu-buttons {
                display: flex;
                flex-direction: column;
                gap: 20px;
                align-items: center;
            }
            
            .menu-btn {
                padding: 15px 40px;
                font-size: 1.3rem;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .menu-btn.primary {
                background: linear-gradient(135deg, #4488ff, #2266cc);
                color: white;
                box-shadow: 0 4px 15px rgba(68, 136, 255, 0.4);
            }
            
            .menu-btn.primary:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 25px rgba(68, 136, 255, 0.6);
            }
            
            .btn-icon {
                font-size: 1.5rem;
            }
            
            .checkpoint-section {
                margin-top: 30px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                max-width: 400px;
            }
            
            .checkpoint-section h3 {
                margin: 0 0 15px;
                color: #88aadd;
            }
            
            .checkpoint-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .checkpoint-btn {
                padding: 12px 20px;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid #4488ff;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                text-align: left;
            }
            
            .checkpoint-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateX(5px);
            }
            
            .cp-icon {
                font-size: 1.5rem;
            }
            
            .cp-name {
                font-weight: bold;
                flex: 1;
            }
            
            .cp-details {
                font-size: 0.8rem;
                color: #88aadd;
            }
            
            .high-score {
                margin-top: 30px;
                font-size: 1.2rem;
                color: #ffd700;
            }
            
            .controls-info {
                margin-top: 40px;
                color: #666;
                font-size: 0.9rem;
            }            
            .mobile-controls {
                display: none;
            }
            
            @media (max-width: 768px), (pointer: coarse) {
                .desktop-controls {
                    display: none;
                }
                
                .mobile-controls {
                    display: block !important;
                }
            }            
            .controls-info h3 {
                color: #888;
                margin-bottom: 10px;
            }
            
            .controls-info p {
                margin: 5px 0;
            }
            
            /* HUD Styles */
            #hud-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                z-index: 100;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            
            .hud-top {
                display: flex;
                justify-content: space-between;
                padding: 20px;
            }
            
            .hud-left, .hud-right {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .hud-stat {
                background: rgba(0, 0, 0, 0.5);
                padding: 8px 15px;
                border-radius: 20px;
                color: white;
                font-size: 1.1rem;
                backdrop-filter: blur(10px);
            }
            
            .hud-lives {
                display: flex;
                gap: 5px;
            }
            
            .life-icon {
                font-size: 1.5rem;
            }
            
            .life-icon.lost {
                opacity: 0.3;
            }
            
            .hud-zone {
                text-align: center;
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: transparent;
                border: none;
                backdrop-filter: none;
                pointer-events: none;
                opacity: 0.8;
            }
            
            .hud-pause-btn {
                background: linear-gradient(135deg, rgba(68, 136, 255, 0.8), rgba(0, 200, 255, 0.8));
                border: 2px solid rgba(0, 255, 255, 0.6);
                border-radius: 50%;
                color: white;
                font-size: 1.5rem;
                width: 55px;
                height: 55px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                backdrop-filter: blur(10px);
                transition: all 0.2s ease;
                margin-right: 15px;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2);
                font-weight: bold;
                pointer-events: auto;
                touch-action: manipulation;
            }
            
            .hud-pause-btn:hover, .hud-pause-btn:active {
                transform: scale(1.15);
                background: linear-gradient(135deg, rgba(0, 255, 255, 0.9), rgba(0, 150, 255, 0.9));
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.3);
                border-color: rgba(0, 255, 255, 0.9);
            }
            
            
            
            /* HUD Mobile Responsive */
            @media (max-width: 768px) {
                .hud-top {
                    padding: 10px;
                    flex-wrap: wrap;
                }
                
                .hud-stat {
                    font-size: 0.9rem;
                    padding: 6px 12px;
                }
                
                .hud-pause-btn {
                    width: 50px;
                    height: 50px;
                    font-size: 1.3rem;
                    margin-right: 8px;
                    min-touch-target-size: 48px;
                }
                
                .life-icon {
                    font-size: 1.2rem;
                }
                
                .zone-name {
                    font-size: 0.85rem;
                }
            }
            
            @media (max-width: 480px) {
                .hud-top {
                    padding: 8px;
                }
                
                .hud-stat {
                    font-size: 0.8rem;
                    padding: 5px 10px;
                }
                
                .hud-pause-btn {
                    width: 48px;
                    height: 48px;
                    font-size: 1.1rem;
                    margin-right: 5px;
                }
            }
            
            .zone-name {
                font-weight: bold;
                color: #ffd700;
            }
            
            .zone-progress {
                width: 150px;
                height: 6px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                margin-top: 5px;
            }
            
            .zone-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4488ff, #ffaa00);
                border-radius: 3px;
                transition: width 0.3s ease;
            }
            
            /* Game Over */
            #gameover-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 500;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            
            .gameover-container {
                text-align: center;
                color: white;
            }
            
            .gameover-title {
                font-size: 3rem;
                color: #ff4444;
                margin-bottom: 20px;
            }
            
            .gameover-stats {
                font-size: 1.3rem;
                margin: 20px 0;
            }
            
            .gameover-btns {
                display: flex;
                gap: 20px;
                justify-content: center;
                margin-top: 30px;
            }
            
            /* Pause */
            #pause-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0, 0, 20, 0.9);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 400;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            
            .pause-title {
                font-size: 3rem;
                color: #4488ff;
                margin-bottom: 30px;
            }
            
            .pause-container {
                max-height: 90vh;
                overflow-y: auto;
                max-width: 800px;
                background: rgba(0, 20, 40, 0.95);
                border: 2px solid rgba(0, 255, 255, 0.3);
                border-radius: 20px;
                padding: 40px 30px;
            }
            
            .pause-instructions {
                text-align: left;
                margin: 20px 0;
                background: rgba(0, 50, 100, 0.3);
                border-left: 3px solid #00ffff;
                padding: 15px 20px;
                border-radius: 8px;
                font-size: 0.95rem;
                color: #cccccc;
                line-height: 1.6;
            }
            
            .pause-control {
                background: rgba(100, 0, 100, 0.2);
                border-left: 3px solid #ffaa00;
                padding: 12px 15px;
                border-radius: 6px;
                margin: 10px 0;
                font-size: 0.9rem;
                color: #ffc699;
            }
            
            /* Game Over & Pause Mobile Responsive */
            @media (max-width: 768px) {
                .gameover-container, .pause-container {
                    padding: 20px;
                    max-width: 95vw;
                    max-height: 85vh;
                }
                
                .gameover-title, .pause-title {
                    font-size: 2rem;
                    margin-bottom: 20px;
                }
                
                .gameover-stats {
                    font-size: 1.1rem;
                }
                
                .gameover-btns {
                    flex-direction: column;
                    gap: 15px;
                    width: 100%;
                    max-width: 300px;
                    margin: 20px auto 0;
                }
                
                .menu-btn {
                    width: 100%;
                }
            }
            
            @media (max-width: 480px) {
                .gameover-title, .pause-title {
                    font-size: 1.5rem;
                    margin-bottom: 15px;
                }
                
                .gameover-stats {
                    font-size: 1rem;
                }
                
                .pause-container {
                    padding: 20px 15px;
                    border-radius: 15px;
                }
                
                .pause-instructions, .pause-control {
                    font-size: 0.85rem;
                    padding: 10px 12px;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    showMenu() {
        this.loadCheckpoints();
        this.menuOverlay.style.display = 'flex';
    },
    
    hideMenu() {
        this.menuOverlay.style.display = 'none';
    },
    
    // ══════════════════════════════════════════════════════════
    //  HUD (In-Game UI)
    // ══════════════════════════════════════════════════════════
    createHUD() {
        this.hudOverlay = document.createElement('div');
        this.hudOverlay.id = 'hud-overlay';
        this.hudOverlay.style.display = 'none';
        this.hudOverlay.innerHTML = `
            <div class="hud-top">
                <div class="hud-left">
                    <div class="hud-stat hud-score">
                        <span id="hud-score">0</span> pts
                    </div>
                    <div class="hud-stat hud-currencies">
                        🪙 <span id="hud-coins">0</span>
                    </div>
                    <div class="hud-stat hud-lives" id="hud-lives">
                        <span class="life-icon">💚</span>
                        <span class="life-icon">💚</span>
                        <span class="life-icon">💚</span>
                    </div>
                </div>
                <div class="hud-right" style="display: flex; align-items: center;">
                    <button id="hud-pause-btn" class="hud-pause-btn" title="Pause Game">⏸️</button>
                    <div class="hud-stat hud-zone">
                        <span class="zone-name" id="hud-zone-name">Pluto</span>
                        <div class="zone-progress">
                            <div class="zone-progress-bar" id="hud-zone-progress"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.appendChild(this.hudOverlay);
        
        // Pause button event
        document.getElementById('hud-pause-btn').addEventListener('click', () => {
            if (!GameState.isPaused && GameState.isPlaying && !GameState.isGameOver) {
                GameState.isPaused = true;
                this.showPause();
            }
        });
    },
    
    showHUD() {
        this.hudOverlay.style.display = 'block';
    },
    
    hideHUD() {
        this.hudOverlay.style.display = 'none';
    },
    
    showPowerupMessage(type) {
        const names = {
            shield: '🛡️ +1 LIFE',
            darkMatter: '🟣 DARK MATTER BOOST',
            gravity: '🌀 GRAVITY STABILIZER',
            warp: '🚪 TELEPORTED!',
            magnet: '🧲 MAGNET FIELD',
            acid_blind: '⚠️ VISIBILITY COMPROMISED!'
        };
        const msg = document.createElement('div');
        msg.className = 'powerup-msg';
        msg.textContent = (names[type] || type.toUpperCase()) + (type === 'shield' || type === 'warp' || type === 'acid_blind' ? '' : ' ACTIVATED!');
        msg.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);color:#fff;font-size:28px;font-weight:bold;text-shadow:0 0 15px #ff0,0 0 30px #f80;z-index:9999;pointer-events:none;animation:powerupFade 2s forwards;';
        
        if (!document.getElementById('powerup-fade-style')) {
            const style = document.createElement('style');
            style.id = 'powerup-fade-style';
            style.textContent = '@keyframes powerupFade { 0%{opacity:0;transform:translateX(-50%) scale(0.5)} 15%{opacity:1;transform:translateX(-50%) scale(1.2)} 30%{transform:translateX(-50%) scale(1)} 80%{opacity:1} 100%{opacity:0;transform:translateX(-50%) translateY(-30px)} }';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    },

    showCollectMessage(label, coinValue) {
        const msg = document.createElement('div');
        msg.className = 'collect-msg';
        msg.textContent = label + ' +' + coinValue + ' \ud83e\ude99';
        msg.style.cssText = 'position:fixed;top:30%;left:50%;transform:translateX(-50%);color:#ffd700;font-size:22px;font-weight:bold;text-shadow:0 0 10px #fa0,0 0 20px #f80;z-index:9999;pointer-events:none;animation:powerupFade 1.5s forwards;';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 1500);
    },

    updateHUD() {
        document.getElementById('hud-score').textContent = GameState.score;
        document.getElementById('hud-coins').textContent = GameState.coins;
        
        // Lives
        const livesContainer = document.getElementById('hud-lives');
        livesContainer.innerHTML = '';
        for (let i = 0; i < CONFIG.INITIAL_LIVES; i++) {
            const icon = document.createElement('span');
            icon.className = 'life-icon' + (i >= GameState.lives ? ' lost' : '');
            icon.textContent = i < GameState.lives ? '💚' : '🖤';
            livesContainer.appendChild(icon);
        }
        
        // Zone
        const zone = GameState.getCurrentZone();
        document.getElementById('hud-zone-name').textContent = zone.name;
        document.getElementById('hud-zone-name').style.color = '#' + zone.objColor.toString(16).padStart(6, '0');
        
        // Progress (use interpolation helper)
        const t = GameState.getZoneInterpolation();
        document.getElementById('hud-zone-progress').style.width = Math.min(100, Math.max(0, t * 100)) + '%';
    },
    
    // ══════════════════════════════════════════════════════════
    //  GAME OVER
    // ══════════════════════════════════════════════════════════
    createGameOverOverlay() {
        this.gameoverOverlay = document.createElement('div');
        this.gameoverOverlay.id = 'gameover-overlay';
        this.gameoverOverlay.innerHTML = `
            <div class="gameover-container">
                <h1 class="gameover-title">GAME OVER</h1>
                <div class="gameover-stats">
                    <p>Score: <span id="go-score">0</span></p>
                    <p>Coins: <span id="go-coins">0</span> 🪙</p>
                    <p>Zone Reached: <span id="go-zone">Pluto</span></p>
                </div>
                <div class="gameover-btns">
                    <button class="menu-btn primary" id="btn-retry">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Retry</span>
                    </button>
                    <button class="menu-btn" id="btn-main-menu" style="background: #333;">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-text">Main Menu</span>
                    </button>
                </div>
            </div>
        `;
        this.container.appendChild(this.gameoverOverlay);
        
        document.getElementById('btn-retry').addEventListener('click', () => {
            this.hideGameOver();
            if (this.onStartGame) this.onStartGame(null);
        });
        
        document.getElementById('btn-main-menu').addEventListener('click', () => {
            this.hideGameOver();
            this.showMenu();
        });
    },
    
    showGameOver() {
        document.getElementById('go-score').textContent = GameState.score;
        document.getElementById('go-coins').textContent = GameState.coins;
        document.getElementById('go-zone').textContent = GameState.getCurrentZone().name;
        
        // Update high score
        SaveSystem.updateHighScore(GameState.score, GameState.coins);
        
        this.gameoverOverlay.style.display = 'flex';
    },
    
    hideGameOver() {
        this.gameoverOverlay.style.display = 'none';
    },

    // ══════════════════════════════════════════════════════════
    //  VICTORY
    // ══════════════════════════════════════════════════════════
    createVictoryOverlay() {
        this.victoryOverlay = document.createElement('div');
        this.victoryOverlay.id = 'victory-overlay';
        this.victoryOverlay.innerHTML = `
            <div class="gameover-container">
                <h1 class="gameover-title" style="color: #ffff00; text-shadow: 0 0 20px #ff8800;">YOU REACHED THE SUN!</h1>
                <p style="font-size: 1.5rem; color: #ffebcc; margin-bottom: 20px;">The journey is complete!</p>
                <div class="gameover-stats">
                    <p>Final Score: <span id="vic-score">0</span></p>
                    <p>Total Coins: <span id="vic-coins">0</span> 🪙</p>
                </div>
                <div class="gameover-btns">
                    <button class="menu-btn primary" id="btn-vic-menu">
                        <span class="btn-icon">🌟</span>
                        <span class="btn-text">Back to Menu</span>
                    </button>
                </div>
            </div>
        `;
        // Use same styling class as game over overlay for layout
        this.victoryOverlay.className = this.gameoverOverlay.className;
        this.victoryOverlay.style.cssText = this.gameoverOverlay.style.cssText;
        this.container.appendChild(this.victoryOverlay);
        
        document.getElementById('btn-vic-menu').addEventListener('click', () => {
            this.hideVictory();
            this.showMenu();
        });
    },

    showVictory() {
        document.getElementById('vic-score').textContent = GameState.score;
        document.getElementById('vic-coins').textContent = GameState.coins;
        
        // Ensure UI is styled like game over
        this.victoryOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255, 100, 0, 0.4); backdrop-filter: blur(8px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        this.victoryOverlay.style.display = 'flex';
    },
    
    hideVictory() {
        if(this.victoryOverlay) this.victoryOverlay.style.display = 'none';
    },
    
    // ══════════════════════════════════════════════════════════
    //  PAUSE
    // ══════════════════════════════════════════════════════════
    createPauseOverlay() {
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.id = 'pause-overlay';
        this.pauseOverlay.innerHTML = `
            <div class="pause-container">
                <h1 class="pause-title">⏸️ PAUSED</h1>
                
                <div class="pause-instructions">
                    <strong>🎮 GAME CONTROLS</strong>
                    <div class="pause-control">← → or A/D : Change lanes</div>
                    <div class="pause-control">Space or W↑ : Jump</div>
                    <div class="pause-control">P or 📱 Button : Pause/Resume</div>
                </div>
                
                <div class="pause-instructions">
                    <strong>⚠️ DANGER ZONES</strong>
                    ⭕ Black Holes (AUTO-KILL) | ⚡ Solar Flares (AUTO-KILL) | 💨 Jupiter Storms (AUTO-KILL with Dark Matter immunity)<br>
                    ☁️ Acid Clouds (3sec blindness) | 🌪️ Dust Storms (visibility reduction)
                </div>
                
                <div class="pause-instructions">
                    <strong>⚡ POWER-UPS (10s duration)</strong>
                    🛡️ Shield: +1 Life | 🟣 Dark Matter: Speed↑+Invincible+hazard bypass | 🌀 Gravity: Jump x1.5 | 🚪 Warp: Random lane teleport | 🧲 Magnet: Auto-collect nearby items
                </div>
                
                <div class="pause-instructions">
                    <strong>💎 COLLECTIBLES</strong>
                    ⭐ Star (1 coin) | 🟣 Dark Matter (5 coins) | 🌠 Comet (3 coins) | 🛸 Alien Tech (10 coins) | ☀️ Solar Cell (15 coins) | 🪐 Planet Relic (50 coins-ultra rare!)
                </div>
                
                <div class="gameover-btns" style="margin-top: 25px; gap: 15px;">
                    <button class="menu-btn primary" id="btn-resume" style="flex: 1; min-height: 50px; font-size: 1.1rem; touch-action: manipulation;">
                        <span class="btn-icon">▶️</span>
                        <span class="btn-text">Resume Game</span>
                    </button>
                    <button class="menu-btn" id="btn-pause-menu" style="flex: 1; background: #333; min-height: 50px; font-size: 1.1rem; touch-action: manipulation;">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-text">Main Menu</span>
                    </button>
                </div>
            </div>
        `;
        this.container.appendChild(this.pauseOverlay);
        
        document.getElementById('btn-resume').addEventListener('click', () => {
            this.hidePause();
            GameState.isPaused = false;
        });
        
        document.getElementById('btn-pause-menu').addEventListener('click', () => {
            this.hidePause();
            this.hideHUD();
            GameState.isGameOver = true;
            this.showMenu();
        });
    },
    
    showPause() {
        this.pauseOverlay.style.display = 'flex';
    },
    
    hidePause() {
        this.pauseOverlay.style.display = 'none';
    },
    
    // ══════════════════════════════════════════════════════════
    //  NOTIFICATIONS
    // ══════════════════════════════════════════════════════════
    showZoneNotification(zoneName, description) {
        const notif = document.createElement('div');
        notif.className = 'zone-notification';
        notif.innerHTML = `
            <h2>Entering ${zoneName}</h2>
            <p>${description || ''}</p>
        `;
        notif.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 30px 50px;
            border-radius: 15px;
            text-align: center;
            z-index: 300;
            animation: zoneNotifAnim 2s forwards;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        if (!document.getElementById('zone-notif-style')) {
            const style = document.createElement('style');
            style.id = 'zone-notif-style';
            style.textContent = `
                @keyframes zoneNotifAnim {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.container.appendChild(notif);
        
        setTimeout(() => {
            notif.remove();
        }, 2000);
    },
    
    showCheckpointSaved(zoneName) {
        const notif = document.createElement('div');
        notif.innerHTML = `✅ Checkpoint saved: ${zoneName}`;
        notif.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 150, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            z-index: 300;
            animation: checkpointAnim 1.5s forwards;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        if (!document.getElementById('checkpoint-notif-style')) {
            const style = document.createElement('style');
            style.id = 'checkpoint-notif-style';
            style.textContent = `
                @keyframes checkpointAnim {
                    0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.container.appendChild(notif);
        
        setTimeout(() => {
            notif.remove();
        }, 1500);
    },

    // Simple damage flash overlay
    showHitFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(255, 0, 0, 0.3);
            pointer-events: none;
            z-index: 350;
            animation: hitFlashAnim 0.4s forwards;
        `;

        if (!document.getElementById('hit-flash-style')) {
            const style = document.createElement('style');
            style.id = 'hit-flash-style';
            style.textContent = `
                @keyframes hitFlashAnim {
                    0% { opacity: 0; }
                    20% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        this.container.appendChild(flash);
        setTimeout(() => flash.remove(), 400);
    },

    // Helper to refresh lives display
    updateLives() {
        this.updateHUD();
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI };
}
