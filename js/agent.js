// Agente (jogador humano ou bot): física de movimento, inventário, vida/colete
(function () {
  const U = G.U;
  const GRAV = 20.3, JUMP_V = 7.1, STAND_H = 1.8, CROUCH_H = 1.3, RADIUS = 0.36, STEP = 0.56;
  const RUN = 6.35;               // 250 u/s ≈ 6,35 m/s
  const FRICTION = 5.2, ACCEL = 5.5, AIR_ACCEL = 12, AIR_CAP = 0.76, STOP = 2.0;
  const solidsBuf = [];

  class Agent {
    constructor(team, name, isHuman) {
      this.team = team; this.name = name; this.baseName = name; this.isHuman = !!isHuman;
      this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
      this.yaw = 0; this.pitch = 0;
      this.onGround = true; this.crouch = 0; this.height = STAND_H;
      this.input = { fwd: 0, side: 0, jump: false, crouch: false, walk: false, fire: false, fire2: false, reload: false, use: false };
      this.money = 800;
      this.stats = { k: 0, d: 0, a: 0, dmg: 0, mvp: 0, hs: 0 };
      this.resetMatch();
      this.model = null;
    }
    resetMatch() {
      this.money = 800;
      this.inv = { primary: null, secondary: null, knife: { def: G.W.knife }, grenades: [], c4: false, taser: null };
      this.armor = 0; this.helmet = false; this.kit = false;
      this.alive = true;
      this.giveDefaultPistol();
    }
    inst(def) { return { def, ammo: def.mag || 0, reserve: def.reserve || 0, silencer: def.silencer === true, burst: false, zoom: 0 }; }
    giveDefaultPistol() { this.inv.secondary = this.inst(this.team === 'T' ? G.W.vespa : G.W.guardiao); }
    // chamado a cada início de rodada
    spawn(p, yaw) {
      if (!this.alive) {
        // morto na rodada anterior: perde equipamento
        this.inv.primary = null; this.inv.grenades = []; this.inv.taser = null; this.inv.c4 = false;
        this.giveDefaultPistol();
        this.armor = 0; this.helmet = false; this.kit = false;
      }
      this.inv.c4 = false;
      this.alive = true; this.hp = 100;
      this.pos.set(p.x, G.Map.groundAt(p.x, p.z), p.z); this.vel.set(0, 0, 0);
      this.yaw = yaw; this.pitch = 0; this.crouch = 0; this.height = STAND_H; this.onGround = true;
      this.cur = this.inv.primary ? 'primary' : 'secondary'; this.lastSlot = 'knife'; this.nadeIdx = 0;
      this.reloadT = 0; this.drawT = 0.3; this.nextFire = 0; this.shotsFired = 0; this.spread = 0; this.lastShot = -9;
      this.punch = { x: 0, y: 0 }; this.burstLeft = 0; this.firePrev = false; this.fire2Prev = false; this.triggerHeld = false;
      this.tagT = 0; this.flashT = 0; this.flashMax = 0; this.landSlow = 0; this.stepT = 0;
      this.planting = 0; this.defusing = 0; this.throwState = null; this.zoom = 0;
      this.roundDmg = {}; this.roundKills = 0; this.lastAttacker = null; this.lastHitT = -9;
      this.knifeT = 0;
      for (const k of ['primary', 'secondary']) if (this.inv[k]) this.inv[k].zoom = 0;
      if (this.model) { this.model.root.visible = true; this.model.root.rotation.set(0, 0, 0); this.deadT = 0; }
    }
    // ---------------- Armas ----------------
    weapon() {
      if (this.cur === 'primary') return this.inv.primary;
      if (this.cur === 'secondary') return this.inv.secondary;
      if (this.cur === 'knife') return this.inv.knife;
      if (this.cur === 'taser') return this.inv.taser;
      if (this.cur === 'grenade') { const id = this.inv.grenades[this.nadeIdx]; return id ? { def: G.W[id] } : null; }
      if (this.cur === 'c4') return this.inv.c4 ? { def: G.W.c4 } : null;
      return null;
    }
    wdef() { const w = this.weapon(); return w ? w.def : G.W.knife; }
    has(slot) {
      if (slot === 'grenade') return this.inv.grenades.length > 0;
      if (slot === 'c4') return this.inv.c4;
      return !!this.inv[slot];
    }
    switchTo(slot, force) {
      if (!this.has(slot)) return false;
      if (slot === this.cur && slot === 'grenade' && this.inv.grenades.length > 1 && !force) {
        this.nadeIdx = (this.nadeIdx + 1) % this.inv.grenades.length;
      } else if (slot === this.cur && !force) return false;
      if (slot !== this.cur) this.lastSlot = this.cur;
      this.cur = slot;
      if (this.nadeIdx >= this.inv.grenades.length) this.nadeIdx = 0;
      this.reloadT = 0; this.drawT = (this.wdef().draw || 1) * 0.55; this.zoom = 0; this.burstLeft = 0; this.throwState = null;
      for (const k of ['primary', 'secondary']) if (this.inv[k]) this.inv[k].zoom = 0;
      this.planting = 0;
      return true;
    }
    bestSlot() { return this.inv.primary ? 'primary' : this.inv.secondary ? 'secondary' : 'knife'; }
    nadeCount(id) { return this.inv.grenades.filter(g => g === id).length; }
    // compra: retorna mensagem de erro ou null
    canBuy(def) {
      if (def.team !== 'both' && def.team !== this.team) return 'Indisponível para seu time';
      let price = def.price;
      if (def.id === 'kevhelm' && this.armor >= 100 && !this.helmet) price = 350;
      if (def.id === 'kevhelm' && this.armor >= 100 && this.helmet) return 'Já equipado';
      if (def.id === 'kevlar' && this.armor >= 100) return 'Já equipado';
      if (def.id === 'kit' && this.kit) return 'Já equipado';
      if (def.cat === 'grenade') {
        if (this.inv.grenades.length >= G.W.MAX_NADES) return 'Limite de granadas';
        if (this.nadeCount(def.id) >= (def.max || 1)) return 'Limite deste item';
        if ((def.id === 'molotov' || def.id === 'incend') && (this.nadeCount('molotov') + this.nadeCount('incend')) >= 1) return 'Limite deste item';
      }
      if (def.id === 'taser' && this.inv.taser) return 'Já equipado';
      if ((def.slot === 'primary' && this.inv.primary && this.inv.primary.def.id === def.id) || (def.slot === 'secondary' && this.inv.secondary && this.inv.secondary.def.id === def.id)) return 'Você já tem esta arma';
      if (this.money < price) return 'Dinheiro insuficiente';
      return null;
    }
    priceOf(def) { return (def.id === 'kevhelm' && this.armor >= 100 && !this.helmet) ? 350 : def.price; }
    buy(def) {
      const err = this.canBuy(def);
      if (err) return err;
      this.money -= this.priceOf(def);
      if (def.id === 'kevlar') { this.armor = 100; }
      else if (def.id === 'kevhelm') { this.armor = 100; this.helmet = true; }
      else if (def.id === 'kit') this.kit = true;
      else if (def.id === 'taser') this.inv.taser = this.inst(def);
      else if (def.cat === 'grenade') { this.inv.grenades.push(def.id); }
      else if (def.slot === 'primary' || def.slot === 'secondary') {
        const old = this.inv[def.slot];
        if (old) G.Combat.dropWeapon(this, old, true);
        this.inv[def.slot] = this.inst(def);
        this.switchTo(def.slot, true);
        return null;
      }
      return null;
    }
    // ---------------- Física ----------------
    maxSpeed() {
      const d = this.wdef();
      let s = RUN * (d.speed || 250) / 250;
      if (this.zoom > 0 && d.scopeSpeed) s = RUN * d.scopeSpeed / 250;
      if (this.input.walk) s *= 0.52;
      if (this.crouch > 0.5) s *= 0.34;
      if (this.tagT > 0) s *= U.lerp(1, 0.45, Math.min(1, this.tagT / 0.4));
      if (this.landSlow > 0) s *= 0.75;
      if (this.planting > 0 || this.defusing > 0) s = 0;
      return s * (this.speedMul || 1);
    }
    speed2d() { return Math.hypot(this.vel.x, this.vel.z); }
    eyeY() { return this.pos.y + U.lerp(1.64, 1.17, this.crouch); }
    eye(out) { return (out || new THREE.Vector3()).set(this.pos.x, this.eyeY(), this.pos.z); }
    physics(dt, frozen) {
      const inp = this.input;
      // agachar
      const wantC = inp.crouch ? 1 : 0;
      if (wantC < this.crouch) {
        // verificar espaço para levantar
        const s = G.Map.solids(this.pos.x - RADIUS, this.pos.z - RADIUS, this.pos.x + RADIUS, this.pos.z + RADIUS, solidsBuf);
        let blocked = false;
        for (let q = 0; q < s.length; q += 2) if (s[q] > this.pos.y + 0.1 && s[q] < this.pos.y + STAND_H) blocked = true;
        if (!blocked) this.crouch = Math.max(0, this.crouch - dt * (this.crouchSpeed || 6));
      } else this.crouch = Math.min(1, this.crouch + dt * (this.crouchSpeed || 6));
      this.height = U.lerp(STAND_H, CROUCH_H, this.crouch);
      this.tagT = Math.max(0, this.tagT - dt); this.landSlow = Math.max(0, this.landSlow - dt);

      // escada de mão: W sobe, S desce, pular solta; no topo passa para a plataforma
      const lad = G.Map.ladderAt ? G.Map.ladderAt(this) : null;
      if (lad && !frozen) {
        const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), facing = fx * lad.dx + fz * lad.dz;
        if (!this.onLadder && inp.fwd > 0.1 && facing > 0.3 && this.pos.y < lad.y1 - 0.3) this.onLadder = true;
        else if (!this.onLadder && inp.fwd < -0.1 && facing > 0.3 && this.pos.y >= lad.y1 - 0.2) { this.onLadder = true; this.pos.set(lad.x - lad.dx * 0.4, lad.y1 - 0.35, lad.z - lad.dz * 0.4); this.vel.set(0, 0, 0); }
        if (this.onLadder) {
          if (inp.jump && !this.jumpHeld) { this.onLadder = false; this.vel.set(-lad.dx * 3, 3.2, -lad.dz * 3); this.jumpHeld = true; this.move(dt); return; }
          this.jumpHeld = !!inp.jump;
          const up = (inp.fwd || 0) * (facing >= -0.2 ? 1 : -1);
          this.vel.set(lad.dx * 0.6 * Math.max(0, up), up * 3.4, lad.dz * 0.6 * Math.max(0, up));
          const sx = lad.dx ? 0 : (inp.side || 0) * 1.2 * (lad.dz > 0 ? -1 : 1), sz = lad.dz ? 0 : (inp.side || 0) * 1.2 * (lad.dx > 0 ? 1 : -1);
          this.vel.x += sx; this.vel.z += sz;
          if (up > 0 && this.pos.y >= lad.y1 - 0.5) { this.pos.y = lad.y1 + 0.02; this.pos.x += lad.dx * 0.45; this.pos.z += lad.dz * 0.45; this.vel.set(lad.dx * 2, 0, lad.dz * 2); this.onLadder = false; this.onGround = true; }
          else { this.move(dt); this.onGround = false; if (up < 0 && this.pos.y <= lad.y0 + 0.02) { this.onLadder = false; this.onGround = true; } }
          this.landSlow = 0;
          return;
        }
      } else this.onLadder = false;
      let fwd = frozen ? 0 : inp.fwd, side = frozen ? 0 : inp.side;
      const wl = Math.hypot(fwd, side); if (wl > 1) { fwd /= wl; side /= wl; }
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      // frente = (-sin, -cos), direita = (cos, -sin)
      let wx = -sy * fwd + cy * side, wz = -cy * fwd - sy * side;
      const wlen = Math.hypot(wx, wz);
      const wishSpeed = wlen > 0 ? this.maxSpeed() : 0;
      if (wlen > 0) { wx /= wlen; wz /= wlen; }
      // pulo: borda do botão + buffer de 0,15 s antes de tocar o chão (no toque, segurar repete o pulo)
      const edge = inp.jump && !this.jumpHeld;
      this.jumpHeld = !!inp.jump;
      this.autoHop = this.isHuman && G.Touch && G.Touch.active;
      this.jumpBuf = Math.max(0, (this.jumpBuf || 0) - dt);
      if (edge && !this.onGround) this.jumpBuf = 0.15;
      const canJump = !frozen && this.planting <= 0 && this.defusing <= 0;
      if (this.onGround && canJump && (edge || this.jumpBuf > 0 || (inp.jump && this.autoHop))) {
        // pulo perfeito: sem atrito nem limite de velocidade no quadro do pulo (bunny hop)
        this.jumpBuffered = !edge || this.autoHop; this.jumpBuf = 0;
        this.vel.y = JUMP_V; this.onGround = false;
        if (this.onJump) this.onJump();
      }
      if (this.onGround) {
        // atrito
        const sp = this.speed2d();
        if (sp > 0) {
          const drop = Math.max(sp, STOP) * FRICTION * dt;
          const ns = Math.max(0, sp - drop) / sp;
          this.vel.x *= ns; this.vel.z *= ns;
        }
        accelerate(this, wx, wz, wishSpeed, ACCEL, dt);
        // acima da velocidade máxima (ex.: ao mirar, ou depois de uma sequência de bunny hop): perde aos poucos
        const sp2 = this.speed2d(), mx = Math.max(this.maxSpeed(), 0.01);
        if (sp2 > mx * 1.02 && wishSpeed > 0) { const k = Math.max(mx / sp2, 1 - 8 * dt); this.vel.x *= k; this.vel.z *= k; }
      } else {
        if (wishSpeed > 0) {
          const cur = this.vel.x * wx + this.vel.z * wz, add = Math.min(wishSpeed, this.airCap || AIR_CAP) - cur;
          if (add > 0) { const as = Math.min(AIR_ACCEL * wishSpeed * dt, add); this.vel.x += as * wx; this.vel.z += as * wz; }
        }
        // teto de segurança para o ganho de velocidade no ar
        const spA = this.speed2d(), cap = RUN * 2.2 * (this.speedMul || 1);
        if (spA > cap) { this.vel.x *= cap / spA; this.vel.z *= cap / spA; }
      }
      this.vel.y -= GRAV * dt;
      this.move(dt);
    }
    move(dt) {
      const p = this.pos, r = RADIUS;
      // eixo X
      const tryAxis = (ax) => {
        const old = p[ax];
        p[ax] += this.vel[ax] * dt;
        const s = G.Map.solids(p.x - r, p.z - r, p.x + r, p.z + r, solidsBuf);
        let stepTo = -Infinity, blocked = false;
        const canStep = this.onGround || this.vel.y < 0;
        for (let q = 0; q < s.length; q += 2) {
          const lo = s[q], hi = s[q + 1];
          if (hi <= p.y + 0.001 || lo >= p.y + this.height) continue;
          if (canStep && hi - p.y <= STEP && lo <= p.y + 0.01) { stepTo = Math.max(stepTo, hi); continue; }
          blocked = true; break;
        }
        if (!blocked && stepTo > p.y) {
          // espaço livre acima do degrau?
          for (let q = 0; q < s.length; q += 2) {
            const lo = s[q], hi = s[q + 1];
            if (hi > stepTo + 0.001 && lo < stepTo + this.height) { blocked = true; break; }
          }
          if (!blocked) p.y = stepTo;
        }
        if (blocked) { p[ax] = old; this.vel[ax] = 0; }
      };
      tryAxis('x'); tryAxis('z');
      // vertical
      const s = G.Map.solids(p.x - r, p.z - r, p.x + r, p.z + r, solidsBuf);
      let ground = -100, ceil = 100;
      for (let q = 0; q < s.length; q += 2) {
        const lo = s[q], hi = s[q + 1];
        if (hi <= p.y + 0.05 && hi > ground) ground = hi;
        if (lo >= p.y + this.height - 0.05 && lo < ceil) ceil = lo;
      }
      const wasGround = this.onGround, vy = this.vel.y;
      p.y += this.vel.y * dt;
      if (p.y + this.height > ceil && this.vel.y > 0) { p.y = ceil - this.height; this.vel.y = 0; }
      if (p.y <= ground) {
        p.y = ground; this.vel.y = 0;
        if (!wasGround) { this.onGround = true; if (vy < -4 && this.onLand) this.onLand(vy); if (vy < -8.5) this.landSlow = 0.25; }   // só queda de verdade freia
        this.onGround = true;
      } else if (p.y > ground + 0.06) {
        // descendo rampa: mantém o pé no chão
        if (wasGround && this.vel.y <= 0 && p.y - ground < 0.45) { p.y = ground; this.vel.y = 0; this.onGround = true; }
        else this.onGround = false;
      }
      else if (this.vel.y <= 0) { p.y = ground; this.vel.y = 0; this.onGround = true; }
    }
    // ---------------- Dano ----------------
    // hitgroup: head | chest | stomach | legs | generic
    applyDamage(raw, armorRatio, group, attacker, wdef, fromPos) {
      if (!this.alive) return { hp: 0, killed: false };
      if (G.Game.clientMode) return { hp: 0, killed: false };      // online: só o anfitrião aplica dano
      if (this.isHuman && G.Cheats && G.Cheats.cfg.srv.god) return { hp: 0, killed: false };
      let hpD = raw, armD = 0;
      const protectedArea = this.armor > 0 && (group === 'chest' || group === 'stomach' || group === 'arms' || group === 'generic' || (group === 'head' && this.helmet));
      if (protectedArea && armorRatio < 1.001) {
        hpD = raw * armorRatio;
        armD = (raw - hpD) * 0.5;
        if (armD > this.armor) { armD = this.armor; hpD = raw - armD * 2; }
        this.armor = Math.max(0, Math.round(this.armor - armD));
      } else if (protectedArea) { this.armor = Math.max(0, Math.round(this.armor - raw * 0.1)); }
      hpD = Math.max(1, Math.floor(hpD));
      const dealt = Math.min(this.hp, hpD);
      this.hp -= hpD;
      if (attacker && attacker !== this) {
        this.lastAttacker = attacker; this.lastHitT = G.Game.time;
        if (attacker.team !== this.team) this.roundDmg[attacker.name] = (this.roundDmg[attacker.name] || 0) + dealt;
        attacker.stats.dmg += attacker.team !== this.team ? dealt : 0;
      }
      if (wdef && wdef.cat !== 'grenade' && wdef.id !== 'fire' && wdef.id !== 'bomb') this.tagT = 0.4;
      if (this.onDamaged) this.onDamaged(dealt, attacker, fromPos);
      if (this.hp <= 0) { this.hp = 0; G.Game.onKill(this, attacker, wdef, group === 'head'); return { hp: dealt, killed: true }; }
      return { hp: dealt, killed: false };
    }
    // hitboxes no mundo
    // Hitboxes presas ao esqueleto do modelo (cápsulas/esferas que seguem agachamento, passos, mira e giro).
    // Recalculadas no máximo uma vez por instante de simulação.
    hitboxes() {
      const m = this.model;
      const key = G.Game.time + ':' + this.pos.x + ':' + this.pos.y + ':' + this.pos.z + ':' + this.yaw + ':' + this.pitch + ':' + this.crouch;
      if (this._hbKey === key && this._hb) return this._hb;
      this._hbKey = key;
      if (!m || !m.hb) {
        const h = this.height, p = this.pos;
        return (this._hb = [
          { g: 'head', type: 's', c: new THREE.Vector3(p.x, p.y + h * 0.93, p.z), r: 0.125 },
          { g: 'chest', type: 'c', a: new THREE.Vector3(p.x, p.y + h * 0.68, p.z), b: new THREE.Vector3(p.x, p.y + h * 0.8, p.z), r: 0.2 },
          { g: 'stomach', type: 'c', a: new THREE.Vector3(p.x, p.y + h * 0.5, p.z), b: new THREE.Vector3(p.x, p.y + h * 0.64, p.z), r: 0.18 },
          { g: 'legs', type: 'c', a: new THREE.Vector3(p.x, p.y + 0.1, p.z), b: new THREE.Vector3(p.x, p.y + h * 0.46, p.z), r: 0.2 }
        ]);
      }
      if (G.Game.poseModel) G.Game.poseModel(this, 0);
      m.root.updateMatrixWorld(true);
      const out = this._hb || (this._hb = m.hb.map(d => ({ g: d.g, type: d.b ? 'c' : 's', a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), r: d.r })));
      for (let i = 0; i < m.hb.length; i++) {
        const d = m.hb[i], o = out[i];
        if (d.b) { o.a.set(d.a[0], d.a[1], d.a[2]); d.obj.localToWorld(o.a); o.b.set(d.b[0], d.b[1], d.b[2]); d.obj.localToWorld(o.b); }
        else { o.c.set(d.a[0], d.a[1], d.a[2]); d.obj.localToWorld(o.c); }
      }
      return out;
    }
    // ponto para mirar numa região (usado por bots e pelo painel)
    aimPoint(g) {
      const hbs = this.hitboxes();
      const hb = hbs.find(x => x.g === g) || hbs[0];
      return hb.type === 's' ? hb.c.clone() : hb.a.clone().lerp(hb.b, 0.5);
    }
  }
  const tmpV = new THREE.Vector3();
  function accelerate(a, wx, wz, wishSpeed, accel, dt) {
    if (wishSpeed <= 0) return;
    const cur = a.vel.x * wx + a.vel.z * wz;
    const add = wishSpeed - cur;
    if (add <= 0) return;
    const as = Math.min(accel * dt * wishSpeed, add);
    a.vel.x += as * wx; a.vel.z += as * wz;
  }
  G.Agent = Agent;
  G.PHYS = { RUN, STAND_H, CROUCH_H, RADIUS };
})();
