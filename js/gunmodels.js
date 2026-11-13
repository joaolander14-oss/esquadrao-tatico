// Modelos detalhados de armas: perfis laterais extrudados com bordas arredondadas,
// canos cilíndricos, lunetas torneadas, trilhos, guarda-mato, gatilho etc.
// Convenção: origem no punho, cano aponta para -Z; "f" = distância para frente (m), "y" = altura.
(function () {
  const Mo = G.Models, U = G.U;
  const cache = {};
  const phong = (c, sh, sp, extra) => { const k = 'p' + c + ':' + sh + ':' + sp + (extra ? JSON.stringify(extra) : ''); return cache[k] || (cache[k] = new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: sh, specular: sp }, extra || {}))); };
  let woodTex = null;
  function wood(c) {
    if (!woodTex) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
      g.fillStyle = '#b07e4c'; g.fillRect(0, 0, 256, 256);
      const r = U.mulberry(77);
      for (let i = 0; i < 110; i++) {
        g.strokeStyle = `rgba(${60 + r() * 50},${30 + r() * 25},${10 + r() * 15},${0.2 + r() * 0.4})`; g.lineWidth = 0.5 + r() * 2.2;
        g.beginPath(); const y = r() * 256; g.moveTo(0, y);
        for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.025 + i) * 4 * r());
        g.stroke();
      }
      woodTex = new THREE.CanvasTexture(cv); woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(4, 8);
    }
    const k = 'w' + c; return cache[k] || (cache[k] = new THREE.MeshPhongMaterial({ map: woodTex, color: c, shininess: 35, specular: 0x2a2018 }));
  }
  const STEEL = () => phong(0x26282b, 70, 0x5a5a5a);       // aço oxidado
  const PARK = () => phong(0x34352f, 18, 0x262626);        // fosfatizado
  const DARK = () => phong(0x0c0c0c, 5, 0x111111);
  const BRIGHT = () => phong(0x9a9da2, 90, 0xaaaaaa);
  const poly = c => phong(c, 14, 0x1c1c1c);
  const lens = () => phong(0x0d2a4a, 120, 0x99bbff, { emissive: 0x06101c });

  // ---------- primitivas ----------
  function shapeOf(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); return s; }
  // extruda um perfil lateral (f,y) com espessura "depth" centrada em x
  function E(g, pts, depth, mat, o) {
    o = o || {};
    const s = pts instanceof THREE.Shape ? pts : shapeOf(pts);
    if (o.hole) { const h = new THREE.Path(); h.moveTo(o.hole[0][0], o.hole[0][1]); for (let i = 1; i < o.hole.length; i++) h.lineTo(o.hole[i][0], o.hole[i][1]); s.holes.push(h); }
    const b = o.bevel === undefined ? Math.min(0.003, depth * 0.22) : o.bevel;
    const geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0004, depth - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: o.seg || 2, curveSegments: o.curve || 10 });
    geo.rotateY(Math.PI / 2);
    geo.translate((o.x || 0) - (depth / 2 - b), 0, 0);
    const m = new THREE.Mesh(geo, mat); g.add(m); return m;
  }
  // cilindro ao longo do cano
  function cz(g, r, f0, f1, y, mat, o) {
    o = o || {};
    const geo = new THREE.CylinderGeometry(o.r1 !== undefined ? o.r1 : r, r, Math.abs(f1 - f0), o.seg || 14);
    geo.rotateX(-Math.PI / 2);
    geo.translate(o.x || 0, y, -(f0 + f1) / 2);
    const m = new THREE.Mesh(geo, mat); g.add(m); return m;
  }
  function cx(g, r, len, f, y, x, mat) { const geo = new THREE.CylinderGeometry(r, r, len, 10); geo.rotateZ(Math.PI / 2); geo.translate(x, y, -f); const m = new THREE.Mesh(geo, mat); g.add(m); return m; }
  function cy(g, r, h, f, y, x, mat, seg) { const geo = new THREE.CylinderGeometry(r, r, h, seg || 14); geo.translate(x || 0, y, -f); const m = new THREE.Mesh(geo, mat); g.add(m); return m; }
  function bx(g, w, h, d, f, y, x, mat) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x || 0, y, -f); g.add(m); return m; }
  function sph(g, r, f, y, x, mat) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat); m.position.set(x || 0, y, -f); g.add(m); return m; }
  // sólido de revolução: prof = [[raio, t], ...]; axis 'z' (ao longo do cano) ou 'y'
  function lathe(g, prof, f0, y, mat, axis, x) {
    const geo = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(Math.max(0.0005, p[0]), p[1])), 18);
    if (axis !== 'y') geo.rotateX(-Math.PI / 2);
    geo.translate(x || 0, y, axis === 'y' ? -f0 : -f0);
    const m = new THREE.Mesh(geo, mat); g.add(m); return m;
  }
  // trilho picatinny (um único perfil dentado)
  function rail(g, f0, f1, y, h, depth, mat) {
    const p = 0.0105, pts = [[f0, y], [f1, y]];
    for (let f = f1; f > f0 + p * 0.6; f -= p) pts.push([f, y + h * 0.55], [f, y + h], [f - p * 0.55, y + h], [f - p * 0.55, y + h * 0.55]);
    pts.push([f0, y + h * 0.55]);
    return E(g, pts, depth, mat, { bevel: 0.0008 });
  }
  // ---------- peças comuns ----------
  function grip(g, f, mat, k) {
    k = k || 1;
    const s = new THREE.Shape();
    s.moveTo(f + 0.012, 0.004); s.lineTo(f - 0.03, 0.004);
    s.quadraticCurveTo(f - 0.045, -0.04 * k, f - 0.064, -0.1 * k);
    s.lineTo(f - 0.03, -0.108 * k);
    s.quadraticCurveTo(f - 0.02, -0.075 * k, f - 0.012, -0.062 * k);
    s.quadraticCurveTo(f - 0.008, -0.05 * k, f - 0.004, -0.044 * k);
    s.quadraticCurveTo(f + 0.0, -0.03 * k, f + 0.006, -0.018 * k);
    s.lineTo(f + 0.012, 0.004);
    E(g, s, 0.031, mat, { bevel: 0.006 });
  }
  function trig(g, f, mat, len) {
    const L = len || 0.075;
    E(g, [[f + L, 0.003], [f + L + 0.007, 0.003], [f + L + 0.005, -0.012], [f + L - 0.025, -0.041], [f + 0.0, -0.041], [f + 0.0, -0.033], [f + L - 0.028, -0.033], [f + L - 0.003, -0.01], [f + L - 0.002, 0.003]], 0.012, mat, { bevel: 0.0015 });
    E(g, [[f + L * 0.52, 0.003], [f + L * 0.52 + 0.007, 0.003], [f + L * 0.52 + 0.004, -0.015], [f + L * 0.52 - 0.004, -0.026], [f + L * 0.52 - 0.006, -0.022], [f + L * 0.52 - 0.001, -0.013]], 0.006, STEEL(), { bevel: 0.001 });
  }
  function mag(g, f, w, len, curve, mat, y, depth) {
    y = y || 0;
    const s = new THREE.Shape();
    s.moveTo(f, y); s.lineTo(f + w, y);
    s.quadraticCurveTo(f + w + curve * 0.25, y - len * 0.55, f + w + curve, y - len);
    s.lineTo(f + curve - 0.002, y - len - 0.006);
    s.quadraticCurveTo(f + curve * 0.25, y - len * 0.55, f, y);
    E(g, s, depth || 0.026, mat, { bevel: 0.003 }).userData.mag = true;
    // base do carregador
    E(g, [[f + curve - 0.006, y - len - 0.004], [f + w + curve + 0.004, y - len + 0.002], [f + w + curve + 0.004, y - len - 0.008], [f + curve - 0.006, y - len - 0.014]], (depth || 0.026) + 0.004, mat, { bevel: 0.002 }).userData.mag = true;
    if (!g.userData.magPos) { g.userData.magPos = new THREE.Vector3(0, y - len * 0.5, -(f + w / 2 + curve / 2)); g.userData.magDim = [depth || 0.026, len, w + 0.006]; }
  }
  function flashHider(g, f, y, r) {
    cz(g, r, f, f + 0.048, y, STEEL());
    const d = DARK();
    for (let i = 0; i < 4; i++) { const m = bx(g, 0.003, r * 2.05, 0.03, f + 0.028, y, 0, d); m.rotation.z = i * Math.PI / 4; }
    return f + 0.048;
  }
  function brake(g, f, y, r) {
    cz(g, r, f, f + 0.05, y, STEEL());
    for (let i = 0; i < 3; i++) { bx(g, r * 2.2, r * 0.9, 0.007, f + 0.012 + i * 0.013, y, 0, DARK()); }
    return f + 0.05;
  }
  function suppressor(g, f, len, y, r) {
    const m = phong(0x1b1c1d, 30, 0x333333);
    cz(g, r * 0.75, f - 0.012, f, y, m);
    cz(g, r, f, f + len, y, m);
    cz(g, r * 1.04, f + len - 0.012, f + len, y, STEEL());
    for (let i = 1; i < 4; i++) cz(g, r * 1.02, f + len * i / 4 - 0.002, f + len * i / 4 + 0.002, y, DARK());
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.3, 10), DARK()); disc.position.set(0, y, -(f + len) - 0.0005); disc.rotation.y = Math.PI; g.add(disc);
    return f + len;
  }
  function scope(g, f0, f1, y, r, objR, baseY, o) {
    o = o || {};
    const L = f1 - f0, body = phong(o.color || 0x1a1b1d, 40, 0x444444), er = r * 1.45;
    lathe(g, [[0, 0], [er, 0], [er, 0.045], [r * 1.05, 0.075], [r, 0.09], [r, L - 0.1], [objR, L - 0.035], [objR, L], [0, L]], f0, y, body);
    const lf = new THREE.Mesh(new THREE.CircleGeometry(objR * 0.86, 18), lens()); lf.position.set(0, y, -f1 - 0.0008); lf.rotation.y = Math.PI; g.add(lf);
    const lb = new THREE.Mesh(new THREE.CircleGeometry(er * 0.8, 18), lens()); lb.position.set(0, y, -f0 + 0.0008); g.add(lb);
    const mid = f0 + L * 0.48;
    cy(g, r * 0.62, 0.022, mid, y + r + 0.01, 0, body); cy(g, r * 0.7, 0.006, mid, y + r + 0.022, 0, BRIGHT());
    cx(g, r * 0.62, 0.022, mid, y, r + 0.01, body);
    if (baseY !== undefined) for (const fr of [0.3, 0.68]) {
      const fm = f0 + L * fr;
      cz(g, r * 1.18, fm - 0.011, fm + 0.011, y, PARK());
      bx(g, r * 1.3, y - baseY, 0.024, fm, (y + baseY) / 2 - r * 0.4, 0, PARK());
    }
  }
  function sightPost(g, f, y0, y1, mat) {
    E(g, [[f, y0], [f + 0.034, y0], [f + 0.027, y1], [f + 0.007, y1]], 0.014, mat, { bevel: 0.0015, hole: [[f + 0.011, y0 + (y1 - y0) * 0.5], [f + 0.023, y0 + (y1 - y0) * 0.5], [f + 0.022, y1 - 0.012], [f + 0.012, y1 - 0.012]] });
    bx(g, 0.003, 0.016, 0.003, f + 0.017, y1 - 0.01, 0, mat);
  }
  function bipodFolded(g, f0, f1, y, x) {
    for (const s of [-1, 1]) { cz(g, 0.004, f0, f1, y, STEEL(), { x: s * x, seg: 8 }); sph(g, 0.006, f1, y, s * x, phong(0x111111, 5, 0x111111)); }
    bx(g, x * 2 + 0.012, 0.016, 0.02, f0, y + 0.006, 0, PARK());
  }

  // ---------- famílias ----------
  function akFamily(g, def, o) {
    const st = PARK(), bl = STEEL();
    const fm = o.wood ? wood(0xd09a68) : poly(o.furn || 0x2b2a26);
    E(g, [[-0.12, 0.004], [0.2, 0.004], [0.2, 0.07], [0.17, 0.077], [-0.09, 0.081], [-0.12, 0.07]], 0.046, st, { bevel: 0.005 });
    E(g, [[-0.1, 0.07], [0.165, 0.074], [0.165, 0.083], [-0.085, 0.086]], 0.04, st, { bevel: 0.006 });      // tampa
    E(g, [[-0.07, 0.05], [0.15, 0.055], [0.15, 0.063], [-0.07, 0.059]], 0.003, bl, { x: 0.0245, bevel: 0 });    // seletor
    cx(g, 0.0055, 0.032, 0.135, 0.058, 0.035, bl); sph(g, 0.007, 0.135, 0.058, 0.052, bl);                   // alavanca
    bx(g, 0.002, 0.018, 0.075, 0.08, 0.057, 0.0236, DARK());                                               // janela de ejeção
    E(g, [[0.19, 0.07], [0.25, 0.075], [0.25, 0.09], [0.215, 0.093], [0.19, 0.083]], 0.027, st);           // alça de mira
    E(g, [[0.2, 0.006], [0.4, 0.014], [0.4, 0.057], [0.2, 0.062]], 0.056, fm, { bevel: 0.008 });           // guarda-mão inferior
    for (let i = 0; i < 3; i++) bx(g, 0.058, 0.004, 0.006, 0.24 + i * 0.05, 0.035, 0, o.wood ? phong(0x4a2c14, 10, 0x111111) : DARK());
    cz(g, 0.017, 0.215, 0.372, 0.084, fm); cz(g, 0.0095, 0.372, 0.455, 0.084, st);                     // cobertura do gás
    E(g, [[0.43, 0.036], [0.468, 0.036], [0.468, 0.096], [0.44, 0.096]], 0.026, st);
    cz(g, 0.0105, 0.4, 0.62, 0.05, bl);
    E(g, [[0.545, 0.04], [0.578, 0.04], [0.572, 0.11], [0.562, 0.12], [0.553, 0.112]], 0.02, st, { hole: [[0.556, 0.074], [0.569, 0.074], [0.568, 0.104], [0.557, 0.104]] });
    const end = brake(g, 0.6, 0.05, 0.0145);
    mag(g, 0.088, 0.058, 0.2, 0.055, o.wood ? phong(0x8a4b22, 40, 0x332211) : st, 0.004, 0.029);
    grip(g, 0.0, o.wood ? phong(0x6a3a1c, 30, 0x221510) : fm);
    trig(g, 0.0, st);
    if (o.stock === 'skel') {
      E(g, [[-0.118, 0.066], [-0.4, 0.056], [-0.41, 0.045], [-0.41, -0.07], [-0.38, -0.072], [-0.2, -0.02], [-0.118, 0.006]], 0.036, poly(0x232323), { bevel: 0.005, hole: [[-0.37, 0.035], [-0.16, 0.044], [-0.16, 0.01], [-0.37, -0.04]] });
    } else {
      const s = new THREE.Shape();
      s.moveTo(-0.118, 0.068); s.lineTo(-0.118, 0.008); s.quadraticCurveTo(-0.17, -0.02, -0.25, -0.045);
      s.lineTo(-0.405, -0.08); s.lineTo(-0.415, -0.08); s.lineTo(-0.415, 0.057); s.quadraticCurveTo(-0.3, 0.06, -0.118, 0.068);
      E(g, s, 0.043, fm, { bevel: 0.007 });
      E(g, [[-0.427, -0.082], [-0.413, -0.082], [-0.413, 0.059], [-0.427, 0.059]], 0.045, st, { bevel: 0.003 });
    }
    if (o.scope) { rail(g, -0.06, 0.15, 0.086, 0.01, 0.02, st); scope(g, -0.09, 0.2, 0.125, 0.017, 0.025, 0.096); }
    g.userData.muzzle.position.set(0, 0.05, -end);
    g.userData.lh = [0.31, 0.006];
  }
  function arFamily(g, def, o) {
    const st = STEEL(), body = phong(o.body || 0x2b2d30, 28, 0x3a3a3a), fm = poly(o.furn || 0x1d1e1f);
    E(g, [[-0.115, 0.0], [0.07, 0.0], [0.075, -0.032], [0.16, -0.032], [0.162, 0.035], [-0.115, 0.035], [-0.127, 0.018]], 0.041, body, { bevel: 0.0035 });
    E(g, [[-0.115, 0.035], [0.162, 0.035], [0.162, 0.084], [-0.115, 0.084]], 0.045, body, { bevel: 0.004 });
    rail(g, -0.11, 0.16, 0.084, 0.012, 0.023, body);
    bx(g, 0.002, 0.02, 0.062, 0.05, 0.06, 0.0235, DARK());
    cz(g, 0.0075, -0.075, -0.05, 0.068, body, { x: 0.024 });
    E(g, [[-0.145, 0.07], [-0.112, 0.07], [-0.112, 0.082], [-0.145, 0.082]], 0.042, st);
    E(g, [[-0.04, 0.02], [0.03, 0.02], [0.03, 0.03], [-0.04, 0.03]], 0.004, st, { x: 0.022, bevel: 0 });   // seletor
    const hg = o.hg || 0.25, hgEnd = 0.162 + hg;
    E(g, [[0.162, 0.012], [hgEnd, 0.012], [hgEnd, 0.09], [0.162, 0.09]], 0.056, fm, { bevel: 0.009 });
    rail(g, 0.17, hgEnd - 0.008, 0.09, 0.01, 0.022, fm);
    for (let i = 0; i < Math.floor(hg / 0.05); i++) { bx(g, 0.0605, 0.02, 0.026, 0.19 + i * 0.05, 0.05, 0, DARK()); }
    const bEnd = hgEnd + (o.barrel || 0.13);
    cz(g, 0.0095, hgEnd, bEnd, 0.05, st);
    cz(g, 0.013, hgEnd + 0.01, hgEnd + 0.03, 0.05, st);
    if (!o.scope) sightPost(g, hgEnd + 0.005, 0.04, 0.128, st);
    let end;
    if (o.silencer) end = suppressor(g, bEnd, 0.17, 0.05, 0.02);
    else end = o.brake ? brake(g, bEnd, 0.05, 0.015) : flashHider(g, bEnd, 0.05, 0.0125);
    mag(g, 0.08, 0.074, o.magLen || 0.165, o.magCurve !== undefined ? o.magCurve : 0.02, o.magMat || PARK(), -0.03, o.magW || 0.025);
    grip(g, 0.0, fm);
    trig(g, 0.0, st, 0.07);
    cz(g, 0.015, -0.3, -0.115, 0.05, body);
    if (o.stock === 'skel') {
      E(g, [[-0.13, 0.086], [-0.43, 0.077], [-0.44, 0.065], [-0.44, -0.07], [-0.4, -0.074], [-0.24, -0.005], [-0.13, 0.016]], 0.04, fm, { bevel: 0.006, hole: [[-0.38, 0.058], [-0.17, 0.066], [-0.17, 0.035], [-0.38, -0.025]] });
      E(g, [[-0.33, 0.077], [-0.2, 0.08], [-0.2, 0.096], [-0.32, 0.094]], 0.032, fm, { bevel: 0.006 });
    } else {
      const s = new THREE.Shape();
      s.moveTo(-0.2, 0.078); s.lineTo(-0.33, 0.073); s.quadraticCurveTo(-0.348, 0.07, -0.348, 0.05);
      s.lineTo(-0.348, -0.055); s.lineTo(-0.318, -0.06); s.quadraticCurveTo(-0.26, -0.02, -0.2, 0.022);
      E(g, s, 0.043, fm, { bevel: 0.007 });
      E(g, [[-0.358, 0.072], [-0.346, 0.072], [-0.346, -0.06], [-0.358, -0.06]], 0.045, phong(0x111111, 5, 0x111111), { bevel: 0.003 });
    }
    if (o.scope) scope(g, -0.1, o.scopeLen || 0.2, 0.128, o.scopeR || 0.018, o.objR || 0.027, 0.096);
    else E(g, [[-0.085, 0.096], [-0.045, 0.096], [-0.05, 0.126], [-0.075, 0.13]], 0.026, st, { hole: [[-0.07, 0.112], [-0.058, 0.112], [-0.058, 0.122], [-0.07, 0.122]] });
    if (o.bipod) bipodFolded(g, hgEnd - 0.02, hgEnd + 0.18, 0.006, 0.016);
    g.userData.muzzle.position.set(0, 0.05, -end);
    g.userData.lh = [0.27, 0.012];
  }
  function bullpup(g, def, o) {
    const st = STEEL(), fm = poly(o.furn || 0x2c3540), dk = poly(0x161616);
    const s = new THREE.Shape();
    s.moveTo(-0.43, -0.055); s.lineTo(-0.43, 0.06); s.quadraticCurveTo(-0.42, 0.078, -0.38, 0.078);
    s.lineTo(0.16, 0.078); s.quadraticCurveTo(0.24, 0.074, 0.245, 0.055); s.lineTo(0.245, 0.014);
    s.lineTo(0.1, 0.006); s.lineTo(0.02, 0.006); s.lineTo(0.02, 0.0); s.lineTo(-0.08, 0.0);
    s.quadraticCurveTo(-0.1, -0.024, -0.13, -0.025); s.lineTo(-0.25, -0.025); s.quadraticCurveTo(-0.33, -0.03, -0.38, -0.055);
    E(g, s, 0.058, fm, { bevel: 0.01 });
    E(g, [[-0.445, -0.058], [-0.428, -0.058], [-0.428, 0.064], [-0.445, 0.064]], 0.06, dk, { bevel: 0.004 });
    for (let i = 0; i < 4; i++) bx(g, 0.0605, 0.006, 0.03, 0.04 + i * 0.045, 0.045, 0, DARK());
    bx(g, 0.002, 0.02, 0.06, -0.2, 0.05, 0.03, DARK());
    mag(g, -0.215, 0.072, 0.155, 0.018, PARK(), -0.024, 0.025);
    grip(g, 0.0, dk); trig(g, 0.0, st, 0.07);
    cz(g, 0.0095, 0.245, 0.36, 0.045, st);
    const end = flashHider(g, 0.36, 0.045, 0.012);
    if (o.handle) {
      E(g, [[-0.15, 0.078], [0.13, 0.078], [0.11, 0.138], [-0.13, 0.138]], 0.024, fm, { bevel: 0.006, hole: [[-0.105, 0.09], [0.085, 0.09], [0.073, 0.122], [-0.093, 0.122]] });
      E(g, [[0.12, 0.078], [0.2, 0.074], [0.2, 0.098], [0.15, 0.1]], 0.012, st);
      g.userData.lh = [0.17, 0.006];
    }
    if (o.scope) {
      E(g, [[-0.14, 0.078], [0.12, 0.078], [0.1, 0.094], [-0.12, 0.094]], 0.03, fm, { bevel: 0.005 });
      scope(g, -0.13, 0.14, 0.128, 0.019, 0.028, 0.094, { color: o.scopeColor || 0x1b1c1e });
      E(g, [[0.15, 0.006], [0.19, 0.006], [0.185, -0.088], [0.155, -0.092]], 0.03, dk, { bevel: 0.007 });
      g.userData.lh = [0.17, -0.05];
    }
    g.userData.muzzle.position.set(0, 0.045, -end);
  }
  function pdw(g, def) {
    const st = STEEL(), fm = poly(0x26282a);
    const s = new THREE.Shape();
    s.moveTo(-0.27, -0.068); s.lineTo(-0.27, 0.05); s.quadraticCurveTo(-0.265, 0.07, -0.22, 0.07);
    s.lineTo(0.16, 0.07); s.quadraticCurveTo(0.23, 0.066, 0.235, 0.035); s.lineTo(0.235, 0.004);
    s.lineTo(0.075, 0.004); s.quadraticCurveTo(0.07, -0.07, 0.04, -0.108); s.lineTo(-0.06, -0.112);
    s.quadraticCurveTo(-0.1, -0.08, -0.11, -0.05); s.quadraticCurveTo(-0.2, -0.06, -0.27, -0.068);
    E(g, s, 0.06, fm, { bevel: 0.012, hole: [[-0.06, -0.018], [0.035, -0.018], [0.045, -0.085], [-0.055, -0.092]] });
    E(g, [[-0.16, 0.07], [0.16, 0.07], [0.16, 0.093], [-0.16, 0.093]], 0.05, phong(0x6b5a32, 80, 0x888888, { transparent: true, opacity: 0.78 }), { bevel: 0.004 });
    for (let i = 0; i < 8; i++) cz(g, 0.0035, -0.14 + i * 0.038, -0.12 + i * 0.038, 0.081, phong(0xc8a050, 60, 0x886633), { x: 0.0 });
    E(g, [[0.0, 0.093], [0.07, 0.093], [0.064, 0.118], [0.008, 0.118]], 0.032, fm, { bevel: 0.004, hole: [[0.016, 0.098], [0.056, 0.098], [0.052, 0.112], [0.02, 0.112]] });
    cz(g, 0.009, 0.235, 0.275, 0.04, st); cz(g, 0.012, 0.262, 0.28, 0.04, st);
    E(g, [[0.03, -0.035], [0.062, -0.035], [0.062, 0.0], [0.03, 0.0]], 0.012, st, { bevel: 0.001 });
    g.userData.muzzle.position.set(0, 0.04, -0.28);
    g.userData.lh = [0.18, 0.004];
  }
  function smg(g, def, o) {
    const st = STEEL(), body = o.wood ? PARK() : poly(o.body || 0x222324), fm = o.wood ? wood(0xc89060) : poly(o.furn || 0x1c1c1c);
    E(g, [[-0.1, 0.0], [0.15, 0.0], [0.15, 0.072], [-0.075, 0.076], [-0.1, 0.062]], 0.046, body, { bevel: 0.006 });
    rail(g, -0.07, 0.13, 0.075, 0.009, 0.02, st);
    bx(g, 0.002, 0.016, 0.05, 0.05, 0.05, 0.0235, DARK());
    cx(g, 0.005, 0.028, 0.11, 0.055, -0.035, st);
    E(g, [[0.15, 0.018], [0.205, 0.024], [0.205, 0.064], [0.15, 0.07]], 0.04, body, { bevel: 0.005 });
    let end;
    if (o.supp) { end = suppressor(g, 0.205, 0.17, 0.045, 0.024); }
    else { cz(g, 0.009, 0.205, 0.245, 0.045, st); end = 0.258; cz(g, 0.012, 0.243, 0.258, 0.045, st); }
    E(g, [[0.19, 0.064], [0.205, 0.064], [0.203, 0.088], [0.193, 0.088]], 0.01, st);
    if (o.magInGrip) {
      grip(g, 0.0, fm, 0.95);
      E(g, [[-0.012, -0.095], [-0.05, -0.095], [-0.078, -0.205], [-0.042, -0.21]], 0.024, PARK(), { bevel: 0.003 });
    } else {
      grip(g, 0.0, fm);
      if (!o.helix) mag(g, 0.075, 0.05, o.magLen || 0.17, o.magCurve !== undefined ? o.magCurve : 0.035, PARK(), 0.0, 0.025);
    }
    trig(g, 0.0, st, 0.068);
    if (o.helix) {
      const hm = poly(0x2a2620);
      cz(g, 0.032, 0.02, 0.27, -0.03, hm);
      for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.0325, 0.0035, 6, 18), DARK()); t.position.set(0, -0.03, -(0.035 + i * 0.026)); t.rotation.y = 0.18; g.add(t); }
      cz(g, 0.012, 0.27, 0.285, -0.03, hm);
    }
    if (o.fg) { E(g, [[0.125, 0.0], [0.16, 0.0], [0.155, -0.085], [0.13, -0.088]], 0.028, fm, { bevel: 0.007 }); g.userData.lh = [0.14, -0.045]; }
    else g.userData.lh = [0.175, 0.016];
    if (o.stock === 'wire') {
      E(g, [[-0.1, 0.064], [-0.33, 0.056], [-0.335, 0.045], [-0.335, -0.06], [-0.31, -0.062], [-0.31, 0.034], [-0.1, 0.04]], 0.03, PARK(), { bevel: 0.003, hole: [[-0.32, 0.04], [-0.315, 0.04], [-0.315, 0.03], [-0.32, 0.03]] });
      E(g, [[-0.345, 0.06], [-0.33, 0.06], [-0.33, -0.066], [-0.345, -0.066]], 0.04, poly(0x111111), { bevel: 0.004 });
    } else if (o.stock === 'fixed') {
      E(g, [[-0.1, 0.07], [-0.36, 0.06], [-0.37, 0.045], [-0.37, -0.07], [-0.33, -0.072], [-0.2, -0.02], [-0.1, 0.006]], 0.04, fm, { bevel: 0.007, hole: [[-0.32, 0.04], [-0.15, 0.05], [-0.15, 0.022], [-0.32, -0.04]] });
    } else if (o.stock === 'fold') {
      E(g, [[-0.07, 0.018], [0.13, 0.018], [0.13, 0.042], [-0.07, 0.042]], 0.009, fm, { x: 0.031, bevel: 0.002 });
      E(g, [[0.12, -0.0], [0.145, -0.0], [0.145, 0.06], [0.12, 0.06]], 0.009, poly(0x111111), { x: 0.031, bevel: 0.002 });
    } else if (o.stock === 'tube') {
      cz(g, 0.006, -0.3, -0.1, 0.06, st, { x: 0.016 }); cz(g, 0.006, -0.3, -0.1, 0.06, st, { x: -0.016 });
      E(g, [[-0.315, 0.07], [-0.298, 0.07], [-0.298, -0.04], [-0.315, -0.04]], 0.044, poly(0x111111), { bevel: 0.004 });
    }
    g.userData.muzzle.position.set(0, 0.045, -end);
  }
  function pistol(g, def, o) {
    o = o || {};
    const st = STEEL(), slide = o.slide || STEEL(), frame = poly(o.frame || 0x1d1d1d);
    const L = o.long ? 0.15 : 0.125;
    E(g, [[-0.066, 0.05], [L, 0.05], [L, 0.081], [L - 0.012, 0.088], [-0.056, 0.088], [-0.066, 0.079]], 0.03, slide, { bevel: 0.0035 });
    for (let i = 0; i < 6; i++) bx(g, 0.0312, 0.026, 0.0022, -0.05 + i * 0.007, 0.069, 0, DARK());
    bx(g, 0.002, 0.012, 0.03, 0.035, 0.076, 0.0155, DARK());
    bx(g, 0.005, 0.008, 0.007, L - 0.012, 0.092, 0, st);
    E(g, [[-0.058, 0.088], [-0.035, 0.088], [-0.035, 0.097], [-0.058, 0.097]], 0.022, st, { bevel: 0.001 });
    bx(g, 0.0035, 0.006, 0.006, -0.046, 0.096, 0, DARK());
    cz(g, 0.0068, L - 0.004, L + 0.003, 0.07, DARK());
    if (o.rib) E(g, [[-0.02, 0.088], [L, 0.088], [L, 0.094], [-0.02, 0.094]], 0.012, slide, { bevel: 0.001 });
    const s = new THREE.Shape();
    s.moveTo(L - 0.003, 0.052); s.lineTo(L - 0.003, 0.036); s.lineTo(0.05, 0.032); s.lineTo(0.012, 0.03);
    s.quadraticCurveTo(0.004, -0.02, 0.003, -0.076); s.lineTo(-0.036, -0.084);
    s.quadraticCurveTo(-0.064, -0.08, -0.06, -0.06); s.quadraticCurveTo(-0.05, 0.0, -0.062, 0.036);
    s.quadraticCurveTo(-0.072, 0.045, -0.066, 0.052);
    E(g, s, 0.028, frame, { bevel: 0.0045 });
    rail(g, 0.06, L - 0.008, 0.024, 0.009, 0.02, frame);
    E(g, [[0.058, 0.033], [0.067, 0.033], [0.067, 0.0], [0.056, -0.014], [0.006, -0.014], [0.006, -0.006], [0.052, -0.006], [0.058, 0.002]], 0.012, frame, { bevel: 0.0015 });
    E(g, [[0.034, 0.03], [0.041, 0.03], [0.038, 0.01], [0.03, 0.003], [0.029, 0.008], [0.033, 0.016]], 0.006, st, { bevel: 0.001 });
    for (const sd of [-1, 1]) E(g, [[0.0, 0.02], [-0.052, 0.024], [-0.056, -0.07], [-0.006, -0.068]], 0.002, poly(0x101010), { x: sd * 0.0148, bevel: 0 });
    E(g, [[0.006, -0.074], [-0.04, -0.083], [-0.04, -0.092], [0.006, -0.083]], 0.03, frame, { bevel: 0.002 });
    E(g, [[-0.062, 0.078], [-0.055, 0.078], [-0.07, 0.094], [-0.077, 0.09]], 0.008, st, { bevel: 0.001 });       // cão
    let end = L + 0.003;
    if (o.ext) { E(g, [[0.004, -0.08], [-0.04, -0.088], [-0.052, -0.19], [-0.012, -0.185]], 0.024, PARK(), { bevel: 0.003 }); }
    if (o.comp) { E(g, [[L, 0.05], [L + 0.035, 0.05], [L + 0.035, 0.088], [L, 0.088]], 0.03, st, { bevel: 0.003 }); for (let i = 0; i < 3; i++) bx(g, 0.012, 0.004, 0.005, L + 0.008 + i * 0.01, 0.0885, 0, DARK()); end = L + 0.035; }
    if (o.supp) end = suppressor(g, end, 0.14, 0.07, 0.016);
    g.userData.muzzle.position.set(0, 0.07, -end);
    g.userData.lh = null;
  }
  function revolver(g, def) {
    const st = phong(0x4a4c50, 80, 0x888888), wd = wood(0x9c6a40);
    E(g, [[-0.045, 0.045], [0.052, 0.045], [0.052, 0.092], [-0.035, 0.097], [-0.05, 0.082]], 0.026, st, { bevel: 0.004 });
    cz(g, 0.025, 0.0, 0.052, 0.066, st, { seg: 18 });
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; cz(g, 0.0045, 0.002, 0.05, 0.066 + Math.sin(a) * 0.021, DARK(), { x: Math.cos(a) * 0.021, seg: 6 }); }
    cz(g, 0.0095, 0.052, 0.2, 0.075, st);
    E(g, [[0.052, 0.08], [0.2, 0.08], [0.2, 0.091], [0.052, 0.093]], 0.012, st, { bevel: 0.001 });
    cz(g, 0.0065, 0.052, 0.16, 0.058, st);
    E(g, [[0.186, 0.09], [0.2, 0.09], [0.198, 0.102], [0.19, 0.102]], 0.005, st, { bevel: 0 });
    E(g, [[-0.05, 0.08], [-0.04, 0.08], [-0.056, 0.106], [-0.068, 0.101]], 0.009, st, { bevel: 0.001 });
    const s = new THREE.Shape();
    s.moveTo(-0.048, 0.05); s.lineTo(0.0, 0.046); s.quadraticCurveTo(-0.004, -0.02, 0.004, -0.075);
    s.lineTo(-0.038, -0.086); s.quadraticCurveTo(-0.072, -0.02, -0.05, 0.04);
    E(g, s, 0.032, wd, { bevel: 0.006 });
    E(g, [[0.04, 0.046], [0.048, 0.046], [0.048, 0.01], [0.036, -0.005], [0.002, -0.005], [0.002, 0.002], [0.032, 0.002], [0.04, 0.012]], 0.011, st, { bevel: 0.0015 });
    E(g, [[0.024, 0.045], [0.031, 0.045], [0.027, 0.022], [0.02, 0.016], [0.019, 0.021], [0.023, 0.03]], 0.006, st, { bevel: 0.001 });
    g.userData.muzzle.position.set(0, 0.075, -0.2);
    g.userData.lh = null;
  }
  function shotgun(g, def, o) {
    const st = STEEL(), fm = o.wood ? wood(0xd09a68) : poly(0x1d1d1d);
    E(g, [[-0.1, 0.0], [0.13, 0.0], [0.13, 0.072], [-0.07, 0.078], [-0.1, 0.066]], 0.046, st, { bevel: 0.005 });
    bx(g, 0.002, 0.024, 0.07, 0.05, 0.048, 0.0236, DARK());
    const bEnd = o.barrel || 0.62;
    cz(g, 0.012, 0.13, bEnd, 0.054, st);
    E(g, [[0.13, 0.064], [bEnd, 0.064], [bEnd, 0.07], [0.13, 0.07]], 0.008, st, { bevel: 0 });
    sph(g, 0.0035, bEnd - 0.01, 0.073, 0, BRIGHT());
    if (o.tube !== false) { cz(g, 0.011, 0.13, Math.min(bEnd - 0.04, 0.56), 0.024, st); cz(g, 0.0125, Math.min(bEnd - 0.04, 0.56) - 0.012, Math.min(bEnd - 0.04, 0.56), 0.024, st); }
    if (o.boxMag) { mag(g, 0.06, 0.06, 0.09, 0.0, PARK(), 0.0, 0.032); }
    const pf = o.pumpAt || 0.24;
    if (o.pump !== false) {
      E(g, [[pf, 0.004], [pf + 0.17, 0.004], [pf + 0.17, 0.046], [pf, 0.046]], 0.052, o.wood ? wood(0xc08858) : poly(0x222222), { bevel: 0.013 });
      for (let i = 0; i < 6; i++) bx(g, 0.056, 0.003, 0.006, pf + 0.02 + i * 0.025, 0.006, 0, DARK());
    }
    if (o.vgrip) { E(g, [[pf + 0.04, 0.006], [pf + 0.08, 0.006], [pf + 0.075, -0.085], [pf + 0.045, -0.088]], 0.028, poly(0x1a1a1a), { bevel: 0.007 }); g.userData.lh = [pf + 0.06, -0.045]; }
    else g.userData.lh = [pf + 0.085, 0.004];
    trig(g, 0.0, st);
    if (o.stock === 'classic') {
      const s = new THREE.Shape();
      s.moveTo(-0.098, 0.068); s.lineTo(-0.098, 0.003); s.lineTo(-0.028, -0.004);
      s.quadraticCurveTo(-0.032, -0.05, -0.052, -0.078); s.lineTo(-0.085, -0.084);
      s.quadraticCurveTo(-0.1, -0.05, -0.15, -0.045); s.lineTo(-0.42, -0.088);
      s.lineTo(-0.44, -0.088); s.lineTo(-0.44, 0.064); s.quadraticCurveTo(-0.3, 0.07, -0.098, 0.068);
      E(g, s, 0.044, fm, { bevel: 0.008 });
      E(g, [[-0.455, -0.09], [-0.438, -0.09], [-0.438, 0.066], [-0.455, 0.066]], 0.046, phong(0x111111, 5, 0x111111), { bevel: 0.004 });
    } else if (o.stock === 'modern') {
      grip(g, 0.0, fm);
      cz(g, 0.015, -0.3, -0.1, 0.05, st);
      E(g, [[-0.2, 0.078], [-0.34, 0.072], [-0.348, 0.05], [-0.348, -0.06], [-0.318, -0.062], [-0.2, 0.02]], 0.043, fm, { bevel: 0.007 });
    } else if (o.stock === 'fold') {
      grip(g, 0.0, fm);
      E(g, [[-0.06, 0.02], [0.15, 0.02], [0.15, 0.045], [-0.06, 0.045]], 0.009, PARK(), { x: 0.032, bevel: 0.002 });
    } else {
      grip(g, 0.0, fm);
    }
    g.userData.muzzle.position.set(0, 0.054, -bEnd);
  }
  function mg(g, def, o) {
    const st = PARK(), bl = STEEL(), fm = poly(0x1e1f1c);
    E(g, [[-0.14, 0.0], [0.2, 0.0], [0.2, 0.09], [-0.1, 0.096], [-0.14, 0.08]], 0.062, st, { bevel: 0.006 });
    E(g, [[-0.085, 0.094], [0.13, 0.088], [0.13, 0.108], [-0.06, 0.113]], 0.066, st, { bevel: 0.006 });
    rail(g, -0.06, 0.12, 0.11, 0.009, 0.022, st);
    bx(g, 0.002, 0.03, 0.09, 0.06, 0.05, 0.032, DARK());
    E(g, [[0.2, 0.01], [0.36, 0.016], [0.36, 0.088], [0.2, 0.09]], 0.058, fm, { bevel: 0.009 });
    cz(g, 0.013, 0.36, 0.66, 0.05, bl);
    E(g, [[0.37, 0.068], [0.56, 0.068], [0.56, 0.082], [0.37, 0.082]], 0.032, st, { bevel: 0.003 });
    for (let i = 0; i < 6; i++) bx(g, 0.033, 0.008, 0.012, 0.39 + i * 0.03, 0.075, 0, DARK());
    E(g, [[0.21, 0.09], [0.31, 0.09], [0.295, 0.14], [0.225, 0.14]], 0.018, fm, { bevel: 0.004, hole: [[0.232, 0.1], [0.288, 0.1], [0.28, 0.126], [0.24, 0.126]] });
    sightPost(g, 0.6, 0.06, 0.12, st);
    const end = flashHider(g, 0.66, 0.05, 0.015);
    bipodFolded(g, 0.44, 0.63, 0.026, 0.014);
    if (o.drum) { cx(g, 0.07, 0.07, 0.11, -0.065, -0.006, poly(0x34382c)); cx(g, 0.074, 0.01, 0.11, -0.065, 0.032, st); }
    else { E(g, [[0.02, 0.0], [0.195, 0.0], [0.195, -0.135], [0.02, -0.135]], 0.085, poly(o.boxColor || 0x6b6450), { bevel: 0.01, x: -0.008 }); E(g, [[0.04, -0.03], [0.175, -0.03], [0.175, -0.04], [0.04, -0.04]], 0.087, st, { x: -0.008, bevel: 0.001 }); }
    grip(g, 0.0, fm); trig(g, 0.0, st);
    E(g, [[-0.14, 0.082], [-0.45, 0.072], [-0.46, 0.06], [-0.46, -0.072], [-0.42, -0.074], [-0.25, -0.004], [-0.14, 0.002]], 0.045, fm, { bevel: 0.008, hole: [[-0.39, 0.048], [-0.19, 0.056], [-0.19, 0.028], [-0.37, -0.012]] });
    g.userData.muzzle.position.set(0, 0.05, -end);
    g.userData.lh = [0.3, 0.01];
  }
  function boltSniper(g, def, o) {
    const st = STEEL(), fm = poly(o.furn || 0x3b4a2a), dk = poly(0x151515);
    const s = new THREE.Shape();
    s.moveTo(o.fore || 0.36, 0.046); s.lineTo(o.fore || 0.36, 0.014); s.lineTo(0.1, 0.0); s.lineTo(0.03, -0.004);
    s.quadraticCurveTo(0.012, -0.05, 0.0, -0.102); s.lineTo(-0.05, -0.112);
    s.quadraticCurveTo(-0.062, -0.07, -0.07, -0.036);
    s.quadraticCurveTo(-0.15, -0.035, -0.25, -0.055); s.lineTo(-0.43, -0.098); s.lineTo(-0.47, -0.098);
    s.lineTo(-0.47, 0.062); s.quadraticCurveTo(-0.44, 0.075, -0.4, 0.074); s.lineTo(-0.25, 0.072);
    s.quadraticCurveTo(-0.14, 0.045, -0.1, 0.046);
    E(g, s, o.thick || 0.048, fm, { bevel: 0.009, hole: o.thumb === false ? null : [[-0.105, 0.028], [-0.035, 0.03], [-0.045, -0.004], [-0.095, -0.016]] });
    E(g, [[-0.485, -0.1], [-0.468, -0.1], [-0.468, 0.064], [-0.485, 0.064]], 0.05, dk, { bevel: 0.004 });
    E(g, [[-0.37, 0.074], [-0.18, 0.068], [-0.18, 0.088], [-0.35, 0.096]], 0.032, fm, { bevel: 0.007 });
    cz(g, 0.019, -0.105, 0.14, 0.064, st, { seg: 18 });
    bx(g, 0.002, 0.016, 0.06, 0.03, 0.068, 0.019, DARK());
    cx(g, 0.0042, 0.05, -0.075, 0.066, 0.028, st); sph(g, 0.009, -0.075, 0.066, 0.055, BRIGHT());
    const bEnd = o.barrel || 0.78;
    cz(g, o.br || 0.0115, 0.14, bEnd, 0.064, st, { r1: (o.br || 0.0115) * 1.45 });
    const end = o.brake !== false ? brake(g, bEnd, 0.064, (o.br || 0.0115) * 1.7) : bEnd;
    mag(g, 0.035, 0.07, 0.04, 0.0, PARK(), 0.0, 0.034);
    trig(g, 0.0, st, 0.07);
    scope(g, -0.1, o.scopeEnd || 0.25, 0.135, o.sr || 0.019, o.so || 0.031, 0.083, { color: o.scopeColor });
    if (o.bipod) bipodFolded(g, 0.18, 0.36, -0.004, 0.018);
    g.userData.muzzle.position.set(0, 0.064, -end);
    g.userData.lh = [0.24, 0.002];
  }
  function knife(g) {
    const k = new THREE.Group(); k.position.set(0, -0.045, -0.02); g.add(k);
    const blade = phong(0xb8bcc2, 120, 0xffffff), dk = poly(0x1b1b1b);
    const s = new THREE.Shape();
    s.moveTo(0.0, -0.013); s.lineTo(0.12, -0.013); s.quadraticCurveTo(0.185, -0.009, 0.215, 0.012);
    s.lineTo(0.2, 0.014); s.quadraticCurveTo(0.16, 0.011, 0.13, 0.017); s.lineTo(0.0, 0.017);
    E(k, s, 0.005, blade, { bevel: 0.0016, seg: 1 });
    E(k, [[0.02, 0.006], [0.12, 0.006], [0.12, 0.01], [0.02, 0.01]], 0.0062, phong(0x6a6e74, 60, 0x888888), { bevel: 0 });
    E(k, [[-0.006, -0.026], [0.006, -0.026], [0.006, 0.028], [-0.006, 0.028]], 0.024, dk, { bevel: 0.003 });
    E(k, [[-0.006, -0.015], [-0.025, -0.02], [-0.04, -0.015], [-0.055, -0.02], [-0.07, -0.015], [-0.085, -0.02], [-0.11, -0.016], [-0.118, 0.0], [-0.11, 0.018], [-0.006, 0.017]], 0.024, dk, { bevel: 0.005 });
    cz(k, 0.012, -0.128, -0.114, 0, phong(0x5a5e64, 60, 0x888888));
    g.userData.muzzle.position.set(0, -0.045, -0.2);
  }
  // ---------- rótulos das granadas ----------
  const labelCache = {};
  function labelMat(kind) {
    if (labelCache[kind]) return labelCache[kind];
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const x = cv.getContext('2d');
    const r = U.mulberry(kind.length * 37 + 5);
    const L = { he: ['#4a5636', '#e0b52a', 'HE · ALTO EXPLOSIVO'], flash: ['#8d9196', '#f2f2ee', 'ATORDOANTE · NÃO OLHE'], smoke: ['#59636a', '#7fc3a0', 'FUMAÇA · M-18'], incend: ['#6e2d22', '#e8862a', 'INCENDIÁRIA'], decoy: ['#7d725a', '#d8d0b8', 'CHAMARIZ'] }[kind] || ['#555', '#ccc', kind];
    x.fillStyle = L[0]; x.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 700; i++) { const w = r() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${w},${w},${w},${r() * 0.07})`; x.fillRect(r() * 256, r() * 128, 1 + r() * 3, 1 + r() * 3); }
    if (kind === 'he') {
      x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 2;
      for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16, 128); x.stroke(); }
      for (let j = 0; j <= 8; j++) { x.beginPath(); x.moveTo(0, j * 16); x.lineTo(256, j * 16); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,0.09)'; for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) x.fillRect(i * 16 + 2, j * 16 + 2, 6, 6);
    }
    if (kind === 'flash') { x.fillStyle = '#151515'; for (let row = 0; row < 3; row++) for (let i = 0; i < 10; i++) { x.beginPath(); x.arc(i * 25.6 + 12 + (row % 2) * 12, 18 + row * 17, 5, 0, 7); x.fill(); } }
    const by = kind === 'he' ? 56 : 82;
    x.fillStyle = L[1]; x.fillRect(0, by, 256, 24);
    x.fillStyle = '#111'; x.font = 'bold 15px Arial'; x.textBaseline = 'middle';
    x.fillText(L[2], 8, by + 12); x.fillText(L[2], 136, by + 12);
    if (kind !== 'he' && kind !== 'flash') { x.fillStyle = 'rgba(255,255,255,0.75)'; x.font = 'bold 11px Arial'; x.fillText('LOTE 07-' + (kind.length * 13), 10, 22); x.fillText('USO TÁTICO', 140, 22); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping;
    return (labelCache[kind] = new THREE.MeshPhongMaterial({ map: t, shininess: 30, specular: 0x333333 }));
  }
  function nade(g, def) {
    const id = def.id;
    const st = phong(0x9a9da2, 90, 0xbbbbbb), dk = phong(0x1c1c1c, 20, 0x222222);
    if (id === 'molotov') {
      lathe(g, [[0, -0.07], [0.031, -0.07], [0.035, -0.062], [0.035, 0.02], [0.03, 0.032], [0.014, 0.05], [0.011, 0.078], [0.013, 0.084], [0, 0.084]], 0, 0, phong(0x4f7a46, 120, 0xdddddd, { transparent: true, opacity: 0.5 }), 'y');
      lathe(g, [[0, -0.066], [0.032, -0.066], [0.032, 0.005], [0, 0.005]], 0, 0, phong(0xc08a2a, 60, 0x664411, { transparent: true, opacity: 0.85 }), 'y');
      const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0358, 0.0358, 0.04, 24, 1, true), phong(0xd8cfb4, 8, 0x111111));
      lab.position.y = -0.025; g.add(lab);
      const rag = phong(0xd2c19a, 4, 0x111111);
      cy(g, 0.013, 0.03, 0, 0.095, 0, rag, 10);
      E(g, [[-0.008, 0.112], [0.008, 0.11], [0.03, 0.065], [0.022, 0.05], [0.012, 0.07]], 0.006, rag, { bevel: 0 });
      const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.Tex.get('fire', 64), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      fl.scale.set(0.05, 0.075, 1); fl.position.set(0, 0.128, 0); g.add(fl); g.userData.flame = fl;
      g.userData.muzzle.position.set(0, 0.12, 0); return;
    }
    let top;
    if (id === 'he') {
      lathe(g, [[0, -0.046], [0.02, -0.044], [0.032, -0.032], [0.037, -0.012], [0.037, 0.01], [0.033, 0.028], [0.022, 0.041], [0.013, 0.046], [0, 0.046]], 0, 0, labelMat('he'), 'y');
      cy(g, 0.016, 0.01, 0, 0.049, 0, phong(0x5a5e52, 40, 0x444444), 14);
      top = 0.052;
    } else {
      const r = id === 'smoke' ? 0.031 : id === 'decoy' ? 0.023 : id === 'flash' ? 0.025 : 0.029;
      const h = id === 'smoke' ? 0.118 : id === 'decoy' ? 0.085 : 0.108;
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), labelMat(id)));
      for (const s of [-1, 1]) cy(g, r * 1.045, 0.006, 0, s * (h / 2 - 0.002), 0, phong(0x3a3c3e, 50, 0x555555), 28);
      if (id === 'smoke') for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const d = new THREE.Mesh(new THREE.CircleGeometry(0.0045, 10), dk); d.position.set(Math.cos(a) * 0.018, h / 2 + 0.0012, Math.sin(a) * 0.018); d.rotation.x = -Math.PI / 2; g.add(d); }
      if (id === 'decoy') cy(g, r * 1.06, 0.008, 0, 0, 0, phong(0x2a2a2a, 20, 0x222222), 24);
      top = h / 2 + 0.004;
    }
    cy(g, 0.011, 0.02, 0, top + 0.01, 0, st, 14);
    cy(g, 0.006, 0.01, 0, top + 0.024, 0, st, 10);
    E(g, [[0.008, top + 0.026], [0.033, top + 0.02], [0.04, top + 0.008], [0.037, top - 0.065], [0.032, top - 0.065], [0.034, top + 0.004], [0.008, top + 0.017]], 0.013, st, { bevel: 0.001 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0018, 8, 20), st); ring.position.set(0.017, top + 0.022, 0.006); ring.rotation.y = 0.5; g.add(ring);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.03, 6), st); pin.rotation.z = Math.PI / 2; pin.position.set(0.004, top + 0.022, 0); g.add(pin);
    g.userData.muzzle.position.set(0, 0.0, -0.05);
  }
  // ---------- C4 detalhada (na mão e plantada) ----------
  let keypadTex = null;
  function keypad() {
    if (keypadTex) return keypadTex;
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 128; const x = cv.getContext('2d');
    x.fillStyle = '#26292b'; x.fillRect(0, 0, 96, 128);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    x.font = 'bold 16px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    keys.forEach((k, i) => { const cx = 16 + (i % 3) * 32, cyy = 18 + Math.floor(i / 3) * 31; x.fillStyle = '#9a9d9f'; x.fillRect(cx - 12, cyy - 11, 24, 22); x.fillStyle = '#c4c6c8'; x.fillRect(cx - 12, cyy - 11, 24, 4); x.fillStyle = '#181818'; x.fillText(k, cx, cyy + 1); });
    return (keypadTex = new THREE.CanvasTexture(cv));
  }
  Mo.c4Model = (planted) => {
    const g = new THREE.Group();
    const charge = phong(0x5a5e3c, 15, 0x222222), wrap = phong(0x22221f, 30, 0x333333), box = phong(0x2e3133, 40, 0x444444);
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 18), charge); m.rotation.x = Math.PI / 2; m.position.set(-0.09 + i * 0.06, 0.03, 0); g.add(m);
      for (const s of [-1, 1]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.012, 18), phong(0x3a3c30, 20, 0x222222)); cap.rotation.x = Math.PI / 2; cap.position.set(-0.09 + i * 0.06, 0.03, s * 0.12); g.add(cap); }
    }
    for (const z of [-0.075, 0.075]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.252, 0.066, 0.026), wrap); t.position.set(0, 0.03, z); g.add(t); }
    const mod = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.11), box); mod.position.set(0, 0.08, 0); g.add(mod);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.156, 0.006, 0.116), phong(0x1b1d1f, 30, 0x333333)); lip.position.set(0, 0.1, 0); g.add(lip);
    // visor LCD
    const lc = document.createElement('canvas'); lc.width = 128; lc.height = 48;
    const lt = new THREE.CanvasTexture(lc);
    const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.072, 0.027), new THREE.MeshBasicMaterial({ map: lt }));
    lcd.rotation.x = -Math.PI / 2; lcd.position.set(-0.03, 0.1035, -0.026); g.add(lcd);
    const setLCD = (txt) => {
      const x = lc.getContext('2d'); x.fillStyle = '#0b2410'; x.fillRect(0, 0, 128, 48);
      x.font = 'bold 30px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(70,255,100,0.1)'; x.fillText('88:88', 64, 26);
      x.fillStyle = '#5dff7a'; x.fillText(txt, 64, 26); lt.needsUpdate = true;
    };
    setLCD(planted ? '00:40' : '-----');
    const kp = new THREE.Mesh(new THREE.PlaneGeometry(0.048, 0.064), new THREE.MeshPhongMaterial({ map: keypad(), shininess: 20 }));
    kp.rotation.x = -Math.PI / 2; kp.position.set(0.038, 0.1035, 0.012); g.add(kp);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2020 })); led.position.set(-0.058, 0.104, 0.04); g.add(led);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.1, 6), phong(0x111111, 20, 0x222222)); ant.position.set(-0.066, 0.15, 0.046); ant.rotation.z = 0.18; g.add(ant);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), phong(0xcc2222, 30, 0x333333)); tip.position.set(-0.075, 0.2, 0.046); g.add(tip);
    const stk = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.022), new THREE.MeshLambertMaterial({ map: G.Tex.get('hazard', 128) })); stk.position.set(0.02, 0.08, 0.0555); g.add(stk);
    const w = (col, pts) => { const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.0028, 6), phong(col, 40, 0x333333))); };
    w(0xcc2222, [[0.07, 0.085, -0.03], [0.1, 0.07, -0.02], [0.095, 0.04, 0.03], [0.09, 0.03, 0.1]]);
    w(0x2244cc, [[-0.07, 0.085, -0.03], [-0.11, 0.075, -0.0], [-0.1, 0.045, 0.06], [-0.09, 0.03, 0.11]]);
    w(0xddcc22, [[0.0, 0.085, 0.055], [0.02, 0.09, 0.09], [-0.03, 0.05, 0.12]]);
    w(0x22aa44, [[0.04, 0.085, 0.055], [0.06, 0.075, 0.09], [0.03, 0.04, 0.125]]);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.userData.led = led; g.userData.setLCD = setLCD;
    return g;
  };
  Mo.bomb = () => Mo.c4Model(true);
  function c4(g) {
    const m = Mo.c4Model(false); m.position.set(0, -0.04, -0.03); g.add(m);
    g.userData.muzzle.position.set(0, 0, -0.1);
  }
  function taser(g) {
    const y = phong(0xd8b818, 40, 0x555533), dk = poly(0x161616);
    E(g, [[-0.06, 0.04], [0.12, 0.04], [0.13, 0.065], [0.11, 0.09], [-0.05, 0.09], [-0.065, 0.075]], 0.032, y, { bevel: 0.006 });
    E(g, [[0.1, 0.04], [0.15, 0.042], [0.15, 0.088], [0.1, 0.09]], 0.036, dk, { bevel: 0.004 });
    const s = new THREE.Shape();
    s.moveTo(0.01, 0.042); s.quadraticCurveTo(0.004, -0.02, 0.004, -0.07); s.lineTo(-0.04, -0.078);
    s.quadraticCurveTo(-0.06, -0.02, -0.062, 0.042);
    E(g, s, 0.03, dk, { bevel: 0.006 });
    E(g, [[0.055, 0.042], [0.062, 0.042], [0.062, 0.01], [0.05, -0.004], [0.008, -0.004], [0.008, 0.004], [0.046, 0.004], [0.054, 0.014]], 0.011, dk, { bevel: 0.0015 });
    g.userData.muzzle.position.set(0, 0.066, -0.15);
    g.userData.lh = null;
  }

  // ---------- catálogo ----------
  Mo.gun = (def) => {
    const g = new THREE.Group();
    const muzzle = new THREE.Object3D(); g.add(muzzle); g.userData.muzzle = muzzle;
    const id = def.id, sh = def.shape;
    switch (id) {
      case 'kalash': akFamily(g, def, { wood: true, stock: 'wood' }); break;
      case 'chacal': akFamily(g, def, { wood: false, stock: 'skel', furn: 0x3a3428 }); break;
      case 'falcao': arFamily(g, def, { scope: true, stock: 'skel', body: 0x4a4836, furn: 0x6b6247, scopeLen: 0.16 }); break;
      case 'carabina': arFamily(g, def, {}); break;
      case 'carabinasd': arFamily(g, def, { silencer: true, hg: 0.22, barrel: 0.06, body: 0x35383c }); break;
      case 'garca': bullpup(g, def, { handle: true, furn: 0x2c3540 }); break;
      case 'aguia': bullpup(g, def, { scope: true, furn: 0x4a5a46, scopeColor: 0x2a3028 }); break;
      case 'turbina': pdw(g, def); break;
      case 'lince': smg(g, def, { magInGrip: true, stock: 'wire', fg: true }); break;
      case 'vulcao': smg(g, def, { magInGrip: true, stock: 'fold', body: 0x2e2e2e }); break;
      case 'vespao': smg(g, def, { stock: 'fixed', magLen: 0.15, magCurve: 0.0, body: 0x2c3028 }); break;
      case 'agulha': smg(g, def, { magInGrip: true, stock: 'tube', fg: true, body: 0x252a2a }); break;
      case 'espiral': smg(g, def, { wood: true, helix: true, stock: 'fold' }); break;
      case 'sussurro': smg(g, def, { supp: true, stock: 'tube', magCurve: 0.04 }); break;
      case 'martelo': shotgun(g, def, { wood: true, stock: 'classic' }); break;
      case 'pregador': shotgun(g, def, { wood: false, stock: 'modern', pump: true, barrel: 0.58 }); break;
      case 'cano': shotgun(g, def, { wood: true, stock: 'none', barrel: 0.36, pumpAt: 0.17 }); break;
      case 'bloco': shotgun(g, def, { wood: false, stock: 'fold', barrel: 0.4, tube: false, boxMag: true, vgrip: true, pumpAt: 0.16 }); break;
      case 'serra': mg(g, def, { boxColor: 0x6b6450 }); break;
      case 'rolo': mg(g, def, { drum: true }); break;
      case 'pardal': boltSniper(g, def, { furn: 0x3a4a3a, barrel: 0.66, br: 0.009, thick: 0.04, thumb: false, scopeEnd: 0.2, sr: 0.016, so: 0.025, brake: false }); break;
      case 'leviata': boltSniper(g, def, { furn: 0x56603a, bipod: true }); break;
      case 'ceifador': arFamily(g, def, { scope: true, stock: 'skel', hg: 0.3, barrel: 0.2, magLen: 0.12, magCurve: 0.0, bipod: true, brake: true, scopeLen: 0.22, objR: 0.03, body: 0x2e2a22, furn: 0x3a3424 }); break;
      case 'sentinela': arFamily(g, def, { scope: true, stock: 'skel', hg: 0.3, barrel: 0.2, magLen: 0.12, magCurve: 0.0, bipod: true, brake: true, scopeLen: 0.22, objR: 0.03, body: 0x2a3036 }); break;
      case 'vespa': pistol(g, def, { frame: 0x2b2b2b }); break;
      case 'guardiao': pistol(g, def, { frame: 0x1e1f22, supp: true }); break;
      case 'cinza': pistol(g, def, { frame: 0x222222, slide: phong(0x8a8a86, 70, 0x999999) }); break;
      case 'raio': pistol(g, def, { frame: 0x30343a, long: true }); break;
      case 'zumbido': pistol(g, def, { frame: 0x3a3a35, ext: true, comp: true }); break;
      case 'tufao': pistol(g, def, { frame: 0x5a4a30, ext: true, long: true }); break;
      case 'trovao': pistol(g, def, { frame: 0x9a9aa0, slide: phong(0xa8aab0, 90, 0xcccccc), rib: true, long: true }); g.scale.setScalar(1.18); break;
      case 'juiz': revolver(g, def); break;
      case 'gemeas': { pistol(g, def, { frame: 0x8c8c8c, slide: phong(0x9a9a9a, 80, 0xbbbbbb) }); const g2 = new THREE.Group(); g2.userData.muzzle = new THREE.Object3D(); g2.add(g2.userData.muzzle); pistol(g2, def, { frame: 0x8c8c8c, slide: phong(0x9a9a9a, 80, 0xbbbbbb) }); g2.position.set(-0.24, 0, 0); g.add(g2); break; }
      case 'knife': knife(g); break;
      case 'c4': c4(g); break;
      case 'taser': taser(g); break;
      default:
        if (def.cat === 'grenade') nade(g, def);
        else arFamily(g, def, {});
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  };
})();
