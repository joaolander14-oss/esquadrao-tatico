// Denúncia de jogadores: o Guardião passa a investigar o denunciado com atenção redobrada (F7 ou botão no menu de pausa).
(function () {
  const R = G.Report = { open: false };
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let sel = -1, msg = '', msgOk = true;
  function box() {
    let p = $('rpPanel'); if (p) return p;
    p = document.createElement('div'); p.id = 'rpPanel'; p.className = 'hidden'; document.body.appendChild(p);
    p.addEventListener('keydown', e => { e.stopPropagation(); if (e.code === 'Escape' || e.code === 'F7') R.toggle(false); });
    p.addEventListener('mousedown', e => e.stopPropagation());
    return p;
  }
  function render() {
    const p = box(), gm = G.Game; if (!R.open || !gm.agents) return;
    const me = gm.human, reasons = G.AntiCheat ? G.AntiCheat.REASONS : [['abuse', 'Outro']];
    const rows = gm.agents.map((a, i) => ({ a, i })).filter(x => x.a !== me).map(({ a, i }) => {
      const st = a.stats || {}, tag = (a.isHuman || a.remote || a.puppet && !a.isBot) ? '' : ' <small>(bot)</small>';
      return `<label class="rp-row ${sel === i ? 'on' : ''}"><input type="radio" name="rpT" value="${i}" ${sel === i ? 'checked' : ''}><span class="tm ${a.team}">${a.team === 'T' ? 'INS' : 'FT'}</span><b>${esc(a.name)}${tag}</b><em>${st.k || 0} / ${st.d || 0}</em></label>`;
    }).join('');
    p.innerHTML = `<div class="rp-box"><header><b>⚑ DENUNCIAR JOGADOR</b><button class="x" id="rpX">✕</button></header>
      <div class="rp-list">${rows}</div>
      <label>Motivo <select id="rpWhy">${reasons.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></label>
      <label>Detalhes (opcional) <input id="rpNote" maxlength="80" placeholder="Ex.: mira travada na cabeça através da parede"></label>
      <button class="pri" id="rpSend">Enviar denúncia</button>
      <p class="rp-note">O Guardião marca o jogador e aperta a análise dele (mira, paredes, velocidade, física, munição). Depois de cerca de 75 s de jogo você recebe o resultado. Máximo de 3 denúncias por partida; uma denúncia não pune ninguém sozinha, só pede uma análise.</p>
      <div class="rp-msg ${msgOk ? 'ok' : 'bad'}">${esc(msg)}</div></div>`;
    $('rpX').onclick = () => R.toggle(false);
    p.querySelectorAll('input[name=rpT]').forEach(r => r.onchange = () => { sel = +r.value; render(); });
    $('rpSend').onclick = () => {
      if (sel < 0) { msg = 'Escolha um jogador da lista.'; msgOk = false; render(); return; }
      const why = $('rpWhy').value, note = $('rpNote').value;
      if (gm.clientMode) { if (G.MP) G.MP.send({ t: 'report', i: sel, why, note }); msg = 'Denúncia enviada ao servidor da partida. O resultado chega aqui em alguns minutos.'; msgOk = true; }
      else { const r = G.AntiCheat.denounce(gm.human, gm.agents[sel], why, note); msg = r.msg; msgOk = r.ok; }
      render();
    };
  }
  R.toggle = (on) => {
    const p = box(), gm = G.Game;
    if (gm.phase === 'menu') return;
    R.open = on === undefined ? !R.open : on;
    p.classList.toggle('hidden', !R.open);
    if (R.open) { msg = ''; sel = -1; if (document.exitPointerLock) document.exitPointerLock(); render(); }
  };
  document.addEventListener('keydown', e => { if (e.code === 'F7') { e.preventDefault(); if (G.Game.phase !== 'menu') R.toggle(); } });
})();
