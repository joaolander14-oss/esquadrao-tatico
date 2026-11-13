// Inteligência dos bots
(function () {
  const B = G.Bots = {};
  const U = G.U, M = G.Map;
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
  const DIFF = [
    // react: tempo até o 1º tiro (s) · err: erro inicial de mira (graus) · decay: velocidade de correção
    // wob: tremor permanente (graus) · comp: controle de recuo · fov: campo de visão · view: alcance de visão (m)
    { react: [0.75, 1.15], err: 7.5, decay: 0.7, wob: 1.6, turn: 150, head: 0.04, comp: 0.1, fov: 90, view: 45, burst: 0.12 },
    { react: [0.5, 0.8], err: 5.0, decay: 1.1, wob: 1.0, turn: 230, head: 0.12, comp: 0.3, fov: 100, view: 65, burst: 0.16 },
    { react: [0.34, 0.55], err: 3.4, decay: 1.6, wob: 0.6, turn: 330, head: 0.25, comp: 0.5, fov: 112, view: 85, burst: 0.22 },
    { react: [0.22, 0.36], err: 2.2, decay: 2.2, wob: 0.35, turn: 460, head: 0.42, comp: 0.7, fov: 122, view: 110, burst: 0.28 }
  ];
  B.diff = 1;
  B.team = { T: {}, CT: {} };
  const P = () => DIFF[B.diff];

  // ---------------- Compras ----------------
  B.buy = (a, info) => {
    const m0 = a.money;
    const T = a.team === 'T';
    const tryBuy = id => { const d = G.W[id]; if (d && !a.canBuy(d)) { a.buy(d); return true; } return false; };
    if (info.pistolRound) {
      if (Math.random() < 0.55) tryBuy('kevlar');
      else { tryBuy(T ? (Math.random() < 0.5 ? 'cinza' : 'zumbido') : (Math.random() < 0.5 ? 'cinza' : 'raio')); tryBuy('flash'); }
      if (!T && a.money >= 400 && Math.random() < 0.3) tryBuy('kit');
      tryBuy('smoke');
      return;
    }
    const hasPrimary = !!a.inv.primary;
    const fullCost = T ? 3700 : 4100;
    const mode = info.eco[a.team];
    if (hasPrimary || (mode !== 'eco' && a.money >= fullCost) || a.money >= fullCost + 800) {
      if (a.armor < 100 || !a.helmet) tryBuy('kevhelm') || tryBuy('kevlar');
      if (!hasPrimary) {
        const teamAwp = info.awp[a.team];
        if (!teamAwp && a.money >= 4750 + 600 && Math.random() < 0.3) { if (tryBuy('leviata')) info.awp[a.team] = true; }
        if (!a.inv.primary) {
          if (T) tryBuy(a.money >= 2700 ? 'kalash' : 'chacal') || tryBuy('chacal');
          else tryBuy(a.money >= 3100 ? (Math.random() < 0.6 ? 'carabina' : 'carabinasd') : 'garca') || tryBuy('garca');
        }
      }
      if (!T) tryBuy('kit');
      const nades = T ? ['smoke', 'flash', 'molotov', 'he', 'flash'] : ['smoke', 'flash', 'incend', 'he'];
      for (const n of nades) if (a.money >= 300 || n === 'flash') tryBuy(n);
    } else if (mode === 'force' && a.money >= 1500) {
      tryBuy('kevlar');
      const opts = T ? ['vulcao', 'martelo', 'vespao', 'chacal'] : ['lince', 'vespao', 'bloco', 'garca'];
      for (const o of U.shuffle(opts.slice())) if (tryBuy(o)) break;
      tryBuy('flash');
    } else {
      // eco: no máximo uma pistola melhor
      if (a.money > 1200 && Math.random() < 0.4) tryBuy(U.pick(['cinza', 'trovao', T ? 'zumbido' : 'raio']));
      if (a.money > 900 && Math.random() < 0.3) tryBuy('flash');
    }
    a.spent = m0 - a.money;
  };

  // ---------------- Plano da rodada ----------------
  B.roundStart = (agents) => {
    const Ts = agents.filter(a => a.team === 'T' && !a.isHuman && !a.remote);
    const CTs = agents.filter(a => a.team === 'CT' && !a.isHuman && !a.remote);
    const site = Math.random() < 0.5 ? 'A' : 'B';
    const routes = M.spots.routes[site];
    const ri = U.randi(0, routes.length - 1);
    B.team.T = { site, route: ri, execute: false, stageT: 0, decided: false };
    B.team.CT = { rotateTo: null, known: [] };
    U.shuffle(Ts).forEach((a, i) => {
      a.ai = newAI(a);
      a.ai.role = i === Ts.length - 1 && Ts.length >= 4 && Math.random() < 0.5 ? 'lurk' : (i === 0 ? 'entry' : 'support');
      if (a.ai.role === 'lurk') { const other = site === 'A' ? 'B' : 'A'; a.ai.site = other; a.ai.route = M.spots.routes[other][0].slice(0, -1); }
      else { a.ai.site = site; a.ai.route = routes[ri].slice(); }
      a.ai.state = 'route';
      a.ai.delay = U.rand(0, 1.5) + i * 0.3;
    });
    const roles = U.shuffle(['A', 'A', 'B', 'B', 'mid']);
    CTs.forEach((a, i) => {
      a.ai = newAI(a);
      const r = roles[i % roles.length];
      a.ai.role = r;
      const list = r === 'A' ? M.spots.holdA : r === 'B' ? M.spots.holdB : M.spots.holdMid;
      const used = B.team.CT[r + 'used'] = (B.team.CT[r + 'used'] || 0) + 1;
      a.ai.hold = list[(used - 1 + U.randi(0, 1)) % list.length];
      a.ai.state = 'hold';
      a.ai.delay = U.rand(0, 1);
    });
  };
  function newAI(a) {
    return { state: 'idle', path: null, pi: 0, goal: null, repath: 0, target: null, seeT: 0, reacted: false, aimErrX: 0, aimErrY: 0, lastSeen: null, lastSeenT: -99,
      perceive: Math.random() * 0.1, strafeT: 0, strafeDir: 1, burstT: 0, pauseT: 0, stuckT: 0, lastPos: a.pos.clone(), stuckCheck: 0, alertT: 0, heard: null,
      lookYaw: a.yaw, lookPitch: 0, wander: 0, headAim: Math.random() < P().head, delay: 0, nadeDone: false, hunt: 0 };
  }

  // ---------------- Audição ----------------
  B.hear = (src, pos, radius, kind) => {
    for (const a of G.Game.agents) {
      if (a.isHuman || a.remote || !a.alive || !a.ai || (src && a.team === src.team)) continue;
      const d = a.pos.distanceTo(pos);
      if (d > radius) continue;
      if (a.ai.target && a.ai.seeT > 0) continue;
      a.ai.heard = pos.clone(); a.ai.heardT = G.Game.time; a.ai.alertT = 2.2;
      if (kind === 'shot' && d < 30 && src) teamKnow(a.team, pos, G.Game.time);
    }
  };
  B.onNadeThrown = () => {};
  B.onFire = () => {};
  function teamKnow(team, pos, t) {
    if (team !== 'CT') return;
    const k = B.team.CT.known || (B.team.CT.known = []);
    k.push({ pos: pos.clone(), t });
    if (k.length > 12) k.shift();
  }

  // ---------------- Percepção ----------------
  function canSee(a, e) {
    if (!e.alive) return false;
    const eye = a.eye(v1);
    const d = eye.distanceTo(e.pos);
    if (d > P().view) return false;
    const yawTo = U.yawTo(e.pos.x - a.pos.x, e.pos.z - a.pos.z);
    const ang = Math.abs(U.angDiff(a.yaw, yawTo)) * U.R2D;
    const recentlyHit = a.lastAttacker === e && G.Game.time - a.lastHitT < 1.5;
    if (ang > P().fov / 2 && d > 3 && !recentlyHit) return false;
    for (const fr of [0.905, 0.7, 0.35]) {
      v2.set(e.pos.x, e.pos.y + e.height * fr, e.pos.z);
      if (M.los(eye, v2) && !G.Combat.smoked(eye, v2)) return true;
    }
    return false;
  }
  B.canSee = canSee;

  // ---------------- Movimento ----------------
  function setMove(a, dx, dz, run) {
    const L = Math.hypot(dx, dz);
    if (L < 1e-3) { a.input.fwd = 0; a.input.side = 0; return; }
    dx /= L; dz /= L;
    const sy = Math.sin(a.yaw), cy = Math.cos(a.yaw);
    a.input.fwd = dx * -sy + dz * -cy;
    a.input.side = dx * cy + dz * -sy;
    a.input.walk = !run;
  }
  function goTo(a, x, z, dt, run, arriveR, gy) {
    const ai = a.ai;
    if (!ai.goal || Math.hypot(ai.goal.x - x, ai.goal.z - z) > 0.8 || ai.goal.y !== gy || !ai.path) {
      ai.goal = { x, z, y: gy }; ai.path = M.findPath(a.pos.x, a.pos.z, x, z, a.pos.y, gy); ai.pi = 0; ai.repath = 4;
    }
    ai.repath -= dt;
    if (ai.repath <= 0) { ai.path = M.findPath(a.pos.x, a.pos.z, x, z, a.pos.y, gy); ai.pi = 0; ai.repath = 4; }
    const dist = Math.hypot(a.pos.x - x, a.pos.z - z);
    if (dist < (arriveR || 0.7) && (gy === undefined || Math.abs(a.pos.y - gy) < 2.0)) { a.input.fwd = a.input.side = 0; return true; }
    if (!ai.path || !ai.path.length) { setMove(a, x - a.pos.x, z - a.pos.z, run); return false; }
    let wp = ai.path[Math.min(ai.pi, ai.path.length - 1)];
    while (ai.pi < ai.path.length - 1 && Math.hypot(wp.x - a.pos.x, wp.z - a.pos.z) < 0.7) { ai.pi++; wp = ai.path[ai.pi]; }
    let dx = wp.x - a.pos.x, dz = wp.z - a.pos.z;
    // separação de colegas
    for (const o of G.Game.agents) {
      if (o === a || !o.alive) continue;
      const ox = a.pos.x - o.pos.x, oz = a.pos.z - o.pos.z, od = Math.hypot(ox, oz);
      if (od < 1.0 && od > 0.01) { const L = Math.hypot(dx, dz) || 1; dx += ox / od * L * 0.6; dz += oz / od * L * 0.6; }
    }
    // evitar fogo
    const f = G.Combat.inFire(a.pos.x + dx * 0.2, a.pos.z + dz * 0.2);
    if (f && !G.Combat.inFire(a.pos.x, a.pos.z) && ai.state !== 'defuse') { a.input.fwd = a.input.side = 0; return false; }
    setMove(a, dx, dz, run);
    ai.moveYaw = U.yawTo(dx, dz);
    if (G.Map.doors && G.Map.doors.length) G.Map.botDoor(a, dx, dz);
    return false;
  }
  function stuckCheck(a, dt) {
    const ai = a.ai;
    ai.stuckCheck -= dt;
    if (ai.stuckCheck > 0) return;
    ai.stuckCheck = 0.5;
    const moving = Math.abs(a.input.fwd) + Math.abs(a.input.side) > 0.1;
    const moved = Math.hypot(a.pos.x - ai.lastPos.x, a.pos.z - ai.lastPos.z);
    ai.lastPos.copy(a.pos);
    if (moving && moved < 0.25) {
      ai.stuckT += 0.5;
      if (ai.stuckT >= 1) a.input.jump = true;
      if (ai.stuckT >= 1.5) { ai.path = null; ai.unstick = 0.6; ai.unstickDir = Math.random() * Math.PI * 2; }
    } else ai.stuckT = 0;
  }

  // ---------------- Mira ----------------
  function turnTo(a, yaw, pitch, dt, speedMul) {
    const max = P().turn * U.D2R * dt * (speedMul || 1);
    const dy = U.angDiff(a.yaw, yaw);
    a.yaw = U.wrap(a.yaw + U.clamp(dy, -max, max));
    const dp = pitch - a.pitch;
    a.pitch += U.clamp(dp, -max, max);
    return Math.abs(dy) + Math.abs(dp);
  }

  // ---------------- Atualização principal ----------------
  B.update = (a, dt, now, frozen) => {
    const ai = a.ai; if (!ai) return;
    const inp = a.input;
    inp.fire = false; inp.fire2 = false; inp.jump = false; inp.reload = false; inp.use = false; inp.crouch = false; inp.walk = false;
    inp.fwd = 0; inp.side = 0;
    a.recoilComp = P().comp;
    if (frozen) { if (ai.state === 'hold' && ai.hold) turnTo(a, U.yawTo(ai.hold.x - a.pos.x, ai.hold.z - a.pos.z), 0, dt, 0.3); return; }
    if (ai.delay > 0) { ai.delay -= dt; return; }
    const game = G.Game;
    const enemies = game.agents.filter(e => e.alive && e.team !== a.team);
    // escolher arma
    const w = a.weapon();
    if (!ai.target && a.cur !== 'c4' && !a.throwState) {
      const best = a.inv.primary && (a.inv.primary.ammo + a.inv.primary.reserve > 0) ? 'primary' : a.inv.secondary ? 'secondary' : 'knife';
      if (a.cur !== best && ai.state !== 'nade') a.switchTo(best);
    }
    // percepção (a cada 0.1 s)
    ai.perceive -= dt;
    if (ai.perceive <= 0) {
      ai.perceive = 0.1;
      let best = null, bd = 1e9;
      if (a.flashT < 0.6) for (const e of enemies) {
        if (canSee(a, e)) {
          e.spottedT = now;
          const d = a.pos.distanceTo(e.pos) * (e === ai.target ? 0.6 : 1);
          if (d < bd) { bd = d; best = e; }
        }
      }
      if (best) {
        if (best !== ai.target) { ai.target = best; ai.seeT = 0; ai.reacted = false; ai.reactT = U.rand(...P().react) * (a.flashT > 0 ? 2 : 1); const e0 = P().err * U.D2R * (1 + bd / 40); ai.aimErrX = U.rand(-1, 1) * e0 * 2; ai.aimErrY = U.rand(-1, 1) * e0; ai.headAim = Math.random() < P().head; }
        ai.lastSeen = best.pos.clone(); ai.lastSeenT = now; ai.visible = true;
        teamKnow(a.team, best.pos, now);
        if (a.team === 'CT') B.noteSighting(best.pos);
      } else ai.visible = false;
      if (ai.target && !ai.target.alive) { ai.target = null; ai.visible = false; }
    }
    if (ai.target && ai.visible && a.flashT < 0.6) { combat(a, ai, dt, now); stuckCheck(a, dt); return; }
    if (ai.target && !ai.visible) {
      // perdeu o alvo: caçar a última posição por alguns segundos
      if (now - ai.lastSeenT > 5 || !ai.target.alive) { ai.target = null; }
      else {
        ai.hunt = 1;
        const lp = ai.lastSeen;
        const reload = w && w.def.mag && w.ammo < w.def.mag * 0.3 && w.reserve > 0;
        if (reload) inp.reload = true;
        const yawL = U.yawTo(lp.x - a.pos.x, lp.z - a.pos.z);
        turnTo(a, yawL, Math.atan2(lp.y + 1.4 - a.eyeY(), Math.hypot(lp.x - a.pos.x, lp.z - a.pos.z)), dt, 0.8);
        if (a.flashT > 0.5) { inp.fire = Math.random() < 0.3; return; }
        if (a.team === 'CT' && ai.state === 'hold' && game.bomb.state !== 'planted') return; // segura posição
        if (!(a.team === 'T' && a.inv.c4)) { goTo(a, lp.x, lp.z, dt, false, 2); stuckCheck(a, dt); return; }
      }
    }
    // reação a som
    if (ai.alertT > 0 && ai.heard) {
      ai.alertT -= dt;
      const yawH = U.yawTo(ai.heard.x - a.pos.x, ai.heard.z - a.pos.z);
      turnTo(a, yawH, 0, dt, 0.6);
      if (a.team === 'CT' && ai.state === 'hold') return;
    }
    // recarregar com calma
    if (w && w.def.mag && w.ammo < w.def.mag * 0.5 && w.reserve > 0 && a.reloadT <= 0) inp.reload = true;
    // estados por time
    if (a.team === 'T') thinkT(a, ai, dt, now); else thinkCT(a, ai, dt, now);
    // olhar para frente do movimento se não houver outro foco
    if (ai.alertT <= 0 && !ai.lookOverride) {
      const moving = Math.abs(inp.fwd) + Math.abs(inp.side) > 0.1;
      if (moving && ai.moveYaw !== undefined) turnTo(a, ai.moveYaw + Math.sin(now * 0.7 + a.pos.x) * 0.35, -0.03, dt, 0.5);
    }
    ai.lookOverride = false;
    if (ai.unstick > 0) { ai.unstick -= dt; setMove(a, Math.cos(ai.unstickDir), Math.sin(ai.unstickDir), true); inp.jump = Math.random() < 0.1; }
    stuckCheck(a, dt);
  };

  function combat(a, ai, dt, now) {
    const t = ai.target, inp = a.input;
    const w = a.weapon(); const def = w ? w.def : G.W.knife;
    if (def.cat === 'grenade' || def.cat === 'c4') { a.switchTo(a.bestSlot(), true); return; }
    ai.seeT += dt;
    const eye = a.eye(v1);
    // painel: fake lag faz o bot mirar numa posição atrasada; anti-aim atrapalha a mira na cabeça
    const tp = t.isHuman && G.Cheats ? G.Cheats.botSeesPos(t) : t.pos;
    const aa = t.isHuman && G.Cheats && G.Cheats.cfg.rage.aa;
    const ap = t.aimPoint(ai.headAim && !aa ? 'head' : 'chest');
    const aimY = ap.y + (tp.y - t.pos.y);
    const dx = tp.x - a.pos.x, dz = tp.z - a.pos.z, dist = Math.hypot(dx, dz);
    // erro de mira diminui com o tempo de rastreio
    const decay = Math.exp(-dt * P().decay);
    ai.aimErrX *= decay; ai.aimErrY *= decay;
    // levar dano atrapalha a mira
    if (now - a.lastHitT < 0.06) { ai.aimErrX += U.rand(-1, 1) * P().err * 0.5 * U.D2R; ai.aimErrY += U.rand(-0.5, 1) * P().err * 0.4 * U.D2R; }
    // alvo correndo de lado é mais difícil
    const tsp = t.speed2d();
    if (tsp > 2.5) ai.aimErrX += U.rand(-1, 1) * tsp * 0.12 * U.D2R * dt * 10;
    const seed = a.name.length * 1.7;
    const wob = P().wob * U.D2R;
    const yaw = U.yawTo(dx, dz) + ai.aimErrX + Math.sin(now * 2.3 + seed) * wob + (aa ? Math.sin(now * 9 + seed) * 3.5 * U.D2R : 0);
    const pitch = Math.atan2(aimY - eye.y, dist) + ai.aimErrY + Math.sin(now * 1.7 + seed * 2) * wob * 0.6;
    const off = turnTo(a, yaw, pitch, dt, ai.reacted ? 1 : 0.7);
    if (!ai.reacted) { ai.reactT -= dt; if (ai.reactT <= 0) ai.reacted = true; }
    // munição
    if (w && def.mag && w.ammo === 0) {
      if (w.reserve > 0 && dist > 12) { inp.reload = true; }
      else if (a.inv.secondary && a.cur === 'primary') a.switchTo('secondary');
      else if (a.cur !== 'knife' && !(a.inv.secondary && a.inv.secondary.ammo > 0)) a.switchTo('knife');
    }
    // mira com luneta
    if (def.scope && a.zoom === 0 && dist > 8 && a.reloadT <= 0 && now >= a.nextFire) inp.fire2 = !a.fire2Prev;
    // tolerância angular
    const tol = Math.atan2(ai.headAim ? 0.16 : 0.28, dist) + 0.6 * U.D2R;
    const maxS = G.PHYS.RUN * (def.speed || 250) / 250;
    const accurate = a.speed2d() < maxS * 0.36 || def.cat === 'smg' || def.cat === 'heavy' || def.cat === 'knife';
    // movimento em combate: para para atirar, depois strafa entre rajadas
    ai.strafeT -= dt;
    if (ai.strafeT <= 0) { ai.strafeT = U.rand(0.4, 1.0); ai.strafeDir = Math.random() < 0.5 ? -1 : 1; }
    const spray = dist < 14 || def.cat === 'smg' || def.cat === 'heavy';
    if (def.cat === 'knife') {
      const s = setMove(a, dx, dz, true);
      if (dist < 1.8) inp.fire = Math.random() < 0.5; else inp.fire2 = false;
      return;
    }
    if (ai.burstT > 0) {
      ai.burstT -= dt;
      if (ai.reacted && off < tol * 2.5) inp.fire = true;
      if (ai.burstT <= 0) ai.pauseT = spray ? U.rand(0.05, 0.2) : U.rand(0.25, 0.5);
      if (B.diff >= 2 && dist > 18 && a.shotsFired > 2) inp.crouch = Math.random() < 0.6;
    } else if (ai.pauseT > 0) {
      ai.pauseT -= dt;
      if (def.cat !== 'sniper') setMove(a, Math.cos(a.yaw) * ai.strafeDir, -Math.sin(a.yaw) * ai.strafeDir, true);
    } else if (ai.reacted && off < tol && accurate && now >= a.nextFire) {
      ai.burstT = def.auto ? (spray ? U.rand(0.35, 0.9) : P().burst + Math.random() * 0.15) : 0.05;
      inp.fire = true;
    } else if (!accurate) {
      inp.fwd = 0; inp.side = 0;  // freia (contra-strafe)
    } else if (def.cat === 'heavy' && def.pellets > 1 && dist > 9) {
      setMove(a, dx, dz, true);
    }
    // T com a bomba não persegue; CT defendendo também não
    if (a.team === 'CT' && G.Game.bomb.state === 'planted' && ai.state === 'defuse' && dist > 10 && a.defusing > 0) { inp.use = true; inp.fire = false; }
  }

  // ---------------- Insurgentes ----------------
  function thinkT(a, ai, dt, now) {
    const game = G.Game, bomb = game.bomb, team = B.team.T, inp = a.input;
    // bomba no chão: alguém vai pegar
    if (bomb.state === 'dropped') {
      const d = G.Combat.drops.find(x => x.inst.def.id === 'c4');
      if (d) {
        const ts = game.agents.filter(x => x.alive && x.team === 'T' && !x.isHuman && !x.remote);
        ts.sort((p, q) => p.pos.distanceTo(d.pos) - q.pos.distanceTo(d.pos));
        if (ts[0] === a) { goTo(a, d.pos.x, d.pos.z, dt, true, 0.3, d.pos.y); return; }
      }
    }
    if (bomb.state === 'planted') {
      // posições pós-plant
      if (!ai.post) {
        const list = bomb.site === 'A' ? M.spots.postA : M.spots.postB;
        ai.post = list[U.randi(0, list.length - 1)];
      }
      const arrived = goTo(a, ai.post.x, ai.post.z, dt, true, 0.8, ai.post.y);
      if (arrived) { ai.lookOverride = true; turnTo(a, ai.post.yaw + Math.sin(now * 0.5) * 0.4, 0, dt, 0.4); inp.crouch = Math.random() < 0.02 ? !inp.crouch : inp.crouch; }
      return;
    }
    const timeLeft = game.roundTimeLeft();
    // carregador: ir plantar
    if (a.inv.c4) {
      const zone = M.zoneAt(a.pos.x, a.pos.z, a.pos.y);
      const site = ai.site || team.site;
      const ready = team.execute || timeLeft < 40 || ai.routeDone;
      if (zone === site || (zone === 'A' || zone === 'B') && timeLeft < 30) {
        if (!ai.plantSpot) ai.plantSpot = U.pick(site === 'A' ? M.spots.plantA : M.spots.plantB);
        const there = goTo(a, ai.plantSpot.x, ai.plantSpot.z, dt, true, 1.2, ai.plantSpot.y);
        if (there || zone === site && Math.random() < 0.003) {
          if (a.cur !== 'c4') a.switchTo('c4');
          inp.use = true; inp.fwd = inp.side = 0; inp.crouch = true;
        }
        return;
      }
      if (!ready && ai.route && ai.route.length > 1) { followRoute(a, ai, dt, now, team); return; }
      const sc = M.siteCenter(site);
      goTo(a, sc.x, sc.z, dt, true, 1, sc.y);
      return;
    }
    if (timeLeft < 35 && !team.execute) team.execute = true;
    followRoute(a, ai, dt, now, team);
  }
  function followRoute(a, ai, dt, now, team) {
    const r = ai.route;
    if (!r || !r.length) { ai.routeDone = true; const sc = M.siteCenter(ai.site || team.site); if (goTo(a, sc.x, sc.z, dt, true, 3, sc.y)) idleLook(a, ai, dt, now); return; }
    ai.ri = ai.ri || 0;
    const staging = r.length - 2;
    if (ai.ri > staging && !team.execute) {
      // esperar o grupo no ponto de preparação
      team.stageT += dt / Math.max(1, G.Game.agents.filter(x => x.alive && x.team === 'T').length);
      const groupHere = G.Game.agents.filter(x => x.alive && x.team === 'T' && !x.isHuman && !x.remote && x.ai && x.ai.role !== 'lurk' && x.ai.ri > staging).length;
      const groupAll = G.Game.agents.filter(x => x.alive && x.team === 'T' && !x.isHuman && !x.remote && x.ai && x.ai.role !== 'lurk').length;
      if (groupHere >= groupAll || team.stageT > 10) team.execute = true;
      idleLook(a, ai, dt, now);
      return;
    }
    if (ai.ri >= r.length) { ai.routeDone = true; const sc = M.siteCenter(ai.site); goTo(a, sc.x + U.rand(-3, 3), sc.z + U.rand(-3, 3), dt, true, 3, sc.y); return; }
    const wp = r[ai.ri];
    // granadas de execução
    if (team.execute && ai.ri === r.length - 1 && !ai.nadeDone && (ai.role === 'entry' || ai.role === 'support')) {
      ai.nadeDone = true;
      const sc = M.siteCenter(ai.site);
      const id = a.inv.grenades.includes('flash') ? 'flash' : a.inv.grenades.includes('smoke') ? 'smoke' : null;
      if (id) { lobAt(a, sc.x + U.rand(-3, 3), sc.z + U.rand(-4, 0), id); return; }
    }
    const lurkSlow = ai.role === 'lurk' && G.Game.roundTime < 30;
    if (goTo(a, wp.x, wp.z, dt, !lurkSlow, 1.5, wp.y)) ai.ri++;
  }
  function lobAt(a, x, z, id) {
    const dx = x - a.pos.x, dz = z - a.pos.z, R = Math.hypot(dx, dz);
    const v = 19, g = 16.24;
    let s = R * g / (v * v); s = U.clamp(s, -1, 1);
    const ang = Math.PI / 2 - 0.5 * Math.asin(s); // arco alto para passar sobre paredes
    const yaw = U.yawTo(dx, dz);
    a.yaw = yaw;
    G.Combat.throwNade(a, id, 1, yaw, Math.min(ang, 1.2) - 6 * U.D2R);
  }
  function idleLook(a, ai, dt, now) {
    ai.lookOverride = true;
    ai.wander -= dt;
    if (ai.wander <= 0) { ai.wander = U.rand(1, 2.5); ai.wanderYaw = a.yaw + U.rand(-1, 1); }
    turnTo(a, ai.wanderYaw, 0, dt, 0.3);
  }

  // ---------------- Força Tática ----------------
  B.noteSighting = (pos) => {
    const t = B.team.CT;
    const nearA = Math.hypot(pos.x - M.spots.A.x, pos.z - M.spots.A.z) < 22;
    const nearB = Math.hypot(pos.x - M.spots.B.x, pos.z - M.spots.B.z) < 22;
    if (nearA) t.seenA = (t.seenA || 0) + 1;
    if (nearB) t.seenB = (t.seenB || 0) + 1;
    if (!t.rotateTo && (t.seenA || 0) >= 4) t.rotateTo = 'A';
    if (!t.rotateTo && (t.seenB || 0) >= 4) t.rotateTo = 'B';
  };
  function thinkCT(a, ai, dt, now) {
    const game = G.Game, bomb = game.bomb, inp = a.input;
    if (bomb.state === 'planted') {
      const bp = bomb.pos;
      const d = Math.hypot(a.pos.x - bp.x, a.pos.z - bp.z, a.pos.y - bp.y);
      // alguém já desarmando?
      const defuser = game.agents.find(x => x.alive && x.team === 'CT' && x.defusing > 0 && x !== a);
      if (defuser && d < 12) { ai.lookOverride = true; idleLook(a, ai, dt, now); return; }
      const arrived = goTo(a, bp.x, bp.z, dt, true, 0.9, bp.y);
      if (arrived || d < 1.2) {
        ai.state = 'defuse';
        inp.use = true; inp.fwd = inp.side = 0; inp.crouch = true;
        ai.lookOverride = true;
        turnTo(a, U.yawTo(bp.x - a.pos.x, bp.z - a.pos.z), -0.6, dt, 0.5);
      }
      return;
    }
    // rotação
    const rot = B.team.CT.rotateTo;
    if (rot && ai.role !== rot && ai.role !== 'mid' && !ai.rotated) {
      ai.rotated = true; ai.role = rot;
      const list = rot === 'A' ? M.spots.holdA : M.spots.holdB;
      ai.hold = U.pick(list);
    }
    if (ai.hold) {
      const arrived = goTo(a, ai.hold.x, ai.hold.z, dt, !ai.rotated || true, 0.6, ai.hold.y);
      if (arrived) {
        ai.lookOverride = true;
        if (ai.alertT <= 0) turnTo(a, ai.hold.yaw + Math.sin(now * 0.4 + a.pos.z) * 0.35, -0.02, dt, 0.35);
        // CT com incendiária joga na entrada quando inimigos aparecem
        if (B.team.CT.rotateTo === ai.role && !ai.nadeDone && (a.inv.grenades.includes('incend') || a.inv.grenades.includes('he'))) {
          ai.nadeDone = true;
          const k = (B.team.CT.known || []).slice(-1)[0];
          if (k && now - k.t < 3) lobAt(a, k.pos.x, k.pos.z, a.inv.grenades.includes('incend') ? 'incend' : 'he');
        }
      }
    }
  }
})();
