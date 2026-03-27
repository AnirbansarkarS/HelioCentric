const AudioSystem = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    currentOscillators: [],
    initialized: false,
    
    init() {
        if (this.initialized) {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.5;
            this.musicGain.connect(this.masterGain);
            
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.7;
            this.sfxGain.connect(this.masterGain);
            
            this.initialized = true;
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    },
    
    playbackTime: 0,
    currentTempo: 120,
    activeSequence: [],
    noteScheduleInterval: null,

    stopMusic() {
        if (!this.initialized) return;
        this.currentOscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {}
        });
        this.currentOscillators = [];
        
        if(this.noteScheduleInterval) {
            clearInterval(this.noteScheduleInterval);
            this.noteScheduleInterval = null;
        }
    },
    
    playMusicForZone(zoneIndex) {
        if (!this.initialized) this.init();
        if (!this.initialized) return;
        
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        this.stopMusic();
        
        // Fetch API to generate gamelike music seed
        const zoneName = (typeof ZONES !== 'undefined' && ZONES[zoneIndex]) ? ZONES[zoneIndex].name : 'Space';
        
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${zoneName}`)
            .then(res => res.json())
            .then(data => {
                const extract = data.extract || zoneName + ' ' + Math.random().toString();
                this.generateGameLikeMusicFromText(zoneIndex, extract);
            })
            .catch(() => {
                // fallback to pseudo random seed
                this.generateGameLikeMusicFromText(zoneIndex, zoneName + ' fallback ' + Date.now());
            });
    },
    
    generateGameLikeMusicFromText(zoneIndex, text) {
        if (!this.initialized) return;
        this.stopMusic();

        // Convert the text into a sequence of game-like chiptune notes
        // Mapped to a sci-fi sounding pentatonic/dorian scale
        const baseFreqs = [130.81, 146.83, 155.56, 174.61, 196.00, 233.08, 261.63, 293.66, 311.13, 349.23, 392.00, 466.16]; 
        
        let sequence = [];
        for(let i=0; i < Math.min(32, text.length); i++) {
            // grab the character char code and map it to an index
            let charCode = text.charCodeAt(i);
            // Ignore spaces/punctuation for rhythm
            if(text[i] === ' ' || text[i] === '.') {
                sequence.push(null); // Rest
            } else {
                let noteIndex = charCode % baseFreqs.length;
                let isHigh = (charCode % 2 === 0);
                sequence.push(baseFreqs[noteIndex] * (isHigh ? 2 : 1)); // Random octave up
            }
        }
        
        // Ensure some non-rests
        if(sequence.filter(x => x !== null).length < 4) {
             sequence = [baseFreqs[0], baseFreqs[4], null, baseFreqs[7], baseFreqs[10], null, baseFreqs[4], null];
        }

        this.activeSequence = sequence;
        this.currentTempo = 160 + (zoneIndex * 15); // Velocity increases per zone!
        
        let noteCounter = 0;
        let lookahead = 25.0; // ms
        let scheduleAheadTime = 0.1; // s
        this.playbackTime = this.ctx.currentTime;

        // Scheduler loop for 8-bit arpeggio
        this.noteScheduleInterval = setInterval(() => {
            while (this.playbackTime < this.ctx.currentTime + scheduleAheadTime) {
                let freq = this.activeSequence[noteCounter % this.activeSequence.length];
                
                if (freq) {
                    // Play a quick 8-bit "bleep"
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    
                    osc.type = 'square'; // Gamelike waveform
                    osc.frequency.value = freq;
                    
                    // Pluck envelope for retro sound
                    gain.gain.setValueAtTime(0, this.playbackTime);
                    gain.gain.linearRampToValueAtTime(0.2, this.playbackTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.playbackTime + 0.15);
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(this.playbackTime);
                    osc.stop(this.playbackTime + 0.15);
                    
                    this.currentOscillators.push(osc);
                }
                
                // Add a continuous underlying retro bass based on zone
                if (noteCounter % 16 === 0) {
                     const bassOsc = this.ctx.createOscillator();
                     const bassGain = this.ctx.createGain();
                     bassOsc.type = 'sawtooth';
                     bassOsc.frequency.value = baseFreqs[zoneIndex % baseFreqs.length] * 0.5;
                     
                     bassGain.gain.setValueAtTime(0, this.playbackTime);
                     bassGain.gain.linearRampToValueAtTime(0.3, this.playbackTime + 0.1);
                     bassGain.gain.exponentialRampToValueAtTime(0.05, this.playbackTime + (60 / this.currentTempo * 4));
                     
                     bassOsc.connect(bassGain);
                     bassGain.connect(this.musicGain);
                     
                     bassOsc.start(this.playbackTime);
                     bassOsc.stop(this.playbackTime + (60 / this.currentTempo * 4));
                     this.currentOscillators.push(bassOsc);
                }
                
                // Periodic cleanup of oscillators
                if(this.currentOscillators.length > 50) {
                     this.currentOscillators = this.currentOscillators.slice(-20);
                }

                // Advance time for 16th note
                const secondsPerBeat = 60.0 / this.currentTempo;
                this.playbackTime += 0.25 * secondsPerBeat; 
                noteCounter++;
            }
        }, lookahead);
    },
    
    playStarCollect(value) {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + (value * 100), this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200 + (value * 200), this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },
    
    playCollapse() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 1.0);
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    },
    
    playDamage() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
};

window.AudioSystem = AudioSystem;