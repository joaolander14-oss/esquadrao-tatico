// Utilidades gerais
window.G = window.G || {};
(function () {
  const U = G.U = {};
  U.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  U.D2R = Math.PI / 180;
  U.R2D = 180 / Math.PI;
  U.hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // ângulo normalizado em (-PI, PI]
  U.wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; };
  U.angDiff = (a, b) => U.wrap(b - a);
  // vetor de direção a partir de yaw/pitch (yaw=0 olha para -Z)
  U.dirFrom = (yaw, pitch, out) => {
    out = out || new THREE.Vector3();
    const cp = Math.cos(pitch);
    out.set(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
    return out;
  };
  U.yawTo = (dx, dz) => Math.atan2(-dx, -dz);
  U.fmtTime = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  // PRNG determinístico
  U.mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  // segmento x esfera: retorna true se o segmento p->q passa a menos de r do centro c
  U.segSphere = (p, q, c, r) => {
    const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z;
    const L2 = dx * dx + dy * dy + dz * dz || 1e-9;
    let t = ((c.x - p.x) * dx + (c.y - p.y) * dy + (c.z - p.z) * dz) / L2;
    t = U.clamp(t, 0, 1);
    const x = p.x + dx * t - c.x, y = p.y + dy * t - c.y, z = p.z + dz * t - c.z;
    return x * x + y * y + z * z < r * r;
  };
  // raio x AABB (slab). retorna [tmin, tmax] ou null
  U.rayAABB = (o, d, minX, minY, minZ, maxX, maxY, maxZ, maxT) => {
    let t0 = 0, t1 = maxT;
    const id = [1 / d.x, 1 / d.y, 1 / d.z], os = [o.x, o.y, o.z], mn = [minX, minY, minZ], mx = [maxX, maxY, maxZ];
    for (let i = 0; i < 3; i++) {
      let a = (mn[i] - os[i]) * id[i], b = (mx[i] - os[i]) * id[i];
      if (a > b) { const t = a; a = b; b = t; }
      if (a > t0) t0 = a;
      if (b < t1) t1 = b;
      if (t0 > t1) return null;
    }
    return [t0, t1];
  };
  // raio x cápsula (segmento a-b com raio r). d normalizado. retorna t ou -1
  U.rayCapsule = (o, d, a, b, r, maxT) => {
    const bax = b.x - a.x, bay = b.y - a.y, baz = b.z - a.z;
    const oax = o.x - a.x, oay = o.y - a.y, oaz = o.z - a.z;
    const baba = bax * bax + bay * bay + baz * baz, bard = bax * d.x + bay * d.y + baz * d.z, baoa = bax * oax + bay * oay + baz * oaz;
    const rdoa = d.x * oax + d.y * oay + d.z * oaz, oaoa = oax * oax + oay * oay + oaz * oaz;
    const A = baba - bard * bard, B = baba * rdoa - baoa * bard, Cc = baba * oaoa - baoa * baoa - r * r * baba;
    const h = B * B - A * Cc;
    if (h >= 0 && A > 1e-9) {
      const t = (-B - Math.sqrt(h)) / A, y = baoa + t * bard;
      if (y > 0 && y < baba) return t >= 0 && t <= maxT ? t : -1;
      const cx = y <= 0 ? oax : o.x - b.x, cy = y <= 0 ? oay : o.y - b.y, cz = y <= 0 ? oaz : o.z - b.z;
      const b2 = d.x * cx + d.y * cy + d.z * cz, c2 = cx * cx + cy * cy + cz * cz - r * r, h2 = b2 * b2 - c2;
      if (h2 > 0) { const t2 = -b2 - Math.sqrt(h2); return t2 >= 0 && t2 <= maxT ? t2 : -1; }
      return -1;
    }
    // raio paralelo ao eixo: testa as duas esferas das pontas
    const t1 = U.raySphere(o, d, a, r, maxT), t2 = U.raySphere(o, d, b, r, maxT);
    return t1 < 0 ? t2 : t2 < 0 ? t1 : Math.min(t1, t2);
  };
  // teste genérico contra uma hitbox ('s' esfera, 'c' cápsula, 'b' caixa). pad = folga extra (faca)
  U.rayHitbox = (o, d, hb, maxT, pad) => {
    pad = pad || 0;
    if (hb.type === 's') return U.raySphere(o, d, hb.c, hb.r + pad, maxT);
    if (hb.type === 'c') return U.rayCapsule(o, d, hb.a, hb.b, hb.r + pad, maxT);
    const r = U.rayAABB(o, d, hb.x1 - pad, hb.y1, hb.z1 - pad, hb.x2 + pad, hb.y2, hb.z2 + pad, maxT); return r ? r[0] : -1;
  };
  U.raySphere = (o, d, c, r, maxT) => {
    const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z;
    const b = ox * d.x + oy * d.y + oz * d.z;
    const cc = ox * ox + oy * oy + oz * oz - r * r;
    const h = b * b - cc;
    if (h < 0) return -1;
    const t = -b - Math.sqrt(h);
    if (t < 0 || t > maxT) return -1;
    return t;
  };
})();
