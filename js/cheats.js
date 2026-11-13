// Painel "Invicto" — trapaças do modo offline (somente contra bots, só neste jogo).
// Abas: Rage · Legit · Visuais · Misc · Skins · Config · Scripts. Abrir/fechar: Insert (ou F8).
(function () {
  const Ch = G.Cheats = {};
  const U = G.U, M = G.Map;
  const Gm = () => G.Game;
  const $ = id => document.getElementById(id);

  // ---------------- Configuração ----------------
  const DEFAULTS = {
    rage: { on: false, silent: true, autofire: true, autowall: false, hitbox: 'auto', target: 'angulo', fov: 180, hitchance: 55, minDmg: 20,
      autoscope: true, autostop: true, autocrouch: false, noSpread: false, doubletap: false, knifebot: false,
      aa: false, aaMode: 'giro', aaSpeed: 20, fakelag: false, fakelagAmt: 250 },
    legit: { on: false, key: 'm1', fov: 5, smooth: 8, hitbox: 'cabeca', visCheck: true, smokeCheck: true, flashCheck: true, drawFov: false,
      rcs: 0, trigger: false, triggerKey: 'sempre', triggerDelay: 60, triggerHead: false },
    vis: { esp: false, teammates: false, box: true, glow: false, name: true, hp: true, armor: false, weapon: true, dist: false, skeleton: false, snap: false, arrows: true,
      espCol: '#ff4a4a', allyCol: '#4ab4ff', chams: false, chamsCol: '#ff3c8c', chamsAlly: false,
      radar: false, bomb: true, drops: false, nades: false, nadePred: false, night: 0, worldCol: '#ffffff',
      noFlash: false, noSmoke: false, noScope: false, noVisRecoil: false, tracers: false, tracerCol: '#7cf3ff', dmgNums: false, indicators: true,
      fov: 0, vmFov: 60, third: false, thirdDist: 2.6 },
    misc: { bhop: false, autostrafe: false, edgeJump: false, fastStop: false, infDuck: false, autoPistol: false, revealMoney: false, bombTimer: false,
      killsay: false, clantag: false, hitsound: '', watermark: true, autoBuy: false, autoBuyPreset: 'rifle' },
    srv: { god: false, ammo: false, noReload: false, money: false, onehit: false, speed: 1 },
    skins: {},
    script: "// API: ET (jogo), G (tudo), Ch (este painel)\n// Exemplo: matar todos os inimigos vivos\nfor (const a of ET.agents) if (a.alive && a.team !== ET.human.team) a.applyDamage(999, 1, 'head', ET.human, G.W.kalash);\n"
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  function merge(base, over) {
    for (const k in over) {
      if (k === 'skins' && base === cfgRoot(base)) { base.skins = Object.assign({}, over.skins); continue; }
      if (!(k in base)) continue;
      if (over[k] && typeof over[k] === 'object' && base[k] && typeof base[k] === 'object') merge(base[k], over[k]);
      else base[k] = over[k];
    }
    return base;
  }
  const cfgRoot = b => ('rage' in b && 'skins' in b) ? b : null;
  let cfg = clone(DEFAULTS);
  try { merge(cfg, JSON.parse(localStorage.getItem('et_invicto') || '{}')); } catch (e) { }
  Ch.cfg = cfg;
  const save = () => { try { localStorage.setItem('et_invicto', JSON.stringify(cfg)); } catch (e) { } };
  const getP = path => path.split('.').reduce((o, k) => o[k], cfg);
  const setP = (path, v) => { const ks = path.split('.'); let o = cfg; for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; save(); onChange(path); };

  // ---------------- Entrada própria ----------------
  const keys = {}, mouse = {};
  let mdx = 0;
  document.addEventListener('keydown', e => { keys[e.code] = true; });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  document.addEventListener('mousedown', e => { mouse[e.button] = true; });
  document.addEventListener('mouseup', e => { mouse[e.button] = false; });
  document.addEventListener('mousemove', e => { if (document.pointerLockElement) mdx += e.movementX; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; for (const k in mouse) mouse[k] = false; });
  const KEYS = [['sempre', 'Sempre'], ['m1', 'Mouse 1 (atirando)'], ['m2', 'Mouse 2'], ['m4', 'Mouse 4'], ['m5', 'Mouse 5'], ['alt', 'Alt'], ['v', 'V'], ['x', 'X']];
  function keyOn(k) {
    switch (k) {
      case 'sempre': return true; case 'm1': return !!mouse[0]; case 'm2': return !!mouse[2]; case 'm4': return !!mouse[3]; case 'm5': return !!mouse[4];
      case 'alt': return !!(keys.AltLeft || keys.AltRight); case 'v': return !!keys.KeyV; case 'x': return !!keys.KeyX;
    }
    return false;
  }

  // ---------------- Utilidades de mira ----------------
  const tv = new THREE.Vector3(), tv2 = new THREE.Vector3();
  const enemies = () => Gm().agents.filter(a => a.alive && a.team !== Gm().human.team);
  function point(ag, g) { return ag.aimPoint(g === 'legs' ? 'legs' : g); }
  function angles(eye, p) { const dx = p.x - eye.x, dz = p.z - eye.z; return { yaw: U.yawTo(dx, dz), pitch: Math.atan2(p.y - eye.y, Math.hypot(dx, dz)) }; }
  const angDist = (y0, p0, y1, p1) => Math.hypot(U.angDiff(y0, y1), p1 - p0) * U.R2D;
  function estDamage(def, ag, g, dist, walled) {
    const mult = g === 'head' ? def.hs : g === 'stomach' ? 1.25 : g === 'legs' ? 0.75 : 1;
    let raw = def.dmg * (def.pellets || 1) * Math.pow(def.falloff, dist / 12.7) * mult * (walled ? 0.55 : 1);
    if (cfg.srv.onehit) raw = 999;
    const prot = ag.armor > 0 && (g === 'chest' || g === 'stomach' || (g === 'head' && ag.helmet));
    return prot ? raw * (def.ap || 1) : raw;
  }

  // ---------------- Ragebot ----------------
  Ch.aimOverride = null; Ch.rageTarget = null;
  let dtLast = -9, lastShotSeen = -9;
  function ragebot() {
    const g = Gm(), h = g.human, R = cfg.rage;
    Ch.aimOverride = null; Ch.rageTarget = null;
    if (!R.on || !h.alive || g.phase === 'freeze' || Ch.open || g.isPaused()) return;
    const w = h.weapon(); if (!w) return;
    const def = w.def;
    const eye = h.eye();
    if (def.cat === 'knife') { if (R.knifebot) knifebot(h, eye); return; }
    if (!def.mag || def.cat === 'grenade' || def.cat === 'c4') return;
    const groups = R.hitbox === 'cabeca' ? ['head'] : R.hitbox === 'peito' ? ['chest', 'stomach'] : ['head', 'chest', 'stomach', 'legs'];
    let best = null;
    for (const e of enemies()) {
      for (const gr of groups) {
        const p = point(e, gr);
        const dist = eye.distanceTo(p);
        if (dist > (def.range || 200)) continue;
        const vis = M.los(eye, p);
        if (!vis && !R.autowall) continue;
        const dmg = estDamage(def, e, gr, dist, !vis);
        if (dmg < Math.min(R.minDmg, e.hp)) continue;
        const an = angles(eye, p);
        const off = angDist(h.yaw, h.pitch, an.yaw, an.pitch);
        if (R.fov < 180 && off > R.fov) continue;       // 180° = qualquer direção
        const score = R.target === 'dano' ? -dmg : R.target === 'vida' ? e.hp + off * 0.01 : off;
        if (!best || score < best.score) best = { e, g: gr, p, an, dmg, dist, score, vis };
        if (R.hitbox === 'auto' && dmg >= e.hp) break;  // ponto letal: não precisa de mais
      }
    }
    if (!best) return;
    Ch.rageTarget = best;
    if (R.autostop && h.onGround) { h.input.fwd = 0; h.input.side = 0; h.vel.x *= 0.25; h.vel.z *= 0.25; }
    if (R.autocrouch) h.input.crouch = true;
    if (R.autoscope && def.scope && h.zoom === 0 && best.dist > 5) { w.zoom = 1; h.zoom = 1; }
    if (w.ammo === 0 && w.reserve > 0) { h.input.reload = true; return; }
    Ch.aimOverride = { yaw: best.an.yaw, pitch: best.an.pitch };
    if (!R.silent) { h.yaw = best.an.yaw; h.pitch = best.an.pitch; }
    const inacc = G.Combat.inaccuracy(h, def) * Ch.spreadMul() * U.D2R;
    const r = best.g === 'head' ? 0.13 : 0.22;
    const ang = Math.atan2(r, best.dist);
    const chance = inacc <= 1e-5 ? 1 : Math.min(1, Math.pow(ang / inacc, 2));
    const ready = g.time >= h.nextFire && h.reloadT <= 0 && h.drawT <= 0 && w.ammo > 0;
    best.chance = chance;
    if (R.autofire && ready && chance * 100 >= R.hitchance) { h.input.fire = true; h.firePrev = false; }
  }
  function knifebot(h, eye) {
    let best = null;
    for (const e of enemies()) { const d = Math.hypot(e.pos.x - h.pos.x, e.pos.z - h.pos.z); if (d < 2.1 && Math.abs(e.pos.y - h.pos.y) < 1.5 && (!best || d < best.d)) best = { e, d }; }
    if (!best) return;
    const an = angles(eye, point(best.e, 'chest'));
    h.yaw = an.yaw; h.pitch = an.pitch;
    if (Gm().time < h.nextFire) return;
    const back = Math.cos(U.angDiff(best.e.yaw, U.yawTo(best.e.pos.x - h.pos.x, best.e.pos.z - h.pos.z))) > 0.5;
    if (back || best.e.hp <= 65) { h.input.fire2 = true; h.fire2Prev = false; } else { h.input.fire = true; h.firePrev = false; }
  }

  // ---------------- Legitbot / RCS / Triggerbot ----------------
  let trigT = 0;
  function legitbot(dt) {
    const g = Gm(), h = g.human, L = cfg.legit;
    if (!h.alive || g.phase === 'freeze' || Ch.open || g.isPaused()) return;
    const w = h.weapon(); const def = w ? w.def : null;
    if (!def || !def.mag || def.cat === 'grenade') return;
    const eye = h.eye();
    const rcs = L.rcs / 100;
    const pr = def.pattern[Math.min(Math.floor(h.shotsFired), def.pattern.length - 1)] || [0, 0];
    if (L.on && !cfg.rage.on && keyOn(L.key) && !(L.flashCheck && h.flashT > 0.5)) {
      let best = null;
      for (const e of enemies()) {
        const gs = L.hitbox === 'cabeca' ? ['head'] : L.hitbox === 'peito' ? ['chest'] : ['head', 'chest', 'stomach'];
        for (const gr of gs) {
          const p = point(e, gr);
          if (L.visCheck && !M.los(eye, p)) continue;
          if (L.smokeCheck && G.Combat.smoked(eye, p)) continue;
          const an = angles(eye, p);
          // a bala sai em view + recuo*(1-rcs): mira compensando isso
          const ty = an.yaw + pr[0] * U.D2R * (1 - rcs), tp = an.pitch - pr[1] * U.D2R * (1 - rcs);
          const off = angDist(h.yaw, h.pitch, ty, tp);
          if (off <= L.fov && (!best || off < best.off)) best = { ty, tp, off };
        }
      }
      if (best) {
        const k = 1 - Math.exp(-dt * 60 / Math.max(1, L.smooth));
        h.yaw = U.wrap(h.yaw + U.angDiff(h.yaw, best.ty) * k);
        h.pitch = U.clamp(h.pitch + (best.tp - h.pitch) * k, -1.53, 1.53);
      }
    }
    // triggerbot: dispara quando a direção da bala cruza um inimigo antes de qualquer parede
    if (L.trigger && keyOn(L.triggerKey) && !cfg.rage.on) {
      const d = U.dirFrom(h.yaw - pr[0] * U.D2R * (1 - rcs), h.pitch + pr[1] * U.D2R * (1 - rcs), tv);
      const wall = M.raycast(eye, d, 150);
      const maxT = wall ? wall.t : 150;
      let hit = false;
      for (const e of enemies()) for (const hb of e.hitboxes()) {
        if (L.triggerHead && hb.g !== 'head') continue;
        let t;
        t = U.rayHitbox(eye, d, hb, maxT);
        if (t >= 0) hit = true;
      }
      if (hit) { trigT += dt; if (trigT * 1000 >= L.triggerDelay) { h.input.fire = true; h.firePrev = false; } }
      else trigT = 0;
    }
  }
  // chamado pelo combat.fireShot do jogador
  Ch.shotDir = (a, pr) => {
    if (Ch.aimOverride) return Ch.aimOverride;        // ragebot: mira perfeita e sem recuo
    const rcs = cfg.legit.rcs / 100;
    if (rcs > 0) return { yaw: a.yaw - pr[0] * U.D2R * (1 - rcs), pitch: a.pitch + pr[1] * U.D2R * (1 - rcs) };
    return null;
  };
  Ch.spreadMul = () => (cfg.rage.on && cfg.rage.noSpread) ? 0 : 1;
  Ch.autowall = () => cfg.rage.on && cfg.rage.autowall;

  // ---------------- Anti-aim / Fake lag ----------------
  const hist = [];
  Ch.modelYaw = a => {
    if (!cfg.rage.aa || !a.alive) return a.yaw;
    const t = Gm().time;
    if (cfg.rage.aaMode === 'giro') return t * cfg.rage.aaSpeed;
    if (cfg.rage.aaMode === 'jitter') return a.yaw + Math.PI + (Math.floor(t * 12) % 2 ? 0.7 : -0.7);
    return a.yaw + Math.PI;
  };
  Ch.botSeesPos = (t) => {
    if (!cfg.rage.fakelag || !t.alive) return t.pos;
    const want = Gm().time - cfg.rage.fakelagAmt / 1000;
    for (let i = hist.length - 1; i >= 0; i--) if (hist[i].t <= want) return hist[i].p;
    return hist.length ? hist[0].p : t.pos;
  };

  // ---------------- Movimento / Misc por frame ----------------
  let strafeT = 0, clanT = 0, clanI = 0, lastRound = -1;
  Ch.afterInput = (dt, frozen) => {
    const g = Gm(), h = g.human, Mi = cfg.misc;
    if (!g.human) return;
    h.speedMul = cfg.srv.speed;
    h.crouchSpeed = Mi.infDuck ? 60 : 6;
    h.airCap = Mi.autostrafe ? 1.9 : undefined;
    if (!h.alive || Ch.open) { if (Ch.open) { const i = h.input; i.fwd = i.side = 0; i.fire = i.fire2 = i.jump = false; } return; }
    // bunny hop: segura espaço = pula ao tocar o chão
    if (Mi.bhop && keys.Space) h.jumpHeld = false;
    // auto strafe: no ar, segue o movimento do mouse
    if (Mi.autostrafe && !h.onGround && keys.Space && !h.input.side) {
      strafeT -= dt;
      if (Math.abs(mdx) > 0.5) h.input.side = mdx > 0 ? 1 : -1;
      else { if (strafeT <= 0) { strafeT = 0.18; Ch._sdir = -(Ch._sdir || 1); } h.input.side = Ch._sdir || 1; }
      if (!keys.KeyW) h.input.fwd = 0;
    }
    mdx *= 0.5;
    // pulo na borda
    if (Mi.edgeJump && h.onGround) {
      const nx = h.pos.x + h.vel.x * 0.07, nz = h.pos.z + h.vel.z * 0.07;
      if (h.speed2d() > 1 && M.groundAt(nx, nz) < h.pos.y - 0.6) h.input.jump = true, h.jumpHeld = false;
    }
    // parada rápida
    if (Mi.fastStop && h.onGround && !h.input.fwd && !h.input.side) { h.vel.x *= 0.35; h.vel.z *= 0.35; }
    // pistola automática
    if (Mi.autoPistol && h.input.fire) { const d = h.wdef(); if (!d.auto && d.cat !== 'grenade' && d.cat !== 'c4') h.firePrev = false; }
    ragebot();
    legitbot(dt);
    if (Ch.open) h.input.fire = false;
  };
  Ch.afterStep = (dt) => {
    const g = Gm(), h = g.human, V = cfg.vis, S = cfg.srv;
    if (!h) return;
    hist.push({ t: g.time, p: h.pos.clone() }); while (hist.length && hist[0].t < g.time - 1) hist.shift();
    // tiro duplo
    if (cfg.rage.on && cfg.rage.doubletap && h.lastShot !== lastShotSeen) {
      if (h.lastShot - dtLast > 0.6 && h.lastShot > lastShotSeen) { h.nextFire = g.time; dtLast = h.lastShot; }
      lastShotSeen = h.lastShot;
    }
    // servidor
    if (S.money) h.money = 16000;
    for (const slot of ['primary', 'secondary']) {
      const w = h.inv[slot]; if (!w || !w.def.mag) continue;
      if (S.ammo) { w.ammo = Math.max(w.ammo, w.def.mag); w.reserve = Math.max(w.reserve, w.def.reserve); }
    }
    if (S.noReload && h.reloadT > 0) { const w = h.weapon(); if (w && w.def.mag) { const take = Math.min(w.def.mag - w.ammo, w.reserve); w.ammo += take; w.reserve -= take; } h.reloadT = 0; }
    // visuais que mexem em estado
    if (V.noFlash) h.flashT = 0;
    for (const s of G.Combat.smokes) s.group.visible = !V.noSmoke;
    if (V.radar) for (const e of enemies()) e.spottedT = g.time;
    applyChams();
    // clan tag
    if (cfg.misc.clantag) {
      clanT -= dt;
      if (clanT <= 0) { clanT = 0.35; const fr = CLAN_FRAMES[clanI++ % CLAN_FRAMES.length]; h.name = fr ? `[${fr}] ${h.baseName || 'Você'}` : (h.baseName || 'Você'); }
    } else if (h.name !== (h.baseName || 'Você')) h.name = h.baseName || 'Você';
  };
  const TAG = 'INVICTO';
  const CLAN_FRAMES = [];
  for (let i = 1; i <= TAG.length; i++) CLAN_FRAMES.push(TAG.slice(0, i));
  for (let i = 0; i < 4; i++) CLAN_FRAMES.push(TAG);
  for (let i = 1; i < TAG.length; i++) CLAN_FRAMES.push(TAG.slice(i));
  CLAN_FRAMES.push('');

  // ---------------- Eventos ----------------
  const KILLSAY = ['Invicto não perde 😎', 'Volta pro treino!', 'Nem viu de onde veio', 'Um tiro, sem choro', 'Fácil demais', 'Tchau, até a próxima rodada', 'Era só mirar na cabeça', 'Mais um pra conta'];
  Ch.onKill = (victim, attacker, hs) => {
    const h = Gm().human;
    if (attacker === h && victim !== h && cfg.misc.killsay) chat(h.name, U.pick(KILLSAY) + (hs ? ' (cabeça)' : ''));
  };
  Ch.onHit = (ag, dmg, pos, head) => {
    if (cfg.misc.hitsound) G.Audio.hitsound(cfg.misc.hitsound);
    if (cfg.vis.dmgNums) dmgNums.push({ p: pos.clone(), v: Math.round(dmg), head, t: 0 });
  };
  Ch.onShot = (from, to) => {
    if (!cfg.vis.tracers) return;
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone().add(new THREE.Vector3(0, -0.06, 0)), to]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: cfg.vis.tracerCol, transparent: true, opacity: 0.9, depthTest: false }));
    line.renderOrder = 998;
    Gm().scene.add(line);
    tracers.push({ line, t: 0 });
  };
  const PRESETS = {
    rifle: { T: ['kevhelm', 'kalash', 'smoke', 'flash', 'molotov', 'he'], CT: ['kevhelm', 'carabina', 'kit', 'smoke', 'flash', 'incend', 'he'] },
    awp: { T: ['kevhelm', 'leviata', 'trovao', 'flash', 'smoke'], CT: ['kevhelm', 'leviata', 'kit', 'trovao', 'flash', 'smoke'] },
    smg: { T: ['kevhelm', 'vulcao', 'flash'], CT: ['kevhelm', 'lince', 'kit', 'flash'] },
    pistola: { T: ['kevlar', 'trovao', 'flash'], CT: ['kevlar', 'trovao', 'kit', 'flash'] },
    granadas: { T: ['smoke', 'flash', 'molotov', 'he'], CT: ['smoke', 'flash', 'incend', 'he'] }
  };
  Ch.onRoundStart = () => {
    const g = Gm(), h = g.human;
    if (cfg.misc.autoBuy && h.alive) setTimeout(() => {
      if (!g.canBuy(h)) return;
      const list = PRESETS[cfg.misc.autoBuyPreset][h.team];
      let bought = 0;
      for (const id of list) if (!h.buy(G.W[id])) bought++;
      if (bought) { G.Audio.ui('buy'); G.HUD.centerMsg('Compra automática: ' + bought + ' itens', 1.5); }
    }, 300);
  };

  // ---------------- Chams ----------------
  const chamsMats = {};
  function chamsMat(col) { return chamsMats[col] || (chamsMats[col] = new THREE.MeshBasicMaterial({ color: col, depthTest: false, transparent: true, opacity: 0.88 })); }
  function applyChams() {
    const g = Gm(), V = cfg.vis;
    for (const a of g.agents) {
      if (!a.model) continue;
      const on = V.chams && a.alive && !a.isHuman && (a.team !== g.human.team || V.chamsAlly);
      const mat = on ? chamsMat(a.team !== g.human.team ? V.chamsCol : V.allyCol) : null;
      a.model.root.traverse(o => {
        if (!o.isMesh) return;
        if (on) { if (!o.userData.orig) o.userData.orig = o.material; o.material = mat; o.renderOrder = 997; }
        else if (o.userData.orig) { o.material = o.userData.orig; o.userData.orig = null; o.renderOrder = 0; }
      });
    }
  }

  // ---------------- Mundo (noite / cor) ----------------
  let worldApplied = '';
  function applyWorld() {
    const g = Gm(); if (!g.scene || !M.mesh) return;
    const key = cfg.vis.night + cfg.vis.worldCol;
    if (key === worldApplied) return;
    worldApplied = key;
    const n = cfg.vis.night / 100;
    g.sun.intensity = 0.95 * (1 - n * 0.85); g.hemi.intensity = 0.72 * (1 - n * 0.7);
    const fogC = new THREE.Color(0xd9cbb0).lerp(new THREE.Color(0x0b1020), n);
    g.scene.fog.color.copy(fogC);
    if (!Ch._bg) Ch._bg = g.scene.background;
    g.scene.background = n > 0.05 ? fogC.clone() : Ch._bg;
    const wc = new THREE.Color(cfg.vis.worldCol);
    M.mesh.traverse(o => { if (o.isMesh && o.material && o.material.color) { if (!o.userData.baseCol) o.userData.baseCol = o.material.color.clone(); o.material.color.copy(o.userData.baseCol).multiply(wc); } });
  }

  Ch.worldDirty = () => { worldApplied = ''; Ch._bg = null; };
  // ---------------- Câmera ----------------
  Ch.third = () => cfg.vis.third && Gm().human && Gm().human.alive;
  Ch.cameraHook = (cam, t, eye) => {
    if (!(t.isHuman && Ch.third())) return;
    const back = U.dirFrom(t.yaw, t.pitch, tv).multiplyScalar(-1);
    const hit = M.raycast(eye, back, cfg.vis.thirdDist);
    const d = hit ? Math.max(0.3, hit.t - 0.2) : cfg.vis.thirdDist;
    cam.position.copy(eye).addScaledVector(back, d);
    cam.position.y += 0.15;
  };

  // ---------------- Skins ----------------
  const FINISHES = G.Skins ? G.Skins.FINISHES.map(f => [f[0], f[1]]) : [['', 'Padrão']];
  const skinMats = {};
  function skinMat(id) {
    if (skinMats[id]) return skinMats[id];
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); const r = U.mulberry(id.length * 31 + 7);
    let shin = 30, spec = 0x333333, emis = 0x000000;
    const grad = (a, b) => { const gr = x.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, a); gr.addColorStop(1, b); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); };
    switch (id) {
      case 'ouro': grad('#ffe48a', '#a8740e'); for (let i = 0; i < 20; i++) { x.fillStyle = `rgba(255,255,220,${r() * 0.3})`; x.fillRect(0, r() * 128, 128, 2); } shin = 110; spec = 0xffe6a0; break;
      case 'cromo': grad('#f2f4f7', '#6c7078'); shin = 140; spec = 0xffffff; break;
      case 'carbono': for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { x.fillStyle = (i + j) % 2 ? '#2a2a2e' : '#151517'; x.fillRect(i * 8, j * 8, 8, 8); x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(i * 8, j * 8, 8, 2); } shin = 80; spec = 0x666666; break;
      case 'deserto': x.fillStyle = '#c9ae7c'; x.fillRect(0, 0, 128, 128); for (const c of ['#9c7f52', '#7a5e3a', '#e2cfa2']) for (let i = 0; i < 14; i++) { x.fillStyle = c; x.beginPath(); x.ellipse(r() * 128, r() * 128, 6 + r() * 16, 4 + r() * 10, r() * 3, 0, 7); x.fill(); } break;
      case 'digital': x.fillStyle = '#4c5a46'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 220; i++) { x.fillStyle = U.pick(['#2f382c', '#6f7a5e', '#8a8f6a', '#1e231c']); x.fillRect(Math.floor(r() * 16) * 8, Math.floor(r() * 16) * 8, 8, 8); } break;
      case 'neon': x.fillStyle = '#07070c'; x.fillRect(0, 0, 128, 128); x.lineWidth = 3; for (let i = 0; i < 9; i++) { x.strokeStyle = i % 2 ? '#00f0ff' : '#ff2bd6'; x.beginPath(); x.moveTo(0, i * 16); x.lineTo(128, i * 16 + 30); x.stroke(); } emis = 0x0a1522; shin = 90; spec = 0x88ffff; break;
      case 'sangue': x.fillStyle = '#5a0606'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${r() * 40},0,0,0.8)`; x.beginPath(); x.arc(r() * 128, r() * 128, 2 + r() * 10, 0, 7); x.fill(); } shin = 60; break;
      case 'oceano': grad('#0b3b6f', '#1aa0c8'); x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2; for (let i = 0; i < 10; i++) { x.beginPath(); for (let k = 0; k <= 128; k += 8) x.lineTo(k, i * 14 + Math.sin(k * 0.1 + i) * 4); x.stroke(); } shin = 70; break;
      case 'tigre': x.fillStyle = '#e8892a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#1a1208'; for (let i = 0; i < 12; i++) { x.beginPath(); const y = i * 11 + r() * 4; x.moveTo(0, y); x.quadraticCurveTo(64, y + (r() - 0.5) * 20, 128, y + 3); x.lineTo(128, y + 6); x.quadraticCurveTo(64, y + 4, 0, y + 4); x.fill(); } break;
      case 'arcoiris': for (let i = 0; i < 128; i++) { x.fillStyle = `hsl(${i * 2.8},90%,55%)`; x.fillRect(i, 0, 1, 128); } shin = 90; spec = 0x888888; break;
      case 'rosa': x.fillStyle = '#ff7fbf'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) { x.beginPath(); x.arc(r() * 128, r() * 128, 2 + r() * 3, 0, 7); x.fill(); } shin = 70; break;
      case 'vulcao': x.fillStyle = '#1a0d08'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#ff5a10'; x.lineWidth = 2.5; for (let i = 0; i < 16; i++) { x.beginPath(); let px = r() * 128, py = r() * 128; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 40; py += (r() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); } emis = 0x200800; break;
    }
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(7, 7);
    return (skinMats[id] = new THREE.MeshPhongMaterial({ map: tex, shininess: shin, specular: spec, emissive: emis }));
  }
  Ch.skinKey = id => cfg.skins[id] ? '#' + cfg.skins[id] : '';
  Ch.setSkin = (id, v) => { if (v) cfg.skins[id] = v; else delete cfg.skins[id]; save(); onChange('skins'); };
  const baseGun = G.Models.gun;
  G.Models.gun = def => {
    const g = baseGun(def);
    const sk = cfg.skins[def.id];
    if (sk) {
      const mat = G.Skins ? G.Skins.mat(sk) : skinMat(sk);
      g.traverse(o => {
        if (!o.isMesh || !o.material) return;
        const m = o.material;
        if (m.transparent || (m.emissive && m.emissive.getHex() > 0)) return;
        const c = m.color; if (c && (c.r + c.g + c.b) / 3 < 0.05) return;   // mantém peças pretas (frestas, lentes)
        o.material = mat;
      });
    }
    return g;
  };
  Ch.FINISHES = FINISHES;

  // ---------------- Desenho (ESP etc.) ----------------
  const cv = document.createElement('canvas'); cv.id = 'espCanvas'; document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const chatEl = document.createElement('div'); chatEl.id = 'chatLog'; document.body.appendChild(chatEl);
  const indEl = document.createElement('div'); indEl.id = 'cheatInd'; document.body.appendChild(indEl);
  function chat(name, msg) {
    const d = document.createElement('div'); d.innerHTML = `<b>${esc(name)}</b>: ${esc(msg)}`;
    chatEl.appendChild(d); while (chatEl.children.length > 6) chatEl.firstChild.remove();
    setTimeout(() => d.remove(), 8000);
  }
  Ch.chat = chat;
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const dmgNums = [], tracers = [];
  let W = 0, H = 0;
  function proj(v) {
    const cam = Gm().camera;
    tv2.copy(v).project(cam);
    const behind = tv2.z > 1;
    return { x: (tv2.x + 1) / 2 * W, y: (1 - tv2.y) / 2 * H, ok: !behind && tv2.z > -1 };
  }
  const wpTmp = new THREE.Vector3();
  function wp(obj, x, y, z) { return obj.localToWorld(wpTmp.set(x || 0, y || 0, z || 0)).clone(); }
  function skeleton(a, col) {
    const m = a.model; if (!m) return;
    const head = wp(m.head, 0, 0.12, 0), neck = wp(m.upper, 0, 0.62, 0), pel = wp(m.upper, 0, 0.02, 0);
    const lines = [[head, neck], [neck, pel]];
    for (const leg of m.legs) { const knee = wp(leg.userData.shin), foot = wp(leg.userData.shin, 0, -0.4, 0); lines.push([pel, wp(leg)], [wp(leg), knee], [knee, foot]); }
    const shR = wp(m.armR), shL = wp(m.armL), hR = wp(m.armR, 0, -0.12, -0.38), hL = wp(m.armL, 0.2, -0.13, -0.45);
    lines.push([neck, shR], [shR, hR], [neck, shL], [shL, hL]);
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    for (const [p, q] of lines) { const A = proj(p), B = proj(q); if (!A.ok || !B.ok) continue; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); }
  }
  function text(t, x, y, col, align, size) {
    ctx.font = `600 ${size || 11}px Segoe UI, Arial`; ctx.textAlign = align || 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(t, x, y);
    ctx.fillStyle = col || '#fff'; ctx.fillText(t, x, y);
  }
  function predictNade(h) {
    const pts = [];
    const strength = (mouse[0] && mouse[2]) ? 0.7 : mouse[2] ? 0.42 : 1;
    const dir = U.dirFrom(h.yaw, h.pitch + 6 * U.D2R, new THREE.Vector3());
    const pos = h.eye().addScaledVector(dir, 0.4);
    const vel = dir.multiplyScalar(19 * strength).add(h.vel.clone());
    const step = 1 / 120;
    let bounces = 0;
    for (let i = 0; i < 120 * 3; i++) {
      vel.y -= 16.24 * step;
      const nx = pos.x + vel.x * step, ny = pos.y + vel.y * step, nz = pos.z + vel.z * step;
      if (!M.pointSolid(nx, ny, nz)) pos.set(nx, ny, nz);
      else {
        if (M.pointSolid(nx, pos.y, pos.z)) vel.x *= -0.45;
        if (M.pointSolid(pos.x, pos.y, nz)) vel.z *= -0.45;
        if (M.pointSolid(pos.x, ny, pos.z)) { vel.y *= -0.4; vel.x *= 0.75; vel.z *= 0.75; }
        bounces++;
        if (vel.length() < 1 || bounces > 6) break;
      }
      if (i % 4 === 0) pts.push(pos.clone());
    }
    pts.push(pos.clone());
    return pts;
  }
  Ch.render = (dt, view) => {
    const g = Gm(), h = g.human, V = cfg.vis;
    applyWorld();
    if (cv.width !== innerWidth || cv.height !== innerHeight) { cv.width = innerWidth; cv.height = innerHeight; }
    W = cv.width; H = cv.height;
    ctx.clearRect(0, 0, W, H);
    // rastros 3D
    for (const tr of tracers) { tr.t += dt; tr.line.material.opacity = Math.max(0, 0.9 * (1 - tr.t / 1.5)); }
    for (let i = tracers.length - 1; i >= 0; i--) if (tracers[i].t > 1.5) { g.scene.remove(tracers[i].line); tracers[i].line.geometry.dispose(); tracers[i].line.material.dispose(); tracers.splice(i, 1); }
    if (g.phase === 'menu' || !h) { indEl.innerHTML = ''; return; }
    const cam = g.camera;
    const camYaw = cam.rotation.y;
    // ESP de jogadores
    if (V.esp) for (const a of g.agents) {
      if (!a.alive || a === view) continue;
      const enemy = a.team !== h.team;
      if (!enemy && !V.teammates) continue;
      const col = enemy ? V.espCol : V.allyCol;
      const top = proj(new THREE.Vector3(a.pos.x, a.pos.y + a.height + 0.12, a.pos.z));
      const bot = proj(new THREE.Vector3(a.pos.x, a.pos.y - 0.02, a.pos.z));
      if (!top.ok || !bot.ok || top.x < -50 || top.x > W + 50) {
        if (V.arrows && enemy) {
          const ang = U.angDiff(camYaw, U.yawTo(a.pos.x - cam.position.x, a.pos.z - cam.position.z));
          const r = Math.min(W, H) * 0.22, cx = W / 2 - Math.sin(ang) * r, cy = H / 2 - Math.cos(ang) * r;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(-ang); ctx.fillStyle = col; ctx.globalAlpha = 0.85;
          ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-8, 6); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        continue;
      }
      const bh = bot.y - top.y, bw = bh * 0.48, x = top.x - bw / 2, y = top.y;
      if (V.glow) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
      if (V.box) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeRect(x, y, bw, bh); ctx.lineWidth = 1.4; ctx.strokeStyle = col; ctx.strokeRect(x, y, bw, bh); }
      ctx.shadowBlur = 0;
      if (V.hp) {
        const f = U.clamp(a.hp / 100, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 6, y - 1, 4, bh + 2);
        ctx.fillStyle = `hsl(${f * 120},90%,50%)`; ctx.fillRect(x - 5, y + bh * (1 - f), 2, bh * f);
        if (a.hp < 100) text(String(Math.ceil(a.hp)), x - 8, y + bh * (1 - f) + 3, '#fff', 'right', 9);
      }
      if (V.armor && a.armor > 0) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x, y + bh + 2, bw, 4); ctx.fillStyle = '#7ab8ff'; ctx.fillRect(x + 1, y + bh + 3, (bw - 2) * a.armor / 100, 2); }
      if (V.name) text(a.name + (a.inv.c4 ? ' 💣' : '') + (a.flashT > 0.5 ? ' (cego)' : ''), top.x, y - 4, '#fff');
      let by = y + bh + (V.armor && a.armor > 0 ? 16 : 11);
      if (V.weapon) { text(a.wdef().name + (a.reloadT > 0 ? ' · recarregando' : ''), top.x, by, '#ddd', 'center', 10); by += 11; }
      if (V.dist) text(Math.round(a.pos.distanceTo(h.pos)) + ' m', top.x, by, '#bbb', 'center', 10);
      if (V.skeleton) skeleton(a, col);
      if (V.snap) { ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(bot.x, bot.y); ctx.stroke(); ctx.globalAlpha = 1; }
    }
    // bomba
    const bomb = g.bomb;
    if (V.bomb && bomb) {
      let bp = null, lbl = '';
      if (bomb.state === 'planted') { bp = bomb.pos; lbl = `C4 · ${Math.max(0, bomb.timer).toFixed(1)} s`; }
      else if (bomb.state === 'dropped') { const d = G.Combat.drops.find(x => x.inst.def.id === 'c4'); if (d) { bp = d.pos; lbl = 'C4 no chão'; } }
      if (bp) { const p = proj(new THREE.Vector3(bp.x, bp.y + 0.3, bp.z)); if (p.ok) { ctx.fillStyle = '#ff3b30'; ctx.fillRect(p.x - 4, p.y - 4, 8, 8); text(lbl, p.x, p.y - 8, '#ff8a80'); } }
    }
    if (cfg.misc.bombTimer && bomb && bomb.state === 'planted') {
      const t = Math.max(0, bomb.timer), need = h.kit ? 5 : 10;
      const ok = t > need;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(W / 2 - 130, 74, 260, 30);
      ctx.fillStyle = ok ? '#4ade80' : '#f87171'; ctx.fillRect(W / 2 - 128, 98, 256 * (t / g.bombTime), 4);
      text(`Bomba ${bomb.site}: ${t.toFixed(1)} s · ${ok ? 'dá tempo de desarmar' : 'não dá tempo'}${h.team === 'CT' ? (h.kit ? ' (kit)' : ' (sem kit)') : ''}`, W / 2, 93, '#fff', 'center', 12);
    }
    // armas no chão
    if (V.drops) for (const d of G.Combat.drops) { const p = proj(d.pos); if (p.ok && d.inst.def.id !== 'c4') text(d.inst.def.name, p.x, p.y, '#ffe08a', 'center', 10); }
    // granadas no ar / fumaça / fogo
    if (V.nades) {
      for (const n of G.Combat.nades) { const p = proj(n.pos); if (p.ok) text(n.def.name, p.x, p.y - 6, '#9fe7ff', 'center', 10); }
      for (const s of G.Combat.smokes) { const p = proj(new THREE.Vector3(s.pos.x, s.pos.y + 1.5, s.pos.z)); if (p.ok) text(`Fumaça ${Math.max(0, s.life - s.t).toFixed(0)} s`, p.x, p.y, '#cfd8dc', 'center', 10); }
      for (const f of G.Combat.fires) { const p = proj(new THREE.Vector3(f.pos.x, f.pos.y + 0.5, f.pos.z)); if (p.ok) text(`Fogo ${Math.max(0, f.life - f.t).toFixed(0)} s`, p.x, p.y, '#ffab70', 'center', 10); }
    }
    // previsão de granada
    if (V.nadePred && h.alive && h.cur === 'grenade' && view === h) {
      const pts = predictNade(h);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath();
      let started = false;
      for (const p3 of pts) { const p = proj(p3); if (!p.ok) { started = false; continue; } if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y); }
      ctx.stroke(); ctx.setLineDash([]);
      const end = pts[pts.length - 1];
      const ring = [];
      for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2; ring.push(proj(new THREE.Vector3(end.x + Math.cos(a) * 1.2, end.y + 0.05, end.z + Math.sin(a) * 1.2))); }
      ctx.strokeStyle = '#ffd54a'; ctx.beginPath(); ring.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    }
    // números de dano
    for (const d of dmgNums) {
      d.t += dt;
      const p = proj(new THREE.Vector3(d.p.x, d.p.y + d.t * 0.8, d.p.z));
      if (p.ok) { ctx.globalAlpha = Math.max(0, 1 - d.t / 1.2); text('-' + d.v, p.x, p.y, d.head ? '#ff5a4f' : '#ffffff', 'center', d.head ? 16 : 13); ctx.globalAlpha = 1; }
    }
    for (let i = dmgNums.length - 1; i >= 0; i--) if (dmgNums[i].t > 1.2) dmgNums.splice(i, 1);
    // círculo do FOV do legitbot
    if (cfg.legit.on && cfg.legit.drawFov && h.alive) {
      const r = Math.tan(cfg.legit.fov * U.D2R) / Math.tan(cam.fov * U.D2R / 2) * H / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, 7); ctx.stroke();
    }
    // alvo do ragebot
    if (Ch.rageTarget) {
      const p = proj(Ch.rageTarget.p);
      if (p.ok) { ctx.strokeStyle = '#ff2d55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.moveTo(p.x - 10, p.y); ctx.lineTo(p.x + 10, p.y); ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x, p.y + 10); ctx.stroke(); }
    }
    // marca d'água e indicadores
    if (cfg.misc.watermark) {
      const fps = Ch._fps = Ch._fps ? Ch._fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05 : 60;
      const s = `INVICTO  ·  ${h.name}  ·  ${Math.round(fps)} fps  ·  rodada ${g.round}`;
      ctx.font = '600 12px Segoe UI, Arial'; const tw = ctx.measureText(s).width;
      const wy = G.Touch && G.Touch.active ? 60 : H - 152;   // no celular vai para o topo (os botões ocupam a base)
      ctx.fillStyle = 'rgba(12,14,20,0.82)'; ctx.fillRect(W - tw - 34, wy, tw + 20, 22);
      ctx.fillStyle = '#2ee6b6'; ctx.fillRect(W - tw - 34, wy, tw + 20, 2);
      text(s, W - 24, wy + 16, '#e8f6f2', 'right', 12);
    }
    let ind = '';
    if (cfg.vis.indicators) {
      const on = [];
      if (cfg.rage.on) on.push(['RAGE', '#ff2d55']);
      if (cfg.rage.on && cfg.rage.doubletap) on.push(['DT', g.time - dtLast > 0.6 ? '#2ee6b6' : '#888']);
      if (cfg.rage.aa) on.push(['AA', '#a78bfa']);
      if (cfg.rage.fakelag) on.push(['FL', '#facc15']);
      if (cfg.rage.on && cfg.rage.autowall) on.push(['AW', '#60a5fa']);
      if (cfg.legit.on && !cfg.rage.on) on.push(['AIM', '#2ee6b6']);
      if (cfg.legit.trigger) on.push(['TRIG', '#fb923c']);
      if (cfg.misc.bhop) on.push(['BHOP', '#e5e7eb']);
      if (cfg.srv.god) on.push(['DEUS', '#fde047']);
      ind = on.map(([t, c]) => `<span style="color:${c}">${t}</span>`).join('');
    }
    if (indEl._h !== ind) { indEl.innerHTML = ind; indEl._h = ind; }
  };

  // ---------------- Menu ----------------
  const chk = (k, l) => ({ t: 'check', k, l });
  const sld = (k, l, min, max, step, unit) => ({ t: 'slider', k, l, min, max, step, unit: unit || '' });
  const sel = (k, l, opts) => ({ t: 'select', k, l, opts });
  const col = (k, l) => ({ t: 'color', k, l });
  const key = (k, l) => ({ t: 'select', k, l, opts: KEYS });
  const TABS = [
    { id: 'rage', name: 'Rage', icon: '◎', groups: [
      { name: 'Ragebot', items: [chk('rage.on', 'Ativar ragebot'), chk('rage.silent', 'Mira silenciosa'), chk('rage.autofire', 'Disparo automático'), chk('rage.autowall', 'Atravessar paredes (autowall)'),
        sel('rage.hitbox', 'Hitbox', [['cabeca', 'Cabeça'], ['peito', 'Peito / barriga'], ['auto', 'Automático (multiponto)']]),
        sel('rage.target', 'Prioridade', [['angulo', 'Mais perto da mira'], ['dano', 'Maior dano'], ['vida', 'Menor vida']]),
        sld('rage.fov', 'FOV', 1, 180, 1, '°'), sld('rage.hitchance', 'Chance de acerto', 0, 100, 1, '%'), sld('rage.minDmg', 'Dano mínimo', 1, 100, 1)] },
      { name: 'Precisão', items: [chk('rage.autoscope', 'Luneta automática'), chk('rage.autostop', 'Parada automática'), chk('rage.autocrouch', 'Agachar automático'), chk('rage.noSpread', 'Sem dispersão'), chk('rage.doubletap', 'Tiro duplo (double tap)'), chk('rage.knifebot', 'Faca automática')] },
      { name: 'Anti-aim', items: [chk('rage.aa', 'Ativar anti-aim'), sel('rage.aaMode', 'Modo', [['giro', 'Giro'], ['jitter', 'Tremido'], ['costas', 'De costas']]), sld('rage.aaSpeed', 'Velocidade do giro', 1, 50, 1),
        chk('rage.fakelag', 'Fake lag'), sld('rage.fakelagAmt', 'Atraso do fake lag', 50, 600, 10, ' ms')] }] },
    { id: 'legit', name: 'Legit', icon: '⌖', groups: [
      { name: 'Aimbot', items: [chk('legit.on', 'Ativar aimbot'), key('legit.key', 'Tecla'), sld('legit.fov', 'FOV', 0.5, 30, 0.5, '°'), sld('legit.smooth', 'Suavização', 1, 30, 0.5),
        sel('legit.hitbox', 'Hitbox', [['cabeca', 'Cabeça'], ['peito', 'Peito'], ['proximo', 'Mais próximo']]), chk('legit.visCheck', 'Checar visibilidade'), chk('legit.smokeCheck', 'Ignorar alvos na fumaça'), chk('legit.flashCheck', 'Desligar quando cego'), chk('legit.drawFov', 'Desenhar FOV')] },
      { name: 'Controle de recuo', items: [sld('legit.rcs', 'Compensação (RCS)', 0, 100, 1, '%')] },
      { name: 'Triggerbot', items: [chk('legit.trigger', 'Ativar triggerbot'), key('legit.triggerKey', 'Tecla'), sld('legit.triggerDelay', 'Atraso', 0, 300, 5, ' ms'), chk('legit.triggerHead', 'Só na cabeça')] }] },
    { id: 'vis', name: 'Visuais', icon: '◉', groups: [
      { name: 'ESP de jogadores', items: [chk('vis.esp', 'Ativar ESP'), chk('vis.teammates', 'Mostrar aliados'), chk('vis.box', 'Caixa'), chk('vis.glow', 'Brilho'), chk('vis.name', 'Nome'), chk('vis.hp', 'Barra de vida'), chk('vis.armor', 'Barra de colete'),
        chk('vis.weapon', 'Arma'), chk('vis.dist', 'Distância'), chk('vis.skeleton', 'Esqueleto'), chk('vis.snap', 'Linhas até o alvo'), chk('vis.arrows', 'Setas fora da tela'), col('vis.espCol', 'Cor dos inimigos'), col('vis.allyCol', 'Cor dos aliados')] },
      { name: 'Modelos', items: [chk('vis.chams', 'Chams (através de paredes)'), col('vis.chamsCol', 'Cor dos chams'), chk('vis.chamsAlly', 'Chams nos aliados')] },
      { name: 'Mundo', items: [chk('vis.radar', 'Radar revela inimigos'), chk('vis.bomb', 'ESP da bomba'), chk('vis.drops', 'ESP de armas no chão'), chk('vis.nades', 'ESP de granadas'), chk('vis.nadePred', 'Previsão de granada'),
        sld('vis.night', 'Modo noturno', 0, 100, 1, '%'), col('vis.worldCol', 'Cor do mundo')] },
      { name: 'Efeitos', items: [chk('vis.noFlash', 'Sem flash'), chk('vis.noSmoke', 'Sem fumaça'), chk('vis.noScope', 'Sem overlay da luneta'), chk('vis.noVisRecoil', 'Sem recuo visual'), chk('vis.tracers', 'Rastro das balas'), col('vis.tracerCol', 'Cor do rastro'),
        chk('vis.dmgNums', 'Números de dano'), chk('vis.indicators', 'Indicadores ativos')] },
      { name: 'Câmera', items: [sld('vis.fov', 'FOV (0 = padrão)', 0, 130, 1, '°'), sld('vis.vmFov', 'FOV da arma', 40, 100, 1, '°'), chk('vis.third', 'Terceira pessoa'), sld('vis.thirdDist', 'Distância 3ª pessoa', 1, 6, 0.1, ' m')] }] },
    { id: 'misc', name: 'Misc', icon: '✦', groups: [
      { name: 'Movimento', items: [chk('misc.bhop', 'Bunny hop'), chk('misc.autostrafe', 'Auto strafe'), chk('misc.edgeJump', 'Pulo na borda'), chk('misc.fastStop', 'Parada rápida'), chk('misc.infDuck', 'Agachar instantâneo')] },
      { name: 'Geral', items: [chk('misc.autoPistol', 'Pistola automática'), chk('misc.revealMoney', 'Revelar dinheiro inimigo'), chk('misc.bombTimer', 'Cronômetro da bomba'), chk('misc.killsay', 'Kill say'), chk('misc.clantag', 'Clan tag animada'),
        sel('misc.hitsound', 'Som de acerto', [['', 'Padrão'], ['sino', 'Sino'], ['metal', 'Metal'], ['bolha', 'Bolha'], ['clique', 'Clique']]), chk('misc.watermark', 'Marca d\'água')] },
      { name: 'Compra automática', items: [chk('misc.autoBuy', 'Ativar'), sel('misc.autoBuyPreset', 'Pacote', [['rifle', 'Rifle completo'], ['awp', 'Sniper pesada'], ['smg', 'SMG + colete'], ['pistola', 'Pistola pesada'], ['granadas', 'Só granadas']])] },
      { name: 'Servidor (só offline)', items: [chk('srv.god', 'Modo deus'), chk('srv.ammo', 'Munição infinita'), chk('srv.noReload', 'Recarga instantânea'), chk('srv.money', 'Dinheiro infinito'), chk('srv.onehit', 'Matar com 1 tiro'), sld('srv.speed', 'Velocidade', 0.5, 3, 0.1, '×')] }] },
    { id: 'skins', name: 'Skins', icon: '◆', custom: renderSkins },
    { id: 'cfg', name: 'Config', icon: '⚙', custom: renderConfig },
    { id: 'lua', name: 'Scripts', icon: '{}', custom: renderScripts }
  ];
  let menu = null, curTab = 'rage';
  function buildMenu() {
    menu = document.createElement('div'); menu.id = 'cheatMenu'; menu.className = 'hidden';
    menu.innerHTML = `<div class="cm-side"><div class="cm-logo">INVICTO<small>painel offline</small></div><div class="cm-tabs"></div><div class="cm-foot">Insert / F8 fecha</div></div><div class="cm-main"><div class="cm-head"><span class="cm-title"></span><span class="cm-close">✕</span></div><div class="cm-body"></div></div>`;
    document.body.appendChild(menu);
    menu.querySelector('.cm-close').onclick = () => Ch.toggle(false);
    // arrastar
    const head = menu.querySelector('.cm-head');
    head.onmousedown = e => {
      const r = menu.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
      const mv = ev => { menu.style.left = (ev.clientX - ox) + 'px'; menu.style.top = (ev.clientY - oy) + 'px'; menu.style.transform = 'none'; };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    };
    menu.addEventListener('mousedown', e => e.stopPropagation());
    renderTabs();
  }
  function renderTabs() {
    const t = menu.querySelector('.cm-tabs');
    t.innerHTML = TABS.map(x => `<div class="cm-tab ${x.id === curTab ? 'on' : ''}" data-id="${x.id}"><i>${x.icon}</i>${x.name}</div>`).join('');
    t.querySelectorAll('.cm-tab').forEach(el => el.onclick = () => { curTab = el.dataset.id; renderTabs(); });
    const tab = TABS.find(x => x.id === curTab);
    menu.querySelector('.cm-title').textContent = tab.name;
    const body = menu.querySelector('.cm-body');
    if (tab.custom) { body.innerHTML = ''; tab.custom(body); return; }
    body.innerHTML = '<div class="cm-cols">' + tab.groups.map(g => `<div class="cm-group"><h4>${g.name}</h4>${g.items.map(itemHtml).join('')}</div>`).join('') + '</div>';
    bindItems(body);
  }
  function itemHtml(it) {
    const v = getP(it.k);
    if (it.t === 'check') return `<label class="cm-row cm-chk"><input type="checkbox" data-k="${it.k}" ${v ? 'checked' : ''}><span class="box"></span>${it.l}</label>`;
    if (it.t === 'slider') return `<div class="cm-row cm-sld"><div class="lbl">${it.l}<b>${fmt(v, it)}</b></div><input type="range" data-k="${it.k}" min="${it.min}" max="${it.max}" step="${it.step}" value="${v}"></div>`;
    if (it.t === 'select') return `<div class="cm-row cm-sel"><div class="lbl">${it.l}</div><select data-k="${it.k}">${it.opts.map(([a, b]) => `<option value="${a}" ${a === v ? 'selected' : ''}>${b}</option>`).join('')}</select></div>`;
    if (it.t === 'color') return `<label class="cm-row cm-col">${it.l}<input type="color" data-k="${it.k}" value="${v}"></label>`;
    return '';
  }
  const fmt = (v, it) => (it.k === 'vis.fov' && Number(v) === 0) ? 'padrão' : (Number(v) % 1 ? Number(v).toFixed(1) : v) + it.unit;
  function bindItems(root) {
    root.querySelectorAll('[data-k]').forEach(el => {
      const k = el.dataset.k;
      const it = TABS.flatMap(t => t.groups || []).flatMap(g => g.items).find(i => i.k === k);
      if (el.type === 'checkbox') el.onchange = () => setP(k, el.checked);
      else if (el.type === 'range') el.oninput = () => { setP(k, Number(el.value)); el.parentNode.querySelector('b').textContent = fmt(el.value, it); };
      else if (el.tagName === 'SELECT') el.onchange = () => setP(k, el.value);
      else if (el.type === 'color') el.oninput = () => setP(k, el.value);
    });
  }
  function onChange(path) {
    if (path === 'rage.on' && cfg.rage.on && cfg.legit.on) G.HUD.centerMsg('Ragebot tem prioridade sobre o aimbot legit', 1.5);
    if (path.startsWith('skins')) { G.HUD.icons = {}; }
  }
  function renderSkins(body) {
    const list = G.W.all.filter(d => d.shape && d.cat !== 'grenade' && d.cat !== 'c4');
    const opts = v => FINISHES.map(([a, b]) => `<option value="${a}" ${a === (v || '') ? 'selected' : ''}>${b}</option>`).join('');
    body.innerHTML = `<div class="cm-skinbar"><span>Aplicar em todas:</span><select id="skinAll">${opts('')}</select><button id="skinAllBtn">Aplicar</button><button id="skinClear">Limpar</button></div>
      <div class="cm-skins">${list.map(d => `<div class="cm-skin"><div class="n">${d.name}</div><select data-w="${d.id}">${opts(cfg.skins[d.id])}</select></div>`).join('')}</div>`;
    body.querySelectorAll('select[data-w]').forEach(el => el.onchange = () => { if (el.value) cfg.skins[el.dataset.w] = el.value; else delete cfg.skins[el.dataset.w]; save(); onChange('skins'); });
    body.querySelector('#skinAllBtn').onclick = () => { const v = body.querySelector('#skinAll').value; for (const d of list) { if (v) cfg.skins[d.id] = v; else delete cfg.skins[d.id]; } save(); onChange('skins'); renderSkins(body); };
    body.querySelector('#skinClear').onclick = () => { cfg.skins = {}; save(); onChange('skins'); renderSkins(body); };
  }
  function renderConfig(body) {
    const slots = [1, 2, 3].map(i => { let has = false; try { has = !!localStorage.getItem('et_invicto_slot' + i); } catch (e) { } return { i, has }; });
    body.innerHTML = `<div class="cm-cols"><div class="cm-group"><h4>Perfis</h4>${slots.map(s => `<div class="cm-cfg"><span>Perfil ${s.i}${s.has ? '' : ' <em>(vazio)</em>'}</span><button data-save="${s.i}">Salvar</button><button data-load="${s.i}" ${s.has ? '' : 'disabled'}>Carregar</button></div>`).join('')}
      <div class="cm-cfg"><span>Padrão de fábrica</span><button id="cfgReset">Resetar tudo</button></div>
      <h4 style="margin-top:14px">Predefinições</h4>
      <div class="cm-cfg"><span>Legit discreto</span><button data-pre="legit">Aplicar</button></div>
      <div class="cm-cfg"><span>Rage total</span><button data-pre="rage">Aplicar</button></div>
      <div class="cm-cfg"><span>Só visuais</span><button data-pre="vis">Aplicar</button></div></div>
      <div class="cm-group"><h4>Exportar / importar</h4><textarea id="cfgText" spellcheck="false"></textarea><div class="cm-cfg"><button id="cfgExp">Exportar</button><button id="cfgImp">Importar</button></div><p class="cm-note">O texto contém todas as opções do painel em JSON.</p></div></div>`;
    body.querySelectorAll('[data-save]').forEach(b => b.onclick = () => { try { localStorage.setItem('et_invicto_slot' + b.dataset.save, JSON.stringify(cfg)); } catch (e) { } G.HUD.centerMsg('Perfil salvo', 1); renderConfig(body); });
    body.querySelectorAll('[data-load]').forEach(b => b.onclick = () => { try { load(JSON.parse(localStorage.getItem('et_invicto_slot' + b.dataset.load))); G.HUD.centerMsg('Perfil carregado', 1); } catch (e) { } });
    body.querySelector('#cfgReset').onclick = () => load(clone(DEFAULTS));
    body.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => {
      const p = b.dataset.pre, c = clone(cfg);
      if (p === 'legit') Object.assign(c.legit, { on: true, fov: 3, smooth: 10, rcs: 70, hitbox: 'proximo', trigger: false }), c.rage.on = false;
      if (p === 'rage') Object.assign(c.rage, { on: true, silent: true, autofire: true, autowall: true, hitbox: 'auto', hitchance: 50, doubletap: true, aa: true, fakelag: true, knifebot: true }), Object.assign(c.vis, { esp: true, chams: true, skeleton: true });
      if (p === 'vis') Object.assign(c.vis, { esp: true, box: true, name: true, hp: true, weapon: true, chams: true, radar: true, nadePred: true, noFlash: true, bomb: true }), c.misc.bombTimer = true;
      load(c);
    });
    body.querySelector('#cfgExp').onclick = () => { body.querySelector('#cfgText').value = JSON.stringify(cfg, null, 1); };
    body.querySelector('#cfgImp').onclick = () => { try { load(JSON.parse(body.querySelector('#cfgText').value)); G.HUD.centerMsg('Configuração importada', 1.2); } catch (e) { G.HUD.centerMsg('JSON inválido', 1.5); } };
  }
  function load(obj) {
    const fresh = clone(DEFAULTS); merge(fresh, obj || {});
    for (const k in fresh) cfg[k] = fresh[k];
    save(); worldApplied = ''; G.HUD.icons = {}; renderTabs();
  }
  function renderScripts(body) {
    body.innerHTML = `<div class="cm-group cm-full"><h4>Editor de scripts (JavaScript)</h4><textarea id="luaSrc" spellcheck="false"></textarea>
      <div class="cm-cfg"><button id="luaRun">Executar</button><button id="luaEx1">Exemplo: rodar a cada frame</button><button id="luaEx2">Exemplo: teleporte</button></div><pre id="luaOut"></pre>
      <p class="cm-note">Variáveis: <b>ET</b> (partida), <b>G</b> (motor), <b>Ch</b> (painel). Use <b>Ch.onFrame(fn)</b> para rodar algo todo frame e <b>Ch.clearFrame()</b> para parar.</p></div>`;
    const ta = body.querySelector('#luaSrc'); ta.value = cfg.script;
    ta.oninput = () => { cfg.script = ta.value; save(); };
    const out = body.querySelector('#luaOut');
    body.querySelector('#luaRun').onclick = () => {
      try { const r = new Function('ET', 'G', 'Ch', ta.value)(G.Game, G, Ch); out.textContent = '✓ executado' + (r !== undefined ? ': ' + JSON.stringify(r) : ''); out.className = 'ok'; }
      catch (e) { out.textContent = '✗ ' + e.message; out.className = 'err'; }
    };
    body.querySelector('#luaEx1').onclick = () => { ta.value = "// Mostra a vida do inimigo mais próximo no chat a cada 2 s\nlet acc = 0;\nCh.onFrame(dt => {\n  acc += dt; if (acc < 2) return; acc = 0;\n  const me = ET.human;\n  const e = ET.agents.filter(a => a.alive && a.team !== me.team).sort((a, b) => a.pos.distanceTo(me.pos) - b.pos.distanceTo(me.pos))[0];\n  if (e) Ch.chat('script', e.name + ': ' + Math.ceil(e.hp) + ' HP a ' + Math.round(e.pos.distanceTo(me.pos)) + ' m');\n});"; cfg.script = ta.value; save(); };
    body.querySelector('#luaEx2').onclick = () => { ta.value = "// Teleporta você para o centro do bombsite A\nconst s = G.Map.spots.A;\nET.human.pos.set(s.x, G.Map.groundAt(s.x, s.z), s.z);\nET.human.vel.set(0, 0, 0);"; cfg.script = ta.value; save(); };
  }
  let frameFns = [];
  Ch.onFrame = fn => frameFns.push(fn);
  Ch.clearFrame = () => { frameFns = []; };
  const _afterStep = Ch.afterStep;
  Ch.afterStep = dt => { _afterStep(dt); for (const f of frameFns) { try { f(dt); } catch (e) { console.warn('script', e); } } };

  // ---------------- Abrir/fechar ----------------
  Ch.open = false;
  Ch.toggle = (on) => {
    if (!menu) buildMenu();
    Ch.open = on === undefined ? !Ch.open : on;
    menu.classList.toggle('hidden', !Ch.open);
    if (Ch.open) { renderTabs(); if (document.exitPointerLock) document.exitPointerLock(); }
    else if (G.Game.phase !== 'menu' && !G.Game.isPaused()) G.Game.lock();
  };
  Ch.handleKey = (e, paused) => {
    if (e.code === 'Insert' || e.code === 'F8') { e.preventDefault(); if (paused) G.Game.unpauseNoLock(); Ch.toggle(); return true; }
    if (Ch.open) { if (e.code === 'Escape') Ch.toggle(false); return true; }
    return false;
  };
  // botão no menu de pausa
  const pb = document.getElementById('btnCheats');
  if (pb) pb.onclick = () => { G.Game.unpauseNoLock(); Ch.toggle(true); };
})();
