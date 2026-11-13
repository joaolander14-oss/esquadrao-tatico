// Áudio sintetizado com WebAudio (sem arquivos)
(function () {
  const A = G.Audio = {};
  let ctx = null, master = null, noiseBuf = null, rev = null;
  const lp = { x: 0, y: 0, z: 0 };
  A.volume = 0.7;
  A.init = () => {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = A.volume; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.disconnect(); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // reverberação (eco do disparo): resposta ao impulso de ruído que decai
    const irLen = Math.floor(ctx.sampleRate * 1.5), ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < irLen; i++) { const k = i / irLen; ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 3.4) * Math.min(1, i / 300); } }
    rev = ctx.createConvolver(); rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = 0.55; rev.connect(rg); rg.connect(master);
  };
  A.setVolume = v => { A.volume = v; if (master) master.gain.value = v; };
  A.listener = (pos, yaw) => {
    if (!ctx) return;
    lp.x = pos.x; lp.y = pos.y; lp.z = pos.z;
    const L = ctx.listener, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    if (L.positionX) {
      L.positionX.value = pos.x; L.positionY.value = pos.y; L.positionZ.value = pos.z;
      L.forwardX.value = fx; L.forwardY.value = 0; L.forwardZ.value = fz; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(pos.x, pos.y, pos.z); L.setOrientation(fx, 0, fz, 0, 1, 0); }
  };
  function out(pos, gain) {
    const g = ctx.createGain(); g.gain.value = gain;
    if (pos) {
      const p = ctx.createPanner();
      p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = 4; p.rolloff = 1; p.rolloffFactor = 1.1; p.maxDistance = 200;
      if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z);
      g.connect(p); p.connect(master);
    } else g.connect(master);
    return g;
  }
  function noise(dest, t0, dur, type, freq, q, attack, decay, vol) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + attack + decay + 0.05);
    return f;
  }
  function tone(dest, t0, type, f0, f1, dur, vol, attack) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t0); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  // Tiro realista em camadas: estalo agudo + corpo + soco médio + pancada grave + cauda de reverb.
  // Longe: atraso do som (343 m/s), agudos absorvidos e menos reverb; cada arma tem um timbre próprio (derivado do id).
  const PROF = {
    pistol: { crack: 3400, body: 3000, th: [175, 58, 0.09], mid: 1150, dec: 0.1, wet: 0.35, vol: 0.85 },
    smg: { crack: 3000, body: 3200, th: [150, 50, 0.1], mid: 1000, dec: 0.11, wet: 0.4, vol: 0.85 },
    rifle: { crack: 2200, body: 3600, th: [120, 40, 0.16], mid: 820, dec: 0.19, wet: 0.65, vol: 1.0 },
    sniper: { crack: 1800, body: 2800, th: [80, 28, 0.4], mid: 600, dec: 0.36, wet: 1.0, vol: 1.25 },
    heavy: { crack: 1600, body: 2400, th: [95, 35, 0.26], mid: 520, dec: 0.3, wet: 0.75, vol: 1.15 }
  };
  A.shot = (def, pos, silenced, isLocal) => {
    if (!ctx) return;
    const dist = (!isLocal && pos) ? Math.hypot(pos.x - lp.x, pos.y - lp.y, pos.z - lp.z) : 0;
    const t = ctx.currentTime + Math.min(0.45, dist / 343);
    const d0 = out(isLocal ? null : pos, isLocal ? 0.6 : 1.0);
    const d = ctx.createBiquadFilter(); d.type = 'lowpass'; d.frequency.value = Math.max(900, 15000 / (1 + dist / 22)); d.connect(d0);
    const cat = def.cat;
    if (def.id === 'taser') { noise(d, t, 0.3, 'highpass', 3000, 1, 0.002, 0.25, 0.5); tone(d, t, 'sawtooth', 120, 90, 0.25, 0.2); return; }
    if (silenced) {
      noise(d, t, 0.14, 'bandpass', 2300, 0.9, 0.002, 0.1, 0.4); noise(d, t, 0.1, 'lowpass', 900, 0.7, 0.002, 0.06, 0.45);
      tone(d, t, 'sine', 210, 90, 0.06, 0.18); tone(d, t + 0.025, 'square', 2400, 1600, 0.012, 0.05); return;
    }
    let h = 0; for (let i = 0; i < def.id.length; i++) h = (h * 31 + def.id.charCodeAt(i)) | 0;
    const sig = (0.92 + ((h >>> 0) % 100) / 600) * (0.97 + Math.random() * 0.06);
    const p = PROF[cat] || PROF.rifle;
    noise(d, t, 0.05, 'highpass', p.crack * sig, 0.7, 0.0008, 0.02, 1.0 * p.vol);                       // estalo
    noise(d, t, 0.4, 'lowpass', p.body * sig, 0.6, 0.001, p.dec, 0.9 * p.vol);                          // corpo
    noise(d, t, 0.4, 'bandpass', p.mid * sig, 0.8, 0.002, p.dec * 1.2, 0.55 * p.vol);                   // soco médio
    tone(d, t, 'sine', p.th[0] * sig, p.th[1], p.th[2], 0.7 * p.vol, 0.002);                            // pancada grave
    tone(d, t, 'triangle', p.th[0] * 2 * sig, p.th[1] * 2, p.th[2] * 0.5, 0.22 * p.vol, 0.001);
    if (def.pellets > 1) { noise(d, t + 0.03, 0.3, 'bandpass', 480, 0.7, 0.004, 0.22, 0.5); tone(d, t + 0.02, 'sine', 70, 35, 0.2, 0.35); }
    if (cat === 'sniper') { noise(d, t + 0.2, 0.5, 'lowpass', 700, 0.5, 0.02, 0.35, 0.18); noise(d, t + 0.38, 0.5, 'lowpass', 500, 0.5, 0.03, 0.4, 0.1); }   // eco distante
    if (rev) { const send = ctx.createGain(); send.gain.value = p.wet * (isLocal ? 0.55 : Math.max(0.12, 1 - dist / 130)) * 0.7; noise(send, t, 0.4, 'lowpass', 2600, 0.6, 0.002, 0.16, 0.8); send.connect(rev); }
  };
  A.step = (pos, vol, surface) => {
    if (!ctx) return;
    const t = ctx.currentTime, d = out(pos, vol);
    if (surface === 'water') { noise(d, t, 0.2, 'bandpass', 900, 0.6, 0.01, 0.18, 0.6); noise(d, t + 0.05, 0.15, 'highpass', 3000, 0.7, 0.01, 0.12, 0.3); return; }
    noise(d, t, 0.08, 'bandpass', surface === 'wood' ? 500 : 1200, 1.2, 0.004, 0.07, 0.5);
  };
  A.door = (pos, kind) => {
    if (!ctx) return;
    const t = ctx.currentTime, d = out(pos, 0.9);
    if (kind === 'gate') { noise(d, t, 2.2, 'lowpass', 300, 0.8, 0.1, 2.0, 0.7); tone(d, t, 'sawtooth', 55, 50, 2.0, 0.12, 0.2); for (let i = 0; i < 6; i++) tone(d, t + i * 0.3, 'square', 180, 160, 0.05, 0.08); return; }
    if (kind === 'metal') { tone(d, t, 'square', 220, 140, 0.25, 0.25); noise(d, t, 0.3, 'bandpass', 1500, 2, 0.005, 0.25, 0.4); return; }
    tone(d, t, 'sawtooth', 120, 90, 0.5, 0.12, 0.05); tone(d, t + 0.1, 'sawtooth', 300, 220, 0.35, 0.06, 0.05); noise(d, t + 0.35, 0.15, 'lowpass', 600, 1, 0.005, 0.12, 0.5);
  };
  A.splash = pos => { if (!ctx) return; const t = ctx.currentTime, d = out(pos, 1.0); noise(d, t, 0.9, 'lowpass', 1400, 0.7, 0.01, 0.8, 0.9); noise(d, t + 0.05, 0.5, 'bandpass', 2400, 1, 0.01, 0.4, 0.5); tone(d, t, 'sine', 180, 60, 0.5, 0.3); };
  A.glass = pos => {
    if (!ctx) return; const t = ctx.currentTime, d = out(pos, 1.0);
    noise(d, t, 0.5, 'highpass', 2600, 0.6, 0.002, 0.45, 0.9); noise(d, t, 0.2, 'bandpass', 900, 1, 0.002, 0.15, 0.6);
    for (let i = 0; i < 9; i++) tone(d, t + 0.03 + Math.random() * 0.45, 'sine', 2600 + Math.random() * 3800, 2200 + Math.random() * 2600, 0.06 + Math.random() * 0.08, 0.18);
  };
  A.windowSlide = (pos, open) => {
    if (!ctx) return; const t = ctx.currentTime, d = out(pos, 0.8);
    noise(d, t, 0.45, 'bandpass', open ? 1100 : 800, 2, 0.04, 0.4, 0.45); tone(d, t, 'sawtooth', open ? 380 : 300, open ? 520 : 240, 0.4, 0.05, 0.05);
    noise(d, t + 0.42, 0.08, 'lowpass', 700, 1, 0.003, 0.07, 0.6);
  };
  A.land = pos => { if (!ctx) return; const t = ctx.currentTime, d = out(pos, 0.6); noise(d, t, 0.15, 'lowpass', 500, 1, 0.004, 0.14, 0.7); };
  A.click = (vol) => { if (!ctx) return; const t = ctx.currentTime, d = out(null, vol || 0.3); tone(d, t, 'square', 1800, 1200, 0.03, 0.4); };
  A.reload = (dur) => {
    if (!ctx) return;
    const t = ctx.currentTime, d = out(null, 0.35);
    tone(d, t + 0.1, 'square', 900, 500, 0.04, 0.4); noise(d, t + 0.12, 0.05, 'bandpass', 3000, 2, 0.002, 0.05, 0.4);
    tone(d, t + dur * 0.6, 'square', 1300, 700, 0.04, 0.4); noise(d, t + dur * 0.6, 0.05, 'bandpass', 2500, 2, 0.002, 0.05, 0.5);
    tone(d, t + dur * 0.9, 'square', 700, 1100, 0.05, 0.4);
  };
  A.shell = () => { if (!ctx) return; const t = ctx.currentTime, d = out(null, 0.3); noise(d, t, 0.05, 'bandpass', 1800, 3, 0.002, 0.05, 0.4); tone(d, t, 'square', 600, 400, 0.04, 0.2); };
  A.bolt = () => { if (!ctx) return; const t = ctx.currentTime, d = out(null, 0.3); tone(d, t + 0.25, 'square', 500, 900, 0.05, 0.4); tone(d, t + 0.55, 'square', 1000, 600, 0.05, 0.4); };
  A.hit = (pos, head, helmet) => {
    if (!ctx) return;
    const t = ctx.currentTime, d = out(pos, 0.8);
    if (head && helmet) { tone(d, t, 'triangle', 2600, 2200, 0.25, 0.4); tone(d, t, 'sine', 4100, 3900, 0.2, 0.2); }
    else if (head) { tone(d, t, 'triangle', 1400, 500, 0.12, 0.4); noise(d, t, 0.1, 'lowpass', 800, 1, 0.002, 0.1, 0.6); }
    else noise(d, t, 0.1, 'lowpass', 700, 1, 0.002, 0.09, 0.7);
  };
  A.hitConfirm = (head) => { if (!ctx) return; const t = ctx.currentTime, d = out(null, 0.25); tone(d, t, 'sine', head ? 1700 : 1100, head ? 1700 : 1100, 0.06, 0.4); };
  A.hitsound = kind => {
    if (!ctx) return;
    const t = ctx.currentTime, d = out(null, 0.45);
    if (kind === 'sino') { tone(d, t, 'sine', 1568, 1568, 0.5, 0.5); tone(d, t, 'sine', 2093, 2093, 0.4, 0.25); }
    else if (kind === 'metal') { tone(d, t, 'square', 900, 700, 0.08, 0.35); noise(d, t, 0.1, 'highpass', 4000, 1, 0.001, 0.08, 0.4); }
    else if (kind === 'bolha') tone(d, t, 'sine', 300, 1200, 0.12, 0.5);
    else tone(d, t, 'triangle', 2500, 2500, 0.05, 0.5);
  };
  A.knife = (pos) => { if (!ctx) return; const t = ctx.currentTime, d = out(pos, 0.5); noise(d, t, 0.2, 'bandpass', 2200, 0.7, 0.03, 0.15, 0.4); };
  A.beep = (pos, hi) => { if (!ctx) return; const t = ctx.currentTime, d = out(pos, 0.8); tone(d, t, 'sine', hi ? 2400 : 1650, hi ? 2400 : 1650, 0.11, 0.5); };
  A.key = () => { if (!ctx) return; const t = ctx.currentTime, d = out(null, 0.25); tone(d, t, 'sine', 900 + Math.random() * 800, 1000, 0.06, 0.5); };
  A.explosion = (pos, big) => {
    if (!ctx) return;
    const t = ctx.currentTime, d = out(pos, big ? 2.2 : 1.4);
    noise(d, t, 2, 'lowpass', big ? 500 : 900, 0.6, 0.005, big ? 2.5 : 1.2, 1);
    noise(d, t, 0.4, 'bandpass', 2000, 0.6, 0.002, 0.3, 0.6);
    tone(d, t, 'sine', 90, 25, big ? 1.8 : 0.9, 0.9);
  };
  A.bounce = pos => { if (!ctx) return; const t = ctx.currentTime, d = out(pos, 0.5); tone(d, t, 'triangle', 700 + Math.random() * 300, 400, 0.06, 0.4); };
  A.pin = () => { if (!ctx) return; const t = ctx.currentTime, d = out(null, 0.3); tone(d, t, 'triangle', 2400, 2600, 0.08, 0.3); };
  A.smoke = pos => { if (!ctx) return; const t = ctx.currentTime, d = out(pos, 0.6); noise(d, t, 3, 'highpass', 2500, 0.5, 0.2, 3.5, 0.5); };
  A.fire = pos => { if (!ctx) return; const t = ctx.currentTime, d = out(pos, 0.5); noise(d, t, 0.6, 'bandpass', 700, 0.6, 0.05, 0.5, 0.5); };
  A.flashRing = (strength) => {
    if (!ctx) return;
    const t = ctx.currentTime, d = out(null, 0.35 * strength);
    tone(d, t, 'sine', 3300, 3200, 1 + 3 * strength, 0.4, 0.02);
  };
  A.ui = (kind) => {
    if (!ctx) return;
    const t = ctx.currentTime, d = out(null, 0.35);
    if (kind === 'buy') { tone(d, t, 'triangle', 700, 900, 0.07, 0.4); tone(d, t + 0.06, 'triangle', 1100, 1300, 0.08, 0.4); }
    else if (kind === 'deny') tone(d, t, 'square', 220, 180, 0.15, 0.25);
    else if (kind === 'start') { tone(d, t, 'triangle', 520, 520, 0.15, 0.4); tone(d, t + 0.15, 'triangle', 780, 780, 0.25, 0.4); }
    else if (kind === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(d, t + i * 0.12, 'triangle', f, f, 0.3, 0.4)); }
    else if (kind === 'lose') { [392, 330, 262].forEach((f, i) => tone(d, t + i * 0.16, 'triangle', f, f, 0.35, 0.4)); }
    else if (kind === 'planted') { tone(d, t, 'sawtooth', 300, 300, 0.4, 0.2); tone(d, t + 0.45, 'sawtooth', 300, 300, 0.4, 0.2); }
  };
})();
