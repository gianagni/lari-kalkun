// Lari Kalkun: tiny WebAudio synth for wing flaps, gobbles, shouts and
// fanfares. No audio files, no network: every sound is an oscillator shaped
// in code, and the context only starts after the first user gesture.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, seconds, type, gain, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + seconds);
    amp.gain.setValueAtTime(gain, ac.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + seconds);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + seconds);
  }

  function noise(seconds, gain, lowpass) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const size = Math.floor(ac.sampleRate * seconds);
    const buffer = ac.createBuffer(1, size, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const amp = ac.createGain();
    amp.gain.setValueAtTime(gain, ac.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + seconds);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(ac.destination);
    source.start();
  }

  return {
    unlock() {
      ensure();
    },
    setMuted(value) {
      muted = value;
    },
    flap() {
      noise(0.12, 0.12, 900);
    },
    jump() {
      tone(320, 0.16, 'sine', 0.12, 640);
    },
    corn() {
      tone(880, 0.09, 'triangle', 0.14);
      setTimeout(() => tone(1320, 0.1, 'triangle', 0.12), 60);
    },
    feather() {
      tone(520, 0.14, 'sine', 0.12, 1040);
      setTimeout(() => tone(1040, 0.16, 'sine', 0.1, 1560), 90);
    },
    pumpkin() {
      tone(392, 0.12, 'triangle', 0.14);
      setTimeout(() => tone(523, 0.12, 'triangle', 0.14), 100);
      setTimeout(() => tone(659, 0.18, 'triangle', 0.14), 200);
    },
    dodge() {
      tone(700, 0.07, 'sine', 0.08, 900);
    },
    crash() {
      noise(0.3, 0.25, 500);
      tone(160, 0.3, 'sawtooth', 0.16, 60);
    },
    shout() {
      tone(220, 0.22, 'square', 0.1, 330);
      setTimeout(() => tone(180, 0.2, 'square', 0.09, 260), 140);
    },
    gobble() {
      tone(300, 0.08, 'square', 0.1, 220);
      setTimeout(() => tone(300, 0.08, 'square', 0.1, 220), 110);
      setTimeout(() => tone(360, 0.12, 'square', 0.1, 240), 220);
    },
    caught() {
      tone(392, 0.2, 'sawtooth', 0.14, 196);
      setTimeout(() => tone(311, 0.2, 'sawtooth', 0.14, 155), 200);
      setTimeout(() => tone(233, 0.4, 'sawtooth', 0.14, 110), 400);
    },
    escaped() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        setTimeout(() => tone(freq, 0.22, 'triangle', 0.15), i * 130);
      });
    },
  };
}
