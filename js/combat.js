// Combate: disparos, recuo, imprecisão, penetração, faca, taser, granadas, armas largadas e efeitos
(function () {
  const C = G.Combat = {};
  const U = G.U, M = G.Map;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3();
  let scene = null;
  C.nades = []; C.smokes = []; C.fires = []; C.drops = []; C.fx = [];
  C.init = (sc) => {
    scene = sc;
    C.clearRound();
    // pool de decalques
    C.decalGeo = new THREE.PlaneGeometry(0.14, 0.14);
    C.decalMat = new THREE.MeshBasicMaterial({ map: G.Tex.get('decal', 64), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    C.decals = []; C.decalIdx = 0;
    for (let i = 0; i < 140; i++) { const m = new THREE.Mesh(C.decalGeo, C.decalMat); m.visible = false; scene.add(m); C.decals.push(m); }
    C.smokeTex = G.Tex.get('smoke', 128); C.fireTex = G.Tex.get('fire', 64); C.flashTex = G.Tex.get('flashSprite', 64); C.bloodTex = G.Tex.get('blood', 64);
    G.Smoke.init(scene);
    C.tracerMat = new THREE.LineBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.75 });
  };
  C.clearRound = () => {
    if (!scene) return;
    for (const n of C.nades) scene.remove(n.mesh);
    if (G.Smoke) G.Smoke.clear();
    for (const f of C.fires) scene.remove(f.group);
    for (const d of C.drops) scene.remove(d.mesh);
    for (const e of C.fx) scene.remove(e.obj);
    C.nades = []; C.fires = []; C.drops = []; C.fx = [];
    if (C.decals) for (const d of C.decals) d.visible = false;
  };

  // ---------------- Imprecisão ----------------
  C.inaccuracy = (a, def) => {
    const scoped = a.zoom > 0 && def.scoped;
    const I = scoped ? Object.assign({}, def.inacc, def.scoped) : def.inacc;
    let base = a.crouch > 0.5 ? I.crouch : I.stand;
    const maxS = G.PHYS.RUN * (def.speed || 250) / 250;
    const sp = a.speed2d();
    const frac = U.clamp((sp - maxS * 0.34) / (maxS * 0.66), 0, 1);
    let mv = I.move * frac;
    let air = 0;
    if (!a.onGround) { air = I.jump; if (def.id === 'pardal' && Math.abs(a.vel.y) < 0.8) air = 0.15; }
    let tot = base + mv + air + a.spread;
    const inst = a.weapon();
    if (inst && inst.silencer && def.cat !== 'smg') tot *= 0.9;
    return Math.max(0.01, tot);
  };

  // ---------------- Lógica de arma por agente ----------------
  C.updateWeapon = (a, dt, now, frozen) => {
    const inst = a.weapon();
    const def = inst ? inst.def : G.W.knife;
    const inp = a.input;
    // recuperação de recuo/imprecisão
    const I = def.inacc || { rec: 6 };
    if (a.spread > 0) a.spread = Math.max(0, a.spread - I.rec * dt); else if (a.spread < 0) a.spread = Math.min(0, a.spread + 2 * dt);
    const iv = W_interval(def);
    if (now - a.lastShot > iv * 1.6) a.shotsFired = Math.max(0, a.shotsFired - dt * (def.recoil ? def.recoil.rec : 9));
    const pat = def.pattern || [[0, 0]];
    const fi = Math.min(a.shotsFired, pat.length - 1), i0 = Math.floor(fi), i1 = Math.min(i0 + 1, pat.length - 1), fr = fi - i0;
    const tx = U.lerp(pat[i0][0], pat[i1][0], fr), ty = U.lerp(pat[i0][1], pat[i1][1], fr);
    const k = Math.min(1, dt * 22);
    a.punch.x += (tx - a.punch.x) * k; a.punch.y += (ty - a.punch.y) * k;
    a.flashT = Math.max(0, a.flashT - dt);
    if (a.drawT > 0) { a.drawT -= dt; a.firePrev = inp.fire; a.fire2Prev = inp.fire2; return; }
    if (frozen) { a.firePrev = inp.fire; a.fire2Prev = inp.fire2; return; }
    if (a.planting > 0 || a.defusing > 0) { a.firePrev = inp.fire; return; }

    // granadas
    if (def.cat === 'grenade') { if (!a.remote) nadeLogic(a, def, inp, now, dt); a.firePrev = inp.fire; a.fire2Prev = inp.fire2; return; }
    if (def.cat === 'c4') { a.firePrev = inp.fire; return; }

    // recarga
    if (a.reloadT > 0) {
      a.reloadT -= dt;
      if (def.shellReload) {
        if (inp.fire && !a.firePrev && inst.ammo > 0) { a.reloadT = 0; }
        else if (a.reloadT <= 0) {
          if (inst.ammo < def.mag && inst.reserve > 0) { inst.ammo++; inst.reserve--; if (a.isHuman) G.Audio.shell(); }
          if (inst.ammo < def.mag && inst.reserve > 0) a.reloadT = def.reload; else a.reloadT = 0;
        }
      } else if (a.reloadT <= 0) {
        const take = Math.min(def.mag - inst.ammo, inst.reserve);
        inst.ammo += take; inst.reserve -= take; a.reloadT = 0;
      }
      if (a.reloadT > 0 || !def.shellReload) { a.firePrev = inp.fire; a.fire2Prev = inp.fire2; return; }
    }
    if (inp.reload && inst && def.mag && inst.ammo < def.mag && inst.reserve > 0 && def.cat !== 'equip') startReload(a, inst, def);
    // jogador online: tiros chegam como mensagens (C.remoteShot), não pelo botão
    if (a.remote) { a.firePrev = inp.fire; a.fire2Prev = inp.fire2; return; }

    // botão secundário
    if (inp.fire2 && !a.fire2Prev) {
      if (def.cat === 'knife') { if (now >= a.nextFire) knifeAttack(a, true, now); }
      else if (def.scope) { inst.zoom = (inst.zoom + 1) % (def.scope.length + 1); a.zoom = inst.zoom; if (a.isHuman) G.Audio.click(0.15); }
      else if (def.burst) { inst.burst = !inst.burst; if (a.isHuman) G.HUD.centerMsg(inst.burst ? 'Modo rajada' : 'Modo ' + (def.auto ? 'automático' : 'semiautomático'), 1.2); }
      else if (def.silencer === true) { inst.silencer = !inst.silencer; a.drawT = 1.4; if (a.isHuman) G.HUD.centerMsg(inst.silencer ? 'Supressor colocado' : 'Supressor removido', 1.2); }
    }
    a.fire2Prev = inp.fire2;

    // rajada em andamento
    if (a.burstLeft > 0) {
      if (now >= a.nextFire) {
        if (inst.ammo > 0) { fireShot(a, inst, def, now); a.burstLeft--; a.nextFire = now + 0.055; if (a.burstLeft === 0) a.nextFire = now + 0.35; }
        else a.burstLeft = 0;
      }
      a.firePrev = inp.fire; return;
    }
    // disparo
    const pressed = inp.fire && !a.firePrev;
    const wantFire = def.auto && !(inst && inst.burst) ? inp.fire : pressed;
    if (wantFire && now >= a.nextFire) {
      if (def.cat === 'knife') knifeAttack(a, false, now);
      else if (inst.ammo <= 0) {
        if (pressed) { if (a.isHuman) G.Audio.click(0.4); a.nextFire = now + 0.2; }
        if (inst.reserve > 0) startReload(a, inst, def);
      } else if (inst.burst) { a.burstLeft = 3; a.nextFire = now; }
      else {
        fireShot(a, inst, def, now);
        a.nextFire = now + W_interval(def);
        if (inst.ammo <= 0 && inst.reserve > 0 && !def.shellReload) setTimeout(() => { if (a.alive && a.weapon() === inst && inst.ammo === 0) startReload(a, inst, def); }, 250);
      }
    }
    a.firePrev = inp.fire;
  };
  function W_interval(def) { return 60 / (def.rpm || 60); }
  function startReload(a, inst, def) {
    if (a.reloadT > 0 || !def.mag) return;
    a.reloadT = def.reload; a.zoom = 0; inst.zoom = 0; a.burstLeft = 0;
    if (a.isHuman) { if (!def.shellReload) G.Audio.reload(def.reload); }
  }
  C.startReload = startReload;

  // ---------------- Tiro ----------------
  function fireShot(a, inst, def, now, ov) {
    inst.ammo--;
    a.lastShot = now;
    const eye = a.eye(tmp);
    const idx = Math.min(Math.floor(a.shotsFired), def.pattern.length - 1);
    const pr = def.pattern[idx];
    let yaw = a.yaw - pr[0] * U.D2R * 1.0, pitch = a.pitch + pr[1] * U.D2R * 1.0;
    // compensação de recuo dos bots
    if (!a.isHuman && a.recoilComp) { yaw += pr[0] * U.D2R * a.recoilComp; pitch -= pr[1] * U.D2R * a.recoilComp; }
    const cheat = a.isHuman && G.Cheats;
    if (cheat) { const o = G.Cheats.shotDir(a, pr); if (o) { yaw = o.yaw; pitch = o.pitch; } }
    if (ov) { yaw = ov.yaw; pitch = ov.pitch; }                      // tiro de um jogador online (direção que ele mandou)
    if (G.Game.clientMode && a.isHuman && G.MP) G.MP.ownShot(a, a.yaw, a.pitch, yaw, pitch);
    const physInacc = C.inaccuracy(a, def) * U.D2R;
    const inacc = physInacc * (cheat ? G.Cheats.spreadMul() : 1);
    const pellets = def.pellets;
    const scoped = a.zoom > 0;
    const rndR = () => (pellets > 1 ? Math.sqrt(Math.random()) : Math.pow(Math.random(), 0.8)) * inacc;
    const r0 = rndR();
    // o Guardião registra o disparo ANTES do traçado (os acertos usam a linha de mira deste tiro)
    if (G.AntiCheat) G.AntiCheat.shot(a, def, { ey: a.yaw - pr[0] * U.D2R, ep: a.pitch + pr[1] * U.D2R, by: yaw, bp: pitch, inacc: physInacc, dev: r0, pr });
    for (let p = 0; p < pellets; p++) {
      const r = p === 0 ? r0 : rndR(), th = Math.random() * Math.PI * 2;
      const dir = U.dirFrom(yaw + Math.cos(th) * r, pitch + Math.sin(th) * r, tmp2).clone();
      const end = trace(a, eye.clone(), dir, def, def.dmg, p === 0, inst.silencer || def.silencer === 'fixed');
      if (cheat && end) G.Cheats.onShot(eye.clone(), end);
      if (end) G.Smoke.carve(eye, end);
    }
    a.shotsFired += 1;
    a.spread = U.clamp(a.spread + def.inacc.shot, -(def.inacc.stand - 0.25), def.inacc.max);
    if (def.bolt && scoped) { const z = inst.zoom; inst.zoom = 0; a.zoom = 0; setTimeout(() => { if (a.alive && a.weapon() === inst && a.reloadT <= 0 && inst.ammo > 0) { inst.zoom = z; a.zoom = z; } }, W_interval(def) * 1000 * 0.95); if (a.isHuman) G.Audio.bolt(); }
    const sil = inst.silencer || def.silencer === 'fixed';
    if (G.MP && G.MP.role === 'host') G.MP.emit('f', { i: G.Game.agents.indexOf(a), w: def.id, y: +yaw.toFixed(4), p: +pitch.toFixed(4), s: sil ? 1 : 0 }, a);
    G.Audio.shot(def, eye, sil, a.isHuman);
    if (G.Bots) G.Bots.hear(a, a.pos, sil ? 9 : (def.cat === 'sniper' ? 70 : 50), 'shot');
    a.revealT = sil ? 0.4 : 1.5;
    if (!a.isHuman || G.Game.spectating) muzzleFlash3P(a);
    if (a.onFire) a.onFire(def);
    if (def.id === 'taser') { a.inv.taser = null; setTimeout(() => { if (a.alive && a.cur === 'taser') a.switchTo(a.bestSlot(), true); }, 400); }
  }

  // traça uma bala com penetração
  function trace(shooter, o, d, def, dmg, showTracer, silenced) {
    let remaining = def.range, travelled = 0, pens = 0;
    const startO = o.clone();
    for (let seg = 0; seg < 4; seg++) {
      const ch = M.raycastCells(o, d, remaining);
      const tCell = ch ? ch.t : remaining;
      const cellN = ch ? [ch.nx, ch.ny, ch.nz] : null;
      const pr = M.rayProps(o, d, tCell);
      const tObs = pr.length ? Math.min(pr[0].t, tCell) : tCell;
      // jogadores (com autowall do painel, testa também atrás das paredes)
      const aw = shooter.isHuman && G.Cheats && G.Cheats.autowall();
      const tLim = aw ? remaining : tObs;
      let best = null;
      for (const ag of G.Game.agents) {
        if (!ag.alive || ag === shooter) continue;
        if (Math.abs(ag.pos.x - o.x) > tLim + 2 && Math.abs(ag.pos.z - o.z) > tLim + 2) continue;
        // descarte rápido: o raio passa a menos de 1,6 m do agente?
        tmp3.set(ag.pos.x, ag.pos.y + 1, ag.pos.z);
        if (U.raySphere(o, d, tmp3, 1.6, tLim) < 0 && tmp3.distanceTo(o) > 1.6) continue;
        for (const hb of ag.hitboxes()) {
          const t = U.rayHitbox(o, d, hb, tLim);
          if (t >= 0 && t < tLim && (!best || t < best.t)) best = { t, ag, g: hb.g };
        }
      }
      if (best) {
        if (aw && best.t > tObs) dmg *= 0.55;
        const dist = travelled + best.t;
        const mult = best.g === 'head' ? def.hs : best.g === 'stomach' ? 1.25 : best.g === 'legs' ? 0.75 : 1;   // braços e peito = 1
        const fall = Math.pow(def.falloff, dist / 12.7);
        let raw = dmg * fall * mult;
        if (shooter.isHuman && G.Cheats && G.Cheats.cfg.srv.onehit) raw = 999;
        const hp = tmp3.copy(o).addScaledVector(d, best.t).clone();
        const helm = best.g === 'head' && best.ag.helmet && best.ag.armor > 0;
        const hpBefore = best.ag.hp;
        const res = best.ag.applyDamage(raw, def.ap === undefined ? 1 : def.ap, best.g, shooter, def, startO);
        if (G.AntiCheat) { G.AntiCheat.hit({ shooter, victim: best.ag, group: best.g, raw, def, from: startO, point: hp }); G.AntiCheat.damaged(best.ag, raw, hpBefore, res); }
        G.Audio.hit(hp, best.g === 'head', helm && def.ap < 0.99);
        blood(hp);
        if (shooter.remote && G.MP) G.MP.toAgent(shooter, { t: 'hm', h: best.g === 'head' ? 1 : 0, k: res.killed ? 1 : 0 });
        if (shooter.isHuman && !G.Game.clientMode) { G.HUD.hitmarker(best.g === 'head', res.killed); G.Audio.hitConfirm(best.g === 'head'); if (G.Cheats) G.Cheats.onHit(best.ag, res.hp, hp, best.g === 'head'); }
        if (showTracer && !silenced) tracer(startO, hp);
        return hp;
      }
      const hitPt = o.clone().addScaledVector(d, tObs);
      if (tObs >= remaining - 1e-3 && !ch && !pr.length) { if (showTracer && !silenced) tracer(startO, hitPt); return hitPt; }
      // impacto
      if (pr.length && pr[0].t <= tCell) {
        const p = pr[0];
        if (p.prop.type === 'window') {          // vidro: estilhaça e a bala segue quase sem perder força
          if (!G.Game.clientMode) G.Map.breakWindow(p.prop, startO);
          o = o.clone().addScaledVector(d, p.tOut + 0.02); travelled += p.tOut + 0.02; remaining -= p.tOut + 0.02; dmg *= 0.95;
          continue;
        }
        const n = propNormal(p.prop, hitPt);
        impact(hitPt, n, p.prop.type);
        if (p.prop.type === 'door' && !G.Game.clientMode) G.Map.hitDoor(p.prop, hitPt);   // estilhaça o pedaço atingido
        if (def.pen >= p.prop.pen * 0.75 && pens < 2) {
          // atravessa
          const exitT = p.tOut;
          const ex = o.clone().addScaledVector(d, exitT + 0.01);
          impact(ex, [-n[0], -n[1], -n[2]], p.prop.type, true);
          dmg *= p.prop.pen === 1 ? 0.62 : 0.4;
          travelled += exitT; remaining -= exitT; o = ex; pens++;
          continue;
        }
        if (showTracer && !silenced) tracer(startO, hitPt);
        return hitPt;
      }
      impact(hitPt, cellN, 'wall');
      if (showTracer && !silenced) tracer(startO, hitPt);
      return hitPt;
    }
    return o.clone();
  }
  function propNormal(p, pt) {
    const e = 0.03;
    if (Math.abs(pt.x - p.x1) < e) return [-1, 0, 0]; if (Math.abs(pt.x - p.x2) < e) return [1, 0, 0];
    if (Math.abs(pt.z - p.z1) < e) return [0, 0, -1]; if (Math.abs(pt.z - p.z2) < e) return [0, 0, 1];
    if (Math.abs(pt.y - p.y2) < e) return [0, 1, 0]; return [0, -1, 0];
  }

  // ---------------- Faca / Taser ----------------
  function knifeAttack(a, heavy, now) {
    if (G.Game.clientMode && a.isHuman && G.MP) G.MP.ownKnife(heavy);
    if (G.MP && G.MP.role === 'host') G.MP.emit('kn', { i: G.Game.agents.indexOf(a) }, a);
    a.nextFire = now + (heavy ? 1.0 : 0.42);
    a.lastShot = now; a.knifeHeavy = heavy;
    G.Audio.knife(a.pos);
    const eye = a.eye(tmp);
    let best = null;
    for (const off of [0, -0.12, 0.12]) {
      const d = U.dirFrom(a.yaw + off, a.pitch, tmp2);
      for (const ag of G.Game.agents) {
        if (!ag.alive || ag === a) continue;
        if (ag.pos.distanceTo(a.pos) > 3) continue;
        for (const hb of ag.hitboxes()) {
          const t = U.rayHitbox(eye, d, hb, 1.9, 0.1);
          if (t >= 0 && (!best || t < best.t)) best = { t, ag };
        }
      }
    }
    if (!best) {
      const d = U.dirFrom(a.yaw, a.pitch, tmp2);
      const h = M.raycast(eye, d, 1.8);
      if (h) impact(eye.clone().addScaledVector(d, h.t), [h.nx, h.ny, h.nz], 'wall');
      return;
    }
    const v = best.ag;
    const back = Math.cos(U.angDiff(v.yaw, U.yawTo(v.pos.x - a.pos.x, v.pos.z - a.pos.z))) > 0.5;
    const dmg = heavy ? (back ? 180 : 65) : (back ? 90 : 40);
    v.applyDamage(dmg, 0.85, 'chest', a, G.W.knife, a.pos);
    G.Audio.hit(v.pos, false);
    blood(tmp3.set(v.pos.x, v.pos.y + 1.2, v.pos.z));
    if (a.isHuman && !G.Game.clientMode) G.HUD.hitmarker(false, !v.alive);
    if (a.remote && G.MP) G.MP.toAgent(a, { t: 'hm', h: 0, k: v.alive ? 0 : 1 });
  }
  // taser usa fireShot comum (dano 500, alcance 3.5) — consome após uso
  const _origFire = fireShot;

  // ---------------- Granadas ----------------
  function nadeLogic(a, def, inp, now) {
    if (!a.throwState) {
      if ((inp.fire && !a.firePrev) || (inp.fire2 && !a.fire2Prev)) { a.throwState = { t: now }; if (a.isHuman) G.Audio.pin(); }
      return;
    }
    if (now - a.throwState.t < 0.35) return;
    if (!inp.fire && !inp.fire2) {
      const strength = (a.lastFireBtn === 'both') ? 0.7 : (a.lastFireBtn === 'right' ? 0.42 : 1);
      C.throwNade(a, def.id, strength);
      a.throwState = null; a.lastFireBtn = null;
    } else a.lastFireBtn = inp.fire && inp.fire2 ? 'both' : inp.fire ? 'left' : 'right';
  }
  C.throwNade = (a, id, strength, yawO, pitchO) => {
    const i = a.inv.grenades.indexOf(id);
    if (i < 0) return;
    a.inv.grenades.splice(i, 1);
    const def = G.W[id];
    if (G.Game.clientMode && a.isHuman && G.MP) G.MP.ownNade(id, strength, yawO !== undefined ? yawO : a.yaw, pitchO !== undefined ? pitchO : a.pitch);
    const yaw = yawO !== undefined ? yawO : a.yaw, pitch = (pitchO !== undefined ? pitchO : a.pitch) + 6 * U.D2R;
    const dir = U.dirFrom(yaw, pitch, new THREE.Vector3());
    const pos = a.eye(new THREE.Vector3()).addScaledVector(dir, 0.4);
    if (M.pointSolid(pos.x, pos.y, pos.z)) pos.copy(a.eye(new THREE.Vector3()));
    const vel = dir.multiplyScalar(19 * strength).add(tmp.copy(a.vel).multiplyScalar(1.0));
    const mesh = G.Models.gun(def); mesh.scale.setScalar(1.3);
    mesh.position.copy(pos); scene.add(mesh);
    C.nades.push({ id, def, pos, vel, t: 0, owner: a, mesh, rest: 0, done: false, decoyT: 0 });
    if (G.MP && G.MP.role === 'host') G.MP.emit('nd', { i: G.Game.agents.indexOf(a), id, p: [pos.x, pos.y, pos.z], v: [vel.x, vel.y, vel.z] }, a);
    a.lastShot = G.Game.time;
    if (a.isHuman) G.Audio.knife(null);
    a.nadeIdx = 0;
    if (!a.inv.grenades.length) setTimeout(() => { if (a.alive && a.cur === 'grenade') a.switchTo(a.bestSlot(), true); }, 300);
    else a.drawT = 0.4;
    if (G.Bots) G.Bots.onNadeThrown(a, id);
  };
  function stepNade(n, dt) {
    const sub = 4, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      n.vel.y -= 20.3 * 0.4 * h * 2;
      const nx = n.pos.x + n.vel.x * h, ny = n.pos.y + n.vel.y * h, nz = n.pos.z + n.vel.z * h;
      if (!G.Game.clientMode && M.windows) for (const w of M.windows) if (!w.off && nx > w.x1 - 0.05 && nx < w.x2 + 0.05 && ny > w.y1 && ny < w.y2 && nz > w.z1 - 0.05 && nz < w.z2 + 0.05) { M.breakWindow(w, n.pos); n.vel.multiplyScalar(0.7); }
      if (!M.pointSolid(nx, ny, nz)) { n.pos.set(nx, ny, nz); continue; }
      let hitGround = false;
      const sp = n.vel.length();
      if (M.pointSolid(nx, n.pos.y, n.pos.z)) n.vel.x *= -0.45;
      if (M.pointSolid(n.pos.x, n.pos.y, nz)) n.vel.z *= -0.45;
      if (M.pointSolid(n.pos.x, ny, n.pos.z)) { if (n.vel.y < 0) hitGround = true; n.vel.y *= -0.4; n.vel.x *= 0.75; n.vel.z *= 0.75; }
      if (!M.pointSolid(nx, n.pos.y, n.pos.z) && !M.pointSolid(n.pos.x, ny, n.pos.z) && !M.pointSolid(n.pos.x, n.pos.y, nz)) { n.vel.multiplyScalar(-0.4); }
      if (sp > 2.5) G.Audio.bounce(n.pos);
      if (hitGround && (n.id === 'molotov' || n.id === 'incend') && !n.done) { igniteAt(n); return; }
      if (hitGround && Math.abs(n.vel.y) < 1.2) { n.vel.y = 0; n.grounded = true; }
    }
    if (n.grounded) { n.vel.x *= Math.max(0, 1 - dt * 3); n.vel.z *= Math.max(0, 1 - dt * 3); if (!M.pointSolid(n.pos.x, n.pos.y - 0.06, n.pos.z)) n.grounded = false; }
  }
  C.updateNades = (dt) => {
    for (const n of C.nades) {
      if (n.done) continue;
      n.t += dt;
      stepNade(n, dt);
      if (n.done) continue;
      n.mesh.position.copy(n.pos); n.mesh.rotation.x += n.vel.length() * dt * 2;
      const speed = n.vel.length();
      if (n.id === 'he' && n.t >= 1.6) { explodeHE(n); }
      else if (n.id === 'flash' && n.t >= 1.6) { explodeFlash(n); }
      else if ((n.id === 'molotov' || n.id === 'incend') && n.t >= 2.0) { igniteAt(n); }
      else if (n.id === 'smoke' && ((n.t > 1.2 && speed < 0.4) || n.t > 3.2)) { deploySmoke(n); }
      else if (n.id === 'decoy') {
        if (n.t > 1.5 && speed < 0.4) {
          n.decoyT -= dt;
          if (n.decoyT <= 0) { const d = n.owner.inv.primary ? n.owner.inv.primary.def : G.W.kalash; const b = U.randi(1, 4); for (let q = 0; q < b; q++) setTimeout(() => G.Audio.shot(d, n.pos, false, false), q * 110); n.decoyT = U.rand(0.8, 2.2); if (G.Bots) G.Bots.hear(n.owner, n.pos, 45, 'shot'); n.revealT = 1; }
          if (n.t > 16) { G.Audio.explosion(n.pos, false); finish(n); }
        }
      }
    }
    C.nades = C.nades.filter(n => !n.done);
    // fumaças
    G.Smoke.update(dt);
    // fogo
    for (const f of C.fires) {
      f.t += dt; f.tick -= dt;
      // apagado por fumaça
      if (G.Smoke.densityAt(tmp.set(f.pos.x, f.pos.y + 0.5, f.pos.z)) > 0.3 || G.Smoke.densityAt(tmp.set(f.pos.x, f.pos.y + 1.2, f.pos.z)) > 0.3) f.t = f.life;
      if (f.tick <= 0) {
        f.tick = 0.2;
        for (const ag of G.Game.agents) if (ag.alive && Math.hypot(ag.pos.x - f.pos.x, ag.pos.z - f.pos.z) < f.r && Math.abs(ag.pos.y - f.pos.y) < 1.5) ag.applyDamage(8, 1.01, 'legs', f.owner, { id: 'fire', name: f.name, cat: 'grenade', reward: 300 }, f.pos);
        if (Math.random() < 0.4) G.Audio.fire(f.pos);
      }
      const fade = f.t > f.life - 1 ? U.clamp(f.life - f.t, 0, 1) : U.clamp(f.t * 3, 0, 1);
      f.group.children.forEach((sp, i) => { const s = (0.8 + Math.sin(f.t * 12 + i * 1.7) * 0.25) * fade * sp.userData.s; sp.scale.set(s, s * 1.4, 1); sp.position.y = f.pos.y + s * 0.6; });
    }
    C.fires = C.fires.filter(f => { if (f.t >= f.life) { scene.remove(f.group); return false; } return true; });
  };
  function finish(n) { n.done = true; scene.remove(n.mesh); }
  function explodeHE(n) {
    finish(n);
    G.Audio.explosion(n.pos, false);
    spriteFx(n.pos, C.flashTex, 5, 0.35, 0xffaa55);
    for (let i = 0; i < 6; i++) dust(n.pos.clone().add(new THREE.Vector3(U.rand(-1, 1), U.rand(0, 1), U.rand(-1, 1))), 1.5);
    for (const ag of G.Game.agents) {
      if (!ag.alive) continue;
      const c = tmp.set(ag.pos.x, ag.pos.y + 1.0, ag.pos.z);
      const d = c.distanceTo(n.pos);
      if (d > 9) continue;
      const p2 = n.pos.clone(); p2.y += 0.15;
      if (!M.los(p2, c) && !M.los(p2, tmp2.set(ag.pos.x, ag.eyeY(), ag.pos.z))) continue;
      const dmg = 98 * Math.pow(1 - d / 9, 1.25);
      if (dmg >= 1) ag.applyDamage(dmg, 0.5, 'generic', n.owner, G.W.he, n.pos);
    }
    G.Smoke.push(n.pos, 3.6);
    if (!G.Game.clientMode) G.Map.blastDoors(n.pos, 4.2);   // granada arrebenta portas próximas
    if (G.Bots) G.Bots.hear(n.owner, n.pos, 50, 'explosion');
    G.Game.shake(n.pos, 1);
  }
  function explodeFlash(n) {
    finish(n);
    spriteFx(n.pos, C.flashTex, 3, 0.15, 0xffffff);
    G.Audio.explosion(n.pos, false);
    for (const ag of G.Game.agents) {
      if (!ag.alive) continue;
      const eye = ag.eye(tmp);
      const d = eye.distanceTo(n.pos);
      if (d > 45 || !M.los(n.pos, eye)) continue;
      if (C.smoked(n.pos, eye)) continue;
      const fwd = U.dirFrom(ag.yaw, ag.pitch, tmp2);
      const to = tmp3.subVectors(n.pos, eye).normalize();
      const dot = fwd.dot(to);
      let dur = dot > 0.6 ? 4.6 : dot > 0.0 ? 3.0 : dot > -0.5 ? 1.2 : 0.4;
      const df = d < 15 ? 1 : U.clamp(1 - (d - 15) / 30, 0.15, 1);
      dur *= df;
      if (G.AntiCheat) G.AntiCheat.flash(ag, dur);
      if (dur > 0.25) { ag.flashT = Math.max(ag.flashT, dur); ag.flashMax = Math.max(ag.flashT, ag.flashMax || 0); if (ag.flashT === dur) ag.flashMax = dur; }
      if (ag.isHuman && dur > 0.5) G.Audio.flashRing(Math.min(1, dur / 4));
      if (ag.team !== n.owner.team && dur > 1.2) n.owner.flashAssists = (n.owner.flashAssists || 0) + 1;
      ag.flashedBy = n.owner; ag.flashedAt = G.Game.time;
    }
  }
  function deploySmoke(n) {
    finish(n);
    G.Audio.smoke(n.pos);
    const sm = G.Smoke.deploy(n.pos, n.owner);
    for (const f of C.fires) if (f.pos.distanceTo(sm.pos) < sm.r) f.t = f.life;
  }
  function igniteAt(n) {
    finish(n);
    const g = M.groundAt(n.pos.x, n.pos.z);
    const pos = new THREE.Vector3(n.pos.x, g, n.pos.z);
    if (n.pos.y - g > 2.5) { // explodiu no ar
      G.Audio.fire(n.pos); return;
    }
    if (G.Smoke.densityAt(tmp.set(pos.x, pos.y + 0.5, pos.z)) > 0.3) { G.Audio.smoke(pos); return; }
    G.Audio.fire(pos);
    const group = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: C.fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      const a = Math.random() * Math.PI * 2, rad = Math.sqrt(Math.random()) * 2.8;
      sp.position.set(pos.x + Math.cos(a) * rad, pos.y + 0.4, pos.z + Math.sin(a) * rad);
      sp.userData.s = 0.9 + Math.random() * 0.9;
      group.add(sp);
    }
    scene.add(group);
    C.fires.push({ pos, r: 3.0, t: 0, life: 7, tick: 0, group, owner: n.owner, name: n.def.name });
    if (G.Bots) G.Bots.onFire(pos);
  }
  // segmento bloqueado por fumaça?
  C.smoked = (a, b) => G.Smoke.blocked(a, b);
  C.inFire = (x, z) => { for (const f of C.fires) if (Math.hypot(x - f.pos.x, z - f.pos.z) < f.r + 0.6) return f; return null; };

  // ---------------- Armas largadas ----------------
  C.dropWeapon = (a, inst, silent) => {
    const def = inst.def;
    const mesh = G.Models.gun(def);
    const eye = a.eye(new THREE.Vector3());
    const dir = U.dirFrom(a.yaw, Math.max(-0.3, a.pitch), new THREE.Vector3());
    const pos = eye.clone().addScaledVector(dir, 0.3); pos.y -= 0.3;
    if (M.pointSolid(pos.x, pos.y, pos.z)) pos.set(a.pos.x, a.pos.y + 0.8, a.pos.z);
    const vel = dir.multiplyScalar(silent ? 2 : 4.5).add(new THREE.Vector3(0, 1.5, 0)).add(a.vel);
    mesh.position.copy(pos); scene.add(mesh);
    const d = { inst, mesh, pos, vel, t: 0, from: a, nid: ++dropSeq };
    C.drops.push(d);
    if (G.MP && G.MP.role === 'host') G.MP.emit('d+', { n: d.nid, w: def.id, am: inst.ammo, rs: inst.reserve, sl: inst.silencer ? 1 : 0, p: [pos.x, pos.y, pos.z], v: [vel.x, vel.y, vel.z] });
  };
  let dropSeq = 0;
  // ---- online (convidado): objetos criados pelo anfitrião ----
  C.netDrop = (m) => {
    const def = G.W[m.w]; if (!def || !scene) return;
    const mesh = G.Models.gun(def), pos = new THREE.Vector3(m.p[0], m.p[1], m.p[2]);
    mesh.position.copy(pos); scene.add(mesh);
    C.drops.push({ inst: { def, ammo: m.am, reserve: m.rs, silencer: !!m.sl, burst: false, zoom: 0 }, mesh, pos, vel: new THREE.Vector3(m.v[0], m.v[1], m.v[2]), t: 0, from: null, nid: m.n });
  };
  C.netDropRemove = (n) => { const d = C.drops.find(x => x.nid === n); if (d) removeDrop(d); };
  C.netNade = (a, id, pos, vel) => {
    const def = G.W[id]; if (!def || !scene) return;
    const mesh = G.Models.gun(def); mesh.scale.setScalar(1.3); mesh.position.copy(pos); scene.add(mesh);
    C.nades.push({ id, def, pos, vel, t: 0, owner: a, mesh, rest: 0, done: false, decoyT: 0 });
    a.lastShot = G.Game.time;
  };
  // tiro de outro agente visto pelo convidado (só efeitos: traçante, impacto, som, clarão)
  C.puppetShot = (a, def, yaw, pitch, sil) => {
    const eye = a.eye(new THREE.Vector3()), pellets = def.pellets || 1;
    for (let p = 0; p < pellets; p++) {
      const sp = pellets > 1 ? 0.06 : 0.004;
      const dir = U.dirFrom(yaw + (Math.random() - 0.5) * sp, pitch + (Math.random() - 0.5) * sp, new THREE.Vector3());
      const end = trace(a, eye.clone(), dir, def, def.dmg, p === 0, sil);
      if (end) G.Smoke.carve(eye, end);
    }
    G.Audio.shot(def, eye, sil, false);
    a.lastShot = G.Game.time; a.shotsFired = (a.shotsFired || 0) + 1;
    muzzleFlash3P(a);
    if (a.onFire) a.onFire(def);
  };
  // anfitrião: disparo pedido por um jogador online (confere arma, munição, recarga e cadência)
  C.remoteShot = (a, vy, vp, by, bp) => {
    if (!a.alive || G.Game.phase === 'freeze') return;
    const inst = a.weapon(); if (!inst || !inst.def) return;
    const def = inst.def, now = G.Game.time;
    if (def.cat === 'knife' || def.cat === 'grenade' || def.cat === 'c4' || !def.mag) return;
    if (a.reloadT > 0 || a.drawT > 0.08 || a.planting > 0 || a.defusing > 0 || !(inst.ammo > 0)) return;
    if (now < a.nextFire - 0.07) return;
    a.yaw = vy; a.pitch = vp;
    fireShot(a, inst, def, now, { yaw: by, pitch: bp });
    a.nextFire = now + (inst.burst ? 0.055 : W_interval(def));
  };
  C.remoteKnife = (a, heavy) => { if (!a.alive || a.cur !== 'knife' || G.Game.phase === 'freeze') return; const now = G.Game.time; if (now < a.nextFire - 0.07) return; knifeAttack(a, heavy, now); };
  C.dropCurrent = (a) => {
    const slot = a.cur;
    if (slot === 'knife' || slot === 'grenade') return false;
    if (slot === 'c4') { a.inv.c4 = false; C.dropWeapon(a, { def: G.W.c4 }); a.switchTo(a.bestSlot(), true); return true; }
    const inst = a.inv[slot]; if (!inst) return false;
    a.inv[slot] = null; C.dropWeapon(a, inst);
    a.switchTo(a.bestSlot(), true);
    return true;
  };
  C.updateDrops = (dt) => {
    for (const d of C.drops) {
      d.t += dt;
      if (!d.rest) {
        d.vel.y -= 20 * dt;
        const nx = d.pos.x + d.vel.x * dt, ny = d.pos.y + d.vel.y * dt, nz = d.pos.z + d.vel.z * dt;
        if (M.pointSolid(nx, d.pos.y, d.pos.z)) d.vel.x *= -0.3; else d.pos.x = nx;
        if (M.pointSolid(d.pos.x, d.pos.y, nz)) d.vel.z *= -0.3; else d.pos.z = nz;
        if (M.pointSolid(d.pos.x, ny - 0.04, d.pos.z)) { d.vel.y = 0; d.vel.x *= 0.5; d.vel.z *= 0.5; if (Math.hypot(d.vel.x, d.vel.z) < 0.3) { d.rest = true; d.pos.y = M.groundAt(d.pos.x, d.pos.z) + 0.04; } }
        else d.pos.y = ny;
        d.mesh.position.copy(d.pos);
        d.mesh.rotation.set(0, d.t * 4, Math.PI / 2 * Math.min(1, d.t * 2));
      }
    }
  };
  // tenta pegar armas automaticamente (slots vazios / bomba)
  C.autoPickup = (a) => {
    for (const d of C.drops) {
      if (d.t < 0.6 && d.from === a) continue;
      if (Math.hypot(d.pos.x - a.pos.x, d.pos.z - a.pos.z) > 1.0 || Math.abs(d.pos.y - a.pos.y) > 1.6) continue;
      const def = d.inst.def;
      if (def.id === 'c4') { if (a.team === 'T') { a.inv.c4 = true; removeDrop(d); if (a.isHuman) G.HUD.centerMsg('Você pegou a bomba', 1.5); G.Game.bombCarrier = a; } continue; }
      if ((def.slot === 'primary' || def.slot === 'secondary') && !a.inv[def.slot]) { a.inv[def.slot] = d.inst; removeDrop(d); if (a.isHuman) G.Audio.click(0.2); }
    }
  };
  // E: troca pela arma mais próxima na mira
  C.usePickup = (a) => {
    let best = null, bd = 9;
    const eye = a.eye(tmp), f = U.dirFrom(a.yaw, a.pitch, tmp2);
    for (const d of C.drops) {
      const v = tmp3.subVectors(d.pos, eye); const dist = v.length();
      if (dist > 2.6) continue;
      const dot = v.normalize().dot(f);
      if (dot < 0.8) continue;
      if (dist < bd) { bd = dist; best = d; }
    }
    if (!best) return false;
    const def = best.inst.def;
    if (def.slot !== 'primary' && def.slot !== 'secondary') return false;
    const old = a.inv[def.slot];
    a.inv[def.slot] = best.inst; removeDrop(best);
    if (old) C.dropWeapon(a, old, true);
    a.switchTo(def.slot, true);
    return true;
  };
  function removeDrop(d) { scene.remove(d.mesh); C.drops = C.drops.filter(x => x !== d); if (G.MP && G.MP.role === 'host' && d.nid) G.MP.emit('d-', { n: d.nid }); }
  C.removeDrop = removeDrop;

  // ---------------- Efeitos ----------------
  function impact(p, n, type, exit) {
    if (n) {
      const dcl = C.decals[C.decalIdx++ % C.decals.length];
      dcl.visible = true;
      dcl.position.set(p.x + n[0] * 0.01, p.y + n[1] * 0.01, p.z + n[2] * 0.01);
      dcl.lookAt(p.x + n[0], p.y + n[1], p.z + n[2]);
      dcl.rotation.z = Math.random() * 6;
      const s = 0.7 + Math.random() * 0.6; dcl.scale.set(s, s, 1);
    }
    if (!exit || Math.random() < 0.5) dust(p, type === 'crate' ? 0.4 : 0.55, type === 'crate' ? 0x8a6a40 : type === 'car' || type === 'barrel' ? 0xffd080 : 0xcbb48a);
  }
  function dust(p, size, color) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: C.smokeTex, color: color || 0xcbb48a, transparent: true, depthWrite: false, opacity: 0.8 }));
    sp.position.copy(p); sp.scale.set(size, size, 1);
    scene.add(sp);
    C.fx.push({ obj: sp, t: 0, life: 0.5, grow: size * 2.2, vy: 0.4 });
  }
  function blood(p) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: C.bloodTex, color: 0xaa1010, transparent: true, depthWrite: false }));
    sp.position.copy(p); sp.scale.set(0.5, 0.5, 1);
    scene.add(sp);
    C.fx.push({ obj: sp, t: 0, life: 0.35, grow: 0.8, vy: -0.5 });
  }
  function spriteFx(p, tex, size, life, color) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: color || 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.position.copy(p); sp.scale.set(size, size, 1);
    scene.add(sp);
    C.fx.push({ obj: sp, t: 0, life, grow: size * 0.6, vy: 0 });
  }
  C.spriteFx = spriteFx; C.dust = dust;
  function tracer(a, b) {
    if (Math.random() < 0.55) return;
    const g = new THREE.BufferGeometry().setFromPoints([a.clone().add(new THREE.Vector3(0, -0.08, 0)), b.clone()]);
    const l = new THREE.Line(g, C.tracerMat.clone());
    scene.add(l);
    C.fx.push({ obj: l, t: 0, life: 0.06, line: true });
  }
  function muzzleFlash3P(a) {
    if (!a.model || !a.model.gun) return;
    const m = a.model.gun.userData.muzzle;
    m.getWorldPosition(tmp);
    spriteFx(tmp.clone(), C.flashTex, 0.6, 0.05, 0xffcc88);
  }
  C.updateFx = (dt) => {
    for (const e of C.fx) {
      e.t += dt;
      const k = e.t / e.life;
      if (e.line) e.obj.material.opacity = 0.75 * (1 - k);
      else {
        e.obj.material.opacity = Math.max(0, 1 - k) * (e.obj.material.blending === THREE.AdditiveBlending ? 1 : 0.8);
        const s = e.obj.scale.x + e.grow * dt; e.obj.scale.set(s, s, 1);
        e.obj.position.y += e.vy * dt;
      }
    }
    C.fx = C.fx.filter(e => { if (e.t >= e.life) { scene.remove(e.obj); if (e.obj.geometry && e.line) e.obj.geometry.dispose(); e.obj.material.dispose(); return false; } return true; });
  };
})();
