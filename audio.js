/* ==========================================================
   VS Police - audio.js
   Procedural chiptune BGM / SE / helicopter ambience.
   No external audio files are used, so the game keeps working
   from file:// and GitHub Pages.
   ========================================================== */
(function () {
    'use strict';

    if (typeof window === 'undefined') return;

    const STORAGE_KEY = 'vspolice.muted';
    const BPM = 104;
    const STEP = 60 / BPM / 4;      // 16分音符
    const LOOP_STEPS = 64;          // 4小節ループ

    let audio = null;
    let master = null;
    let sfxBus = null;
    let bgmBus = null;
    let ambBus = null;
    let noiseBuffer = null;

    let muted = false;
    let gameActive = false;
    let bgmTimer = null;
    let nextStepTime = 0;
    let stepIndex = 0;
    let rotor = null;
    let lastPhase = null;

    try {
        muted = window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
        muted = false;
    }

    function ensure() {
        if (audio) return audio;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        try {
            audio = new AudioCtx();
            master = audio.createGain();
            master.gain.value = muted ? 0.0001 : 0.8;
            master.connect(audio.destination);

            sfxBus = audio.createGain();
            sfxBus.gain.value = 0.55;
            sfxBus.connect(master);

            bgmBus = audio.createGain();
            bgmBus.gain.value = 0.13;
            bgmBus.connect(master);

            ambBus = audio.createGain();
            ambBus.gain.value = 0.65;
            ambBus.connect(master);

            const len = Math.max(1, Math.floor(audio.sampleRate * 2));
            noiseBuffer = audio.createBuffer(1, len, audio.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
            return audio;
        } catch (e) {
            audio = null;
            return null;
        }
    }

    function unlock() {
        const ctx = ensure();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        if (gameActive && !muted) startBgm();
    }

    function midiToHz(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    function toneAt(freq, dur, opts, when, bus) {
        const ctx = audio;
        if (!ctx) return;
        try {
            const t = Math.max(ctx.currentTime, when);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const vol = opts.gain == null ? 0.08 : opts.gain;
            const attack = opts.attack == null ? 0.008 : opts.attack;
            osc.type = opts.type || 'square';
            osc.frequency.setValueAtTime(Math.max(20, freq), t);
            if (opts.to) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
            }
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t + attack);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain);
            gain.connect(bus || sfxBus);
            osc.start(t);
            osc.stop(t + dur + 0.03);
        } catch (e) { /* audio must never break the game */ }
    }

    function tone(freq, dur, opts) {
        const ctx = ensure();
        if (!ctx) return;
        const o = opts || {};
        toneAt(freq, dur, o, ctx.currentTime + (o.delay || 0), o.bus || sfxBus);
    }

    function noiseAt(dur, opts, when) {
        const ctx = audio;
        if (!ctx || !noiseBuffer) return;
        try {
            const t = Math.max(ctx.currentTime, when);
            const src = ctx.createBufferSource();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();
            src.buffer = noiseBuffer;
            src.loop = true;
            filter.type = opts.filterType || 'bandpass';
            filter.frequency.value = opts.freq || 1200;
            filter.Q.value = opts.q == null ? 0.8 : opts.q;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, opts.gain || 0.04), t + 0.006);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(filter);
            filter.connect(gain);
            gain.connect(opts.bus || sfxBus);
            src.start(t);
            src.stop(t + dur + 0.03);
        } catch (e) { /* no-op */ }
    }

    function noise(dur, opts) {
        const ctx = ensure();
        if (!ctx) return;
        noiseAt(dur, opts || {}, ctx.currentTime + ((opts && opts.delay) || 0));
    }

    /* ---------- BGM ---------- */
    // A minor / F major / C major / G major の 4 小節ループ
    const CHORDS = [
        { root: 45, notes: [0, 3, 7, 12] }, // Am
        { root: 41, notes: [0, 4, 7, 12] }, // F
        { root: 36, notes: [0, 4, 7, 12] }, // C
        { root: 43, notes: [0, 4, 7, 12] }, // G
    ];

    function scheduleStep(i, when) {
        const chord = CHORDS[Math.floor(i / 16) % CHORDS.length];
        const local = i % 16;

        // Bass: 小節頭と裏拍でルート音
        if (local === 0 || local === 6 || local === 8 || local === 14) {
            toneAt(midiToHz(chord.root), 0.16, {
                type: 'square', gain: 0.09, attack: 0.01, bus: bgmBus,
            }, when, bgmBus);
        }
        if (local === 12) {
            toneAt(midiToHz(chord.root + 12), 0.1, {
                type: 'square', gain: 0.055, attack: 0.008, bus: bgmBus,
            }, when, bgmBus);
        }

        // Arpeggio: 2ステップごとに控えめな三角形波
        if (local % 2 === 0) {
            const idx = Math.floor(local / 2) % chord.notes.length;
            const note = chord.root + 12 + chord.notes[idx];
            toneAt(midiToHz(note), 0.085, {
                type: 'triangle', gain: 0.038, attack: 0.006, bus: bgmBus,
            }, when, bgmBus);
        }

        // Kick / snare / hat
        if (local === 0 || local === 8) {
            toneAt(130, 0.13, {
                type: 'sine', gain: 0.11, to: 42, attack: 0.004, bus: bgmBus,
            }, when, bgmBus);
        }
        if (local === 4 || local === 12) {
            noiseAt(0.075, { gain: 0.04, freq: 1800, filterType: 'bandpass', bus: bgmBus }, when);
        }
        if (local % 2 === 1) {
            noiseAt(0.025, { gain: 0.012, freq: 6500, filterType: 'highpass', bus: bgmBus }, when);
        }
    }

    function startBgm() {
        const ctx = ensure();
        if (!ctx || muted || !gameActive || bgmTimer) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        nextStepTime = ctx.currentTime + 0.08;
        stepIndex = 0;
        const tick = () => {
            bgmTimer = null;
            const c = audio;
            if (!c || !gameActive || muted) return;
            if (nextStepTime < c.currentTime - 0.5) nextStepTime = c.currentTime + 0.05;
            while (nextStepTime < c.currentTime + 0.25) {
                scheduleStep(stepIndex, nextStepTime);
                nextStepTime += STEP;
                stepIndex = (stepIndex + 1) % LOOP_STEPS;
            }
            bgmTimer = window.setTimeout(tick, 80);
        };
        tick();
    }

    function stopBgm() {
        if (bgmTimer) {
            window.clearTimeout(bgmTimer);
            bgmTimer = null;
        }
    }

    /* ---------- ヘリのプロペラ音（環境音） ---------- */
    function startRotor() {
        const ctx = ensure();
        if (!ctx || muted || rotor) return;
        try {
            const src = ctx.createBufferSource();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();

            src.buffer = noiseBuffer;
            src.loop = true;
            filter.type = 'lowpass';
            filter.frequency.value = 220;
            filter.Q.value = 0.7;
            gain.gain.value = 0.0001;

            lfo.type = 'sine';
            lfo.frequency.value = 13;
            lfoGain.gain.value = 0.018;
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);

            src.connect(filter);
            filter.connect(gain);
            gain.connect(ambBus);

            const t = ctx.currentTime;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.028, t + 0.7);
            src.start(t);
            lfo.start(t);
            rotor = { src, lfo, gain };
        } catch (e) {
            rotor = null;
        }
    }

    function stopRotor() {
        if (!rotor || !audio) return;
        const ctx = audio;
        const r = rotor;
        rotor = null;
        try {
            const t = ctx.currentTime;
            r.gain.gain.cancelScheduledValues(t);
            r.gain.gain.setValueAtTime(0.0001, t);
            r.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
            r.src.stop(t + 0.4);
            r.lfo.stop(t + 0.4);
        } catch (e) { /* no-op */ }
    }

    /* ---------- SE ---------- */
    function play(name, opts) {
        const o = opts || {};
        if (muted) return;
        const ctx = ensure();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        switch (name) {
            case 'select':
                tone(880, 0.045, { type: 'square', gain: 0.035 });
                break;
            case 'deny':
                tone(190, 0.14, { type: 'sawtooth', gain: 0.06, to: 90 });
                break;
            case 'place':
                tone(320, 0.1, { type: 'square', gain: 0.06, to: 640 });
                tone(640, 0.08, { type: 'square', gain: 0.04, delay: 0.075 });
                break;
            case 'move':
                tone(300, 0.16, { type: 'triangle', gain: 0.06, to: 620 });
                noise(0.18, { gain: 0.022, freq: 900, filterType: 'lowpass' });
                break;
            case 'scan':
                tone(240, 0.3, { type: 'sawtooth', gain: 0.035, to: 960 });
                noise(0.28, { gain: 0.024, freq: 1600, filterType: 'bandpass' });
                tone(1320, 0.06, { type: 'square', gain: 0.028, delay: 0.27 });
                break;
            case 'empty':
                tone(210, 0.18, { type: 'square', gain: 0.055, to: 105 });
                tone(140, 0.16, { type: 'triangle', gain: 0.04, delay: 0.12 });
                break;
            case 'clue': {
                const base = o.clue === 'RED' ? 660 : o.clue === 'BLUE' ? 740 : 880;
                [0, 1, 2, 3].forEach((i) => {
                    tone(base * Math.pow(1.25, i), 0.1, {
                        type: 'square', gain: 0.045, delay: i * 0.065,
                    });
                });
                noise(0.16, { gain: 0.02, freq: 3000, filterType: 'highpass', delay: 0.02 });
                break;
            }
            case 'found':
                [0, 0.22, 0.44].forEach((delay, i) => {
                    tone(i % 2 === 0 ? 880 : 660, 0.2, {
                        type: 'sawtooth', gain: 0.055, to: i % 2 === 0 ? 660 : 880, delay,
                    });
                });
                noise(0.35, { gain: 0.05, freq: 500, filterType: 'lowpass' });
                break;
            case 'win':
                [523, 659, 784, 1047, 1319].forEach((freq, i) => {
                    tone(freq, 0.28, {
                        type: 'square', gain: 0.06, delay: i * 0.13,
                    });
                });
                break;
            case 'lose':
                [392, 349, 294, 220].forEach((freq, i) => {
                    tone(freq, 0.3, {
                        type: 'triangle', gain: 0.06, delay: i * 0.15,
                    });
                });
                break;
            case 'round':
                tone(392, 0.08, { type: 'square', gain: 0.045 });
                tone(523, 0.12, { type: 'square', gain: 0.045, delay: 0.09 });
                break;
            case 'confirm':
                tone(660, 0.08, { type: 'square', gain: 0.05 });
                tone(880, 0.1, { type: 'square', gain: 0.05, delay: 0.07 });
                break;
            case 'turn':
                tone(440, 0.1, { type: 'triangle', gain: 0.045 });
                tone(330, 0.15, { type: 'triangle', gain: 0.04, delay: 0.1 });
                break;
            default:
                break;
        }
    }

    function setMuted(value, persist) {
        muted = !!value;
        if (audio && master) {
            const t = audio.currentTime;
            master.gain.cancelScheduledValues(t);
            master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
            master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.8, t + 0.08);
        }
        if (muted) {
            stopBgm();
            stopRotor();
        } else if (gameActive) {
            startBgm();
            setPhase(lastPhase);
        }
        if (persist !== false) {
            try { window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0'); } catch (e) { /* no-op */ }
        }
        return muted;
    }

    function setGameActive(active) {
        gameActive = !!active;
        if (gameActive && !muted) {
            startBgm();
            setPhase(lastPhase);
        } else {
            stopBgm();
            stopRotor();
        }
    }

    function setPhase(phase) {
        lastPhase = phase || null;
        if (gameActive && !muted && phase === 'ROUND_POLICE') startRotor();
        else stopRotor();
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopBgm();
            stopRotor();
        } else if (gameActive && !muted) {
            startBgm();
            setPhase(lastPhase);
        }
    });

    window.VSPoliceSound = {
        unlock,
        play,
        setMuted,
        isMuted: () => muted,
        toggleMute: () => setMuted(!muted),
        setGameActive,
        setPhase,
    };
})();
