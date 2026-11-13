// Controles de toque (celular / tablet): analógico virtual, arrastar para mirar e botões de ação.
// Não mexe na lógica do jogo: só alimenta h.input, Gm.look e os mesmos atalhos do teclado.
(function () {
  const T = G.Touch = { active: false, fwd: 0, side: 0, walk: false };
  const Gm = () => G.Game;
  const $ = id => document.getElementById(id);
  const coarse = () => !!(window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 1 && !matchMedia('(pointer: fine)').matches;
  T.isDevice = coarse;
  T.decide = () => {
    const s = Gm().settings, mode = s.touch || 'auto';
    T.active = mode === 'on' || (mode === 'auto' && coarse());
    document.body.classList.toggle('touch', T.active);
    return T.active;
  };

  // primeira vez num aparelho de toque: qualidade leve e sensibilidade de toque padrão
  (function firstRun() {
    const s = Gm().settings;
    if (coarse() && !s.mobileInit) { s.mobileInit = true; s.qual = 0; if (s.touchSens === undefined) s.touchSens = 1; Gm().saveSettings(); }
    if (s.touchSens === undefined) s.touchSens = 1;
  })();

  const key = (code, down) => document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code.replace(/^Digit/, ''), bubbles: true }));
  const tap = code => { key(code, true); setTimeout(() => key(code, false), 60); };

  let root = null, stick = null, knob = null;
  const BTN = [
    // id, rótulo, classe/posição, ação: {hold: código} | {tap: código} | {fn}
    ['tFire', '◉', 'big fire', { fire: 1 }],
    ['tFire2', '◉', 'fireL', { fire: 1 }],
    ['tAim', '⌖', 'aim', { aim: 1 }],
    ['tJump', '⤒', 'jump', { hold: 'Space' }],
    ['tCrouch', '⤓', 'crouch', { toggle: 'ControlLeft' }],
    ['tReload', '↻', 'reload', { hold: 'KeyR' }],
    ['tUse', 'E', 'use', { hold: 'KeyE' }],
    ['tWeap', '⇄', 'weap', { fn: () => document.dispatchEvent(new WheelEvent('wheel', { deltaY: 1 })) }],
    ['tNade', '●', 'nade', { tap: 'Digit4' }],
    ['tKnife', '🗡', 'knife', { tap: 'Digit3' }],
    ['tBuy', '$', 'buy', { tap: 'KeyB' }],
    ['tScore', '☰', 'score', { hold: 'Tab' }],
    ['tPause', 'Ⅱ', 'pause', { fn: () => Gm().pause && Gm().pause(true) }],
  ];

  function build() {
    if (root) return;
    root = document.createElement('div'); root.id = 'touchUI';
    root.innerHTML = `<div id="tLook"></div><div id="tStickZone"></div><div id="tStick"><div id="tKnob"></div></div>` +
      BTN.map(([id, lbl, cls]) => `<button id="${id}" class="tb ${cls}">${lbl}</button>`).join('') +
      `<div id="tRotate"><div>↻</div><p>Gire o celular para a horizontal</p></div>`;
    document.body.appendChild(root);
    stick = $('tStick'); knob = $('tKnob');
    wireStick(); wireLook($('tLook'));
    for (const [id, , , act] of BTN) wireBtn($(id), act);
  }

  // ---- analógico (aparece onde o polegar encosta, metade esquerda) ----
  let stickId = null, sx = 0, sy = 0;
  const R = 58;
  function wireStick() {
    const z = $('tStickZone');
    z.addEventListener('touchstart', e => {
      e.preventDefault(); if (stickId !== null) return;
      const t = e.changedTouches[0]; stickId = t.identifier; sx = t.clientX; sy = t.clientY;
      stick.style.left = sx + 'px'; stick.style.top = sy + 'px'; stick.classList.add('on'); moveStick(t);
      fullscreen();
    }, { passive: false });
    const mv = e => { for (const t of e.changedTouches) if (t.identifier === stickId) { e.preventDefault(); moveStick(t); } };
    const end = e => { for (const t of e.changedTouches) if (t.identifier === stickId) { stickId = null; T.fwd = T.side = 0; knob.style.transform = ''; stick.classList.remove('on'); } };
    z.addEventListener('touchmove', mv, { passive: false }); z.addEventListener('touchend', end); z.addEventListener('touchcancel', end);
  }
  function moveStick(t) {
    let dx = t.clientX - sx, dy = t.clientY - sy; const L = Math.hypot(dx, dy);
    if (L > R) { dx *= R / L; dy *= R / L; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const m = Math.min(1, L / R), dead = 0.12;
    const k = m < dead ? 0 : (m - dead) / (1 - dead);
    T.side = L ? dx / Math.max(L, 1e-3) * k : 0;
    T.fwd = L ? -dy / Math.max(L, 1e-3) * k : 0;
    T.walk = k > 0 && k < 0.55;                       // empurrão curto = andar silencioso
  }

  // ---- arrastar para mirar ----
  const looks = new Map();
  function lookStart(t) { looks.set(t.identifier, { x: t.clientX, y: t.clientY }); }
  function lookMove(t) {
    const p = looks.get(t.identifier); if (!p) return;
    const dx = t.clientX - p.x, dy = t.clientY - p.y; p.x = t.clientX; p.y = t.clientY;
    // ~0,3° por pixel com sensibilidade 1 (independe da sensibilidade do mouse)
    const s = Gm().settings, k = 0.3 / (s.sens * 0.022) * (s.touchSens || 1);
    if (Gm().look) Gm().look(dx * k, dy * k * 0.85);
  }
  function wireLook(el) {
    el.addEventListener('touchstart', e => { e.preventDefault(); for (const t of e.changedTouches) lookStart(t); }, { passive: false });
    el.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) lookMove(t); }, { passive: false });
    const end = e => { for (const t of e.changedTouches) looks.delete(t.identifier); };
    el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
  }

  // ---- botões ----
  let fireN = 0, aimOn = false;
  function wireBtn(el, act) {
    el.addEventListener('touchstart', e => {
      e.preventDefault(); el.classList.add('down'); G.Audio.init();
      for (const t of e.changedTouches) lookStart(t);           // atirar e mirar ao mesmo tempo (arrastar no botão)
      if (act.fire) { fireN++; Gm().setMouse(true, null); }
      else if (act.aim) { Gm().setMouse(null, true); setTimeout(() => Gm().setMouse(null, false), 80); }
      else if (act.hold) key(act.hold, true);
      else if (act.tap) tap(act.tap);
      else if (act.toggle) { const on = !el.classList.contains('lock'); el.classList.toggle('lock', on); key(act.toggle, on); }
      else if (act.fn) act.fn();
    }, { passive: false });
    el.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) lookMove(t); }, { passive: false });
    const end = e => {
      for (const t of e.changedTouches) looks.delete(t.identifier);
      el.classList.remove('down');
      if (act.fire) { fireN = Math.max(0, fireN - 1); if (!fireN) Gm().setMouse(false, null); }
      else if (act.hold) key(act.hold, false);
    };
    el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
  }

  function fullscreen() {
    const d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({ navigationUI: 'hide' }).then(() => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { });
    }).catch(() => { });
  }
  T.fullscreen = fullscreen;

  // chamado pelo jogo a cada passo: mistura o toque na entrada do humano
  T.apply = (inp) => {
    if (!T.active) return;
    if (T.fwd || T.side) { inp.fwd = T.fwd; inp.side = T.side; if (T.walk) inp.walk = true; }
  };
  // mostra/oculta conforme a fase e atualiza o botão da loja
  T.show = (on) => { if (!T.active) { if (root) root.style.display = 'none'; return; } build(); root.style.display = on ? '' : 'none'; };
  T.update = () => {
    if (!root || !T.active) return;
    const g = Gm(), h = g.human; if (!h) return;
    $('tBuy').style.display = g.canBuy && g.canBuy(h) ? '' : 'none';
    $('tUse').classList.toggle('hot', !!(G.Map.doorNear(h, 2.4) || (h.inv.c4 && /^[AB]$/.test(G.Map.zoneAt(h.pos.x, h.pos.z) || '')) || (h.team === 'CT' && g.bomb.state === 'planted' && h.pos.distanceTo(g.bomb.pos) < 2.2)));
    $('tNade').style.display = h.has('grenade') ? '' : 'none';
    root.classList.toggle('dead', !h.alive);
    const w = h.weapon(); $('tAim').style.display = w && (w.def.scope || w.def.silencer === true) ? '' : 'none';
  };
  T.decide();
})();
