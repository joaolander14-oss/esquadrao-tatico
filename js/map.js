// Motor de mapas: grade de células de 3 m. Cada célula tem 4 alturas de canto (permite rampas e desníveis),
// teto opcional (túneis/arcos/salas cobertas), água rasa, objetos (props), portas e portões de spawn.
// Colisão, raycast, navegação A*, zonas, pontos táticos e malha 3D com tema. Os mapas ficam em maps.js.
(function () {
  const M = G.Map = {};
  const S = M.S = 3;
  let W = 46, H = 38;
  let grid, floor, corn, ramp, water, cb, ct, zone, isWall, props, navBlocked, buyT, buyCT, theme, def;
  M.defs = {}; M.list = [];
  M.register = d => { M.defs[d.id] = d; M.list.push(d); };
  M.cx = i => i * S + S / 2;
  const c = M.cx;

  // tipos de célula (material semântico; o tema decide a textura). cb/ct = teto relativo ao piso.
  const TYPES = {
    '.': { f: 0, mat: 'ground' }, ',': { f: 0, mat: 'ground2' }, 'T': { f: 0, mat: 'ground', zone: 'T' }, 'C': { f: 0, mat: 'spawn', zone: 'CT' },
    'a': { f: 1, mat: 'site', zone: 'A' }, 'A': { f: 0, mat: 'site', zone: 'A' }, 'b': { f: 0, mat: 'site', zone: 'B' }, 'B': { f: 0, mat: 'site', zone: 'B' },
    'q': { f: 0, mat: 'site', zone: 'A', cb: 4.6, ct: 5.4 }, 'r': { f: 0, mat: 'site', zone: 'B', cb: 4.6, ct: 5.4 },
    '1': { f: 0.5, mat: 'stair' }, '2': { f: 1.0, mat: 'stair' }, '3': { f: 1.5, mat: 'stair' }, 'u': { f: 2.0, mat: 'upper' },
    't': { f: 0, mat: 'tunnel', cb: 3.2, ct: 4.0 }, 'n': { f: 0, mat: 'ground', cb: 3.6, ct: 6.5 },
    'i': { f: 0, mat: 'tunnel', cb: 4.2, ct: 5.0 },                    // interior coberto (sala)
    '/': { f: 0, mat: 'ramp' },                                       // rampa (alturas via M.ramp)
    'w': { f: -1.0, mat: 'canal', water: true },                      // canal com água rasa
    'j': { f: 1.0, mat: 'wall', cb: 2.3, ct: 7.0, window: true },     // janela: peitoril, vão de 1,3 m e parede acima
    'p': { f: 3.0, mat: 'upper' },                                    // plataforma alta / telhado acessível
    'h': { f: 1.1, mat: 'raise', low: true },                         // mureta de cobertura
    'Y': { f: 0, mat: 'spawn', zone: 'T', cb: 4.2, ct: 5.0 }, 'Z': { f: 0, mat: 'spawn', zone: 'CT', cb: 4.2, ct: 5.0 },     // spawns cobertos (esgoto)
    'k': { f: -6, mat: 'pool', deadly: true, water: true, wy: 2.65 }  // piscina letal (líquido a 2,65 m do fundo); altura via fill(...,'k',h)
  };
  M.TYPES = TYPES;
  const DEFAULT_THEME = {
    mats: { wall: 'plaster', roof: 'roofTop', ground: 'sand', ground2: 'sand', spawn: 'tiles', site: 'tiles', stair: 'stone', upper: 'planks', tunnel: 'concrete', slab: 'planks', raise: 'stone', ramp: 'stone', canal: 'stone', pool: 'darkTiles' },
    sky: ['#5f93c9', '#a9c6de', '#e8d6b4'], fog: 0xd9cbb0, fogNear: 70, fogFar: 230,
    hemi: [0xcfe0f5, 0xb99466, 0.72], sun: [0xfff0d6, 0.95], sunDir: [50, 90, -40],
    wallH: [5.5, 1.5, 3], window: 'shutter', winChance: 0.38, tintVar: 0.2, door: 'wood', gate: 0x6a7078,
    water: 0x3a6a78,
    radar: { ground: [150, 132, 100], site: [176, 120, 96], roof: [105, 95, 80] }
  };
  const SCALE = { plaster: 4, sand: 4, tiles: 3, stone: 2.5, planks: 3, concrete: 4, roofTop: 5, brick: 3, cobble: 2.5, asphalt: 5, snow: 5, stoneWall: 3.5,
    corrugated: 3, terracotta: 3, roofSnow: 5, roofRed: 4, grate: 2, darkTiles: 3, paving: 3, sandstone: 3.5, hiero: 3, steelPlate: 3, rail: 3 };

  // ---------------- Carregar mapa ----------------
  M.load = (id) => {
    def = M.defs[id] || M.list[0];
    M.current = def.id; M.def = def;
    theme = M.theme = Object.assign({}, DEFAULT_THEME, def.theme || {});
    theme.mats = Object.assign({}, DEFAULT_THEME.mats, (def.theme || {}).mats || {});
    W = M.W = def.W || 46; H = M.H = def.H || 38;
    M.width = W * S; M.depth = H * S;
    grid = M.grid = new Array(W * H).fill('#');
    const hOv = new Float32Array(W * H).fill(NaN);
    const rampC = new Array(W * H).fill(null);
    const inside = (i, j) => i > 0 && j > 0 && i < W - 1 && j < H - 1;
    // fill(c1,r1,c2,r2, tipo, altura opcional)
    const fill = (c1, r1, c2, r2, ch, h) => { for (let j = r1; j <= r2; j++) for (let i = c1; i <= c2; i++) if (inside(i, j)) { grid[j * W + i] = ch; hOv[j * W + i] = h === undefined ? NaN : h; rampC[j * W + i] = null; } };
    // rampa: dir = direção em que SOBE ('N' -z, 'S' +z, 'E' +x, 'W' -x), de h0 até h1 ao longo do retângulo
    const rampFill = (c1, r1, c2, r2, dir, h0, h1, ch) => {
      const x1 = c1 * S, x2 = (c2 + 1) * S, z1 = r1 * S, z2 = (r2 + 1) * S;
      const hAt = (x, z) => {
        const t = dir === 'E' ? (x - x1) / (x2 - x1) : dir === 'W' ? (x2 - x) / (x2 - x1) : dir === 'S' ? (z - z1) / (z2 - z1) : (z2 - z) / (z2 - z1);
        return h0 + (h1 - h0) * t;
      };
      for (let j = r1; j <= r2; j++) for (let i = c1; i <= c2; i++) if (inside(i, j)) {
        const k = j * W + i; grid[k] = ch || '/';
        const X0 = i * S, X1 = X0 + S, Z0 = j * S, Z1 = Z0 + S;
        rampC[k] = [hAt(X0, Z0), hAt(X1, Z0), hAt(X0, Z1), hAt(X1, Z1)];
      }
    };
    def.carve(fill, rampFill);
    if (def.carve2) def.carve2(fill, rampFill);
    const houseDoors = (def.houses === false || def.houses === 0) ? [] : autoHouses(fill, hOv, def.houses || 2);
    floor = M.floor = new Float32Array(W * H);
    corn = M.corn = new Float32Array(W * H * 4);
    ramp = M.ramp = new Uint8Array(W * H);
    water = M.water = new Uint8Array(W * H);
    cb = M.cb = new Float32Array(W * H).fill(999);
    ct = M.ct = new Float32Array(W * H).fill(999);
    zone = M.zone = new Array(W * H).fill(null);
    isWall = M.isWall = new Uint8Array(W * H);
    const [h0, hs, hn] = theme.wallH;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i, ch = grid[k];
      let cs;
      if (ch === '#') {
        isWall[k] = 1;
        const edge = i === 0 || j === 0 || i === W - 1 || j === H - 1;
        const hh = edge ? h0 + hs * hn + 1.5 : h0 + Math.floor(G.U.hash2(i >> 1, j >> 1) * hn) * hs;
        cs = [hh, hh, hh, hh];
      } else {
        const t = TYPES[ch] || TYPES['.'];
        if (rampC[k]) { cs = rampC[k]; ramp[k] = 1; }
        else { const b = isNaN(hOv[k]) ? t.f : hOv[k]; cs = [b, b, b, b]; }
        if (t.cb) { const top = Math.max(...cs); cb[k] = top + t.cb - t.f; ct[k] = top + t.ct - t.f; }
        if (t.water) water[k] = 1;
        zone[k] = t.zone || null;
      }
      corn.set(cs, k * 4);
      floor[k] = (cs[0] + cs[1] + cs[2] + cs[3]) / 4;
    }
    // objetos
    props = M.props = [];
    const papi = makePropApi();
    def.props(papi);
    for (const d of houseDoors) papi.door(d.i, d.j, d.side, { kind: theme.door === 'metal' ? 'metal' : 'wood' });
    makeWindows(papi);
    M.doors = props.filter(p => p.type === 'door');
    M.resetDoors();
    // navegação (portas não bloqueiam: os bots abrem)
    navBlocked = M.navBlocked = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) { const t = TYPES[grid[k]]; navBlocked[k] = isWall[k] || (t && (t.window || t.low || t.deadly)) ? 1 : 0; }
    for (const p of props) {
      if (p.type === 'door') continue;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const x = c(i), z = c(j);
        if (x > p.x1 - 0.9 && x < p.x2 + 0.9 && z > p.z1 - 0.9 && z < p.z2 + 0.9 && p.y2 > floor[j * W + i] + 0.5) navBlocked[j * W + i] = 1;
      }
    }
    const P = (i, j, yawDeg) => ({ x: c(i), z: c(j), yaw: (yawDeg || 0) * G.U.D2R });
    M.spots = def.spots(P);
    try { autoLadders(); } catch (e) { console.error('escadas', e); }
    if (G.Furn && def.furnish !== false) { try { autoFurnish(makePropApi()); } catch (e) { console.error('mobília', e); } }
    buyT = new Uint8Array(W * H); buyCT = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const z = zone[j * W + i]; if (z !== 'T' && z !== 'CT') continue;
      for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
        (z === 'T' ? buyT : buyCT)[jj * W + ii] = 1;
      }
    }
    M.mesh = M.mesh || null;
    return def;
  };
  function makePropApi() {
    const floorAtCell = (x, z) => M.heightAt(x, z);
    function prop(x, z, sx, sy, sz, type, baseY, opts) {
      const b = baseY !== undefined && baseY !== null ? baseY : floorAtCell(x, z);
      const p = Object.assign({ x1: x - sx / 2, x2: x + sx / 2, z1: z - sz / 2, z2: z + sz / 2, y1: b, y2: b + sy, type }, opts || {});
      p.pen = type === 'crate' ? 1 : type === 'barrel' || type === 'car' || type === 'container' ? 2 : 4;
      if (type === 'door') p.pen = p.kind === 'metal' ? 2 : p.kind === 'gate' ? 4 : 1;
      props.push(p); return p;
    }
    const crate = (x, z, s, stack) => { let y = floorAtCell(x, z); for (let n = 0; n < (stack || 1); n++) { prop(x, z, s, s, s, 'crate', y); y += s; } };
    const car = (x, z, alongX, color) => {
      const b = floorAtCell(x, z), o = { color };
      if (alongX) { prop(x, z, 4.2, 1.1, 1.9, 'car', b, o); prop(x - 0.2, z, 2.2, 0.65, 1.7, 'car', b + 1.1, o); }
      else { prop(x, z, 1.9, 1.1, 4.2, 'car', b, o); prop(x, z - 0.2, 1.7, 0.65, 2.2, 'car', b + 1.1, o); }
    };
    const barrel = (x, z) => prop(x, z, 0.75, 1.0, 0.75, 'barrel');
    const container = (x, z, alongX, color, stack) => { let y = floorAtCell(x, z); for (let n = 0; n < (stack || 1); n++) { prop(x, z, alongX ? 6 : 2.4, 2.6, alongX ? 2.4 : 6, 'container', y, { color: Array.isArray(color) ? color[n % color.length] : color }); y += 2.6; } };
    const block = (x, z, sx, sy, sz, tex, color) => prop(x, z, sx, sy, sz, 'block', null, { tex, color });
    const sandbag = (x, z, sx, sz) => prop(x, z, sx, 1.0, sz, 'sandbag');
    // porta na borda entre células: (i,j) célula + lado ('N','S','E','W'); largura = célula inteira
    const door = (i, j, side, o) => {
      o = o || {};
      const kind = o.kind || theme.door;
      const alongX = side === 'N' || side === 'S';
      const x = side === 'E' ? (i + 1) * S : side === 'W' ? i * S : c(i);
      const z = side === 'S' ? (j + 1) * S : side === 'N' ? j * S : c(j);
      const w = (o.width || 1) * S, hgt = kind === 'gate' ? Math.min(4.2, (o.h || 3.6)) : 2.9;
      const base = Math.max(M.heightAt(c(i), c(j)), M.heightAt(c(i) + (side === 'E' ? S : side === 'W' ? -S : 0), c(j) + (side === 'S' ? S : side === 'N' ? -S : 0)));
      const cx2 = alongX && o.width > 1 ? x + (o.width - 1) * S / 2 : x, cz2 = !alongX && o.width > 1 ? z + (o.width - 1) * S / 2 : z;
      return prop(cx2, cz2, alongX ? w : 0.16, hgt, alongX ? 0.16 : w, 'door', base, { kind, open0: !!o.open, gate: kind === 'gate', swing: o.swing || 1, color: o.color });
    };
    const gate = (i, j, side, width) => door(i, j, side, { kind: 'gate', width: width || 1 });
    // móvel/máquina com modelo próprio (G.Furn): rot em graus (0 = frente para +z)
    const furn = (kind, x, z, rotDeg, o) => {
      const dm = (G.Furn && G.Furn.dims[kind]) || [1, 1, 1, 2];
      const r = ((rotDeg || 0) % 360 + 360) % 360, swap = r === 90 || r === 270;
      const p = prop(x, z, swap ? dm[1] : dm[0], dm[2], swap ? dm[0] : dm[1], 'furn', o && o.y, { kind, rot: r * Math.PI / 180, opt: o || {} });
      p.pen = dm[3]; return p;
    };
    return { c, S, prop, crate, car, barrel, container, block, sandbag, door, gate, furn, floorAt: floorAtCell };
  }

  // ---------------- Mobília automática (encostada nas paredes, sem fechar caminhos) ----------------
  const FURN_LIB = {
    industrial: { inS: ['panel', 'cabinet', 'lockers', 'shelf', 'valves', 'gasCyl'], inD: ['pump', 'compressor', 'workbench', 'tank', 'motor', 'transformer'], outS: ['cabinet', 'gasCyl', 'valves', 'motor'], outD: ['generator', 'compressor', 'transformer', 'pump', 'tank', 'pallet', 'spool'] },
    plant: { inS: ['panel', 'cabinet', 'valves', 'lockers', 'panel'], inD: ['pump', 'bigPump', 'tank', 'compressor', 'transformer', 'pump'], outS: ['cabinet', 'valves', 'gasCyl'], outD: ['transformer', 'generator', 'tank', 'pump', 'spool', 'compressor'] },
    urban: { inS: ['shelf', 'cabinet', 'lockers', 'fridge', 'panel'], inD: ['workbench', 'desk', 'compressor'], outS: ['cabinet', 'gasCyl'], outD: ['generator', 'pallet', 'spool', 'compressor'] },
    residential: { inS: ['wardrobe', 'bookshelf', 'shelf:wood', 'fridge', 'stove', 'cabinet'], inD: ['table', 'desk', 'sofa', 'bed', 'workbench'], outS: ['planter', 'bench', 'planter', 'gasCyl', 'bench'], outD: ['pallet', 'pallet:sacks', 'spool', 'table', 'pallet:sacks', 'generator'] },
    ancient: { inS: ['bookshelf', 'shelf:wood', 'wardrobe'], inD: ['table', 'workbench', 'pallet:sacks'], outS: ['planter:wood', 'bench'], outD: ['pallet:sacks', 'pallet', 'spool'] }
  };
  function reachFrom(s) {
    const seen = new Uint8Array(W * H); if (s < 0) return seen;
    const q = [s]; seen[s] = 1;
    while (q.length) { const a = q.pop(), i = a % W, j = (a / W) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue; const b = nj * W + ni; if (!seen[b] && canStep(a, b)) { seen[b] = 1; q.push(b); } } }
    return seen;
  }
  // peças-chave do tema (def.setpieces = [[tipo, col, lin, rotGraus, opções]]): procura o lugar livre mais próximo e confere os caminhos
  function placeSetPieces(api) {
    const list = def.setpieces; if (!list || !list.length || !G.Furn) return;
    const sp = M.spots, pts = []; for (const k in sp) { const v = sp[k]; if (Array.isArray(v)) pts.push(...v); else if (v && v.x !== undefined) pts.push(v); else if (k === 'routes') for (const s in v) for (const r of v[s]) pts.push(...r); }
    const need = [...new Set(pts.map(p => M.cellIndex(p.x, p.z)).filter(k => k >= 0))];
    const tS = M.cellIndex(sp.tSpawn[0].x, sp.tSpawn[0].z), cS = M.cellIndex(sp.ctSpawn[0].x, sp.ctSpawn[0].z);
    const ok = () => { const a = reachFrom(tS), b = reachFrom(cS); for (const k of need) if (!a[k] || !b[k]) return false; return a[cS] && b[tS]; };
    const dc = (M.doors || []).map(p => [(p.x1 + p.x2) / 2, (p.z1 + p.z2) / 2]);
    let n = 0;
    for (const e of list) {
      const kind = e[0], i0 = e[1], j0 = e[2], rot = e[3] || 0, o = e[4] || {}, dm = G.Furn.dims[kind]; if (!dm) continue;
      const rr = ((rot % 360) + 360) % 360, swap = rr === 90 || rr === 270, w = swap ? dm[1] : dm[0], d = swap ? dm[0] : dm[1];
      const R = o.r === undefined ? 3 : o.r; let done = false;
      for (let ring = 0; ring <= R && !done; ring++) for (let dj = -ring; dj <= ring && !done; dj++) for (let di = -ring; di <= ring && !done; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue;
        const cx = c(i0 + di) + (o.ox || 0), cz = c(j0 + dj) + (o.oz || 0), x1 = cx - w / 2, x2 = cx + w / 2, z1 = cz - d / 2, z2 = cz + d / 2;
        const ci = Math.floor(cx / S), cj = Math.floor(cz / S); if (ci < 1 || cj < 1 || ci >= W - 1 || cj >= H - 1) continue;
        const base = floor[cj * W + ci]; let bad = false;
        for (let jj = Math.floor(z1 / S); jj <= Math.floor((z2 - 1e-4) / S) && !bad; jj++) for (let ii = Math.floor(x1 / S); ii <= Math.floor((x2 - 1e-4) / S); ii++) {
          const k = jj * W + ii, t = TYPES[grid[k]] || {};
          if (ii < 1 || jj < 1 || ii >= W - 1 || jj >= H - 1 || isWall[k] || ramp[k] || water[k] || t.window || t.low || t.deadly || Math.abs(floor[k] - base) > 0.05 || zone[k] === 'T' || zone[k] === 'CT' || (cb[k] < 900 && base + dm[2] > cb[k] - 0.05)) { bad = true; break; }
        }
        if (bad) continue;
        for (const p of props) if (p.x1 < x2 + 0.2 && p.x2 > x1 - 0.2 && p.z1 < z2 + 0.2 && p.z2 > z1 - 0.2 && p.y2 > base + 0.3) { bad = true; break; }
        for (const [px, pz] of dc) if (Math.hypot(Math.max(x1 - px, 0, px - x2), Math.max(z1 - pz, 0, pz - z2)) < 1.8) bad = true;
        for (const l of M.ladders || []) if (Math.hypot(Math.max(x1 - l.x, 0, l.x - x2), Math.max(z1 - l.z, 0, l.z - z2)) < 1.5) bad = true;
        for (const p of pts) { const ddx = Math.max(x1 - p.x, 0, p.x - x2), ddz = Math.max(z1 - p.z, 0, p.z - z2); if (Math.hypot(ddx, ddz) < 1.1) { bad = true; break; } }
        if (bad) continue;
        const p = api.furn(kind, cx, cz, rot, Object.assign({ seed: i0 * 31 + j0, n: n }, o));
        const changed = [];
        for (let jj = Math.max(0, cj - 5); jj <= Math.min(H - 1, cj + 5); jj++) for (let ii = Math.max(0, ci - 5); ii <= Math.min(W - 1, ci + 5); ii++) {
          const kk = jj * W + ii, x = c(ii), z = c(jj);
          if (!navBlocked[kk] && x > p.x1 - 0.9 && x < p.x2 + 0.9 && z > p.z1 - 0.9 && z < p.z2 + 0.9 && p.y2 > floor[kk] + 0.5) { navBlocked[kk] = 1; changed.push(kk); }
        }
        if (changed.length && !ok()) { for (const kk of changed) navBlocked[kk] = 0; props.pop(); continue; }
        done = true; n++;
      }
    }
    M.setCount = n;
  }
  function autoFurnish(api) {
    placeSetPieces(api);
    const sty = G.Detail && G.Detail.styles ? Object.assign({}, G.Detail.styles.default, G.Detail.styles[def.id] || {}) : {};
    const lib = def.furnLib || FURN_LIB[sty.furn]; if (!lib) return;
    const dens = def.furnDens || sty.furnDens || 0.12, hash = G.U.hash2, sp = M.spots;
    const pts = []; for (const k in sp) { const v = sp[k]; if (Array.isArray(v)) pts.push(...v); else if (v && v.x !== undefined) pts.push(v); else if (k === 'routes') for (const s in v) for (const r of v[s]) pts.push(...r); }
    const need = [...new Set(pts.map(p => M.cellIndex(p.x, p.z)).filter(k => k >= 0))];
    const tS = M.cellIndex(sp.tSpawn[0].x, sp.tSpawn[0].z), cS = M.cellIndex(sp.ctSpawn[0].x, sp.ctSpawn[0].z);
    const dc = (M.doors || []).map(p => [(p.x1 + p.x2) / 2, (p.z1 + p.z2) / 2]);
    const free = k => k >= 0 && !isWall[k] && !navBlocked[k] && !ramp[k] && !water[k] && !(TYPES[grid[k]] || {}).window && !(TYPES[grid[k]] || {}).low;
    const ok = () => { const a = reachFrom(tS), b = reachFrom(cS); for (const k of need) if (!a[k] || !b[k]) return false; return a[cS] && b[tS]; };
    const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let placed = 0;
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i; if (!free(k) || zone[k] === 'T' || zone[k] === 'CT') continue;
      for (let s = 0; s < 4; s++) {
        const [dx, dz] = SIDES[s], wk = (j + dz) * W + (i + dx);
        if (!isWall[wk] || floor[wk] - floor[k] < 2.2) continue;
        if (hash(i * 7 + s * 3 + 1, j * 13 + def.id.length) > dens) continue;
        const covered = cb[k] < 900;
        const n1 = (j - dz) * W + (i - dx), n2 = (j - 2 * dz) * W + (i - 2 * dx);
        const wide = free(n1) && free(n2) && Math.abs(floor[n1] - floor[k]) < 0.05 && Math.abs(floor[n2] - floor[k]) < 0.05 && (cb[n1] < 900) === covered;
        const list = covered ? (wide ? lib.inD.concat(lib.inS) : lib.inS) : (wide ? lib.outD.concat(lib.outS) : lib.outS);
        if (!list.length) continue;
        const pick = list[Math.floor(hash(j * 3 + s, i * 5 + 2) * list.length) % list.length].split(':');
        const kind = pick[0], dm = G.Furn.dims[kind]; if (!dm) continue;
        const [w, dpt, h] = dm; if (w > 2.85 || (!wide && dpt > 0.56)) continue;
        if (covered && floor[k] + h > cb[k] - 0.05) continue;
        const cx0 = c(i), cz0 = c(j), off = S / 2 - dpt / 2 - 0.03;
        const cx = cx0 + dx * off, cz = cz0 + dz * off, rot = Math.round(Math.atan2(-dx, -dz) * 180 / Math.PI);
        const sx = dx ? dpt : w, sz = dx ? w : dpt;
        const x1 = cx - sx / 2, x2 = cx + sx / 2, z1 = cz - sz / 2, z2 = cz + sz / 2;
        // nada encostado: outros objetos, portas e pontos táticos
        let bad = false;
        for (const p of props) if (p.x1 < x2 + 0.15 && p.x2 > x1 - 0.15 && p.z1 < z2 + 0.15 && p.z2 > z1 - 0.15) { bad = true; break; }
        for (const [px, pz] of dc) if (Math.hypot(px - cx, pz - cz) < 2.6) bad = true;
        for (const l of M.ladders || []) if (Math.hypot(l.x - cx, l.z - cz) < 2.0) bad = true;
        for (const p of pts) { const ddx = Math.max(x1 - p.x, 0, p.x - x2), ddz = Math.max(z1 - p.z, 0, p.z - z2); if (Math.hypot(ddx, ddz) < 1.2) { bad = true; break; } }
        const fl = floor[k]; if (Math.abs(M.heightAt(x1 + 0.05, z1 + 0.05) - fl) > 0.05 || Math.abs(M.heightAt(x2 - 0.05, z2 - 0.05) - fl) > 0.05) bad = true;
        if (bad) continue;
        const opt = { seed: i * 31 + j, wood: pick[1] === 'wood', sacks: pick[1] === 'sacks', n: placed % 6 + 1, color: ['blue', 'red', 'green'][(i + j) % 3] };
        const p = api.furn(kind, cx, cz, rot, opt);
        // navegação: células cobertas pelo objeto (mesma regra da carga do mapa) — desfaz se fechar algum caminho
        const changed = [];
        for (let jj = Math.max(0, j - 2); jj <= Math.min(H - 1, j + 2); jj++) for (let ii = Math.max(0, i - 2); ii <= Math.min(W - 1, i + 2); ii++) {
          const kk = jj * W + ii, x = c(ii), z = c(jj);
          if (!navBlocked[kk] && x > p.x1 - 0.9 && x < p.x2 + 0.9 && z > p.z1 - 0.9 && z < p.z2 + 0.9 && p.y2 > floor[kk] + 0.5) { navBlocked[kk] = 1; changed.push(kk); }
        }
        if (changed.length && !ok()) { for (const kk of changed) navBlocked[kk] = 0; props.pop(); continue; }
        placed++;
        break;   // no máximo um por célula
      }
    }
    M.furnCount = placed;
  }

  // ---------------- Casas que dá para entrar (blocos de parede viram sala com porta e janelas) ----------------
  function autoHouses(fill, hOv, maxN) {
    const used = new Uint8Array(W * H), out = [];
    const wallAt = (i, j) => i > 0 && j > 0 && i < W - 1 && j < H - 1 && grid[j * W + i] === '#';
    const flOf = k => { const t = TYPES[grid[k]]; return isNaN(hOv[k]) ? (t ? t.f : 0) : hOv[k]; };
    const walk = (i, j) => { if (i < 0 || j < 0 || i >= W || j >= H) return false; const ch = grid[j * W + i], t = TYPES[ch]; return ch !== '#' && ch !== '/' && t && !t.window && !t.low && !t.water && !t.cb && ch !== 'T' && ch !== 'C'; };
    const rects = [];
    for (let j = 2; j < H - 2; j++) for (let i = 2; i < W - 2; i++) {
      if (!wallAt(i, j) || used[j * W + i]) continue;
      let w = 1; while (w < 7 && wallAt(i + w, j) && !used[j * W + i + w]) w++;
      let d = 1; outer: while (d < 7) { for (let q = 0; q < w; q++) if (!wallAt(i + q, j + d) || used[(j + d) * W + i + q]) break outer; d++; }
      for (let jj = j; jj < j + d; jj++) for (let ii = i; ii < i + w; ii++) used[jj * W + ii] = 1;
      if (w >= 4 && d >= 4) rects.push({ i, j, w, d });
    }
    // lados: N (j-1), S (j+d), W (i-1), E (i+w) — precisa de rua plana ao longo do lado
    const sides = r => [['N', r.i, r.j - 1, 1, 0, r.w], ['S', r.i, r.j + r.d, 1, 0, r.w], ['W', r.i - 1, r.j, 0, 1, r.d], ['E', r.i + r.w, r.j, 0, 1, r.d]].map(([s, i0, j0, di, dj, n]) => {
      let ok = 0, fl = null; for (let q = 1; q < n - 1; q++) { const ii = i0 + di * q, jj = j0 + dj * q; if (walk(ii, jj)) { const f = flOf(jj * W + ii); if (fl === null) fl = f; if (Math.abs(f - fl) < 0.01) ok++; } }
      return { s, i0, j0, di, dj, n, ok, fl };
    });
    rects.sort((a, b) => (b.w * b.d) - (a.w * a.d) || (G.U.hash2(a.i, a.j) - G.U.hash2(b.i, b.j)));
    const taken = [];
    for (const r of rects) {
      if (out.length >= maxN) break;
      const sd = sides(r).filter(x => x.ok >= x.n - 2).sort((a, b) => b.ok - a.ok);
      if (!sd.length) continue;
      if (taken.some(t => Math.abs(t.i - r.i) < 8 && Math.abs(t.j - r.j) < 8)) continue;
      const doorSide = sd[0], fl = doorSide.fl;
      // sala por dentro (piso na altura da rua da porta)
      fill(r.i + 1, r.j + 1, r.i + r.w - 2, r.j + r.d - 2, 'i', fl);
      // vão da porta no meio do lado escolhido
      const mid = Math.floor((doorSide.n - 1) / 2);
      const di = doorSide.s === 'W' ? r.i : doorSide.s === 'E' ? r.i + r.w - 1 : r.i + Math.max(1, Math.min(r.w - 2, mid));
      const dj = doorSide.s === 'N' ? r.j : doorSide.s === 'S' ? r.j + r.d - 1 : r.j + Math.max(1, Math.min(r.d - 2, mid));
      fill(di, dj, di, dj, 'i', fl);
      out.push({ i: di, j: dj, side: doorSide.s });
      // janelas nos outros lados com rua (até 2 por lado)
      for (const x of sd.slice(1).concat(doorSide)) {
        if (Math.abs(x.fl - fl) > 0.01) continue;
        const n = x.n; const picks = n >= 5 ? [1, n - 2] : [1];
        for (const q of picks) {
          const wi = x.s === 'W' ? r.i : x.s === 'E' ? r.i + r.w - 1 : r.i + q, wj = x.s === 'N' ? r.j : x.s === 'S' ? r.j + r.d - 1 : r.j + q;
          if (wi === di && wj === dj) continue;
          if (x === doorSide && Math.abs((x.s === 'N' || x.s === 'S' ? wi - di : wj - dj)) < 2) continue;
          const oi = wi + (x.s === 'W' ? -1 : x.s === 'E' ? 1 : 0), oj = wj + (x.s === 'N' ? -1 : x.s === 'S' ? 1 : 0);
          if (!walk(oi, oj)) continue;
          fill(wi, wj, wi, wj, 'j', fl + 1.0);
        }
      }
      taken.push(r);
    }
    M.autoHouses = out.length;
    return out;
  }
  // ---------------- Vidros nas janelas ('j'): quebram com tiro/granada, abrem com E (fazem barulho) ----------------
  function makeWindows(api) {
    if (def.glass === false) { M.windows = []; return; }
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i, t = TYPES[grid[k]]; if (!t || !t.window) continue;
      const openX = !isWall[k - 1] && !isWall[k + 1], openZ = !isWall[k - W] && !isWall[k + W];
      if (!openX && !openZ) continue;
      const sill = floor[k], top = cb[k], h = top - sill - 0.02; if (h < 0.4) continue;
      const p = api.prop(c(i), c(j), openX ? 0.06 : S - 0.04, h, openX ? S - 0.04 : 0.06, 'window', sill + 0.01, { see: true, axisX: openX });
      p.pen = 0;
    }
    M.windows = props.filter(p => p.type === 'window');
    for (const w of M.windows) { w.open = false; w.broken = false; w.anim = 0; }
  }
  const winCenter = p => new THREE.Vector3((p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2, (p.z1 + p.z2) / 2);
  M.breakWindow = (p, from) => {
    if (!p || p.broken) return;
    p.broken = true; p.off = true;
    if (p.vis) p.vis.visible = false;
    const c0 = winCenter(p);
    for (let i = 0; i < 18; i++) spawnDebris(c0.clone().add(new THREE.Vector3((Math.random() - 0.5) * (p.axisX ? 0.1 : 2.6), (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * (p.axisX ? 2.6 : 0.1))), { vis: { mat: glassShardMat() } }, 1, from || null);
    if (G.Audio.glass) G.Audio.glass(c0);
    if (G.Bots) G.Bots.hear(null, c0, 32, 'glass');
    if (G.MP && G.MP.role === 'host') G.MP.emit('wb', { w: M.windows.indexOf(p) });
  };
  let _gsm = null; const glassShardMat = () => _gsm || (_gsm = new THREE.MeshPhongMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.55, shininess: 120, specular: 0xffffff }));
  M.toggleWindow = (p) => {
    if (!p || p.broken || (p.cool || 0) > 0) return false;
    p.open = !p.open; if (!p.open) p.off = false; p.cool = 0.5;
    const c0 = winCenter(p);
    if (G.Audio.windowSlide) G.Audio.windowSlide(c0, p.open);
    if (G.Bots) G.Bots.hear(null, c0, 20, 'window');
    if (G.MP && G.MP.role === 'host') G.MP.emit('wn', { w: M.windows.indexOf(p), o: p.open ? 1 : 0 });
    return true;
  };
  M.netWindow = (w, open) => { const p = (M.windows || [])[w]; if (!p || p.broken) return; if (p.open !== !!open) { p.open = !!open; if (!p.open) p.off = false; if (G.Audio.windowSlide) G.Audio.windowSlide(winCenter(p), p.open); } };
  M.netWindowBreak = (w) => M.breakWindow((M.windows || [])[w]);
  M.windowNear = (a, maxD) => {
    const eye = a.eye(), f = G.U.dirFrom(a.yaw, a.pitch, new THREE.Vector3());
    let best = null, bd = maxD || 2.4;
    for (const p of M.windows || []) {
      if (p.broken) continue;
      const v = winCenter(p).sub(eye), d = Math.hypot(v.x, v.z);
      if (d > bd || Math.abs(v.y) > 1.6) continue;
      if (d > 1.0 && v.normalize().dot(f) < 0.4) continue;
      bd = d; best = p;
    }
    return best;
  };
  // ---------------- Escadas de mão (acesso a lugares altos; bots também usam) ----------------
  const LADDER = new Set();
  M.ladders = [];
  function autoLadders() {
    LADDER.clear(); M.ladders = [];
    const want = def.ladderCount === undefined ? 4 : def.ladderCount; if (!want) return;
    const ok = k => !isWall[k] && !navBlocked[k] && !ramp[k] && !water[k] && !(TYPES[grid[k]] || {}).window && !(TYPES[grid[k]] || {}).low;
    const cand = [];
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i; if (!ok(k) || cb[k] < 900 || zone[k] === 'T' || zone[k] === 'CT') continue;
      for (const [di, dj, s] of [[1, 0, 'E'], [-1, 0, 'W'], [0, 1, 'S'], [0, -1, 'N']]) {
        const nk = (j + dj) * W + (i + di); if (!ok(nk)) continue;
        const dh = floor[nk] - floor[k]; if (dh < 1.4 || dh > 6.5) continue;
        if (cb[nk] < 900 && cb[nk] - floor[nk] < 2.2) continue;
        cand.push({ k, nk, i, j, di, dj, s, h: G.U.hash2(i * 17 + di * 3 + 5, j * 23 + dj * 7 + def.id.length) });
      }
    }
    cand.sort((a, b) => a.h - b.h);
    const doorsC = (M.doors || []).map(p => [(p.x1 + p.x2) / 2, (p.z1 + p.z2) / 2]);
    for (const cd of cand) {
      if (M.ladders.length >= want) break;
      const x = c(cd.i) + cd.di * (S / 2 - 0.14), z = c(cd.j) + cd.dj * (S / 2 - 0.14);
      if (M.ladders.some(l => Math.hypot(l.x - x, l.z - z) < 18)) continue;
      if (doorsC.some(([px, pz]) => Math.hypot(px - x, pz - z) < 3)) continue;
      if (props.some(p => x > p.x1 - 0.8 && x < p.x2 + 0.8 && z > p.z1 - 0.8 && z < p.z2 + 0.8)) continue;
      addLadder(cd.k, cd.nk, cd.di, cd.dj, x, z);
    }
  }
  function addLadder(k, nk, di, dj, x, z) {
    const y0 = floor[k], y1 = floor[nk], hw = 0.42;
    const l = { x, z, dx: di, dz: dj, y0, y1, x1: x - (di ? 0.12 : hw), x2: x + (di ? 0.12 : hw), z1: z - (dj ? 0.12 : hw), z2: z + (dj ? 0.12 : hw), k, nk };
    M.ladders.push(l); LADDER.add(k * 65536 + nk);
    return l;
  }
  // agente encostado numa escada?
  M.ladderAt = (a) => {
    for (const l of M.ladders) {
      const dx = Math.max(l.x1 - a.pos.x, 0, a.pos.x - l.x2), dz = Math.max(l.z1 - a.pos.z, 0, a.pos.z - l.z2);
      if (Math.hypot(dx, dz) < 0.55 && a.pos.y > l.y0 - 0.3 && a.pos.y < l.y1 + 0.15) return l;
    }
    return null;
  };

  M.cellIndex = (x, z) => { const i = Math.floor(x / S), j = Math.floor(z / S); if (i < 0 || j < 0 || i >= W || j >= H) return -1; return j * W + i; };
  M.zoneAt = (x, z) => { const k = M.cellIndex(x, z); return k < 0 ? null : zone[k]; };
  M.siteCenter = s => s === 'A' ? M.spots.A : M.spots.B;
  M.isBuyZone = (x, z, team) => { const k = M.cellIndex(x, z); return k >= 0 && !!(team === 'T' ? buyT : buyCT)[k]; };
  // morre quem entra no líquido de uma célula letal ('k')
  M.deadlyAt = (x, y, z) => { const k = M.cellIndex(x, z); if (k < 0) return false; const t = TYPES[grid[k]]; return !!(t && t.deadly) && y < floor[k] + (t.wy !== undefined ? t.wy : 2.65) - 0.1; };
  M.isWater = (x, z) => { const k = M.cellIndex(x, z); return k >= 0 && !!water[k]; };
  // altura do piso num ponto (bilinear dentro de rampas)
  function hAtK(k, x, z) {
    if (!ramp[k]) return floor[k];
    const i = k % W, j = (k / W) | 0;
    const u = Math.min(1, Math.max(0, (x - i * S) / S)), v = Math.min(1, Math.max(0, (z - j * S) / S)), o = k * 4;
    return (corn[o] * (1 - u) + corn[o + 1] * u) * (1 - v) + (corn[o + 2] * (1 - u) + corn[o + 3] * u) * v;
  }
  M.heightAt = (x, z) => { const k = M.cellIndex(x, z); return k < 0 ? 0 : hAtK(k, x, z); };
  function maxInRect(k, x1, z1, x2, z2) {
    if (!ramp[k]) return floor[k];
    const i = k % W, j = (k / W) | 0;
    const a = Math.max(x1, i * S), b = Math.min(x2, i * S + S), cc = Math.max(z1, j * S), d = Math.min(z2, j * S + S);
    return Math.max(hAtK(k, a, cc), hAtK(k, b, cc), hAtK(k, a, d), hAtK(k, b, d));
  }

  // ---------------- Consultas de colisão ----------------
  M.solids = (x1, z1, x2, z2, out) => {
    out = out || [];
    out.length = 0;
    const i1 = Math.floor(x1 / S), i2 = Math.floor(x2 / S), j1 = Math.floor(z1 / S), j2 = Math.floor(z2 / S);
    for (let j = j1; j <= j2; j++) for (let i = i1; i <= i2; i++) {
      if (i < 0 || j < 0 || i >= W || j >= H) { out.push(-100, 100); continue; }
      const k = j * W + i;
      out.push(-100, maxInRect(k, x1, z1, x2, z2));
      if (cb[k] < 900) out.push(cb[k], ct[k]);
    }
    for (const p of props) if (!p.off && p.x2 > x1 && p.x1 < x2 && p.z2 > z1 && p.z1 < z2) out.push(p.y1, p.y2);
    return out;
  };
  M.groundAt = (x, z) => { const k = M.cellIndex(x, z); let g = k < 0 ? 0 : hAtK(k, x, z); for (const p of props) if (!p.off && x > p.x1 && x < p.x2 && z > p.z1 && z < p.z2 && p.y2 > g && p.y2 < g + 4) g = p.y2; return g; };
  M.pointSolid = (x, y, z) => {
    const k = M.cellIndex(x, z);
    if (k < 0) return true;
    if (y < hAtK(k, x, z)) return true;
    if (y > cb[k] && y < ct[k]) return true;
    for (const p of props) if (!p.off && x > p.x1 && x < p.x2 && z > p.z1 && z < p.z2 && y > p.y1 && y < p.y2) return true;
    return false;
  };

  // ---------------- Raycast (DDA em grade + rampas + props) ----------------
  const hitObj = { t: 0, nx: 0, ny: 0, nz: 0, kind: '', prop: null };
  function up(t) { hitObj.t = t; hitObj.nx = 0; hitObj.ny = 1; hitObj.nz = 0; hitObj.kind = 'cell'; hitObj.prop = null; return hitObj; }
  M.raycastCells = (o, d, maxT) => {
    let i = Math.floor(o.x / S), j = Math.floor(o.z / S);
    const stepX = d.x > 0 ? 1 : -1, stepZ = d.z > 0 ? 1 : -1;
    const tDX = Math.abs(d.x) < 1e-9 ? 1e9 : Math.abs(S / d.x);
    const tDZ = Math.abs(d.z) < 1e-9 ? 1e9 : Math.abs(S / d.z);
    let tMX = Math.abs(d.x) < 1e-9 ? 1e9 : ((stepX > 0 ? (i + 1) * S - o.x : o.x - i * S) / Math.abs(d.x));
    let tMZ = Math.abs(d.z) < 1e-9 ? 1e9 : ((stepZ > 0 ? (j + 1) * S - o.z : o.z - j * S) / Math.abs(d.z));
    let tIn = 0, axis = -1;
    for (let guard = 0; guard < 400; guard++) {
      const tOut = Math.min(tMX, tMZ, maxT);
      if (i < 0 || j < 0 || i >= W || j >= H) return set(tIn, axis, stepX, stepZ, 'cell');
      const k = j * W + i;
      const y0 = o.y + d.y * tIn, y1 = o.y + d.y * tOut;
      if (ramp[k]) {
        const f0 = hAtK(k, o.x + d.x * tIn, o.z + d.z * tIn), f1 = hAtK(k, o.x + d.x * tOut, o.z + d.z * tOut);
        if (y0 <= f0) return set(tIn, axis, stepX, stepZ, 'cell');
        if (y1 < f1) { const a = y0 - f0, b = y1 - f1; return up(tIn + (tOut - tIn) * a / (a - b)); }
      } else {
        const f = floor[k];
        if (y0 <= f) return set(tIn, axis, stepX, stepZ, 'cell');
        if (y1 < f) return up((f - o.y) / d.y);
      }
      if (cb[k] < 900) {
        const a = cb[k], b = ct[k];
        if (y0 >= a && y0 <= b) return set(tIn, axis, stepX, stepZ, 'cell');
        if (y0 < a && y1 >= a) { hitObj.t = (a - o.y) / d.y; hitObj.nx = 0; hitObj.ny = -1; hitObj.nz = 0; hitObj.kind = 'cell'; hitObj.prop = null; return hitObj; }
        if (y0 > b && y1 <= b) return up((b - o.y) / d.y);
      }
      if (tOut >= maxT) return null;
      if (tMX < tMZ) { i += stepX; tIn = tMX; tMX += tDX; axis = 0; }
      else { j += stepZ; tIn = tMZ; tMZ += tDZ; axis = 2; }
    }
    return null;
  };
  function set(t, axis, sx, sz, kind) {
    hitObj.t = t; hitObj.nx = axis === 0 ? -sx : 0; hitObj.ny = axis === -1 ? 1 : 0; hitObj.nz = axis === 2 ? -sz : 0;
    hitObj.kind = kind; hitObj.prop = null; return hitObj;
  }
  const _hp = new THREE.Vector3();
  M.rayProps = (o, d, maxT) => {
    const res = [];
    for (const p of props) {
      if (p.off) continue;
      const r = G.U.rayAABB(o, d, p.x1, p.y1, p.z1, p.x2, p.y2, p.z2, maxT);
      if (r && p.type === 'door' && p.chp && M.doorPass(p, _hp.set(o.x + d.x * r[0], o.y + d.y * r[0], o.z + d.z * r[0]))) continue;
      if (r) res.push({ t: r[0], tOut: r[1], prop: p });
    }
    res.sort((a, b) => a.t - b.t);
    return res;
  };
  M.raycast = (o, d, maxT) => {
    const h = M.raycastCells(o, d, maxT);
    let best = h ? { t: h.t, nx: h.nx, ny: h.ny, nz: h.nz, kind: 'cell', prop: null } : null;
    for (const p of props) {
      if (p.off) continue;
      if (p.see) continue;
      const r = G.U.rayAABB(o, d, p.x1, p.y1, p.z1, p.x2, p.y2, p.z2, best ? best.t : maxT);
      if (r && p.type === 'door' && p.chp && M.doorPass(p, _hp.set(o.x + d.x * r[0], o.y + d.y * r[0], o.z + d.z * r[0]))) continue;
      if (r && (!best || r[0] < best.t)) {
        const px = o.x + d.x * r[0], py = o.y + d.y * r[0], pz = o.z + d.z * r[0];
        let nx = 0, ny = 0, nz = 0, e = 0.02;
        if (Math.abs(px - p.x1) < e) nx = -1; else if (Math.abs(px - p.x2) < e) nx = 1;
        else if (Math.abs(pz - p.z1) < e) nz = -1; else if (Math.abs(pz - p.z2) < e) nz = 1;
        else if (Math.abs(py - p.y2) < e) ny = 1; else ny = -1;
        best = { t: r[0], nx, ny, nz, kind: 'prop', prop: p };
      }
    }
    return best;
  };
  const _d = new THREE.Vector3();
  M.los = (a, b) => {
    _d.subVectors(b, a); const L = _d.length(); if (L < 1e-4) return true;
    _d.divideScalar(L);
    return !M.raycast(a, _d, L - 0.05);
  };

  // ---------------- Portas e portões ----------------
  M.resetDoors = () => {
    for (const p of M.doors || []) {
      p.open = p.gate ? false : p.open0; p.off = p.open; p.anim = p.open ? 1 : 0;
      if (!p.gate) { initDoorHP(p); if (p.vis) { for (const lf of p.vis.leaves) lf.piv.visible = true; for (const m of p.vis.chunks || []) if (m) m.visible = true; } }
    }
    for (const w of M.windows || []) { w.open = false; w.broken = false; w.off = false; w.anim = 0; if (w.vis) w.vis.visible = true; }
    clearDebris();
  };
  // ---- portas destrutíveis: folha dividida em pedaços (bala quebra o pedaço; granada/bomba arrebenta a porta) ----
  function doorDims(p) { const along = (p.x2 - p.x1) > (p.z2 - p.z1); return { along, w: along ? p.x2 - p.x1 : p.z2 - p.z1 }; }
  function initDoorHP(p) {
    const { w } = doorDims(p); let cols = Math.max(2, Math.round(w / 0.5)); if (w > 1.8 && cols % 2) cols++;
    p.gc = cols; p.gr = 6; p.gw = w; p.chp = new Float32Array(cols * 6).fill(p.kind === 'metal' ? 3 : 1); p.broken = false; p.holes = 0;
  }
  function chunkAt(p, pt) {
    const { along } = doorDims(p);
    const u = (along ? pt.x - p.x1 : pt.z - p.z1) / p.gw, v = (pt.y - p.y1) / (p.y2 - p.y1);
    if (u < 0 || u > 1 || v < 0 || v > 1) return -1;
    return Math.min(p.gr - 1, Math.floor(v * p.gr)) * p.gc + Math.min(p.gc - 1, Math.floor(u * p.gc));
  }
  function chunkCenter(p, k) {
    const { along } = doorDims(p), col = k % p.gc, row = (k / p.gc) | 0, u = (col + 0.5) / p.gc, v = (row + 0.5) / p.gr;
    return new THREE.Vector3(along ? p.x1 + u * p.gw : (p.x1 + p.x2) / 2, p.y1 + v * (p.y2 - p.y1), along ? (p.z1 + p.z2) / 2 : p.z1 + u * p.gw);
  }
  M.doorPass = (p, pt) => { if (p.gate) return false; if (p.broken) return true; const k = chunkAt(p, pt); return k >= 0 && p.chp[k] <= 0; };
  M.hitDoor = (p, pt) => {
    if (!p || p.type !== 'door' || p.gate || p.broken || !p.chp || p.off) return;
    const k = chunkAt(p, pt); if (k < 0 || p.chp[k] <= 0) return;
    p.chp[k] -= 1;
    if (p.chp[k] > 0) { if (G.Audio.hit) G.Audio.hit(pt, false, p.kind === 'metal'); return; }
    breakChunk(p, k);
    if (G.MP && G.MP.role === 'host') G.MP.emit('dc', { d: M.doors.indexOf(p), c: k });
    if (p.holes >= p.chp.length * 0.6) M.breakDoor(p, pt);
  };
  function breakChunk(p, k) {
    p.chp[k] = 0; p.holes = (p.holes || 0) + 1;
    const m = p.vis && p.vis.chunks && p.vis.chunks[k]; if (m) m.visible = false;
    spawnDebris(chunkCenter(p, k), p, 3, null);
  }
  M.netDoorChunk = (d, k) => { const p = (M.doors || [])[d]; if (!p || p.broken || !p.chp || p.chp[k] <= 0) return; breakChunk(p, k); };
  M.breakDoor = (p, from) => {
    if (!p || p.gate || p.broken) return;
    p.broken = true; p.off = true; p.open = false;
    if (p.vis) for (const lf of p.vis.leaves) lf.piv.visible = false;
    const c0 = doorCenter(p);
    for (let i = 0; i < 16; i++) spawnDebris(c0.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.2)), p, 1, from);
    if (G.Audio.door) G.Audio.door(c0, 'gate');
    if (G.Combat && G.Combat.dust) for (let i = 0; i < 4; i++) G.Combat.dust(c0.clone().add(new THREE.Vector3(0, (Math.random() - 0.5) * 2, 0)), 1.4, p.kind === 'metal' ? 0x9a9a9a : 0x8a6a40);
    if (G.MP && G.MP.role === 'host') G.MP.emit('db', { d: M.doors.indexOf(p) });
  };
  M.blastDoors = (pos, r) => {
    for (const p of M.doors || []) { if (p.gate || p.broken) continue; if (doorCenter(p).distanceTo(pos) < r) M.breakDoor(p, pos); }
    for (const w of M.windows || []) if (!w.broken && winCenter(w).distanceTo(pos) < r + 1.5) M.breakWindow(w, pos);
  };
  // estilhaços (visual)
  let debris = [];
  const debrisGeo = new THREE.BoxGeometry(1, 1, 1);
  function spawnDebris(pos, p, n, from) {
    if (!M.mesh) return;
    const mat = p.vis && p.vis.mat;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(debrisGeo, mat || new THREE.MeshLambertMaterial({ color: 0x7a5a3a }));
      const big = !!from; m.scale.set(big ? 0.25 + Math.random() * 0.35 : 0.08 + Math.random() * 0.12, big ? 0.2 + Math.random() * 0.4 : 0.08 + Math.random() * 0.1, 0.05);
      m.position.copy(pos); m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); m.castShadow = true;
      const dir = from ? pos.clone().sub(from).setY(0).normalize() : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      const sp = from ? 5 + Math.random() * 6 : 1.5 + Math.random() * 2;
      M.mesh.add(m);
      debris.push({ m, v: new THREE.Vector3(dir.x * sp, 1.5 + Math.random() * 3, dir.z * sp), w: new THREE.Vector3(Math.random() * 10, Math.random() * 10, 0), rest: false });
    }
    while (debris.length > 160) { const o = debris.shift(); if (o.m.parent) o.m.parent.remove(o.m); }
  }
  function clearDebris() { for (const o of debris) if (o.m.parent) o.m.parent.remove(o.m); debris = []; }
  function tickDebris(dt) {
    for (const o of debris) {
      if (o.rest) continue;
      o.v.y -= 20 * dt; o.m.position.addScaledVector(o.v, dt); o.m.rotation.x += o.w.x * dt; o.m.rotation.y += o.w.y * dt;
      const g = M.groundAt(o.m.position.x, o.m.position.z);
      if (o.m.position.y < g + 0.03) { o.m.position.y = g + 0.03; o.v.multiplyScalar(0.3); o.v.y = Math.abs(o.v.y) * 0.3; if (Math.hypot(o.v.x, o.v.z) < 0.4) { o.rest = true; o.m.rotation.x = Math.PI / 2 * Math.round(o.m.rotation.x / (Math.PI / 2)); } }
    }
  }
  M.openGates = () => { for (const p of M.doors || []) if (p.gate && !p.open) { p.open = true; p.off = true; if (G.Audio.door) G.Audio.door(doorCenter(p), 'gate'); } };
  const doorCenter = p => new THREE.Vector3((p.x1 + p.x2) / 2, p.y1 + 1.2, (p.z1 + p.z2) / 2);
  M.doorCenter = doorCenter;
  M.toggleDoor = (p) => {
    if (p.gate || p.broken) return false;
    if (p.open) {
      // não fecha em cima de ninguém
      for (const a of (G.Game && G.Game.agents) || []) if (a.alive && a.pos.x + 0.36 > p.x1 && a.pos.x - 0.36 < p.x2 && a.pos.z + 0.36 > p.z1 && a.pos.z - 0.36 < p.z2) return false;
      p.open = false; p.off = false;          // fechar bloqueia na hora
    } else { p.open = true; }                 // abrir só libera quando a folha já abriu (tickDoors)
    p.cool = 0.6;
    if (G.Audio.door) G.Audio.door(doorCenter(p), p.kind);
    if (G.Bots) G.Bots.hear(null, doorCenter(p), 14, 'door');
    return true;
  };
  // jogador apertou E: porta mais próxima na frente
  M.useDoor = (a) => {
    const eye = a.eye(), f = G.U.dirFrom(a.yaw, a.pitch, new THREE.Vector3());
    let best = null, bd = 9;
    for (const p of M.doors || []) {
      if (p.gate || p.broken) continue;
      const cpos = doorCenter(p), v = cpos.clone().sub(eye), dist = Math.hypot(v.x, v.z);
      if (dist > 2.8) continue;
      if (dist > 1.1 && v.normalize().dot(f) < 0.5) continue;
      if (dist < bd) { bd = dist; best = p; }
    }
    if (best) return M.toggleDoor(best);
    const w = M.windowNear(a, 2.4); return w ? M.toggleWindow(w) : false;
  };
  M.doorNear = (a, maxD) => {
    for (const p of M.doors || []) { if (p.gate || p.broken) continue; const cpos = doorCenter(p); if (Math.hypot(cpos.x - a.pos.x, cpos.z - a.pos.z) < (maxD || 2.4)) return p; }
    return null;
  };
  // bots: abre porta fechada à frente na direção do movimento
  M.botDoor = (a, dx, dz) => {
    const L = Math.hypot(dx, dz) || 1;
    for (const p of M.doors || []) {
      if (p.open || p.gate || p.broken || (p.cool || 0) > 0) continue;
      const cpos = doorCenter(p), vx = cpos.x - a.pos.x, vz = cpos.z - a.pos.z, dist = Math.hypot(vx, vz);
      if (dist < 2.0 && (vx * dx + vz * dz) / (L * (dist || 1)) > 0.25) { M.toggleDoor(p); return true; }
    }
    return false;
  };
  // lógica (roda no passo da simulação): animação + quando a porta deixa de bloquear visão/tiros
  M.tickDoors = (dt) => {
    for (const p of M.doors || []) {
      p.cool = Math.max(0, (p.cool || 0) - dt);
      const target = p.open ? 1 : 0;
      p.anim = (p.anim || 0) + (target - (p.anim || 0)) * Math.min(1, dt * (p.gate ? 1.6 : 6));
      if (Math.abs(target - p.anim) < 0.002) p.anim = target;
      p.off = p.broken || (p.open && p.anim > (p.gate ? 0.8 : 0.7));
    }
    for (const w of M.windows || []) {
      w.cool = Math.max(0, (w.cool || 0) - dt);
      const tg = w.open ? 1 : 0; w.anim += (tg - w.anim) * Math.min(1, dt * 5); if (Math.abs(tg - w.anim) < 0.002) w.anim = tg;
      w.off = w.broken || (w.open && w.anim > 0.7);
    }
    tickDebris(dt);
  };
  // visual (roda no render)
  M.updateDoors = () => {
    for (const w of M.windows || []) if (w.vis && !w.broken) w.vis.position.y = w.vis.userData.y0 + w.anim * (w.y2 - w.y1) * 0.92;
    for (const p of M.doors || []) {
      const v = p.vis; if (!v) continue;
      if (p.gate) { v.panel.position.y = v.y0 + p.anim * (p.y2 - p.y1 - 0.25); v.panel.scale.y = 1 - p.anim * 0.85; }
      else for (const lf of v.leaves) lf.piv.rotation.y = lf.dir * p.swing * p.anim * 1.5;
    }
  };

  // ---------------- Navegação (A* na grade) ----------------
  function canStep(a, b) { const dh = floor[b] - floor[a]; return !navBlocked[b] && (dh <= 0.56 || ((ramp[a] || ramp[b]) && dh <= 0.95) || LADDER.has(a * 65536 + b)); }
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  M.findPath = (sx, sz, tx, tz) => {
    let s = M.cellIndex(sx, sz), t = M.cellIndex(tx, tz);
    if (s < 0 || t < 0) return null;
    if (navBlocked[s]) s = nearestFree(s);
    if (navBlocked[t]) t = nearestFree(t);
    if (s < 0 || t < 0) return null;
    const g = new Float32Array(W * H).fill(1e9), from = new Int32Array(W * H).fill(-1), closed = new Uint8Array(W * H);
    const open = [s]; g[s] = 0;
    const ti = t % W, tj = (t / W) | 0;
    const hf = k => { const dx = Math.abs(k % W - ti), dz = Math.abs(((k / W) | 0) - tj); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    const f = new Float32Array(W * H).fill(1e9); f[s] = hf(s);
    while (open.length) {
      let bi = 0; for (let q = 1; q < open.length; q++) if (f[open[q]] < f[open[bi]]) bi = q;
      const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (cur === t) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const ci = cur % W, cj = (cur / W) | 0;
      for (const [dx, dz, cost] of DIRS) {
        const ni = ci + dx, nj = cj + dz;
        if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
        const nk = nj * W + ni;
        if (closed[nk] || !canStep(cur, nk)) continue;
        if (dx && dz && (!canStep(cur, cj * W + ni) || !canStep(cur, nj * W + ci))) continue;
        const ng = g[cur] + cost + (cb[nk] < 900 ? 0.05 : 0) + (water[nk] ? 0.4 : 0);
        if (ng < g[nk]) { g[nk] = ng; from[nk] = cur; f[nk] = ng + hf(nk); open.push(nk); }
      }
    }
    if (from[t] < 0 && s !== t) return null;
    const cells = [];
    for (let k = t; k >= 0; k = from[k]) { cells.push(k); if (k === s) break; }
    cells.reverse();
    const pts = cells.map(k => new THREE.Vector3(c(k % W), floor[k], c((k / W) | 0)));
    pts[pts.length - 1].set(tx, M.groundAt(tx, tz), tz);
    return smooth(new THREE.Vector3(sx, 0, sz), pts);
  };
  function nearestFree(k) {
    const ci = k % W, cj = (k / W) | 0;
    for (let r = 1; r < 6; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= W || j >= H) continue;
      if (!navBlocked[j * W + i]) return j * W + i;
    }
    return -1;
  }
  function pointOK(x, z) {
    const k = M.cellIndex(x, z); if (k < 0 || isWall[k]) return false;
    const fl = hAtK(k, x, z);
    for (const p of props) if (p.type !== 'door' && x > p.x1 - 0.5 && x < p.x2 + 0.5 && z > p.z1 - 0.5 && z < p.z2 + 0.5 && p.y2 > fl + 0.45) return false;
    return true;
  }
  M.walkLine = (a, b) => {
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    const n = Math.ceil(L / 0.6); if (n === 0) return true;
    const px = -dz / L * 0.45, pz = dx / L * 0.45;
    let prevF = M.heightAt(a.x, a.z);
    for (let q = 1; q <= n; q++) {
      const x = a.x + dx * q / n, z = a.z + dz * q / n;
      if (!pointOK(x, z) || !pointOK(x + px, z + pz) || !pointOK(x - px, z - pz)) return false;
      const f = M.heightAt(x, z);
      if (f - prevF > 0.5) return false;
      if (prevF - f > 1.2) return false;   // evita pular de alturas no caminho suavizado
      prevF = f;
    }
    return true;
  };
  function smooth(start, pts) {
    const out = [];
    let cur = start, i = 0;
    while (i < pts.length) {
      let far = i;
      for (let q = pts.length - 1; q > i; q--) if (M.walkLine(cur, pts[q])) { far = q; break; }
      out.push(pts[far]); cur = pts[far]; i = far + 1;
    }
    return out;
  }

  // ---------------- Construção da malha 3D ----------------
  function windowTexture(kind) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96; const g = cv.getContext('2d');
    if (kind === 'glass') {
      g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, 64, 96);
      g.fillStyle = '#1d2a36'; g.fillRect(6, 6, 52, 84);
      g.fillStyle = 'rgba(160,200,230,0.35)'; g.fillRect(8, 8, 22, 38); g.fillRect(34, 50, 22, 38);
      g.fillStyle = '#e8e2d4'; g.fillRect(30, 6, 4, 84); g.fillRect(6, 46, 52, 4);
    } else if (kind === 'industrial') {
      g.fillStyle = '#3a3f44'; g.fillRect(0, 0, 64, 96);
      for (let y = 4; y < 92; y += 10) { g.fillStyle = '#566069'; g.fillRect(4, y, 56, 6); g.fillStyle = '#1e2226'; g.fillRect(4, y + 6, 56, 2); }
    } else if (kind === 'wood') {
      g.fillStyle = '#3d2a18'; g.fillRect(0, 0, 64, 96);
      g.fillStyle = '#d8e2ea'; g.fillRect(8, 8, 48, 60);
      g.fillStyle = '#26394a'; g.fillRect(10, 10, 21, 27); g.fillRect(33, 10, 21, 27); g.fillRect(10, 39, 21, 27); g.fillRect(33, 39, 21, 27);
      g.fillStyle = '#f4f7fa'; g.fillRect(4, 70, 56, 10);
    } else if (kind === 'lit') {
      g.fillStyle = '#16181c'; g.fillRect(0, 0, 64, 96);
      const on = Math.random() < 0.7;
      const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, on ? '#ffd88a' : '#2a3448'); gr.addColorStop(1, on ? '#e8964a' : '#1a2030');
      g.fillStyle = gr; g.fillRect(6, 6, 52, 84);
      g.fillStyle = '#16181c'; g.fillRect(30, 6, 4, 84); g.fillRect(6, 46, 52, 4);
      if (on) { g.fillStyle = 'rgba(40,30,20,0.5)'; g.fillRect(8, 50, 20, 38); }
    } else if (kind === 'arch') {
      g.fillStyle = '#c8a874'; g.fillRect(0, 0, 64, 96);
      g.fillStyle = '#20180f'; g.beginPath(); g.moveTo(10, 92); g.lineTo(10, 36); g.arc(32, 36, 22, Math.PI, 0); g.lineTo(54, 92); g.fill();
    } else {
      g.fillStyle = '#4a2f1a'; g.fillRect(0, 0, 64, 96);
      g.fillStyle = '#6b4526'; for (let y = 6; y < 90; y += 8) g.fillRect(6, y, 24, 5), g.fillRect(34, y, 24, 5);
      g.fillStyle = '#2a1a0e'; g.fillRect(31, 0, 2, 96);
    }
    return new THREE.CanvasTexture(cv);
  }
  M.dispose = (scene) => {
    if (!M.mesh) return;
    scene.remove(M.mesh);
    M.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    M.mesh = null;
    if (M.weather) { scene.remove(M.weather.pts); M.weather.pts.geometry.dispose(); M.weather = null; }
  };
  M.build = (scene, quality) => {
    const B = {};
    const tm = theme.mats;
    const texOf = sem => tm[sem] || sem;
    function geo(m) { return B[m] || (B[m] = { p: [], n: [], u: [], c: [] }); }
    function quad(m, v, nrm, uv, col) {
      const g = geo(m);
      for (const q of [0, 1, 2, 0, 2, 3]) { g.p.push(v[q][0], v[q][1], v[q][2]); g.n.push(nrm[0], nrm[1], nrm[2]); g.u.push(uv[q][0], uv[q][1]); g.c.push(col[q][0], col[q][1], col[q][2]); }
    }
    const tv = theme.tintVar;
    function tint(i, j, wall) {
      if (!wall) return [1, 1, 1];
      const h = G.U.hash2((i / 3) | 0, (j / 2) | 0), h2 = G.U.hash2(j * 7 + 1, i * 3 + 5);
      const b = 1 - tv * 0.7 + h * tv;
      return [b * (1 + (h2 - 0.5) * 0.06), b, b * (1 - (h2 - 0.5) * 0.08)];
    }
    function sh(t, f) { return [t[0] * f, t[1] * f, t[2] * f]; }
    const roofed = k => k >= 0 && cb[k] < 900 && !isWall[k];
    // face lateral com alturas por ponta: (a0: lo0..hi0), (a1: lo1..hi1)
    function side(axis, m, pos, a0, a1, lo0, hi0, lo1, hi1, dir, t, dark) {
      if (hi0 - lo0 < 0.001 && hi1 - lo1 < 0.001) return;
      const s = SCALE[m] || 4;
      const f = dark ? 0.5 : 1;
      const cTop = sh(t, f), cB0 = sh(t, f * (lo0 <= 0.01 && lo0 > -0.01 ? 0.72 : 0.85)), cB1 = sh(t, f * (lo1 <= 0.01 && lo1 > -0.01 ? 0.72 : 0.85));
      let v, cols;
      if (axis === 'x') { v = dir > 0 ? [[pos, lo1, a1], [pos, lo0, a0], [pos, hi0, a0], [pos, hi1, a1]] : [[pos, lo0, a0], [pos, lo1, a1], [pos, hi1, a1], [pos, hi0, a0]]; cols = dir > 0 ? [cB1, cB0, cTop, cTop] : [cB0, cB1, cTop, cTop]; }
      else { v = dir > 0 ? [[a0, lo0, pos], [a1, lo1, pos], [a1, hi1, pos], [a0, hi0, pos]] : [[a1, lo1, pos], [a0, lo0, pos], [a0, hi0, pos], [a1, hi1, pos]]; cols = dir > 0 ? [cB0, cB1, cTop, cTop] : [cB1, cB0, cTop, cTop]; }
      const uv = v.map(p => [(axis === 'x' ? p[2] : p[0]) / s, p[1] / s]);
      quad(m, v, axis === 'x' ? [dir, 0, 0] : [0, 0, dir], uv, cols);
    }
    // topo com 4 alturas (h00,h10,h01,h11)
    function top(m, x0, z0, x1, z1, hs, t, ny) {
      const s = SCALE[m] || 4;
      const [a, b, cc, d] = hs;
      const v = ny > 0 ? [[x0, cc, z1], [x1, d, z1], [x1, b, z0], [x0, a, z0]] : [[x0, a, z0], [x1, b, z0], [x1, d, z1], [x0, cc, z1]];
      let n = [0, ny, 0];
      if (ny > 0 && (a !== b || a !== cc || a !== d)) {
        const dx = ((b - a) + (d - cc)) / 2 / S, dz = ((cc - a) + (d - b)) / 2 / S;
        const L = Math.hypot(dx, 1, dz); n = [-dx / L, 1 / L, -dz / L];
      }
      quad(m, v, n, v.map(p => [p[0] / s, p[2] / s]), [t, t, t, t]);
    }
    const ec = k => { const o = k * 4; return [corn[o], corn[o + 1], corn[o + 2], corn[o + 3]]; };
    const win = [], waterQuads = [];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i, x0 = i * S, x1 = x0 + S, z0 = j * S, z1 = z0 + S;
      const wall = !!isWall[k];
      const t = tint(i, j, wall);
      const ch = grid[k];
      const hs = ec(k);
      const TT = TYPES[ch] || TYPES['.'];
      const winCell = !!TT.window;
      const fm = wall ? texOf('roof') : texOf(TT.mat);
      top(fm, x0, z0, x1, z1, hs, roofed(k) ? sh(t, 0.5) : t, 1);
      if (water[k]) waterQuads.push([x0, z0, x1, z1, floor[k] + (TT.wy !== undefined ? TT.wy : 0.55)]);
      // bordas: [vizinho, eixo, direção, posição, índices dos meus cantos na borda, índices do vizinho]
      const nb = [[i + 1, j, 'x', 1, x1, [1, 3], [0, 2]], [i - 1, j, 'x', -1, x0, [0, 2], [1, 3]], [i, j + 1, 'z', 1, z1, [2, 3], [0, 1]], [i, j - 1, 'z', -1, z0, [0, 1], [2, 3]]];
      for (const [ni, nj, ax, dir, pos, mine, theirs] of nb) {
        if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
        const nk = nj * W + ni, nh = ec(nk);
        const a0 = ax === 'x' ? z0 : x0, a1 = ax === 'x' ? z1 : x1;
        const myH0 = hs[mine[0]], myH1 = hs[mine[1]], nH0 = nh[theirs[0]], nH1 = nh[theirs[1]];
        if (myH0 > nH0 + 0.001 || myH1 > nH1 + 0.001) {
          const sm = wall || winCell ? texOf('wall') : texOf('raise');
          const lo0 = Math.min(nH0, myH0), lo1 = Math.min(nH1, myH1);
          const dark = roofed(nk);
          if (dark && wall && Math.max(myH0, myH1) > cb[nk] + 0.01) {
            const cbn = cb[nk];
            side(ax, sm, pos, a0, a1, lo0, Math.min(myH0, cbn), lo1, Math.min(myH1, cbn), dir, t, true);
            side(ax, sm, pos, a0, a1, Math.max(lo0, cbn), myH0, Math.max(lo1, cbn), myH1, dir, t, false);
          } else side(ax, sm, pos, a0, a1, lo0, myH0, lo1, myH1, dir, t, dark);
          const nf = Math.min(nH0, nH1), f = Math.min(myH0, myH1);
          if (wall && theme.window !== 'none' && f - nf > 4.8 && !roofed(nk) && G.U.hash2(i * 3 + dir, j * 5 + (ax === 'x' ? 1 : 2)) < theme.winChance) win.push({ ax, pos, dir, a: a0, y: nf + 2.6 });
        }
        // laterais das lajes de teto
        if (cb[k] < 900 && !wall) {
          const nHas = cb[nk] < 900 && !isWall[nk];
          const nTop = Math.max(nH0, nH1);
          if (!nHas) {
            const lo = Math.max(cb[k], nTop), hi = ct[k];
            if (hi > lo && !(isWall[nk] && nTop >= hi)) side(ax, texOf('wall'), pos, a0, a1, lo, hi, lo, hi, dir, t, false);
          } else {
            if (ct[nk] < ct[k] - 0.01) { const lo = Math.max(ct[nk], cb[k]); side(ax, texOf('wall'), pos, a0, a1, lo, ct[k], lo, ct[k], dir, t, false); }
            if (cb[nk] > cb[k] + 0.01) { const hi = Math.min(cb[nk], ct[k]); side(ax, texOf('wall'), pos, a0, a1, cb[k], hi, cb[k], hi, dir, t, true); }
          }
        }
      }
      if (cb[k] < 900 && !wall) {
        top(winCell ? texOf('wall') : texOf('slab'), x0, z0, x1, z1, [cb[k], cb[k], cb[k], cb[k]], sh(t, winCell ? 0.8 : 0.55), -1);
        top(texOf('roof'), x0, z0, x1, z1, [ct[k], ct[k], ct[k], ct[k]], t, 1);
      }
    }
    const group = new THREE.Group();
    const hiQ = quality > 0;
    for (const m in B) {
      const g = B[m], bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3));
      bg.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
      bg.setAttribute('uv', new THREE.Float32BufferAttribute(g.u, 2));
      bg.setAttribute('color', new THREE.Float32BufferAttribute(g.c, 3));
      const tex = G.Tex.get(m, hiQ ? 512 : 256);
      const mat = hiQ
        ? new THREE.MeshPhongMaterial({ map: tex, bumpMap: G.Tex.bump(m, 512), bumpScale: G.Tex.bumpScale(m), vertexColors: true, shininess: G.Tex.shine(m), specular: 0x161616 })
        : new THREE.MeshLambertMaterial({ map: tex, vertexColors: true });
      const mesh = new THREE.Mesh(bg, mat);
      mesh.receiveShadow = true; mesh.castShadow = hiQ;
      group.add(mesh);
    }
    // água
    if (waterQuads.length) {
      const p = [];
      for (const [a, b, cc, d, y] of waterQuads) p.push(a, y, d, cc, y, d, cc, y, b, a, y, d, cc, y, b, a, y, b);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); bg.computeVertexNormals();
      const wm = new THREE.MeshPhongMaterial({ color: theme.water, transparent: true, opacity: theme.waterOpacity || 0.62, shininess: 120, specular: 0xbfdfff, emissive: theme.waterGlow || 0, depthWrite: false });
      const wmesh = new THREE.Mesh(bg, wm); wmesh.renderOrder = 2; group.add(wmesh);
      M.waterMat = wm;
    } else M.waterMat = null;
    // janelas
    if (win.length) {
      const wg = { p: [], n: [], u: [] };
      for (const w of win) {
        const off = w.dir * 0.03, a = w.a + 0.9, b = w.a + 2.1, y0 = w.y, y1 = w.y + 1.6;
        let v;
        if (w.ax === 'x') v = w.dir > 0 ? [[w.pos + off, y0, b], [w.pos + off, y0, a], [w.pos + off, y1, a], [w.pos + off, y1, b]] : [[w.pos + off, y0, a], [w.pos + off, y0, b], [w.pos + off, y1, b], [w.pos + off, y1, a]];
        else v = w.dir > 0 ? [[a, y0, w.pos + off], [b, y0, w.pos + off], [b, y1, w.pos + off], [a, y1, w.pos + off]] : [[b, y0, w.pos + off], [a, y0, w.pos + off], [a, y1, w.pos + off], [b, y1, w.pos + off]];
        const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
        const n = w.ax === 'x' ? [w.dir, 0, 0] : [0, 0, w.dir];
        for (const q of [0, 1, 2, 0, 2, 3]) { wg.p.push(...v[q]); wg.n.push(...n); wg.u.push(...uvs[q]); }
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(wg.p, 3));
      bg.setAttribute('normal', new THREE.Float32BufferAttribute(wg.n, 3));
      bg.setAttribute('uv', new THREE.Float32BufferAttribute(wg.u, 2));
      group.add(new THREE.Mesh(bg, theme.window === 'lit' ? new THREE.MeshBasicMaterial({ map: windowTexture('lit') }) : new THREE.MeshLambertMaterial({ map: windowTexture(theme.window) })));
    }
    // objetos
    const matCache = {};
    const pmat = (p) => {
      const key = p.type + ':' + (p.color || '') + ':' + (p.tex || '') + ':' + (p.kind || '');
      if (matCache[key]) return matCache[key];
      let m;
      if (p.type === 'crate') m = new THREE.MeshLambertMaterial({ map: G.Tex.get('wood') });
      else if (p.type === 'barrel') m = new THREE.MeshLambertMaterial({ map: G.Tex.get('metal'), color: p.color || 0x9a5a3a });
      else if (p.type === 'car') m = new THREE.MeshLambertMaterial({ map: G.Tex.get('car'), color: p.color || 0xffffff });
      else if (p.type === 'container') m = new THREE.MeshLambertMaterial({ map: G.Tex.get('container'), color: p.color || 0xb04030 });
      else if (p.type === 'block') m = new THREE.MeshLambertMaterial({ map: G.Tex.get(p.tex || 'concrete'), color: p.color || 0xffffff });
      else if (p.type === 'door') m = p.kind === 'gate' ? new THREE.MeshLambertMaterial({ map: G.Tex.get('corrugated'), color: p.color || theme.gate })
        : new THREE.MeshLambertMaterial({ map: G.Tex.get(p.kind === 'metal' ? 'doorMetal' : 'doorWood'), color: p.color || 0xffffff });
      else m = new THREE.MeshLambertMaterial({ map: G.Tex.get('concrete'), color: p.color || 0xc8b48a });
      return (matCache[key] = m);
    };
    const glass = new THREE.MeshLambertMaterial({ color: 0x223038 });
    const tire = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    for (const p of props) {
      if (p.type === 'hidden') continue;
      if (p.type === 'window') {
        const wsx = p.x2 - p.x1, wsy = p.y2 - p.y1, wsz = p.z2 - p.z1;
        const gm = new THREE.Group(); gm.position.set((p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2, (p.z1 + p.z2) / 2); gm.userData.y0 = gm.position.y;
        const glassM = new THREE.MeshPhongMaterial({ color: 0x9ac4d8, transparent: true, opacity: 0.3, shininess: 140, specular: 0xffffff, depthWrite: false });
        const gl = new THREE.Mesh(new THREE.BoxGeometry(wsx * 0.9, wsy, wsz * 0.9 > 0.05 ? wsz * 0.9 : wsz), glassM); gl.renderOrder = 3; gm.add(gl);
        const fr = new THREE.MeshLambertMaterial({ color: 0xe8e4dc });
        const ax = p.axisX, L = ax ? wsz : wsx;
        for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(ax ? 0.08 : 0.05, wsy, ax ? 0.05 : 0.08), fr); b.position.set(ax ? 0 : s * L / 2, 0, ax ? s * L / 2 : 0); gm.add(b); }
        for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(ax ? 0.08 : L, 0.05, ax ? L : 0.08), fr); b.position.set(0, s * wsy / 2, 0); gm.add(b); }
        { const b = new THREE.Mesh(new THREE.BoxGeometry(ax ? 0.07 : 0.04, wsy, ax ? 0.04 : 0.07), fr); gm.add(b); }
        group.add(gm); p.vis = gm; continue;
      }
      if (p.type === 'furn') { const fm = G.Furn ? G.Furn.make(p.kind, p.opt) : new THREE.Group(); fm.position.set((p.x1 + p.x2) / 2, p.y1, (p.z1 + p.z2) / 2); fm.rotation.y = p.rot || 0; group.add(fm); continue; }
      const sx = p.x2 - p.x1, sy = p.y2 - p.y1, sz = p.z2 - p.z1;
      if (p.type === 'door') { buildDoor(group, p, pmat(p), sx, sy, sz); continue; }
      let mesh;
      if (p.type === 'barrel') mesh = new THREE.Mesh(new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 14), pmat(p));
      else if (p.type === 'car' && sy < 0.8) mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), glass);
      else mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), pmat(p));
      mesh.position.set((p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2, (p.z1 + p.z2) / 2);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
      if (p.type === 'car' && sy > 0.8) {
        const along = sx > sz;
        for (const a of [-1, 1]) for (const b of [-1, 1]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12), tire);
          w.rotation.set(along ? Math.PI / 2 : 0, 0, along ? 0 : Math.PI / 2);
          w.position.set(mesh.position.x + (along ? a * (sx / 2 - 0.8) : b * sx / 2), p.y1 + 0.3, mesh.position.z + (along ? b * sz / 2 : a * (sz / 2 - 0.8)));
          group.add(w);
        }
      }
      if (p.type === 'container') {
        const along = sx > sz, dk = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        for (const s of [-1, 1]) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(along ? 0.04 : sx * 0.9, sy * 0.9, along ? sz * 0.9 : 0.04), dk);
          bar.position.set(mesh.position.x + (along ? s * sx / 2 : 0), mesh.position.y, mesh.position.z + (along ? 0 : s * sz / 2));
          group.add(bar);
        }
      }
    }
    function buildDoor(group, p, mat, sx, sy, sz) {
      const along = sx > sz, w = along ? sx : sz, th = 0.12;
      const cx2 = (p.x1 + p.x2) / 2, cz2 = (p.z1 + p.z2) / 2;
      if (p.gate) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(along ? w : th, sy, along ? th : w), mat);
        panel.position.set(cx2, p.y1 + sy / 2, cz2); panel.castShadow = true;
        group.add(panel);
        // trilhos
        const rm = new THREE.MeshLambertMaterial({ color: 0x2a2c2e });
        for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(along ? 0.12 : 0.2, sy + 0.4, along ? 0.2 : 0.12), rm); r.position.set(cx2 + (along ? s * w / 2 : 0), p.y1 + sy / 2 + 0.2, cz2 + (along ? 0 : s * w / 2)); group.add(r); }
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(along ? w : th + 0.01, 0.18, along ? th + 0.01 : w), new THREE.MeshLambertMaterial({ map: G.Tex.get('hazard', 128) }));
        stripe.position.set(0, -sy / 2 + 0.12, 0); panel.add(stripe);
        p.vis = { panel, y0: p.y1 + sy / 2 };
        return;
      }
      const n = w > 1.8 ? 2 : 1, lw = w / n;
      if (!p.chp) initDoorHP(p);
      const cpl = p.gc / n, cw = lw / cpl, chh = (sy - 0.04) / p.gr, chunks = [];
      const leaves = [];
      const handle = new THREE.MeshLambertMaterial({ color: 0xc8b070 });
      for (let q = 0; q < n; q++) {
        const sgn = q === 0 ? 1 : -1;      // folha 0 presa na ponta "menor", folha 1 na "maior"
        const hx = along ? (q === 0 ? p.x1 : p.x2) : cx2, hz = along ? cz2 : (q === 0 ? p.z1 : p.z2);
        const piv = new THREE.Group(); piv.position.set(hx, p.y1, hz); group.add(piv);
        // folha em pedaços (cada um mostra o seu pedaço da textura)
        for (let kc = 0; kc < cpl; kc++) for (let r = 0; r < p.gr; r++) {
          const gcol = q === 0 ? kc : p.gc - 1 - kc;
          const bg = new THREE.BoxGeometry(along ? cw - 0.012 : th, chh - 0.012, along ? th : cw - 0.012);
          const uv = bg.attributes.uv; for (let u = 0; u < uv.count; u++) uv.setXY(u, (gcol + uv.getX(u)) / p.gc, (r + uv.getY(u)) / p.gr);
          const cm = new THREE.Mesh(bg, mat);
          const al = sgn * (kc + 0.5) * cw;
          cm.position.set(along ? al : 0, 0.02 + (r + 0.5) * chh, along ? 0 : al); cm.castShadow = true;
          piv.add(cm); chunks[r * p.gc + gcol] = cm;
        }
        const hd = new THREE.Mesh(new THREE.BoxGeometry(along ? 0.05 : 0.22, 0.05, along ? 0.22 : 0.05), handle);
        hd.position.set(along ? sgn * (lw - 0.18) : 0, 1.05, along ? 0 : sgn * (lw - 0.18)); piv.add(hd);
        leaves.push({ piv, dir: along ? -sgn : sgn });
      }
      // batente superior
      const fr = new THREE.Mesh(new THREE.BoxGeometry(along ? w + 0.2 : 0.3, 0.2, along ? 0.3 : w + 0.2), new THREE.MeshLambertMaterial({ color: 0x3a2a1c }));
      fr.position.set(cx2, p.y1 + sy + 0.1, cz2); group.add(fr);
      p.vis = { leaves, chunks, mat };
    }
    // escadas de mão
    { const lm = new THREE.MeshLambertMaterial({ color: 0x8a8e92, map: G.Tex.get('metal', 128) }), ym = new THREE.MeshLambertMaterial({ color: 0xd8a72a });
      for (const l of M.ladders) {
        const H2 = l.y1 - l.y0 + 1.0, cx = l.x, cz = l.z, ax = l.dx !== 0;
        for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, H2, 0.05), lm); r.position.set(cx + (ax ? 0 : s * 0.24), l.y0 + H2 / 2, cz + (ax ? s * 0.24 : 0)); r.castShadow = true; group.add(r); }
        for (let y = l.y0 + 0.3; y < l.y1 + 0.95; y += 0.3) { const rg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6), y > l.y1 ? ym : lm); rg.rotation.set(ax ? Math.PI / 2 : 0, 0, ax ? 0 : Math.PI / 2); rg.position.set(cx, y, cz); group.add(rg); }
      } }
    // letras dos bombsites (no chão) + extras do mapa
    function letter(L, x, y, z, rotX, rotY, size) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map: G.Tex.siteLetter(L), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.position.set(x, y, z); m.rotation.set(rotX, rotY, 0); group.add(m);
    }
    for (const L of ['A', 'B']) { const s = M.spots[L]; letter(L, s.x, M.heightAt(s.x, s.z) + 0.03, s.z, -Math.PI / 2, 0, 3); }
    const cloth = new THREE.MeshLambertMaterial({ map: G.Tex.get('cloth', 128), side: THREE.DoubleSide });
    const deco = {
      c, S, letter,
      awning(x, z, w, d, rotY, y, color) {
        const mat = color ? new THREE.MeshLambertMaterial({ map: G.Tex.get('cloth', 128), side: THREE.DoubleSide, color }) : cloth;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
        m.position.set(x, y, z); m.rotation.set(-Math.PI / 2 + 0.35, rotY, 0, 'YXZ'); group.add(m);
      },
      lamp(x, z, h, color) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, h, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
        pole.position.set(x, M.groundAt(x, z) + h / 2, z); group.add(pole);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: color || 0xffe2a0 }));
        bulb.position.set(x, M.groundAt(x, z) + h, z); group.add(bulb);
      },
      glow(x, y, z, color, intensity, dist) { const l = new THREE.PointLight(color, intensity, dist); l.position.set(x, y, z); group.add(l); return l; },
      furn(kind, x, y, z, rotY, o) { const m = G.Furn.make(kind, o); m.position.set(x, y, z); m.rotation.y = rotY || 0; group.add(m); return m; },
      coolingTower(x, z, s) { const m = G.Furn.coolingTower(x, z, s || 1); group.add(m); return m; },
      containment(x, z, s) { const m = G.Furn.containment(x, z, s || 1); group.add(m); return m; },
      fan(x, y, z, rotY, r) { const m = G.Furn.fan(x, y, z, rotY, r || 0.6); group.add(m); return m; },
      sign(text, bg, fg, icon, x, y, z, rotY, w, h) { const m = G.Furn.sign(text, bg, fg, icon, w || 2, h || 1); m.position.set(x, y, z); m.rotation.y = rotY || 0; group.add(m); return m; },
      tree(x, z, s, snow, palm) {
        const y = M.groundAt(x, z);
        if (palm) {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.26 * s, 6 * s, 8), new THREE.MeshLambertMaterial({ color: 0x7a5a38 }));
          trunk.position.set(x, y + 3 * s, z); trunk.rotation.z = 0.08; trunk.castShadow = true; group.add(trunk);
          const lm = new THREE.MeshLambertMaterial({ color: 0x3e6a2a, side: THREE.DoubleSide });
          for (let q = 0; q < 7; q++) { const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * s, 3.2 * s), lm); lf.position.set(x, y + 6 * s, z); lf.rotation.set(-1.0, q / 7 * Math.PI * 2, 0, 'YXZ'); lf.translateY(1.4 * s); lf.castShadow = true; group.add(lf); }
          return;
        }
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.22 * s, 1.6 * s, 8), new THREE.MeshLambertMaterial({ color: 0x4a3322 }));
        trunk.position.set(x, y + 0.8 * s, z); trunk.castShadow = true; group.add(trunk);
        for (let q = 0; q < 3; q++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry((1.5 - q * 0.35) * s, 1.8 * s, 9), new THREE.MeshLambertMaterial({ color: snow && q === 2 ? 0xe8eef2 : 0x2e4a32 }));
          cone.position.set(x, y + (1.6 + q * 1.0) * s, z); cone.castShadow = true; group.add(cone);
        }
      },
      pipe(x1, z1, x2, z2, y, r, color) {
        const L = Math.hypot(x2 - x1, z2 - z1);
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), new THREE.MeshLambertMaterial({ color: color || 0x7a7f84 }));
        m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); m.rotation.set(Math.PI / 2, Math.atan2(x2 - x1, z2 - z1), 0, 'YXZ');
        group.add(m);
      },
      box(w, h, d, x, y, z, color, tex) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: color || 0xffffff, map: tex ? G.Tex.get(tex) : null }));
        m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; group.add(m); return m;
      },
      neon(text, x, y, z, rotY, color, w, h) {
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const g = cv.getContext('2d');
        g.font = '900 78px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.shadowColor = color; g.shadowBlur = 26; g.strokeStyle = color; g.lineWidth = 6; g.strokeText(text, 256, 66);
        g.shadowBlur = 10; g.fillStyle = '#ffffff'; g.fillText(text, 256, 66);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 4, h || 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.rotation.y = rotY || 0; group.add(m);
        const glow = new THREE.PointLight(new THREE.Color(color), 0.9, 9); glow.position.set(x, y, z); group.add(glow);
        return m;
      },
      banner(x, y, z, rotY, color, w, h) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 1.2, h || 3), new THREE.MeshLambertMaterial({ color: color || 0x9a1a1a, map: G.Tex.get('cloth', 128), side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = rotY || 0; group.add(m); return m; },
      cyl(r, h, x, y, z, color, tex, rt) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rt === undefined ? r : rt, r, h, 24), new THREE.MeshLambertMaterial({ color: color || 0xffffff, map: tex ? G.Tex.get(tex) : null }));
        m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; group.add(m); return m;
      },
      group
    };
    if (def.decor) def.decor(deco);
    if (G.Detail) { try { G.Detail.build(group, M, quality); } catch (e) { console.error('detalhes', e); } }
    scene.add(group);
    M.mesh = group;
    if (theme.weather) {
      const n = theme.weather === 'snow' ? 2600 : 3200;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 70; pos[i * 3 + 1] = Math.random() * 30; pos[i * 3 + 2] = (Math.random() - 0.5) * 70; }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = theme.weather === 'snow'
        ? new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.9, depthWrite: false })
        : new THREE.PointsMaterial({ color: 0xaab8c8, size: 0.06, transparent: true, opacity: 0.6, depthWrite: false });
      const pts = new THREE.Points(gg, mat); pts.frustumCulled = false;
      scene.add(pts);
      M.weather = { pts, kind: theme.weather, n };
    }
  };
  M.updateWeather = (dt, cam) => {
    if (M.waterMat) M.waterMat.opacity = 0.58 + Math.sin(performance.now() / 900) * 0.04;
    if (G.Furn) G.Furn.update(dt);
    const w = M.weather; if (!w) return;
    const a = w.pts.geometry.attributes.position, arr = a.array;
    const fall = w.kind === 'snow' ? 1.6 : 16, drift = w.kind === 'snow' ? 0.6 : 0.2;
    const t = performance.now() / 1000;
    for (let i = 0; i < w.n; i++) {
      let y = arr[i * 3 + 1] - fall * dt;
      if (y < 0) y += 30;
      arr[i * 3 + 1] = y;
      if (w.kind === 'snow') arr[i * 3] += Math.sin(t + i) * drift * dt;
    }
    a.needsUpdate = true;
    w.pts.position.set(Math.round(cam.position.x / 10) * 10, cam.position.y - 12, Math.round(cam.position.z / 10) * 10);
  };

  // ---------------- Radar e miniaturas ----------------
  M.radarImage = (px) => {
    const cv = document.createElement('canvas'); cv.width = W * px; cv.height = H * px;
    const g = cv.getContext('2d');
    const R = theme.radar;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i;
      if (isWall[k]) continue;
      const f = Math.max(-3, Math.min(3, floor[k])), z = zone[k];
      let col = `rgb(${Math.round(R.ground[0] + f * 22)},${Math.round(R.ground[1] + f * 20)},${Math.round(R.ground[2] + f * 15)})`;
      if (z === 'A' || z === 'B') col = `rgb(${R.site.join(',')})`;
      if (cb[k] < 900) col = `rgb(${R.roof.join(',')})`;
      if (water[k]) col = 'rgb(70,110,130)';
      g.fillStyle = col; g.fillRect(i * px, j * px, px + 0.5, px + 0.5);
    }
    g.fillStyle = 'rgba(30,25,20,0.85)';
    for (const p of props) if (p.type !== 'door' && p.type !== 'hidden') g.fillRect(p.x1 / S * px, p.z1 / S * px, (p.x2 - p.x1) / S * px, (p.z2 - p.z1) / S * px);
    g.fillStyle = 'rgba(200,150,80,0.95)';
    for (const p of M.doors) g.fillRect(p.x1 / S * px - 1, p.z1 / S * px - 1, (p.x2 - p.x1) / S * px + 2, (p.z2 - p.z1) / S * px + 2);
    g.font = `bold ${px * 3}px Arial`; g.fillStyle = 'rgba(255,60,40,0.9)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('A', M.spots.A.x / S * px, M.spots.A.z / S * px); g.fillText('B', M.spots.B.x / S * px, M.spots.B.z / S * px);
    return cv;
  };
})();
