// Móveis, máquinas e equipamentos de fábrica/usina (modelos originais feitos de primitivas, mesclados por material).
// Origem no chão, no centro do "pé"; a frente olha para +z; largura em x, profundidade em z.
// G.Furn.make(tipo, opts) → THREE.Group;  G.Furn.dims[tipo] = [largura, profundidade, altura, penetração]
(function () {
  const F = G.Furn = {};
  const anim = F.anim = [];          // peças animadas (ventiladores, vapor)
  const MC = {};
  const lam = (key, o) => MC[key] || (MC[key] = new THREE.MeshLambertMaterial(o));
  const T = (n) => G.Tex.get(n, 128);
  const mt = {
    steel: () => lam('steel', { color: 0x9aa0a6, map: T('metal') }),
    dark: () => lam('dark', { color: 0x2a2c30, map: T('metal') }),
    black: () => lam('black', { color: 0x151618 }),
    yellow: () => lam('yellow', { color: 0xd8a72a, map: T('metal') }),
    green: () => lam('green', { color: 0x3c6a4a, map: T('metal') }),
    blue: () => lam('blue', { color: 0x2f5f8f, map: T('metal') }),
    grey: () => lam('grey', { color: 0xc4c8cc, map: T('metal') }),
    red: () => lam('red', { color: 0xa8302a, map: T('metal') }),
    orange: () => lam('orange', { color: 0xd8652a, map: T('metal') }),
    white: () => lam('white', { color: 0xf0eeea }),
    ceramic: () => lam('ceramic', { color: 0x8a5a3a }),
    wood: () => lam('wood', { color: 0xffffff, map: T('wood') }),
    planks: () => lam('planks', { color: 0xd8c8b0, map: T('planks') }),
    card: () => lam('card', { color: 0xc8a070, map: T('wood') }),
    concrete: () => lam('concrete', { color: 0xc8c4bc, map: T('concrete') }),
    hazard: () => lam('hazard', { map: G.Tex.get('hazard', 128) }),
    cloth: (c) => lam('cloth' + c, { color: c, map: T('cloth') }),
    glow: (c) => MC['g' + c] || (MC['g' + c] = new THREE.MeshBasicMaterial({ color: c })),
    glass: () => MC.glass || (MC.glass = new THREE.MeshLambertMaterial({ color: 0x1c2a34 }))
  };
  // ----- montagem: peças → uma malha por material -----
  function Part() { this.list = []; this.loose = []; }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();
  Part.prototype.add = function (geo, mat, x, y, z, rx, ry, rz) { this.list.push({ geo, mat, x, y, z, rx: rx || 0, ry: ry || 0, rz: rz || 0 }); return this; };
  Part.prototype.box = function (mat, w, h, d, x, y, z, rx, ry, rz) { return this.add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz); };
  Part.prototype.cyl = function (mat, rt, rb, h, x, y, z, rx, ry, rz, seg) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg || 14), mat, x, y, z, rx, ry, rz); };
  Part.prototype.tor = function (mat, r, t, x, y, z, rx, ry, rz) { return this.add(new THREE.TorusGeometry(r, t, 6, 16), mat, x, y, z, rx, ry, rz); };
  Part.prototype.sph = function (mat, r, x, y, z, sx, sy, sz) { const g = new THREE.SphereGeometry(r, 12, 8); g.scale(sx || 1, sy || 1, sz || 1); return this.add(g, mat, x, y, z); };
  Part.prototype.finish = function () {
    const groups = new Map();
    for (const it of this.list) {
      let g = it.geo.index ? it.geo.toNonIndexed() : it.geo;
      _e.set(it.rx, it.ry, it.rz); _q.setFromEuler(_e); _p.set(it.x, it.y, it.z); _m.compose(_p, _q, _s);
      g.applyMatrix4(_m);
      if (!groups.has(it.mat)) groups.set(it.mat, []);
      groups.get(it.mat).push(g);
    }
    const root = new THREE.Group();
    for (const [mat, gs] of groups) {
      let n = 0; for (const g of gs) n += g.attributes.position.count;
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2); let o = 0;
      for (const g of gs) {
        P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3);
        if (g.attributes.uv) UV.set(g.attributes.uv.array, o * 2);
        o += g.attributes.position.count; g.dispose();
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(P, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(N, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
      const mesh = new THREE.Mesh(bg, mat); mesh.castShadow = mesh.receiveShadow = true; root.add(mesh);
    }
    for (const l of this.loose) root.add(l);
    return root;
  };
  // placa com texto (canvas)
  const signCache = {};
  function signMat(text, bg, fg, icon) {
    const k = text + bg + fg + (icon || ''); if (signCache[k]) return signCache[k];
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 128); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(6, 6, 244, 116);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (icon === 'rad') { // trifólio de radiação (desenho geométrico simples)
      g.save(); g.translate(64, 64); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 42, (i * 120 - 30) * Math.PI / 180, (i * 120 + 30) * Math.PI / 180); g.closePath(); g.fill(); }
      g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill(); g.fillStyle = fg; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.restore();
      g.font = '900 30px Arial'; wrap(g, text, 180, 64, 120);
    } else if (icon === 'volt') {
      g.beginPath(); g.moveTo(70, 14); g.lineTo(40, 70); g.lineTo(62, 70); g.lineTo(48, 114); g.lineTo(92, 52); g.lineTo(68, 52); g.lineTo(84, 14); g.closePath(); g.fill();
      g.font = '900 28px Arial'; wrap(g, text, 180, 64, 130);
    } else { g.font = '900 34px Arial'; wrap(g, text, 128, 64, 230); }
    const t = new THREE.CanvasTexture(cv);
    return (signCache[k] = new THREE.MeshLambertMaterial({ map: t }));
  }
  function wrap(g, text, x, y, maxW) {
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    lines.push(cur); const lh = 32; lines.forEach((l, i) => g.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh));
  }
  F.sign = (text, bg, fg, icon, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 1, h || 0.5), signMat(text, bg || '#e8c020', fg || '#151515', icon)); return m; };

  // ----- motor elétrico (usado em várias máquinas) -----
  function motor(p, x, y, z, len, r, mat) {
    p.cyl(mat, r, r, len, x, y, z, 0, 0, Math.PI / 2);
    for (let i = 0; i < 5; i++) p.cyl(mat, r + 0.03, r + 0.03, 0.025, x - len * 0.35 + i * len * 0.17, y, z, 0, 0, Math.PI / 2);
    p.cyl(mt.dark(), r * 0.92, r * 0.92, 0.12, x - len / 2 - 0.06, y, z, 0, 0, Math.PI / 2);
    p.cyl(mt.steel(), 0.04, 0.04, 0.22, x + len / 2 + 0.11, y, z, 0, 0, Math.PI / 2);
    p.box(mat, 0.2, 0.14, 0.2, x, y + r + 0.05, z);
    p.box(mt.dark(), len * 0.8, 0.06, r * 1.8, x, y - r - 0.02, z);
  }
  function wheel(p, x, y, z, ax) { p.tor(mt.red(), 0.16, 0.025, x, y, z, ax === 'x' ? 0 : Math.PI / 2, ax === 'x' ? Math.PI / 2 : 0, 0); p.cyl(mt.red(), 0.02, 0.02, 0.3, x, y, z, ax === 'x' ? Math.PI / 2 : 0, 0, ax === 'x' ? 0 : Math.PI / 2); }
  function flange(p, x, y, z, r, ax) { const rx = ax === 'y' ? 0 : ax === 'z' ? Math.PI / 2 : 0, rz = ax === 'x' ? Math.PI / 2 : 0; p.cyl(mt.dark(), r * 1.5, r * 1.5, 0.05, x, y, z, rx, 0, rz); }

  // ----- catálogo -----
  const B = {};
  const dims = F.dims = {};
  const def = (name, w, d, h, pen, fn) => { dims[name] = [w, d, h, pen]; B[name] = fn; };

  def('generator', 2.6, 1.1, 1.6, 3, (p, o) => {
    const c = o.color === 'green' ? mt.green() : mt.yellow();
    p.box(mt.dark(), 2.6, 0.16, 1.1, 0, 0.08, 0); p.box(mt.hazard(), 2.62, 0.06, 1.12, 0, 0.13, 0);
    p.box(c, 1.3, 0.9, 0.9, -0.35, 0.62, 0); p.box(mt.dark(), 1.0, 0.12, 0.6, -0.35, 1.13, 0);
    p.box(c, 0.36, 1.25, 1.0, -1.1, 0.78, 0); p.box(mt.black(), 0.02, 0.95, 0.8, -1.29, 0.78, 0);
    for (let i = 0; i < 6; i++) p.box(mt.dark(), 0.03, 0.9, 0.04, -1.3, 0.78, -0.35 + i * 0.14);
    p.cyl(c, 0.42, 0.42, 0.9, 0.62, 0.62, 0, 0, 0, Math.PI / 2); p.cyl(mt.dark(), 0.36, 0.36, 0.06, 1.09, 0.62, 0, 0, 0, Math.PI / 2);
    p.box(mt.grey(), 0.5, 0.6, 0.3, 0.95, 1.38, 0.3); p.box(mt.glow(0x3fff8a), 0.28, 0.12, 0.01, 0.95, 1.5, 0.455); p.box(mt.glow(0xff3030), 0.06, 0.06, 0.01, 0.82, 1.3, 0.455); p.box(mt.glow(0xffc030), 0.06, 0.06, 0.01, 0.95, 1.3, 0.455);
    p.cyl(mt.dark(), 0.07, 0.07, 0.75, -0.6, 1.4, -0.3); p.cyl(mt.steel(), 0.15, 0.15, 0.6, -0.6, 1.8, -0.3, 0, 0, Math.PI / 2);
    p.cyl(mt.dark(), 0.18, 0.18, 0.9, 0.2, 0.25, 0.35, 0, 0, Math.PI / 2);
  });
  def('motor', 1.2, 0.6, 0.75, 3, (p) => { motor(p, 0, 0.38, 0, 0.85, 0.27, mt.blue()); });
  def('pump', 2.2, 0.9, 1.4, 3, (p, o) => {
    const c = o.color === 'red' ? mt.red() : mt.blue();
    p.box(mt.dark(), 2.2, 0.12, 0.85, 0, 0.06, 0);
    motor(p, -0.55, 0.45, 0, 0.9, 0.28, mt.green());
    p.box(mt.yellow(), 0.34, 0.3, 0.36, 0.12, 0.45, 0);
    p.cyl(c, 0.4, 0.4, 0.34, 0.62, 0.5, 0, 0, 0, Math.PI / 2); p.cyl(c, 0.22, 0.26, 0.3, 0.62, 0.92, 0);
    p.cyl(mt.steel(), 0.14, 0.14, 0.5, 1.0, 0.5, 0, 0, 0, Math.PI / 2); flange(p, 0.8, 0.5, 0, 0.14, 'x'); flange(p, 1.08, 0.5, 0, 0.14, 'x');
    p.cyl(mt.steel(), 0.12, 0.12, 0.5, 0.62, 1.3, 0); flange(p, 0.62, 1.08, 0, 0.12, 'y'); wheel(p, 0.62, 1.42, 0, 'y');
    p.box(mt.hazard(), 0.05, 0.3, 0.37, -0.05, 0.45, 0);
  });
  def('bigPump', 1.5, 1.5, 3.0, 4, (p, o) => {
    const c = o.color === 'red' ? mt.red() : mt.blue();
    p.cyl(mt.concrete(), 0.72, 0.75, 0.3, 0, 0.15, 0, 0, 0, 0, 20);
    p.cyl(c, 0.45, 0.58, 0.75, 0, 0.68, 0, 0, 0, 0, 20); p.cyl(mt.dark(), 0.6, 0.6, 0.06, 0, 1.06, 0, 0, 0, 0, 20);
    p.cyl(mt.steel(), 0.18, 0.18, 0.5, 0, 1.33, 0);
    p.cyl(mt.green(), 0.42, 0.42, 1.1, 0, 2.15, 0, 0, 0, 0, 20);
    for (let i = 0; i < 6; i++) p.cyl(mt.green(), 0.46, 0.46, 0.03, 0, 1.75 + i * 0.16, 0, 0, 0, 0, 20);
    p.cyl(mt.dark(), 0.3, 0.42, 0.18, 0, 2.79, 0, 0, 0, 0, 20); p.box(mt.green(), 0.22, 0.18, 0.24, 0.42, 2.3, 0);
    p.cyl(mt.steel(), 0.17, 0.17, 0.75, 0.0, 0.68, 0.58, Math.PI / 2, 0, 0); flange(p, 0, 0.68, 0.72, 0.17, 'z');
    wheel(p, 0.0, 1.0, 0.7, 'z');
    const s = F.sign('BOMBA ' + (o.n || 1), '#2a5a8a', '#ffffff'); s.position.set(0, 1.5, 0.47); s.scale.set(0.5, 0.5, 1); p.loose.push(s);
  });
  def('transformer', 1.9, 1.5, 2.4, 4, (p) => {
    p.box(mt.concrete(), 1.9, 0.2, 1.5, 0, 0.1, 0);
    p.box(mt.green(), 1.3, 1.4, 1.0, 0, 0.9, 0);
    for (let i = 0; i < 7; i++) { p.box(mt.green(), 0.03, 1.1, 0.24, -0.45 + i * 0.15, 0.85, 0.62); p.box(mt.green(), 0.03, 1.1, 0.24, -0.45 + i * 0.15, 0.85, -0.62); }
    p.cyl(mt.green(), 0.18, 0.18, 1.0, 0, 1.85, -0.3, 0, 0, Math.PI / 2);
    for (let i = -1; i <= 1; i++) { for (let k = 0; k < 4; k++) p.cyl(mt.ceramic(), 0.07 + (k % 2) * 0.03, 0.07 + (k % 2) * 0.03, 0.08, i * 0.38, 1.66 + k * 0.1, 0.15); p.cyl(mt.steel(), 0.02, 0.02, 0.3, i * 0.38, 2.15, 0.15); }
    const s = F.sign('PERIGO ALTA TENSÃO', '#f0d020', '#111111', 'volt'); s.position.set(0, 1.0, 0.51); s.scale.set(0.7, 0.7, 1); p.loose.push(s);
  });
  def('panel', 1.6, 0.5, 2.0, 2, (p, o) => {
    const c = o.color === 'beige' ? lam('beige', { color: 0xd8d0b8, map: T('metal') }) : mt.grey();
    p.box(c, 1.6, 2.0, 0.5, 0, 1.0, 0); p.box(mt.dark(), 1.62, 0.1, 0.52, 0, 0.05, 0);
    p.box(mt.dark(), 0.01, 1.7, 0.01, 0, 1.0, 0.255);
    p.box(mt.glass(), 0.6, 0.35, 0.01, -0.4, 1.55, 0.255); p.box(mt.glow(0x40c0ff), 0.5, 0.25, 0.012, -0.4, 1.55, 0.256);
    const cols = [0xff3030, 0x30ff60, 0xffc030, 0x30a0ff];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) p.box(mt.glow(cols[(i + k) % 4]), 0.06, 0.06, 0.02, 0.2 + i * 0.13, 1.6 - k * 0.15, 0.255);
    p.cyl(mt.red(), 0.06, 0.06, 0.04, 0.55, 1.1, 0.27, Math.PI / 2, 0, 0);
    for (let i = 0; i < 4; i++) p.box(mt.dark(), 0.5, 0.02, 0.01, -0.4, 0.5 + i * 0.08, 0.255);
    p.box(mt.steel(), 0.03, 0.18, 0.04, -0.06, 1.0, 0.27); p.box(mt.steel(), 0.03, 0.18, 0.04, 0.06, 1.0, 0.27);
  });
  def('cabinet', 0.8, 0.42, 1.85, 2, (p) => {
    p.box(mt.grey(), 0.8, 1.85, 0.42, 0, 0.925, 0); for (let i = 0; i < 5; i++) p.box(mt.dark(), 0.4, 0.02, 0.01, 0, 0.4 + i * 0.06, 0.215);
    p.box(mt.steel(), 0.03, 0.16, 0.04, 0.3, 1.0, 0.23); const s = F.sign('QUADRO ELÉTRICO', '#f0d020', '#111', 'volt'); s.position.set(0, 1.45, 0.215); s.scale.set(0.5, 0.5, 1); p.loose.push(s);
  });
  def('lockers', 1.5, 0.5, 1.9, 2, (p, o) => {
    const c = o.color === 'green' ? mt.green() : mt.blue();
    for (let i = 0; i < 3; i++) {
      const x = -0.5 + i * 0.5; p.box(c, 0.48, 1.9, 0.5, x, 0.95, 0);
      for (let k = 0; k < 4; k++) p.box(mt.dark(), 0.3, 0.015, 0.01, x, 1.62 + k * 0.05, 0.255);
      p.box(mt.steel(), 0.03, 0.12, 0.03, x + 0.17, 1.0, 0.265);
    }
  });
  def('shelf', 2.0, 0.55, 2.0, 1, (p, o) => {
    const post = o.wood ? mt.wood() : mt.orange(), sh = o.wood ? mt.planks() : mt.steel();
    for (const x of [-0.97, 0.97]) for (const z of [-0.25, 0.25]) p.box(post, 0.05, 2.0, 0.05, x, 1.0, z);
    for (let k = 0; k < 4; k++) p.box(sh, 2.0, 0.04, 0.55, 0, 0.12 + k * 0.6, 0);
    let s = (o.seed || 1) * 9301;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) {
      if (rnd() < 0.25) continue;
      const w = 0.3 + rnd() * 0.15, h = 0.2 + rnd() * 0.25;
      p.box(rnd() < 0.5 ? mt.card() : (o.wood ? mt.wood() : mt.blue()), w, h, 0.4, -0.72 + i * 0.48, 0.14 + k * 0.6 + h / 2, 0);
    }
  });
  def('valves', 2.0, 0.5, 1.4, 3, (p) => {
    p.cyl(mt.steel(), 0.11, 0.11, 2.0, 0, 0.45, 0, 0, 0, Math.PI / 2); p.cyl(mt.blue(), 0.11, 0.11, 2.0, 0, 1.05, 0, 0, 0, Math.PI / 2);
    for (const x of [-0.6, 0, 0.6]) { p.cyl(mt.steel(), 0.07, 0.07, 0.6, x, 0.75, 0); flange(p, x, 0.75, 0, 0.07, 'y'); wheel(p, x, 0.75, 0.2, 'z'); }
    for (const x of [-0.9, 0.9]) p.box(mt.dark(), 0.08, 1.2, 0.3, x, 0.6, -0.08);
    for (const x of [-1.0, 1.0]) { flange(p, x * 0.98, 0.45, 0, 0.11, 'x'); flange(p, x * 0.98, 1.05, 0, 0.11, 'x'); }
  });
  def('tank', 1.6, 1.6, 2.8, 4, (p, o) => {
    const c = o.color === 'white' ? mt.white() : o.color === 'blue' ? mt.blue() : mt.grey();
    for (const [x, z] of [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) p.box(mt.dark(), 0.08, 0.5, 0.08, x, 0.25, z);
    p.cyl(c, 0.75, 0.75, 2.0, 0, 1.5, 0, 0, 0, 0, 20); p.sph(c, 0.75, 0, 2.5, 0, 1, 0.35, 1); p.sph(c, 0.75, 0, 0.5, 0, 1, 0.3, 1);
    for (let k = 0; k < 9; k++) p.box(mt.steel(), 0.32, 0.03, 0.03, 0.5, 0.7 + k * 0.22, 0.6);
    p.box(mt.steel(), 0.03, 2.1, 0.03, 0.34, 1.6, 0.6); p.box(mt.steel(), 0.03, 2.1, 0.03, 0.66, 1.6, 0.6);
    p.cyl(mt.steel(), 0.08, 0.08, 0.6, -0.8, 0.8, 0, 0, 0, Math.PI / 2); wheel(p, -0.95, 0.8, 0, 'x');
  });
  def('spool', 1.2, 0.8, 1.25, 1, (p) => {
    for (const z of [-0.36, 0.36]) p.cyl(mt.wood(), 0.62, 0.62, 0.06, 0, 0.62, z, Math.PI / 2, 0, 0, 18);
    p.cyl(mt.black(), 0.46, 0.46, 0.66, 0, 0.62, 0, Math.PI / 2, 0, 0, 18);
  });
  def('pallet', 1.2, 1.0, 1.1, 1, (p, o) => {
    for (let i = 0; i < 5; i++) p.box(mt.planks(), 1.2, 0.03, 0.16, 0, 0.13, -0.4 + i * 0.2);
    for (const z of [-0.42, 0, 0.42]) p.box(mt.planks(), 1.2, 0.1, 0.12, 0, 0.06, z);
    if (o.sacks) { for (let k = 0; k < 3; k++) for (let i = 0; i < 2; i++) p.sph(mt.cloth(0xc8b890), 0.32, -0.27 + i * 0.54, 0.3 + k * 0.26, (k % 2 ? 0.1 : -0.1), 1, 0.42, 1.4); }
    else { p.box(mt.card(), 1.1, 0.85, 0.9, 0, 0.58, 0); p.box(lam('wrap', { color: 0xdde4e8, transparent: true, opacity: 0.35 }), 1.14, 0.88, 0.94, 0, 0.58, 0); }
  });
  def('workbench', 2.0, 0.8, 1.0, 2, (p) => {
    p.box(mt.wood(), 2.0, 0.06, 0.8, 0, 0.92, 0);
    for (const x of [-0.92, 0.92]) for (const z of [-0.33, 0.33]) p.box(mt.dark(), 0.06, 0.9, 0.06, x, 0.45, z);
    p.box(mt.dark(), 1.9, 0.04, 0.7, 0, 0.25, 0);
    p.box(mt.blue(), 0.2, 0.14, 0.18, -0.7, 1.02, 0.25); p.box(mt.red(), 0.45, 0.18, 0.22, 0.5, 1.04, -0.1);
    p.box(mt.steel(), 0.3, 0.04, 0.05, 0.1, 0.97, 0.2);
  });
  def('gasCyl', 1.0, 0.42, 1.55, 2, (p) => {
    const cols = [mt.green(), mt.blue(), mt.red()];
    for (let i = 0; i < 3; i++) { p.cyl(cols[i], 0.13, 0.13, 1.25, -0.32 + i * 0.32, 0.65, 0, 0, 0, 0, 12); p.sph(cols[i], 0.13, -0.32 + i * 0.32, 1.27, 0, 1, 0.6, 1); p.cyl(mt.steel(), 0.04, 0.04, 0.15, -0.32 + i * 0.32, 1.42, 0); }
    p.box(mt.dark(), 1.0, 0.05, 0.05, 0, 1.0, 0.16); p.box(mt.dark(), 0.05, 1.1, 0.05, -0.5, 0.55, 0.16); p.box(mt.dark(), 0.05, 1.1, 0.05, 0.5, 0.55, 0.16);
  });
  def('compressor', 1.4, 0.7, 1.15, 3, (p) => {
    p.cyl(mt.red(), 0.3, 0.3, 1.3, 0, 0.42, 0, 0, 0, Math.PI / 2, 16); p.sph(mt.red(), 0.3, -0.65, 0.42, 0, 0.3, 1, 1); p.sph(mt.red(), 0.3, 0.65, 0.42, 0, 0.3, 1, 1);
    motor(p, -0.2, 0.92, 0, 0.5, 0.15, mt.dark()); p.cyl(mt.steel(), 0.1, 0.12, 0.25, 0.35, 0.92, 0);
    for (const x of [-0.5, 0.5]) p.cyl(mt.black(), 0.1, 0.1, 0.06, x, 0.1, 0.3, Math.PI / 2, 0, 0);
  });
  def('turbine', 2.6, 7.5, 2.5, 4, (p) => {
    p.box(mt.concrete(), 2.6, 0.4, 7.5, 0, 0.2, 0);
    p.cyl(mt.steel(), 0.8, 0.8, 1.8, 0, 1.25, -2.5, Math.PI / 2, 0, 0, 22); p.cyl(mt.yellow(), 1.05, 1.05, 2.4, 0, 1.4, -0.4, Math.PI / 2, 0, 0, 24);
    p.box(mt.yellow(), 2.1, 0.5, 2.4, 0, 2.25, -0.4); p.box(mt.steel(), 1.6, 0.7, 1.8, 0, 1.9, -2.5);
    p.cyl(mt.green(), 0.95, 0.95, 2.2, 0, 1.35, 2.2, Math.PI / 2, 0, 0, 24); p.box(mt.green(), 1.8, 0.5, 2.0, 0, 2.15, 2.2);
    for (let i = 0; i < 5; i++) p.cyl(mt.green(), 1.0, 1.0, 0.04, 0, 1.35, 1.4 + i * 0.4, Math.PI / 2, 0, 0, 24);
    p.cyl(mt.steel(), 0.25, 0.25, 7.2, 0, 1.25, 0, Math.PI / 2, 0, 0);
    p.cyl(mt.steel(), 0.22, 0.22, 1.6, 0.9, 2.2, -1.6); p.cyl(mt.steel(), 0.22, 0.22, 1.6, -0.9, 2.2, -1.6);
    p.box(mt.hazard(), 2.62, 0.08, 7.52, 0, 0.42, 0);
    const s = F.sign('TURBOGERADOR 2', '#e8e4dc', '#1a1a1a'); s.position.set(1.07, 1.5, 2.2); s.rotation.y = Math.PI / 2; s.scale.set(0.8, 0.8, 1); p.loose.push(s);
  });
  // ----- móveis -----
  def('table', 1.4, 0.8, 0.78, 1, (p) => { p.box(mt.wood(), 1.4, 0.05, 0.8, 0, 0.75, 0); for (const x of [-0.62, 0.62]) for (const z of [-0.32, 0.32]) p.box(mt.wood(), 0.06, 0.73, 0.06, x, 0.365, z); });
  def('chair', 0.5, 0.5, 0.92, 1, (p) => { p.box(mt.wood(), 0.46, 0.04, 0.46, 0, 0.46, 0); for (const x of [-0.2, 0.2]) for (const z of [-0.2, 0.2]) p.box(mt.wood(), 0.04, 0.46, 0.04, x, 0.23, z); p.box(mt.wood(), 0.46, 0.44, 0.04, 0, 0.7, -0.21); });
  def('sofa', 2.0, 0.9, 0.85, 1, (p, o) => { const c = mt.cloth(o.color || 0x6a3a2a); p.box(c, 2.0, 0.42, 0.9, 0, 0.21, 0); p.box(c, 2.0, 0.45, 0.22, 0, 0.62, -0.34); p.box(c, 0.2, 0.25, 0.9, -0.9, 0.55, 0); p.box(c, 0.2, 0.25, 0.9, 0.9, 0.55, 0); for (const x of [-0.45, 0.45]) p.box(mt.cloth(0xc8b8a0), 0.85, 0.12, 0.6, x, 0.48, 0.08); });
  def('bed', 1.4, 2.0, 0.9, 1, (p, o) => { p.box(mt.wood(), 1.4, 0.3, 2.0, 0, 0.15, 0); p.box(mt.white(), 1.3, 0.2, 1.9, 0, 0.4, 0); p.box(mt.cloth(o.color || 0x3a5a8a), 1.34, 0.08, 1.3, 0, 0.53, 0.3); p.box(mt.white(), 0.5, 0.12, 0.35, -0.3, 0.56, -0.7); p.box(mt.white(), 0.5, 0.12, 0.35, 0.3, 0.56, -0.7); p.box(mt.wood(), 1.4, 0.9, 0.08, 0, 0.45, -0.98); });
  def('wardrobe', 1.2, 0.55, 2.0, 1, (p) => { p.box(mt.wood(), 1.2, 2.0, 0.55, 0, 1.0, 0); p.box(mt.dark(), 0.01, 1.8, 0.01, 0, 1.0, 0.28); for (const x of [-0.08, 0.08]) p.box(mt.steel(), 0.03, 0.14, 0.03, x, 1.05, 0.29); p.box(mt.wood(), 1.24, 0.06, 0.58, 0, 2.03, 0); });
  def('fridge', 0.7, 0.55, 1.8, 2, (p) => { p.box(mt.white(), 0.7, 1.8, 0.55, 0, 0.9, 0); p.box(mt.dark(), 0.7, 0.01, 0.01, 0, 1.25, 0.28); p.box(mt.steel(), 0.03, 0.4, 0.04, 0.27, 1.5, 0.3); p.box(mt.steel(), 0.03, 0.35, 0.04, 0.27, 0.9, 0.3); });
  def('stove', 0.8, 0.55, 0.92, 2, (p) => { p.box(mt.white(), 0.8, 0.88, 0.55, 0, 0.44, 0); p.box(mt.black(), 0.78, 0.03, 0.53, 0, 0.895, 0); for (const [x, z] of [[-0.2, -0.12], [0.2, -0.12], [-0.2, 0.12], [0.2, 0.12]]) p.cyl(mt.dark(), 0.09, 0.09, 0.02, x, 0.92, z); p.box(mt.glass(), 0.6, 0.35, 0.01, 0, 0.42, 0.28); for (let i = 0; i < 4; i++) p.cyl(mt.dark(), 0.025, 0.025, 0.03, -0.27 + i * 0.18, 0.8, 0.29, Math.PI / 2, 0, 0); });
  def('bookshelf', 1.0, 0.35, 1.9, 1, (p, o) => {
    p.box(mt.wood(), 1.0, 1.9, 0.04, 0, 0.95, -0.155); for (const x of [-0.48, 0.48]) p.box(mt.wood(), 0.04, 1.9, 0.35, x, 0.95, 0);
    let s = (o.seed || 3) * 7;
    for (let k = 0; k < 5; k++) { p.box(mt.wood(), 1.0, 0.03, 0.35, 0, 0.05 + k * 0.45, 0); if (k < 4) { let x = -0.44; while (x < 0.4) { s = (s * 9301 + 49297) % 233280; const w = 0.04 + (s % 5) * 0.012, h = 0.25 + (s % 7) * 0.02; p.box(mt.cloth([0x8a2a2a, 0x2a4a8a, 0x2a6a3a, 0x8a7a2a, 0x5a3a6a][s % 5]), w, h, 0.26, x + w / 2, 0.07 + k * 0.45 + h / 2, 0.02); x += w + 0.008; } } }
  });
  def('desk', 1.4, 0.7, 1.2, 1, (p) => { p.box(mt.wood(), 1.4, 0.05, 0.7, 0, 0.74, 0); p.box(mt.wood(), 0.45, 0.72, 0.66, 0.45, 0.36, 0); p.box(mt.wood(), 0.04, 0.72, 0.66, -0.66, 0.36, 0); p.box(mt.black(), 0.55, 0.34, 0.03, -0.1, 1.02, -0.2); p.box(mt.glow(0x6ab0ff), 0.5, 0.28, 0.005, -0.1, 1.02, -0.184); p.box(mt.dark(), 0.06, 0.18, 0.06, -0.1, 0.84, -0.22); p.box(mt.dark(), 0.45, 0.02, 0.15, -0.1, 0.77, 0.1); });
  def('planter', 1.0, 0.5, 1.1, 1, (p, o) => {
    p.box(o.wood ? mt.wood() : mt.concrete(), 1.0, 0.45, 0.5, 0, 0.225, 0); p.box(lam('soil', { color: 0x4a3626 }), 0.92, 0.04, 0.42, 0, 0.44, 0);
    const lf = lam('leaf', { color: 0x3e7a34 }), fl = [0xd84a6a, 0xe8c040, 0xe8e8f0][(o.seed || 0) % 3];
    for (let i = 0; i < 5; i++) p.sph(lf, 0.17, -0.36 + i * 0.18, 0.62 + (i % 2) * 0.12, (i % 2 ? 0.06 : -0.06), 1, 1.3, 1);
    for (let i = 0; i < 4; i++) p.sph(mt.glow(fl), 0.05, -0.3 + i * 0.2, 0.86 + (i % 2) * 0.08, 0.1);
  });
  def('bench', 1.6, 0.55, 0.85, 1, (p) => {
    for (let i = 0; i < 3; i++) p.box(mt.wood(), 1.6, 0.04, 0.12, 0, 0.45, -0.15 + i * 0.15);
    for (let i = 0; i < 2; i++) p.box(mt.wood(), 1.6, 0.1, 0.03, 0, 0.62 + i * 0.13, -0.24);
    for (const x of [-0.7, 0.7]) { p.box(mt.dark(), 0.05, 0.45, 0.45, x, 0.225, 0); p.box(mt.dark(), 0.05, 0.4, 0.04, x, 0.62, -0.25); }
  });
  // ----- usina nuclear (cenário grande) -----
  def('reactorCore', 4.6, 4.6, 10, 4, (p) => {
    p.cyl(mt.concrete(), 2.4, 2.5, 1.2, 0, 0.6, 0, 0, 0, 0, 28);
    p.cyl(mt.grey(), 2.0, 2.0, 6.4, 0, 4.4, 0, 0, 0, 0, 28); p.cyl(mt.hazard(), 2.03, 2.03, 0.5, 0, 1.6, 0, 0, 0, 0, 28);
    p.sph(mt.grey(), 2.0, 0, 7.6, 0, 1, 0.55, 1);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; p.cyl(mt.dark(), 0.12, 0.12, 0.9, Math.cos(a) * 1.0, 8.9, Math.sin(a) * 1.0); }
    p.cyl(mt.dark(), 0.14, 0.14, 0.9, 0, 9.0, 0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; p.cyl(mt.blue(), 0.32, 0.32, 3.0, Math.cos(a) * 2.2, 3.5, Math.sin(a) * 2.2, 0, 0, 0); p.cyl(mt.blue(), 0.34, 0.34, 0.12, Math.cos(a) * 2.2, 5.0, Math.sin(a) * 2.2); }
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { const s = F.sign('REATOR · ÁREA CONTROLADA', '#f0d020', '#111', 'rad'); s.position.set(Math.sin(a) * 2.02, 3.2, Math.cos(a) * 2.02); s.rotation.y = a; s.scale.set(1.3, 1.3, 1); p.loose.push(s); }
    p.tor(mt.yellow(), 2.05, 0.05, 0, 6.0, 0, Math.PI / 2, 0, 0);
  });
  // reator submerso: a base fica no fundo da piscina (y local 0 = fundo); a água fica em ~2,65 m
  def('reactorPool', 4.6, 4.6, 11, 4, (p) => {
    const gl = mt.glow(0x4cf0ff);
    p.cyl(mt.concrete(), 2.35, 2.45, 1.0, 0, 0.5, 0, 0, 0, 0, 28);
    p.cyl(mt.grey(), 1.75, 1.8, 6.6, 0, 4.3, 0, 0, 0, 0, 28);                       // vaso do reator
    p.cyl(gl, 1.79, 1.79, 0.5, 0, 1.9, 0, 0, 0, 0, 28); p.cyl(gl, 1.79, 1.79, 0.18, 0, 2.55, 0, 0, 0, 0, 28);   // brilho do núcleo sob a água
    p.cyl(mt.hazard(), 1.79, 1.79, 0.55, 0, 5.6, 0, 0, 0, 0, 28);
    p.cyl(mt.dark(), 2.05, 2.05, 0.28, 0, 7.7, 0, 0, 0, 0, 28);                      // flange da tampa
    p.sph(mt.grey(), 1.75, 0, 7.85, 0, 1, 0.5, 1);                                   // cabeça da tampa
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = 0.95; p.cyl(mt.dark(), 0.13, 0.13, 1.5, Math.cos(a) * r, 9.0, Math.sin(a) * r); p.cyl(mt.steel(), 0.2, 0.2, 0.12, Math.cos(a) * r, 9.8, Math.sin(a) * r); }
    p.cyl(mt.dark(), 0.18, 0.18, 1.9, 0, 9.2, 0); p.cyl(mt.yellow(), 0.3, 0.3, 0.2, 0, 10.2, 0);
    for (const s of [-1, 1]) { p.cyl(mt.blue(), 0.34, 0.34, 4.6, s * 3.9, 6.3, 0, 0, 0, Math.PI / 2); flange(p, s * 2.0, 6.3, 0, 0.34, 'x'); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const s = F.sign('REATOR 1 · ÁREA CONTROLADA', '#f0d020', '#111', 'rad', 1.1, 0.55); s.position.set(Math.sin(a) * 1.81, 4.6, Math.cos(a) * 1.81); s.rotation.y = a; p.loose.push(s); }
  });
  def('waterTank', 3.4, 3.4, 8, 4, (p) => {
    p.cyl(mt.blue(), 1.6, 1.6, 6.8, 0, 3.4, 0, 0, 0, 0, 26); p.sph(mt.blue(), 1.6, 0, 6.8, 0, 1, 0.3, 1);
    for (let k = 0; k < 4; k++) p.cyl(mt.dark(), 1.63, 1.63, 0.08, 0, 1.2 + k * 1.6, 0, 0, 0, 0, 26);
    for (let k = 0; k < 24; k++) p.box(mt.steel(), 0.36, 0.03, 0.03, 0, 0.4 + k * 0.28, 1.72);
    for (const x of [-0.18, 0.18]) p.box(mt.steel(), 0.03, 6.8, 0.03, x, 3.4, 1.72);
    const s = F.sign('ÁGUA DE REFRIGERAÇÃO', '#2a5a8a', '#ffffff'); s.position.set(0, 4.5, 1.62); s.scale.set(1.8, 1.8, 1); p.loose.push(s);
  });
  // ===== cenário temático: transporte, fundição, praça, ruínas, esgoto =====
  const stone = () => lam('stnX', { color: 0xc8c4b8, map: T('stone') }), stoneW = () => lam('stwX', { color: 0xd0ccc0, map: T('stoneWall') });
  const mossM = () => lam('mossX', { color: 0xffffff, map: T('moss') }), hiero = () => lam('hieX', { color: 0xe8dcc0, map: T('hiero') });
  const fire = () => mt.glow(0xff8a20), molten = () => mt.glow(0xff6a18);
  const wheelZ = (p, x, y, z, r) => p.cyl(mt.dark(), r, r, 0.24, x, y, z, 0, 0, Math.PI / 2, 14);
  def('locomotive', 3.0, 9.6, 4.3, 4, (p, o) => {
    const c = o.color === 'red' ? mt.red() : o.color === 'blue' ? mt.blue() : mt.green();
    p.box(mt.dark(), 2.8, 0.55, 9.4, 0, 0.8, 0); p.box(c, 2.5, 1.7, 5.6, 0, 1.95, -1.6); p.box(mt.dark(), 2.6, 0.14, 5.6, 0, 2.85, -1.6);
    p.box(c, 2.8, 2.7, 2.8, 0, 2.4, 3.0); p.box(mt.dark(), 2.9, 0.16, 2.9, 0, 3.8, 3.0); p.box(mt.glass(), 2.0, 0.9, 0.05, 0, 3.0, 1.57); p.box(mt.glass(), 0.05, 0.9, 1.6, 1.41, 3.0, 3.1); p.box(mt.glass(), 0.05, 0.9, 1.6, -1.41, 3.0, 3.1);
    p.box(mt.yellow(), 2.55, 0.32, 0.06, 0, 1.4, -4.42); p.cyl(mt.dark(), 0.3, 0.26, 1.0, 0.0, 3.3, -3.6); p.cyl(mt.glow(0xfff2b0), 0.22, 0.22, 0.1, 0, 2.5, -4.42, Math.PI / 2);
    for (const z of [-3.6, -2.0, 2.0, 3.8]) for (const s of [-1, 1]) wheelZ(p, s * 1.2, 0.5, z, 0.5);
    p.cyl(mt.steel(), 0.5, 0.5, 3.2, 0, 0.55, 0, Math.PI / 2, 0, 0, 14);
    p.box(mt.dark(), 2.9, 0.4, 0.3, 0, 0.7, -4.55); p.box(mt.dark(), 2.9, 0.4, 0.3, 0, 0.7, 4.55);
  });
  def('trainCar', 3.0, 9.0, 3.9, 4, (p, o) => {
    const c = lam('tcar' + ((o.n || 0) % 4), { color: [0x8a3a2a, 0x3a5a8a, 0x5a6a3a, 0x7a6a4a][(o.n || 0) % 4], map: T('corrugated') });
    p.box(mt.dark(), 2.8, 0.5, 8.8, 0, 0.8, 0); p.box(c, 3.0, 2.6, 8.6, 0, 2.35, 0); p.box(mt.dark(), 3.06, 0.14, 8.7, 0, 3.72, 0);
    for (const s of [-1, 1]) { p.box(mt.dark(), 0.06, 2.2, 1.9, s * 1.53, 2.35, 0.8); p.box(mt.steel(), 0.07, 0.1, 2.0, s * 1.55, 3.4, 0.8); }
    for (const z of [-3.2, -2.2, 2.2, 3.2]) for (const s of [-1, 1]) wheelZ(p, s * 1.2, 0.5, z, 0.45);
    p.box(mt.dark(), 2.9, 0.4, 0.3, 0, 0.7, -4.5); p.box(mt.dark(), 2.9, 0.4, 0.3, 0, 0.7, 4.5);
  });
  def('craneLeg', 1.7, 1.7, 9.5, 4, (p) => {
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) p.box(mt.yellow(), 0.14, 9.2, 0.14, x, 4.6, z);
    for (let i = 0; i < 8; i++) { const y = 0.6 + i * 1.12; p.box(mt.yellow(), 1.4, 0.07, 0.07, 0, y, -0.7); p.box(mt.yellow(), 1.4, 0.07, 0.07, 0, y, 0.7); p.box(mt.yellow(), 0.07, 0.07, 1.4, -0.7, y, 0); p.box(mt.yellow(), 0.07, 0.07, 1.4, 0.7, y, 0); }
    p.box(mt.dark(), 1.7, 0.4, 1.7, 0, 0.2, 0); p.box(mt.dark(), 1.7, 0.5, 1.7, 0, 9.25, 0); p.box(mt.hazard(), 1.72, 0.2, 1.72, 0, 8.7, 0);
  });
  def('forklift', 1.3, 2.7, 2.2, 3, (p, o) => {
    const c = o.color === 'blue' ? mt.blue() : mt.orange();
    p.box(c, 1.2, 0.9, 1.7, 0, 0.75, 0.3); p.box(mt.dark(), 1.0, 0.3, 0.9, 0, 1.35, 0.55);
    for (const x of [-0.5, 0.5]) { p.box(mt.dark(), 0.08, 1.2, 0.08, x, 1.9, 0.15); p.box(mt.dark(), 0.08, 1.2, 0.08, x, 1.9, 1.05); }
    p.box(mt.dark(), 1.1, 0.08, 1.0, 0, 2.5, 0.6);
    p.box(mt.steel(), 1.1, 1.8, 0.1, 0, 1.2, -0.65); for (const x of [-0.4, 0.4]) p.box(mt.steel(), 0.12, 0.08, 1.2, x, 0.2, -1.25);
    for (const [x, z] of [[-0.55, 0.9], [0.55, 0.9], [-0.55, -0.3], [0.55, -0.3]]) wheelZ(p, x, 0.3, z, 0.3);
  });
  def('conveyor', 1.2, 6.0, 1.3, 2, (p) => {
    p.box(mt.dark(), 1.0, 0.14, 6.0, 0, 1.0, 0); p.box(mt.steel(), 0.06, 0.25, 6.0, 0.55, 1.1, 0); p.box(mt.steel(), 0.06, 0.25, 6.0, -0.55, 1.1, 0);
    for (let i = 0; i < 12; i++) p.cyl(mt.steel(), 0.07, 0.07, 1.0, 0, 0.97, -2.75 + i * 0.5, 0, 0, Math.PI / 2, 8);
    for (const z of [-2.7, 0, 2.7]) for (const s of [-1, 1]) p.box(mt.dark(), 0.1, 1.0, 0.1, s * 0.5, 0.5, z);
    for (let i = 0; i < 4; i++) p.sph(lam('ore', { color: 0x4a4440 }), 0.2, ((i * 37) % 5 - 2) * 0.08, 1.2, -2 + i * 1.3, 1, 0.8, 1);
  });
  def('crucible', 3.4, 3.4, 3.4, 4, (p) => {
    p.box(mt.dark(), 3.0, 0.4, 3.0, 0, 0.2, 0); for (const [x, z] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) p.box(mt.dark(), 0.3, 1.2, 0.3, x, 1.0, z);
    p.cyl(mt.dark(), 1.5, 1.0, 2.0, 0, 2.2, 0, 0, 0, 0, 22); p.cyl(mt.steel(), 1.55, 1.55, 0.15, 0, 3.2, 0, 0, 0, 0, 22); p.cyl(molten(), 1.38, 1.38, 0.05, 0, 3.22, 0, 0, 0, 0, 22);
    p.cyl(mt.yellow(), 1.52, 1.4, 0.3, 0, 1.6, 0, 0, 0, 0, 22);
  });
  def('furnace', 4.2, 4.2, 7.0, 4, (p) => {
    p.cyl(mt.concrete(), 2.1, 2.2, 0.5, 0, 0.25, 0, 0, 0, 0, 24); p.cyl(mt.dark(), 1.7, 1.9, 4.2, 0, 2.6, 0, 0, 0, 0, 24); p.cyl(mt.dark(), 1.3, 1.7, 1.2, 0, 5.3, 0, 0, 0, 0, 24); p.cyl(mt.steel(), 0.7, 1.0, 1.0, 0, 6.4, 0, 0, 0, 0, 20);
    for (let i = 0; i < 4; i++) p.cyl(mt.steel(), 1.9 - i * 0.04, 1.9 - i * 0.04, 0.16, 0, 1.2 + i * 1.0, 0, 0, 0, 0, 24);
    p.box(molten(), 0.9, 0.7, 0.1, 0, 1.2, 1.85); p.cyl(mt.orange(), 0.2, 0.2, 2.5, 1.6, 1.0, 1.0, Math.PI / 2, 0, 0.3);
    for (const s of [-1, 1]) p.cyl(mt.red(), 0.26, 0.26, 3.4, s * 2.0, 2.6, 0, 0, 0, 0, 10);
  });
  def('boiler', 2.6, 5.0, 2.8, 4, (p) => {
    p.cyl(mt.green(), 1.15, 1.15, 4.4, 0, 1.5, 0, Math.PI / 2, 0, 0, 20); p.sph(mt.green(), 1.15, 0, 1.5, 2.2, 1, 1, 0.4); p.sph(mt.green(), 1.15, 0, 1.5, -2.2, 1, 1, 0.4);
    for (let i = 0; i < 4; i++) p.cyl(mt.steel(), 1.18, 1.18, 0.1, 0, 1.5, -1.6 + i * 1.07, Math.PI / 2, 0, 0, 20);
    p.cyl(mt.steel(), 0.25, 0.25, 0.9, 0, 2.9 - 0.0, 0.2); p.box(mt.dark(), 2.2, 0.35, 4.4, 0, 0.18, 0); p.tor(mt.black(), 0.16, 0.03, 0.0, 2.5, 1.0, 0, 0, 0);
    p.cyl(mt.red(), 0.1, 0.1, 0.5, 0.5, 2.8, -1.0); wheel(p, 0.5, 3.1, -1.0, 'y');
  });
  def('fountain', 3.8, 3.8, 3.0, 4, (p) => {
    p.cyl(stone(), 1.9, 2.0, 0.7, 0, 0.35, 0, 0, 0, 0, 28); p.cyl(mt.glow(0x6ad8ee), 1.7, 1.7, 0.05, 0, 0.6, 0, 0, 0, 0, 28);
    p.cyl(stone(), 0.38, 0.5, 1.4, 0, 1.2, 0, 0, 0, 0, 14); p.cyl(stone(), 1.0, 0.45, 0.4, 0, 1.75, 0, 0, 0, 0, 20); p.cyl(mt.glow(0x6ad8ee), 0.85, 0.85, 0.05, 0, 1.92, 0, 0, 0, 0, 20);
    p.cyl(stone(), 0.2, 0.3, 0.9, 0, 2.2, 0, 0, 0, 0, 12); p.cyl(stone(), 0.5, 0.2, 0.25, 0, 2.7, 0, 0, 0, 0, 14); p.cyl(mt.glow(0xbdeeff), 0.04, 0.04, 0.7, 0, 3.0, 0, 0, 0, 0, 6);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; p.cyl(mt.glow(0xbdeeff), 0.025, 0.025, 0.8, Math.cos(a) * 0.5, 2.3, Math.sin(a) * 0.5, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5, 5); }
  });
  def('stall', 2.8, 1.8, 2.7, 2, (p, o) => {
    const cl = mt.cloth(o.cloth || [0xb84a3a, 0x3a7a9a, 0xd8b04a, 0x4a8a4a][(o.n || 0) % 4]);
    for (const x of [-1.25, 1.25]) { p.box(mt.wood(), 0.09, 2.6, 0.09, x, 1.3, -0.75); p.box(mt.wood(), 0.09, 2.0, 0.09, x, 1.0, 0.75); }
    p.box(cl, 2.8, 0.06, 1.9, 0, 2.55, 0); p.box(mt.wood(), 2.5, 0.08, 0.9, 0, 0.95, 0.4); p.box(mt.wood(), 2.5, 0.9, 0.7, 0, 0.45, 0.4);
    const cols = [0xd84a3a, 0xe8b02a, 0x6ab04a, 0xd88a2a]; for (let i = 0; i < 4; i++) p.sph(mt.cloth(cols[i]), 0.17, -0.9 + i * 0.6, 1.15, 0.4, 1, 0.9, 1);
    p.box(mt.card(), 0.5, 0.35, 0.4, 0.9, 1.15, 0.2);
  });
  def('well', 1.8, 1.8, 2.4, 4, (p) => {
    p.cyl(stoneW(), 0.85, 0.9, 1.0, 0, 0.5, 0, 0, 0, 0, 18); p.cyl(mt.glow(0x203a48), 0.62, 0.62, 0.04, 0, 0.98, 0, 0, 0, 0, 16);
    for (const s of [-1, 1]) p.box(mt.wood(), 0.1, 1.6, 0.1, s * 0.8, 1.7, 0); p.box(mt.wood(), 1.9, 0.1, 0.1, 0, 2.5 - 0.1, 0); p.cyl(mt.wood(), 0.06, 0.06, 1.6, 0, 1.9, 0, 0, 0, Math.PI / 2, 8);
    p.box(lam('roofW', { color: 0x8a4a2a, map: T('roofRed') }), 2.0, 0.1, 1.2, 0, 2.3, 0.45, 0.6); p.box(lam('roofW', { color: 0x8a4a2a, map: T('roofRed') }), 2.0, 0.1, 1.2, 0, 2.3, -0.45, -0.6);
  });
  def('cart', 1.3, 2.4, 1.4, 1, (p) => {
    p.box(mt.wood(), 1.2, 0.08, 1.6, 0, 0.6, 0); for (const s of [-1, 1]) p.box(mt.planks(), 0.06, 0.5, 1.6, s * 0.6, 0.85, 0); p.box(mt.planks(), 1.2, 0.5, 0.06, 0, 0.85, -0.8); p.box(mt.planks(), 1.2, 0.5, 0.06, 0, 0.85, 0.8);
    for (const s of [-1, 1]) wheelZ(p, s * 0.7, 0.5, 0, 0.5); p.cyl(mt.wood(), 0.05, 0.05, 1.4, 0, 0.55, -1.3, Math.PI / 2, 0, 0, 6);
    p.sph(lam('hay2', { color: 0xc8a850 }), 0.5, 0, 1.0, 0, 1.2, 0.6, 1.4);
  });
  def('statue', 1.6, 1.6, 3.9, 4, (p) => {
    p.box(stone(), 1.5, 0.5, 1.5, 0, 0.25, 0); p.box(stoneW(), 1.1, 1.0, 1.1, 0, 1.0, 0); p.cyl(stone(), 0.4, 0.55, 1.5, 0, 2.25, 0, 0, 0, 0, 12); p.sph(stone(), 0.3, 0, 3.3, 0);
    p.box(stone(), 0.18, 1.0, 0.18, 0.55, 2.4, 0, 0, 0, -0.4); p.box(stone(), 0.18, 0.9, 0.18, -0.55, 2.35, 0, 0, 0, 0.4); p.box(stone(), 0.08, 1.2, 0.08, 0.8, 2.9, 0, 0, 0, -0.1);
  });
  def('obelisk', 1.3, 1.3, 6.2, 4, (p) => {
    p.box(stoneW(), 1.3, 0.5, 1.3, 0, 0.25, 0); p.cyl(hiero(), 0.38, 0.58, 5.0, 0, 3.0, 0, 0, Math.PI / 4, 0, 4); p.cyl(mt.glow(0xd8b040), 0.0, 0.38, 0.7, 0, 5.85, 0, 0, Math.PI / 4, 0, 4);
  });
  def('brazier', 1.1, 1.1, 1.6, 2, (p) => {
    for (let i = 0; i < 3; i++) { const a = i * 2.094; p.box(mt.dark(), 0.08, 0.9, 0.08, Math.cos(a) * 0.35, 0.45, Math.sin(a) * 0.35, 0.2 * Math.sin(a), 0, -0.2 * Math.cos(a)); }
    p.cyl(mt.dark(), 0.55, 0.3, 0.35, 0, 1.0, 0, 0, 0, 0, 14); p.cyl(fire(), 0.0, 0.42, 0.7, 0, 1.4, 0, 0, 0, 0, 8);
  });
  def('urn', 0.9, 0.9, 1.3, 1, (p) => { const c = lam('urnX', { color: 0xb86a3a, map: T('terracotta') }); p.sph(c, 0.42, 0, 0.5, 0, 1, 1.1, 1); p.cyl(c, 0.2, 0.3, 0.35, 0, 1.05, 0, 0, 0, 0, 12); p.tor(c, 0.2, 0.04, 0, 1.25, 0, Math.PI / 2, 0, 0); });
  def('column', 1.3, 1.3, 4.6, 4, (p) => { p.box(mossM(), 1.1, 0.4, 1.1, 0, 0.2, 0); p.cyl(mossM(), 0.42, 0.48, 3.7, 0, 2.25, 0, 0, 0, 0, 12); p.box(mossM(), 1.2, 0.4, 1.2, 0, 4.4, 0); p.box(mossM(), 1.0, 0.18, 1.0, 0, 4.1, 0); });
  def('columnBroken', 1.3, 1.3, 2.5, 4, (p) => { p.box(mossM(), 1.1, 0.4, 1.1, 0, 0.2, 0); p.cyl(mossM(), 0.42, 0.48, 1.6, 0, 1.2, 0, 0, 0, 0, 12); p.cyl(mossM(), 0.3, 0.42, 0.5, 0.05, 2.1, 0, 0.3, 0, 0.2, 7); p.box(mossM(), 0.8, 0.45, 0.6, 0.9, 0.25, 0.7, 0, 0.5, 0); });
  def('bigPipe', 5.6, 1.9, 1.9, 4, (p) => {
    p.cyl(mt.concrete(), 0.9, 0.9, 5.6, 0, 0.95, 0, 0, 0, Math.PI / 2, 20); for (const x of [-2.6, 0, 2.6]) p.tor(mt.dark(), 0.92, 0.08, x, 0.95, 0, 0, Math.PI / 2, 0);
    p.box(mt.dark(), 5.2, 0.12, 1.6, 0, 0.06, 0); p.cyl(mt.glow(0x2a3a18), 0.7, 0.7, 0.05, 2.78, 0.95, 0, 0, 0, Math.PI / 2, 14);
  });
  def('vending', 0.95, 0.85, 1.95, 2, (p, o) => { const c = o.color || 0x40d8ff; p.box(mt.red(), 0.95, 1.95, 0.85, 0, 0.975, 0); p.box(mt.glow(c), 0.7, 1.2, 0.02, -0.06, 1.2, 0.43); p.box(mt.dark(), 0.7, 0.2, 0.02, -0.06, 0.4, 0.43); p.box(mt.glass(), 0.15, 0.7, 0.02, 0.35, 1.2, 0.43); });
  def('hay', 1.5, 1.0, 1.1, 1, (p) => { const h = lam('hayB', { color: 0xc8a850 }); p.box(h, 1.4, 0.9, 0.9, 0, 0.5, 0); for (const z of [-0.25, 0.25]) p.box(lam('hayS', { color: 0x6a5a30 }), 1.42, 0.06, 0.04, 0, 0.5, z); });
  def('firewood', 1.9, 0.9, 1.3, 1, (p) => { for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - (r > 2 ? 1 : 0); i++) p.cyl(mt.wood(), 0.16, 0.16, 0.9, -0.55 + i * 0.37 + (r % 2) * 0.18, 0.2 + r * 0.3, 0, Math.PI / 2, 0, 0, 8); p.box(mt.wood(), 0.08, 1.3, 0.08, -1.0, 0.65, 0); p.box(mt.wood(), 0.08, 1.3, 0.08, 1.0, 0.65, 0); });
  def('snowman', 0.95, 0.95, 1.75, 1, (p) => { const w = lam('snowW', { color: 0xf4f8fc }); p.sph(w, 0.42, 0, 0.42, 0); p.sph(w, 0.31, 0, 1.0, 0); p.sph(w, 0.23, 0, 1.45, 0); p.cyl(mt.orange(), 0.0, 0.05, 0.3, 0, 1.45, 0.3, Math.PI / 2, 0, 0, 6); p.cyl(mt.black(), 0.2, 0.2, 0.22, 0, 1.78, 0, 0, 0, 0, 10); });
  def('barrelRow', 2.4, 0.9, 1.0, 2, (p) => { for (let i = 0; i < 3; i++) { p.cyl(mt.orange(), 0.37, 0.37, 0.95, -0.8 + i * 0.8, 0.5, 0, 0, 0, 0, 12); p.cyl(mt.dark(), 0.38, 0.38, 0.05, -0.8 + i * 0.8, 0.8, 0, 0, 0, 0, 12); p.cyl(mt.dark(), 0.38, 0.38, 0.05, -0.8 + i * 0.8, 0.25, 0, 0, 0, 0, 12); } });
  def('sandbagWall', 3.0, 0.9, 1.1, 3, (p) => { const s = lam('sbag', { color: 0xb8a878 }); for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - (r % 2); i++) p.sph(s, 0.32, -1.2 + i * 0.6 + (r % 2) * 0.3, 0.22 + r * 0.3, 0, 1.2, 0.55, 1.5); });
  // torre de vigia (convés a 4,4 m, sobe-se por escada de mão) e base de concreto (convés a 2,6 m, sobe-se por degraus)
  const twMat = (st) => st === 'stone' ? stoneW() : st === 'metal' ? lam('twMt', { color: 0x8a8e92, map: T('corrugated') }) : st === 'ruin' ? mossM() : st === 'ice' ? lam('twIc', { color: 0xe8eef4, map: T('planks') }) : mt.planks();
  const twRoof = (st) => st === 'stone' ? lam('twRs', { color: 0xb86a3a, map: T('terracotta') }) : st === 'metal' ? mt.dark() : st === 'ice' ? lam('twRi', { color: 0xf0f4f8, map: T('roofSnow') }) : lam('twRw', { color: 0x9a4a2a, map: T('roofRed') });
  def('watchTower', 3.4, 3.4, 4.4, 4, (p, o) => {
    const st = o.style || 'wood', body = twMat(st);
    p.box(body, 3.0, 4.1, 3.0, 0, 2.05, 0); p.box(mt.dark(), 3.1, 0.12, 3.1, 0, 1.4, 0); p.box(mt.dark(), 3.1, 0.12, 3.1, 0, 3.0, 0); p.box(body, 3.4, 0.3, 3.4, 0, 4.25, 0);
    for (const [x, z] of [[-1.55, -1.55], [1.55, -1.55], [-1.55, 1.55], [1.55, 1.55]]) { p.box(mt.wood(), 0.1, 1.05, 0.1, x, 4.9, z); if (st !== 'ruin') p.box(mt.wood(), 0.12, 2.0, 0.12, x, 5.4, z); }
    for (const z of [-1.55, 1.55]) { p.box(mt.wood(), 3.2, 0.07, 0.07, 0, 5.3, z); p.box(mt.wood(), 3.2, 0.07, 0.07, 0, 4.8, z); }
    for (const x of [-1.55, 1.55]) { p.box(mt.wood(), 0.07, 0.07, 3.2, x, 5.3, 0); p.box(mt.wood(), 0.07, 0.07, 3.2, x, 4.8, 0); }
    if (st !== 'ruin') p.cyl(twRoof(st), 0, 2.7, 1.1, 0, 7.0, 0, 0, Math.PI / 4, 0, 4);
    for (const [x, z, ry] of [[0, 1.52, 0], [0, -1.52, 0], [1.52, 0, Math.PI / 2], [-1.52, 0, Math.PI / 2]]) p.box(mt.black(), 0.5, 0.7, 0.05, x, 2.4, z, 0, ry, 0);
    const s = F.sign('VIGIA', '#2a2a2e', '#f0e0b0', null, 0.9, 0.4); s.position.set(0, 3.6, 1.52); p.loose.push(s);
  });
  def('baseBunker', 4.6, 4.6, 2.6, 4, (p, o) => {
    const st = o.style || 'wood', body = st === 'ruin' ? mossM() : st === 'stone' ? stoneW() : mt.concrete();
    p.box(body, 4.4, 2.4, 4.4, 0, 1.2, 0); p.box(body, 4.6, 0.2, 4.6, 0, 2.5, 0); p.box(mt.hazard(), 4.45, 0.14, 4.45, 0, 0.3, 0);
    for (const s of [-1, 1]) { p.box(mt.black(), 1.2, 0.35, 0.05, s * 1.0, 1.7, 2.21); p.box(mt.black(), 1.2, 0.35, 0.05, s * 1.0, 1.7, -2.21); }
    const sb = lam('sbag2', { color: 0xb8a878 }); for (const [x, z] of [[-2.0, -2.0], [2.0, -2.0], [-2.0, 2.0], [2.0, 2.0]]) for (let k = 0; k < 2; k++) p.sph(sb, 0.28, x, 2.75 + k * 0.3, z, 1.2, 0.6, 1.2);
    p.box(mt.wood(), 0.08, 2.6, 0.08, 1.8, 3.8, -1.8); p.box(lam('flg', { color: [0x9a1a1a, 0x1a3a8a, 0x2a6a3a, 0xc89a2a][(o.n || 0) % 4] }), 0.9, 0.55, 0.03, 2.3, 4.8, -1.8);
  });
  // duto/bueiro de passagem (só visual: as colisões são três blocos ocos criados pelo mapa), 3 m de largura, 6 m de comprimento ao longo de z
  def('ductTunnel', 3.0, 6.0, 2.8, 4, (p, o) => {
    const st = o.style || 'metal', body = st === 'stone' ? stoneW() : st === 'ruin' ? mossM() : st === 'wood' ? mt.planks() : st === 'ice' ? mt.concrete() : lam('ductM', { color: 0x8a8e92, map: T('corrugated') });
    p.box(body, 0.5, 2.8, 6.0, -1.25, 1.4, 0); p.box(body, 0.5, 2.8, 6.0, 1.25, 1.4, 0); p.box(body, 3.0, 0.6, 6.0, 0, 2.5, 0);
    for (const z of [-2.6, -1.0, 1.0, 2.6]) { p.box(mt.dark(), 3.2, 3.0, 0.14, 0, 1.4, z); }
    p.box(mt.hazard(), 3.0, 0.3, 0.05, 0, 0.15, 3.03); p.box(mt.hazard(), 3.0, 0.3, 0.05, 0, 0.15, -3.03);
    p.box(mt.glow(0xffe8b0), 0.3, 0.05, 1.0, 0, 2.17, -1.6); p.box(mt.glow(0xffe8b0), 0.3, 0.05, 1.0, 0, 2.17, 1.6);
    p.box(mt.black(), 1.2, 0.3, 0.04, 0, 1.7, -3.02);
  });
  F.make = (kind, o) => {
    o = o || {}; const fn = B[kind]; if (!fn) return new THREE.Group();
    const p = new Part(); fn(p, o); return p.finish();
  };
  // ----- cenário distante (sem colisão) -----
  F.coolingTower = (x, z, s) => {
    const pts = []; const H = 46 * s, rb = 20 * s, rw = 12.5 * s, rt = 14 * s;
    for (let i = 0; i <= 16; i++) { const t = i / 16, y = t * H; const r = t < 0.72 ? U.lerp(rb, rw, Math.sin(t / 0.72 * Math.PI / 2)) : U.lerp(rw, rt, (t - 0.72) / 0.28); pts.push(new THREE.Vector2(r, y)); }
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshLambertMaterial({ color: 0xc8c4bc, map: G.Tex.get('concrete', 256), side: THREE.DoubleSide }));
    m.position.set(x, 0, z); g.add(m);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(rt + 0.2, rt + 0.3, 2.5 * s, 40, 1, true), new THREE.MeshLambertMaterial({ color: 0xb03a2a, side: THREE.DoubleSide })); band.position.set(x, H - 3 * s, z); g.add(band);
    // vapor
    const tex = G.Tex.get('smoke', 128);
    for (let i = 0; i < 14; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xf4f4f2, transparent: true, depthWrite: false, opacity: 0.55, fog: true }));
      sp.position.set(x, H, z); g.add(sp);
      anim.push({ kind: 'steam', obj: sp, x, z, y0: H, t: i / 14 * 9, life: 9, r: rt });
    }
    return g;
  };
  F.containment = (x, z, s) => {
    const g = new THREE.Group(), cm = new THREE.MeshLambertMaterial({ color: 0xd4d0c8, map: G.Tex.get('concrete', 256) });
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(17 * s, 17 * s, 26 * s, 48), cm); cyl.position.set(x, 13 * s, z); g.add(cyl);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(17 * s, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), cm); dome.position.set(x, 26 * s, z); g.add(dome);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(17.3 * s, 17.3 * s, 1.2 * s, 48), new THREE.MeshLambertMaterial({ color: 0x8a8a84 })); ring.position.set(x, 26 * s, z); g.add(ring);
    const aux = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 14 * s, 16 * s), new THREE.MeshLambertMaterial({ color: 0xb8b4ac, map: G.Tex.get('concrete', 256) })); aux.position.set(x + 20 * s, 7 * s, z + 6 * s); g.add(aux);
    return g;
  };
  F.fan = (x, y, z, rotY, r) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY || 0;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.08, 6, 24), mt.dark()); g.add(ring);
    const hub = new THREE.Group(); g.add(hub);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(r * 0.28, r * 0.9, 0.02), mt.steel()); b.position.set(Math.cos(i / 5 * 6.283) * r * 0.45, Math.sin(i / 5 * 6.283) * r * 0.45, 0); b.rotation.z = i / 5 * 6.283 - Math.PI / 2; b.rotation.y = 0.4; hub.add(b); }
    anim.push({ kind: 'spin', obj: hub, speed: 6 });
    return g;
  };
  const U = G.U;
  F.update = (dt) => {
    for (let i = anim.length - 1; i >= 0; i--) {
      const a = anim[i];
      if (!a.obj.parent) { anim.splice(i, 1); continue; }
      if (a.kind === 'spin') a.obj.rotation.z += a.speed * dt;
      else if (a.kind === 'steam') {
        a.t = (a.t + dt) % a.life; const k = a.t / a.life;
        a.obj.position.set(a.x + k * 26 + Math.sin(a.t + a.x) * 2, a.y0 + k * 34, a.z + k * 8);
        const sz = a.r * (1.1 + k * 2.4); a.obj.scale.set(sz, sz, 1);
        a.obj.material.opacity = 0.6 * Math.min(1, k * 6) * (1 - k);
      }
    }
  };
})();
