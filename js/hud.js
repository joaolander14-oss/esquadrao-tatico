// HUD, loja, placar e radar
(function () {
  const H = G.HUD = {};
  const U = G.U;
  const $ = id => document.getElementById(id);
  let radarImg = null, radarCtx = null;
  let lastMoney = null, moneyDeltaT = 0, msgT = 0, hintTxt = '', bannerT = 0;
  H.buyOpen = false; H.buyCat = null; H.icons = {};

  H.init = () => {
    radarImg = G.Map.radarImage(12);
    radarCtx = $('radar').getContext('2d');
    // mira
    const ch = $('crosshair'); ch.innerHTML = '';
    for (let i = 0; i < 5; i++) ch.appendChild(document.createElement('i'));
    H.setCrossColor(localStorage.getItem('et_cross') || '#3f6');
  };
  H.setCrossColor = c => { document.documentElement.style.setProperty('--cross', c); try { localStorage.setItem('et_cross', c); } catch (e) { } };
  H.show = on => { $('hud').classList.toggle('hidden', !on); };

  // --------- mensagens ---------
  H.centerMsg = (txt, dur) => { $('centerMsg').innerHTML = txt; msgT = dur || 2; };
  H.hint = txt => { hintTxt = txt; };
  H.banner = (txt, cls, sub, dur) => { const b = $('banner'); b.className = cls || ''; b.innerHTML = txt + (sub ? `<small>${sub}</small>` : ''); bannerT = dur || 4; };
  H.hitmarker = (head, kill) => {
    const h = $('hitmarker'); h.className = head ? 'hs' : ''; h.style.opacity = 1; h.style.transform = kill ? 'scale(1.4)' : 'scale(1)';
    clearTimeout(H._hm); H._hm = setTimeout(() => h.style.opacity = 0, kill ? 220 : 120);
  };
  H.damageFrom = (me, fromPos) => {
    if (!fromPos) return;
    const ang = U.angDiff(me.yaw, U.yawTo(fromPos.x - me.pos.x, fromPos.z - me.pos.z));
    const d = document.createElement('div'); d.className = 'di';
    d.style.transform = `rotate(${-ang * U.R2D}deg)`;
    $('dmgIndicators').appendChild(d);
    requestAnimationFrame(() => { d.style.opacity = 0; });
    setTimeout(() => d.remove(), 1000);
    const v = $('bloodVignette'); v.style.opacity = 0.7; clearTimeout(H._bv); H._bv = setTimeout(() => v.style.opacity = 0, 250);
  };
  H.killfeed = (killer, victim, wname, hs, involvesMe, pen) => {
    const kf = $('killfeed');
    const el = document.createElement('div'); el.className = 'kf' + (involvesMe ? ' me' : '');
    el.innerHTML = (killer ? `<span class="${killer.team}">${esc(killer.name)}</span>` : '') + `<span class="w">${esc(wname)}</span>` + (hs ? '<span class="hs">✛ cabeça</span>' : '') + `<span class="${victim.team}">${esc(victim.name)}</span>`;
    kf.appendChild(el);
    while (kf.children.length > 6) kf.firstChild.remove();
    setTimeout(() => el.remove(), 7000);
  };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // --------- atualização por frame ---------
  H.update = (dt, view, game) => {
    const me = view;
    // dinheiro
    const human = game.human;
    if (lastMoney !== null && human.money !== lastMoney) {
      const d = human.money - lastMoney;
      $('moneyDelta').innerHTML = d > 0 ? `+$${d}` : `<span class="neg">-$${-d}</span>`; moneyDeltaT = 2.5;
    }
    lastMoney = human.money;
    $('moneyVal').textContent = human.money;
    if (moneyDeltaT > 0) { moneyDeltaT -= dt; if (moneyDeltaT <= 0) $('moneyDelta').innerHTML = ''; }
    // vida/colete
    $('hpVal').textContent = Math.ceil(me.hp);
    $('hpVal').className = me.hp <= 25 ? 'low' : '';
    $('armorVal').textContent = me.armor + (me.helmet && me.armor > 0 ? ' ⛑' : '');
    // munição
    const w = me.weapon(); const def = w ? w.def : G.W.knife;
    $('wname').textContent = def.name + (w && w.burst ? ' · rajada' : '') + (w && w.silencer && def.silencer === true ? ' · supressor' : '');
    if (def.mag && def.cat !== 'equip') { $('clip').textContent = w.ammo; $('reserve').textContent = def.shellReload ? w.reserve : (w.spare.length + (w.spare.length === 1 ? ' pente' : ' pentes')); $('clip').className = w.ammo <= Math.ceil(def.mag * 0.2) ? 'low' : ''; }
    else if (def.cat === 'grenade') { $('clip').textContent = me.inv.grenades.length; $('reserve').textContent = '—'; }
    else if (def.id === 'taser') { $('clip').textContent = 1; $('reserve').textContent = '0'; }
    else { $('clip').textContent = '—'; $('reserve').textContent = ''; }
    // slots
    const slots = [['primary', '1'], ['secondary', '2'], ['knife', '3'], ['grenade', '4'], ['c4', '5'], ['taser', '6']];
    let sh = '';
    for (const [s, k] of slots) {
      if (!me.has(s)) continue;
      let nm = s === 'grenade' ? me.inv.grenades.map(g => G.W[g].name).join(', ') : s === 'c4' ? 'Explosivo C4' : me.inv[s].def.name;
      sh += `<div class="s ${me.cur === s ? 'on' : ''}"><b>${k}</b>${esc(nm)}</div>`;
    }
    if (H._slotsHtml !== sh) { $('slots').innerHTML = sh; H._slotsHtml = sh; }
    $('bombIcon').classList.toggle('hidden', !me.inv.c4);
    // topo
    const sideScore = game.sideScore();
    $('scoreT').textContent = sideScore.T; $('scoreCT').textContent = sideScore.CT;
    const tm = $('timer');
    if (game.bomb.state === 'planted') { tm.textContent = '💣'; tm.className = 'timer bomb'; tm.style.opacity = (Math.sin(game.time * 8) > 0 ? 1 : 0.4); }
    else { tm.style.opacity = 1; tm.className = 'timer'; tm.textContent = game.phase === 'freeze' ? U.fmtTime(game.phaseT) : game.phase === 'live' ? (game.settings.mode === 'util' ? '∞' : U.fmtTime(game.roundTimeLeft())) : '0:00'; }
    const alive = t => game.agents.filter(a => a.team === t).map(a => `<i class="${a.alive ? '' : 'dead'}"></i>`).join('');
    const ah = alive('T') + '|' + alive('CT');
    if (H._alive !== ah) { $('aliveT').innerHTML = alive('T'); $('aliveCT').innerHTML = alive('CT'); H._alive = ah; }
    $('roundInfo').textContent = `Rodada ${game.round} de ${game.maxRounds}` + (game.phase === 'freeze' ? ' · Tempo de compra' : (game.canBuy(human) ? ' · Loja aberta (B)' : ''));
    // mira
    const noScope = !!(G.Cheats && G.Cheats.cfg.vis.noScope);
    const scoped = me.zoom > 0 && def.scope && !noScope;
    $('scope').classList.toggle('hidden', !scoped || !me.alive);
    const showCross = !scoped && (def.cat !== 'sniper' || noScope) && me.alive;
    const ch = $('crosshair'); ch.style.display = showCross ? '' : 'none';
    if (showCross) {
      const inacc = def.inacc ? G.Combat.inaccuracy(me, def) : 0.5;
      const cs = G.Game.settings;
      const gap = Math.round(cs.crossGap + (cs.crossDyn ? inacc * 5 + (me.shotsFired > 0 ? Math.min(6, me.shotsFired) : 0) : 0)), len = cs.crossLen, th = cs.crossThick;
      const i = ch.children;
      set(i[0], -th / 2, -gap - len, th, len); set(i[1], -th / 2, gap, th, len);
      set(i[2], -gap - len, -th / 2, len, th); set(i[3], gap, -th / 2, len, th);
      set(i[4], -th / 2, -th / 2, th, th); i[4].style.display = cs.crossDot ? '' : 'none';
    }
    // flash
    $('flash').style.opacity = me.flashT > 0 ? U.clamp(me.flashT / Math.max(0.5, Math.min(me.flashMax, 2.5)) * 1.0, 0, 1) : 0;
    // mensagens
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('centerMsg').innerHTML = ''; }
    if (bannerT > 0) { bannerT -= dt; $('banner').classList.toggle('hidden', bannerT <= 0); }
    $('hint').textContent = hintTxt; $('hint').classList.toggle('on', !!hintTxt);
    hintTxt = '';
    // progresso (plantar/desarmar)
    const pg = $('progress');
    if (me.planting > 0) { pg.classList.remove('hidden'); $('progressLbl').textContent = 'Plantando a bomba…'; $('progressFill').style.width = (me.planting / 3.2 * 100) + '%'; }
    else if (me.defusing > 0) { pg.classList.remove('hidden'); const need = me.kit ? 5 : 10; $('progressLbl').textContent = 'Desarmando' + (me.kit ? ' (kit)' : '') + '…'; $('progressFill').style.width = (me.defusing / need * 100) + '%'; }
    else pg.classList.add('hidden');
    // espectador
    const sp = $('spectate');
    if (!human.alive && game.phase !== 'over') { sp.classList.remove('hidden'); sp.innerHTML = view !== human ? `Assistindo: <b class="${view.team}">${esc(view.name)}</b> · ${Math.ceil(view.hp)} HP<small>Clique para trocar de jogador</small>` : 'Você morreu'; }
    else sp.classList.add('hidden');
    drawRadar(me, game);
    if (!$('scoreboard').classList.contains('hidden')) H.renderScoreboard(game);
  };
  function set(el, x, y, w, h) { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px'; el.style.height = h + 'px'; }

  // --------- radar ---------
  function drawRadar(me, game) {
    const g = radarCtx, W = 440, S = G.Map.S, px = 12 / S; // px por metro na imagem
    const scale = 2.2;                                          // zoom do radar
    g.clearRect(0, 0, W, W);
    g.save();
    g.beginPath(); g.rect(0, 0, W, W); g.clip();
    g.translate(W / 2, W / 2);
    g.rotate(me.yaw);
    g.scale(scale, scale);
    g.translate(-me.pos.x * px, -me.pos.z * px);
    g.globalAlpha = 0.9;
    g.drawImage(radarImg, 0, 0);
    g.globalAlpha = 1;
    // bomba
    const bomb = game.bomb;
    if (bomb.state === 'planted' || (bomb.state === 'dropped' && me.team === 'T')) {
      const bp = bomb.state === 'planted' ? bomb.pos : (G.Combat.drops.find(d => d.inst.def.id === 'c4') || {}).pos;
      if (bp) { g.fillStyle = bomb.state === 'planted' && Math.sin(game.time * 8) > 0 ? '#ff3020' : '#ffb020'; g.fillRect(bp.x * px - 5, bp.z * px - 4, 10, 8); }
    }
    for (const a of game.agents) {
      const ally = a.team === me.team;
      if (!ally && !(a.alive && game.time - (a.spottedT || -9) < 0.4)) continue;
      const x = a.pos.x * px, z = a.pos.z * px;
      if (!a.alive) { if (ally) { g.strokeStyle = '#ccc'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, z - 4); g.lineTo(x + 4, z + 4); g.moveTo(x + 4, z - 4); g.lineTo(x - 4, z + 4); g.stroke(); } continue; }
      g.fillStyle = ally ? (a === me ? '#fff' : (a.team === 'T' ? '#e8b04a' : '#6aa8ff')) : '#ff3a2a';
      g.beginPath(); g.arc(x, z, a === me ? 6 : 5, 0, 7); g.fill();
      if (ally) { // direção
        g.strokeStyle = g.fillStyle; g.lineWidth = 2; g.beginPath(); g.moveTo(x, z); g.lineTo(x - Math.sin(a.yaw) * 11, z - Math.cos(a.yaw) * 11); g.stroke();
      }
      if (a.inv.c4 && ally) { g.fillStyle = '#ff3020'; g.fillRect(x - 3, z - 12, 6, 5); }
    }
    g.restore();
    // jogador no centro (seta)
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(W / 2, W / 2 - 12); g.lineTo(W / 2 - 7, W / 2 + 7); g.lineTo(W / 2 + 7, W / 2 + 7); g.closePath(); g.fill();
  }

  // --------- placar ---------
  H.renderScoreboard = (game) => {
    const sb = $('scoreboard');
    const sc = game.sideScore();
    let html = '';
    for (const t of ['CT', 'T']) {
      const list = game.agents.filter(a => a.team === t).sort((a, b) => b.stats.k - a.stats.k || b.stats.dmg - a.stats.dmg);
      html += `<div class="${t}"><h3><span>${t === 'T' ? 'Insurgentes' : 'Força Tática'}</span><span>${sc[t]}</span></h3><table><tr><th>Jogador</th><th>$</th><th>Abates</th><th>Assist.</th><th>Mortes</th><th>Cabeça</th><th>ADR</th><th>MVP</th></tr>`;
      for (const a of list) {
        const showMoney = a.team === game.human.team || !!(G.Cheats && G.Cheats.cfg.misc.revealMoney);
        html += `<tr class="${a.alive ? '' : 'dead'} ${a.isHuman ? 'me' : ''}"><td>${esc(a.name)}${a.inv.c4 && a.team === game.human.team ? ' 💣' : ''}</td><td>${showMoney ? '$' + a.money : ''}</td><td>${a.stats.k}</td><td>${a.stats.a}</td><td>${a.stats.d}</td><td>${a.stats.k ? Math.round(a.stats.hs / a.stats.k * 100) : 0}%</td><td>${Math.round(a.stats.dmg / Math.max(1, game.round - (game.phase === 'live' || game.phase === 'freeze' ? 1 : 0)))}</td><td>${a.stats.mvp ? '★' + a.stats.mvp : ''}</td></tr>`;
      }
      html += '</table></div>';
    }
    html += '<div class="hist">' + game.history.map((h, i) => `<i class="${h.side}${i === game.maxRounds / 2 ? ' half' : ''}" title="${h.reason}">${h.icon}</i>`).join('') + '</div>';
    sb.innerHTML = html;
  };
  H.toggleScoreboard = (on, game) => { $('scoreboard').classList.toggle('hidden', !on); if (on) H.renderScoreboard(game); };

  // --------- loja ---------
  function icon(def) {
    if (H.icons[def.id]) return H.icons[def.id];
    if (!def.shape || def.cat === 'equip' && def.id !== 'taser') return null;
    if (!H.iconR) {
      H.iconR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      H.iconR.setSize(240, 90);
      H.iconScene = new THREE.Scene();
      H.iconScene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.0));
      const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(1, 2, 3); H.iconScene.add(dl);
      H.iconCam = new THREE.OrthographicCamera(-0.75, 0.75, 0.28, -0.28, 0.1, 10);
      H.iconCam.position.set(3, 0, 0); H.iconCam.lookAt(0, 0, 0);
    }
    const g = G.Models.gun(def);
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    g.position.sub(c);
    const s = Math.min(1.4 / Math.max(size.z, 0.01), 0.5 / Math.max(size.y, 0.01), 6);
    const holder = new THREE.Group(); holder.add(g); holder.scale.setScalar(s); holder.rotation.y = Math.PI;
    H.iconScene.add(holder);
    H.iconR.render(H.iconScene, H.iconCam);
    H.iconScene.remove(holder);
    return (H.icons[def.id] = H.iconR.domElement.toDataURL());
  }
  H.openBuy = (game) => {
    H.buyOpen = true;
    $('buymenu').classList.remove('hidden');
    if (!H.buyCat) H.buyCat = 'rifle';
    H.renderBuy(game);
  };
  H.closeBuy = () => { H.buyOpen = false; $('buymenu').classList.add('hidden'); };
  H.renderBuy = (game) => {
    const me = game.human;
    const cats = G.W.categories;
    const items = G.W.forCat(H.buyCat, me.team);
    const left = game.phase === 'freeze' ? game.phaseT + game.buyTime : Math.max(0, game.buyTime - (game.roundTime));
    let h = `<div class="wrap"><header><div><h2>LOJA</h2><div class="tm">Tempo para comprar: ${Math.ceil(left)} s · Time: ${me.team === 'T' ? 'Insurgentes' : 'Força Tática'}</div></div><div class="m">$${me.money}</div></header><div class="body"><div class="cats">`;
    cats.forEach((c, i) => { h += `<div class="cat ${c.id === H.buyCat ? 'on' : ''}" data-cat="${c.id}"><b>${i + 1}</b>${c.name}</div>`; });
    h += '</div><div class="items">';
    items.forEach((d, i) => {
      const err = me.canBuy(d);
      const own = (d.slot === 'primary' && me.inv.primary && me.inv.primary.def.id === d.id) || (d.slot === 'secondary' && me.inv.secondary && me.inv.secondary.def.id === d.id) || (d.id === 'kevlar' && me.armor >= 100) || (d.id === 'kevhelm' && me.helmet && me.armor >= 100) || (d.id === 'kit' && me.kit);
      const ic = icon(d);
      h += `<div class="item ${err && !own ? 'no' : ''} ${own ? 'own' : ''}" data-id="${d.id}"><span class="k">${i + 1}</span><div class="n">${esc(d.name)}</div><div class="p">$${me.priceOf(d)}</div>` +
        (ic ? `<img src="${ic}" style="width:100%;height:56px;object-fit:contain">` : `<div style="height:56px;display:flex;align-items:center;justify-content:center;font-size:34px;opacity:.7">${d.id === 'kit' ? '🧰' : '🦺'}</div>`) +
        (d.dmg && d.cat !== 'grenade' ? `<div class="st"><span>Dano ${d.dmg}${d.pellets > 1 ? '×' + d.pellets : ''}</span><span>${d.mag}/${d.reserve}</span><span>${d.team !== 'both' ? (d.team === 'T' ? 'Insurgentes' : 'Força Tática') : ''}</span></div>` : '') + '</div>';
    });
    h += '</div><div class="detail" id="buyDetail"><p>Passe o mouse sobre um item para ver os detalhes.</p></div></div><footer>Clique para comprar · 1-6 categorias · Esc/B fecha · Armas antigas são largadas no chão (colegas podem pegar)</footer></div>';
    const bm = $('buymenu');
    bm.innerHTML = h;
    bm.querySelectorAll('.cat').forEach(el => el.onclick = () => { H.buyCat = el.dataset.cat; H.renderBuy(game); });
    bm.querySelectorAll('.item').forEach(el => {
      el.onclick = () => H.tryBuy(game, G.W[el.dataset.id]);
      el.onmouseenter = () => detail(G.W[el.dataset.id]);
    });
    bm.onclick = e => { if (e.target === bm) G.Game.closeBuyMenu(); };
  };
  H.tryBuy = (game, def) => {
    const me = game.human;
    if (!game.canBuy(me)) { G.Audio.ui('deny'); H.centerMsg('Fora da zona/tempo de compra', 1.5); return; }
    if (game.clientMode && G.MP) { G.MP.buy(def); return; }   // online: o anfitrião confere e cobra
    const err = me.buy(def);
    if (err) { G.Audio.ui('deny'); H.centerMsg(err, 1.4); }
    else G.Audio.ui('buy');
    H.renderBuy(game);
  };
  H.buyKey = (game, n) => {
    const cats = G.W.categories;
    if (n >= 1 && n <= cats.length && !H._catPicked) { H.buyCat = cats[n - 1].id; H._catPicked = true; H.renderBuy(game); return; }
    const items = G.W.forCat(H.buyCat, game.human.team);
    if (n >= 1 && n <= items.length) { H.tryBuy(game, items[n - 1]); H._catPicked = false; }
  };
  function detail(d) {
    const el = $('buyDetail'); if (!el) return;
    let bars = '';
    if (d.dmg && d.cat !== 'grenade' && d.cat !== 'equip') {
      const b = (lbl, v) => `<div><span>${lbl}</span><i><b style="width:${U.clamp(v, 0.03, 1) * 100}%"></b></i></div>`;
      bars = '<div class="bars">' +
        b('Dano', d.dmg * d.pellets / 120) + b('Cadência', d.rpm / 900) +
        b('Controle de recuo', 1 - d.recoil.up / 3) + b('Mobilidade', (d.speed - 180) / 70) + b('Perfuração de colete', d.ap) + '</div>' +
        `<p>Pente: ${d.mag} / ${d.reserve} · Recompensa por abate: $${d.reward}</p>`;
    }
    el.innerHTML = `<h3>${esc(d.name)}</h3><div style="color:var(--good);font-weight:700">$${d.price}</div>${bars}<p>${esc(d.desc || '')}</p>`;
  }
})();
