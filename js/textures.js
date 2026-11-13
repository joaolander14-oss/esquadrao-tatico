// Texturas procedurais (canvas) — tudo original, nada de arquivos externos
(function () {
  const T = G.Tex = {};
  const cache = {};

  function mk(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    draw(g, size);
    return c;
  }
  function noise(g, s, amt, alpha, seed) {
    const r = G.U.mulberry(seed || 7);
    const img = g.getImageData(0, 0, s, s), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - 0.5) * amt;
      d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
      if (alpha) d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  function blotches(g, s, n, col, rmin, rmax, seed) {
    const r = G.U.mulberry(seed || 3);
    for (let i = 0; i < n; i++) {
      const x = r() * s, y = r() * s, rad = rmin + r() * (rmax - rmin);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) { g.save(); g.translate(ox, oy); g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.restore(); }
    }
  }

  const defs = {
    doorWood: (g, s) => {
      g.fillStyle = '#6a4424'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(301);
      for (let i = 0; i < 6; i++) { const v = 0.8 + r() * 0.3; g.fillStyle = `rgb(${Math.round(120 * v)},${Math.round(78 * v)},${Math.round(42 * v)})`; g.fillRect(i * s / 6 + 1, 0, s / 6 - 2, s); }
      g.strokeStyle = 'rgba(40,22,10,0.5)'; g.lineWidth = s / 128;
      for (let i = 0; i < 40; i++) { const x = r() * s; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 4, s * 0.3, x - 4, s * 0.6, x + 2, s); g.stroke(); }
      g.fillStyle = '#3a2412'; g.fillRect(0, s * 0.12, s, s * 0.05); g.fillRect(0, s * 0.83, s, s * 0.05);
      g.save(); g.translate(s / 2, s / 2); g.rotate(-0.9); g.fillRect(-s * 0.7, -s * 0.025, s * 1.4, s * 0.05); g.restore();
      noise(g, s, 22, false, 302);
    },
    doorMetal: (g, s) => {
      g.fillStyle = '#4c5a5e'; g.fillRect(0, 0, s, s);
      blotches(g, s, 30, 'rgba(120,70,40,0.35)', s * 0.02, s * 0.1, 311);
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = s / 64; g.strokeRect(s * 0.08, s * 0.08, s * 0.84, s * 0.36); g.strokeRect(s * 0.08, s * 0.54, s * 0.84, s * 0.38);
      g.fillStyle = 'rgba(30,30,30,0.6)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(s * 0.04, s * (0.06 + i * 0.125), s / 90, 0, 7); g.fill(); g.beginPath(); g.arc(s * 0.96, s * (0.06 + i * 0.125), s / 90, 0, 7); g.fill(); }
      noise(g, s, 18, false, 312);
    },
    hazard: (g, s) => {
      g.fillStyle = '#e8b82a'; g.fillRect(0, 0, s, s);
      g.fillStyle = '#1a1a1a'; for (let x = -s; x < s * 2; x += s / 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + s / 8, 0); g.lineTo(x + s / 8 - s, s); g.lineTo(x - s, s); g.fill(); }
      noise(g, s, 20, false, 321);
    },
    sandstone: (g, s) => {
      g.fillStyle = '#c9a46c'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(331), rows = 5, h = s / rows;
      for (let y = 0; y < rows; y++) { let x = -(y % 2) * s / 6; while (x < s) { const w = s / 4 + r() * s / 5, v = 0.85 + r() * 0.22; g.fillStyle = `rgb(${Math.round(205 * v)},${Math.round(168 * v)},${Math.round(112 * v)})`; g.fillRect(x + 2, y * h + 2, w - 4, h - 4); x += w; } }
      blotches(g, s, 30, 'rgba(120,85,45,0.22)', s * 0.03, s * 0.15, 332);
      noise(g, s, 30, false, 333);
    },
    hiero: (g, s) => {
      defs.sandstone(g, s);
      const r = G.U.mulberry(341);
      g.strokeStyle = 'rgba(90,60,30,0.65)'; g.lineWidth = s / 140;
      for (let col = 0; col < 4; col++) for (let row = 0; row < 7; row++) {
        const x = s * (0.12 + col * 0.24), y = s * (0.08 + row * 0.13), k = Math.floor(r() * 5);
        g.beginPath();
        if (k === 0) { g.arc(x, y, s * 0.03, 0, 7); }
        else if (k === 1) { g.moveTo(x - s * 0.03, y + s * 0.03); g.lineTo(x, y - s * 0.03); g.lineTo(x + s * 0.03, y + s * 0.03); g.closePath(); }
        else if (k === 2) { g.moveTo(x - s * 0.035, y); g.quadraticCurveTo(x, y - s * 0.05, x + s * 0.035, y); g.moveTo(x, y); g.lineTo(x, y + s * 0.035); }
        else if (k === 3) { g.rect(x - s * 0.025, y - s * 0.03, s * 0.05, s * 0.06); g.moveTo(x - s * 0.025, y); g.lineTo(x + s * 0.025, y); }
        else { for (let q = 0; q < 3; q++) { g.moveTo(x - s * 0.03, y - s * 0.02 + q * s * 0.02); g.lineTo(x + s * 0.03, y - s * 0.02 + q * s * 0.02); } }
        g.stroke();
      }
      g.strokeStyle = 'rgba(90,60,30,0.4)'; for (let col = 1; col < 4; col++) { g.beginPath(); g.moveTo(s * col * 0.24, 0); g.lineTo(s * col * 0.24, s); g.stroke(); }
    },
    steelPlate: (g, s) => {
      g.fillStyle = '#6d7377'; g.fillRect(0, 0, s, s);
      const n = 12, w = s / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        g.save(); g.translate(x * w + w / 2, y * w + w / 2); g.rotate((x + y) % 2 ? 0.7 : -0.7);
        g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(-w * 0.32, -w * 0.07, w * 0.64, w * 0.1);
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-w * 0.32, w * 0.03, w * 0.64, w * 0.06); g.restore();
      }
      blotches(g, s, 20, 'rgba(110,70,40,0.3)', s * 0.03, s * 0.12, 351);
      noise(g, s, 16, false, 352);
    },
    rail: (g, s) => {
      g.fillStyle = '#5a5550'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(361);
      for (let i = 0; i < 2600; i++) { const v = 70 + r() * 80; g.fillStyle = `rgb(${v},${v - 4},${v - 8})`; g.fillRect(r() * s, r() * s, 2 + r() * 3, 2 + r() * 3); }
      for (let y = 0; y < s; y += s / 5) { g.fillStyle = '#4a3422'; g.fillRect(0, y + s * 0.03, s, s * 0.09); }
      g.fillStyle = '#8a8d90'; g.fillRect(s * 0.22, 0, s * 0.05, s); g.fillRect(s * 0.73, 0, s * 0.05, s);
      g.fillStyle = '#3c3e40'; g.fillRect(s * 0.215, 0, s * 0.012, s); g.fillRect(s * 0.725, 0, s * 0.012, s);
      noise(g, s, 18, false, 362);
    },
    plaster: (g, s) => {
      g.fillStyle = '#d9c296'; g.fillRect(0, 0, s, s);
      blotches(g, s, 40, 'rgba(150,115,70,0.18)', 10, 60, 11);
      blotches(g, s, 30, 'rgba(255,240,210,0.18)', 10, 50, 12);
      noise(g, s, 26, false, 13);
      // rachaduras
      const r = G.U.mulberry(14);
      g.strokeStyle = 'rgba(90,65,40,0.35)'; g.lineWidth = 1;
      for (let i = 0; i < 7; i++) { let x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 30; y += r() * 18; g.lineTo(x, y); } g.stroke(); }
      // blocos de adobe sutis
      g.strokeStyle = 'rgba(120,90,55,0.12)';
      for (let y = 0; y < s; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < s; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
    },
    sand: (g, s) => {
      g.fillStyle = '#cfae78'; g.fillRect(0, 0, s, s);
      blotches(g, s, 50, 'rgba(160,120,70,0.25)', 8, 50, 21);
      blotches(g, s, 40, 'rgba(240,215,170,0.25)', 8, 40, 22);
      noise(g, s, 40, false, 23);
      const r = G.U.mulberry(24);
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${90 + r() * 60},${70 + r() * 40},${40 + r() * 30},${0.4 + r() * 0.4})`; const z = 1 + r() * 2.5; g.fillRect(r() * s, r() * s, z, z); }
    },
    tiles: (g, s) => {
      g.fillStyle = '#b9a07a'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(31), n = 4, w = s / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const v = 160 + r() * 40;
        g.fillStyle = `rgb(${v + 20},${v},${v - 35})`;
        g.fillRect(x * w + 2, y * w + 2, w - 4, w - 4);
      }
      blotches(g, s, 30, 'rgba(110,85,55,0.25)', 6, 30, 32);
      noise(g, s, 24, false, 33);
      g.strokeStyle = 'rgba(70,55,35,0.6)'; g.lineWidth = 3;
      for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * w, 0); g.lineTo(i * w, s); g.stroke(); g.beginPath(); g.moveTo(0, i * w); g.lineTo(s, i * w); g.stroke(); }
    },
    stone: (g, s) => {
      g.fillStyle = '#a89070'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(41);
      const rows = 6, h = s / rows;
      for (let y = 0; y < rows; y++) {
        let x = -(y % 2) * 30;
        while (x < s) {
          const w = 40 + r() * 50, v = 130 + r() * 50;
          g.fillStyle = `rgb(${v + 25},${v + 8},${v - 25})`;
          g.fillRect(x + 2, y * h + 2, w - 4, h - 4);
          x += w;
        }
      }
      noise(g, s, 30, false, 42);
    },
    wood: (g, s) => {
      g.fillStyle = '#8a6236'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(51);
      const planks = 4, ph = s / planks;
      for (let i = 0; i < planks; i++) {
        const v = 120 + r() * 40;
        g.fillStyle = `rgb(${v + 30},${v - 5},${v - 50})`;
        g.fillRect(0, i * ph + 2, s, ph - 4);
        g.strokeStyle = 'rgba(60,35,15,0.35)';
        for (let k = 0; k < 9; k++) { g.beginPath(); const yy = i * ph + 4 + r() * (ph - 8); g.moveTo(0, yy); g.bezierCurveTo(s * 0.3, yy + (r() - 0.5) * 6, s * 0.6, yy + (r() - 0.5) * 6, s, yy); g.stroke(); }
      }
      // moldura e cruz da caixa
      g.fillStyle = '#5b3d1f';
      g.fillRect(0, 0, s, 14); g.fillRect(0, s - 14, s, 14); g.fillRect(0, 0, 14, s); g.fillRect(s - 14, 0, 14, s);
      g.save(); g.translate(s / 2, s / 2); g.rotate(Math.PI / 4); g.fillRect(-s * 0.72, -7, s * 1.44, 14); g.restore();
      noise(g, s, 22, false, 52);
    },
    planks: (g, s) => {
      g.fillStyle = '#6e4a2a'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(61);
      for (let i = 0; i < 8; i++) { const v = 90 + r() * 40; g.fillStyle = `rgb(${v + 25},${v - 5},${v - 40})`; g.fillRect(i * s / 8 + 1, 0, s / 8 - 2, s); }
      noise(g, s, 26, false, 62);
    },
    metal: (g, s) => {
      g.fillStyle = '#5f6a6e'; g.fillRect(0, 0, s, s);
      blotches(g, s, 30, 'rgba(120,70,40,0.35)', 6, 26, 71);
      noise(g, s, 20, false, 72);
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let y = 0; y < s; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
    },
    concrete: (g, s) => {
      g.fillStyle = '#a7a196'; g.fillRect(0, 0, s, s);
      blotches(g, s, 40, 'rgba(80,75,65,0.2)', 6, 40, 81);
      noise(g, s, 34, false, 82);
    },
    roofTop: (g, s) => {
      g.fillStyle = '#9b7a52'; g.fillRect(0, 0, s, s);
      noise(g, s, 30, false, 91);
    },
    brick: (g, s) => {
      g.fillStyle = '#6e5a4c'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(121), rows = 8, h = s / rows, w = s / 4;
      for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
        const v = 0.75 + r() * 0.35;
        g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(72 * v)},${Math.round(52 * v)})`;
        g.fillRect(x * w + (y % 2) * w / 2 + 2, y * h + 2, w - 4, h - 4);
      }
      blotches(g, s, 25, 'rgba(40,25,20,0.2)', 8, 40, 122);
      noise(g, s, 26, false, 123);
    },
    cobble: (g, s) => {
      g.fillStyle = '#4b4743'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(131);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const v = 95 + r() * 55, cx = x * s / 8 + s / 16 + (r() - 0.5) * 4, cy = y * s / 8 + s / 16 + (r() - 0.5) * 4;
        g.fillStyle = `rgb(${v + 8},${v + 2},${v - 6})`;
        g.beginPath(); g.ellipse(cx, cy, s / 18 + r() * 2, s / 19 + r() * 2, r() * 3, 0, 7); g.fill();
      }
      noise(g, s, 24, false, 132);
    },
    paving: (g, s) => {
      g.fillStyle = '#b8a48a'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(141), n = 4, w = s / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = 170 + r() * 40; g.fillStyle = `rgb(${v + 10},${v - 8},${v - 30})`; g.fillRect(x * w + 2, y * w + 2, w - 4, w - 4); }
      noise(g, s, 20, false, 142);
    },
    asphalt: (g, s) => {
      g.fillStyle = '#3d3f42'; g.fillRect(0, 0, s, s);
      blotches(g, s, 40, 'rgba(20,20,22,0.35)', 8, 40, 151);
      blotches(g, s, 20, 'rgba(120,120,115,0.15)', 6, 30, 152);
      noise(g, s, 40, false, 153);
      g.fillStyle = 'rgba(220,190,60,0.55)'; g.fillRect(0, s * 0.48, s * 0.4, s * 0.04);
    },
    snow: (g, s) => {
      g.fillStyle = '#e9eef3'; g.fillRect(0, 0, s, s);
      blotches(g, s, 40, 'rgba(170,190,210,0.25)', 8, 50, 161);
      blotches(g, s, 30, 'rgba(255,255,255,0.5)', 6, 30, 162);
      noise(g, s, 14, false, 163);
    },
    roofSnow: (g, s) => {
      g.fillStyle = '#f1f4f7'; g.fillRect(0, 0, s, s);
      blotches(g, s, 30, 'rgba(160,175,190,0.25)', 8, 40, 171);
      noise(g, s, 10, false, 172);
    },
    stoneWall: (g, s) => {
      g.fillStyle = '#5e5f60'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(181);
      for (let i = 0; i < 46; i++) {
        const v = 110 + r() * 60, x = r() * s, y = r() * s, w = 18 + r() * 34, h = 14 + r() * 18;
        g.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
        g.beginPath(); g.ellipse(x, y, w / 2, h / 2, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(30,30,30,0.45)'; g.stroke();
      }
      noise(g, s, 26, false, 182);
    },
    corrugated: (g, s) => {
      g.fillStyle = '#8b9196'; g.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, 'rgba(0,0,0,0.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.28)'); g.fillStyle = gr; g.fillRect(x, 0, 16, s); }
      blotches(g, s, 25, 'rgba(120,70,40,0.35)', 6, 30, 191);
      noise(g, s, 18, false, 192);
    },
    container: (g, s) => {
      g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 12) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, 0, 3, s); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 6, 0, 2, s); }
      blotches(g, s, 18, 'rgba(90,50,30,0.35)', 5, 24, 201);
      noise(g, s, 16, false, 202);
    },
    terracotta: (g, s) => {
      g.fillStyle = '#a0573a'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(211), n = 4, w = s / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = 0.8 + r() * 0.3; g.fillStyle = `rgb(${Math.round(180 * v)},${Math.round(95 * v)},${Math.round(62 * v)})`; g.fillRect(x * w + 2, y * w + 2, w - 4, w - 4); }
      noise(g, s, 18, false, 212);
    },
    roofRed: (g, s) => {
      g.fillStyle = '#8a3b26'; g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 16) for (let x = 0; x < s; x += 16) { const gr = g.createRadialGradient(x + 8, y + 4, 1, x + 8, y + 8, 10); gr.addColorStop(0, '#b25a3c'); gr.addColorStop(1, '#6e2b1a'); g.fillStyle = gr; g.fillRect(x + ((y / 16) % 2) * 8, y, 15, 15); }
      noise(g, s, 16, false, 222);
    },
    grate: (g, s) => {
      g.fillStyle = '#2c3034'; g.fillRect(0, 0, s, s);
      g.strokeStyle = '#6c757c'; g.lineWidth = 3;
      for (let i = -s; i < s * 2; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke(); g.beginPath(); g.moveTo(i + s, 0); g.lineTo(i, s); g.stroke(); }
      noise(g, s, 14, false, 231);
    },
    darkTiles: (g, s) => {
      g.fillStyle = '#5c6066'; g.fillRect(0, 0, s, s);
      const r = G.U.mulberry(241), n = 4, w = s / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = 95 + r() * 35; g.fillStyle = `rgb(${v},${v + 4},${v + 10})`; g.fillRect(x * w + 2, y * w + 2, w - 4, w - 4); }
      g.fillStyle = 'rgba(230,200,40,0.6)'; g.fillRect(0, 0, s, 6);
      noise(g, s, 18, false, 242);
    },
    car: (g, s) => {
      g.fillStyle = '#7a8f6b'; g.fillRect(0, 0, s, s);
      blotches(g, s, 40, 'rgba(110,60,30,0.45)', 6, 30, 101);
      noise(g, s, 18, false, 102);
    },
    cloth: (g, s) => {
      g.fillStyle = '#9a3b2f'; g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 16) { g.fillStyle = y % 32 ? 'rgba(255,220,160,0.25)' : 'rgba(0,0,0,0.1)'; g.fillRect(0, y, s, 8); }
      noise(g, s, 18, false, 111);
    },
    smoke: (g, s) => {
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    },
    fire: (g, s) => {
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(255,250,200,1)'); gr.addColorStop(0.35, 'rgba(255,160,40,0.9)'); gr.addColorStop(1, 'rgba(255,60,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    },
    flashSprite: (g, s) => {
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.2, 'rgba(255,220,120,0.9)'); gr.addColorStop(1, 'rgba(255,140,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      g.strokeStyle = 'rgba(255,240,180,0.9)'; g.lineWidth = 3;
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(s / 2, s / 2); g.lineTo(s / 2 + Math.cos(a) * s * 0.48, s / 2 + Math.sin(a) * s * 0.48); g.stroke(); }
    },
    decal: (g, s) => {
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(15,10,5,1)'); gr.addColorStop(0.35, 'rgba(30,22,12,0.85)'); gr.addColorStop(1, 'rgba(40,30,20,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    },
    blood: (g, s) => {
      const r = G.U.mulberry(5);
      for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${110 + r() * 40},0,0,${0.5 + r() * 0.5})`; g.beginPath(); g.arc(s / 2 + (r() - 0.5) * s * 0.6, s / 2 + (r() - 0.5) * s * 0.6, 2 + r() * s * 0.15, 0, 7); g.fill(); }
    }
  };

  // texturas de superfície recebem sujeira em várias escalas na versão de alta resolução
  const SURF = new Set(['plaster', 'sand', 'tiles', 'stone', 'planks', 'concrete', 'roofTop', 'brick', 'cobble', 'paving', 'asphalt', 'snow', 'roofSnow', 'stoneWall', 'corrugated', 'terracotta', 'roofRed', 'darkTiles', 'sandstone', 'hiero', 'steelPlate', 'rail', 'grate']);
  function detail(g, s, name) {
    const seed = name.length * 97 + name.charCodeAt(0);
    blotches(g, s, 18, 'rgba(30,22,14,0.10)', s * 0.06, s * 0.22, seed);          // manchas grandes
    blotches(g, s, 60, 'rgba(25,18,10,0.10)', s * 0.008, s * 0.03, seed + 1);     // pontos de sujeira
    blotches(g, s, 30, 'rgba(255,250,235,0.07)', s * 0.01, s * 0.05, seed + 2);   // desgaste claro
    noise(g, s, 14, false, seed + 3);
  }
  T.canvas = (name, size) => {
    const key = name + ':' + (size || 256);
    if (!cache[key]) cache[key] = mk(size || 256, (g, s) => { defs[name](g, s); if (s >= 512 && SURF.has(name)) detail(g, s, name); });
    return cache[key];
  };
  T.get = (name, size) => {
    const key = 'tex:' + name + ':' + (size || 256);
    if (!cache[key]) {
      const t = new THREE.CanvasTexture(T.canvas(name, size));
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      cache[key] = t;
    }
    return cache[key];
  };
  // relevo: usa a própria textura como mapa de altura (canal vermelho)
  T.bump = (name, size) => T.get(name, size);
  const BUMP = { brick: 0.09, cobble: 0.1, stoneWall: 0.12, sandstone: 0.07, hiero: 0.08, stone: 0.07, tiles: 0.05, paving: 0.05, terracotta: 0.05, corrugated: 0.08, steelPlate: 0.06, planks: 0.05, roofRed: 0.08, grate: 0.06, rail: 0.08 };
  T.bumpScale = name => BUMP[name] || 0.035;
  const SHINE = { tiles: 22, darkTiles: 24, steelPlate: 40, corrugated: 18, asphalt: 6, snow: 16, roofSnow: 14, terracotta: 14, paving: 12 };
  T.shine = name => SHINE[name] || 6;
  // letreiro de bombsite pintado com spray
  T.siteLetter = (letter) => {
    const c = mk(256, (g, s) => {
      g.clearRect(0, 0, s, s);
      g.font = '900 200px Impact, Arial Black, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(190,30,20,0.85)';
      g.fillText(letter, s / 2, s / 2 + 10);
      const r = G.U.mulberry(letter.charCodeAt(0));
      for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(190,30,20,' + r() * 0.5 + ')'; g.fillRect(s / 2 + (r() - 0.5) * s * 0.8, s / 2 + (r() - 0.5) * s * 0.8, 2, 2); }
    });
    const t = new THREE.CanvasTexture(c);
    return t;
  };
  T.textSign = (text, bg, fg) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, 496, 112);
    g.fillStyle = fg; g.font = '800 64px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 256, 68);
    return new THREE.CanvasTexture(c);
  };
})();
