// Catálogo de armas (nomes e valores originais deste jogo)
// inacc em graus: stand / crouch / move (velocidade máxima) / jump / shot (por tiro) / max (teto do acúmulo) / rec (recuperação por s)
(function () {
  const W = G.W = {};
  const defs = [];
  function add(d) {
    d.inacc = Object.assign({ stand: 0.6, crouch: 0.45, move: 5, jump: 9, shot: 0.6, max: 3.5, rec: 6 }, d.inacc || {});
    d.recoil = Object.assign({ up: 0.8, side: 0.5, seed: defs.length + 1, rec: 9 }, d.recoil || {});
    d.hs = d.hs || 4;
    d.falloff = d.falloff || 0.9;
    d.pellets = d.pellets || 1;
    d.pen = d.pen === undefined ? 1 : d.pen;
    d.team = d.team || 'both';
    d.range = d.range || 200;
    d.reward = d.reward === undefined ? 300 : d.reward;
    d.draw = d.draw || 1.0;
    d.pattern = makePattern(d);
    defs.push(d);
    W[d.id] = d;
  }
  // padrão de recuo determinístico: subida inicial e depois oscilação lateral
  function makePattern(d) {
    const out = [[0, 0]];
    const r = G.U.mulberry(d.recoil.seed * 977 + 13);
    let x = 0, y = 0, dir = r() < 0.5 ? -1 : 1, flip = 6 + Math.floor(r() * 4);
    const n = Math.max(d.mag || 30, 10);
    for (let k = 1; k <= n; k++) {
      const vy = d.recoil.up * Math.max(0.12, 1 - k / 11);
      let vx = 0;
      if (k > 3) {
        vx = d.recoil.side * dir * Math.min(1, (k - 3) / 3) * (0.6 + r() * 0.6);
        if (k % flip === 0) { dir = -dir; flip = 5 + Math.floor(r() * 5); }
      } else vx = (r() - 0.5) * d.recoil.side * 0.3;
      x += vx; y += vy;
      out.push([x, y]);
    }
    return out;
  }

  // ---------- Facas / especiais ----------
  add({ id: 'knife', name: 'Faca de Combate', cat: 'knife', slot: 'knife', price: 0, dmg: 40, speed: 250, reward: 1500, shape: 'knife', color: 0x777777, pen: 0, rpm: 120, desc: 'Ataque rápido (M1) e golpe pesado (M2). Pelas costas é letal.' });
  add({ id: 'c4', name: 'Explosivo C4', cat: 'c4', slot: 'c4', price: 0, speed: 250, shape: 'c4', color: 0x445533, pen: 0, rpm: 60 });

  // ---------- Pistolas ----------
  add({ id: 'vespa', name: 'Vespa-9', cat: 'pistol', slot: 'secondary', team: 'T', price: 200, dmg: 29, ap: 0.47, rpm: 400, auto: false, mag: 20, reserve: 120, reload: 2.2, speed: 240, falloff: 0.85, burst: true, shape: 'pistol', color: 0x2b2b2b,
    inacc: { stand: 0.75, crouch: 0.6, move: 2.4, jump: 6, shot: 0.9, max: 4, rec: 7 }, recoil: { up: 1.4, side: 0.3 }, pen: 0.5, desc: 'Pistola padrão dos Insurgentes. M2 alterna rajada de 3.' });
  add({ id: 'guardiao', name: 'Guardião .45', cat: 'pistol', slot: 'secondary', team: 'CT', price: 200, dmg: 35, ap: 0.5, rpm: 352, auto: false, mag: 12, reserve: 24, reload: 2.2, speed: 240, falloff: 0.91, silencer: true, shape: 'pistol', color: 0x1e1f22,
    inacc: { stand: 0.55, crouch: 0.45, move: 2.2, jump: 6, shot: 1.1, max: 4, rec: 7 }, recoil: { up: 1.6, side: 0.3 }, pen: 0.5, desc: 'Pistola padrão da Força Tática, com supressor removível (M2).' });
  add({ id: 'cinza', name: 'Cinza P3', cat: 'pistol', slot: 'secondary', price: 300, dmg: 38, ap: 0.64, rpm: 400, auto: false, mag: 13, reserve: 26, reload: 2.2, speed: 240, falloff: 0.85, shape: 'pistol', color: 0x6b6b66,
    inacc: { stand: 0.7, crouch: 0.55, move: 2.4, jump: 6, shot: 1.6, max: 5, rec: 6 }, recoil: { up: 2, side: 0.4 }, desc: 'Boa penetração em colete por preço baixo.' });
  add({ id: 'gemeas', name: 'Gêmeas M9', cat: 'pistol', slot: 'secondary', price: 300, dmg: 38, ap: 0.58, rpm: 500, auto: false, mag: 30, reserve: 120, reload: 3.8, speed: 240, falloff: 0.79, shape: 'dual', color: 0x8c8c8c,
    inacc: { stand: 1.1, crouch: 0.9, move: 2.6, jump: 6, shot: 1.4, max: 5, rec: 5 }, recoil: { up: 1.6, side: 0.6 }, desc: 'Duas pistolas, 30 tiros e recarga lenta.' });
  add({ id: 'zumbido', name: 'Zumbido T9', cat: 'pistol', slot: 'secondary', team: 'T', price: 500, dmg: 33, ap: 0.81, rpm: 500, auto: false, mag: 18, reserve: 90, reload: 2.5, speed: 240, falloff: 0.83, shape: 'mpistol', color: 0x3a3a35,
    inacc: { stand: 0.9, crouch: 0.8, move: 1.6, jump: 5, shot: 1.6, max: 6, rec: 5 }, recoil: { up: 1.5, side: 0.6 }, desc: 'Precisa em movimento, ótima penetração.' });
  add({ id: 'raio', name: 'Raio 5.7', cat: 'pistol', slot: 'secondary', team: 'CT', price: 500, dmg: 32, ap: 0.91, rpm: 400, auto: false, mag: 20, reserve: 100, reload: 2.2, speed: 240, falloff: 0.81, shape: 'pistol', color: 0x30343a,
    inacc: { stand: 0.65, crouch: 0.5, move: 2.2, jump: 6, shot: 1.3, max: 5, rec: 6 }, recoil: { up: 1.7, side: 0.4 }, desc: 'Munição perfurante e pente de 20.' });
  add({ id: 'tufao', name: 'Tufão CZ', cat: 'pistol', slot: 'secondary', price: 500, dmg: 31, ap: 0.78, rpm: 600, auto: true, mag: 12, reserve: 12, reload: 2.7, speed: 240, falloff: 0.85, shape: 'mpistol', color: 0x6a5a3a,
    inacc: { stand: 1.1, crouch: 0.9, move: 2.6, jump: 6, shot: 1.2, max: 6, rec: 5 }, recoil: { up: 1.3, side: 0.7 }, desc: 'Pistola automática para curta distância.' });
  add({ id: 'trovao', name: 'Trovão .50', cat: 'pistol', slot: 'secondary', price: 700, dmg: 53, ap: 0.93, rpm: 267, auto: false, mag: 7, reserve: 35, reload: 2.2, speed: 230, falloff: 0.81, reward: 300, shape: 'heavyPistol', color: 0x9a9aa0,
    inacc: { stand: 0.55, crouch: 0.4, move: 4.5, jump: 9, shot: 3.5, max: 9, rec: 4 }, recoil: { up: 4, side: 1 }, pen: 1.5, desc: 'Um tiro na cabeça mata mesmo com capacete.' });
  add({ id: 'juiz', name: 'Juiz R8', cat: 'pistol', slot: 'secondary', price: 600, dmg: 86, ap: 0.93, rpm: 100, auto: false, mag: 8, reserve: 8, reload: 2.3, speed: 220, falloff: 0.86, reward: 300, shape: 'revolver', color: 0x55524c,
    inacc: { stand: 0.4, crouch: 0.3, move: 4.5, jump: 9, shot: 3, max: 8, rec: 3.5 }, recoil: { up: 5, side: 1 }, pen: 1.5, desc: 'Revólver pesado e lento. Muito dano.' });

  // ---------- SMGs ----------
  const smgIn = { stand: 1.0, crouch: 0.8, move: 2.8, jump: 8, shot: 0.35, max: 3.5, rec: 8 };
  add({ id: 'lince', name: 'Lince MP9', cat: 'smg', slot: 'primary', team: 'CT', price: 1250, dmg: 26, ap: 0.6, rpm: 857, auto: true, mag: 30, reserve: 120, reload: 2.1, speed: 240, falloff: 0.87, reward: 600, shape: 'smg', color: 0x262626, inacc: smgIn, recoil: { up: 0.55, side: 0.35 }, desc: 'Cadência altíssima, leve.' });
  add({ id: 'vulcao', name: 'Vulcão M10', cat: 'smg', slot: 'primary', team: 'T', price: 1050, dmg: 29, ap: 0.57, rpm: 800, auto: true, mag: 30, reserve: 100, reload: 2.6, speed: 240, falloff: 0.85, reward: 600, shape: 'smg', color: 0x3a3a3a, inacc: smgIn, recoil: { up: 0.6, side: 0.45 }, desc: 'Barata e agressiva.' });
  add({ id: 'sussurro', name: 'Sussurro SD', cat: 'smg', slot: 'primary', price: 1500, dmg: 30, ap: 0.69, rpm: 750, auto: true, mag: 30, reserve: 120, reload: 2.6, speed: 235, falloff: 0.87, reward: 600, silencer: 'fixed', shape: 'smgSD', color: 0x1b1d20, inacc: Object.assign({}, smgIn, { stand: 0.85 }), recoil: { up: 0.5, side: 0.3 }, desc: 'Silenciada de fábrica, quase não aparece no radar.' });
  add({ id: 'vespao', name: 'Vespão UMP', cat: 'smg', slot: 'primary', price: 1200, dmg: 35, ap: 0.65, rpm: 666, auto: true, mag: 25, reserve: 100, reload: 3.5, speed: 230, falloff: 0.85, reward: 600, shape: 'smg', color: 0x2f3328, inacc: smgIn, recoil: { up: 0.7, side: 0.45 }, desc: 'Dano alto por tiro para uma SMG.' });
  add({ id: 'agulha', name: 'Agulha MP7', cat: 'smg', slot: 'primary', price: 1500, dmg: 29, ap: 0.62, rpm: 750, auto: true, mag: 30, reserve: 120, reload: 3.1, speed: 235, falloff: 0.85, reward: 600, shape: 'smg', color: 0x232a2a, inacc: smgIn, recoil: { up: 0.5, side: 0.35 }, desc: 'Equilibrada e controlável.' });
  add({ id: 'turbina', name: 'Turbina P90', cat: 'smg', slot: 'primary', price: 2350, dmg: 26, ap: 0.69, rpm: 857, auto: true, mag: 50, reserve: 100, reload: 3.3, speed: 230, falloff: 0.86, reward: 300, shape: 'bullpupSmg', color: 0x2c2c2c, inacc: smgIn, recoil: { up: 0.45, side: 0.4 }, desc: '50 tiros por pente. Recompensa menor por abate.' });
  add({ id: 'espiral', name: 'Espiral 64', cat: 'smg', slot: 'primary', price: 1400, dmg: 27, ap: 0.57, rpm: 750, auto: true, mag: 64, reserve: 120, reload: 2.4, speed: 240, falloff: 0.8, reward: 600, shape: 'smg', color: 0x4a4030, inacc: smgIn, recoil: { up: 0.45, side: 0.35 }, desc: 'Carregador helicoidal de 64 tiros.' });

  // ---------- Pesadas ----------
  const sgIn = { stand: 4.2, crouch: 4.0, move: 5, jump: 9, shot: 1, max: 3, rec: 4 };
  add({ id: 'martelo', name: 'Martelo 12', cat: 'heavy', slot: 'primary', price: 1050, dmg: 26, pellets: 9, ap: 0.5, rpm: 68, auto: false, mag: 8, reserve: 32, reload: 0.5, shellReload: true, speed: 220, falloff: 0.7, range: 30, reward: 900, shape: 'shotgun', color: 0x3c2e22, inacc: sgIn, recoil: { up: 3, side: 0.5 }, pen: 0.3, desc: 'Escopeta de bomba. Devastadora de perto.' });
  add({ id: 'cano', name: 'Cano Serrado', cat: 'heavy', slot: 'primary', team: 'T', price: 1100, dmg: 32, pellets: 8, ap: 0.75, rpm: 71, auto: false, mag: 7, reserve: 32, reload: 0.5, shellReload: true, speed: 210, falloff: 0.45, range: 22, reward: 900, shape: 'shotgunShort', color: 0x4a3626, inacc: Object.assign({}, sgIn, { stand: 6, crouch: 5.8 }), recoil: { up: 3.5, side: 0.6 }, pen: 0.3, desc: 'Cano curto, espalhamento enorme.' });
  add({ id: 'bloco', name: 'Bloco M7', cat: 'heavy', slot: 'primary', team: 'CT', price: 1300, dmg: 30, pellets: 8, ap: 0.75, rpm: 71, auto: false, mag: 5, reserve: 32, reload: 2.5, speed: 225, falloff: 0.45, range: 25, reward: 900, shape: 'shotgunShort', color: 0x2a2f33, inacc: Object.assign({}, sgIn, { stand: 3.5, crouch: 3.3 }), recoil: { up: 3.5, side: 0.6 }, pen: 0.3, desc: 'Escopeta compacta com carregador.' });
  add({ id: 'pregador', name: 'Pregador XM', cat: 'heavy', slot: 'primary', price: 2000, dmg: 20, pellets: 6, ap: 0.8, rpm: 171, auto: true, mag: 7, reserve: 32, reload: 0.4, shellReload: true, speed: 215, falloff: 0.7, range: 28, reward: 900, shape: 'shotgun', color: 0x222222, inacc: sgIn, recoil: { up: 2, side: 0.5 }, pen: 0.3, desc: 'Escopeta semiautomática.' });
  add({ id: 'serra', name: 'Serra M249', cat: 'heavy', slot: 'primary', price: 5200, dmg: 32, ap: 0.8, rpm: 750, auto: true, mag: 100, reserve: 200, reload: 5.7, speed: 195, falloff: 0.97, reward: 300, shape: 'mg', color: 0x2c2c26, inacc: { stand: 1.2, crouch: 0.9, move: 6, jump: 9, shot: 0.3, max: 4, rec: 5 }, recoil: { up: 0.5, side: 0.5 }, pen: 2, desc: 'Metralhadora leve com 100 tiros.' });
  add({ id: 'rolo', name: 'Rolo N1', cat: 'heavy', slot: 'primary', price: 1700, dmg: 35, ap: 0.71, rpm: 800, auto: true, mag: 150, reserve: 300, reload: 5.7, speed: 195, falloff: 0.97, reward: 300, shape: 'mg', color: 0x3a3a30, inacc: { stand: 2.6, crouch: 2.2, move: 6, jump: 9, shot: -0.08, max: 3, rec: 3 }, recoil: { up: 0.35, side: 0.4 }, pen: 1.5, desc: 'Começa imprecisa e fica precisa ao segurar o gatilho.' });

  // ---------- Rifles ----------
  const rIn = { stand: 0.35, crouch: 0.25, move: 6.5, jump: 11, shot: 0.55, max: 3, rec: 7 };
  add({ id: 'chacal', name: 'Chacal AR', cat: 'rifle', slot: 'primary', team: 'T', price: 1800, dmg: 30, ap: 0.77, rpm: 666, auto: true, mag: 35, reserve: 90, reload: 3.0, speed: 215, falloff: 0.98, shape: 'rifle', color: 0x50463a, inacc: Object.assign({}, rIn, { stand: 0.55, crouch: 0.4 }), recoil: { up: 0.75, side: 0.45 }, pen: 2, desc: 'Rifle barato dos Insurgentes.' });
  add({ id: 'kalash', name: 'Kalash K7', cat: 'rifle', slot: 'primary', team: 'T', price: 2700, dmg: 36, ap: 0.775, rpm: 600, auto: true, mag: 30, reserve: 90, reload: 2.5, speed: 215, falloff: 0.98, shape: 'rifleAK', color: 0x6b4423, inacc: rIn, recoil: { up: 1.0, side: 0.6 }, pen: 2, desc: 'Um tiro na cabeça mata, com ou sem capacete.' });
  add({ id: 'falcao', name: 'Falcão SG', cat: 'rifle', slot: 'primary', team: 'T', price: 3000, dmg: 30, ap: 1.0, rpm: 666, auto: true, mag: 30, reserve: 90, reload: 2.8, speed: 210, falloff: 0.98, scope: [45], scopeSpeed: 150, shape: 'rifleScoped', color: 0x3d4535, inacc: rIn, recoil: { up: 0.75, side: 0.4 }, pen: 2, desc: 'Rifle com luneta (M2). Perfura colete totalmente.' });
  add({ id: 'garca', name: 'Garça F2', cat: 'rifle', slot: 'primary', team: 'CT', price: 2050, dmg: 30, ap: 0.7, rpm: 666, auto: true, mag: 25, reserve: 90, reload: 3.3, speed: 220, falloff: 0.96, burst: true, shape: 'bullpup', color: 0x2f3a45, inacc: Object.assign({}, rIn, { stand: 0.5, crouch: 0.35 }), recoil: { up: 0.75, side: 0.45 }, pen: 2, desc: 'Rifle barato da Força Tática. M2: rajada de 3.' });
  add({ id: 'carabina', name: 'Carabina M4', cat: 'rifle', slot: 'primary', team: 'CT', price: 3100, dmg: 33, ap: 0.7, rpm: 666, auto: true, mag: 30, reserve: 90, reload: 3.1, speed: 225, falloff: 0.97, shape: 'rifleM4', color: 0x2b2b2b, inacc: rIn, recoil: { up: 0.85, side: 0.5 }, pen: 2, desc: 'Rifle padrão da Força Tática, muito controlável.' });
  add({ id: 'carabinasd', name: 'Carabina SD', cat: 'rifle', slot: 'primary', team: 'CT', price: 2900, dmg: 38, ap: 0.7, rpm: 600, auto: true, mag: 20, reserve: 80, reload: 3.1, speed: 225, falloff: 0.99, silencer: true, shape: 'rifleM4', color: 0x3a3e42, inacc: Object.assign({}, rIn, { stand: 0.3 }), recoil: { up: 0.7, side: 0.35 }, pen: 2, desc: 'Versão silenciada: mais dano por tiro, pente menor.' });
  add({ id: 'aguia', name: 'Águia AG', cat: 'rifle', slot: 'primary', team: 'CT', price: 3300, dmg: 28, ap: 0.9, rpm: 666, auto: true, mag: 30, reserve: 90, reload: 3.8, speed: 220, falloff: 0.98, scope: [45], scopeSpeed: 150, shape: 'bullpupScoped', color: 0x4a5a4a, inacc: rIn, recoil: { up: 0.7, side: 0.4 }, pen: 2, desc: 'Bullpup com luneta (M2).' });
  // snipers
  const snIn = { stand: 5.5, crouch: 5, move: 9, jump: 14, shot: 0, max: 0, rec: 9 };
  add({ id: 'pardal', name: 'Pardal SSG', cat: 'sniper', slot: 'primary', price: 1700, dmg: 88, ap: 0.85, rpm: 48, auto: false, mag: 10, reserve: 90, reload: 3.7, speed: 230, falloff: 0.98, scope: [40, 15], scoped: { stand: 0.05, crouch: 0.03, move: 4, jump: 0.3 }, bolt: true, shape: 'sniperLight', color: 0x2e3a2e, inacc: snIn, recoil: { up: 3, side: 0.3 }, pen: 2.5, desc: 'Leve e precisa até no ar no topo do pulo.' });
  add({ id: 'leviata', name: 'Leviatã AWX', cat: 'sniper', slot: 'primary', price: 4750, dmg: 115, ap: 0.975, rpm: 41, auto: false, mag: 5, reserve: 30, reload: 3.6, speed: 200, falloff: 0.99, reward: 100, scope: [40, 10], scopeSpeed: 100, scoped: { stand: 0.02, crouch: 0.01, move: 8, jump: 15 }, bolt: true, shape: 'sniper', color: 0x3b4a2a, inacc: Object.assign({}, snIn, { stand: 7, crouch: 6.5 }), recoil: { up: 5, side: 0.5 }, pen: 3, desc: 'Abate com um tiro no peito. Muito lento.' });
  add({ id: 'ceifador', name: 'Ceifador G3', cat: 'sniper', slot: 'primary', team: 'T', price: 5000, dmg: 80, ap: 0.825, rpm: 240, auto: false, mag: 20, reserve: 90, reload: 4.7, speed: 215, falloff: 0.98, scope: [40, 15], scopeSpeed: 120, scoped: { stand: 0.1, crouch: 0.07, move: 7, jump: 12 }, shape: 'autoSniper', color: 0x2e2a22, inacc: snIn, recoil: { up: 2.4, side: 0.6 }, pen: 2.5, desc: 'Sniper semiautomática.' });
  add({ id: 'sentinela', name: 'Sentinela S20', cat: 'sniper', slot: 'primary', team: 'CT', price: 5000, dmg: 80, ap: 0.825, rpm: 240, auto: false, mag: 20, reserve: 90, reload: 3.1, speed: 215, falloff: 0.98, scope: [40, 15], scopeSpeed: 120, scoped: { stand: 0.1, crouch: 0.07, move: 7, jump: 12 }, shape: 'autoSniper', color: 0x2a3036, inacc: snIn, recoil: { up: 2.4, side: 0.6 }, pen: 2.5, desc: 'Sniper semiautomática.' });

  // ---------- Equipamento ----------
  add({ id: 'taser', name: 'Taser X2', cat: 'equip', slot: 'taser', price: 200, dmg: 500, ap: 1, rpm: 20, mag: 1, reserve: 0, auto: false, speed: 245, reward: 0, range: 3.5, shape: 'taser', color: 0xd8c020, pen: 0, inacc: { stand: 0.5, crouch: 0.5, move: 1, jump: 2, shot: 0, max: 0, rec: 1 }, desc: 'Uma carga, alcance curtíssimo. Abate instantâneo.' });
  add({ id: 'kevlar', name: 'Colete', cat: 'equip', slot: 'armor', price: 650, desc: 'Colete à prova de balas (100 de blindagem).' });
  add({ id: 'kevhelm', name: 'Colete + Capacete', cat: 'equip', slot: 'armor', price: 1000, desc: 'Blindagem total. Protege a cabeça de várias armas.' });
  add({ id: 'kit', name: 'Kit de Desarme', cat: 'equip', slot: 'kit', team: 'CT', price: 400, desc: 'Reduz o tempo de desarme de 10 s para 5 s.' });

  // ---------- Granadas ----------
  add({ id: 'he', name: 'Granada HE', cat: 'grenade', slot: 'grenade', price: 300, speed: 245, shape: 'nadeHE', color: 0x4b5b3a, fuse: 1.6, reward: 300, desc: 'Explode após 1,6 s. Até 98 de dano.' });
  add({ id: 'flash', name: 'Atordoante', cat: 'grenade', slot: 'grenade', price: 200, speed: 245, shape: 'nadeFlash', color: 0xb0b0b0, fuse: 1.6, max: 2, desc: 'Cega quem estiver olhando. Até 2 por jogador.' });
  add({ id: 'smoke', name: 'Fumaça', cat: 'grenade', slot: 'grenade', price: 300, speed: 245, shape: 'nadeSmoke', color: 0x6a7a8a, desc: 'Cortina de fumaça por 18 s.' });
  add({ id: 'molotov', name: 'Coquetel', cat: 'grenade', slot: 'grenade', team: 'T', price: 400, speed: 245, shape: 'nadeMolotov', color: 0x7a5a2a, fuse: 2, desc: 'Incendeia a área ao tocar o chão.' });
  add({ id: 'incend', name: 'Incendiária', cat: 'grenade', slot: 'grenade', team: 'CT', price: 500, speed: 245, shape: 'nadeInc', color: 0x8a3a2a, fuse: 2, desc: 'Versão da Força Tática do coquetel.' });
  add({ id: 'decoy', name: 'Chamariz', cat: 'grenade', slot: 'grenade', price: 50, speed: 245, shape: 'nadeDecoy', color: 0x6a6a5a, desc: 'Imita sons de tiro e aparece no radar inimigo.' });

  W.all = defs;
  W.MAX_NADES = 4;
  W.categories = [
    { id: 'pistol', name: 'Pistolas' },
    { id: 'heavy', name: 'Pesadas' },
    { id: 'smg', name: 'Submetralhadoras' },
    { id: 'rifle', name: 'Rifles' },
    { id: 'equip', name: 'Equipamento' },
    { id: 'grenade', name: 'Granadas' }
  ];
  W.forCat = (cat, team) => defs.filter(d => (d.cat === cat || (cat === 'rifle' && d.cat === 'sniper')) && d.price > 0 && (d.team === 'both' || d.team === team));
  W.interval = d => 60 / (d.rpm || 60);
})();
