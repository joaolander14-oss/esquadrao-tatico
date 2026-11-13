// GUARDIÃO — anti-trapaça por estatística e gameplay.
// Não consulta o painel de trapaças: observa apenas o que acontece na partida (tiros, acertos, mira,
// movimento, vida, munição, dinheiro e a pose/posição transmitida aos outros jogadores).
(function () {
  const AC = G.AntiCheat = {};
  const U = G.U;
  const R2D = 180 / Math.PI;
  const Gm = () => G.Game;
  const $ = id => document.getElementById(id);
  const st = new Map();               // estado por agente
  let lastVis = 0, warned = {}, banned = false;

  // detectores: [chave, rótulo, peso por evento, teto]
  const DET = {
    wall: ['Acertos através de paredes sólidas', 12, 72],
    silent: ['Direção da bala diferente da mira (mira silenciosa)', 15, 100],
    recoil: ['Recuo compensado de forma não humana', 4, 100],
    lock: ['Mira travada no centro exato da cabeça', 1, 45],
    spread: ['Dispersão menor que a física da arma permite', 30, 30],
    reaction: ['Tempo de reação sobre-humano', 1, 40],
    trigger: ['Disparo instantâneo ao cruzar a mira (gatilho automático)', 1, 30],
    snap: ['Giros rápidos que param exatamente na cabeça', 8, 48],
    hidden: ['Mira acompanhando inimigos escondidos', 1, 40],
    smoke: ['Acertos dentro de fumaça densa', 6, 30],
    flash: ['Acertos enquanto deveria estar cego', 7, 35],
    damage: ['Dano acima do máximo possível da arma', 50, 100],
    god: ['Dano recebido sem perda de vida', 50, 100],
    ammo: ['Munição recarregada sem tempo de recarga', 20, 60],
    money: ['Dinheiro sem evento que o justifique', 50, 100],
    speed: ['Velocidade acima do limite da arma', 20, 60],
    bhop: ['Sequências de pulos perfeitos', 5, 20],
    hs: ['Taxa de tiros na cabeça improvável', 15, 15],
    aa: ['Pose transmitida diverge da mira (anti-aim)', 10, 40],
    lag: ['Posição transmitida atrasada (fake lag)', 10, 30]
  };
  AC.DET = DET;

  function S(a) {
    let s = st.get(a);
    if (!s) {
      s = { pts: {}, ev: {}, view: [], vis: new Map(), visAng: new Map(), firstHit: new Map(), reactions: [], triggers: [], onTarget: -1, onTargetShot: false,
        hiddenAim: 0, hiddenOpp: 0, hiddenEnemies: new Set(), spreadN: 0, spreadSum: 0, shots: 0, hits: 0, hsHits: 0, kills: 0, hsKills: 0,
        ammo: new WeakMap(), lastShot: -9, money: a.money, moneyOK: 0, speedT: 0, groundT: 0, jumpChain: 0, wasGround: true, blindUntil: -9,
        aaT: 0, lagT: 0, snaps: 0 };
      st.set(a, s);
    }
    return s;
  }
  function flag(a, key, n, note) {
    const s = S(a), d = DET[key];
    s.ev[key] = (s.ev[key] || 0) + (n || 1);
    s.pts[key] = Math.min(d[2], (s.pts[key] || 0) + d[1] * (n || 1));
    if (note) s.lastNote = s.lastNote || {}, s.lastNote[key] = note;
    check(a);
  }
  function setPts(a, key, v) { const s = S(a); s.pts[key] = Math.min(DET[key][2], Math.max(s.pts[key] || 0, v)); check(a); }
  AC.score = a => Object.values(S(a).pts).reduce((x, y) => x + y, 0);
  AC.level = sc => sc >= 100 ? 'Trapaça confirmada' : sc >= 70 ? 'Muito suspeito' : sc >= 40 ? 'Suspeito' : 'Confiável';
  const mode = () => (Gm().settings.anticheat || 'ativo');
  AC.monitorBots = false;                       // teste de falsos positivos: analisa os bots como jogadores
  const mon = a => !Gm().clientMode && (a.isHuman || !!a.remote || AC.monitorBots);

  AC.state = a => S(a);
  AC.reset = () => { st.clear(); warned = {}; banned = false; lastVis = 0; hideBan(); for (const a of (Gm().agents || [])) S(a); };

  // ---------------- Tiros ----------------
  // info: ey/ep = direção legítima (mira + recuo do padrão), by/bp = direção-base usada, inacc = imprecisão física (rad), dev = desvio aplicado no 1º projétil (rad)
  AC.shot = (a, def, info) => {
    if (!a.alive) return;
    const s = S(a), now = Gm().time;
    const firstOfBurst = now - s.lastShot > 0.35;
    s.shots++; s.lastShot = now; s.pend = (s.pend || 0) + 1;
    if (!mon(a)) return;
    // linha de mira-base (antes da dispersão), usada pelos detectores de precisão
    const eye = a.eye();
    s.lastBase = { t: now, eye, dir: U.dirFrom(info.by, info.bp, new THREE.Vector3()) };
    // gatilho automático: com a mira PARADA, quanto tempo o inimigo ficou sob a mira antes do disparo
    const still = angSpeed(s, now, 0.12) < 40;
    if (still && firstOfBurst && !s.onTargetShot) {
      const f = U.dirFrom(a.yaw, a.pitch, new THREE.Vector3());
      if (onEnemy(a, eye, f)) { const start = s.onTarget >= 0 ? s.onTarget : now; s.triggers.push(now - start); s.onTargetShot = true; }
    }
    const dev = Math.hypot(U.angDiff(info.ey, info.by), info.bp - info.ep) * R2D;
    const patMag = Math.hypot(info.pr[0], info.pr[1]);
    if (dev > 1.0 && a.isHuman) {          // bots compensam recuo de propósito (modelo de mira deles)
      if (patMag > 1.2 && dev > patMag * 0.5 && dev < patMag * 1.6) flag(a, 'recoil');
      else flag(a, 'silent', dev > 8 ? 2 : 1, `${dev.toFixed(1)}° fora da mira`);
    }
    if (info.inacc > 0.0175 && def.pellets === 1) {
      s.spreadN++; s.spreadSum += info.dev / info.inacc;
      if (s.spreadN >= 15 && s.spreadSum / s.spreadN < 0.08) setPts(a, 'spread', 30);
    }
  };

  // ---------------- Acertos ----------------
  const tv = new THREE.Vector3();
  AC.hit = (o) => {
    const a = o.shooter, v = o.victim; if (!a || !v || a === v) return;
    const s = S(a), now = Gm().time;
    s.hits++; if (o.group === 'head') s.hsHits++;
    // reação: primeiro acerto desde que o alvo ficou visível
    const since = s.vis.get(v);
    if (since !== undefined && since >= 0 && !s.firstHit.get(v)) { s.firstHit.set(v, true); const r = now - since; if (r < 2 && (s.visAng.get(v) || 0) > 6) s.reactions.push(r); }
    if (!mon(a)) return;
    // parede sólida entre o cano e o ponto do acerto (as caixas não contam: podem ser atravessadas)
    tv.subVectors(o.point, o.from); const L = tv.length(); tv.normalize();
    const blk = G.Map.raycastCells(o.from, tv, Math.max(0, L - 0.25));
    if (blk) flag(a, 'wall', 1, `${Math.round(L)} m, ${o.group}`);
    if (G.Smoke && G.Smoke.blocked(o.from, o.point)) { s.smokeHits = (s.smokeHits || 0) + 1; if (s.smokeHits >= 4) flag(a, 'smoke'); }
    if (now < s.blindUntil && o.point.distanceTo(o.from) > 5) { s.blindHits = (s.blindHits || 0) + 1; if (s.blindHits >= 3) flag(a, 'flash'); }
    const maxDmg = (o.def.dmg || 0) * (o.def.hs || 4) * 1.001;
    if (o.raw > maxDmg && o.def.dmg) flag(a, 'damage', 1, `${Math.round(o.raw)} > ${Math.round(maxDmg)}`);
    // precisão: distância (em raios da cabeça) entre a linha de mira-base e o centro da cabeça
    if (o.group === 'head' && s.lastBase && now - s.lastBase.t < 0.05) {
      const hc = v.aimPoint('head'), b = s.lastBase;
      const w2 = hc.clone().sub(b.eye), along = w2.dot(b.dir), off = Math.sqrt(Math.max(0, w2.lengthSq() - along * along)) / 0.122;
      (s.headOff || (s.headOff = [])).push(off);
      if (s.headOff.length >= 8) {
        // cravado no centro, ou sempre no MESMO ponto da cabeça (humanos espalham os acertos)
        const b2 = s.headOff.slice(-20).sort((x, y) => x - y), iqr = b2[(b2.length * 3) >> 2] - b2[b2.length >> 2], m = median(s.headOff);
        setPts(a, 'lock', m < 0.12 || iqr < 0.04 ? 45 : m < 0.2 || iqr < 0.08 ? 20 : 0);
      }
      // snap: giro rápido que termina cravado no centro (flicks humanos sobram ou faltam)
      const w = angSpeed(s, now, 0.12);
      if (w > 600 && off < 0.15) { s.snaps++; if (s.snaps >= 2) flag(a, 'snap', 1, `${Math.round(w)}°/s, ${(off * 12.2).toFixed(1)} cm do centro`); }
    }
  };
  // dano recebido: vida deveria cair
  AC.damaged = (v, raw, hpBefore, res) => {
    if (!mon(v) || !v.alive || raw < 1) return;
    if (res && !res.killed && v.hp >= hpBefore) flag(v, 'god', 1, `${Math.round(raw)} de dano ignorado`);
  };
  AC.flash = (ag, dur) => { if (dur >= 1.5) { const s = S(ag); s.blindUntil = Math.max(s.blindUntil, Gm().time + dur * 0.7); } };
  AC.kill = (victim, attacker, hs) => {
    if (!attacker || attacker === victim) return;
    const s = S(attacker); s.kills++; if (hs) s.hsKills++;
    if (mon(attacker) && s.kills >= 10 && s.hsKills / s.kills > 0.8) setPts(attacker, 'hs', 15);
    s.moneyOK = Gm().time + 0.3;
  };
  AC.allowMoney = (a) => { const t = Gm().time + 0.3; if (a) S(a).moneyOK = t; else for (const x of Gm().agents) S(x).moneyOK = t; };

  function onEnemy(a, eye, f) {
    for (const e of Gm().agents) {
      if (!e.alive || e.team === a.team) continue;
      for (const hb of e.hitboxes()) { const t = U.rayHitbox(eye, f, hb, 120); if (t >= 0) { const p = eye.clone().addScaledVector(f, t); if (G.Map.los(eye, p) && !G.Smoke.blocked(eye, p)) return true; } }
    }
    return false;
  }
  function angSpeed(s, now, win) {
    let w = 0;
    for (let i = 1; i < s.view.length; i++) {
      const p = s.view[i - 1], q = s.view[i];
      if (q.t < now - win) continue;
      const dt = q.t - p.t; if (dt <= 0) continue;
      w = Math.max(w, Math.hypot(U.angDiff(p.y, q.y), q.p - p.p) * R2D / dt);
    }
    return w;
  }
  const median = arr => { const b = arr.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };

  // ---------------- Amostragem por passo ----------------
  AC.tick = (dt) => {
    const g = Gm(); if (!g.agents || g.phase === 'menu' || g.phase === 'over' || banned || g.clientMode) return;
    const now = g.time, M = G.Map;
    for (const a of g.agents) {
      const s = S(a);
      if (mon(a)) {
        if (a.money > s.money && now > s.moneyOK) flag(a, 'money', 1, `+$${a.money - s.money}`);
        s.money = a.money;
      }
      if (!a.alive) { s.view.length = 0; s.pend = 0; continue; }
      s.view.push({ t: now, y: a.yaw, p: a.pitch }); while (s.view.length > 12) s.view.shift();
      if (mon(a)) {
        const onT = onEnemy(a, a.eye(), U.dirFrom(a.yaw, a.pitch, new THREE.Vector3()));
        if (onT) { if (s.onTarget < 0) s.onTarget = now; } else { s.onTarget = -1; s.onTargetShot = false; }
      }
      // munição: recarga instantânea / infinita
      const w = a.weapon();
      if (w && w.def && w.def.mag) {
        const prev = s.ammo.get(w);
        // munição esperada = anterior − tiros disparados desde o último passo
        const exp = prev === undefined ? undefined : prev - (s.pend || 0);
        if (exp !== undefined && w.ammo > exp && mon(a)) {
          const need = w.def.reload * 0.6;
          if (now - s.lastShot < need) { s.ammoBad = (s.ammoBad || 0) + 1; if (s.ammoBad % 5 === 1) flag(a, 'ammo', 1, `${exp} → ${w.ammo} sem recarregar`); }
        }
        s.ammo.set(w, w.ammo);
      }
      s.pend = 0;
      if (!mon(a)) continue;
      // velocidade no chão
      const maxS = G.PHYS.RUN * ((a.wdef().speed || 250) / 250);
      if (a.onGround) { s.groundT += dt; if (a.speed2d() > maxS * 1.22 && s.groundT > 0.15) { s.speedT += dt; if (s.speedT > 1) { s.speedT = 0; flag(a, 'speed', 1, `${a.speed2d().toFixed(1)} m/s (máx ${maxS.toFixed(1)})`); } } }
      // pulos perfeitos em sequência
      if (s.wasGround && !a.onGround && a.vel.y > 3) { if (s.groundT <= dt * 1.5 && !a.jumpBuffered) s.jumpChain++; else s.jumpChain = 1; if (s.jumpChain === 6 || s.jumpChain === 12) flag(a, 'bhop'); }
      if (!a.onGround) s.groundT = 0;
      s.wasGround = a.onGround;
      // pose transmitida (corpo) x mira
      { const bodyYaw = a.isHuman && G.Cheats ? G.Cheats.modelYaw(a) : a.yaw; const dy = Math.abs(U.angDiff(a.yaw, bodyYaw)) * R2D; if (dy > 45) { s.aaT += dt; if (s.aaT > 2) { s.aaT = 0; flag(a, 'aa', 1, `${Math.round(dy)}°`); } } }
      // posição transmitida
      const np = G.Cheats ? G.Cheats.botSeesPos(a) : a.pos;
      if (np !== a.pos && np.distanceTo(a.pos) > 0.8) { s.lagT += dt; if (s.lagT > 2) { s.lagT = 0; flag(a, 'lag', 1, `${np.distanceTo(a.pos).toFixed(1)} m`); } }
    }
    // visibilidade, reação, gatilho e mira em escondidos (a cada 0,1 s)
    // (a cada passo, só para quem é analisado: o tempo de reação precisa de resolução fina)
    lastVis = now;
    for (const a of g.agents) {
      if (!a.alive || !mon(a)) continue;
      const s = S(a), eye = a.eye(), f = U.dirFrom(a.yaw, a.pitch, new THREE.Vector3());
      const step = Math.max(1e-3, now - (s.lastScan === undefined ? now - dt : s.lastScan)); s.lastScan = now;
      // direção da mira no passo ANTERIOR (antes de qualquer giro feito neste passo)
      const pv = s.view.length > 1 ? s.view[s.view.length - 2] : null, fPrev = pv ? U.dirFrom(pv.y, pv.p, new THREE.Vector3()) : f;
      for (const e of g.agents) {
        if (!e.alive || e.team === a.team) { s.vis.delete(e); continue; }
        const head = e.aimPoint('head'), chest = e.aimPoint('chest');
        const d = eye.distanceTo(chest);
        if (d > 90) { s.vis.delete(e); continue; }
        const visible = (M.los(eye, head) || M.los(eye, chest)) && !G.Smoke.blocked(eye, chest);
        const toE = chest.clone().sub(eye).normalize();
        const ang = Math.acos(U.clamp(f.dot(toE), -1, 1)) * R2D;
        if (visible && ang < 55) { if (!s.vis.has(e) || s.vis.get(e) < 0) { s.vis.set(e, now); s.visAng.set(e, Math.acos(U.clamp(fPrev.dot(toE), -1, 1)) * R2D); s.firstHit.set(e, false); } }
        else s.vis.set(e, -1);
        // 4) mira acompanhando inimigo escondido EM MOVIMENTO (pré-mira num ponto parado não conta)
        const bearing = Math.atan2(toE.x, toE.z), prevB = s.bear ? s.bear.get(e) : undefined;
        (s.bear || (s.bear = new Map())).set(e, bearing);
        const hs = s.hidSince || (s.hidSince = new Map());
        if (visible) hs.delete(e); else if (!hs.has(e)) hs.set(e, now);
        // silencioso = sem passos audíveis e sem atirar recentemente (só um "wallhack" revelaria a posição)
        const loud = (e.onGround && e.speed2d() > G.PHYS.RUN * 0.55 && !e.input.walk && e.crouch < 0.5) || now - e.lastShot < 1.5;
        if (!visible && !loud && mon(a) && d < 45 && d > 4 && prevB !== undefined && now - hs.get(e) > 1.5) {
          const angVel = Math.abs(U.angDiff(prevB, bearing)) * R2D / step;
          if (angVel > 4 && e.speed2d() > 1.0) {
            s.hiddenOpp += step;
            if (ang < 3) { s.hiddenAim += step; s.hiddenEnemies.add(e); }
          }
        }
      }
      if (!mon(a)) continue;
      // avaliações estatísticas
      if (s.reactions.length >= 6) { const m = median(s.reactions); setPts(a, 'reaction', m < 0.09 ? 40 : m < 0.14 ? 30 : 0); }
      const trg = s.triggers.filter(x => x < 1.5);
      if (trg.length >= 8) { const m = median(trg), fast = trg.filter(x => x < 0.05).length / trg.length; setPts(a, 'trigger', m < 0.035 && fast > 0.7 ? 30 : m < 0.06 && fast > 0.6 ? 12 : 0); }
      if (s.hiddenOpp > 8 && s.hiddenEnemies.size >= 2) { const r = s.hiddenAim / s.hiddenOpp; setPts(a, 'hidden', r > 0.35 ? 40 : r > 0.2 ? 25 : 0); }
    }
  };
  function countHidden(a) { let n = 0; for (const e of Gm().agents) if (e.alive && e.team !== a.team && e.pos.distanceTo(a.pos) < 45) n++; return n; }

  // ---------------- Decisão ----------------
  function check(a) {
    if (Gm().clientMode) return;
    // jogador online: o anfitrião remove da partida
    if (a.remote) { if (AC.score(a) >= 100 && mode() === 'ativo' && !a.acKicked && G.MP) { a.acKicked = true; G.MP.kickCheater(a, AC.reasons(a).map(r => r.label)); } return; }
    if (!a.isHuman || banned) return;
    const sc = AC.score(a), m = mode();
    if (m === 'off') return;
    for (const th of [40, 70]) if (sc >= th && !warned[th]) { warned[th] = true; toast(th === 40 ? 'Guardião: comportamento incomum registrado nesta partida.' : 'Guardião: sua conta está sob revisão — vários sinais de trapaça.'); }
    if (sc >= 100 && m === 'ativo') ban(a);
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'ac-toast'; t.innerHTML = `<b>GUARDIÃO</b>${msg}`;
    document.body.appendChild(t); setTimeout(() => t.classList.add('out'), 4200); setTimeout(() => t.remove(), 5000);
  }
  AC.reasons = a => {
    const s = S(a);
    return Object.keys(s.pts).filter(k => s.pts[k] > 0).sort((x, y) => s.pts[y] - s.pts[x]).map(k => ({ k, label: DET[k][0], pts: s.pts[k], ev: s.ev[k] || 0, note: s.lastNote && s.lastNote[k] }));
  };
  function ban(a) {
    banned = true;
    const g = Gm(); g.phase = 'over';
    if (document.exitPointerLock) document.exitPointerLock();
    const rs = AC.reasons(a), sc = AC.score(a);
    try { const hist = JSON.parse(localStorage.getItem('et_guardiao') || '[]'); hist.unshift({ date: Date.now(), map: G.Map.def.name, score: sc, reasons: rs.map(r => r.label) }); localStorage.setItem('et_guardiao', JSON.stringify(hist.slice(0, 20))); } catch (e) { }
    let el = $('acBan'); if (!el) { el = document.createElement('div'); el.id = 'acBan'; document.body.appendChild(el); }
    el.className = '';
    el.innerHTML = `<div class="box"><div class="shield">⛨</div><small>GUARDIÃO · ANTI-TRAPAÇA</small><h1>Removido da partida</h1>
      <p>A análise estatística da sua partida encontrou sinais consistentes de assistência externa. Índice de suspeita: <b>${Math.round(sc)}</b> / 100.</p>
      <div class="list">${rs.map(r => `<div><span>${r.label}</span><em>${r.ev} evento(s)${r.note ? ' · ' + r.note : ''}</em><b>+${Math.round(r.pts)}</b></div>`).join('')}</div>
      <p class="note">O Guardião não verifica programas ou opções ligadas: decide apenas pelo que aconteceu em jogo (mira, tiros, acertos, movimento e estado do personagem).</p>
      <button id="acBack">Voltar ao menu</button></div>`;
    $('acBack').onclick = () => { hideBan(); g.quitToMenu(); };
  }
  function hideBan() { const el = $('acBan'); if (el) el.className = 'hidden'; }

  // ---------------- Relatório (F9) ----------------
  AC.report = () => {
    let el = $('acReport');
    if (el && !el.classList.contains('hidden')) { el.classList.add('hidden'); return; }
    if (!el) { el = document.createElement('div'); el.id = 'acReport'; document.body.appendChild(el); }
    el.classList.remove('hidden');
    renderReport();
  };
  function renderReport() {
    const el = $('acReport'); if (!el || el.classList.contains('hidden')) return;
    const g = Gm(); if (!g.agents) return;
    const rows = g.agents.map(a => {
      const s = S(a), sc = AC.score(a);
      const react = s.reactions.length ? Math.round(median(s.reactions) * 1000) + ' ms' : '—';
      const trg = s.triggers.filter(x => x < 1.5); const trig = trg.length ? Math.round(median(trg) * 1000) + ' ms' : '—';
      const hid = s.hiddenOpp > 5 ? Math.round(s.hiddenAim / s.hiddenOpp * 100) + '%' : '—';
      const spr = s.spreadN ? (s.spreadSum / s.spreadN).toFixed(2) : '—';
      return `<tr class="${a.isHuman ? 'me' : ''}"><td>${a.name}${a.isHuman ? '' : ' <small>(bot)</small>'}</td><td>${s.shots}</td><td>${s.shots ? Math.round(s.hits / s.shots * 100) : 0}%</td><td>${s.hits ? Math.round(s.hsHits / s.hits * 100) : 0}%</td><td>${react}</td><td>${trig}</td><td>${hid}</td><td>${spr}</td><td>${s.ev.wall || 0}</td><td><b class="lv${sc >= 100 ? 3 : sc >= 70 ? 2 : sc >= 40 ? 1 : 0}">${Math.round(sc)}</b></td></tr>`;
    }).join('');
    const h = g.human, rs = h ? AC.reasons(h) : [];
    el.innerHTML = `<div class="box"><header><b>⛨ GUARDIÃO</b><span>Relatório da partida · F9 fecha · modo: ${({ ativo: 'Ativo (remove da partida)', relatorio: 'Só relatório', off: 'Desligado' })[mode()]}</span></header>
      <table><tr><th>Jogador</th><th>Tiros</th><th>Precisão</th><th>Cabeça</th><th>Reação (mediana)</th><th>Gatilho (mediana)</th><th>Mira em escondidos</th><th>Dispersão real/esperada</th><th>Acertos em parede</th><th>Suspeita</th></tr>${rows}</table>
      <h3>Sinais registrados para você: ${h ? AC.level(AC.score(h)) : ''}</h3>
      <div class="sig">${rs.length ? rs.map(r => `<div><span>${r.label}</span><em>${r.ev} evento(s)${r.note ? ' · ' + r.note : ''}</em><b>+${Math.round(r.pts)}</b></div>`).join('') : '<p>Nenhum sinal anormal. Bots aparecem acima como referência de jogo legítimo.</p>'}</div></div>`;
  }
  setInterval(renderReport, 500);
  document.addEventListener('keydown', e => { if (e.code === 'F9') { e.preventDefault(); AC.report(); } });
})();
