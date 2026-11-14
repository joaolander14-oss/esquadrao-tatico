// Menu principal: Jogar · Arsenal · Carreira · Configurações, fila de partida, carregamento e fim de partida.
(function () {
  const Mn = G.Menu = {};
  const U = G.U, M = G.Map;
  const Gm = () => G.Game;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MODES = [
    { id: 24, name: 'Competitivo', sub: 'MR12 · 24 rodadas', desc: 'Partida completa com troca de lados no meio. Vence quem chegar a 13.' },
    { id: 16, name: 'Casual', sub: 'MR8 · 16 rodadas', desc: 'Partida mais curta, mesma economia e regras.' },
    { id: 6, name: 'Relâmpago', sub: 'MR3 · 6 rodadas', desc: 'Para uma partida rápida de 10 minutos.' }
  ];
  const DIFFS = ['Fácil', 'Normal', 'Difícil', 'Expert'];
  const RANKS = ['Recruta', 'Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Coronel', 'General', 'Lenda'];
  const TIPS = [
    'Pare de andar antes de atirar: a precisão cai muito em movimento.',
    'Puxe o mouse para baixo durante o spray para compensar o recuo.',
    'Com o kit de desarme você desarma a bomba em 5 segundos em vez de 10.',
    'Perder rodadas seguidas aumenta o bônus de dinheiro na próxima.',
    'A Atordoante cega quem estiver olhando para ela; vire de costas!',
    'Caixas de madeira podem ser atravessadas por rifles e snipers.',
    'Fumaça apaga o fogo do Coquetel e da Incendiária.',
    'Ande com Shift para não fazer barulho de passos.',
    'No Porto Ferrugem, o armazém do B tem só duas entradas: use granadas.',
    'Na Vila Nevada, a varanda do celeiro dá vantagem de altura no B.',
    'No Bairro Colonial, o terraço do A domina a saída da arcada.'
  ];
  const NEWS = [
    { tag: 'Mapa novo', title: 'Porto Ferrugem', text: 'Terminal de cargas sob chuva fina: contêineres empilhados no A e um armazém fechado no B.', map: 'porto' },
    { tag: 'Mapa novo', title: 'Vila Nevada', text: 'Aldeia na neve com igreja, celeiro e túnel de pedra. Cuidado com a varanda!', map: 'nevada' },
    { tag: 'Mapa novo', title: 'Bairro Colonial', text: 'Ruas de paralelepípedo ao pôr do sol, arcada coberta e mercado no meio.', map: 'colonial' },
    { tag: 'Atualização', title: 'Painel Invicto', text: 'Durante a partida, aperte Insert ou F8 para abrir o painel de trapaças offline.' }
  ];

  // ---------------- Perfil / carreira ----------------
  const defProfile = () => ({ name: 'Jogador', xp: 0, stats: { matches: 0, wins: 0, losses: 0, draws: 0, k: 0, d: 0, a: 0, hs: 0, mvp: 0, dmg: 0, rounds: 0 }, maps: {}, history: [] });
  let profile = defProfile();
  try { const p = JSON.parse(localStorage.getItem('et_profile') || 'null'); if (p) profile = Object.assign(defProfile(), p, { stats: Object.assign(defProfile().stats, p.stats || {}) }); } catch (e) { }
  const saveProfile = () => { try { localStorage.setItem('et_profile', JSON.stringify(profile)); } catch (e) { } };
  const levelOf = xp => Math.floor(xp / 1000) + 1;
  const rankOf = lvl => RANKS[Math.min(RANKS.length - 1, Math.floor((lvl - 1) / 3))];
  const initials = n => (n || 'J').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  function emblem(lvl, size) {
    const r = Math.min(RANKS.length - 1, Math.floor((lvl - 1) / 3)), chev = r % 4 + 1, tier = Math.floor(r / 4);
    const col = ['#c9a36a', '#d8dde3', '#ffcc33'][tier] || '#ffcc33';
    let p = '';
    for (let i = 0; i < chev; i++) p += `<path d="M8 ${30 - i * 7} L24 ${22 - i * 7} L40 ${30 - i * 7}" stroke="${col}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    if (tier >= 2) p += `<path d="M24 4 l3 6 7 1 -5 5 1 7 -6-3 -6 3 1-7 -5-5 7-1z" fill="${col}"/>`;
    return `<svg viewBox="0 0 48 40" width="${size}" height="${size * 0.83}">${p}</svg>`;
  }

  // ---------------- Miniaturas dos mapas ----------------
  const thumbs = {};
  function makeThumbs() {
    const cur = M.current;
    for (const d of M.list) { M.load(d.id); thumbs[d.id] = M.radarImage(6).toDataURL(); }
    M.load(Gm().settings.map in M.defs ? Gm().settings.map : cur);
  }

  // ---------------- Estrutura ----------------
  let tab = 'play', queueTimer = null;
  const root = $('menu');
  function build() {
    root.className = 'mm';
    root.innerHTML = `
      <div class="mm-vignette"></div>
      <header class="mm-top">
        <div class="mm-logo"><b>ESQUADRÃO</b><span>TÁTICO</span></div>
        <nav class="mm-nav">
          <button data-tab="play">Jogar</button><button data-tab="agents">Agentes</button><button data-tab="arsenal">Arsenal</button><button data-tab="career">Carreira</button><button data-tab="settings">Configurações</button>
        </nav>
        <div class="mm-profile" data-tab="career"><div class="av"></div><div class="info"><div class="nm"></div><div class="lv"><span class="rk"></span><i><b></b></i></div></div><div class="em"></div></div>
      </header>
      <main class="mm-body"></main>
      <div id="mmQueue" class="hidden"></div>`;
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { if (queueTimer) return; tab = b.dataset.tab; render(); G.Audio.init(); G.Audio.ui('buy'); });
    render();
  }
  function renderTop() {
    root.querySelectorAll('.mm-nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const lvl = levelOf(profile.xp);
    root.querySelector('.mm-profile .av').textContent = initials(profile.name);
    root.querySelector('.mm-profile .nm').textContent = profile.name;
    root.querySelector('.mm-profile .rk').textContent = `Nível ${lvl} · ${rankOf(lvl)}`;
    root.querySelector('.mm-profile .lv b').style.width = (profile.xp % 1000) / 10 + '%';
    root.querySelector('.mm-profile .em').innerHTML = emblem(lvl, 34);
  }
  function render() {
    renderTop();
    const body = root.querySelector('.mm-body');
    body.className = 'mm-body tab-' + tab;
    if (Mn.preview && tab !== 'arsenal') stopPreview();
    if (tab === 'play') renderPlay(body);
    else if (tab === 'arsenal') renderArsenal(body);
    else if (tab === 'agents') renderAgents(body);
    else if (tab === 'career') renderCareer(body);
    else renderSettings(body);
  }

  // ---------------- JOGAR ----------------
  function renderPlay(body) {
    const s = Gm().settings;
    const teamSel = s.teamPick || s.team;
    body.innerHTML = `
      <section class="mm-col mm-left">
        <h3>Modo de jogo</h3>
        <div class="mm-modes">${MODES.map(m => `<div class="mm-mode ${s.rounds === m.id ? 'on' : ''}" data-mode="${m.id}"><div class="t">${m.name}</div><div class="s">${m.sub}</div><p>${m.desc}</p></div>`).join('')}</div>
        <h3>Seu lado</h3>
        <div class="mm-seg" id="mmTeam">${[['T', 'Insurgentes'], ['CT', 'Força Tática'], ['R', 'Aleatório']].map(([v, l]) => `<button data-v="${v}" class="${teamSel === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <h3>Bots</h3>
        <div class="mm-seg" id="mmDiff">${DIFFS.map((l, i) => `<button data-v="${i}" class="${s.diff === i ? 'on' : ''}">${l}</button>`).join('')}</div>
      </section>
      <section class="mm-col mm-center">
        <h3>Mapa <small>Desarme de bomba · 5 contra 5</small></h3>
        <div class="mm-maps">${M.list.map(d => `
          <div class="mm-map ${s.map === d.id ? 'on' : ''}" data-map="${d.id}">
            <div class="img" style="background-image:url(${thumbs[d.id]})"></div>
            <div class="shade" style="--sky:${d.theme && d.theme.sky ? d.theme.sky[1] : '#a9c6de'}"></div>
            ${d.tag ? `<span class="tag ${d.tag === 'Novo' ? 'new' : ''}">${d.tag}</span>` : ''}
            <div class="cap"><div class="n">${esc(d.name)}</div><div class="p">${esc(d.place)}</div></div>
            ${profile.maps[d.id] ? `<div class="rec">${profile.maps[d.id].w}V · ${profile.maps[d.id].l}D</div>` : ''}
          </div>`).join('')}</div>
        <div class="mm-mapdesc"><b>${esc(M.defs[s.map].name)}</b> — ${esc(M.defs[s.map].desc)}</div>
      </section>
      <section class="mm-col mm-right">
        <h3>Novidades</h3>
        <div class="mm-news">${NEWS.map((n, i) => `<div class="mm-new" data-i="${i}"><span>${n.tag}</span><b>${n.title}</b><p>${n.text}</p></div>`).join('')}</div>
        <h3>Esquadrão</h3>
        <div class="mm-squad">
          <div class="me"><div class="av">${initials(profile.name)}</div><div><b>${esc(profile.name)}</b><small>Nível ${levelOf(profile.xp)} · ${rankOf(levelOf(profile.xp))}</small></div><span class="ready">PRONTO</span></div>
          ${[1, 2, 3, 4].map(i => `<div class="bot"><div class="av">B</div><div><b>Bot ${i}</b><small>${DIFFS[s.diff]}</small></div></div>`).join('')}
        </div>
      </section>
      <button class="mm-online util" id="mmUtil">🎯 TREINO DE UTILITÁRIOS 1v0</button>
      <button class="mm-online priv" id="mmPriv">🔒 SALA PRIVADA</button>
      <button class="mm-online" id="mmOnline">🤖 TREINO OFFLINE</button>
      <button class="mm-go" id="mmGo"><span>JOGAR</span><small>Servidor público · ${esc(M.defs[s.map].name)}</small></button>`;
    body.querySelectorAll('.mm-mode').forEach(el => el.onclick = () => { s.rounds = Number(el.dataset.mode); Gm().saveSettings(); render(); });
    body.querySelectorAll('#mmTeam button').forEach(b => b.onclick = () => { s.teamPick = b.dataset.v; if (b.dataset.v !== 'R') s.team = b.dataset.v; Gm().saveSettings(); render(); });
    body.querySelectorAll('#mmDiff button').forEach(b => b.onclick = () => { s.diff = Number(b.dataset.v); Gm().saveSettings(); render(); });
    body.querySelectorAll('.mm-map').forEach(el => el.onclick = () => selectMap(el.dataset.map));
    body.querySelectorAll('.mm-new').forEach(el => el.onclick = () => { const n = NEWS[el.dataset.i]; if (n.map) selectMap(n.map); });
    $('mmGo').onclick = () => { G.Audio.init(); if (G.MP) G.MP.quickPlay(s.map); else startQueue(); };
    $('mmOnline').onclick = () => { G.Audio.init(); startQueue(); };
    $('mmUtil').onclick = () => { G.Audio.init(); launch('util'); };
    $('mmPriv').onclick = () => { G.Audio.init(); if (G.MP) { G.MP.pub = null; G.MP.open(); } };
  }
  function selectMap(id) {
    G.Audio.ui('buy');
    Gm().loadMap(id);
    render();
  }

  // ---------------- Fila de partida ----------------
  function startQueue() {
    const q = $('mmQueue');
    let t = 0;
    const wait = U.rand(2.5, 4.5);
    q.className = 'searching';
    q.innerHTML = `<div class="bar"><div class="spin"></div><div><b>PROCURANDO PARTIDA</b><small>${esc(M.defs[Gm().settings.map].name)} · ${MODES.find(m => m.id === Gm().settings.rounds).name}</small></div><span class="tm">0:00</span><button id="mmCancel">Cancelar</button></div>`;
    $('mmCancel').onclick = cancelQueue;
    root.querySelector('#mmGo').classList.add('busy');
    queueTimer = setInterval(() => {
      t += 0.25;
      q.querySelector('.tm').textContent = '0:' + String(Math.floor(t)).padStart(2, '0');
      if (t >= wait) { clearInterval(queueTimer); queueTimer = null; matchFound(); }
    }, 250);
  }
  function cancelQueue() { if (queueTimer) clearInterval(queueTimer); queueTimer = null; $('mmQueue').className = 'hidden'; const g = root.querySelector('#mmGo'); if (g) g.classList.remove('busy'); }
  function matchFound() {
    const q = $('mmQueue');
    const d = M.defs[Gm().settings.map];
    q.className = 'found';
    q.innerHTML = `<div class="box"><small>PARTIDA ENCONTRADA</small><h2>${esc(d.name)}</h2><div class="dots">${Array(10).fill('<i></i>').join('')}</div><button id="mmAccept">ACEITAR</button><div class="cd"><b></b></div></div>`;
    G.Audio.ui('start');
    let left = 15, accepted = false;
    const cd = q.querySelector('.cd b');
    const iv = setInterval(() => {
      left -= 0.1; cd.style.width = Math.max(0, left / 15 * 100) + '%';
      if (left <= 0 && !accepted) { clearInterval(iv); cancelQueue(); }
    }, 100);
    $('mmAccept').onclick = () => {
      if (accepted) return; accepted = true;
      const dots = [...q.querySelectorAll('.dots i')];
      dots[0].classList.add('ok'); $('mmAccept').disabled = true; $('mmAccept').textContent = 'AGUARDANDO…';
      G.Audio.ui('buy');
      let n = 1;
      const fillIv = setInterval(() => {
        dots[n++].classList.add('ok'); G.Audio.click(0.15);
        if (n >= 10) { clearInterval(fillIv); clearInterval(iv); setTimeout(() => { cancelQueue(); launch(); }, 450); }
      }, U.randi(120, 280));
    };
  }
  function launch(mode) {
    const s = Gm().settings; s.mode = mode || null;
    if (s.teamPick === 'R') s.team = Math.random() < 0.5 ? 'T' : 'CT';
    const d = M.defs[s.map];
    const ld = $('loading');
    ld.className = 'screen mm-loading';
    ld.innerHTML = `<div class="ld-img" style="background-image:url(${thumbs[d.id]})"></div><div class="ld-shade"></div>
      <div class="ld-info"><small>Desarme de bomba · ${MODES.find(m => m.id === s.rounds).name} · Bots ${DIFFS[s.diff]}</small><h1>${esc(d.name)}</h1><p>${esc(d.place)}</p>
      <div class="ld-side">Você joga de <b class="${s.team}">${s.team === 'T' ? 'Insurgentes' : 'Força Tática'}</b></div>
      <div class="ld-tip"><b>DICA</b> ${esc(U.pick(TIPS))}</div><div class="ld-bar"><i></i></div></div>`;
    root.classList.add('hidden');
    setTimeout(() => { ld.querySelector('.ld-bar i').style.width = '100%'; }, 30);
    setTimeout(() => Gm().startMatch(), 1300);
  }

  // ---------------- AGENTES ----------------
  const portraits = {};
  let agentView = null;
  function renderAgents(body) {
    const s = Gm().settings;
    if (!s.agentT) s.agentT = G.Agents.forTeam('T')[0].id;
    if (!s.agentCT) s.agentCT = G.Agents.forTeam('CT')[0].id;
    const view = G.Agents.byId[agentView || s.agentT];
    for (const a of G.Agents.list) if (!portraits[a.id]) portraits[a.id] = G.Agents.portrait(a.id, 180, 240);
    const big = G.Agents.portrait(view.id, 420, 560, true);
    const grid = team => G.Agents.forTeam(team).map(a => `<div class="ag-card ${s['agent' + team] === a.id ? 'on' : ''} ${view.id === a.id ? 'view' : ''}" data-id="${a.id}"><img src="${portraits[a.id]}"><b>${esc(a.name)}</b><small>${esc(a.role)}</small>${s['agent' + team] === a.id ? '<span>EQUIPADO</span>' : ''}</div>`).join('');
    body.innerHTML = `
      <section class="mm-col ag-side"><h3>Insurgentes <small>lado T</small></h3><div class="ag-grid">${grid('T')}</div></section>
      <section class="mm-col ag-stage ${view.team}"><img src="${big}"><div class="ag-info"><small>${view.team === 'T' ? 'Insurgentes' : 'Força Tática'}</small><h2>${esc(view.name)}</h2><p>${esc(view.role)}</p>
        <button id="agEquip" class="${s['agent' + view.team] === view.id ? 'eq' : ''}">${s['agent' + view.team] === view.id ? 'EQUIPADO' : 'EQUIPAR'}</button></div></section>
      <section class="mm-col ag-side"><h3>Força Tática <small>lado CT</small></h3><div class="ag-grid">${grid('CT')}</div></section>`;
    body.querySelectorAll('.ag-card').forEach(el => {
      el.onclick = () => { agentView = el.dataset.id; G.Audio.ui('buy'); render(); };
      el.ondblclick = () => { const a = G.Agents.byId[el.dataset.id]; s['agent' + a.team] = a.id; Gm().saveSettings(); render(); };
    });
    $('agEquip').onclick = () => { s['agent' + view.team] = view.id; Gm().saveSettings(); G.Audio.ui('start'); render(); };
  }

  // ---------------- ARSENAL ----------------
  let arsenalSel = 'kalash';
  function renderArsenal(body) {
    const cats = [['pistol', 'Pistolas'], ['smg', 'Submetralhadoras'], ['heavy', 'Pesadas'], ['rifle', 'Rifles'], ['sniper', 'Snipers'], ['grenade', 'Granadas'], ['equip', 'Equipamento'], ['knife', 'Faca']];
    const d = G.W[arsenalSel];
    const bar = (l, v, txt) => `<div class="st"><span>${l}<b>${txt}</b></span><i><b style="width:${U.clamp(v, 0.03, 1) * 100}%"></b></i></div>`;
    let stats = '';
    if (d.dmg && d.cat !== 'grenade' && d.cat !== 'equip' && d.cat !== 'c4') {
      stats = bar('Dano', d.dmg * d.pellets / 120, d.dmg + (d.pellets > 1 ? '×' + d.pellets : '')) + bar('Cadência', d.rpm / 900, d.rpm + ' rpm') +
        bar('Controle de recuo', 1 - (d.recoil.up || 0) / 3, '') + bar('Mobilidade', ((d.speed || 250) - 180) / 70, (d.speed || 250) + '') + bar('Perfuração de colete', d.ap || 0, Math.round((d.ap || 0) * 100) + '%') +
        (d.mag ? `<div class="kv"><span>Pente</span><b>${d.mag} / ${d.reserve}</b></div>` : '') + `<div class="kv"><span>Recompensa por abate</span><b>$${d.reward}</b></div>` +
        (d.hs ? `<div class="kv"><span>Dano na cabeça (sem colete)</span><b>${Math.round(d.dmg * d.hs)}</b></div>` : '');
    }
    const SK = G.Skins, canSkin = SK && d.shape && d.cat !== 'grenade' && d.cat !== 'c4';
    const curF = canSkin ? (SK.data.skins[d.id] || '') : '';
    const skins = !canSkin ? '' : `<div class="inv">
      ${d.cat === 'knife' ? `<h4>Estilo da faca <small>${SK.KNIVES.length} estilos</small></h4><div class="inv-knives">${SK.KNIVES.map(k => `<button class="kn ${k[0] === (SK.data.knife || 'combate') ? 'on' : ''}" data-k="${k[0]}" title="${esc(k[2])}">${esc(k[1])}</button>`).join('')}</div>` : ''}
      <h4>Acabamento <small style="color:${SK.RARITY[(SK.byId[curF] || ['', '', 0])[2]][1]}">${esc((SK.byId[curF] || ['', 'Padrão'])[1])} · ${SK.RARITY[(SK.byId[curF] || ['', '', 0])[2]][0]}</small></h4>
      <div class="inv-fin">${SK.FINISHES.map(f => `<button class="fin ${curF === f[0] ? 'on' : ''}" data-f="${f[0]}" title="${esc(f[1])} · ${SK.RARITY[f[2]][0]}" style="--rc:${SK.RARITY[f[2]][1]}">${f[0] ? `<img src="${SK.thumb(f[0])}" alt="">` : '<span>—</span>'}<i>${esc(f[1])}</i></button>`).join('')}</div>
      <small class="note">Vale só para as suas armas (1ª pessoa e o seu boneco). ${G.Cheats && G.Cheats.cfg.skins[d.id] ? 'O painel Invicto está sobrescrevendo esta arma.' : ''}</small></div>`;
    body.innerHTML = `
      <section class="mm-col mm-arlist">${cats.map(([c, n]) => { const list = G.W.all.filter(w => w.cat === c && (w.price > 0 || c === 'knife')); return list.length ? `<h3>${n}</h3>${list.map(w => `<div class="ar-item ${w.id === arsenalSel ? 'on' : ''}" data-id="${w.id}"><span>${esc(w.name)}</span><small>${w.price ? '$' + w.price : ''}${w.team !== 'both' ? ' · ' + (w.team === 'T' ? 'Ins.' : 'F.T.') : ''}</small></div>`).join('')}` : ''; }).join('')}</section>
      <section class="mm-col mm-arview"><div class="ar-stage" id="arStage"></div>
        <div class="ar-title"><h2>${esc(d.cat === 'knife' && G.Skins ? G.Skins.knifeById[G.Skins.data.knife || 'combate'][1] : d.name)}</h2><span>${{ pistol: 'Pistola', smg: 'Submetralhadora', heavy: 'Pesada', rifle: 'Rifle', sniper: 'Sniper', grenade: 'Granada', equip: 'Equipamento', knife: 'Faca', c4: 'Explosivo' }[d.cat]}${d.team !== 'both' ? ' · ' + (d.team === 'T' ? 'Insurgentes' : 'Força Tática') : ''}</span></div></section>
      <section class="mm-col mm-arstats"><div class="price">${d.price ? '$' + d.price : 'Padrão'}</div><p>${esc(d.desc || '')}</p>${stats}${skins}</section>`;
    body.querySelectorAll('.ar-item').forEach(el => el.onclick = () => { arsenalSel = el.dataset.id; render(); });
    body.querySelectorAll('.inv-fin .fin').forEach(b => b.onclick = () => { G.Skins.equip(d.id, b.dataset.f); G.Audio.ui && G.Audio.ui('buy'); render(); });
    body.querySelectorAll('.inv-knives .kn').forEach(b => b.onclick = () => { G.Skins.setKnife(b.dataset.k); G.Audio.ui && G.Audio.ui('buy'); render(); });
    showPreview(d);
  }
  function showPreview(def) {
    const stage = $('arStage'); if (!stage) return;
    if (!Mn.preview) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.0));
      const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(2, 3, 2); sc.add(dl);
      const dl2 = new THREE.DirectionalLight(0xffc880, 0.4); dl2.position.set(-3, 1, -2); sc.add(dl2);
      const cam = new THREE.PerspectiveCamera(30, 2, 0.01, 20);
      Mn.preview = { r, sc, cam, obj: null, t: 0, raf: 0 };
      const loop = () => {
        const p = Mn.preview; if (!p) return;
        p.raf = requestAnimationFrame(loop);
        p.t += 0.016;
        if (p.obj) { p.obj.rotation.y = Math.sin(p.t * 0.5) * 0.9 + Math.PI / 2 * 0; const gu = p.obj.children[0]; if (gu && gu.userData.anim) { const ph = (p.t % 7) / 3; gu.userData.anim({ inspect: ph < 1 ? ph : -1, draw: ph > 1.55 && ph < 1.9 ? (1.9 - ph) / 0.35 : 0 }); } }
        p.r.render(p.sc, p.cam);
      };
      loop();
    }
    const p = Mn.preview;
    stage.innerHTML = ''; stage.appendChild(p.r.domElement);
    const w = stage.clientWidth || 600, h = stage.clientHeight || 300;
    p.r.setSize(w, h); p.cam.aspect = w / h; p.cam.updateProjectionMatrix();
    if (p.obj) p.sc.remove(p.obj);
    if (G.Skins) G.Skins.local = true;
    const g = G.Models.gun(def);
    if (G.Skins) G.Skins.local = false;
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), cen = box.getCenter(new THREE.Vector3());
    g.position.sub(cen);
    const holder = new THREE.Group(); holder.add(g);
    const L = Math.max(size.x, size.y, size.z) || 0.2;
    holder.scale.setScalar(1 / L);
    p.obj = holder; p.sc.add(holder);
    p.cam.position.set(1.15, 0.25, 0); p.cam.lookAt(0, 0, 0);
  }
  function stopPreview() { const p = Mn.preview; if (!p) return; cancelAnimationFrame(p.raf); p.r.dispose(); Mn.preview = null; }

  // ---------------- CARREIRA ----------------
  function renderCareer(body) {
    const st = profile.stats, lvl = levelOf(profile.xp);
    const kd = st.d ? (st.k / st.d).toFixed(2) : st.k.toFixed(2);
    const tile = (l, v) => `<div class="tile"><b>${v}</b><span>${l}</span></div>`;
    body.innerHTML = `
      <section class="mm-col mm-cr-head">
        <div class="cr-card"><div class="av big">${initials(profile.name)}</div>
          <div class="cr-who"><input id="crName" maxlength="18" value="${esc(profile.name)}"><div class="cr-rank">${emblem(lvl, 44)}<div><b>${rankOf(lvl)}</b><small>Nível ${lvl}</small></div></div>
          <div class="cr-xp"><i><b style="width:${(profile.xp % 1000) / 10}%"></b></i><small>${profile.xp % 1000} / 1000 XP para o nível ${lvl + 1}</small></div></div></div>
        <div class="cr-tiles">${tile('Partidas', st.matches)}${tile('Vitórias', st.wins)}${tile('% de vitórias', st.matches ? Math.round(st.wins / st.matches * 100) + '%' : '—')}${tile('Abates', st.k)}
          ${tile('Mortes', st.d)}${tile('K/D', kd)}${tile('Cabeça', st.k ? Math.round(st.hs / st.k * 100) + '%' : '—')}${tile('MVPs', st.mvp)}${tile('Dano por rodada', st.rounds ? Math.round(st.dmg / st.rounds) : '—')}${tile('Assistências', st.a)}</div>
      </section>
      <section class="mm-col mm-cr-maps"><h3>Por mapa</h3>
        <table><tr><th>Mapa</th><th>V</th><th>D</th><th>E</th></tr>${M.list.map(d => { const r = profile.maps[d.id] || { w: 0, l: 0, d: 0 }; return `<tr><td>${esc(d.name)}</td><td>${r.w}</td><td>${r.l}</td><td>${r.d}</td></tr>`; }).join('')}</table>
        <h3>Últimas partidas</h3>
        <div class="cr-hist">${profile.history.length ? profile.history.map(h => `<div class="h ${h.result}"><b>${{ win: 'Vitória', loss: 'Derrota', draw: 'Empate' }[h.result]}</b><span>${esc(h.mapName)}</span><span>${h.score[0]} × ${h.score[1]}</span><span>${h.k}/${h.a}/${h.d}</span><small>${new Date(h.date).toLocaleDateString('pt-BR')}</small></div>`).join('') : '<p class="empty">Nenhuma partida ainda. Vá jogar!</p>'}</div>
        <button id="crReset" class="mm-small">Zerar carreira</button>
      </section>`;
    const nm = $('crName');
    nm.onchange = () => { profile.name = nm.value.trim() || 'Jogador'; saveProfile(); renderTop(); };
    $('crReset').onclick = () => { if (confirm('Zerar todo o progresso da carreira?')) { profile = defProfile(); saveProfile(); render(); } };
  }

  // ---------------- CONFIGURAÇÕES ----------------
  function renderSettings(body) {
    const s = Gm().settings; if (!s.gunVol) s.gunVol = 3;
    const sl = (k, l, min, max, step, fmt) => `<div class="cfg-row"><label>${l}<b id="v_${k}">${fmt(s[k])}</b></label><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${k === 'vol' || k === 'gunVol' ? s[k] * 100 : s[k]}"></div>`;
    const crossCol = (() => { try { return localStorage.getItem('et_cross') || '#3f6'; } catch (e) { return '#3f6'; } })();
    body.innerHTML = `
      <section class="mm-col mm-cfg">
        <h3>Jogo</h3>
        ${sl('sens', 'Sensibilidade do mouse', 0.3, 5, 0.05, v => Number(v).toFixed(2))}
        ${sl('fov', 'Campo de visão', 70, 110, 1, v => v + '°')}
        <h3>Áudio</h3>
        ${sl('vol', 'Volume geral', 0, 100, 1, v => Math.round(v * 100) + '%')}
        ${sl('gunVol', 'Volume dos tiros', 50, 800, 10, v => Math.round((v || 3) * 100) + '%')}
        <h3>Controles</h3>
        <div class="cfg-row"><div class="mm-seg" id="cfgTouch">${[['auto', 'Automático'], ['on', 'Toque (celular)'], ['off', 'Teclado e mouse']].map(([v, l]) => `<button data-v="${v}" class="${(s.touch || 'auto') === v ? 'on' : ''}">${l}</button>`).join('')}</div><small class="note">No celular: analógico à esquerda, arraste à direita para mirar, segure o botão de tiro e arraste para mirar atirando.</small></div>
        <div class="cfg-row"><label>Sensibilidade do toque <b id="tsLbl">${(s.touchSens || 1).toFixed(2)}</b></label><input type="range" id="cfgTSens" min="0.3" max="3" step="0.05" value="${s.touchSens || 1}"></div>
        <h3>Anti-trapaça Guardião</h3>
        <div class="cfg-row"><div class="mm-seg" id="cfgAC">${[['ativo', 'Ativo'], ['relatorio', 'Só relatório'], ['off', 'Desligado']].map(([v, l]) => `<button data-v="${v}" class="${(s.anticheat || 'ativo') === v ? 'on' : ''}">${l}</button>`).join('')}</div><small class="note">Analisa só o que acontece na partida (mira, tiros, acertos, movimento e estado). F9 abre o relatório durante o jogo.</small></div>
        <h3>Vídeo</h3>
        <div class="cfg-row"><label>Qualidade gráfica</label><div class="mm-seg" id="cfgQual">${['Baixa', 'Média', 'Alta'].map((l, i) => `<button data-v="${i}" class="${s.qual === i ? 'on' : ''}">${l}</button>`).join('')}</div><small class="note">Sombras e serrilhado. Aplicado ao recarregar a página.</small></div>
        <h3>Controles</h3>
        <div class="cfg-keys">${[['WASD', 'Mover'], ['Shift', 'Andar em silêncio'], ['Ctrl / C', 'Agachar'], ['Espaço', 'Pular'], ['Mouse 1', 'Atirar'], ['Mouse 2', 'Mira / modo alternativo'], ['R', 'Recarregar'], ['B', 'Loja'], ['1–6 / roda', 'Trocar arma'], ['Q', 'Última arma'], ['G', 'Largar arma'], ['E', 'Usar / plantar / desarmar'], ['F', 'Inspecionar'], ['Tab', 'Placar'], ['Esc', 'Pausar'], ['Insert / F8', 'Painel Invicto']].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('')}</div>
      </section>
      <section class="mm-col mm-cfg">
        <h3>Mira</h3>
        <div class="cross-prev" id="crossPrev"><div class="ch"><i></i><i></i><i></i><i></i><i></i></div></div>
        <div class="cfg-row"><label>Cor</label><div class="swatches">${['#3f6', '#0ff', '#ff3', '#f3f', '#fff', '#f44'].map(c => `<button data-c="${c}" style="background:${c}" class="${crossCol === c ? 'on' : ''}"></button>`).join('')}</div></div>
        ${sl('crossLen', 'Tamanho', 2, 16, 1, v => v)}
        ${sl('crossThick', 'Espessura', 1, 5, 1, v => v)}
        ${sl('crossGap', 'Espaçamento', -2, 12, 1, v => v)}
        <label class="cfg-chk"><input type="checkbox" id="cfgDot" ${s.crossDot ? 'checked' : ''}> Ponto central</label>
        <label class="cfg-chk"><input type="checkbox" id="cfgDyn" ${s.crossDyn ? 'checked' : ''}> Mira dinâmica (abre ao mover/atirar)</label>
      </section>`;
    body.querySelectorAll('input[type=range]').forEach(el => el.oninput = () => {
      const k = el.dataset.k; s[k] = (k === 'vol' || k === 'gunVol') ? el.value / 100 : Number(el.value);
      const fmt = { sens: v => Number(v).toFixed(2), fov: v => v + '°', vol: v => Math.round(v * 100) + '%', gunVol: v => Math.round(v * 100) + '%' }[k] || (v => v);
      $('v_' + k).textContent = fmt(s[k]);
      if (k === 'vol') G.Audio.setVolume(s.vol);
      if (k === 'gunVol') { G.Audio.gunVol = s.gunVol; }
      Gm().saveSettings(); crossPreview();
    });
    body.querySelectorAll('#cfgTouch button').forEach(b => b.onclick = () => { s.touch = b.dataset.v; Gm().saveSettings(); if (G.Touch) G.Touch.decide(); render(); });
    const ts = body.querySelector('#cfgTSens'); if (ts) ts.oninput = () => { s.touchSens = +ts.value; body.querySelector('#tsLbl').textContent = s.touchSens.toFixed(2); Gm().saveSettings(); };
    body.querySelectorAll('#cfgAC button').forEach(b => b.onclick = () => { s.anticheat = b.dataset.v; Gm().saveSettings(); render(); });
    body.querySelectorAll('#cfgQual button').forEach(b => b.onclick = () => { s.qual = Number(b.dataset.v); Gm().saveSettings(); render(); if (confirm('Recarregar agora para aplicar a qualidade?')) location.reload(); });
    body.querySelectorAll('.swatches button').forEach(b => b.onclick = () => { G.HUD.setCrossColor(b.dataset.c); render(); });
    $('cfgDot').onchange = e => { s.crossDot = e.target.checked; Gm().saveSettings(); crossPreview(); };
    $('cfgDyn').onchange = e => { s.crossDyn = e.target.checked; Gm().saveSettings(); };
    crossPreview();
  }
  function crossPreview() {
    const el = $('crossPrev'); if (!el) return;
    const s = Gm().settings, i = el.querySelectorAll('i'), len = s.crossLen, th = s.crossThick, gap = s.crossGap + 2;
    const set = (e, x, y, w, h) => Object.assign(e.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    set(i[0], -th / 2, -gap - len, th, len); set(i[1], -th / 2, gap, th, len); set(i[2], -gap - len, -th / 2, len, th); set(i[3], gap, -th / 2, len, th); set(i[4], -th / 2, -th / 2, th, th);
    i[4].style.display = s.crossDot ? '' : 'none';
  }

  // ---------------- Fim de partida ----------------
  Mn.onMatchEnd = (r) => {
    const mult = [0.75, 1, 1.25, 1.5][r.diff] || 1;
    const parts = [['Partida concluída', 120], ['Abates', r.k * 25], ['Assistências', r.a * 10], ['MVPs', r.mvp * 60], [r.result === 'win' ? 'Vitória' : r.result === 'draw' ? 'Empate' : 'Derrota', r.result === 'win' ? 250 : r.result === 'draw' ? 100 : 0]];
    let total = Math.round(parts.reduce((s, p) => s + p[1], 0) * mult);
    const before = profile.xp, lvlBefore = levelOf(before);
    profile.xp += total;
    const st = profile.stats;
    st.matches++; st[r.result === 'win' ? 'wins' : r.result === 'loss' ? 'losses' : 'draws']++;
    st.k += r.k; st.d += r.d; st.a += r.a; st.hs += r.hs; st.mvp += r.mvp; st.dmg += r.dmg; st.rounds += r.rounds;
    const mp = profile.maps[r.map] || (profile.maps[r.map] = { w: 0, l: 0, d: 0 });
    mp[r.result === 'win' ? 'w' : r.result === 'loss' ? 'l' : 'd']++;
    profile.history.unshift(Object.assign({ date: Date.now() }, r)); profile.history = profile.history.slice(0, 10);
    saveProfile();
    const lvlAfter = levelOf(profile.xp);
    const el = $('matchEnd');
    el.className = 'mm-end ' + r.result;
    el.innerHTML = `<div class="box">
      <small>${esc(r.mapName)} · ${r.rounds} rodadas</small>
      <h1>${{ win: 'VITÓRIA', loss: 'DERROTA', draw: 'EMPATE' }[r.result]}</h1>
      <div class="score">${r.score[0]} <span>×</span> ${r.score[1]}</div>
      <div class="me-stats"><div><b>${r.k}</b><span>Abates</span></div><div><b>${r.a}</b><span>Assist.</span></div><div><b>${r.d}</b><span>Mortes</span></div><div><b>${r.k ? Math.round(r.hs / r.k * 100) : 0}%</b><span>Cabeça</span></div><div><b>${r.mvp}</b><span>MVPs</span></div><div><b>#${r.rank}</b><span>no placar</span></div></div>
      <div class="xp"><h3>Experiência ${mult !== 1 ? `<small>bônus de dificuldade ×${mult}</small>` : ''}</h3>${parts.filter(p => p[1]).map(p => `<div class="row"><span>${p[0]}</span><b>+${Math.round(p[1] * mult)} XP</b></div>`).join('')}
        <div class="row tot"><span>Total</span><b>+${total} XP</b></div>
        <div class="lvl"><span>Nível ${lvlAfter} · ${rankOf(lvlAfter)}</span><i><b id="endXp" style="width:${lvlAfter > lvlBefore ? 0 : (before % 1000) / 10}%"></b></i></div>
        ${lvlAfter > lvlBefore ? `<div class="up">${emblem(lvlAfter, 40)} SUBIU PARA O NÍVEL ${lvlAfter}!</div>` : ''}</div>
      <div class="btns"><button id="endMenu">Voltar ao menu</button><button id="endAgain" class="pri">Jogar de novo</button></div></div>`;
    setTimeout(() => { const b = $('endXp'); if (b) b.style.width = (profile.xp % 1000) / 10 + '%'; }, 200);
    $('endMenu').onclick = () => { el.className = 'hidden'; Gm().quitToMenu(); };
    $('endAgain').onclick = () => { el.className = 'hidden'; Gm().quitToMenu(); launch(); };
  };

  // ---------------- Mostrar/ocultar ----------------
  Mn.show = () => { root.classList.remove('hidden'); $('loading').className = 'screen hidden'; render(); };
  Mn.hide = () => { root.classList.add('hidden'); stopPreview(); };

  // ---------------- Inicialização ----------------
  makeThumbs();
  build();
  Gm().buildWorld();
  // troca as miniaturas de radar por fotos aéreas 3D de cada mapa
  setTimeout(() => {
    const want = Gm().settings.map;
    try {
      for (const d of M.list) { Gm().loadMap(d.id); thumbs[d.id] = Gm().snapshot(480, 300); }
    } catch (e) { console.warn('miniaturas', e); }
    Gm().loadMap(want);
    if (!root.classList.contains('hidden') && tab === 'play') render();
  }, 60);
  window.addEventListener('keydown', e => { if (e.code === 'Escape' && !root.classList.contains('hidden') && queueTimer) cancelQueue(); });
})();
