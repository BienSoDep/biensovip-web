/**
 * Web Audio API Multi-Layer Soundboard Synthesizer for Livestream Studio
 * Zero external MP3 network requests — 0ms latency, offline-safe, OBS Browser Source compatible.
 */

export const LIVE_EFFECT_DECK = [
  {
    code: 'FX_DEAL_CLOSED',
    key: '1',
    fKey: 'F1',
    emoji: '🎉',
    label: 'Chốt Đơn / Đã Cọc',
    subLabel: 'Pháo hoa + Chuông vàng + Reo hò',
    durationMs: 6500,
    accent: '#F59E0B',
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.08))',
    border: '#F59E0B',
  },
  {
    code: 'FX_SUPER_VIP',
    key: '2',
    fKey: 'F2',
    emoji: '🔥',
    label: 'Siêu Phẩm Lên Sóng',
    subLabel: 'Lửa rồng viền vàng + Trống trận',
    durationMs: 6000,
    accent: '#EF4444',
    bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(185, 28, 28, 0.08))',
    border: '#EF4444',
  },
  {
    code: 'FX_FLASH_DISCOUNT',
    key: '3',
    fKey: 'F3',
    emoji: '💰',
    label: 'Giảm Giá Sốc / Lộc Lá',
    subLabel: 'Mưa xu vàng rơi + Tiếng xu nổ hũ',
    durationMs: 5500,
    accent: '#10B981',
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.08))',
    border: '#10B981',
  },
  {
    code: 'FX_APPLAUSE',
    key: '4',
    fKey: 'F4',
    emoji: '👏',
    label: 'Vỗ Tay Cảm Ơn',
    subLabel: 'Tim & Sao bay + Tràng pháo tay',
    durationMs: 5000,
    accent: '#EC4899',
    bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.18), rgba(190, 24, 93, 0.08))',
    border: '#EC4899',
  },
  {
    code: 'FX_VICTORY_HORN',
    key: '5',
    fKey: 'F5',
    emoji: '🎺',
    label: 'Kèn Chiến Thắng',
    subLabel: 'Spotlight hào quang + Kèn Fanfare',
    durationMs: 5000,
    accent: '#6366F1',
    bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(67, 56, 202, 0.08))',
    border: '#6366F1',
  },
  {
    code: 'FX_FUNNY_INTERACT',
    key: '6',
    fKey: 'F6',
    emoji: '😄',
    label: 'Tương Tác Vui Nhộn',
    subLabel: 'Emoji nảy tưng bừng + Âm thanh vui',
    durationMs: 4500,
    accent: '#06B6D4',
    bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(14, 116, 144, 0.08))',
    border: '#06B6D4',
  },
];

let sharedAudioCtx = null;
let activeNodes = [];
let activeTimers = [];

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function stopAllLiveSounds() {
  activeTimers.forEach((id) => clearTimeout(id));
  activeTimers = [];
  activeNodes.forEach((node) => {
    try {
      if (typeof node.stop === 'function') node.stop();
      if (typeof node.disconnect === 'function') node.disconnect();
    } catch {
      // ignore already stopped nodes
    }
  });
  activeNodes = [];
}

function scheduleTimeout(fn, delayMs) {
  const id = setTimeout(fn, delayMs);
  activeTimers.push(id);
  return id;
}

function playTone(ctx, { freq = 440, type = 'sine', start = 0, duration = 0.3, gain = 0.2, slideTo = null }) {
  const now = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
  }
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + Math.min(0.02, duration * 0.2));
  gainNode.gain.exponentialRampToValueAtTime(0.0008, now + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
  activeNodes.push(osc, gainNode);
}

function playNoiseBurst(ctx, { start = 0, duration = 0.25, filterFreq = 1200, filterType = 'bandpass', gain = 0.18 }) {
  const now = ctx.currentTime + start;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, now);
  filter.Q.setValueAtTime(1.5, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + Math.min(0.03, duration * 0.25));
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + duration + 0.02);
  activeNodes.push(noise, filter, gainNode);
}

export function playLiveSoundEffect(effectCode, isMuted = false) {
  if (isMuted) return;
  stopAllLiveSounds();

  const ctx = getAudioContext();
  if (!ctx) return;

  switch (effectCode) {
    case 'FX_DEAL_CLOSED': {
      // Golden Bell "Ting-Ting-Ting" + Celebratory Chord + Fireworks Pops
      const bellNotes = [1046.5, 1318.5, 1567.98, 2093.0];
      bellNotes.forEach((freq, idx) => {
        playTone(ctx, { freq, type: 'triangle', start: idx * 0.11, duration: 0.9, gain: 0.22 });
        playTone(ctx, { freq: freq * 2, type: 'sine', start: idx * 0.11, duration: 0.55, gain: 0.08 });
      });
      // Second chime wave
      [1567.98, 2093.0, 2637.02].forEach((freq, idx) => {
        playTone(ctx, { freq, type: 'sine', start: 0.65 + idx * 0.12, duration: 1.1, gain: 0.18 });
      });
      // Firework pops & sparkle bursts
      for (let i = 0; i < 7; i++) {
        const offset = 0.25 + i * 0.28;
        playNoiseBurst(ctx, {
          start: offset,
          duration: 0.22,
          filterFreq: 900 + i * 220,
          filterType: 'bandpass',
          gain: 0.16,
        });
      }
      break;
    }

    case 'FX_SUPER_VIP': {
      // War Drums (Taiko low punch) + Golden Gong shimmer
      const drumHits = [0, 0.28, 0.56, 0.72, 0.95, 1.25];
      drumHits.forEach((t, i) => {
        playTone(ctx, {
          freq: i === drumHits.length - 1 ? 130 : 110,
          slideTo: 42,
          type: 'sine',
          start: t,
          duration: 0.36,
          gain: 0.34,
        });
        playNoiseBurst(ctx, {
          start: t,
          duration: 0.1,
          filterFreq: 300,
          filterType: 'lowpass',
          gain: 0.18,
        });
      });
      // Gong resonance at 1.25s
      [220, 330, 440, 554.37, 659.25].forEach((freq) => {
        playTone(ctx, {
          freq,
          type: 'sawtooth',
          start: 1.25,
          duration: 1.9,
          gain: 0.07,
        });
      });
      playNoiseBurst(ctx, {
        start: 1.25,
        duration: 1.5,
        filterFreq: 1800,
        filterType: 'bandpass',
        gain: 0.12,
      });
      break;
    }

    case 'FX_FLASH_DISCOUNT': {
      // Rapid Gold Coin Shower / Jackpot cascade
      const coinCount = 14;
      for (let i = 0; i < coinCount; i++) {
        const start = i * 0.09;
        const baseFreq = 1318.5 + (i % 4) * 240;
        playTone(ctx, {
          freq: baseFreq,
          type: 'sine',
          start,
          duration: 0.22,
          gain: 0.15,
        });
        playTone(ctx, {
          freq: baseFreq * 1.5,
          type: 'triangle',
          start: start + 0.03,
          duration: 0.28,
          gain: 0.12,
        });
      }
      break;
    }

    case 'FX_APPLAUSE': {
      // Rhythmic multi-clap bursts + warm thank-you chime
      for (let i = 0; i < 18; i++) {
        const start = i * 0.08 + (Math.random() * 0.03);
        playNoiseBurst(ctx, {
          start,
          duration: 0.09,
          filterFreq: 1350 + (i % 5) * 180,
          filterType: 'bandpass',
          gain: 0.15,
        });
      }
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        playTone(ctx, {
          freq,
          type: 'triangle',
          start: idx * 0.14,
          duration: 0.7,
          gain: 0.14,
        });
      });
      break;
    }

    case 'FX_VICTORY_HORN': {
      // Royal Fanfare Trumpet Chord (C5 - E5 - G5 - C6)
      const fanfare = [
        { freq: 523.25, start: 0, dur: 0.18 },
        { freq: 523.25, start: 0.2, dur: 0.18 },
        { freq: 523.25, start: 0.4, dur: 0.18 },
        { freq: 659.25, start: 0.6, dur: 0.45 },
        { freq: 587.33, start: 1.08, dur: 0.22 },
        { freq: 659.25, start: 1.32, dur: 0.22 },
        { freq: 783.99, start: 1.56, dur: 0.95 },
      ];
      fanfare.forEach((n) => {
        playTone(ctx, {
          freq: n.freq,
          type: 'sawtooth',
          start: n.start,
          duration: n.dur,
          gain: 0.16,
        });
        playTone(ctx, {
          freq: n.freq * 0.5,
          type: 'triangle',
          start: n.start,
          duration: n.dur,
          gain: 0.12,
        });
      });
      break;
    }

    case 'FX_FUNNY_INTERACT': {
      // Playful Boing Slide + Laugh Bounce Arpeggio
      playTone(ctx, {
        freq: 220,
        slideTo: 880,
        type: 'sine',
        start: 0,
        duration: 0.32,
        gain: 0.24,
      });
      playTone(ctx, {
        freq: 300,
        slideTo: 1100,
        type: 'triangle',
        start: 0.36,
        duration: 0.32,
        gain: 0.22,
      });
      const notes = [880, 783.99, 659.25, 587.33, 523.25, 659.25, 880];
      notes.forEach((freq, idx) => {
        playTone(ctx, {
          freq,
          type: 'sine',
          start: 0.72 + idx * 0.09,
          duration: 0.14,
          gain: 0.18,
        });
      });
      break;
    }

    default:
      break;
  }

  scheduleTimeout(() => {
    activeNodes = [];
  }, 6500);
}

