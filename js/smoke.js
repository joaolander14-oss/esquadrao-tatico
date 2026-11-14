// Fumaça volumétrica: preenchimento por voxels (inundação limitada pela geometria do mapa),
// renderizada com partículas em shader próprio. Tiros abrem buracos, HE empurra a fumaça.
(function () {
  const Sm = G.Smoke = {};
  const U = G.U;
  const M = () => G.Map;
  const V = 0.75, MAXV = 1000, MAXD = 18, LIFE = 32;
  Sm.list = [];
  let scene = null, puff = null, veil = null;
  const tv = new THREE.Vector3();

  function makePuff() {
    const s = 128, cv = document.createElement('canvas'); cv.width = cv.height = s;
    const g = cv.getContext('2d'), r = U.mulberry(4242);
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * s * 0.22, x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d, rad = s * (0.12 + r() * 0.2);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(255,255,255,${0.22 + r() * 0.2})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
    // borda suave
    const img = g.getImageData(0, 0, s, s), d = img.data;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const k = (y * s + x) * 4, rr = Math.hypot(x - s / 2, y - s / 2) / (s / 2);
      d[k + 3] = Math.min(255, d[k + 3] * Math.max(0, 1 - rr * rr) * 1.6);
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    return t;
  }
  const VS = `
    attribute float aAlpha; attribute float aSize; attribute float aShade; attribute float aRot;
    uniform float uScale; uniform float uTime;
    varying float vAlpha; varying float vShade; varying float vRot;
    #include <fog_pars_vertex>
    void main() {
      vec3 p = position + vec3(sin(uTime * 0.37 + position.y * 1.3 + position.z) * 0.16, sin(uTime * 0.29 + position.x * 0.9) * 0.07, cos(uTime * 0.33 + position.z * 1.1 + position.x) * 0.16);
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = aSize * uScale / max(0.15, -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      vAlpha = aAlpha; vShade = aShade; vRot = aRot + uTime * 0.03;
      #include <fog_vertex>
    }`;
  const FS = `
    uniform sampler2D uTex; uniform vec3 uColor; uniform vec3 uLight;
    varying float vAlpha; varying float vShade; varying float vRot;
    #include <fog_pars_fragment>
    void main() {
      vec2 p = gl_PointCoord - 0.5; float c = cos(vRot), s = sin(vRot);
      p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + 0.5;
      vec4 t = texture2D(uTex, p);
      float a = t.a * vAlpha;
      if (a < 0.004) discard;
      vec3 col = uColor * mix(0.6, 1.08, vShade) * mix(vec3(1.0), uLight, 0.35);
      gl_FragColor = vec4(col, a);
      #include <fog_fragment>
    }`;
  Sm.init = (sc) => {
    scene = sc;
    if (!puff) puff = makePuff();
    if (!veil) { veil = document.createElement('div'); veil.id = 'smokeVeil'; document.body.appendChild(veil); }
  };
  const key = (i, j, k) => ((i + 64) * 128 + (j + 8)) * 128 + (k + 64);

  // ---------------- Estourar uma fumaça ----------------
  Sm.deploy = (pos, owner) => {
    const map = M();
    const gy = map.groundAt(pos.x, pos.z);
    const origin = new THREE.Vector3(pos.x, gy + V * 0.5, pos.z);
    // se caiu encostada numa parede, desloca para o vazio mais próximo
    if (map.pointSolid(origin.x, origin.y, origin.z)) origin.y = pos.y + 0.2;
    const vox = [], index = new Map(), seen = new Set([key(0, 0, 0)]);
    const q = [[0, 0, 0, 0]];
    const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
    const rnd = U.mulberry(Math.floor(Math.random() * 1e9));
    let head = 0, maxD = 1;
    while (head < q.length && vox.length < MAXV) {
      const [i, j, k, d] = q[head++];
      const x = origin.x + i * V, y = origin.y + j * V, z = origin.z + k * V;
      const v = { x, y, z, i, j, k, d, born: d * 0.065 + rnd() * 0.12, cut: -9, a: 0 };
      vox.push(v); index.set(key(i, j, k), v); maxD = Math.max(maxD, d);
      if (d >= MAXD) continue;
      for (const [di, dj, dk] of DIRS) {
        const ni = i + di, nj = j + dj, nk = k + dk, kk = key(ni, nj, nk);
        if (seen.has(kk)) continue;
        // domo de base achatada: sobe mais devagar do que espalha
        if (dj > 0 && (nj > 5 || d < nj * 2.2)) continue;
        if (nj < -14) continue;        // pode escorrer até ~10 m para baixo (fumaça cachoeira)
        const nx = origin.x + ni * V, ny = origin.y + nj * V, nz = origin.z + nk * V;
        if (Math.hypot(nx - origin.x, nz - origin.z) > 7.2) continue;
        if (map.pointSolid(nx, ny, nz)) continue;
        // não atravessa paredes finas entre centros (checa o meio do caminho)
        if (map.pointSolid((x + nx) / 2, (y + ny) / 2, (z + nz) / 2)) continue;
        seen.add(kk);
        if (dj < 0) q.splice(head, 0, [ni, nj, nk, d + 0.25]);      // desce primeiro: a fumaça cai pela borda como uma cachoeira
        else q.push([ni, nj, nk, d + 1]);
      }
    }
    // partículas (2 por voxel)
    const n = vox.length * 2;
    const posA = new Float32Array(n * 3), alpha = new Float32Array(n), size = new Float32Array(n), shade = new Float32Array(n), rot = new Float32Array(n);
    let maxR = 1;
    for (let p = 0; p < n; p++) {
      const v = vox[p >> 1];
      posA[p * 3] = v.x + (rnd() - 0.5) * V * 0.9; posA[p * 3 + 1] = v.y + (rnd() - 0.5) * V * 0.8; posA[p * 3 + 2] = v.z + (rnd() - 0.5) * V * 0.9;
      size[p] = 1.55 + rnd() * 0.9;
      shade[p] = U.clamp(0.25 + (v.j + 1) / 6 * 0.7 + (rnd() - 0.5) * 0.25, 0, 1);
      rot[p] = rnd() * 6.28;
      maxR = Math.max(maxR, Math.hypot(v.x - origin.x, v.z - origin.z));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posA, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aShade', new THREE.BufferAttribute(shade, 1));
    geo.setAttribute('aRot', new THREE.BufferAttribute(rot, 1));
    const th = map.theme || {};
    const light = new THREE.Color(th.sun ? th.sun[0] : 0xffffff);
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex: { value: null }, uColor: { value: new THREE.Color(0xc9cbc8) }, uLight: { value: light }, uScale: { value: 600 }, uTime: { value: 0 } }]),
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, fog: true
    });
    mat.uniforms.uTex.value = puff;
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false; pts.renderOrder = 5;
    scene.add(pts);
    const s = { pos: new THREE.Vector3(origin.x, gy, origin.z), origin, t: 0, life: LIFE, r: maxR + 0.6, vox, index, maxD, group: pts, owner, alphaArr: alpha };
    Sm.list.push(s);
    return s;
  };

  // ---------------- Atualização ----------------
  let lastScale = 600;
  Sm.update = (dt) => {
    const now = G.Game.time;
    for (const s of Sm.list) {
      s.t += dt;
      const tl = s.life - s.t;
      const A = s.alphaArr;
      for (let q = 0; q < s.vox.length; q++) {
        const v = s.vox[q];
        const grow = U.clamp((s.t - v.born) / 0.55, 0, 1);
        const fade = U.clamp((tl - 1.8 * (v.d / s.maxD)) / 2.0, 0, 1);
        const cut = now < v.cut ? 0 : U.clamp((now - v.cut) / 0.7, 0, 1);   // some e volta
        v.a = grow * fade * cut;
        const edge = 1 - 0.35 * (v.d / s.maxD);
        A[q * 2] = A[q * 2 + 1] = v.a * 0.5 * edge;
      }
      s.group.geometry.attributes.aAlpha.needsUpdate = true;
      s.group.material.uniforms.uTime.value = s.t;
      s.group.material.uniforms.uScale.value = lastScale;
    }
    for (let i = Sm.list.length - 1; i >= 0; i--) if (Sm.list[i].t >= Sm.list[i].life) { const s = Sm.list[i]; scene.remove(s.group); s.group.geometry.dispose(); s.group.material.dispose(); Sm.list.splice(i, 1); }
  };
  // chamado a cada quadro com a câmera: escala das partículas e véu cinza quando a câmera está dentro
  Sm.frame = (cam, renderer) => {
    const hpx = renderer.getDrawingBufferSize(tv).y;
    lastScale = hpx / (2 * Math.tan(cam.fov * Math.PI / 360));
    for (const s of Sm.list) s.group.material.uniforms.uScale.value = lastScale;
    const d = Sm.densityAt(cam.position, true);
    if (veil) veil.style.opacity = U.clamp(d * 1.05, 0, 0.93).toFixed(3);
  };
  function voxAt(s, p) {
    const o = s.origin;
    const i = Math.round((p.x - o.x) / V), j = Math.round((p.y - o.y) / V), k = Math.round((p.z - o.z) / V);
    if (Math.abs(i) > 60 || Math.abs(k) > 60 || j < -7 || j > 100) return null;
    return s.index.get(key(i, j, k)) || null;
  }
  Sm.densityAt = (p, visibleOnly) => {
    let best = 0;
    for (const s of Sm.list) {
      if (visibleOnly && !s.group.visible) continue;
      if (Math.abs(p.x - s.origin.x) > s.r + 1 || Math.abs(p.z - s.origin.z) > s.r + 1) continue;
      const v = voxAt(s, p); if (v && v.a > best) best = v.a;
    }
    return best;
  };
  // segmento a->b atravessa fumaça densa?
  Sm.blocked = (a, b) => {
    const L = a.distanceTo(b);
    for (const s of Sm.list) {
      tv.set(s.origin.x, s.origin.y + 1.2, s.origin.z);
      if (!U.segSphere(a, b, tv, s.r + 1.5)) continue;
      const n = Math.ceil(L / 0.4);
      let hits = 0;
      const p = new THREE.Vector3();
      for (let q = 1; q < n; q++) {
        p.lerpVectors(a, b, q / n);
        const v = voxAt(s, p);
        if (v && v.a > 0.45) { hits++; if (hits >= 3) return true; }
      }
    }
    return false;
  };
  // bala atravessando: abre um túnel por ~1,3 s
  Sm.carve = (a, b) => {
    const now = G.Game.time;
    for (const s of Sm.list) {
      tv.set(s.origin.x, s.origin.y + 1.2, s.origin.z);
      if (!U.segSphere(a, b, tv, s.r + 1.5)) continue;
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L2 = dx * dx + dy * dy + dz * dz || 1;
      for (const v of s.vox) {
        let t = ((v.x - a.x) * dx + (v.y - a.y) * dy + (v.z - a.z) * dz) / L2; t = U.clamp(t, 0, 1);
        const ex = a.x + dx * t - v.x, ey = a.y + dy * t - v.y, ez = a.z + dz * t - v.z;
        const d2 = ex * ex + ey * ey + ez * ez;
        if (d2 < 1.15) v.cut = Math.max(v.cut, now + 2.0);   // o rastro do tiro fica aberto por 2 s
      }
    }
  };
  // explosão empurra a fumaça
  Sm.push = (pos, r) => {
    const now = G.Game.time;
    for (const s of Sm.list) for (const v of s.vox) {
      const d = Math.hypot(v.x - pos.x, v.y - pos.y, v.z - pos.z), R = r * 2.6;
      if (d < R) v.cut = Math.max(v.cut, now + 5.0);   // a granada HE varre a fumaça por 5 s
    }
  };
  Sm.clear = () => { for (const s of Sm.list) { scene.remove(s.group); s.group.geometry.dispose(); s.group.material.dispose(); } Sm.list.length = 0; if (veil) veil.style.opacity = 0; };
  Object.defineProperty(G.Combat, 'smokes', { get: () => Sm.list, set: () => { }, configurable: true });
})();
