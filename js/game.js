// Núcleo do jogo: renderização, entrada, rodadas, economia, bomba
(function () {
  const Gm = G.Game = {};
  const U = G.U, M = G.Map, C = G.Combat, H = G.HUD;
  const $ = id => document.getElementById(id);
  const NAMES = ['Faísca', 'Lobo', 'Tatu', 'Corvo', 'Ferro', 'Brasa', 'Nuvem', 'Raposa', 'Coruja', 'Garra', 'Trinca', 'Sombra', 'Pira', 'Cacto', 'Granito', 'Vento'];
  const settings = { team: 'T', diff: 1, rounds: 24, sens: 1.6, fov: 90, vol: 0.7, qual: 1, map: 'sirocco', crossLen: 7, crossThick: 2, crossGap: 3, crossDot: true, crossDyn: true };
  try { Object.assign(settings, JSON.parse(localStorage.getItem('et_settings') || '{}')); } catch (e) { }
  const saveSettings = () => { try { localStorage.setItem('et_settings', JSON.stringify(settings)); } catch (e) { } };
  Gm.settings = settings;
  Gm.saveSettings = saveSettings;
  Gm.time = 0; Gm.agents = []; Gm.phase = 'menu'; Gm.history = [];
  let renderer, scene, camera, vmScene, vmCam, sun, vm = null, vmKey = '', vmFlash, vmFlashT = 0;
  const keys = {};
  let mouseL = false, mouseR = false, paused = true, started = false, built = false;
  let shakeT = 0, shakeAmt = 0, lastFrame = 0;
  let viewTarget = null, specIdx = 0;
  let bob = 0, vmKick = 0, vmSwitch = 0, inspectT = 0, lastCur = '', vmSway = { x: 0, y: 0 }, vmThrowT = 0;

  // ---------------- Inicialização ----------------
  function buildWorld() {
    if (built) return;
    built = true;
    renderer = new THREE.WebGLRenderer({ antialias: settings.qual > 0, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.qual >= 2 ? 1.5 : 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = settings.qual > 0;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false;
    $('game').appendChild(renderer.domElement);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd9cbb0, 70, 230);
    camera = new THREE.PerspectiveCamera(settings.fov * 0.75, window.innerWidth / window.innerHeight, 0.05, 400);
    const hemi = new THREE.HemisphereLight(0xcfe0f5, 0xb99466, 0.72); scene.add(hemi); Gm.hemi = hemi;
    sun = new THREE.DirectionalLight(0xfff0d6, 0.95);
    scene.add(sun.target);
    if (settings.qual > 0) {
      sun.castShadow = true;
      const s = settings.qual >= 2 ? 4096 : 2048;
      sun.shadow.mapSize.set(s, s);
      const c = sun.shadow.camera; c.left = -95; c.right = 95; c.top = 95; c.bottom = -95; c.near = 10; c.far = 260;
      sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    }
    scene.add(sun);
    if (M.current !== settings.map) M.load(settings.map);
    applyTheme();
    M.build(scene, settings.qual);
    C.init(scene);
    // viewmodel
    vmScene = new THREE.Scene();
    vmCam = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10);
    vmScene.add(new THREE.HemisphereLight(0xfff4e0, 0x7a6a50, 0.95));
    const vl = new THREE.DirectionalLight(0xffffff, 0.6); vl.position.set(1, 2, 1); vmScene.add(vl);
    vmFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.Tex.get('flashSprite', 64), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    vmFlash.scale.set(0.22, 0.22, 1); vmFlash.visible = false;
    H.init();
    Gm.scene = scene; Gm.camera = camera; Gm.vmCam = vmCam; Gm.sun = sun; Gm.renderer = renderer;
    window.addEventListener('resize', onResize);
  }
  // aplica céu, névoa e luzes do tema do mapa atual
  function applyTheme() {
    const th = M.theme;
    const sky = document.createElement('canvas'); sky.width = 2; sky.height = 256;
    const sg = sky.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.55, th.sky[1]); gr.addColorStop(1, th.sky[2]);
    sg.fillStyle = gr; sg.fillRect(0, 0, 2, 256);
    if (scene.background && scene.background.dispose) scene.background.dispose();
    scene.background = new THREE.CanvasTexture(sky);
    scene.fog.color.setHex(th.fog); scene.fog.near = th.fogNear; scene.fog.far = th.fogFar;
    Gm.hemi.color.setHex(th.hemi[0]); Gm.hemi.groundColor.setHex(th.hemi[1]); Gm.hemi.intensity = th.hemi[2];
    sun.color.setHex(th.sun[0]); sun.intensity = th.sun[1];
    sun.target.position.set(M.width / 2, 0, M.depth / 2);
    sun.position.set(M.width / 2 + th.sunDir[0], th.sunDir[1], M.depth / 2 + th.sunDir[2]);
  }
  // troca o mapa (reconstrói a malha e o radar)
  Gm.loadMap = (id) => {
    settings.map = id; saveSettings();
    if (!built) { M.load(id); return; }
    if (M.current === id && M.mesh) return;
    C.clearRound();
    M.dispose(scene);
    M.load(id);
    applyTheme();
    M.build(scene, settings.qual);
    H.init();
    if (G.Cheats && G.Cheats.worldDirty) G.Cheats.worldDirty();
  };
  Gm.buildWorld = () => buildWorld();
  // foto aérea do mapa atual (miniatura do menu)
  Gm.snapshot = (w, h) => {
    const cx = M.width / 2, cz = M.depth / 2;
    const cam = new THREE.PerspectiveCamera(48, w / h, 1, 500);
    cam.position.set(cx + 48, 70, cz + 62); cam.lookAt(cx, 0, cz + 4);
    M.updateWeather(0, cam);
    renderer.clear(); renderer.render(scene, cam);
    const src = renderer.domElement, out = document.createElement('canvas'); out.width = w; out.height = h;
    const sw = src.width, sh = src.height, ar = w / h;
    let cw = sw, chh = sw / ar; if (chh > sh) { chh = sh; cw = sh * ar; }
    out.getContext('2d').drawImage(src, (sw - cw) / 2, (sh - chh) / 2, cw, chh, 0, 0, w, h);
    return out.toDataURL('image/jpeg', 0.85);
  };
  function onResize() {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = vmCam.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); vmCam.updateProjectionMatrix();
  }

  // ---------------- Partida ----------------
  Gm.startMatch = () => {
    $('loading').classList.remove('hidden');
    setTimeout(() => {
      buildWorld();
      Gm.loadMap(settings.map);
      G.Bots.diff = settings.diff;
      // limpa agentes antigos
      for (const a of Gm.agents) if (a.model) scene.remove(a.model.root);
      Gm.agents = [];
      const names = U.shuffle(NAMES.slice());
      Gm.clientMode = !!(G.MP && G.MP.role === 'guest');
      const ros = G.MP && G.MP.roster();
      if (ros) Gm.agents = G.MP.buildAgents(ros, names);
      else {
        const human = new G.Agent(settings.team, 'Você', true);
        Gm.human = human;
        Gm.agents.push(human);
        for (let i = 0; i < 4; i++) Gm.agents.push(new G.Agent(settings.team, names.pop(), false));
        const other = settings.team === 'T' ? 'CT' : 'T';
        for (let i = 0; i < 5; i++) Gm.agents.push(new G.Agent(other, names.pop(), false));
      }
      for (const a of Gm.agents) { a.group = a.team === settings.team ? 0 : 1; makeModel(a); hookAgent(a); }
      if (G.AntiCheat) G.AntiCheat.reset();
      if (G.MP) G.MP.onMatchCreated();
      Gm.maxRounds = settings.rounds;
      Gm.round = 0; Gm.groupScore = [0, 0]; Gm.lossStreak = { T: 0, CT: 0 }; Gm.history = [];
      Gm.time = 0;
      Gm.freezeTime = settings.rounds <= 6 ? 7 : 10; Gm.roundLength = 115; Gm.buyTime = 20; Gm.bombTime = 40;
      $('menu').classList.add('hidden'); $('loading').classList.add('hidden');
      if (G.Menu) G.Menu.hide();
      H.show(true);
      if (G.Touch) { G.Touch.decide(); G.Touch.show(true); }
      started = true;
      if (Gm.clientMode) G.MP.guestReady(); else nextRound();
      lockPointer();
      paused = false;
      lastFrame = performance.now();
    }, 30);
  };
  function makeModel(a) {
    if (a.model) scene.remove(a.model.root);
    if (!a.agentId || !G.Agents.byId[a.agentId] || G.Agents.byId[a.agentId].team !== a.team) {
      const want = a.isHuman ? settings['agent' + a.team] : (a.agentPref ? a.agentPref[a.team] : null);
      if ((a.isHuman || a.agentPref) && G.Agents.byId[want] && G.Agents.byId[want].team === a.team) a.agentId = want;
      else a.agentId = G.Agents.pick(a.team, Gm.agents.filter(x => x !== a && x.team === a.team).map(x => x.agentId).concat(a.isHuman ? [] : [settings['agent' + a.team]]));
    }
    a.model = G.Models.soldier(a.team, a.agentId);
    scene.add(a.model.root);
    a.model.walk = 0;
  }
  function hookAgent(a) {
    a.onDamaged = (dmg, attacker, from) => { if (a === Gm.human && dmg > 0) { H.damageFrom(a, from); Gm.shakeLocal(0.15); } if (a.remote && dmg > 0 && G.MP) G.MP.toAgent(a, { t: 'dm', f: from ? [from.x, from.y, from.z] : null }); };
    a.onLand = (vy) => { G.Audio.land(a.pos); };
    a.onFire = () => { if (a === viewTarget) { vmKick = 1; vmFlashT = 0.045; } };
    a.onThrow = () => { if (a === viewTarget) vmThrowT = 0.42; };
  }
  Gm.sideScore = () => {
    const g0side = Gm.human ? Gm.human.team : 'T';
    const r = {}; r[g0side] = Gm.groupScore[0]; r[g0side === 'T' ? 'CT' : 'T'] = Gm.groupScore[1];
    return r;
  };
  Gm.roundTimeLeft = () => Gm.roundLength - Gm.roundTime;
  Gm.canBuy = (a) => a.alive && (Gm.phase === 'freeze' || (Gm.phase === 'live' && Gm.roundTime < Gm.buyTime)) && M.isBuyZone(a.pos.x, a.pos.z, a.team);

  function nextRound() {
    Gm.round++;
    const half = Gm.maxRounds / 2;
    if (Gm.round === half + 1) halftime();
    const pistolRound = Gm.round === 1 || Gm.round === half + 1;
    C.clearRound();
    M.resetDoors();
    if (Gm.bombMesh) { scene.remove(Gm.bombMesh); Gm.bombMesh = null; }
    Gm.bomb = { state: 'carried', pos: null, site: null, timer: 0, beepT: 0 };
    Gm.phase = 'freeze'; Gm.phaseT = Gm.freezeTime; Gm.roundTime = 0; Gm.roundEnded = false;
    // spawns
    const sp = { T: U.shuffle(M.spots.tSpawn.slice()), CT: U.shuffle(M.spots.ctSpawn.slice()) };
    for (const a of Gm.agents) {
      const p = sp[a.team].pop();
      a.spawn(p, a.team === 'T' ? 0 : Math.PI);
    }
    // online: avisa o início da rodada ANTES das compras dos bots (que podem largar armas)
    if (G.MP && G.MP.role === 'host') G.MP.emit('rs', { rd: Gm.round, pistol: pistolRound, ag: Gm.agents.map(a => [+a.pos.x.toFixed(2), +a.pos.z.toFixed(2), +a.yaw.toFixed(3), a.team, a.agentId, a.group]) });
    // bomba para um T aleatório (bots ou humano)
    const ts = Gm.agents.filter(a => a.team === 'T');
    const carrier = U.pick(ts);
    carrier.inv.c4 = true; Gm.bombCarrier = carrier;
    // decisão de economia dos times de bots
    const eco = {};
    for (const t of ['T', 'CT']) {
      const list = Gm.agents.filter(a => a.team === t && !a.isHuman && !a.remote);
      const avg = list.reduce((s, a) => s + a.money, 0) / Math.max(1, list.length);
      const full = t === 'T' ? 3700 : 4100;
      eco[t] = avg >= full ? 'full' : (avg >= 2000 && (Gm.lossStreak[t] >= 3 || Gm.round === half || Gm.round === Gm.maxRounds || Gm.round === 2 + (Gm.round > half ? half : 0) && Math.random() < 0.3)) ? 'force' : 'eco';
    }
    const info = { pistolRound, eco, awp: { T: Gm.agents.some(a => a.team === 'T' && a.inv.primary && a.inv.primary.def.id === 'leviata'), CT: Gm.agents.some(a => a.team === 'CT' && a.inv.primary && a.inv.primary.def.id === 'leviata') } };
    for (const a of Gm.agents) if (!a.isHuman && !a.remote) { G.Bots.buy(a, info); a.switchTo(a.bestSlot(), true); }
    G.Bots.roundStart(Gm.agents);
    viewTarget = Gm.human; Gm.spectating = false;
    H.banner(pistolRound ? 'RODADA DE PISTOLAS' : `RODADA ${Gm.round}`, Gm.human.team, Gm.human.team === 'T' ? 'Insurgentes: plante a bomba no bombsite A ou B' : 'Força Tática: defenda os bombsites A e B', 2.5);
    if (Gm.round === Gm.maxRounds) H.centerMsg('Última rodada da partida!', 3);
    if (Gm.round === half) H.centerMsg('Última rodada do primeiro tempo', 3);
    if (G.Cheats) G.Cheats.onRoundStart();
  }
  function halftime() {
    for (const a of Gm.agents) {
      a.team = a.team === 'T' ? 'CT' : 'T';
      a.resetMatch();
      makeModel(a);
    }
    Gm.lossStreak = { T: 0, CT: 0 };
    if (G.AntiCheat) G.AntiCheat.allowMoney();
    if (G.MP && G.MP.role === 'host') G.MP.emit('ht', {});
    H.banner('TROCA DE LADOS', Gm.human.team, `Agora você joga de ${Gm.human.team === 'T' ? 'Insurgentes' : 'Força Tática'}`, 4);
    G.Audio.ui('start');
  }
  function endRound(winner, reason) {
    if (Gm.roundEnded) return;
    Gm.roundEnded = true;
    Gm.phase = 'post'; Gm.phaseT = 5;
    const loser = winner === 'T' ? 'CT' : 'T';
    const reward = { elim: 3250, bomb: 3500, defuse: 3500, time: 3250 }[reason];
    const winGroup = Gm.agents.find(a => a.team === winner).group;
    Gm.groupScore[winGroup]++;
    Gm.lossStreak[loser] = Math.min(5, Gm.lossStreak[loser] + 1);
    Gm.lossStreak[winner] = Math.max(0, Gm.lossStreak[winner] - 1);
    const lossBonus = 1400 + 500 * (Gm.lossStreak[loser] - 1);
    for (const a of Gm.agents) {
      if (a.team === winner) a.money += reward;
      else {
        // Ts vivos quando o tempo acaba não recebem
        if (!(reason === 'time' && a.team === 'T' && a.alive)) a.money += lossBonus;
        if (a.team === 'T' && Gm.bomb.planted) a.money += 800;
      }
      a.money = Math.min(16000, a.money);
    }
    if (G.AntiCheat) G.AntiCheat.allowMoney();
    // MVP
    let mvp = null;
    if (reason === 'bomb' && Gm.bomb.planter) mvp = Gm.bomb.planter;
    else if (reason === 'defuse' && Gm.bomb.defuser) mvp = Gm.bomb.defuser;
    else { const ws = Gm.agents.filter(a => a.team === winner).sort((a, b) => b.roundKills - a.roundKills); if (ws[0] && ws[0].roundKills > 0) mvp = ws[0]; }
    if (mvp) mvp.stats.mvp++;
    if (G.MP && G.MP.role === 'host') G.MP.emit('re', { w: winner, r: reason, mvp: mvp ? mvp.name : null });
    const txt = { elim: 'eliminaram o time inimigo', bomb: 'detonaram a bomba', defuse: 'desarmaram a bomba', time: 'seguraram até o fim do tempo' }[reason];
    const tname = winner === 'T' ? 'INSURGENTES VENCEM' : 'FORÇA TÁTICA VENCE';
    H.banner(tname, winner, `Eles ${txt}` + (mvp ? ` · MVP: ${mvp.name}` : ''), 4.5);
    G.Audio.ui(winner === Gm.human.team ? 'win' : 'lose');
    Gm.history.push({ side: winner, reason, icon: { elim: '☠', bomb: '✹', defuse: '✂', time: '⏱' }[reason] });
    // fim de partida?
    const need = Gm.maxRounds / 2 + 1;
    if (Gm.groupScore[0] >= need || Gm.groupScore[1] >= need || Gm.round >= Gm.maxRounds) Gm.matchOverPending = true;
  }
  function matchOver() {
    Gm.phase = 'over';
    const g = Gm.groupScore;
    if (G.MP && G.MP.role === 'host') G.MP.emit('ov', { gs: g });
    const res = g[0] > g[1] ? 'VITÓRIA!' : g[0] < g[1] ? 'DERROTA' : 'EMPATE';
    H.banner(res, Gm.human.team, `Placar final ${g[0]} × ${g[1]}`, 9999);
    H.toggleScoreboard(true, Gm);
    if (document.exitPointerLock) document.exitPointerLock();
    const h = Gm.human;
    if (G.Menu) setTimeout(() => G.Menu.onMatchEnd({
      map: M.current, mapName: M.def.name, result: g[0] > g[1] ? 'win' : g[0] < g[1] ? 'loss' : 'draw', score: [g[0], g[1]],
      k: h.stats.k, d: h.stats.d, a: h.stats.a, hs: h.stats.hs, mvp: h.stats.mvp, dmg: h.stats.dmg, rounds: Gm.round, team: h.team,
      rank: Gm.agents.slice().sort((x, y) => y.stats.k - x.stats.k || y.stats.dmg - x.stats.dmg).indexOf(h) + 1, diff: settings.diff
    }), 2500);
  }

  // ---------------- Abates ----------------
  Gm.onKill = (victim, attacker, wdef, hs) => {
    victim.alive = false;
    victim.stats.d++;
    victim.deadT = 0;
    const wname = wdef ? (wdef.name || 'Mundo') : 'Mundo';
    if (attacker && attacker !== victim) {
      if (attacker.team !== victim.team) {
        attacker.stats.k++; attacker.roundKills++;
        if (hs) attacker.stats.hs++;
        attacker.money = Math.min(16000, attacker.money + (wdef && wdef.reward !== undefined ? wdef.reward : 300));
      } else { attacker.stats.k--; attacker.money = Math.max(0, attacker.money - 300); }
      // assistências
      for (const nm in victim.roundDmg) {
        const a = Gm.agents.find(x => x.name === nm);
        if (a && a !== attacker && a.team !== victim.team && victim.roundDmg[nm] >= 41) a.stats.a++;
      }
      if (victim.flashedBy && victim.flashedBy !== attacker && victim.flashedBy.team !== victim.team && Gm.time - victim.flashedAt < 3) victim.flashedBy.stats.a++;
    }
    H.killfeed(attacker && attacker !== victim ? attacker : null, victim, wname, hs, victim === Gm.human || attacker === Gm.human);
    if (G.MP && G.MP.role === 'host') G.MP.emit('k', { v: Gm.agents.indexOf(victim), a: attacker && attacker !== victim ? Gm.agents.indexOf(attacker) : -1, w: wname, hs: hs ? 1 : 0 });
    // larga arma e bomba
    const drop = victim.inv.primary || victim.inv.secondary;
    if (drop) { C.dropWeapon(victim, drop, true); if (victim.inv.primary === drop) victim.inv.primary = null; else victim.inv.secondary = null; }
    if (victim.inv.c4) { victim.inv.c4 = false; C.dropWeapon(victim, { def: G.W.c4 }, true); Gm.bomb.state = 'dropped'; if (Gm.human.team === 'T') H.centerMsg('A bomba caiu!', 2); }
    victim.planting = 0; victim.defusing = 0;
    if (victim === Gm.human) { Gm.spectating = true; specIdx = 0; setTimeout(() => { if (!Gm.human.alive) cycleSpectate(); }, 1500); if (H.buyOpen) Gm.closeBuyMenu(); }
    if (viewTarget === victim && victim !== Gm.human) setTimeout(cycleSpectate, 1200);
    if (G.Cheats) G.Cheats.onKill(victim, attacker, hs);
    if (G.AntiCheat) G.AntiCheat.kill(victim, attacker, hs);
    checkRoundEnd();
  };
  function checkRoundEnd() {
    if (Gm.roundEnded || Gm.phase !== 'live') return;
    const tAlive = Gm.agents.some(a => a.team === 'T' && a.alive), ctAlive = Gm.agents.some(a => a.team === 'CT' && a.alive);
    if (!ctAlive) return endRound('T', 'elim');
    if (!tAlive && Gm.bomb.state !== 'planted') return endRound('CT', 'elim');
  }
  function cycleSpectate() {
    if (Gm.human.alive) return;
    let list = Gm.agents.filter(a => a.alive && a.team === Gm.human.team);
    if (!list.length) list = Gm.agents.filter(a => a.alive);
    if (!list.length) { viewTarget = Gm.human; return; }
    specIdx = (specIdx + 1) % list.length;
    viewTarget = list[specIdx];
  }
  Gm.shake = (pos, k) => { const d = camera ? camera.position.distanceTo(pos) : 99; if (d < 18) { shakeT = 0.4; shakeAmt = k * (1 - d / 18) * 0.04; } };
  Gm.shakeLocal = k => { shakeT = 0.2; shakeAmt = Math.max(shakeAmt, k * 0.05); };

  // ---------------- Bomba ----------------
  function updateBomb(dt) {
    const b = Gm.bomb;
    // plantio
    for (const a of Gm.agents) {
      if (!a.alive) continue;
      if (a.team === 'T' && a.inv.c4 && Gm.phase === 'live') {
        const z = M.zoneAt(a.pos.x, a.pos.z);
        const wants = a.input.use || (a.cur === 'c4' && a.input.fire);
        if ((z === 'A' || z === 'B') && wants && a.onGround) {
          if (a.cur !== 'c4') a.switchTo('c4', true);
          a.planting += dt;
          if (a.isHuman && a.planting > 0 && Math.random() < dt * 6) G.Audio.key();
          if (a.planting >= 3.2) plant(a, z);
        } else a.planting = 0;
      } else a.planting = 0;
      if (a.team === 'CT' && b.state === 'planted' && !Gm.roundEnded) {
        const d = Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z);
        if (a.input.use && d < 1.7 && Math.abs(a.pos.y - b.pos.y) < 1.6) {
          if (a.defusing === 0) { G.Audio.click(0.3); if (Gm.human.team === 'CT' || Gm.human.team === 'T') H.centerMsg(a.isHuman ? '' : (a.team === Gm.human.team ? `${a.name} está desarmando` : ''), 1.5); }
          a.defusing += dt;
          if (a.defusing >= (a.kit ? 5 : 10)) { b.state = 'defused'; b.defuser = a; a.money += 300; if (G.AntiCheat) G.AntiCheat.allowMoney(a); G.Audio.ui('start'); endRound('CT', 'defuse'); }
        } else a.defusing = 0;
      } else a.defusing = 0;
    }
    if (b.state === 'planted' && !Gm.roundEnded || (b.state === 'planted' && Gm.phase === 'post')) {
      b.timer -= dt;
      const frac = U.clamp(b.timer / Gm.bombTime, 0, 1);
      const interval = 0.12 + 0.9 * frac;
      b.beepT -= dt;
      if (b.beepT <= 0) { b.beepT = interval; G.Audio.beep(b.pos, b.timer < 1.5); if (Gm.bombMesh) Gm.bombMesh.userData.ledT = 0.08; }
      if (Gm.bombMesh && Gm.bombMesh.userData.setLCD) { const txt = '00:' + String(Math.max(0, Math.ceil(b.timer))).padStart(2, '0'); if (txt !== Gm.bombMesh.userData.lcdTxt) { Gm.bombMesh.userData.lcdTxt = txt; Gm.bombMesh.userData.setLCD(txt); } }
      if (Gm.bombMesh) { const l = Gm.bombMesh.userData.led; Gm.bombMesh.userData.ledT = (Gm.bombMesh.userData.ledT || 0) - dt; l.material.color.setHex(Gm.bombMesh.userData.ledT > 0 ? 0xff3030 : 0x401010); }
      if (b.timer <= 0) explodeBomb();
    }
  }
  function plant(a, site) {
    const b = Gm.bomb;
    a.inv.c4 = false; a.planting = 0; a.switchTo(a.bestSlot(), true);
    b.state = 'planted'; b.planted = true; b.site = site; b.timer = Gm.bombTime; b.beepT = 0; b.planter = a;
    b.pos = new THREE.Vector3(a.pos.x, M.groundAt(a.pos.x, a.pos.z), a.pos.z);
    a.money = Math.min(16000, a.money + 300);
    if (G.AntiCheat) G.AntiCheat.allowMoney(a);
    Gm.bombMesh = G.Models.bomb(); Gm.bombMesh.position.copy(b.pos); Gm.bombMesh.rotation.y = a.yaw; scene.add(Gm.bombMesh);
    G.Audio.ui('planted');
    if (G.MP && G.MP.role === 'host') G.MP.emit('pl', { site, tm: Gm.bombTime });
    H.banner('BOMBA PLANTADA', 'T', `Bombsite ${site} · ${Gm.bombTime} segundos`, 2.5);
    G.Bots.hear(a, b.pos, 999, 'plant');
  }
  function explodeBomb() {
    const b = Gm.bomb;
    if (b.state !== 'planted') return;
    b.state = 'exploded';
    if (G.MP && G.MP.role === 'host') G.MP.emit('bx', { p: [b.pos.x, b.pos.y, b.pos.z] });
    G.Audio.explosion(b.pos, true);
    C.spriteFx(b.pos.clone().add(new THREE.Vector3(0, 2, 0)), G.Tex.get('flashSprite', 64), 26, 1.2, 0xffaa55);
    for (let i = 0; i < 14; i++) C.dust(b.pos.clone().add(new THREE.Vector3(U.rand(-6, 6), U.rand(0, 6), U.rand(-6, 6))), 6, 0x6a5a48);
    for (const a of Gm.agents) {
      if (!a.alive) continue;
      const d = a.pos.distanceTo(b.pos);
      const dmg = 500 * Math.exp(-(d * d) / (2 * 10 * 10));
      if (dmg > 1) a.applyDamage(dmg, 0.5, 'generic', b.planter, { id: 'bomb', name: 'Bomba', cat: 'grenade', reward: 0 }, b.pos);
    }
    Gm.shake(b.pos, 3);
    M.blastDoors(b.pos, 14);
    if (Gm.bombMesh) { scene.remove(Gm.bombMesh); Gm.bombMesh = null; }
    if (!Gm.roundEnded) endRound('T', 'bomb');
  }

  // ---------------- Entrada ----------------
  function lockPointer() { const c = renderer && renderer.domElement; if (c && c.requestPointerLock) { try { const p = c.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } } }
  const isLocked = () => (G.Touch && G.Touch.active) || document.pointerLockElement === (renderer && renderer.domElement);
  document.addEventListener('pointerlockchange', () => {
    if (!started) return;
    if (!isLocked() && !H.buyOpen && !(G.Cheats && G.Cheats.open) && Gm.phase !== 'menu') pause(true);
  });
  function pause(on) {
    paused = on;
    $('pause').classList.toggle('hidden', !on);
    if (!on) { lockPointer(); lastFrame = performance.now(); }
  }
  // giro da mira em "contagens" de mouse (o toque usa a mesma conta)
  Gm.look = (mx, my) => {
    if (!started || paused || H.buyOpen || (G.Cheats && G.Cheats.open)) return;
    const h = Gm.human; if (!h.alive) return;
    const w = viewTarget === h ? h.weapon() : null;
    let k = settings.sens * 0.022 * U.D2R;
    if (h.zoom > 0 && w && w.def.scope) k *= w.def.scope[h.zoom - 1] / 90 * 1.0;
    h.yaw = U.wrap(h.yaw - mx * k);
    h.pitch = U.clamp(h.pitch - my * k, -1.53, 1.53);
  };
  document.addEventListener('mousemove', e => {
    if (G.Touch && G.Touch.active) return;
    if (!isLocked()) return;
    Gm.look(e.movementX, e.movementY);
  });
  Gm.setMouse = (l, r) => {
    if (!started || paused || H.buyOpen) { mouseL = mouseR = false; return; }
    if (!Gm.human.alive) { if (l) cycleSpectate(); return; }
    if (l !== null && l !== undefined) mouseL = l;
    if (r !== null && r !== undefined) mouseR = r;
  };
  document.addEventListener('mousedown', e => {
    G.Audio.init();
    if (!started || paused) return;
    if (H.buyOpen || (G.Cheats && G.Cheats.open)) return;
    if (!isLocked()) { lockPointer(); return; }
    if (!Gm.human.alive) { if (e.button === 0) cycleSpectate(); return; }
    if (e.button === 0) mouseL = true; if (e.button === 2) mouseR = true;
  });
  document.addEventListener('mouseup', e => { if (e.button === 0) mouseL = false; if (e.button === 2) mouseR = false; });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('wheel', e => {
    if (!started || paused || H.buyOpen || !Gm.human.alive) return;
    const order = ['primary', 'secondary', 'knife', 'grenade', 'c4', 'taser'].filter(s => Gm.human.has(s));
    let i = order.indexOf(Gm.human.cur);
    i = (i + (e.deltaY > 0 ? 1 : -1) + order.length) % order.length;
    Gm.human.switchTo(order[i]);
  }, { passive: true });
  document.addEventListener('keydown', e => {
    if (!started) return;
    if (G.Cheats && G.Cheats.handleKey(e, paused)) return;
    const k = e.code;
    if (['Tab', 'Space', 'ControlLeft', 'KeyB'].includes(k) || (e.ctrlKey && ['KeyW', 'KeyS', 'KeyD', 'KeyA'].includes(k))) e.preventDefault();
    if (k === 'Escape') {
      if (H.buyOpen) { Gm.closeBuyMenu(); return; }
      if (Gm.phase === 'over') { quitToMenu(); return; }
      return;
    }
    if (paused) return;
    if (H.buyOpen) {
      if (k === 'KeyB') { Gm.closeBuyMenu(); return; }
      const n = parseInt(e.key); if (!isNaN(n)) { H.buyKey(Gm, n); return; }
    }
    if (e.repeat) { keys[k] = true; return; }
    keys[k] = true;
    const h = Gm.human;
    if (k === 'Tab') H.toggleScoreboard(true, Gm);
    if (!h.alive) return;
    if (k === 'KeyB' && !H.buyOpen) { if (Gm.canBuy(h)) { H._catPicked = false; H.openBuy(Gm); document.exitPointerLock && document.exitPointerLock(); } else { G.Audio.ui('deny'); H.centerMsg(Gm.phase === 'live' && Gm.roundTime >= Gm.buyTime ? 'O tempo de compra acabou' : 'Você não está na zona de compra', 1.5); } return; }
    if (H.buyOpen) return;
    const slotKeys = { Digit1: 'primary', Digit2: 'secondary', Digit3: 'knife', Digit4: 'grenade', Digit5: 'c4', Digit6: 'taser' };
    if (slotKeys[k]) h.switchTo(slotKeys[k]);
    if (k === 'KeyQ') h.switchTo(h.has(h.lastSlot) ? h.lastSlot : h.bestSlot());
    if (k === 'KeyG') { if (Gm.clientMode) G.MP.drop(); else C.dropCurrent(h); }
    if (k === 'KeyF') inspectT = 2.2;
    if (k === 'KeyE') { if (!(Gm.bomb.state === 'planted' && h.team === 'CT' && h.pos.distanceTo(Gm.bomb.pos) < 2.2) && !(h.inv.c4 && (M.zoneAt(h.pos.x, h.pos.z) === 'A' || M.zoneAt(h.pos.x, h.pos.z) === 'B'))) { if (Gm.clientMode) G.MP.use(); else if (!C.usePickup(h)) M.useDoor(h); } }
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Tab' && Gm.phase !== 'over') H.toggleScoreboard(false, Gm); });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseL = mouseR = false; });
  Gm.closeBuyMenu = () => { H.closeBuy(); lockPointer(); };
  Gm.lock = lockPointer;
  Gm.isPaused = () => paused;
  Gm.pause = pause;
  Gm.unpauseNoLock = () => { paused = false; $('pause').classList.add('hidden'); lastFrame = performance.now(); };

  function humanInput() {
    const h = Gm.human, inp = h.input;
    inp.fwd = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    inp.side = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    inp.jump = !!keys.Space; inp.crouch = !!(keys.ControlLeft || keys.KeyC || keys.ControlRight);
    inp.walk = !!(keys.ShiftLeft || keys.ShiftRight);
    inp.fire = mouseL && !H.buyOpen; inp.fire2 = mouseR && !H.buyOpen;
    inp.reload = !!keys.KeyR; inp.use = !!keys.KeyE;
    if (G.Touch) G.Touch.apply(inp);
  }

  // ---------------- Loop ----------------
  Gm.step = (dt) => {
    Gm.time += dt;
    if (Gm.clientMode) { G.MP.stepClient(dt); return; }
    const frozen = Gm.phase === 'freeze';
    if (Gm.phase === 'freeze') { Gm.phaseT -= dt; if (Gm.phaseT <= 0) { Gm.phase = 'live'; Gm.roundTime = 0; G.Audio.ui('start'); H.centerMsg('', 0.1); M.openGates(); } }
    else if (Gm.phase === 'live') {
      Gm.roundTime += dt;
      if (Gm.roundTime >= Gm.roundLength && Gm.bomb.state !== 'planted' && !Gm.roundEnded) endRound('CT', 'time');
    } else if (Gm.phase === 'post') {
      Gm.phaseT -= dt;
      if (Gm.phaseT <= 0) { if (Gm.matchOverPending) { Gm.matchOverPending = false; matchOver(); } else nextRound(); }
    }
    if (Gm.phase === 'over') return;
    if (H.buyOpen && !Gm.canBuy(Gm.human)) Gm.closeBuyMenu();
    if (Gm.human.alive) humanInput(); else { const i = Gm.human.input; i.fwd = i.side = 0; i.fire = i.fire2 = i.use = false; }
    if (G.Cheats) G.Cheats.afterInput(dt, frozen);
    for (const a of Gm.agents) if (!a.isHuman && !a.remote && a.alive) G.Bots.update(a, dt, Gm.time, frozen);
    for (const a of Gm.agents) {
      if (!a.alive) continue;
      if (a.remote) G.MP.remoteStep(a, dt); else a.physics(dt, frozen);
      C.updateWeapon(a, dt, Gm.time, frozen);
      C.autoPickup(a);
      if (a.inv.c4) Gm.bombCarrier = a;
      footstep(a, dt);
      // fogo sob o agente (desliza para fora? só dano já tratado)
      if (a.pos.y < -5) a.applyDamage(999, 1, 'generic', null, null);
      if (M.deadlyAt(a.pos.x, a.pos.y, a.pos.z)) {
        C.dust(new THREE.Vector3(a.pos.x, a.pos.y + 0.7, a.pos.z), 1.9, M.theme.waterFx || 0xbfeaf2); if (G.Audio.splash) G.Audio.splash(a.pos);
        a.applyDamage(999, 1, 'generic', null, { id: 'pool', name: M.theme.deadName || 'Líquido letal', cat: 'grenade', reward: 0 }, null);
      }
    }
    if (Gm.bomb.state === 'carried' || Gm.bomb.state === 'dropped') Gm.bomb.state = Gm.agents.some(a => a.alive && a.inv.c4) ? 'carried' : 'dropped';
    updateBomb(dt);
    C.updateNades(dt); C.updateDrops(dt); C.updateFx(dt);
    if (Gm.phase === 'live' && !Gm.roundEnded) checkRoundEnd();
    M.tickDoors(dt);
    if (G.Cheats) G.Cheats.afterStep(dt);
    if (G.AntiCheat) G.AntiCheat.tick(dt);
    if (G.MP) G.MP.hostTick(dt);
    // dicas para o humano
    const h = Gm.human;
    if (h.alive) {
      if (h.inv.c4 && M.zoneAt(h.pos.x, h.pos.z) && (M.zoneAt(h.pos.x, h.pos.z) === 'A' || M.zoneAt(h.pos.x, h.pos.z) === 'B') && h.planting <= 0 && Gm.phase === 'live') H.hint('Segure E para plantar a bomba');
      else if (h.team === 'CT' && Gm.bomb.state === 'planted' && h.pos.distanceTo(Gm.bomb.pos) < 2 && h.defusing <= 0) H.hint('Segure E para desarmar' + (h.kit ? ' (kit: 5 s)' : ' (10 s)'));
      else if (Gm.canBuy(h) && Gm.phase === 'freeze') H.hint(G.Touch && G.Touch.active ? 'Toque em $ para abrir a loja' : 'Pressione B para abrir a loja');
      else if (M.doorNear(h, 2.4)) H.hint('E: abrir / fechar porta');
      else if (M.windowNear && M.windowNear(h, 2.2)) H.hint('E: abrir / fechar janela (faz barulho)');
      else if (M.ladderAt && M.ladderAt(h) && !h.onLadder) H.hint('Escada: olhe para ela e aperte W para subir');
      else {
        const f = U.dirFrom(h.yaw, h.pitch, new THREE.Vector3()), eye = h.eye();
        for (const d of C.drops) { const v = d.pos.clone().sub(eye), L = v.length(); if (L < 2.6 && v.normalize().dot(f) > 0.8 && d.inst.def.slot !== 'c4' && d.inst.def.id !== 'c4') { H.hint(`E: pegar ${d.inst.def.name}`); break; } }
      }
    }
  };

  // passos (som + bots ouvem)
  function footstep(a, dt) {
    const sp = a.speed2d();
    if (a.onGround && sp > G.PHYS.RUN * 0.55 && !a.input.walk && a.crouch < 0.5) {
      a.stepT = (a.stepT || 0) - dt * sp / 5.2;
      if (a.stepT <= 0) {
        a.stepT = 0.36;
        const surf = M.isWater(a.pos.x, a.pos.z) ? 'water' : 'sand';
        if (a !== viewTarget) G.Audio.step(a.pos, 0.55, surf); else G.Audio.step(null, 0.12, surf);
        if (!Gm.clientMode) G.Bots.hear(a, a.pos, 17, 'step');
        a.revealT = Math.max(a.revealT || 0, 0.3);
      }
    }
  }
  // usados pelo modo online (mp.js)
  Gm._footstep = footstep;
  Gm._humanInput = () => humanInput();
  Gm._cycleSpectate = () => cycleSpectate();
  Gm._viewTarget = () => viewTarget;
  Gm._setView = a => { viewTarget = a; };
  Gm._makeModel = a => makeModel(a);
  Gm._onLocalDeath = () => { Gm.spectating = true; specIdx = 0; setTimeout(() => { if (!Gm.human.alive) cycleSpectate(); }, 1500); if (H.buyOpen) Gm.closeBuyMenu(); };
  function updateModels(dt) {
    for (const a of Gm.agents) {
      const m = a.model; if (!m) continue;
      const fp = a === viewTarget && a.alive && !(a.isHuman && G.Cheats && G.Cheats.third());
      m.root.visible = !fp;
      if (!a.alive) {
        a.deadT = (a.deadT || 0) + dt;
        const k = Math.min(1, a.deadT / 0.4);
        m.root.rotation.x = -k * Math.PI / 2 * 0.98;
        m.root.position.set(a.pos.x, a.pos.y + 0.12 * k, a.pos.z);
        continue;
      }
      poseModel(a, dt);
      const def = a.wdef();
      if (a === Gm.human && G.Skins) { G.Skins.local = true; G.Models.setSoldierGun(m, def, G.Skins.localKey(def.id)); G.Skins.local = false; } else G.Models.setSoldierGun(m, def);
      // recuo da arma 3P
      if (m.gun) m.gun.position.z = Math.max(0, 0.05 - (Gm.time - a.lastShot) * 0.6);
    }
  }
  // pose do esqueleto (usada no desenho e no cálculo das hitboxes)
  function poseModel(a, dt) {
    const m = a.model; if (!m || !a.alive) return;
    m.root.position.copy(a.pos);
    m.root.rotation.set(0, a.isHuman && G.Cheats ? G.Cheats.modelYaw(a) : a.yaw, 0);
    m.upper.rotation.x = a.pitch * 0.7;
    {   // arma na mão: sacar e recarregar também aparecem nos bonecos
      const gh = m.gunHold, def = a.wdef(); if (!gh.userData.b) gh.userData.b = gh.position.clone();
      let gy = 0, gz = 0, grx = 0, grz = 0;
      const dTot = Math.max(0.2, (def.draw || 1) * 0.55);
      if (a.drawT > 0) { const q = 1 - U.clamp(a.drawT / dTot, 0, 1), u = 1 - E3(q); gy -= 0.3 * u; grx -= 0.8 * u; }
      if (a.reloadT > 0 && def.mag && def.cat !== 'knife' && def.cat !== 'equip') {
        const rp = 1 - U.clamp(a.reloadT / def.reload, 0, 1);
        const tilt = def.shellReload ? 1 : E3(sg(rp, 0, 0.16)) * (1 - E3(sg(rp, 0.84, 1)));
        grz -= 0.5 * tilt; grx += 0.2 * tilt; gy -= 0.04 * tilt; gz += 0.04 * Math.sin(Math.PI * sg(rp, 0.74, 0.84));
      }
      gh.position.set(gh.userData.b.x, gh.userData.b.y + gy, gh.userData.b.z + gz); gh.rotation.set(grx, 0, grz);
    }
    if (m.head) m.head.rotation.x = a.pitch * 0.3;
    const sp = a.speed2d();
    m.walk += dt * sp * 1.6;
    const amp = Math.min(1, sp / 4) * 0.65;
    const c = a.crouch;
    m.body.position.y = -0.42 * c;
    m.legs[0].rotation.x = Math.sin(m.walk) * amp - c * 1.0;
    m.legs[1].rotation.x = -Math.sin(m.walk) * amp - c * 1.0;
    m.legs[0].userData.shin.rotation.x = c * 1.9 + Math.max(0, -Math.sin(m.walk)) * amp;
    m.legs[1].userData.shin.rotation.x = c * 1.9 + Math.max(0, Math.sin(m.walk)) * amp;
    if (!a.onGround) { m.legs[0].rotation.x = -0.5; m.legs[1].rotation.x = 0.2; m.legs[0].userData.shin.rotation.x = 0.6; m.legs[1].userData.shin.rotation.x = 0.3; }
  }
  Gm.poseModel = poseModel;

  function updateCamera(dt) {
    const t = viewTarget || Gm.human;
    const eye = t.eye();
    // punch visual: metade do recuo
    const vr = G.Cheats && t.isHuman && G.Cheats.cfg.vis.noVisRecoil ? 0 : 0.5;
    const px = t.punch.x * vr * U.D2R, py = t.punch.y * vr * U.D2R;
    camera.position.copy(eye);
    let yaw = t.yaw - px, pitch = t.pitch + py;
    if (shakeT > 0) { shakeT -= dt; yaw += (Math.random() - 0.5) * shakeAmt; pitch += (Math.random() - 0.5) * shakeAmt; if (shakeT <= 0) shakeAmt = 0; }
    camera.rotation.set(0, 0, 0, 'YXZ');
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw; camera.rotation.x = pitch;
    // FOV (luneta)
    const w = t.weapon(); const def = w ? w.def : G.W.knife;
    let fov = (G.Cheats && G.Cheats.cfg.vis.fov) || settings.fov;
    if (t.zoom > 0 && def.scope) fov = def.scope[t.zoom - 1] * fov / 90;
    const vfov = 2 * Math.atan(Math.tan(fov * U.D2R / 2) / (16 / 9) * (9 / 16) * 1) * U.R2D; // usamos fov horizontal ~ convertido abaixo
    const aspect = window.innerWidth / window.innerHeight;
    const vf = 2 * Math.atan(Math.tan(fov * U.D2R / 2) / (aspect / 1)) * U.R2D;
    // fov horizontal "4:3" (estilo clássico): fov definido para 4:3, expandido para widescreen
    const v43 = 2 * Math.atan(Math.tan(fov * U.D2R / 2) / (4 / 3)) * U.R2D;
    if (Math.abs(camera.fov - v43) > 0.01) { camera.fov = v43; camera.updateProjectionMatrix(); }
    if (G.Cheats) G.Cheats.cameraHook(camera, t, eye);
    G.Audio.listener(eye, t.yaw);
  }

  // ---- animações de sacar / recarregar / arremessar (1ª pessoa) ----
  const E3 = x => x * x * (3 - 2 * x), sg = (p, a, b) => U.clamp((p - a) / (b - a), 0, 1);
  // devolve quanto falta do saque (1 → 0) e preenche os deslocamentos em o
  function vmAnim(t, def, o) {
    const V = vm.userData, lh = V.lhand, mg = V.vmag;
    // sacar: a arma sobe de baixo, com um pequeno assentamento no fim
    const dTot = Math.max(0.2, (def.draw || 1) * 0.55);
    const dr = t.drawT > 0 ? U.clamp(t.drawT / dTot, 0, 1) : 0;
    if (dr > 0) {
      const q = 1 - dr, u = 1 - E3(q), ov = Math.sin(q * Math.PI * 2.4) * 0.012 * (1 - q);
      if (def.cat === 'knife') { o.y -= 0.26 * u; o.x += 0.06 * u; o.rx -= 1.2 * u; o.rz -= 2.2 * u; o.ry += 0.5 * u; }
      else if (def.cat === 'grenade' || def.cat === 'c4' || def.cat === 'equip') { o.y -= 0.3 * u; o.z += 0.1 * u; o.rx -= 0.8 * u; o.rz += 0.3 * u; }
      else { o.y -= 0.34 * u - ov; o.x += 0.14 * u; o.z += 0.1 * u; o.rx -= 0.95 * u; o.rz += 0.55 * u; o.ry -= 0.3 * u; }
    }
    // recarregar
    if (lh && lh.userData.base) lh.position.copy(lh.userData.base);
    const reloading = t.reloadT > 0 && def.mag && def.cat !== 'knife' && def.cat !== 'equip';
    let magReal = true;
    if (reloading) {
      const rp = 1 - U.clamp(t.reloadT / def.reload, 0, 1);
      if (def.shellReload) {
        const k = Math.sin(Math.PI * sg(rp, 0.2, 0.85));
        o.rx += 0.2; o.rz -= 0.5; o.y += 0.01;
        if (lh) { lh.position.y -= 0.03 * k; lh.position.z += 0.17 * k; }
      } else {
        const a = E3(sg(rp, 0, 0.16)), b = sg(rp, 0.16, 0.3), c = E3(sg(rp, 0.3, 0.56)), r = E3(sg(rp, 0.7, 0.92)), pulse = Math.sin(Math.PI * sg(rp, 0.74, 0.84));
        const tilt = a * (1 - E3(sg(rp, 0.84, 1)));
        o.rz -= 0.72 * tilt; o.rx += 0.1 * tilt; o.y += 0.025 * tilt; o.x -= 0.035 * tilt;
        o.z += 0.035 * pulse; o.rx -= 0.12 * pulse;                      // puxa o ferrolho / armar
        const handAmt = a * (1 - r), handDown = b * (1 - c);
        if (lh && mg) { lh.position.lerpVectors(lh.userData.base, mg.pos, handAmt * 0.9); lh.position.y -= 0.11 * handDown; lh.position.z += 0.03 * handDown; }
        magReal = rp < 0.16 || rp >= 0.56;
        if (mg) {
          mg.old.visible = rp >= 0.16 && rp < 0.52; mg.neu.visible = rp >= 0.3 && rp < 0.56;
          if (mg.old.visible) { const s = sg(rp, 0.16, 0.52); mg.old.position.set(mg.pos.x, mg.pos.y - 0.03 * sg(rp, 0.16, 0.24) - 0.45 * s * s, mg.pos.z + 0.03 * s); mg.old.rotation.set(s * 2.4, 0, s * 1.4); }
          if (mg.neu.visible) { mg.neu.position.set(mg.pos.x, mg.pos.y - 0.11 * (1 - c), mg.pos.z + 0.03 * (1 - c)); mg.neu.rotation.set(0, 0, 0); }
        }
      }
    }
    if (mg) { for (const m of mg.real) m.visible = magReal; if (!reloading) mg.old.visible = mg.neu.visible = false; }
    // granada: mão para trás com o pino puxado e arremesso para a frente
    if (def.cat === 'grenade') {
      const ts = t.throwState, pin = V.pin;
      if (ts) { const e = E3(U.clamp((Gm.time - ts.t) / 0.3, 0, 1)); o.y += 0.05 * e; o.z += 0.09 * e; o.rx += 0.5 * e; o.x -= 0.02 * e; }
      if (vmThrowT > 0) { const p = 1 - vmThrowT / 0.42, sw = Math.sin(Math.PI * p); o.z -= 0.16 * sw; o.y -= 0.035 * sw; o.rx -= 0.95 * sw; }
      if (pin) {
        if (ts) { const s = Gm.time - ts.t; pin.visible = s < 0.7; pin.position.set(0.02 + s * 0.4, 0.045 - s * s * 3.2, -0.01 + s * 0.12); pin.rotation.set(s * 8, s * 5, 0); }
        else pin.visible = false;
      }
    }
    return dr;
  }
  function updateViewmodel(dt) {
    const t = viewTarget || Gm.human;
    const w = t.weapon(); const def = w ? w.def : G.W.knife;
    const key = def.id + ':' + t.team + ':' + t.agentId + ':' + (w && w.silencer ? 's' : '') + (G.Cheats ? G.Cheats.skinKey(def.id) : '') + (t === Gm.human && G.Skins ? G.Skins.localKey(def.id) : '');
    if (key !== vmKey) {
      if (vm) vmScene.remove(vm);
      if (G.Skins) G.Skins.local = t === Gm.human;
      vm = G.Models.viewmodel(def, t.team, t.agentId);
      if (G.Skins) G.Skins.local = false;
      vmScene.add(vm);
      vmKey = key;
      if (vmFlash.parent) vmFlash.parent.remove(vmFlash);
      vm.userData.muzzle.add(vmFlash);
    }
    if (t.cur !== lastCur) { vmSwitch = 1; lastCur = t.cur; inspectT = 0; }
    const base = vm.userData.base;
    const sp = t.speed2d();
    if (t.onGround) bob += dt * sp * 1.5;
    const bobAmt = Math.min(1, sp / 6) * 0.012;
    vmKick = Math.max(0, vmKick - dt * 9);
    vmSwitch = Math.max(0, vmSwitch - dt * 3.5); vmThrowT = Math.max(0, vmThrowT - dt);
    vmSway.x += (0 - vmSway.x) * Math.min(1, dt * 8);
    const ao = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
    const drawAmt = vmAnim(t, def, ao);
    const kn = def.cat === 'knife' && Gm.time - t.lastShot < 0.35 ? Math.sin((Gm.time - t.lastShot) / 0.35 * Math.PI) : 0;
    vm.position.set(
      base.x + Math.sin(bob) * bobAmt - kn * 0.12 + ao.x,
      base.y + Math.abs(Math.cos(bob)) * bobAmt - (t.crouch * 0.01) + ao.y,
      base.z + vmKick * (def.cat === 'sniper' || def.pellets > 1 ? 0.09 : 0.035) - kn * 0.1 + ao.z
    );
    let rx = vmKick * 0.08 + ao.rx, ry = ao.ry, rz = ao.rz;
    if (inspectT > 0) { inspectT -= dt; const k = Math.sin(Math.min(1, (2.2 - inspectT) / 2.2) * Math.PI); ry += k * 0.9; rz += k * 0.5; }
    { const gu = vm.userData.gun; if (gu && gu.userData.anim) gu.userData.anim({ inspect: inspectT > 0 ? Math.min(1, (2.2 - inspectT) / 2.2) : -1, draw: drawAmt }); }
    if (kn) { ry += kn * 0.6; rz += -kn * 0.8; }
    vm.rotation.set(rx, ry, rz);
    vm.visible = t.alive && !(t.zoom > 0 && def.scope) && !(t.isHuman && G.Cheats && G.Cheats.third());
    if (G.Cheats && Math.abs(vmCam.fov - G.Cheats.cfg.vis.vmFov) > 0.1) { vmCam.fov = G.Cheats.cfg.vis.vmFov; vmCam.updateProjectionMatrix(); }
    vmFlashT -= dt;
    vmFlash.visible = vmFlashT > 0 && !(w && (w.silencer || def.silencer === 'fixed'));
    vmFlash.material.rotation = Math.random() * 6;
  }

  let menuT = 0;
  function menuFrame(dt) {
    // voo cinematográfico sobre o mapa atrás do menu
    menuT += dt;
    const cx = M.width / 2, cz = M.depth / 2, a = menuT * 0.045;
    camera.position.set(cx + Math.cos(a) * 62, 30 + Math.sin(menuT * 0.2) * 3, cz + Math.sin(a) * 52);
    camera.lookAt(cx, 0, cz);
    const v43 = 2 * Math.atan(Math.tan(80 * U.D2R / 2) / (4 / 3)) * U.R2D;
    if (Math.abs(camera.fov - v43) > 0.01) { camera.fov = v43; camera.updateProjectionMatrix(); }
    M.updateWeather(dt, camera);
    M.tickDoors(dt); M.updateDoors();
    renderer.clear();
    renderer.render(scene, camera);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!started) {
      if (built && Gm.phase === 'menu' && !document.hidden) { let dt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now; if (dt < 0) dt = 0; menuFrame(dt); }
      else lastFrame = now;
      return;
    }
    let dt = (now - lastFrame) / 1000; lastFrame = now;
    if (dt > 0.05) dt = 0.05; if (dt < 0) dt = 0;
    if (!paused || (G.MP && G.MP.role)) {
      // subpassos para física estável
      const n = dt > 0.02 ? 2 : 1;
      for (let i = 0; i < n; i++) Gm.step(dt / n);
    }
    Gm.render(dt);
  }
  Gm.render = (dt) => {
    if (viewTarget && !viewTarget.alive && !Gm.human.alive) cycleSpectate();
    updateModels(dt);
    updateCamera(dt);
    G.Smoke.frame(camera, renderer);
    updateViewmodel(dt);
    M.updateWeather(dt, camera);
    M.updateDoors(dt);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    if (vm && vm.visible) renderer.render(vmScene, vmCam);
    H.update(dt, viewTarget || Gm.human, Gm);
    if (G.Touch) G.Touch.update();
    if (G.Cheats) G.Cheats.render(dt, viewTarget || Gm.human);
  };
  requestAnimationFrame(frame);

  function quitToMenu() {
    started = false; paused = true; Gm.phase = 'menu';
    if (G.MP && G.MP.role) G.MP.leave();
    H.show(false); H.closeBuy(); H.toggleScoreboard(false, Gm);
    if (G.Touch) G.Touch.show(false);
    $('pause').classList.add('hidden');
    $('banner').classList.add('hidden');
    for (const a of Gm.agents) if (a.model) a.model.root.visible = false;
    C.clearRound();
    if (Gm.bombMesh) { scene.remove(Gm.bombMesh); Gm.bombMesh = null; }
    if (document.exitPointerLock) document.exitPointerLock();
    if (G.Menu) G.Menu.show(); else $('menu').classList.remove('hidden');
  }
  Gm.quitToMenu = quitToMenu;

  // ---------------- Menu de pausa (o menu principal fica em menu.js) ----------------
  const s2 = $('optSens2');
  s2.value = settings.sens; $('sensLbl2').textContent = Number(settings.sens).toFixed(2);
  s2.oninput = () => { settings.sens = Number(s2.value); $('sensLbl2').textContent = settings.sens.toFixed(2); saveSettings(); };
  $('optCross').querySelectorAll('button').forEach(b => b.onclick = () => { $('optCross').querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); H.setCrossColor(b.dataset.v); });
  $('btnResume').onclick = () => pause(false);
  $('btnQuit').onclick = () => quitToMenu();
  G.Audio.setVolume(settings.vol);

  // depuração / testes
  window.ET = Gm;
})();
