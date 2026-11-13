// Multijogador online (PeerJS, P2P em estrela).
// O ANFITRIÃO simula tudo (bots, rodadas, dano, economia, bomba e o Guardião).
// Os CONVIDADOS mandam o próprio movimento/mira/tiros/ações e recebem o estado ~20×/s + eventos.
(function () {
  const MP = G.MP = { role: null, ver: 3, players: [], code: null, bots: true, status: '' };
  const Gm = () => G.Game, U = G.U, M = G.Map, C = G.Combat;
  const $ = id => document.getElementById(id);
  const PREFIX = 'esqtat-';
  let peer = null, hostConn = null;
  const r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;
  const v3 = p => [r2(p.x), r2(p.y), r2(p.z)];
  const toV = a => new THREE.Vector3(a[0], a[1], a[2]);
  const idx = a => Gm().agents.indexOf(a);

  // ---------------- Rede ----------------
  function loadPeer() {
    return new Promise((res, rej) => {
      if (window.Peer) return res();
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      s.onload = () => res(); s.onerror = () => rej(new Error('Sem conexão com a internet (não carregou a biblioteca de rede).'));
      document.head.appendChild(s);
    });
  }
  const code5 = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random() * 32 | 0]).join('');
  function send(conn, m) { try { if (conn && conn.open) conn.send(m); } catch (e) { } }
  MP.send = m => send(hostConn, m);
  function bcast(m, except) { for (const p of MP.players) if (p.conn && p.conn !== except) send(p.conn, m); }
  const connOf = a => { const p = a && a.remote && MP.players.find(x => x.id === a.remote); return p ? p.conn : null; };
  MP.toAgent = (a, m) => send(connOf(a), m);
  function status(s) { MP.status = s; ui(); }

  MP.leave = () => {
    try { if (hostConn) hostConn.close(); } catch (e) { }
    try { if (peer) peer.destroy(); } catch (e) { }
    peer = null; hostConn = null; MP.role = null; MP.players = []; MP.code = null; Gm().clientMode = false; ready = false; queue = [];
    ui();
  };
  const myName = () => { let n = ''; try { n = localStorage.getItem('et_mpname') || (JSON.parse(localStorage.getItem('et_profile') || '{}').name) || ''; } catch (e) { } return (n || 'Jogador').slice(0, 16); };

  // ================= ANFITRIÃO =================
  MP.host = async () => {
    MP.leave(); status('Conectando ao servidor de salas…');
    try { await loadPeer(); } catch (e) { status(e.message); return; }
    const tryOpen = (n) => new Promise((res, rej) => {
      MP.code = code5();
      peer = new Peer(PREFIX + MP.code, { debug: 0 });
      peer.on('open', () => res());
      peer.on('error', e => { if (e.type === 'unavailable-id' && n < 4) { peer.destroy(); tryOpen(n + 1).then(res, rej); } else rej(e); });
    });
    try { await tryOpen(0); } catch (e) { status('Erro de rede: ' + (e.type || e.message)); return; }
    MP.role = 'host';
    MP.players = [{ id: 'host', name: myName(), team: Gm().settings.team || 'T', host: true }];
    peer.on('connection', c => {
      c.on('data', d => hostRecv(c, d));
      const drop = () => hostDrop(c);
      c.on('close', drop); c.on('error', drop);
    });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { } });
    status('Sala criada. Envie o código ou o link para os amigos.');
    lobbyChanged();
  };
  function uniqueName(n) { n = String(n || 'Jogador').replace(/[<>&"]/g, '').slice(0, 16) || 'Jogador'; let k = n, i = 2; while (MP.players.some(p => p.name === k)) k = n + i++; return k; }
  function hostRecv(c, m) {
    if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { return; } }
    if (!m || !m.t) return;
    if (m.t === 'hello') {
      if (m.ver !== MP.ver) { send(c, { t: 'err', msg: 'Versão do jogo diferente da do anfitrião — atualize a página (Ctrl+F5).' }); setTimeout(() => c.close(), 400); return; }
      if (Gm().phase !== 'menu') { send(c, { t: 'err', msg: 'A partida já começou. Espere a próxima.' }); setTimeout(() => c.close(), 400); return; }
      if (MP.players.length >= 10) { send(c, { t: 'err', msg: 'Sala cheia (10 jogadores).' }); setTimeout(() => c.close(), 400); return; }
      const nT = MP.players.filter(p => p.team === 'T').length, nCT = MP.players.length - nT;
      MP.players.push({ id: c.peer, name: uniqueName(m.name), team: nT <= nCT ? 'T' : 'CT', conn: c, pref: m.pref || {} });
      send(c, { t: 'welcome', id: c.peer });
      lobbyChanged(); return;
    }
    const p = MP.players.find(x => x.id === c.peer); if (!p) return;
    if (m.t === 'team') { p.team = m.team === 'CT' ? 'CT' : 'T'; lobbyChanged(); return; }
    if (m.t === 'ping') { send(c, { t: 'pong', s: m.s }); return; }
    if (p.agent) gameMsg(p.agent, m);
  }
  function hostDrop(c) {
    const p = MP.players.find(x => x.conn === c); if (!p) return;
    MP.players = MP.players.filter(x => x !== p);
    if (p.agent) { p.agent.remote = null; G.HUD.centerMsg(`${p.name} saiu — um bot assume na próxima rodada`, 3); }
    lobbyChanged();
  }
  function lobbyChanged() {
    if (MP.role === 'host') {
      const s = Gm().settings;
      bcast({ t: 'lobby', players: MP.players.map(p => ({ id: p.id, name: p.name, team: p.team, host: !!p.host })), map: s.map, rounds: s.rounds, bots: MP.bots });
    }
    ui();
  }
  MP.setTeam = (team) => {
    if (MP.role === 'host') { MP.players[0].team = team; Gm().settings.team = team; lobbyChanged(); }
    else if (MP.role === 'guest') MP.send({ t: 'team', team });
  };
  MP.lobbyChanged = lobbyChanged;

  // lista de agentes para a partida (chamada por Gm.startMatch)
  MP.roster = () => {
    if (MP.role === 'host') {
      const list = MP.players.map(p => ({ name: p.name, team: p.team, kind: p.host ? 'me' : 'r', pid: p.id, pref: p.pref }));
      if (MP.bots) for (const t of ['T', 'CT']) { const n = list.filter(x => x.team === t).length; for (let i = n; i < 5; i++) list.push({ name: null, team: t, kind: 'b' }); }
      // ao menos 1 agente por lado
      for (const t of ['T', 'CT']) if (!list.some(x => x.team === t)) list.push({ name: null, team: t, kind: 'b' });
      return list;
    }
    if (MP.role === 'guest' && MP.startMsg) return MP.startMsg.roster.map((r, i) => Object.assign({}, r, { kind: i === MP.startMsg.you ? 'me' : 'p' }));
    return null;
  };
  // cria os agentes a partir da lista
  MP.buildAgents = (ros, names) => {
    const g = Gm(); const out = [];
    for (const r of ros) {
      const a = new G.Agent(r.team, r.name || names.pop(), r.kind === 'me');
      if (r.kind === 'r') { a.remote = r.pid; a.agentPref = r.pref; const p = MP.players.find(x => x.id === r.pid); if (p) p.agent = a; }
      if (r.kind === 'p') { a.puppet = true; a.isBot = !!r.bot; }
      if (r.agentId) a.agentId = r.agentId;
      if (r.kind === 'me') g.human = a;
      out.push(a);
    }
    return out;
  };
  // logo depois de criar os agentes: o anfitrião manda a lista para todos
  MP.onMatchCreated = () => {
    const g = Gm();
    if (MP.role !== 'host') return;
    const roster = g.agents.map(a => ({ name: a.name, team: a.team, agentId: a.agentId, group: a.group, bot: !a.isHuman && !a.remote }));
    for (const p of MP.players) if (p.conn && p.agent) send(p.conn, { t: 'start', ver: MP.ver, roster, you: idx(p.agent), map: g.settings.map, rounds: g.settings.rounds, diff: g.settings.diff });
    sendT = 0; statT = 0;
  };
  MP.start = () => {
    if (MP.role !== 'host') return;
    const g = Gm(); g.settings.team = MP.players[0].team;
    close(); g.startMatch();
  };

  // mensagens de jogo vindas de um convidado
  function gameMsg(a, m) {
    const g = Gm(), now = g.time;
    switch (m.t) {
      case 'in': {
        if (!a.alive) return;
        a.pos.set(m.p[0], m.p[1], m.p[2]); a.vel.set(m.v[0], m.v[1], m.v[2]);
        a.yaw = m.y; a.pitch = m.pi; a.crouch = m.c; a.onGround = !!(m.f & 1);
        a.height = U.lerp(1.8, 1.3, a.crouch);
        const i = a.input;
        i.walk = !!(m.f & 2); i.crouch = !!(m.f & 4); i.jump = !!(m.f & 8); i.use = !!(m.f & 16); i.reload = !!(m.f & 32); i.fire = !!(m.f & 64); i.fire2 = !!(m.f & 128); a.jumpBuffered = !!(m.f & 256);
        i.fwd = m.mv ? m.mv[0] : 0; i.side = m.mv ? m.mv[1] : 0;
        a.lastNet = now;
        // luneta / supressor / rajada são estado da arma na mão
        const w = a.weapon();
        if (w && w.def) {
          if (w.def.scope) { w.zoom = U.clamp(m.zm | 0, 0, w.def.scope.length); a.zoom = w.zoom; }
          if (w.def.silencer === true) w.silencer = !!m.sl;
          if (w.def.burst) w.burst = !!m.bu;
        }
        break;
      }
      case 'sh': C.remoteShot(a, m.vy, m.vp, m.by, m.bp); break;
      case 'kn': C.remoteKnife(a, !!m.h); break;
      case 'nd': if (a.alive && a.inv.grenades.includes(m.id)) C.throwNade(a, m.id, U.clamp(m.s, 0.3, 1), m.y, m.p); break;
      case 'sw': if (a.alive) { if (m.s === 'grenade' && typeof m.n === 'number') a.nadeIdx = m.n; a.switchTo(m.s, true); } break;
      case 'buy': {
        const def = G.W[m.id]; if (!def) return;
        if (!g.canBuy(a)) { MP.toAgent(a, { t: 'bm', e: 'Fora da zona/tempo de compra' }); return; }
        const err = a.buy(def); MP.toAgent(a, { t: 'bm', e: err || '' });
        if (G.AntiCheat) G.AntiCheat.allowMoney(a);
        break;
      }
      case 'use': if (a.alive && !C.usePickup(a)) M.useDoor(a); break;
      case 'drop': if (a.alive) C.dropCurrent(a); break;
    }
  }
  // física dos remotos no anfitrião: posição vem do convidado (o Guardião confere velocidade e saltos)
  MP.remoteStep = (a, dt) => { if (g().time - (a.lastNet || 0) > 0.4) { a.vel.multiplyScalar(0.8); } };
  const g = () => Gm();

  // ---------------- Envio de estado (anfitrião) ----------------
  let sendT = 0, statT = 0;
  const SLOT = ['primary', 'secondary', 'knife', 'grenade', 'c4', 'taser'];
  function invOf(a) {
    const w = i => i ? [i.def.id, i.ammo, i.reserve, i.silencer ? 1 : 0, i.burst ? 1 : 0] : 0;
    return { p: w(a.inv.primary), s: w(a.inv.secondary), g: a.inv.grenades.slice(), c4: a.inv.c4 ? 1 : 0, tz: a.inv.taser ? 1 : 0, cur: a.cur, n: a.nadeIdx, rl: r2(a.reloadT), pl: r2(a.planting), df: r2(a.defusing), m: a.money, hl: a.helmet ? 1 : 0, kit: a.kit ? 1 : 0, ft: r2(a.flashT) };
  }
  MP.hostTick = (dt) => {
    if (MP.role !== 'host' || !MP.players.some(p => p.conn)) return;
    sendT -= dt; statT -= dt;
    if (sendT > 0) return;
    sendT = 0.05;
    const gm = Gm(), b = gm.bomb || {};
    const ag = gm.agents.map(a => [r2(a.pos.x), r2(a.pos.y), r2(a.pos.z), r2(a.vel.x), r2(a.vel.y), r2(a.vel.z), r3(a.yaw), r3(a.pitch), r2(a.crouch),
      Math.round(a.hp || 0), a.armor | 0, a.alive ? 1 : 0, SLOT.indexOf(a.cur), (a.wdef() || {}).id || 'knife', (a.onGround ? 1 : 0) | (a.helmet ? 2 : 0) | (a.kit ? 4 : 0) | (a.planting > 0 ? 8 : 0) | (a.defusing > 0 ? 16 : 0)]);
    const doors = (M.doors || []).map(p => p.open ? 1 : 0).join('');
    const base = { t: 's', ph: gm.phase, pt: r2(gm.phaseT || 0), rt: r2(gm.roundTime || 0), rd: gm.round, gs: gm.groupScore, ag, dr: doors,
      bm: { s: b.state, p: b.pos ? v3(b.pos) : null, tm: r2(b.timer || 0), site: b.site || null } };
    for (const p of MP.players) {
      if (!p.conn || !p.agent) continue;
      base.me = invOf(p.agent);
      send(p.conn, base);
    }
    if (statT <= 0) { statT = 1; bcast({ t: 'st', a: gm.agents.map(a => [a.stats.k, a.stats.d, a.stats.a, a.stats.hs, a.stats.mvp, a.stats.dmg, a.money]) }); }
  };
  // eventos do anfitrião
  MP.emit = (t, data, except) => { if (MP.role === 'host') bcast(Object.assign({ t }, data), except ? connOf(except) : null); };

  // ================= CONVIDADO =================
  let ready = false, queue = [];
  MP.join = async (code) => {
    code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 5) { status('O código tem 5 letras.'); return; }
    MP.leave(); status('Conectando à sala ' + code + '…');
    try { await loadPeer(); } catch (e) { status(e.message); return; }
    peer = new Peer({ debug: 0 });
    peer.on('error', e => status(e.type === 'peer-unavailable' ? 'Sala não encontrada (código errado ou anfitrião saiu).' : 'Erro de rede: ' + e.type));
    peer.on('open', () => {
      hostConn = peer.connect(PREFIX + code, { reliable: true });
      hostConn.on('open', () => {
        MP.role = 'guest'; MP.code = code;
        const s = Gm().settings;
        send(hostConn, { t: 'hello', ver: MP.ver, name: myName(), pref: { T: s.agentT, CT: s.agentCT } });
        status('Conectado. Aguardando o anfitrião começar…');
      });
      hostConn.on('data', d => guestRecv(d));
      hostConn.on('close', () => {
        const was = MP.role;
        MP.leave();
        if (was === 'guest') { if (Gm().phase !== 'menu') { G.HUD.banner('CONEXÃO PERDIDA', '', 'O anfitrião encerrou a partida', 4); setTimeout(() => Gm().quitToMenu && Gm().quitToMenu(), 2500); } status('Desconectado da sala.'); }
      });
    });
  };
  function guestRecv(m) {
    if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { return; } }
    if (!m || !m.t) return;
    switch (m.t) {
      case 'welcome': MP.myId = m.id; return;
      case 'err': status(m.msg); return;
      case 'lobby': MP.players = m.players; MP.lobby = m; ui(); return;
      case 'pong': MP.ping = Math.round(performance.now() - m.s); return;
      case 'start': startGuest(m); return;
    }
    if (!ready) { queue.push(m); return; }
    applyEvent(m);
  }
  function startGuest(m) {
    const g = Gm();
    MP.startMsg = m; ready = false; queue = []; snaps = [];
    g.settings.map = m.map; g.settings.rounds = m.rounds; g.settings.team = m.roster[m.you].team;
    MP.myHostGroup = m.roster[m.you].group;
    g.clientMode = true;
    close();
    g.startMatch();
  }
  // chamado por startMatch no convidado depois de criar os agentes
  MP.guestReady = () => {
    ready = true;
    const q = queue; queue = [];
    for (const m of q) applyEvent(m);
  };

  // ---- aplicação de estado ----
  let snaps = [];
  function applyEvent(m) {
    const gm = Gm(), A = gm.agents, h = gm.human;
    switch (m.t) {
      case 's': {
        snaps.push({ t: performance.now() / 1000, m }); while (snaps.length > 12) snaps.shift();
        gm.phase = m.ph; gm.phaseT = m.pt; gm.roundTime = m.rt; gm.round = m.rd;
        gm.groupScore = MP.myHostGroup === 1 ? [m.gs[1], m.gs[0]] : m.gs.slice();
        // portas
        const ds = M.doors || []; for (let i = 0; i < ds.length && i < m.dr.length; i++) { const o = m.dr[i] === '1'; if (ds[i].open !== o) { ds[i].open = o; if (!o) ds[i].off = false; } }
        // bomba
        bombState(m.bm);
        // estado não-posicional de todos
        m.ag.forEach((s, i) => {
          const a = A[i]; if (!a) return;
          const wasAlive = a.alive;
          a.hp = s[9]; a.armor = s[10]; a.alive = !!s[11];
          a.helmet = !!(s[14] & 2); a.kit = !!(s[14] & 4);
          if (a.alive && !wasAlive) { a.deadT = 0; if (a.model) { a.model.root.visible = true; a.model.root.rotation.set(0, 0, 0); } }
          if (!a.alive && wasAlive) { a.deadT = 0; }
          if (a !== h) {
            const slot = SLOT[s[12]] || 'knife', def = G.W[s[13]] || G.W.knife;
            a.cur = slot; setPuppetWeapon(a, slot, def);
            a.planting = s[14] & 8 ? 1 : 0; a.defusing = s[14] & 16 ? 1 : 0;
          }
        });
        if (m.me) applyMe(m.me);
        return;
      }
      case 'rs': roundStart(m); return;
      case 're': {
        const winner = m.w; const txt = { elim: 'eliminaram o time inimigo', bomb: 'detonaram a bomba', defuse: 'desarmaram a bomba', time: 'seguraram até o fim do tempo' }[m.r];
        G.HUD.banner(winner === 'T' ? 'INSURGENTES VENCEM' : 'FORÇA TÁTICA VENCE', winner, `Eles ${txt}` + (m.mvp ? ` · MVP: ${m.mvp}` : ''), 4.5);
        G.Audio.ui(winner === h.team ? 'win' : 'lose');
        gm.history.push({ side: winner, reason: m.r, icon: { elim: '☠', bomb: '✹', defuse: '✂', time: '⏱' }[m.r] });
        gm.roundEnded = true;
        return;
      }
      case 'ht': G.HUD.banner('TROCA DE LADOS', h.team === 'T' ? 'CT' : 'T', 'Os times trocam de lado', 4); G.Audio.ui('start'); return;
      case 'k': {
        const v = A[m.v], k = m.a >= 0 ? A[m.a] : null; if (!v) return;
        v.alive = false; v.deadT = 0; v.planting = v.defusing = 0;
        G.HUD.killfeed(k, v, m.w, m.hs, v === h || k === h);
        if (v === h) gm._onLocalDeath();
        else if (gm._viewTarget() === v) setTimeout(() => gm._cycleSpectate(), 1200);
        return;
      }
      case 'f': { const a = A[m.i]; if (a && a !== h) C.puppetShot(a, G.W[m.w] || G.W.kalash, m.y, m.p, !!m.s, m.n || 1); return; }
      case 'kn': { const a = A[m.i]; if (a && a !== h) { a.lastShot = gm.time; G.Audio.knife(a.pos); } return; }
      case 'nd': { const a = A[m.i]; if (a && a !== h) C.netNade(a, m.id, toV(m.p), toV(m.v)); return; }
      case 'd+': C.netDrop(m); return;
      case 'dc': M.netDoorChunk(m.d, m.c); return;
      case 'wn': M.netWindow(m.w, m.o); return;
      case 'wb': M.netWindowBreak(m.w); return;
      case 'db': M.breakDoor((M.doors || [])[m.d]); return;
      case 'd-': C.netDropRemove(m.n); return;
      case 'hm': G.HUD.hitmarker(!!m.h, !!m.k); G.Audio.hitConfirm(!!m.h); return;
      case 'dm': if (m.f) G.HUD.damageFrom(h, toV(m.f)); gm.shakeLocal(0.15); return;
      case 'bm': if (m.e) { G.Audio.ui('deny'); G.HUD.centerMsg(m.e, 1.4); } else G.Audio.ui('buy'); if (G.HUD.buyOpen) G.HUD.renderBuy(gm); return;
      case 'pl': G.Audio.ui('planted'); G.HUD.banner('BOMBA PLANTADA', 'T', `Bombsite ${m.site} · ${m.tm} segundos`, 2.5); return;
      case 'bx': bombExplodeFx(toV(m.p)); return;
      case 'st': m.a.forEach((s, i) => { const a = A[i]; if (!a) return; Object.assign(a.stats, { k: s[0], d: s[1], a: s[2], hs: s[3], mvp: s[4], dmg: s[5] }); a.money = s[6]; }); return;
      case 'msg': G.HUD.centerMsg(m.s, m.d || 2); return;
      case 'kick': kicked(m); return;
      case 'ov': {
        gm.phase = 'over';
        const gs = MP.myHostGroup === 1 ? [m.gs[1], m.gs[0]] : m.gs;
        gm.groupScore = gs.slice();
        G.HUD.banner(gs[0] > gs[1] ? 'VITÓRIA!' : gs[0] < gs[1] ? 'DERROTA' : 'EMPATE', h.team, `Placar final ${gs[0]} × ${gs[1]}`, 9999);
        G.HUD.toggleScoreboard(true, gm);
        if (document.exitPointerLock) document.exitPointerLock();
        if (G.Menu) setTimeout(() => G.Menu.onMatchEnd({
          map: M.current, mapName: M.def.name, result: gs[0] > gs[1] ? 'win' : gs[0] < gs[1] ? 'loss' : 'draw', score: gs,
          k: h.stats.k, d: h.stats.d, a: h.stats.a, hs: h.stats.hs, mvp: h.stats.mvp, dmg: h.stats.dmg, rounds: gm.round, team: h.team,
          rank: A.slice().sort((x, y) => y.stats.k - x.stats.k || y.stats.dmg - x.stats.dmg).indexOf(h) + 1, diff: gm.settings.diff, online: true
        }), 2500);
        return;
      }
    }
  }
  function setPuppetWeapon(a, slot, def) {
    if (slot === 'grenade') { a.inv.grenades = [def.id]; a.nadeIdx = 0; }
    else if (slot === 'c4') a.inv.c4 = true;
    else if (slot === 'knife') { }
    else if (!a.inv[slot] || a.inv[slot].def !== def) a.inv[slot] = a.inst(def);
  }
  let lastHostCur = null;
  function applyMe(me) {
    const h = Gm().human; if (!h) return;
    const mk = (w) => { if (!w) return null; const d = G.W[w[0]]; if (!d) return null; return { def: d, ammo: w[1], reserve: w[2], silencer: !!w[3], burst: !!w[4], zoom: 0 }; };
    const recent = Gm().time - h.lastShot < 0.6 || h.reloadT > 0;
    for (const [k, w] of [['primary', me.p], ['secondary', me.s]]) {
      const cur = h.inv[k];
      if (!w) { h.inv[k] = null; continue; }
      if (!cur || cur.def.id !== w[0]) { h.inv[k] = mk(w); continue; }
      if (!recent) { cur.ammo = w[1]; cur.reserve = w[2]; }
      cur.silencer = !!w[3];
    }
    h.inv.grenades = me.g.slice(); h.inv.c4 = !!me.c4; h.inv.taser = me.tz ? (h.inv.taser || h.inst(G.W.taser)) : null;
    h.money = me.m; h.helmet = !!me.hl; h.kit = !!me.kit;
    h.planting = me.pl; h.defusing = me.df;
    // o anfitrião trocou a arma (plantar, jogar fora, granada acabou…)
    if (me.cur !== lastHostCur) { lastHostCur = me.cur; if (me.cur !== h.cur && performance.now() - (MP.lastSw || 0) > 600 && h.has(me.cur)) { applying = true; h.switchTo(me.cur, true); applying = false; } }
    if (!h.has(h.cur)) { applying = true; h.switchTo(h.bestSlot(), true); applying = false; }
  }
  function roundStart(m) {
    const gm = Gm(), A = gm.agents, h = gm.human;
    C.clearRound(); M.resetDoors();
    if (gm.bombMesh) { gm.scene.remove(gm.bombMesh); gm.bombMesh = null; }
    gm.bomb = { state: 'carried', pos: null, site: null, timer: 0, beepT: 0 };
    gm.phase = 'freeze'; gm.roundEnded = false; gm.round = m.rd;
    m.ag.forEach((s, i) => {
      const a = A[i]; if (!a) return;
      if (a.team !== s[3]) { a.team = s[3]; a.agentId = s[4]; gm._makeModel(a); if (a === h) { gm.settings.team = a.team; MP.myHostGroup = s[5]; } }
      a.spawn({ x: s[0], z: s[1] }, s[2]);
    });
    for (const a of A) a.group = a.team === h.team ? 0 : 1;
    gm._setView(h); gm.spectating = false;
    applying = true; h.switchTo(h.bestSlot(), true); applying = false;
    G.HUD.banner(m.pistol ? 'RODADA DE PISTOLAS' : `RODADA ${m.rd}`, h.team, h.team === 'T' ? 'Insurgentes: plante a bomba no bombsite A ou B' : 'Força Tática: defenda os bombsites A e B', 2.5);
    if (G.Cheats) G.Cheats.onRoundStart();
  }
  function bombState(bm) {
    const gm = Gm(), b = gm.bomb; if (!b || !bm) return;
    if (bm.s === 'planted' && b.state !== 'planted') {
      b.pos = toV(bm.p); b.site = bm.site; b.planted = true;
      gm.bombMesh = G.Models.bomb(); gm.bombMesh.position.copy(b.pos); gm.scene.add(gm.bombMesh);
    }
    if (bm.s !== 'planted' && b.state === 'planted' && bm.s !== 'exploded' && bm.s !== 'defused') { if (gm.bombMesh) { gm.scene.remove(gm.bombMesh); gm.bombMesh = null; } }
    b.state = bm.s; if (bm.p) b.pos = toV(bm.p);
    if (bm.s === 'planted') b.timer = bm.tm;
  }
  function bombExplodeFx(p) {
    const gm = Gm();
    G.Audio.explosion(p, true);
    C.spriteFx(p.clone().add(new THREE.Vector3(0, 2, 0)), G.Tex.get('flashSprite', 64), 26, 1.2, 0xffaa55);
    for (let i = 0; i < 14; i++) C.dust(p.clone().add(new THREE.Vector3(U.rand(-6, 6), U.rand(0, 6), U.rand(-6, 6))), 6, 0x6a5a48);
    gm.shake(p, 3);
    if (gm.bombMesh) { gm.scene.remove(gm.bombMesh); gm.bombMesh = null; }
  }
  function kicked(m) {
    G.HUD.banner('REMOVIDO PELO GUARDIÃO', '', m.why || 'Sinais de trapaça na análise do anfitrião', 6);
    setTimeout(() => { MP.leave(); Gm().quitToMenu(); }, 4000);
  }

  // ---- passo do convidado ----
  let inT = 0, pingT = 0;
  MP.stepClient = (dt) => {
    const gm = Gm(), h = gm.human; if (!h) return;
    if (gm.phase === 'over') return;
    const frozen = gm.phase === 'freeze';
    if (h.alive) gm._humanInput(); else { const i = h.input; i.fwd = i.side = 0; i.fire = i.fire2 = i.use = false; }
    if (G.Cheats) G.Cheats.afterInput(dt, frozen);
    if (h.alive) { h.physics(dt, frozen); C.updateWeapon(h, dt, gm.time, frozen); gm._footstep(h, dt); }
    interp();
    for (const a of gm.agents) if (a !== h && a.alive) { C.updateWeapon(a, dt, gm.time, true); gm._footstep(a, dt); }
    C.updateNades(dt); C.updateDrops(dt); C.updateFx(dt);
    M.tickDoors(dt);
    bombTick(dt);
    if (G.Cheats) G.Cheats.afterStep(dt);
    // entrada para o anfitrião (~30×/s)
    inT -= dt; pingT -= dt;
    if (inT <= 0 && h.alive) {
      inT = 1 / 30;
      const i = h.input;
      MP.send({ t: 'in', p: v3(h.pos), v: v3(h.vel), y: r3(h.yaw), pi: r3(h.pitch), c: r2(h.crouch), mv: [r2(i.fwd), r2(i.side)],
        f: (h.onGround ? 1 : 0) | (i.walk ? 2 : 0) | (i.crouch ? 4 : 0) | (i.jump ? 8 : 0) | (i.use ? 16 : 0) | (i.reload ? 32 : 0) | (i.fire ? 64 : 0) | (i.fire2 ? 128 : 0) | (h.jumpBuffered ? 256 : 0),
        zm: h.zoom | 0, sl: (h.weapon() || {}).silencer ? 1 : 0, bu: (h.weapon() || {}).burst ? 1 : 0 });
    }
    if (pingT <= 0) { pingT = 2; MP.send({ t: 'ping', s: performance.now() }); }
  };
  // interpola os outros agentes ~100 ms no passado
  function interp() {
    const gm = Gm(), A = gm.agents, h = gm.human;
    if (snaps.length < 1) return;
    const rt = performance.now() / 1000 - 0.1;
    let s0 = snaps[0], s1 = snaps[snaps.length - 1];
    for (let i = 0; i < snaps.length - 1; i++) if (snaps[i].t <= rt && snaps[i + 1].t >= rt) { s0 = snaps[i]; s1 = snaps[i + 1]; break; }
    const k = s1.t > s0.t ? U.clamp((rt - s0.t) / (s1.t - s0.t), 0, 1) : 1;
    for (let i = 0; i < A.length; i++) {
      const a = A[i]; if (a === h) continue;
      const p = s0.m.ag[i], q = s1.m.ag[i]; if (!p || !q) continue;
      a.pos.set(U.lerp(p[0], q[0], k), U.lerp(p[1], q[1], k), U.lerp(p[2], q[2], k));
      a.vel.set(q[3], q[4], q[5]);
      a.yaw = p[6] + U.angDiff(p[6], q[6]) * k; a.pitch = U.lerp(p[7], q[7], k);
      a.crouch = U.lerp(p[8], q[8], k); a.height = U.lerp(1.8, 1.3, a.crouch); a.onGround = !!(q[14] & 1);
    }
  }
  function bombTick(dt) {
    const gm = Gm(), b = gm.bomb; if (!b || b.state !== 'planted') return;
    b.timer -= dt;
    const frac = U.clamp(b.timer / gm.bombTime, 0, 1), interval = 0.12 + 0.9 * frac;
    b.beepT = (b.beepT || 0) - dt;
    if (b.beepT <= 0) { b.beepT = interval; G.Audio.beep(b.pos, b.timer < 1.5); if (gm.bombMesh) gm.bombMesh.userData.ledT = 0.08; }
    const bmm = gm.bombMesh;
    if (bmm && bmm.userData.setLCD) { const txt = '00:' + String(Math.max(0, Math.ceil(b.timer))).padStart(2, '0'); if (txt !== bmm.userData.lcdTxt) { bmm.userData.lcdTxt = txt; bmm.userData.setLCD(txt); } }
    if (bmm && bmm.userData.led) { bmm.userData.ledT = (bmm.userData.ledT || 0) - dt; bmm.userData.led.material.color.setHex(bmm.userData.ledT > 0 ? 0xff3030 : 0x401010); }
  }

  // ---- ações locais do convidado que o anfitrião precisa saber ----
  let applying = false;
  const origSwitch = G.Agent.prototype.switchTo;
  G.Agent.prototype.switchTo = function (slot, force) {
    const r = origSwitch.call(this, slot, force);
    if (r && MP.role === 'guest' && Gm().clientMode && this.isHuman && !applying) { MP.send({ t: 'sw', s: this.cur, n: this.nadeIdx }); MP.lastSw = performance.now(); }
    return r;
  };
  MP.ownShot = (a, vy, vp, by, bp) => MP.send({ t: 'sh', vy: r3(vy), vp: r3(vp), by: r3(by), bp: r3(bp) });
  MP.ownKnife = (heavy) => MP.send({ t: 'kn', h: heavy ? 1 : 0 });
  MP.ownNade = (id, s, y, p) => MP.send({ t: 'nd', id, s: r2(s), y: r3(y), p: r3(p) });
  MP.buy = (def) => MP.send({ t: 'buy', id: def.id });
  MP.use = () => MP.send({ t: 'use' });
  MP.drop = () => MP.send({ t: 'drop' });

  // ---- Guardião no online: remove o trapaceiro (o anfitrião julga) ----
  MP.kickCheater = (a, reasons) => {
    const p = MP.players.find(x => x.agent === a); if (!p) return;
    send(p.conn, { t: 'kick', why: 'Sinais: ' + reasons.slice(0, 3).join(', ') });
    G.HUD.centerMsg(`Guardião removeu ${a.name} por trapaça`, 4);
    MP.emit('msg', { s: `Guardião removeu ${a.name} por trapaça`, d: 4 }, a);
    setTimeout(() => { try { p.conn.close(); } catch (e) { } }, 1500);
    a.remote = null; a.applyDamage(999, 1, 'generic', null, null);
  };

  // ================= Interface (sala) =================
  function el() {
    let p = $('mpPanel'); if (p) return p;
    p = document.createElement('div'); p.id = 'mpPanel'; p.className = 'hidden';
    document.body.appendChild(p);
    return p;
  }
  MP.open = () => { el().classList.remove('hidden'); ui(); };
  function close() { const p = $('mpPanel'); if (p) p.classList.add('hidden'); }
  MP.close = close;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function ui() {
    const p = $('mpPanel'); if (!p || p.classList.contains('hidden')) return;
    const s = Gm().settings, defs = M.defs, inRoom = !!MP.role;
    const link = MP.code ? location.origin + location.pathname + '?sala=' + MP.code : '';
    const lobby = MP.role === 'guest' ? (MP.lobby || {}) : { map: s.map, rounds: s.rounds, bots: MP.bots };
    const col = t => MP.players.filter(x => x.team === t).map(x => `<div class="pl ${x.id === (MP.role === 'host' ? 'host' : MP.myId) ? 'me' : ''}">${x.host ? '★ ' : ''}${esc(x.name)}</div>`).join('') || '<div class="pl empty">—</div>';
    const mapName = id => defs[id] ? defs[id].name : id;
    p.innerHTML = `<div class="mp-box">
      <header><b>JOGAR ONLINE</b><button class="x" id="mpX">✕</button></header>
      ${!inRoom ? `<div class="mp-start">
        <label>Seu nome <input id="mpName" maxlength="16" value="${esc(myName())}"></label>
        <button class="pri" id="mpHost">Criar sala</button>
        <div class="or">ou entre com o código</div>
        <div class="join"><input id="mpCode" maxlength="5" placeholder="CÓDIGO" value="${esc(MP.pendingCode || '')}"><button id="mpJoin">Entrar</button></div>
        <p class="note">Funciona pela internet, de navegador para navegador (inclusive celular). Quem cria a sala roda os bots e as regras: mantenha essa aba aberta.</p>
      </div>` : `<div class="mp-lobby">
        <div class="code">Sala <b>${MP.code}</b> <button id="mpCopy">Copiar link</button>${MP.ping ? `<span class="ping">${MP.ping} ms</span>` : ''}</div>
        <div class="teams"><div class="tm T"><h4>INSURGENTES</h4>${col('T')}<button data-team="T">Entrar</button></div><div class="tm CT"><h4>FORÇA TÁTICA</h4>${col('CT')}<button data-team="CT">Entrar</button></div></div>
        ${MP.role === 'host' ? `<div class="opts">
          <label>Mapa <select id="mpMap">${Object.keys(defs).map(id => `<option value="${id}" ${id === s.map ? 'selected' : ''}>${esc(defs[id].name)}</option>`).join('')}</select></label>
          <label>Rodadas <select id="mpRounds">${[24, 16, 6].map(n => `<option value="${n}" ${n === s.rounds ? 'selected' : ''}>MR${n / 2}</option>`).join('')}</select></label>
          <label class="chk"><input type="checkbox" id="mpBots" ${MP.bots ? 'checked' : ''}> Completar com bots</label>
        </div><button class="pri" id="mpGo">COMEÇAR PARTIDA</button>`
        : `<div class="opts info">Mapa: <b>${esc(mapName(lobby.map))}</b> · MR${(lobby.rounds || 24) / 2}${lobby.bots ? ' · com bots' : ''}</div><div class="wait">Aguardando o anfitrião começar…</div>`}
        <button id="mpLeave" class="ghost">Sair da sala</button>
      </div>`}
      <div class="st">${esc(MP.status || '')}</div>
    </div>`;
    $('mpX').onclick = close;
    if (!inRoom) {
      const nm = $('mpName'); nm.onchange = () => { try { localStorage.setItem('et_mpname', nm.value.trim()); } catch (e) { } };
      $('mpHost').onclick = () => { nm.onchange(); MP.host(); };
      $('mpJoin').onclick = () => { nm.onchange(); MP.join($('mpCode').value); };
      $('mpCode').onkeydown = e => { if (e.key === 'Enter') $('mpJoin').click(); };
    } else {
      $('mpCopy').onclick = () => { try { navigator.clipboard.writeText(link); status('Link copiado: ' + link); } catch (e) { status(link); } };
      p.querySelectorAll('[data-team]').forEach(b => b.onclick = () => MP.setTeam(b.dataset.team));
      $('mpLeave').onclick = () => { MP.leave(); status(''); };
      if (MP.role === 'host') {
        $('mpMap').onchange = e => { s.map = e.target.value; Gm().saveSettings(); lobbyChanged(); };
        $('mpRounds').onchange = e => { s.rounds = +e.target.value; Gm().saveSettings(); lobbyChanged(); };
        $('mpBots').onchange = e => { MP.bots = e.target.checked; lobbyChanged(); };
        $('mpGo').onclick = () => MP.start();
      }
    }
  }
  MP.ui = ui;
  // link com ?sala=CODIGO abre a sala direto
  window.addEventListener('load', () => {
    const m = /[?&]sala=([A-Za-z0-9]{5})/.exec(location.search);
    if (m) { MP.pendingCode = m[1].toUpperCase(); setTimeout(() => { MP.open(); }, 600); }
  });
})();
