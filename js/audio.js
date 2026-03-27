const AudioSystem = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    currentOscillators: [],
    initialized: false,
    
    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.4;
            this.musicGain.connect(this.masterGain);
            
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);
            
            this.initialized = true;
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    },
    
    stopMusic() {
        if (!this.initialized) return;
        this.currentOscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {}
        });
        this.currentOscillators = [];
    },
    
    playMusicForZone(zoneIndex) {
        if (!this.initialized) this.init();
        if (!this.initialized) return;
        
        this.stopMusic();
        
        // Very basic procedural ambient music per zone
        // 10 zones total, let's create mildly dissonant interval progressions
        // base frequencies
        const pentatonic = [65.41, 73.42, 82.41, 98.00, 110.00, 130.81, 146.83, 164.81, 196.00, 220.00];
        
        const baseFreq = pentatonic[zoneIndex % pentatonic.length]; 
        
        this.createAmbientDrone(baseFreq, 'sine', 0.5);
        this.createAmbientDrone(baseFreq * 1.5, 'triangle', 0.3); // Perfect fifth
        if (zoneIndex > 2) {
             this.createAmbientDrone(baseFreq * 1.25, 'sine', 0.2); // Major third (ish)
        } else {
             this.createAmbientDrone(baseFreq * 1.2, 'sine', 0.2); // Minor third
        }
        this.createAmbientDrone(baseFreq * 2.0, 'sine', 0.15); // Octave
    },
    
    createAmbientDrone(freq, type, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Add a lowpass filter for that chill/interstellar sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq * 3;
        filter.Q.value = 1;
        
        osc.type = type;
        osc.frequency.value = freq;
        
        // Add slow LFO for volume to make it "chill/interstellar"
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05 + (Math.random() * 0.1); // slower LFO
        lfoGain.gain.value = vol * 0.4;
        
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        gain.gain.value = vol * 0.6; // Base volume slightly lower
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start();
        lfo.start();
        
        this.currentOscillators.push(osc);
        this.currentOscillators.push(lfo);
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