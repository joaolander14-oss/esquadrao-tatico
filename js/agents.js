// Agentes originais (8 por lado): aparência, construção do modelo 3D e braços em 1ª pessoa.
(function () {
  const Ag = G.Agents = {};
  const Mo = G.Models, U = G.U;
  const cache = {};
  const lam = (color, map) => { const k = color + ':' + (map ? map.uuid : ''); return cache[k] || (cache[k] = new THREE.MeshLambertMaterial({ color, map: map || null })); };
  function box(p, w, h, d, x, y, z, m, rx, ry, rz) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); if (rx || ry || rz) o.rotation.set(rx || 0, ry || 0, rz || 0); p.add(o); return o; }
  function cyl(p, r1, r2, h, x, y, z, m, rx, rz, seg) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 12), m); o.position.set(x, y, z); if (rx) o.rotation.x = rx; if (rz) o.rotation.z = rz; p.add(o); return o; }
  function sph(p, r, x, y, z, m, sy) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10, 0, Math.PI * 2, 0, sy || Math.PI), m); o.position.set(x, y, z); p.add(o); return o; }

  // ---------------- Camuflagens ----------------
  const CAMO = {
    mata: ['#4a5a34', '#2f3a22', '#6b6a3e', '#1f241a'],
    deserto: ['#c8b28a', '#a68b5f', '#8a7048', '#e0d0aa'],
    urbana: ['#8a8d90', '#5c5f62', '#b4b6b8', '#3a3c3e'],
    neve: ['#e8ecef', '#c4cbd1', '#9aa3ab', '#ffffff'],
    noite: ['#2a3140', '#1c2230', '#3a4458', '#121620'],
    oceano: ['#3a5a7a', '#24405e', '#6a8aaa', '#1a2a40'],
    tigrada: ['#5a5a32', '#2a2a1a', '#8a7a4a', '#1a1a12'],
    cinza: ['#6a6e72', '#4a4e52', '#8a8e92', '#2a2c2e'],
    vermelha: ['#7a2a24', '#4a1a16', '#9a4a3a', '#2a0e0c']
  };
  const camoTex = {};
  function camo(id) {
    if (camoTex[id]) return camoTex[id];
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); const r = U.mulberry(id.length * 131);
    const pal = CAMO[id];
    g.fillStyle = pal[0]; g.fillRect(0, 0, 128, 128);
    for (let k = 1; k < 4; k++) for (let i = 0; i < 16; i++) {
      g.fillStyle = pal[k]; g.beginPath();
      const x = r() * 128, y = r() * 128, n = 7;
      for (let q = 0; q <= n; q++) { const a = q / n * 6.28, rad = 6 + r() * 12; g.lineTo(x + Math.cos(a) * rad * 1.4, y + Math.sin(a) * rad); }
      g.fill();
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
    return (camoTex[id] = t);
  }
  let maskTex = null;
  function paintedMask() {
    if (maskTex) return maskTex;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#e9e4d8'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#111'; g.beginPath(); g.ellipse(20, 26, 8, 6, 0, 0, 7); g.ellipse(44, 26, 8, 6, 0, 0, 7); g.fill();
    g.strokeStyle = '#b8261c'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 6); g.lineTo(32, 58); g.stroke();
    g.beginPath(); g.moveTo(14, 46); g.quadraticCurveTo(32, 54, 50, 46); g.stroke();
    return (maskTex = new THREE.CanvasTexture(cv));
  }

  // ---------------- Elenco ----------------
  Ag.list = [
    // Insurgentes
    { id: 'brasa', team: 'T', name: 'Brasa', role: 'Saqueador urbano', shirt: 0x5a3a24, pants: 0x2e2a26, vest: 0x3a3428, skin: 0xb98c62, gloves: 0x1c1a18, boots: 0x1c1a17, head: 'balaclava', headCol: 0x1c1c1e, acc: 0xa83a22, extras: ['pouches', 'kneepads'] },
    { id: 'duna', team: 'T', name: 'Duna', role: 'Batedor do deserto', shirt: 0xb4a07a, pants: 0x8a7a5a, vest: 0x6b5a3e, skin: 0x9c7250, gloves: 0x6b5a3e, boots: 0x5a4632, head: 'shemagh', headCol: 0xd8c8a2, acc: 0x7a2f22, extras: ['goggles', 'pouches'] },
    { id: 'sucata', team: 'T', name: 'Sucata', role: 'Mecânico do bando', shirt: 0xd06a22, pants: 0xd06a22, vest: 0x3a3a34, skin: 0xc89a70, gloves: 0x2a2a28, boots: 0x2a2620, head: 'welder', headCol: 0x2c2c2c, acc: 0xe0c040, extras: ['kneepads', 'belt'] },
    { id: 'vibora', team: 'T', name: 'Víbora', role: 'Atiradora da mata', camo: 'mata', shirt: 0xffffff, pants: 0xffffff, vest: 0x2f3324, skin: 0xa87850, gloves: 0x24241c, boots: 0x22201a, head: 'capBack', headCol: 0x3a3a2a, acc: 0xb82020, extras: ['scarf', 'pouches'] },
    { id: 'neblina', team: 'T', name: 'Neblina', role: 'Especialista química', shirt: 0x1e2024, pants: 0x26282c, vest: 0x2e3034, skin: 0xc89a70, gloves: 0x111214, boots: 0x111214, head: 'gasmask', headCol: 0x22252a, acc: 0x5a8a3a, extras: ['hood', 'pouches'] },
    { id: 'coronel', team: 'T', name: 'Coronel Ferro', role: 'Comandante veterano', shirt: 0x4e5634, pants: 0x3e4428, vest: 0x2e3020, skin: 0xc0906a, gloves: 0x1c1a18, boots: 0x161412, head: 'beret', headCol: 0x6a1820, acc: 0xd8b040, extras: ['epaulettes', 'beard', 'belt'] },
    { id: 'raposa', team: 'T', name: 'Raposa do Deserto', role: 'Sabotador', camo: 'deserto', shirt: 0xffffff, pants: 0xffffff, vest: 0x6a5a40, skin: 0xb58660, gloves: 0x5a4a34, boots: 0x4a3a28, head: 'boonie', headCol: 0xa68b5f, acc: 0x3a2a1a, extras: ['backpack', 'goggles'] },
    { id: 'facacega', team: 'T', name: 'Faca Cega', role: 'Infiltrador', shirt: 0x6a6c70, pants: 0x2a2c30, vest: 0x1e2024, skin: 0xd0a07a, gloves: 0x111111, boots: 0x161616, head: 'mask', headCol: 0x55575b, acc: 0xb8261c, extras: ['hood'] },
    // Força Tática
    { id: 'sentinela', team: 'CT', name: 'Sentinela', role: 'Operador de assalto', shirt: 0x26324a, pants: 0x232a38, vest: 0x15191f, skin: 0xc89a70, gloves: 0x111214, boots: 0x111214, head: 'helmetVisor', headCol: 0x1f2a3c, acc: 0x6aa8ff, extras: ['pouches', 'kneepads', 'shoulder'] },
    { id: 'aurora', team: 'CT', name: 'Tenente Aurora', role: 'Líder de equipe', shirt: 0x4a6a8e, pants: 0x2a3446, vest: 0x1d2430, skin: 0xd8a882, gloves: 0x1a1c20, boots: 0x15171a, head: 'ponytail', headCol: 0x1d2430, hair: 0x5a3820, acc: 0xffcc33, extras: ['pouches', 'radio'] },
    { id: 'granito', team: 'CT', name: 'Granito', role: 'Visão noturna', camo: 'urbana', shirt: 0xffffff, pants: 0xffffff, vest: 0x2a2c30, skin: 0xa8784e, gloves: 0x1a1a1a, boots: 0x161616, head: 'helmetNVG', headCol: 0x3a3e44, acc: 0x7acc40, extras: ['pouches', 'kneepads'] },
    { id: 'polar', team: 'CT', name: 'Falcão Polar', role: 'Unidade de montanha', camo: 'neve', shirt: 0xffffff, pants: 0xffffff, vest: 0xc4cbd1, skin: 0xe0b896, gloves: 0xdde2e6, boots: 0x9aa3ab, head: 'helmetWhite', headCol: 0xe6eaee, acc: 0x4a7aa8, extras: ['goggles', 'backpack'] },
    { id: 'recon', team: 'CT', name: 'Recon', role: 'Rádio e reconhecimento', camo: 'mata', shirt: 0xffffff, pants: 0xffffff, vest: 0x2a3220, skin: 0x8a5e3e, gloves: 0x22261a, boots: 0x1c1e16, head: 'helmetNet', headCol: 0x3e4a2a, acc: 0xc8c040, extras: ['radio', 'pouches'] },
    { id: 'vega', team: 'CT', name: 'Comandante Vega', role: 'Oficial da Força Tática', shirt: 0x1e2a44, pants: 0x1a2232, vest: 0x141822, skin: 0xc0906a, gloves: 0x0f1014, boots: 0x0f1014, head: 'beret', headCol: 0x1e4a9a, acc: 0xd8b040, extras: ['epaulettes', 'belt'] },
    { id: 'escudo', team: 'CT', name: 'Escudo', role: 'Blindagem pesada', shirt: 0x2a2e34, pants: 0x24282e, vest: 0x3a3f46, skin: 0xc89a70, gloves: 0x151617, boots: 0x151617, head: 'helmetClosed', headCol: 0x30353c, acc: 0xffaa22, extras: ['shoulder', 'kneepads', 'heavy'] },
    { id: 'lima', team: 'CT', name: 'Médica Lima', role: 'Socorrista de combate', camo: 'noite', shirt: 0xffffff, pants: 0xffffff, vest: 0x1c2230, skin: 0xb88a62, gloves: 0x1a1a1a, boots: 0x141414, head: 'helmet', headCol: 0x2c3448, acc: 0xffffff, extras: ['armband', 'pouches', 'medkit'] },
    // novos (originais)
    { id: 'ferrugem', team: 'T', name: 'Ferrugem', role: 'Operário do ferro-velho', shirt: 0x4a5a78, pants: 0x34486a, vest: 0xe8701e, skin: 0xb0805a, gloves: 0x6a5030, boots: 0x3a2a1a, head: 'hardhat', headCol: 0xe8c020, acc: 0xd8d8d8, hair: 0x3a2a1a, extras: ['belt', 'kneepads'] },
    { id: 'corvo', team: 'T', name: 'Corvo', role: 'Atirador das sombras', shirt: 0x1a1a1c, pants: 0x202024, vest: 0x2a2a2e, skin: 0xd4a888, gloves: 0x0e0e0e, boots: 0x0e0e0e, head: 'fedora', headCol: 0x141416, acc: 0x8a1a1a, extras: ['coat', 'scarf'] },
    { id: 'areia', team: 'T', name: 'Areia', role: 'Guia das dunas', shirt: 0xe0d4b8, pants: 0xb8a882, vest: 0x7a5a38, skin: 0x8a5e3a, gloves: 0x7a5a38, boots: 0x6a4a2a, head: 'turban', headCol: 0xf0ead8, acc: 0x2a6a8a, hair: 0x1a1410, extras: ['beard', 'pouches'] },
    { id: 'cobra', team: 'T', name: 'Cobra', role: 'Batedor de linha de frente', shirt: 0x4a5a2a, pants: 0x3a3a2a, vest: 0x2a2a22, skin: 0xa87048, gloves: 0x1a1a14, boots: 0x22201a, head: 'bandana', headCol: 0xb81e1e, acc: 0xd8b040, extras: ['sleeveless', 'pouches'] },
    { id: 'trovao', team: 'T', name: 'Trovão', role: 'Motoqueiro de fuga', shirt: 0x1c1c1e, pants: 0x2a3040, vest: 0x2a2a2a, skin: 0xc89a70, gloves: 0x111111, boots: 0x111111, head: 'moto', headCol: 0x9a1a1a, acc: 0xe8e8e8, extras: ['kneepads', 'shoulder'] },
    { id: 'mamute', team: 'T', name: 'Mamute', role: 'Brutamontes blindado', shirt: 0x5a4a3a, pants: 0x3a3a34, vest: 0x5a5a52, skin: 0xb88a60, gloves: 0x2a2620, boots: 0x1c1a16, head: 'bald', headCol: 0xb88a60, acc: 0xa83a22, hair: 0x2a1c12, extras: ['bulky', 'heavy', 'beard'] },
    { id: 'atlas', team: 'CT', name: 'Atlas', role: 'Escudo de assalto', shirt: 0x1c2230, pants: 0x1c2230, vest: 0x252c3a, skin: 0xc0906a, gloves: 0x0f1014, boots: 0x0f1014, head: 'ballistic', headCol: 0x1a2030, acc: 0xffcc33, extras: ['heavy', 'kneepads', 'shoulder'] },
    { id: 'nimbus', team: 'CT', name: 'Nimbus', role: 'Piloto de resgate', shirt: 0x5a6040, pants: 0x5a6040, vest: 0x3a3e2a, skin: 0xd8a882, gloves: 0x5a3a20, boots: 0x2a2018, head: 'aviator', headCol: 0x6a4a2a, acc: 0xc8a040, hair: 0x6a4a2a, extras: ['radio'] },
    { id: 'garra', team: 'CT', name: 'Garra', role: 'Operador de comunicações', shirt: 0x3a3e44, pants: 0x4a4434, vest: 0x2a2c26, skin: 0xb0805c, gloves: 0x1a1a18, boots: 0x22201c, head: 'headset', headCol: 0x5a5a4a, acc: 0x7acc40, hair: 0x2a1e14, extras: ['beard', 'pouches'] },
    { id: 'coral', team: 'CT', name: 'Coral', role: 'Fuzileira anfíbia', camo: 'oceano', shirt: 0xffffff, pants: 0xffffff, vest: 0x24384e, skin: 0x8a5a3a, gloves: 0x1a2430, boots: 0x141a22, head: 'helmet', headCol: 0x2a3e56, acc: 0xffffff, extras: ['goggles', 'pouches', 'kneepads'] },
    { id: 'tundra', team: 'CT', name: 'Tundra', role: 'Patrulheiro do ártico', shirt: 0xd8dde2, pants: 0x9aa3ab, vest: 0x6a7480, skin: 0xe2bc9a, gloves: 0x3a3e44, boots: 0x3a3e44, head: 'beanie', headCol: 0x7a828c, acc: 0xb82a2a, hair: 0x8a6a4a, extras: ['scarf', 'backpack'] },
    { id: 'delta7', team: 'CT', name: 'Delta Sete', role: 'Unidade de infiltração', shirt: 0x121214, pants: 0x121214, vest: 0x1a1a1c, skin: 0xc89a70, gloves: 0x0a0a0a, boots: 0x0a0a0a, head: 'ballisticMask', headCol: 0x141416, acc: 0x3a3a3a, extras: ['hood', 'pouches'] },
    // ----- leva 3 -----
    { id: 'pistoleiro', team: 'T', name: 'Pistoleiro', role: 'Caçador de recompensas', shirt: 0x8a5a3a, pants: 0x3a3a4a, vest: 0x5a3a24, skin: 0xb88a60, gloves: 0x5a3a24, boots: 0x3a2414, head: 'cowboy', headCol: 0x6a4a2a, acc: 0xc8a050, extras: ['scarf', 'belt', 'beard'] },
    { id: 'moicano', team: 'T', name: 'Moicano', role: 'Agitador de rua', shirt: 0x2a2a2e, pants: 0x3a4a6a, vest: 0x1a1a1c, skin: 0xd0a07a, gloves: 0x111111, boots: 0x111111, head: 'mohawk', headCol: 0xd0a07a, hair: 0xd8202a, acc: 0xd8202a, extras: ['sleeveless', 'kneepads'] },
    { id: 'polvora', team: 'T', name: 'Pólvora', role: 'Mestre explosivista', shirt: 0x5a5040, pants: 0x3a3a30, vest: 0x2a2a22, skin: 0xa8784e, gloves: 0x1a1a14, boots: 0x22201a, head: 'capFwd', headCol: 0x2a2a2a, acc: 0xe8a020, hair: 0x1a1410, extras: ['pouches', 'belt', 'goggles'] },
    { id: 'lagarto', team: 'T', name: 'Lagarto', role: 'Emboscador', camo: 'tigrada', shirt: 0xffffff, pants: 0xffffff, vest: 0x3a3a22, skin: 0x9c7250, gloves: 0x2a2a1a, boots: 0x22201a, head: 'boonie', headCol: 0x4a4a2a, acc: 0x8a2a1a, extras: ['goggles', 'pouches'] },
    { id: 'navalha', team: 'T', name: 'Navalha', role: 'Lutadora de rua', shirt: 0x3a2a4a, pants: 0x2a2a2e, vest: 0x1e1e22, skin: 0xc89a70, gloves: 0x111111, boots: 0x161616, head: 'headband', headCol: 0xc81e1e, hair: 0x1a1210, acc: 0xc81e1e, extras: ['sleeveless', 'scarf'] },
    { id: 'carvao', team: 'T', name: 'Carvão', role: 'Mineiro do bando', camo: 'cinza', shirt: 0xffffff, pants: 0xffffff, vest: 0x2a2a2a, skin: 0xa07050, gloves: 0x1a1a1a, boots: 0x1a1a1a, head: 'hardhat', headCol: 0xe8e8e8, acc: 0xf0c020, extras: ['goggles', 'heavy'] },
    { id: 'escorpiao', team: 'T', name: 'Escorpião', role: 'Franco-atirador do deserto', camo: 'deserto', shirt: 0xffffff, pants: 0xffffff, vest: 0x5a4a30, skin: 0x8a5e3a, gloves: 0x5a4a30, boots: 0x4a3a24, head: 'shemagh', headCol: 0x3a3a3a, acc: 0xc8a050, extras: ['backpack', 'pouches'] },
    { id: 'vigia', team: 'CT', name: 'Vigia', role: 'Câmera de capacete', shirt: 0x2a3446, pants: 0x232a38, vest: 0x161a22, skin: 0xc0906a, gloves: 0x111214, boots: 0x111214, head: 'helmetCam', headCol: 0x2a3446, acc: 0x6aa8ff, extras: ['pouches', 'kneepads'] },
    { id: 'rapina', team: 'CT', name: 'Rapina', role: 'Atiradora de elite', camo: 'cinza', shirt: 0xffffff, pants: 0xffffff, vest: 0x2a2c30, skin: 0xd8a882, gloves: 0x1a1a1a, boots: 0x161616, head: 'capFwd', headCol: 0x1a2a3a, acc: 0x6aa8ff, hair: 0x3a2416, extras: ['radio', 'pouches'] },
    { id: 'trincheira', team: 'CT', name: 'Trincheira', role: 'Engenheiro de combate', camo: 'tigrada', shirt: 0xffffff, pants: 0xffffff, vest: 0x3a3a24, skin: 0xb0805c, gloves: 0x22261a, boots: 0x1c1e16, head: 'helmet', headCol: 0x3a3e2a, acc: 0xc8c040, extras: ['backpack', 'kneepads'] },
    { id: 'farol', team: 'CT', name: 'Farol', role: 'Guarda costeira', shirt: 0xd8651e, pants: 0x2a3446, vest: 0x1e2430, skin: 0x8a5a3a, gloves: 0x1a1a1a, boots: 0x141414, head: 'helmetVisor', headCol: 0xe8e8e8, acc: 0xffcc33, extras: ['pouches'] },
    { id: 'xerife', team: 'CT', name: 'Xerife', role: 'Delegado federal', shirt: 0x3a4a6a, pants: 0x2a3040, vest: 0x2a2a2a, skin: 0xc89a70, gloves: 0x3a2a1a, boots: 0x2a1a10, head: 'cowboy', headCol: 0xd8c8a0, acc: 0xd8b040, extras: ['belt', 'armband'] },
    { id: 'eco', team: 'CT', name: 'Eco', role: 'Operador de sinais', camo: 'noite', shirt: 0xffffff, pants: 0xffffff, vest: 0x1a2030, skin: 0xa8784e, gloves: 0x111214, boots: 0x111214, head: 'headband', headCol: 0x1a2a4a, hair: 0x1a1410, acc: 0x7acc40, extras: ['radio', 'pouches'] },
    { id: 'ancora', team: 'CT', name: 'Âncora', role: 'Mergulhador de combate', camo: 'oceano', shirt: 0xffffff, pants: 0xffffff, vest: 0x1a2a3a, skin: 0xe2bc9a, gloves: 0x1a2430, boots: 0x141a22, head: 'beanie', headCol: 0x1a2a3a, acc: 0xffcc33, hair: 0x6a4a2a, extras: ['goggles', 'backpack', 'beard'] }
  ];
  Ag.byId = {}; for (const a of Ag.list) Ag.byId[a.id] = a;
  Ag.forTeam = team => Ag.list.filter(a => a.team === team);
  Ag.pick = (team, avoid) => { const opts = Ag.forTeam(team).filter(a => !(avoid || []).includes(a.id)); return (opts.length ? U.pick(opts) : U.pick(Ag.forTeam(team))).id; };

  // ---------------- Geometrias orgânicas ----------------
  const geoCache = {};
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const UPV = new THREE.Vector3(0, 1, 0);
  // cápsula afunilada ao longo de Y (r1 embaixo, r2 em cima), feita por torno
  function capGeo(r1, r2, len, seg) {
    const key = ['c', r1, r2, len.toFixed(3), seg].join(':');
    if (geoCache[key]) return geoCache[key];
    const pts = [], n = 6;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0.0001, Math.cos(a) * r1), -len / 2 + Math.sin(a) * r1)); }
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0.0001, Math.cos(a) * r2), len / 2 + Math.sin(a) * r2)); }
    return (geoCache[key] = new THREE.LatheGeometry(pts, seg || 12));
  }
  // membro entre dois pontos (r1 na ponta p1, r2 na ponta p2)
  function limb(parent, p1, p2, r1, r2, mat, seg) {
    const a = V3(p1), b = V3(p2), dir = b.clone().sub(a), L = dir.length();
    const m = new THREE.Mesh(capGeo(r1, r2, L, seg || 12), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UPV, dir.normalize());
    parent.add(m); return m;
  }
  function sphGeo(seg, half) {
    const key = 's' + seg + ':' + (half || 0);
    return geoCache[key] || (geoCache[key] = half ? new THREE.SphereGeometry(1, seg, Math.ceil(seg * 0.6), 0, Math.PI * 2, 0, Math.PI / 2) : new THREE.SphereGeometry(1, seg, Math.ceil(seg * 0.7)));
  }
  // elipsoide
  function ell(parent, r, sx, sy, sz, x, y, z, mat, seg, half) {
    const m = new THREE.Mesh(sphGeo(seg || 14, half), mat);
    m.scale.set(r * sx, r * sy, r * sz); m.position.set(x, y, z); parent.add(m); return m;
  }
  // caixa com cantos arredondados
  function rbox(parent, w, h, d, rad, x, y, z, mat, rx, ry, rz) {
    const key = ['r', w, h, d, rad].join(':');
    let geo = geoCache[key];
    if (!geo) {
      const r = Math.min(rad, w / 2 - 0.001, h / 2 - 0.001), s = new THREE.Shape(), x0 = -w / 2 + r, y0 = -h / 2 + r, x1 = w / 2 - r, y1 = h / 2 - r;
      s.moveTo(x0, -h / 2 + r * 0); s.lineTo(x1, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, y0); s.lineTo(w / 2, y1); s.quadraticCurveTo(w / 2, h / 2, x1, h / 2);
      s.lineTo(x0, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y1); s.lineTo(-w / 2, y0); s.quadraticCurveTo(-w / 2, -h / 2, x0, -h / 2);
      const bv = Math.min(rad, d / 2 - 0.001);
      geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * bv), bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.6, bevelSegments: 2, curveSegments: 4 });
      geo.translate(0, 0, -(d - 2 * bv) / 2);
      geoCache[key] = geo;
    }
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); parent.add(m); return m;
  }
  function torus(parent, R, r, x, y, z, mat, sx, sz) {
    const key = ['t', R, r].join(':');
    const geo = geoCache[key] || (geoCache[key] = new THREE.TorusGeometry(R, r, 8, 22));
    const m = new THREE.Mesh(geo, mat); m.rotation.x = Math.PI / 2; m.scale.set(sx || 1, sz || 1, 1); m.position.set(x, y, z); parent.add(m); return m;
  }
  const phongSkin = {};
  const skinMat = c => phongSkin[c] || (phongSkin[c] = new THREE.MeshPhongMaterial({ color: c, shininess: 14, specular: 0x2a2018 }));
  // junta as malhas filhas diretas de um grupo, por material (menos chamadas de desenho)
  function merge(group) {
    const buckets = new Map();
    for (const m of group.children.slice()) {
      if (!m.isMesh || m.children.length || (m.material && m.material.transparent)) continue;
      m.updateMatrix();
      const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
      if (!g.attributes.uv) continue;
      const k = m.material.uuid;
      if (!buckets.has(k)) buckets.set(k, { mat: m.material, geos: [] });
      buckets.get(k).geos.push(g);
      group.remove(m);
    }
    for (const { mat, geos } of buckets.values()) {
      let n = 0; for (const g of geos) n += g.attributes.position.count;
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2);
      let o = 0;
      for (const g of geos) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); UV.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(P, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(N, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
      const mesh = new THREE.Mesh(bg, mat); mesh.castShadow = true; group.add(mesh);
    }
  }

  // ---------------- Modelo 3D ----------------
  // pontos do esqueleto (coordenadas locais dos grupos)
  const ER = [0.03, -0.22, -0.1], WR = [-0.03, -0.13, -0.36];       // cotovelo / punho direito (armR)
  const EL = [0.06, -0.2, -0.16], WL = [0.3, -0.14, -0.42];          // cotovelo / punho esquerdo (armL)
  Mo.soldier = (team, agentId) => {
    const A = Ag.byId[agentId] || Ag.forTeam(team)[0];
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);
    const cm = A.camo ? camo(A.camo) : null;
    const mShirt = lam(A.shirt, cm), mPants = lam(A.pants, cm), mVest = lam(A.vest), mSkin = skinMat(A.skin), mBoot = lam(A.boots), mGlove = lam(A.gloves), mHead = lam(A.headCol), mAcc = lam(A.acc);
    const mDark = lam(0x161616), mStrap = lam(0x1e1c18), mSole = lam(0x0e0e0e);
    const ex = new Set(A.extras || []);
    const heavy = ex.has('heavy');
    const mArm = ex.has('sleeveless') ? mSkin : mShirt;
    // ---- pernas ----
    const legs = [];
    for (const s of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(0.1 * s, 0.9, 0); body.add(leg);
      limb(leg, [0, 0.04, 0], [0, -0.44, 0.012], 0.092, 0.066, mPants);                  // coxa
      ell(leg, 0.07, 1.15, 1.6, 1.05, 0.0, -0.16, -0.01, mPants, 10);                     // músculo da coxa
      if (ex.has('pouches')) rbox(leg, 0.05, 0.13, 0.12, 0.02, 0.085 * s, -0.2, 0.0, mVest);
      const shin = new THREE.Group(); shin.position.set(0, -0.46, 0.012); leg.add(shin);
      ell(shin, 0.062, 1, 1, 1, 0, 0.0, 0, mPants, 10);                                   // joelho
      limb(shin, [0, 0, 0], [0, -0.37, 0.01], 0.062, 0.048, mPants);                     // canela
      ell(shin, 0.058, 1, 1.7, 1.05, 0, -0.12, 0.022, mPants, 10);                        // panturrilha
      if (ex.has('kneepads') || heavy) ell(shin, 0.06, 1.05, 1.15, 0.55, 0, 0.0, -0.05, mDark, 12);
      // bota
      limb(shin, [0, -0.32, 0.005], [0, -0.41, 0.0], 0.058, 0.06, mBoot, 10);
      rbox(shin, 0.12, 0.09, 0.25, 0.04, 0, -0.415, -0.045, mBoot);
      rbox(shin, 0.125, 0.025, 0.26, 0.012, 0, -0.455, -0.045, mSole);
      leg.userData.shin = shin;
      legs.push(leg);
    }
    // ---- tronco ----
    const upper = new THREE.Group(); upper.position.set(0, 0.9, 0); body.add(upper);
    ell(upper, 0.17, 1.2, 0.72, 0.84, 0, 0.0, 0, mPants, 14);                              // quadril
    if (ex.has('coat')) {                                                                   // sobretudo até o joelho
      const cg = new THREE.CylinderGeometry(0.21, 0.27, 0.62, 18, 1, true);
      const cm2 = new THREE.MeshLambertMaterial({ color: A.shirt, side: THREE.DoubleSide });
      const coat = new THREE.Mesh(cg, cm2); coat.position.set(0, -0.2, 0.01); coat.scale.set(1.05, 1, 0.82); upper.add(coat);
      rbox(upper, 0.05, 0.3, 0.02, 0.01, -0.07, 0.36, -0.17, mShirt); rbox(upper, 0.05, 0.3, 0.02, 0.01, 0.07, 0.36, -0.17, mShirt);
    }
    limb(upper, [0, 0.05, 0], [0, 0.3, 0], 0.16, 0.175, mShirt, 14).scale.set(1.18, 1, 0.74);
    ell(upper, 0.2, 1.17, 0.95, 0.72, 0, 0.42, 0, mShirt, 16);                             // peito
    ell(upper, 0.2, 1.3, 0.5, 0.72, 0, 0.53, 0, mShirt, 14);                               // ombros
    ell(upper, 0.09, 1.6, 0.55, 0.9, 0, 0.58, 0.02, mShirt, 12);                           // trapézio
    torus(upper, 0.185, 0.03, 0, 0.09, 0, mStrap, 1.12, 0.78);                             // cinto
    rbox(upper, 0.07, 0.05, 0.03, 0.01, 0, 0.09, -0.15, lam(0x9a8a5a));                    // fivela
    rbox(upper, heavy ? 0.5 : 0.43, heavy ? 0.42 : 0.34, heavy ? 0.36 : 0.3, 0.06, 0, 0.37, 0, mVest);   // colete
    rbox(upper, heavy ? 0.36 : 0.3, 0.24, 0.035, 0.015, 0, 0.4, heavy ? -0.18 : -0.156, lam(A.vest === 0xffffff ? 0xc4cbd1 : A.vest));
    for (const sx of [-1, 1]) rbox(upper, 0.07, 0.03, 0.3, 0.012, 0.13 * sx, 0.55, 0, mVest);    // alças
    if (ex.has('pouches')) for (const x of [-0.12, 0, 0.12]) rbox(upper, 0.09, 0.11, 0.06, 0.02, x, 0.22, -0.17, mVest);
    rbox(upper, 0.09, 0.05, 0.02, 0.008, 0.12, 0.47, -0.163, mAcc);                         // identificação
    if (ex.has('radio')) { rbox(upper, 0.12, 0.2, 0.09, 0.02, -0.15, 0.42, 0.17, mDark); limb(upper, [-0.18, 0.5, 0.18], [-0.2, 1.0, 0.19], 0.006, 0.004, mDark, 6); }
    if (ex.has('backpack')) { rbox(upper, 0.34, 0.42, 0.17, 0.05, 0, 0.33, 0.21, lam(A.camo ? 0x6a5a40 : A.vest)); rbox(upper, 0.3, 0.09, 0.15, 0.04, 0, 0.58, 0.21, mStrap); }
    if (ex.has('medkit')) { rbox(upper, 0.14, 0.12, 0.09, 0.02, 0.19, 0.08, 0.06, lam(0xc8c8c8)); rbox(upper, 0.06, 0.02, 0.095, 0.004, 0.19, 0.08, 0.06, lam(0xd02020)); rbox(upper, 0.02, 0.06, 0.095, 0.004, 0.19, 0.08, 0.06, lam(0xd02020)); }
    if (ex.has('belt')) rbox(upper, 0.08, 0.1, 0.08, 0.02, -0.2, 0.06, -0.06, mStrap);
    if (ex.has('scarf')) torus(upper, 0.072, 0.03, 0, 0.57, 0, mAcc);
    if (ex.has('hood')) ell(upper, 0.16, 1.1, 0.7, 0.9, 0, 0.58, 0.08, mShirt, 12);
    // pescoço
    limb(upper, [0, 0.5, 0.008], [0, 0.665, -0.008], 0.066, 0.056, mSkin, 12);
    // ---- cabeça ----
    const head = new THREE.Group(); head.position.set(0, 0.632, -0.008); upper.add(head);
    buildHead(head, A, mSkin, mHead, mAcc, mDark);
    // ---- braços ----
    const armR = new THREE.Group(); armR.position.set(0.215, 0.55, 0); upper.add(armR);
    const armL = new THREE.Group(); armL.position.set(-0.215, 0.55, 0); upper.add(armL);
    for (const [arm, E, Wr, side] of [[armR, ER, WR, 1], [armL, EL, WL, -1]]) {
      ell(arm, 0.075, 1.05, 1, 1.05, 0.0, 0.0, 0, mArm, 12);                               // deltoide
      limb(arm, [0, 0, 0], E, 0.062, 0.05, mArm);                                           // braço
      ell(arm, 0.05, 1, 1, 1, E[0], E[1], E[2], mShirt, 10);                                // cotovelo
      limb(arm, E, Wr, 0.052, 0.04, mArm);                                                  // antebraço
      // luva: punho, mão fechada, dedos e polegar
      torus(arm, 0.038, 0.012, Wr[0] * 0.9 + E[0] * 0.1, Wr[1] * 0.9 + E[1] * 0.1, Wr[2] * 0.9 + E[2] * 0.1, mGlove);
      ell(arm, 0.045, 0.85, 1.05, 1.25, Wr[0], Wr[1] - 0.005, Wr[2] - 0.03, mGlove, 12);
      for (let f = 0; f < 4; f++) ell(arm, 0.015, 1.1, 0.85, 1.15, Wr[0] - 0.018 * side, Wr[1] - 0.028 + f * 0.016, Wr[2] - 0.066, mGlove, 8);
      limb(arm, [Wr[0] - 0.035 * side, Wr[1] + 0.01, Wr[2] - 0.02], [Wr[0] - 0.035 * side, Wr[1] + 0.03, Wr[2] - 0.07], 0.015, 0.013, mGlove, 8);
      if (ex.has('shoulder') || heavy) ell(arm, 0.095, 1.1, 0.55, 1.1, 0.02 * side, 0.05, 0, mVest, 12);
      if (ex.has('epaulettes')) rbox(arm, 0.12, 0.02, 0.1, 0.008, 0, 0.075, 0, mAcc);
    }
    if (ex.has('armband')) { torus(armL, 0.058, 0.014, EL[0] * 0.45, EL[1] * 0.45, EL[2] * 0.45, lam(0xffffff)); }
    const gunHold = new THREE.Group(); gunHold.position.set(0.18, 0.4, -0.38); upper.add(gunHold);
    // juntar malhas
    for (const g of [upper, head, armR, armL, ...legs, ...legs.map(l => l.userData.shin)]) merge(g);
    if (ex.has('bulky')) { upper.scale.set(1.12, 1.03, 1.1); for (const l of legs) l.scale.set(1.12, 1, 1.1); }
    root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    // hitboxes presas aos ossos
    const hb = [
      { g: 'head', obj: head, a: [0, 0.118, -0.008], r: 0.122 },
      { g: 'chest', obj: upper, a: [0, 0.52, 0], b: [0, 0.64, -0.008], r: 0.068 },
      { g: 'chest', obj: upper, a: [0, 0.34, 0], b: [0, 0.5, 0], r: heavy ? 0.22 : 0.195 },
      { g: 'stomach', obj: upper, a: [0, 0.1, 0], b: [0, 0.28, 0], r: 0.175 },
      { g: 'stomach', obj: upper, a: [-0.07, 0.0, 0], b: [0.07, 0.0, 0], r: 0.155 },
      { g: 'arms', obj: armR, a: [0, 0, 0], b: ER, r: 0.064 }, { g: 'arms', obj: armR, a: ER, b: WR, r: 0.054 },
      { g: 'arms', obj: armL, a: [0, 0, 0], b: EL, r: 0.064 }, { g: 'arms', obj: armL, a: EL, b: WL, r: 0.054 }
    ];
    for (const l of legs) { const sh = l.userData.shin; hb.push({ g: 'legs', obj: l, a: [0, 0.02, 0], b: [0, -0.44, 0.012], r: 0.092 }, { g: 'legs', obj: sh, a: [0, 0, 0], b: [0, -0.37, 0.01], r: 0.068 }, { g: 'legs', obj: sh, a: [0, -0.41, -0.05], r: 0.075 }); }
    return { root, body, upper, head, legs, armR, armL, gunHold, gun: null, gunId: null, agent: A.id, hb };
  };
  // rosto com crânio, maxilar, nariz, orelhas, olhos, sobrancelhas e boca
  function face(head, A, mSkin, opts) {
    opts = opts || {};
    const hair = lam(A.hair || 0x2a1c12), eyeW = lam(0xeeeae2), iris = lam(0x2a1e14), lips = lam(0x7a4636);
    ell(head, 0.118, 0.92, 1.02, 1.0, 0, 0.13, 0.01, mSkin, 18);                           // crânio
    ell(head, 0.088, 0.95, 0.78, 0.98, 0, 0.065, -0.02, mSkin, 14);                        // maxilar
    ell(head, 0.034, 1.15, 0.8, 0.85, 0, 0.032, -0.07, mSkin, 10);                         // queixo
    for (const s of [-1, 1]) {
      ell(head, 0.028, 0.45, 1, 0.75, 0.103 * s, 0.11, 0.005, mSkin, 8);                   // orelhas
      ell(head, 0.017, 1.05, 0.75, 0.6, 0.036 * s, 0.128, -0.093, eyeW, 8);                // olho
      ell(head, 0.0095, 1, 1, 0.55, 0.036 * s, 0.128, -0.1, iris, 8);                     // íris
      rbox(head, 0.036, 0.009, 0.012, 0.003, 0.038 * s, 0.152, -0.099, hair, 0, 0, -0.12 * s);   // sobrancelha
      ell(head, 0.03, 1.1, 0.7, 0.7, 0.05 * s, 0.09, -0.075, mSkin, 8);                    // maçã do rosto
    }
    limb(head, [0, 0.122, -0.1], [0, 0.088, -0.122], 0.011, 0.016, mSkin, 8);             // nariz
    rbox(head, 0.04, 0.008, 0.01, 0.003, 0, 0.058, -0.096, lips);                          // boca
    if (!opts.noHair) ell(head, 0.116, 0.95, 0.75, 1.03, 0, 0.17, 0.022, hair, 14, true);  // cabelo
    if (opts.beard) { ell(head, 0.09, 1.0, 0.7, 0.92, 0, 0.05, -0.03, hair, 12); }
  }
  function helmetDome(head, mHead, mDark, r) {
    ell(head, r || 0.136, 1, 0.92, 1.06, 0, 0.14, 0.012, mHead, 18, true);
    torus(head, (r || 0.136) * 1.0, 0.01, 0, 0.14, 0.012, mHead, 1, 1.06);
    for (const s of [-1, 1]) ell(head, 0.04, 0.5, 1, 1, 0.12 * s, 0.1, 0.01, mDark, 8);    // protetor de ouvido
    for (const s of [-1, 1]) limb(head, [0.1 * s, 0.09, 0.0], [0.04 * s, 0.02, -0.04], 0.005, 0.005, mDark, 6);   // jugular
  }
  function buildHead(head, A, mSkin, mHead, mAcc, mDark) {
    const ex = A.extras || [];
    const beard = ex.includes('beard');
    switch (A.head) {
      case 'balaclava':
        face(head, A, mSkin, { noHair: true });
        ell(head, 0.119, 0.94, 1.06, 1.04, 0, 0.115, 0.012, mHead, 18);
        ell(head, 0.075, 1.15, 0.32, 0.45, 0, 0.128, -0.075, mSkin, 12);
        for (const s of [-1, 1]) { ell(head, 0.016, 1.05, 0.75, 0.6, 0.036 * s, 0.128, -0.104, lam(0xeeeae2), 8); ell(head, 0.009, 1, 1, 0.55, 0.036 * s, 0.128, -0.11, lam(0x2a1e14), 8); }
        break;
      case 'shemagh':
        face(head, A, mSkin, { noHair: true });
        ell(head, 0.124, 0.98, 0.9, 1.05, 0, 0.16, 0.012, mHead, 16);
        ell(head, 0.098, 1.05, 0.7, 1.0, 0, 0.055, -0.025, mHead, 14);
        limb(head, [0, 0.1, 0.1], [0.02, -0.1, 0.15], 0.04, 0.025, mHead, 8);
        break;
      case 'welder':
        face(head, A, mSkin);
        torus(head, 0.115, 0.012, 0, 0.17, 0.01, lam(0x3a3a3a), 1, 1.04);
        for (const s of [-1, 1]) { const g = limb(head, [0.045 * s, 0.185, -0.1], [0.045 * s, 0.19, -0.13], 0.028, 0.028, lam(0x1c2a2a), 10); }
        break;
      case 'capBack':
        face(head, A, mSkin);
        ell(head, 0.12, 1, 0.75, 1.04, 0, 0.17, 0.012, mHead, 16, true);
        ell(head, 0.07, 1.1, 0.1, 1.25, 0, 0.175, 0.13, mHead, 12);
        ell(head, 0.09, 1.0, 0.55, 0.85, 0, 0.055, -0.04, mAcc, 12);
        break;
      case 'gasmask':
        face(head, A, mSkin, { noHair: true });
        ell(head, 0.12, 0.95, 1.06, 1.04, 0, 0.115, 0.014, mHead, 18);
        ell(head, 0.085, 1.0, 0.95, 0.75, 0, 0.1, -0.075, lam(0x2a2e26), 14);
        for (const s of [-1, 1]) limb(head, [0.038 * s, 0.132, -0.1], [0.04 * s, 0.132, -0.135], 0.027, 0.027, lam(0x2a4040), 12);
        limb(head, [0.04, 0.05, -0.12], [0.07, 0.02, -0.19], 0.032, 0.035, lam(0x3a3e36), 12);
        break;
      case 'beret':
        face(head, A, mSkin, { beard });
        { const b = ell(head, 0.125, 1.05, 0.32, 1.02, 0.015, 0.215, 0.012, mHead, 16); b.rotation.z = -0.22; }
        ell(head, 0.014, 1, 1, 0.4, -0.06, 0.215, -0.115, lam(0xd8b040), 8);
        break;
      case 'boonie':
        face(head, A, mSkin);
        ell(head, 0.122, 1, 0.9, 1.04, 0, 0.17, 0.012, mHead, 16, true);
        { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.012, 22), mHead); br.position.set(0, 0.175, 0.012); head.add(br); }
        break;
      case 'mask':
        face(head, A, mSkin, { noHair: true });
        ell(head, 0.13, 1.0, 1.05, 1.08, 0, 0.13, 0.03, mHead, 16);
        { const mk = new THREE.Mesh(new THREE.SphereGeometry(0.118, 14, 10, Math.PI * 1.2, Math.PI * 0.6, Math.PI * 0.18, Math.PI * 0.6), new THREE.MeshLambertMaterial({ map: paintedMask() })); mk.position.set(0, 0.11, 0.0); mk.scale.set(0.95, 1.05, 1.02); head.add(mk); }
        break;
      case 'ponytail':
        face(head, A, mSkin);
        ell(head, 0.12, 1, 0.78, 1.04, 0, 0.17, 0.012, mHead, 16, true);
        ell(head, 0.07, 1.1, 0.1, 1.3, 0, 0.175, -0.12, mHead, 12);
        limb(head, [0, 0.15, 0.11], [0, -0.02, 0.17], 0.03, 0.018, lam(A.hair || 0x3a2416), 10);
        break;
      case 'helmetClosed':
        face(head, A, mSkin, { noHair: true });
        ell(head, 0.142, 0.98, 1.06, 1.05, 0, 0.12, 0.01, mHead, 18);
        { const v = new THREE.Mesh(new THREE.SphereGeometry(0.144, 16, 6, Math.PI * 1.27, Math.PI * 0.46, Math.PI * 0.4, Math.PI * 0.12), new THREE.MeshPhongMaterial({ color: 0x0c1218, shininess: 100, specular: 0x6688aa })); v.position.set(0, 0.12, 0.01); v.scale.set(0.99, 1.07, 1.06); head.add(v); }
        torus(head, 0.142, 0.012, 0, 0.2, 0.01, mDark, 0.98, 1.05);
        break;
      case 'hardhat':
        face(head, A, mSkin);
        ell(head, 0.132, 1.0, 0.82, 1.06, 0, 0.165, 0.012, mHead, 18, true);
        { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.16, 0.012, 22), mHead); br.position.set(0, 0.167, 0.0); br.scale.set(1, 1, 1.12); head.add(br); }
        rbox(head, 0.03, 0.03, 0.2, 0.01, 0, 0.27, 0.01, mHead);
        break;
      case 'fedora':
        face(head, A, mSkin);
        limb(head, [0, 0.19, 0.012], [0, 0.285, 0.012], 0.118, 0.1, mHead, 18);
        { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.012, 24), mHead); br.position.set(0, 0.19, 0.012); br.rotation.x = 0.06; head.add(br); }
        torus(head, 0.118, 0.012, 0, 0.205, 0.012, mAcc);
        break;
      case 'turban':
        face(head, A, mSkin);
        for (let i = 0; i < 4; i++) torus(head, 0.11 - i * 0.012, 0.035, 0, 0.18 + i * 0.03, 0.012, mHead, 1, 1.08);
        ell(head, 0.08, 1, 0.6, 1.05, 0, 0.29, 0.012, mHead, 12);
        ell(head, 0.03, 1, 1.2, 0.6, 0.0, 0.2, -0.122, mAcc, 10);
        break;
      case 'bandana':
        face(head, A, mSkin);
        ell(head, 0.12, 0.96, 0.62, 1.04, 0, 0.17, 0.014, mHead, 16, true);
        ell(head, 0.03, 1.4, 0.8, 1, 0.0, 0.17, 0.125, mHead, 8);
        limb(head, [0, 0.16, 0.13], [0.02, 0.06, 0.17], 0.018, 0.012, mHead, 6);
        break;
      case 'moto':
        face(head, A, mSkin, { noHair: true });
        ell(head, 0.148, 0.98, 1.05, 1.08, 0, 0.12, 0.01, mHead, 20);
        { const v = new THREE.Mesh(new THREE.SphereGeometry(0.151, 18, 8, Math.PI * 1.2, Math.PI * 0.6, Math.PI * 0.32, Math.PI * 0.26), new THREE.MeshPhongMaterial({ color: 0x0a0e14, shininess: 120, specular: 0x8899bb })); v.position.set(0, 0.12, 0.01); v.scale.set(0.98, 1.05, 1.08); head.add(v); }
        rbox(head, 0.2, 0.025, 0.05, 0.01, 0, 0.055, -0.135, mAcc);
        break;
      case 'bald':
        face(head, A, mSkin, { noHair: true, beard: true });
        break;
      case 'ballistic':
        face(head, A, mSkin, { noHair: true });
        helmetDome(head, mHead, mDark, 0.142);
        { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 8, Math.PI * 1.18, Math.PI * 0.64, Math.PI * 0.36, Math.PI * 0.38), new THREE.MeshPhongMaterial({ color: 0x8aa0b4, transparent: true, opacity: 0.45, shininess: 120, specular: 0xffffff })); sh.position.set(0, 0.12, 0.0); head.add(sh); }
        break;
      case 'aviator':
        face(head, A, mSkin);
        ell(head, 0.124, 0.96, 0.92, 1.05, 0, 0.15, 0.014, mHead, 16, true);
        for (const s of [-1, 1]) ell(head, 0.05, 0.4, 1.3, 0.9, 0.108 * s, 0.07, 0.01, mHead, 10);
        torus(head, 0.122, 0.009, 0, 0.215, 0.012, lam(0x2a1a10), 1, 1.06);
        for (const s of [-1, 1]) limb(head, [0.04 * s, 0.24, -0.105], [0.04 * s, 0.245, -0.13], 0.026, 0.026, lam(0x3a5a6a), 10);
        break;
      case 'headset':
        face(head, A, mSkin, { beard: (A.extras || []).includes('beard') });
        ell(head, 0.12, 1, 0.75, 1.04, 0, 0.17, 0.012, mHead, 16, true);
        ell(head, 0.07, 1.1, 0.1, 1.25, 0, 0.175, -0.12, mHead, 12);
        rbox(head, 0.03, 0.012, 0.03, 0.005, 0, 0.29, 0.012, mDark);
        for (const s of [-1, 1]) limb(head, [0.1 * s, 0.11, 0.0], [0.135 * s, 0.11, 0.0], 0.045, 0.045, mDark, 12);
        limb(head, [0.12, 0.09, -0.02], [0.05, 0.06, -0.11], 0.006, 0.006, mDark, 6); ell(head, 0.014, 1, 1, 1, 0.045, 0.06, -0.115, mDark, 8);
        break;
      case 'beanie':
        face(head, A, mSkin);
        ell(head, 0.124, 0.98, 1.05, 1.05, 0, 0.165, 0.012, mHead, 16, true);
        torus(head, 0.12, 0.024, 0, 0.17, 0.012, mHead, 1, 1.05);
        ell(head, 0.035, 1, 1, 1, 0, 0.3, 0.012, mAcc, 10);
        break;
      case 'ballisticMask':
        face(head, A, mSkin, { noHair: true });
        ell(head, 0.13, 1.0, 1.05, 1.08, 0, 0.13, 0.03, mHead, 16);
        { const mk = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10, Math.PI * 1.2, Math.PI * 0.6, Math.PI * 0.18, Math.PI * 0.62), new THREE.MeshPhongMaterial({ color: 0x1c1e22, shininess: 60, specular: 0x555555 })); mk.position.set(0, 0.11, -0.005); mk.scale.set(0.98, 1.05, 1.05); head.add(mk); }
        for (const s of [-1, 1]) rbox(head, 0.042, 0.012, 0.01, 0.004, 0.038 * s, 0.13, -0.124, lam(0xff3020));
        break;
      case 'cowboy':
        face(head, A, mSkin, { beard });
        limb(head, [0, 0.19, 0.012], [0, 0.275, 0.012], 0.112, 0.098, mHead, 18);
        { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.012, 26), mHead); br.position.set(0, 0.19, 0.012); br.scale.set(1, 1, 0.86); head.add(br);
          for (const s of [-1, 1]) { const up = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.3), mHead); up.position.set(0.215 * s, 0.215, 0.012); up.rotation.z = -0.6 * s; head.add(up); } }
        torus(head, 0.112, 0.01, 0, 0.205, 0.012, mAcc);
        break;
      case 'capFwd':
        face(head, A, mSkin);
        ell(head, 0.12, 1, 0.75, 1.04, 0, 0.17, 0.012, mHead, 16, true);
        ell(head, 0.07, 1.1, 0.1, 1.25, 0, 0.175, -0.125, mAcc, 12);
        ell(head, 0.012, 1, 0.6, 1, 0, 0.255, 0.012, mAcc, 8);
        break;
      case 'mohawk':
        face(head, A, mSkin, { noHair: true, beard });
        for (let i = 0; i < 7; i++) ell(head, 0.028, 0.55, 1.5, 1.0, 0, 0.2 + Math.sin(i / 6 * Math.PI) * 0.035, -0.09 + i * 0.033, lam(A.hair || 0x8a1a1a), 8);
        break;
      case 'headband':
        face(head, A, mSkin, { beard });
        torus(head, 0.121, 0.016, 0, 0.172, 0.012, mHead, 1, 1.06);
        limb(head, [0.01, 0.17, 0.13], [0.03, 0.09, 0.19], 0.012, 0.008, mHead, 6);
        limb(head, [-0.01, 0.17, 0.13], [-0.02, 0.1, 0.2], 0.012, 0.008, mHead, 6);
        break;
      case 'helmetCam':
        face(head, A, mSkin, { noHair: true });
        helmetDome(head, mHead, mDark);
        rbox(head, 0.04, 0.035, 0.07, 0.008, 0.11, 0.22, -0.03, lam(0x111111));
        limb(head, [0.11, 0.22, -0.065], [0.11, 0.22, -0.075], 0.012, 0.012, lam(0x2a5a8a), 10);
        rbox(head, 0.03, 0.02, 0.03, 0.006, -0.1, 0.24, 0.0, lam(0xff3020));
        break;
      default: {
        // capacetes
        face(head, A, mSkin, { noHair: true });
        helmetDome(head, mHead, mDark);
        if (A.head === 'helmetVisor') { const v = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 6, Math.PI * 1.25, Math.PI * 0.5, Math.PI * 0.4, Math.PI * 0.16), new THREE.MeshPhongMaterial({ color: 0x223040, transparent: true, opacity: 0.78, shininess: 90, specular: 0x88aaff })); v.position.set(0, 0.14, 0.012); head.add(v); }
        if (A.head === 'helmetNVG') { rbox(head, 0.06, 0.045, 0.05, 0.012, 0, 0.255, -0.115, mDark); for (const s of [-1, 1]) limb(head, [0.03 * s, 0.24, -0.135], [0.03 * s, 0.235, -0.19], 0.018, 0.018, lam(0x0a0a0a), 10); }
        if (A.head === 'helmetNet') for (let i = 0; i < 5; i++) torus(head, 0.135 - i * 0.012, 0.003, 0, 0.17 + i * 0.022, 0.012, lam(0x2a3218), 1, 1.06);
        if (ex.includes('goggles')) { torus(head, 0.137, 0.008, 0, 0.215, 0.012, mDark, 1, 1.06); for (const s of [-1, 1]) limb(head, [0.04 * s, 0.24, -0.12], [0.04 * s, 0.24, -0.14], 0.024, 0.024, lam(0x223a4a), 10); }
      }
    }
    if (ex.includes('goggles') && !A.head.startsWith('helmet')) { torus(head, 0.118, 0.008, 0, 0.21, 0.012, lam(0x1a1a1a), 1, 1.04); for (const s of [-1, 1]) limb(head, [0.04 * s, 0.22, -0.105], [0.04 * s, 0.22, -0.125], 0.022, 0.022, lam(0x223a4a), 10); }
  }

  // ---------------- Braços em 1ª pessoa ----------------
  Mo.viewmodel = (def, team, agentId) => {
    const A = Ag.byId[agentId] || Ag.forTeam(team)[0];
    const g = new THREE.Group();
    const gun = Mo.gun(def);
    g.add(gun);
    const sleeve = lam(A.shirt, A.camo ? camo(A.camo) : null), glove = lam(A.gloves), cuff = lam(0x1a1a18);
    const isNade = def.cat === 'grenade' || def.cat === 'c4';
    // mão direita no punho da arma
    const hand = (parent, x, y, z, side, toBack) => {
      const h = new THREE.Group(); h.position.set(x, y, z); parent.add(h);
      ell(h, 0.042, 0.9, 1.15, 1.25, 0, 0, 0.01, glove, 14);                                // palma/punho fechado
      for (let f = 0; f < 4; f++) limb(h, [-0.022 * side, 0.03 - f * 0.02, -0.03], [0.012 * side, 0.03 - f * 0.02, -0.045], 0.0115, 0.0105, glove, 8);   // dedos
      limb(h, [0.03 * side, 0.02, 0.0], [0.028 * side, 0.045, -0.04], 0.013, 0.011, glove, 8);  // polegar
      torus(h, 0.04, 0.012, 0, -0.005, 0.05, cuff, 1, 1);                                  // punho da luva
      limb(h, [0, -0.01, 0.06], toBack, 0.044, 0.056, sleeve, 14);                          // antebraço com manga
      torus(h, 0.05, 0.01, toBack[0] * 0.25, -0.01 + (toBack[1] + 0.01) * 0.25, 0.06 + (toBack[2] - 0.06) * 0.25, sleeve, 1, 1);
      merge(h);
      return h;
    };
    hand(gun, 0.0, -0.05, 0.04, 1, [0.06, -0.16, 0.5]);
    const lh = gun.userData.lh;
    if (!isNade && def.cat !== 'knife' && def.cat !== 'pistol' && def.cat !== 'equip') {
      hand(gun, -0.012, lh ? lh[1] - 0.025 : -0.02, lh ? -lh[0] : -0.26, -1, [-0.16, -0.2, 0.32]);
    } else if (def.cat === 'pistol' && def.shape !== 'dual') {
      hand(gun, -0.035, -0.06, 0.015, -1, [-0.18, -0.12, 0.45]);
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    g.scale.setScalar(def.cat === 'knife' ? 0.62 : 0.5);
    gun.rotation.y = 0.05;
    if (def.cat === 'knife') { const tl = gun.userData.vmTilt; gun.rotation.set(tl === undefined ? 0.42 : tl, 0.3, -0.1); }      // lâmina inclinada para cima e para o centro
    const base = def.cat === 'pistol' ? [0.085, -0.09, -0.22] : def.cat === 'knife' ? [0.07, -0.05, -0.27] : isNade ? [0.1, -0.1, -0.2] : [0.085, -0.085, -0.19];
    g.userData.base = new THREE.Vector3(...base);
    g.userData.gun = gun;
    g.userData.muzzle = gun.userData.muzzle;
    return g;
  };

  // retrato (para o menu)
  let pr = null;
  Ag.portrait = (id, w, h, full) => {
    if (!pr) {
      pr = { r: new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }), sc: new THREE.Scene(), cam: new THREE.PerspectiveCamera(26, 1, 0.1, 20) };
      pr.sc.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.95));
      const dl = new THREE.DirectionalLight(0xfff0dd, 0.8); dl.position.set(1.5, 3, -2.5); pr.sc.add(dl);
    }
    pr.r.setSize(w, h); pr.cam.aspect = w / h; pr.cam.updateProjectionMatrix();
    const A = Ag.byId[id];
    const sol = Mo.soldier(A.team, id);
    Mo.setSoldierGun(sol, G.W[A.team === 'T' ? 'kalash' : 'carabina']);
    sol.root.rotation.y = 0.4;
    pr.sc.add(sol.root);
    if (full) { pr.cam.fov = 30; pr.cam.updateProjectionMatrix(); pr.cam.position.set(0, 1.0, -4.3); pr.cam.lookAt(0, 0.95, 0); }
    else { pr.cam.fov = 26; pr.cam.updateProjectionMatrix(); pr.cam.position.set(0, 1.45, -3.1); pr.cam.lookAt(0, 1.25, 0); }
    pr.r.render(pr.sc, pr.cam);
    const url = pr.r.domElement.toDataURL();
    pr.sc.remove(sol.root);
    return url;
  };
})();
