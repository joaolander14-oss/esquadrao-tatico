// Lineups de utilitários (granadas): posição onde ficar + ponto para mirar, calculados para QUALQUER mapa a partir dos pontos de jogo
// (rotas, defesas, bombsites) e conferidos com a mesma física da granada do jogo. Também move o jogador (cheat offline) e roda o
// modo "Treino de utilitários" (1v0: só você, granadas infinitas, a rodada nunca acaba).
(function () {
  const L = G.Lineups = { lists: {}, sel: null, team: 'T', util: 'all', site: 'all', range: 'all', tech: 'all', showMarkers: true, showAll: true, showTags: true, showAllPaths: true, showPath: true, autoAim: false, open: false, busy: false, progress: 0, mapId: null };
  const U = G.U, $ = id => document.getElementById(id);
  const Gm = () => G.Game, Mp = () => G.Map;
  const D2R = U.D2R, GRAV = 20.3 * 0.4 * 2, EYE = 1.64;
  const UTIL = { smoke: ['Fumaça', 0xc8ccd0], flash: ['Flash', 0xffe86a], he: ['HE', 0xff5a3a], fire: ['Fogo', 0xff9a30] };
  const TECH = { parado: 'Parado', pulo: 'Jump throw', corrida: 'W throw', corridapulo: 'W + jump throw' };
  const HOWTO = { parado: 'Fique no círculo, mire na marca e lance', pulo: 'Jump throw: segure o clique esquerdo, aperte Espaço e solte o clique no mesmo instante', corrida: 'W throw: segure W, corra em linha reta e lance (clique esquerdo) ao passar pelo círculo', corridapulo: 'W + jump throw: corra com W; ao passar pelo círculo aperte Espaço e solte o clique esquerdo no mesmo instante' };
  const VY = 6.8;      // velocidade vertical ao soltar logo depois do pulo (JUMP_V = 7,1)
  const fireId = team => team === 'CT' ? 'incend' : 'molotov';
  const utilName = (u, team) => u === 'fire' ? (team === 'CT' ? 'Incendiária' : 'Coquetel') : UTIL[u][0];
  const STRENGTH = [[1, 'clique esquerdo (força total)'], [0.7, 'esquerdo + direito juntos (força média)'], [0.42, 'clique direito (arremesso curto)']];
  const ROLE = { defensores: ['segurar os defensores do', ['smoke', 'flash', 'he', 'fire']], centro: ['centro do', ['smoke', 'flash']], plantio: ['plantio do', ['smoke', 'he', 'fire']], entrada: ['entrada do', ['smoke', 'flash', 'he', 'fire']], cachoeira: ['cachoeira sobre a borda do', ['smoke']], meio: ['controle do meio', ['smoke', 'flash', 'he', 'fire']], atacantes: ['caminho dos atacantes ao', ['smoke', 'flash', 'he', 'fire']], bomba: ['bomba plantada no', ['smoke', 'he', 'fire']] };

  // ---------------- física da granada (igual à de combat.js: stepNade) ----------------
  function simulate(eye, yaw, aimPitch, strength, record, v0, vy0) {
    const M = Mp(), pitch = aimPitch + 6 * D2R, dir = U.dirFrom(yaw, pitch, new THREE.Vector3());
    const pos = eye.clone().addScaledVector(dir, 0.4); if (M.pointSolid(pos.x, pos.y, pos.z)) pos.copy(eye);
    const vel = dir.clone().multiplyScalar(19 * strength), broken = new Set(), wins = (M.windows || []).filter(w => !w.off);
    if (vy0) vel.y += vy0;
    if (v0) { vel.x += -Math.sin(yaw) * v0; vel.z += -Math.cos(yaw) * v0; }       // lançar correndo: soma a velocidade do jogador
    const near = M.props.filter(p => !p.off && Math.hypot((p.x1 + p.x2) / 2 - eye.x, (p.z1 + p.z2) / 2 - eye.z) < 60);
    const solid = (x, y, z) => {
      const k = M.cellIndex(x, z); if (k < 0) return true;
      if (y < M.heightAt(x, z) || (y > M.cb[k] && y < M.ct[k])) return true;
      for (const p of near) if (!broken.has(p) && x > p.x1 && x < p.x2 && z > p.z1 && z < p.z2 && y > p.y1 && y < p.y2) return true;
      return false;
    };
    const dt = 0.02, sub = 4, h = dt / sub; let t = 0, tg = -1; const out = { path: record ? [pos.clone()] : null };
    let groundPos = null;
    while (t < 3.4) {
      t += dt;
      for (let s = 0; s < sub; s++) {
        vel.y -= GRAV * h;
        const nx = pos.x + vel.x * h, ny = pos.y + vel.y * h, nz = pos.z + vel.z * h;
        let hitW = false;
        for (const w of wins) if (!broken.has(w) && nx > w.x1 - 0.05 && nx < w.x2 + 0.05 && ny > w.y1 && ny < w.y2 && nz > w.z1 - 0.05 && nz < w.z2 + 0.05) { broken.add(w); vel.multiplyScalar(0.7); hitW = true; }
        if (!solid(nx, ny, nz)) { pos.set(nx, ny, nz); continue; }
        if (solid(nx, pos.y, pos.z)) vel.x *= -0.45;
        if (solid(pos.x, pos.y, nz)) vel.z *= -0.45;
        if (solid(pos.x, ny, pos.z)) { if (vel.y < 0 && !groundPos) { groundPos = pos.clone(); tg = t; } vel.y *= -0.4; vel.x *= 0.75; vel.z *= 0.75; }
        if (!solid(nx, pos.y, pos.z) && !solid(pos.x, ny, pos.z) && !solid(pos.x, pos.y, nz)) vel.multiplyScalar(-0.4);
      }
      if (record) out.path.push(pos.clone());
      if (t >= 1.6 && !out.he) out.he = pos.clone();
      if (!out.fire && (groundPos && tg <= 2.0 || t >= 2.0)) out.fire = (groundPos && tg <= 2.0 ? groundPos : pos).clone();
      if (!out.smoke) { const sp = vel.length(); if ((t > 1.2 && sp < 0.4) || t > 3.2) out.smoke = pos.clone(); }
      if (out.he && out.fire && out.smoke) break;
    }
    out.flash = out.he; return out;
  }
  L.simulate = simulate;

  // ---------------- estandes e alvos a partir dos pontos de jogo do mapa ----------------
  const gy = p => p.y !== undefined ? p.y : Mp().groundAt(p.x, p.z);
  const pt = (p, extra) => Object.assign({ x: p.x, y: gy(p), z: p.z }, extra || {});
  function collect(team) {
    const M = Mp(), sp = M.spots, stands = [], targets = [], spawns = team === 'T' ? sp.tSpawn : sp.ctSpawn;
    const isBase = p => spawns.some(q => Math.hypot(q.x - p.x, q.z - p.z) < 14);
    const add = (arr, p, tag) => { if (!p) return; const q = pt(p, { tag }); q.base = isBase(q); if (!arr.some(o => Math.hypot(o.x - q.x, o.z - q.z) < 3.5 && Math.abs(o.y - q.y) < 1.5)) arr.push(q); };
    for (const X of ['A', 'B']) {
      for (const r of sp.routes[X] || []) r.forEach(p => add(stands, p, X));
      for (const key of ['hold', 'post']) (sp[key + X] || []).forEach(p => add(stands, p, X));
      if (team === 'T') {
        (sp['hold' + X] || []).forEach(p => targets.push(pt(p, { role: 'defensores', site: X })));
        targets.push(pt(sp[X], { role: 'centro', site: X }));
        (sp['plant' + X] || []).slice(0, 2).forEach(p => targets.push(pt(p, { role: 'plantio', site: X })));
        for (const r of sp.routes[X] || []) if (r.length) targets.push(pt(r[r.length - 1], { role: 'entrada', site: X }));
      } else {
        for (const r of sp.routes[X] || []) for (let i = Math.max(0, r.length - 4); i <= r.length - 2; i++) targets.push(pt(r[i], { role: 'atacantes', site: X }));
        (sp['plant' + X] || []).slice(0, 2).forEach(p => targets.push(pt(p, { role: 'bomba', site: X })));
        targets.push(pt(sp[X], { role: 'centro', site: X }));
      }
      // fumaça cachoeira: bordas altas perto do bombsite (a fumaça escorre para o nível de baixo)
      const W = M.W, H = M.H, c3 = [];
      for (let j = 2; j < H - 2; j++) for (let i = 2; i < W - 2; i++) {
        const k = j * W + i; if (M.isWall[k] || M.navBlocked[k] || M.cb[k] < 900 || M.water[k]) continue;
        let drop = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nk = (j + dj) * W + i + di; if (M.isWall[nk]) continue; drop = Math.max(drop, M.floor[k] - M.floor[nk]); }
        if (drop < 2.0) continue; const x = M.cx(i), z = M.cx(j), d = Math.hypot(x - sp[X].x, z - sp[X].z); if (d < 22) c3.push({ x, z, y: M.floor[k], d });
      }
      c3.sort((a, b) => a.d - b.d); const pickL = [];
      for (const q of c3) { if (pickL.length >= 3) break; if (pickL.every(o => Math.hypot(o.x - q.x, o.z - q.z) > 6)) pickL.push(q); }
      pickL.forEach(q => targets.push({ x: q.x, y: q.y, z: q.z, role: 'cachoeira', site: X }));
    }
    spawns.forEach(p => add(stands, p, 'A')); (sp.holdMid || []).forEach(p => add(stands, p, 'A')); (sp.lurk || []).forEach(p => add(stands, p, 'A'));
    // controle do meio (a partir da base e de qualquer lugar): meio do mapa e o começo/meio de cada rota
    (sp.holdMid || []).forEach(p => targets.push(pt(p, { role: 'meio', site: 'M' })));
    for (const X of ['A', 'B']) for (const r of sp.routes[X] || []) { if (r.length > 3) { targets.push(pt(r[1], { role: 'meio', site: 'M' })); targets.push(pt(r[Math.floor(r.length / 2)], { role: 'meio', site: 'M' })); } }
    // pontos perto dos spawns (arremessos "da base")
    const baseCells = [];
    for (const p of spawns) { let n = 0; for (let tries = 0; tries < 60 && n < 7; tries++) { const a = G.U.hash2(tries * 13 + 1, Math.floor(p.x) + 7) * 6.283, r = 2 + G.U.hash2(tries * 5 + 3, Math.floor(p.z) + 11) * 12, qx = p.x + Math.cos(a) * r, qz = p.z + Math.sin(a) * r, qk = M.cellIndex(qx, qz);
      if (qk < 0 || M.isWall[qk] || M.navBlocked[qk] || M.ramp[qk] || M.water[qk] || M.cb[qk] < 900 || Math.abs(M.floor[qk] - gy(p)) > 0.6) continue; n++; baseCells.push({ x: qx, y: M.floor[qk], z: qz, base: true }); } }
    baseCells.forEach(q => { if (!stands.some(o => Math.hypot(o.x - q.x, o.z - q.z) < 3)) stands.push(q); });
    const ts = []; for (const t of targets) if (!ts.some(o => o.role === t.role && o.site === t.site && Math.hypot(o.x - t.x, o.z - t.z) < 2.5 && Math.abs(o.y - t.y) < 1.5)) ts.push(t);
    // candidatos para lançar correndo: células livres e abertas a 24–44 m de cada alvo, mais as posições das bases
    const far = new Map();
    for (const T of ts) {
      const list = [];
      for (let j = 2; j < M.H - 2; j++) for (let i = 2; i < M.W - 2; i++) {
        const k = j * M.W + i; if (M.isWall[k] || M.navBlocked[k] || M.ramp[k] || M.water[k] || M.cb[k] < 900) continue;
        const x = M.cx(i), z = M.cx(j), d = Math.hypot(x - T.x, z - T.z); if (d < 24 || d > 52) continue;
        list.push({ x, y: M.floor[k], z, h: G.U.hash2(i * 7 + 3, j * 11 + 5) });
      }
      list.sort((a, b) => a.h - b.h); const pick = list.slice(0, 26);
      for (const p of spawns) {
        const d = Math.hypot(p.x - T.x, p.z - T.z); if (d >= 24 && d <= 52) pick.push(Object.assign(pt(p), {}));
        if (d > 44 && d <= 61) {       // largando a corrida direto da base: o ponto de soltar fica 9 m à frente do spawn
          const qx = p.x + (T.x - p.x) / d * 9, qz = p.z + (T.z - p.z) / d * 9, qk = M.cellIndex(qx, qz);
          if (qk >= 0 && !M.isWall[qk] && !M.navBlocked[qk] && M.cb[qk] > 900 && Math.abs(M.floor[qk] - gy(p)) < 0.6) pick.push({ x: qx, y: M.floor[qk], z: qz, runBase: true });
        }
      }
      baseCells.forEach(q => pick.push(q));
      pick.forEach(q => { q.base = q.runBase || q.base || isBase(q); });
      far.set(T, pick);
    }
    return { stands, targets: ts, far };
  }

  // ---------------- solucionador ----------------
  function solveStand(stand, targets, team) {
    const M = Mp(), eye = new THREE.Vector3(stand.x, stand.y + EYE, stand.z), res = [];
    if (M.pointSolid(eye.x, eye.y, eye.z) || M.pointSolid(stand.x, stand.y + 0.2, stand.z)) return res;
    for (const T of targets) {
      const dx = T.x - stand.x, dz = T.z - stand.z, d = Math.hypot(dx, dz);
      if (d < 4 || d > 27) continue;
      const yaw = U.yawTo(dx, dz), dy = (T.y + 0.2) - eye.y, best = {};
      for (const [s] of STRENGTH) {
        const v = 19 * s, k = GRAV * d * d / (2 * v * v), disc = d * d - 4 * k * (dy + k); if (disc < 0) continue;
        for (const sg of [-1, 1]) {
          const tn = (d + sg * Math.sqrt(disc)) / (2 * k), th = Math.atan(tn);
          for (const off of [-3, 0, 3]) {
            const aim = th - 6 * D2R + off * D2R; if (Math.abs(aim) > 1.4) continue;
            const r = simulate(eye, yaw, aim, s, false);
            for (const u of ROLE[T.role][1]) {
              const land = r[u]; if (!land) continue;
              const err = Math.hypot(land.x - T.x, land.z - T.z) + 0.4 * Math.abs(land.y - T.y);
              if (err > 2.4) continue;
              const key = u, sc = err + (s === 1 ? 0 : s === 0.7 ? 0.25 : 0.4) + (sg > 0 ? 0.3 : 0);     // prefere força total e o arco baixo
              if (!best[key] || sc < best[key].sc) best[key] = { sc, err, util: u, strength: s, yaw, pitch: aim, land: land.clone() };
            }
          }
        }
      }
      for (const u in best) res.push(Object.assign(best[u], { stand, target: T, mode: 'parado', v0: 0, vy0: 0, range: d > 20 ? 'longo' : 'curto', fromBase: !!stand.base }));
    }
    return res;
  }
  // lançamento correndo em linha reta (velocidade da corrida soma ao arremesso): alcance de 24 a 44 m
  const RANGE = { pulo: [12, 35], corrida: [22, 46], corridapulo: [30, 54] };
  function solveRun(stand, T, v0, vy0, mode) {
    const M = Mp(), eye = new THREE.Vector3(stand.x, stand.y + EYE, stand.z), res = [];
    if (M.pointSolid(eye.x, eye.y, eye.z) || M.pointSolid(stand.x, stand.y + 0.2, stand.z)) return res;
    const dx = T.x - stand.x, dz = T.z - stand.z, d = Math.hypot(dx, dz), [dmin, dmax] = RANGE[mode]; if (d < dmin || d > dmax) return res;
    const yaw = U.yawTo(dx, dz), dy = (T.y + 0.2) - eye.y, v = 19, best = {};
    const rng = th => { const vv = v * Math.sin(th) + vy0, vh = v * Math.cos(th) + v0, disc = vv * vv - 2 * GRAV * dy; if (disc < 0) return -1; return vh * (vv + Math.sqrt(disc)) / GRAV; };
    const roots = []; let fa = rng(-0.25) - d;
    for (let th = -0.2; th <= 1.3; th += 0.04) { const fb = rng(th) - d; if (fa > -1e8 && fa * fb < 0) { let lo = th - 0.04, hi = th; for (let q = 0; q < 14; q++) { const mid = (lo + hi) / 2; if ((rng(lo) - d) * (rng(mid) - d) <= 0) hi = mid; else lo = mid; } roots.push((lo + hi) / 2); } fa = fb; }
    for (const th of roots) for (const off of [-2, 0, 2]) {
      const aim = th - 6 * D2R + off * D2R; if (Math.abs(aim) > 1.4) continue;
      const r = simulate(eye, yaw, aim, 1, false, v0, vy0);
      for (const u of ROLE[T.role][1]) {
        const land = r[u]; if (!land) continue; const err = Math.hypot(land.x - T.x, land.z - T.z) + 0.4 * Math.abs(land.y - T.y); if (err > 2.4) continue;
        const sc = err + (mode === 'pulo' ? 0.5 : mode === 'corrida' ? 0.6 : 0.8) + (th > 0.8 ? 0.3 : 0); if (!best[u] || sc < best[u].sc) best[u] = { sc, err, util: u, strength: 1, yaw, pitch: aim, land: land.clone() };
      }
    }
    for (const u in best) res.push(Object.assign(best[u], { stand, target: T, mode, v0, vy0, range: 'longo', fromBase: !!stand.base, runStart: v0 > 0 ? { x: stand.x + Math.sin(yaw) * 9, y: stand.y, z: stand.z + Math.cos(yaw) * 9 } : null }));
    return res;
  }
  L.compute = async (team) => {
    const mid = Mp().current, key = mid + '|' + team;
    if (L.lists[key]) return L.lists[key];
    L.busy = true; L.progress = 0; render();
    const { stands, targets, far } = collect(team), all = [], v0 = G.PHYS.RUN * 0.98, tl = targets.length;
    const total = stands.length + tl;
    for (let i = 0; i < stands.length; i++) {
      all.push(...solveStand(stands[i], targets, team));
      for (const T of targets) all.push(...solveRun(stands[i], T, 0, VY, 'pulo'));
      L.progress = (i + 1) / total; if (L.open) renderProgress();
      await new Promise(r => setTimeout(r, 0));
    }
    let ti = 0;
    for (const T of targets) {
      for (const S of far.get(T) || []) all.push(...solveRun(S, T, v0, 0, 'corrida'), ...solveRun(S, T, v0, VY, 'corridapulo'));
      ti++; L.progress = (stands.length + ti) / total; if (L.open) renderProgress();
      await new Promise(r => setTimeout(r, 0));
    }
    // escolhe os melhores por (utilitário, papel, bombsite, alcance), com estandes diferentes
    const groups = {}; for (const c of all) { const k = c.util + '|' + c.target.role + '|' + c.target.site + '|' + c.range + (c.fromBase ? 'b' : '') + '|' + c.mode; (groups[k] = groups[k] || []).push(c); }
    const out = [];
    for (const k in groups) {
      groups[k].sort((a, b) => a.sc - b.sc); const pick = [];
      for (const c of groups[k]) { if (pick.length >= (c.fromBase ? 3 : 2)) break; if (pick.every(p => Math.hypot(p.stand.x - c.stand.x, p.stand.z - c.stand.z) > 6)) pick.push(c); }
      out.push(...pick);
    }
    out.sort((a, b) => (a.target.site > b.target.site) - (a.target.site < b.target.site) || a.util.localeCompare(b.util) || a.sc - b.sc);
    out.forEach((c, i) => {
      c.id = i; c.team = team;
      const base = c.target.role === 'cachoeira' ? 'Fumaça cachoeira · ' + ROLE.cachoeira[0] + ' ' + c.target.site : c.target.role === 'meio' ? utilName(c.util, team) + ' · ' + ROLE.meio[0] : utilName(c.util, team) + ' · ' + ROLE[c.target.role][0] + ' ' + c.target.site;
      c.name = (c.fromBase ? 'Da base · ' : '') + (c.mode !== 'parado' ? TECH[c.mode] + ' · ' : c.range === 'longo' ? 'Longo · ' : '') + base;
    });
    L.lists[key] = out.slice(0, 380); L.busy = false; L.progress = 1;
    if (L.sel && L.sel.team === team && Mp().current !== mid) L.sel = null;
    buildMarkers(); render();
    return L.lists[key];
  };
  const cur = () => (L.lists[(Mp() && Mp().current) + '|' + L.team] || []);
  const pool = () => L.showAll ? cur() : filtered();
  const filtered = () => cur().filter(c => (L.util === 'all' || (L.util === 'cach' ? c.target.role === 'cachoeira' : c.util === L.util)) && (L.site === 'all' || c.target.site === L.site) && (L.range === 'all' || (L.range === 'base' ? c.fromBase : c.range === L.range)) && (L.tech === 'all' || c.mode === L.tech));

  // ---------------- ações ----------------
  L.goto = (c) => {
    const h = Gm().human; if (!h) return;
    const q = c.v0 > 0 ? c.runStart : c.stand;           // lançamento correndo: começa 9 m antes do ponto de soltar
    h.pos.set(q.x, q.y + 0.02, q.z); h.vel.set(0, 0, 0); h.yaw = c.yaw; h.pitch = c.pitch; h.crouch = 0;
    L.sel = c; buildPath(); if (Gm().lock) setTimeout(() => Gm().lock(), 60);
    G.HUD.centerMsg(HOWTO[c.mode], 5);
  };
  L.throwNow = (c) => {
    const h = Gm().human; if (!h || !h.alive) return;
    L.goto(c); h.pos.set(c.stand.x, c.stand.y + 0.02, c.stand.z); const id = c.util === 'fire' ? fireId(c.team) : c.util; if (!h.inv.grenades.includes(id)) h.inv.grenades.push(id);
    if (c.v0 > 0) h.vel.set(-Math.sin(c.yaw) * c.v0, c.vy0 || 0, -Math.cos(c.yaw) * c.v0); else h.vel.set(0, c.vy0 || 0, 0);
    if (c.vy0) h.onGround = false;
    G.Combat.throwNade(h, id, c.strength, c.yaw, c.pitch);
  };
  L.select = (c) => { L.sel = c; buildPath(); render(); };
  L.next = (d) => { const f = filtered(); if (!f.length) return; let i = f.indexOf(L.sel); i = i < 0 ? 0 : (i + d + f.length) % f.length; L.sel = f[i]; buildPath(); render(); if (Gm().human) G.HUD.centerMsg(L.sel.name, 1.2); };
  L.clear = () => { G.Combat.clearRound(); if (G.Smoke && G.Smoke.clear) G.Smoke.clear(); };
  L.start = () => { L.team = Gm().settings.team; L.util = 'all'; L.site = 'all'; L.range = 'all'; L.tech = 'all'; L.showMarkers = true; L.sel = null; L.compute(L.team).then(() => { const f = filtered(); if (f.length && !L.sel) L.sel = f[0]; buildPath(); render(); G.HUD.centerMsg('TREINO DE UTILITÁRIOS · L abre os lineups · T vai até a posição · Y lança · U limpa', 5); }); G.HUD.centerMsg('Calculando os lineups deste mapa…', 3); };
  L.stop = () => { L.open = false; const p = $('luPanel'); if (p) p.classList.add('hidden'); clearMarkers(); hideAim(); L.sel = null; };
  L.utilStep = (dt) => {
    const h = Gm().human; if (!h || !h.alive) return;
    h.money = 16000; h.hp = 100; h.armor = 100;
    for (const id of ['he', 'flash', 'smoke', 'molotov', 'incend']) if (!h.inv.grenades.includes(id)) h.inv.grenades.push(id);
  };

  // ---------------- marcadores no mapa, trajetória e mira ----------------
  let group = null, pathObj = null, landObj = null, builtFor = null;
  function sceneOK() { return Gm().scene; }
  function clearMarkers() { if (group && group.parent) group.parent.remove(group); group = null; pathObj = null; landObj = null; builtFor = null; }
  function buildMarkers() {
    clearMarkers(); if (!sceneOK() || !L.showMarkers) return;
    group = new THREE.Group(); const seen = new Set();
    for (const c of pool()) {
      const k = c.stand.x.toFixed(1) + ',' + c.stand.z.toFixed(1); if (seen.has(k)) continue; seen.add(k);
      const col = UTIL[c.util][1];
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 24), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(c.stand.x, c.stand.y + 0.06, c.stand.z); ring.renderOrder = 8; group.add(ring);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45, depthWrite: false }));
      beam.position.set(c.stand.x, c.stand.y + 1.2, c.stand.z); group.add(beam);
    }
    for (const c of pool()) if (c.v0 > 0) {      // largada (azul) e linha de corrida até o ponto de soltar
      const q = c.runStart, rg = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 20), new THREE.MeshBasicMaterial({ color: 0x4aa8ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false }));
      rg.rotation.x = -Math.PI / 2; rg.position.set(q.x, q.y + 0.06, q.z); rg.renderOrder = 8; group.add(rg);
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(q.x, q.y + 0.08, q.z), new THREE.Vector3(c.stand.x, c.stand.y + 0.08, c.stand.z)]), new THREE.LineBasicMaterial({ color: 0x4aa8ff, transparent: true, opacity: 0.6 })); group.add(ln);
    }
    Gm().scene.add(group); builtFor = Mp().current + '|' + L.team + '|' + L.util + '|' + L.site + '|' + L.range + '|' + L.tech + '|' + L.showAll;
    buildPath();
  }
  function buildPath() {
    if (pathObj && group) { group.remove(pathObj); pathObj = null; } if (landObj && group) { group.remove(landObj); landObj = null; }
    if (!group || !L.sel || !L.showPath) return;
    const c = L.sel, eye = new THREE.Vector3(c.stand.x, c.stand.y + EYE, c.stand.z), r = simulate(eye, c.yaw, c.pitch, c.strength, true, c.v0, c.vy0);
    const pts = r.path; const g = new THREE.BufferGeometry().setFromPoints(pts);
    pathObj = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x7cf3ff, transparent: true, opacity: 0.9, depthTest: false })); pathObj.renderOrder = 9; group.add(pathObj);
    landObj = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: UTIL[c.util][1], transparent: true, opacity: 0.8, depthTest: false })); landObj.position.copy(c.land); landObj.renderOrder = 9; group.add(landObj);
    const sel = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.78, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, depthTest: false })); sel.rotation.x = -Math.PI / 2; sel.position.set(c.stand.x, c.stand.y + 0.08, c.stand.z); sel.renderOrder = 10; group.add(sel);
  }
  let hudEl = null, nearGroup = null, nearKey = null;
  const tagPool = [], retPool = [];
  const mkEl = (cls) => { const d = document.createElement('div'); d.className = cls; document.body.appendChild(d); return d; };
  const HEX = u => '#' + UTIL[u][1].toString(16).padStart(6, '0');
  const STR_SHORT = { 1: 'esq', 0.7: 'esq+dir', 0.42: 'dir' };
  function hideAll(fromT, fromR) { for (let i = fromT || 0; i < tagPool.length; i++) tagPool[i].style.display = 'none'; for (let i = fromR || 0; i < retPool.length; i++) retPool[i].style.display = 'none'; }
  function hideAim() { hideAll(0, 0); if (hudEl) hudEl.style.display = 'none'; if (nearGroup && nearGroup.parent) nearGroup.parent.remove(nearGroup); nearGroup = null; nearKey = null; }
  const tv = new THREE.Vector3();
  function standsOf(list) { const m = new Map(); for (const c of list) { const k = c.stand.x.toFixed(1) + ',' + c.stand.z.toFixed(1) + (c.v0 > 0 ? 'r' : ''); if (!m.has(k)) m.set(k, { key: k, stand: c.stand, items: [], run: c.v0 > 0 }); m.get(k).items.push(c); } return [...m.values()]; }
  L.frame = (cam) => {
    const gm = Gm(), h = gm.human; if (!h || gm.phase === 'menu' || !Mp()) { hideAim(); return; }
    const key = Mp().current + '|' + L.team + '|' + L.util + '|' + L.site + '|' + L.range + '|' + L.tech + '|' + L.showAll;
    if (L.showMarkers && (builtFor !== key || !group) && cur().length) buildMarkers();
    if (!L.showMarkers && group) clearMarkers();
    if (!hudEl) hudEl = mkEl('luHudEl'), hudEl.id = 'luHud';
    const active = gm.settings.mode === 'util' || L.showMarkers || L.open;
    if (!active || !cur().length) { hideAim(); return; }
    const W = window.innerWidth, Hh = window.innerHeight;
    const stands = standsOf(pool()).map(s => ({ s, d: Math.hypot(h.pos.x - s.stand.x, h.pos.z - s.stand.z), dy: Math.abs(h.pos.y - s.stand.y) })).sort((a, b) => a.d - b.d);
    // rótulos dos locais (com a quantidade de utilitários de cada tipo e a distância)
    let ti = 0;
    if (L.showTags) for (const o of stands) {
      if (ti >= 26 || o.d > 90) break; if (o.d < (o.s.run ? 12 : 2.2) && o.dy < 2.5) continue;
      const P = tv.set(o.s.stand.x, o.s.stand.y + 2.8, o.s.stand.z).project(cam); if (P.z >= 1 || Math.abs(P.x) > 1.05 || Math.abs(P.y) > 1.05) continue;
      const el = tagPool[ti] || (tagPool[ti] = mkEl('luTag')); ti++;
      const cnt = {}; o.s.items.forEach(c => cnt[c.util] = (cnt[c.util] || 0) + 1);
      el.innerHTML = Object.keys(cnt).map(u => `<em style="background:${HEX(u)}">${utilName(u, L.team)[0]}${cnt[u] > 1 ? cnt[u] : ''}</em>`).join('') + `<small>${o.d.toFixed(0)} m</small>`;
      el.style.display = 'flex'; el.style.left = ((P.x * 0.5 + 0.5) * W) + 'px'; el.style.top = ((-P.y * 0.5 + 0.5) * Hh) + 'px';
    }
    // no local: TODAS as miras daquele ponto aparecem de uma vez (cada uma com sua cor, nome e força)
    const near = stands.find(o => o.d < (o.s.run ? 12 : 2.0) && o.dy < 2.5);
    let ri = 0;
    if (near) {
      const eye = h.eye(tv), items = near.s.items.slice();
      const qi = cam.quaternion.clone().invert();
      const proj = items.map(c => {
        const dir = U.dirFrom(c.yaw, c.pitch, new THREE.Vector3()), P = eye.clone().addScaledVector(dir, 50).project(cam), cd = dir.clone().applyQuaternion(qi);
        const inView = cd.z < 0 && P.z < 1 && Math.abs(P.x) < 0.96 && Math.abs(P.y) < 0.94;
        return { c, P, cd, inView };
      }).sort((a, b) => (b.inView - a.inView) || (a.cd.x - b.cd.x));
      proj.forEach((o, i) => {
        const el = retPool[ri] || (retPool[ri] = mkEl('luRet')); ri++;
        const col = HEX(o.c.util), sel = o.c === L.sel;
        let x, y, arrow = '';
        if (o.inView) { x = (o.P.x * 0.5 + 0.5) * W; y = (-o.P.y * 0.5 + 0.5) * Hh; }
        else {      // fora da tela (inclusive atrás de você): seta na borda indicando para onde virar
          let nx = o.cd.z < 0 ? o.P.x : o.cd.x, ny = o.cd.z < 0 ? o.P.y : o.cd.y; const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m;
          x = W / 2 + nx * W * 0.4; y = Hh / 2 - ny * Hh * 0.38; arrow = `<b style="color:${col};transform:rotate(${Math.atan2(-ny, nx)}rad)">➤</b>`;
        }
        el.className = 'luRet' + (sel ? ' sel' : '') + (o.inView ? '' : ' edge');
        el.innerHTML = (o.inView ? `<i style="border-color:${col};box-shadow:0 0 10px ${col}"></i>` : arrow) + `<span style="color:${col};top:${o.inView ? 30 + (i % 3) * 14 : 18}px">${esc(o.c.name)} · ${STR_SHORT[o.c.strength]}</span>`;
        el.style.display = 'block'; el.style.left = x + 'px'; el.style.top = y + 'px';
      });
      // trajetórias de todos os utilitários deste local
      if (L.showAllPaths && group) {
        if (nearKey !== near.s.key + L.showAll) {
          if (nearGroup && nearGroup.parent) nearGroup.parent.remove(nearGroup); nearGroup = new THREE.Group(); nearKey = near.s.key + L.showAll;
          for (const c of items) {
            const r = simulate(new THREE.Vector3(c.stand.x, c.stand.y + EYE, c.stand.z), c.yaw, c.pitch, c.strength, true, c.v0, c.vy0), col = UTIL[c.util][1];
            const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(r.path), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthTest: false })); ln.renderOrder = 9; nearGroup.add(ln);
            const lb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthTest: false })); lb.position.copy(c.land); lb.renderOrder = 9; nearGroup.add(lb);
          }
          Gm().scene.add(nearGroup);
        }
      }
    }
    if (!near || !L.showAllPaths) { if (nearGroup && nearGroup.parent) nearGroup.parent.remove(nearGroup); nearGroup = null; nearKey = null; }
    hideAll(ti, ri);
    // texto de ajuda
    const c = L.sel;
    if (near) { hudEl.style.display = 'block'; hudEl.innerHTML = `<b>Neste local: ${near.s.items.length} utilitário(s)</b><br>${near.s.items.length ? HOWTO[near.s.items[0].mode] + ' (' + TECH[near.s.items[0].mode] + ')' : ''}`; }
    else if (c) { const dist = Math.hypot(h.pos.x - c.stand.x, h.pos.z - c.stand.z); hudEl.style.display = 'block'; hudEl.innerHTML = `<b>${esc(c.name)}</b><br>Vá até o círculo branco (${dist.toFixed(0)} m)`; }
    else hudEl.style.display = 'none';
    if (c && L.autoAim) { const dist = Math.hypot(h.pos.x - c.stand.x, h.pos.z - c.stand.z); if (dist < 1.3) { h.yaw += U.angDiff(h.yaw, c.yaw) * 0.25; h.pitch += (c.pitch - h.pitch) * 0.25; } }
  };

  // ---------------- interface (painel avulso e aba do painel Invicto) ----------------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderProgress() { const b = document.querySelector('.lu-prog i'); if (b) b.style.width = Math.round(L.progress * 100) + '%'; }
  function uiHtml() {
    const tm = L.team, list = filtered(), hasList = cur().length > 0;
    const sw = (k, vals) => vals.map(([v, l]) => `<button data-${k}="${v}" class="${L[k === 'team' ? 'team' : k] === v ? 'on' : ''}">${l}</button>`).join('');
    return `<div class="lu-box">
      <div class="lu-row"><span>Lado</span><div class="lu-seg">${sw('team', [['T', 'Insurgentes'], ['CT', 'Força Tática']])}</div></div>
      <div class="lu-row"><span>Utilitário</span><div class="lu-seg">${sw('util', [['all', 'Todos'], ['smoke', 'Fumaça'], ['cach', 'Cachoeira'], ['flash', 'Flash'], ['he', 'HE'], ['fire', tm === 'CT' ? 'Incendiária' : 'Coquetel']])}</div></div>
      <div class="lu-row"><span>Técnica</span><div class="lu-seg">${sw('tech', [['all', 'Todas'], ['parado', 'Parado'], ['pulo', 'Jump throw'], ['corrida', 'W throw'], ['corridapulo', 'W + jump']])}</div></div>
      <div class="lu-row"><span>Alcance</span><div class="lu-seg">${sw('range', [['all', 'Todos'], ['curto', 'Curtos'], ['longo', 'Longos'], ['base', 'Da base']])}</div></div>
      <div class="lu-row"><span>Bombsite</span><div class="lu-seg">${sw('site', [['all', 'Todos'], ['A', 'A'], ['B', 'B'], ['M', 'Meio']])}</div></div>
      <div class="lu-row lu-opts"><label><input type="checkbox" id="luMk" ${L.showMarkers ? 'checked' : ''}> Marcadores no mapa</label><label><input type="checkbox" id="luPth" ${L.showPath ? 'checked' : ''}> Trajetória</label><label><input type="checkbox" id="luAA" ${L.autoAim ? 'checked' : ''}> Mira automática</label></div>
      <div class="lu-row lu-opts"><label><input type="checkbox" id="luAll" ${L.showAll ? 'checked' : ''}> Mostrar todos os locais (ignora filtros)</label><label><input type="checkbox" id="luTag" ${L.showTags ? 'checked' : ''}> Rótulos dos locais</label><label><input type="checkbox" id="luAP" ${L.showAllPaths ? 'checked' : ''}> Trajetórias de todas as miras do local</label></div>
      ${L.busy ? `<div class="lu-prog"><i style="width:${Math.round(L.progress * 100)}%"></i></div><p class="lu-note">Calculando os lineups deste mapa…</p>` :
        !hasList ? `<button class="lu-go" id="luCalc">Calcular lineups deste mapa</button>` :
        `<div class="lu-list">${list.map(c => `<div class="lu-item ${L.sel === c ? 'on' : ''}" data-i="${c.id}"><i style="background:#${UTIL[c.util][1].toString(16).padStart(6, '0')}"></i><b>${esc(c.name)}</b><small>${c.mode !== 'parado' ? TECH[c.mode] + ' · ' : ''}${c.mode !== 'parado' ? '' : STRENGTH.find(x => x[0] === c.strength)[1]} · ${Math.round(Math.hypot(c.target.x - c.stand.x, c.target.z - c.stand.z))} m</small>
          <span><button data-a="sel" data-i="${c.id}">Mostrar</button><button data-a="go" data-i="${c.id}">Ir</button><button data-a="throw" data-i="${c.id}">Lançar</button></span></div>`).join('') || '<p class="lu-note">Nenhum lineup com esse filtro.</p>'}</div>`}
      <p class="lu-note">Teclas: <b>L</b> painel · <b>T</b> ir à posição · <b>Y</b> lançar · <b>,</b> <b>.</b> trocar · <b>U</b> limpar granadas. Só offline.</p></div>`;
  }
  function bind(root) {
    root.querySelectorAll('[data-team]').forEach(b => b.onclick = () => { L.team = b.dataset.team; L.sel = null; clearMarkers(); L.compute(L.team); render(); });
    root.querySelectorAll('[data-util]').forEach(b => b.onclick = () => { L.util = b.dataset.util; clearMarkers(); render(); });
    root.querySelectorAll('[data-tech]').forEach(b => b.onclick = () => { L.tech = b.dataset.tech; clearMarkers(); render(); });
    root.querySelectorAll('[data-range]').forEach(b => b.onclick = () => { L.range = b.dataset.range; clearMarkers(); render(); });
    root.querySelectorAll('[data-site]').forEach(b => b.onclick = () => { L.site = b.dataset.site; clearMarkers(); render(); });
    const mk = root.querySelector('#luMk'); if (mk) mk.onchange = () => { L.showMarkers = mk.checked; if (!mk.checked) clearMarkers(); else buildMarkers(); };
    const ph = root.querySelector('#luPth'); if (ph) ph.onchange = () => { L.showPath = ph.checked; buildPath(); };
    const aa = root.querySelector('#luAA'); if (aa) aa.onchange = () => { L.autoAim = aa.checked; };
    const al = root.querySelector('#luAll'); if (al) al.onchange = () => { L.showAll = al.checked; clearMarkers(); };
    const tg = root.querySelector('#luTag'); if (tg) tg.onchange = () => { L.showTags = tg.checked; };
    const ap = root.querySelector('#luAP'); if (ap) ap.onchange = () => { L.showAllPaths = ap.checked; };
    const calc = root.querySelector('#luCalc'); if (calc) calc.onclick = () => L.compute(L.team);
    root.querySelectorAll('.lu-item button').forEach(b => b.onclick = (e) => { e.stopPropagation(); const c = cur().find(x => x.id === +b.dataset.i); if (!c) return; if (b.dataset.a === 'sel') L.select(c); else if (b.dataset.a === 'go') { L.goto(c); L.toggle(false); } else { L.throwNow(c); } });
  }
  let tabRoot = null;
  function render() {
    const p = $('luPanel'); if (p && !p.classList.contains('hidden')) { const body = p.querySelector('.lu-body'); if (body) { body.innerHTML = uiHtml(); bind(body); } }
    if (tabRoot && document.body.contains(tabRoot)) { tabRoot.innerHTML = uiHtml(); bind(tabRoot); }
  }
  L.renderInto = (body) => { tabRoot = body; body.classList.add('lu-tab'); if (!cur().length && !L.busy && Gm().phase !== 'menu') L.compute(L.team); render(); };
  L.toggle = (on) => {
    let p = $('luPanel'); if (!p) { p = document.createElement('div'); p.id = 'luPanel'; p.className = 'hidden'; p.innerHTML = '<div class="lu-head"><b>✹ LINEUPS DE UTILITÁRIOS</b><button id="luX">✕</button></div><div class="lu-body"></div>'; document.body.appendChild(p); p.addEventListener('keydown', e => e.stopPropagation()); p.addEventListener('mousedown', e => e.stopPropagation()); p.querySelector('#luX').onclick = () => L.toggle(false); }
    if (Gm().phase === 'menu') return;
    L.open = on === undefined ? !L.open : on; p.classList.toggle('hidden', !L.open);
    if (L.open) { if (document.exitPointerLock) document.exitPointerLock(); if (!cur().length && !L.busy) L.compute(L.team); render(); }
  };
  document.addEventListener('keydown', e => {
    const gm = Gm(); if (!gm || !gm.human || gm.phase === 'menu' || (G.MP && G.MP.role)) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.code === 'KeyL') { e.preventDefault(); L.toggle(); }
    else if (gm.settings.mode === 'util' || L.showMarkers) {
      if (e.code === 'KeyU' && gm.settings.mode === 'util') L.clear();
      else if (e.code === 'Comma') L.next(-1);
      else if (e.code === 'Period') L.next(1);
      else if (e.code === 'KeyT' && L.sel) { e.preventDefault(); L.goto(L.sel); }
      else if (e.code === 'KeyY' && L.sel) { e.preventDefault(); L.throwNow(L.sel); }
    }
  });
})();
