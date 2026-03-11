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
                    <p>← → or A/D : Move lanes</p>
                    <p>Space or W : Jump</p>
                    <p>P : Pause</p>
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
                text-shadow: none;
                filter: drop-shadow(0 0 20px rgba(255, 165, 0, 0.5));
            }
            
            .game-subtitle {
                font-size: 1.2rem;
                color: #88aadd;
                margin: 10px 0 40px;
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
                pointer-events: none;
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
                text-align: right;
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
                    <div class="hud-stat hud-coins">
                        🪙 <span id="hud-coins">0</span>
                    </div>
                    <div class="hud-stat hud-lives" id="hud-lives">
                        <span class="life-icon">💚</span>
                        <span class="life-icon">💚</span>
                        <span class="life-icon">💚</span>
                    </div>
                </div>
                <div class="hud-right">
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
    },
    
    showHUD() {
        this.hudOverlay.style.display = 'block';
    },
    
    hideHUD() {
        this.hudOverlay.style.display = 'none';
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
                    <p>Coins: <span id="go-coins">0</span></p>
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
        SaveSystem.updateHighScore(GameState.score);
        
        this.gameoverOverlay.style.display = 'flex';
    },
    
    hideGameOver() {
        this.gameoverOverlay.style.display = 'none';
    },
    
    // ══════════════════════════════════════════════════════════
    //  PAUSE
    // ══════════════════════════════════════════════════════════
    createPauseOverlay() {
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.id = 'pause-overlay';
        this.pauseOverlay.innerHTML = `
            <div class="pause-container" style="text-align: center; color: white;">
                <h1 class="pause-title">PAUSED</h1>
                <div class="gameover-btns">
                    <button class="menu-btn primary" id="btn-resume">
                        <span class="btn-icon">▶️</span>
                        <span class="btn-text">Resume</span>
                    </button>
                    <button class="menu-btn" id="btn-pause-menu" style="background: #333;">
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
