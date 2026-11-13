// Inventário: acabamentos (skins) de armas e estilos de faca.
// O que o jogador equipa no Arsenal vale só para as armas DELE (1ª pessoa, modelo em 3ª pessoa e prévia do menu).
// O painel Invicto continua podendo sobrescrever (cheats.js usa G.Skins.mat).
(function () {
  const S = G.Skins = {};
  const U = G.U;
  const LS = 'et_loadout';
  S.data = { skins: {}, knife: 'combate' };
  try { Object.assign(S.data, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) { }
  S.save = () => { try { localStorage.setItem(LS, JSON.stringify(S.data)); } catch (e) { } };
  S.local = false;                                   // ligado enquanto o jogo monta um modelo do jogador local

  // ---------------- Acabamentos ----------------
  // [id, nome, raridade 0..4]
  S.RARITY = [['Comum', '#b0c3d9'], ['Incomum', '#5e98d9'], ['Rara', '#4b69ff'], ['Épica', '#d32ce6'], ['Lendária', '#eb4b4b']];
  S.FINISHES = [
    ['', 'Padrão', 0], ['militar', 'Verde militar', 0], ['areia', 'Cerâmica areia', 0], ['deserto', 'Camuflagem deserto', 0], ['digital', 'Camuflagem digital', 0], ['urbano', 'Camuflagem urbana', 0],
    ['floresta', 'Camuflagem floresta', 1], ['neve', 'Camuflagem de neve', 1], ['carbono', 'Fibra de carbono', 1], ['madeira', 'Madeira nobre', 1], ['ferrugem', 'Ferrugem', 1], ['xadrez', 'Xadrez', 1], ['listras', 'Listras de corrida', 1],
    ['cromo', 'Cromo', 2], ['azulado', 'Aço azulado', 2], ['cobre', 'Cobre envelhecido', 2], ['bronze', 'Bronze', 2], ['oceano', 'Oceano', 2], ['tigre', 'Tigre', 2], ['oncinha', 'Onça-pintada', 2], ['cobra', 'Pele de serpente', 2], ['rosa', 'Chiclete', 2], ['marmore', 'Mármore', 2],
    ['damasco', 'Aço damasco', 3], ['circuito', 'Circuito', 3], ['grafite', 'Grafite', 3], ['sangue', 'Sangue', 3], ['gelo', 'Gelo rachado', 3], ['chamas', 'Chamas', 3], ['neon', 'Neon', 3], ['vulcao', 'Lava', 3], ['obsidiana', 'Obsidiana', 3],
    ['ouro', 'Ouro', 4], ['aurora', 'Aurora', 4], ['galaxia', 'Galáxia', 4], ['esmeralda', 'Esmeralda', 4], ['rubi', 'Rubi', 4], ['safira', 'Safira', 4], ['holografico', 'Holográfico', 4], ['arcoiris', 'Arco-íris', 4]
  ];
  S.byId = {}; for (const f of S.FINISHES) S.byId[f[0]] = f;
  const canv = {}, mats = {};
  // desenha a textura 128×128 do acabamento (também usada nas miniaturas do Arsenal)
  function draw(id) {
    if (canv[id]) return canv[id];
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); const r = U.mulberry(id.length * 31 + id.charCodeAt(0) * 7 + 3);
    const P = { shin: 30, spec: 0x333333, emis: 0x000000, rep: 7 };
    const grad = (stops, x1, y1) => { const g = x.createLinearGradient(0, 0, x1 === undefined ? 128 : x1, y1 === undefined ? 128 : y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); x.fillStyle = g; x.fillRect(0, 0, 128, 128); };
    const fill = c => { x.fillStyle = c; x.fillRect(0, 0, 128, 128); };
    const blobs = (cols, n, a, b) => { for (const c of cols) for (let i = 0; i < n; i++) { x.fillStyle = c; x.beginPath(); x.ellipse(r() * 128, r() * 128, a + r() * b, a * 0.7 + r() * b * 0.6, r() * 3, 0, 7); x.fill(); } };
    const facets = (base, hi) => { fill(base); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${hi},${0.05 + r() * 0.25})`; x.beginPath(); const px = r() * 128, py = r() * 128; x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 60, py + (r() - 0.5) * 60); x.lineTo(px + (r() - 0.5) * 60, py + (r() - 0.5) * 60); x.fill(); } };
    switch (id) {
      case 'ouro': grad(['#ffe48a', '#a8740e']); for (let i = 0; i < 20; i++) { x.fillStyle = `rgba(255,255,220,${r() * 0.3})`; x.fillRect(0, r() * 128, 128, 2); } P.shin = 110; P.spec = 0xffe6a0; break;
      case 'cromo': grad(['#f2f4f7', '#6c7078']); P.shin = 140; P.spec = 0xffffff; break;
      case 'carbono': for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { x.fillStyle = (i + j) % 2 ? '#2a2a2e' : '#151517'; x.fillRect(i * 8, j * 8, 8, 8); x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(i * 8, j * 8, 8, 2); } P.shin = 80; P.spec = 0x666666; break;
      case 'deserto': fill('#c9ae7c'); blobs(['#9c7f52', '#7a5e3a', '#e2cfa2'], 14, 6, 16); break;
      case 'digital': fill('#4c5a46'); for (let i = 0; i < 220; i++) { x.fillStyle = ['#2f382c', '#6f7a5e', '#8a8f6a', '#1e231c'][(r() * 4) | 0]; x.fillRect(Math.floor(r() * 16) * 8, Math.floor(r() * 16) * 8, 8, 8); } break;
      case 'urbano': fill('#8a8c90'); for (let i = 0; i < 200; i++) { x.fillStyle = ['#3a3c40', '#c8cacc', '#5a5c60', '#a0a2a6'][(r() * 4) | 0]; x.fillRect(Math.floor(r() * 16) * 8, Math.floor(r() * 16) * 8, 8 + ((r() * 2) | 0) * 8, 8); } break;
      case 'floresta': fill('#55623a'); blobs(['#2e3a20', '#7a7a48', '#3c2c1c', '#8a9a5a'], 12, 6, 14); break;
      case 'neve': fill('#e8ecf0'); blobs(['#9aa4ae', '#c8d0d8', '#6a747e'], 10, 4, 12); break;
      case 'militar': fill('#4e5434'); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.12})`; x.fillRect(r() * 128, r() * 128, 2, 2); } P.shin = 15; break;
      case 'areia': fill('#c8b48a'); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.1})`; x.fillRect(r() * 128, r() * 128, 2, 2); } P.shin = 15; break;
      case 'madeira': fill('#8a5a30'); for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(40,20,8,${0.2 + r() * 0.4})`; x.lineWidth = 1 + r() * 2; x.beginPath(); const y = r() * 128; x.moveTo(0, y); for (let k = 0; k <= 128; k += 8) x.lineTo(k, y + Math.sin(k * 0.05 + i) * 5); x.stroke(); } P.shin = 40; break;
      case 'ferrugem': fill('#6a4028'); blobs(['#8a4a1a', '#3a2418', '#a8642a', '#5a5048'], 18, 3, 10); P.shin = 5; break;
      case 'xadrez': for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#f0f0f0' : '#141414'; x.fillRect(i * 16, j * 16, 16, 16); } P.shin = 60; break;
      case 'listras': fill('#e8e8e8'); x.fillStyle = '#c82020'; x.fillRect(40, 0, 18, 128); x.fillRect(70, 0, 18, 128); x.fillStyle = '#1a1a1a'; x.fillRect(62, 0, 4, 128); P.shin = 90; P.spec = 0x888888; P.rep = 3; break;
      case 'azulado': grad(['#1a2a4a', '#3a5a8a', '#141e30']); P.shin = 120; P.spec = 0x8ab0ff; break;
      case 'cobre': grad(['#b06a3a', '#7a4024']); blobs(['rgba(60,160,130,0.5)'], 14, 3, 9); P.shin = 70; P.spec = 0xffb080; break;
      case 'bronze': grad(['#c89a50', '#6a4a20']); P.shin = 90; P.spec = 0xffd090; break;
      case 'neon': fill('#07070c'); x.lineWidth = 3; for (let i = 0; i < 9; i++) { x.strokeStyle = i % 2 ? '#00f0ff' : '#ff2bd6'; x.beginPath(); x.moveTo(0, i * 16); x.lineTo(128, i * 16 + 30); x.stroke(); } P.emis = 0x0a1522; P.shin = 90; P.spec = 0x88ffff; break;
      case 'sangue': fill('#5a0606'); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${r() * 40},0,0,0.8)`; x.beginPath(); x.arc(r() * 128, r() * 128, 2 + r() * 10, 0, 7); x.fill(); } P.shin = 60; break;
      case 'oceano': grad(['#0b3b6f', '#1aa0c8']); x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2; for (let i = 0; i < 10; i++) { x.beginPath(); for (let k = 0; k <= 128; k += 8) x.lineTo(k, i * 14 + Math.sin(k * 0.1 + i) * 4); x.stroke(); } P.shin = 70; break;
      case 'tigre': fill('#e8892a'); x.fillStyle = '#1a1208'; for (let i = 0; i < 12; i++) { x.beginPath(); const y = i * 11 + r() * 4; x.moveTo(0, y); x.quadraticCurveTo(64, y + (r() - 0.5) * 20, 128, y + 3); x.lineTo(128, y + 6); x.quadraticCurveTo(64, y + 4, 0, y + 4); x.fill(); } break;
      case 'oncinha': fill('#d8a85a'); for (let i = 0; i < 26; i++) { const px = r() * 128, py = r() * 128, s = 4 + r() * 5; x.fillStyle = '#2a1a0a'; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(px + Math.cos(k * 1.3) * s, py + Math.sin(k * 1.3) * s, 2 + r() * 2, 0, 7); x.fill(); } x.fillStyle = '#b07a3a'; x.beginPath(); x.arc(px, py, s * 0.6, 0, 7); x.fill(); } break;
      case 'cobra': fill('#3a5a2a'); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { x.fillStyle = (i * 3 + j * 5) % 7 < 2 ? '#c8b040' : '#2a4020'; x.beginPath(); x.ellipse(i * 8 + (j % 2) * 4, j * 8, 4.5, 3.5, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(0,0,0,0.4)'; x.stroke(); } P.shin = 60; break;
      case 'rosa': fill('#ff7fbf'); x.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) { x.beginPath(); x.arc(r() * 128, r() * 128, 2 + r() * 3, 0, 7); x.fill(); } P.shin = 70; break;
      case 'marmore': fill('#ece8e2'); for (let i = 0; i < 14; i++) { x.strokeStyle = `rgba(90,90,100,${0.2 + r() * 0.4})`; x.lineWidth = 0.6 + r() * 1.6; x.beginPath(); let px = r() * 128, py = 0; x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (r() - 0.5) * 40; py += 18; x.lineTo(px, py); } x.stroke(); } P.shin = 100; P.spec = 0xaaaaaa; P.rep = 4; break;
      case 'damasco': fill('#8a8c90'); for (let i = 0; i < 40; i++) { x.strokeStyle = i % 2 ? 'rgba(40,40,46,0.6)' : 'rgba(220,222,226,0.5)'; x.lineWidth = 1.5; x.beginPath(); for (let k = 0; k <= 128; k += 4) x.lineTo(k, i * 3.4 + Math.sin(k * 0.08 + i * 0.4) * 6 + Math.sin(k * 0.21) * 2); x.stroke(); } P.shin = 110; P.spec = 0xcccccc; P.rep = 4; break;
      case 'circuito': fill('#0a3a1a'); x.strokeStyle = '#3ae07a'; x.lineWidth = 1.5; for (let i = 0; i < 30; i++) { x.beginPath(); let px = Math.floor(r() * 16) * 8, py = Math.floor(r() * 16) * 8; x.moveTo(px, py); for (let k = 0; k < 4; k++) { if (r() < 0.5) px += (r() < 0.5 ? -1 : 1) * 16; else py += (r() < 0.5 ? -1 : 1) * 16; x.lineTo(px, py); } x.stroke(); x.fillStyle = '#d8c060'; x.fillRect(px - 2, py - 2, 4, 4); } P.emis = 0x02140a; P.shin = 70; break;
      case 'grafite': fill('#1e1e22'); blobs(['#ff3a8a', '#3ad0ff', '#ffd23a', '#7aff5a', '#ffffff'], 6, 6, 16); x.strokeStyle = '#000'; x.lineWidth = 3; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(r() * 128, r() * 128, 8 + r() * 14, 0, 4); x.stroke(); } P.shin = 40; break;
      case 'gelo': grad(['#d8f0ff', '#7ab8e0']); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1; for (let i = 0; i < 18; i++) { x.beginPath(); let px = r() * 128, py = r() * 128; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (r() - 0.5) * 30; py += (r() - 0.5) * 30; x.lineTo(px, py); } x.stroke(); } P.shin = 120; P.spec = 0xffffff; break;
      case 'chamas': fill('#141414'); for (let i = 0; i < 12; i++) { const px = r() * 128; const g = x.createLinearGradient(0, 128, 0, 30); g.addColorStop(0, '#ff3a00'); g.addColorStop(0.6, '#ffb000'); g.addColorStop(1, 'rgba(255,240,120,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(px - 12, 128); x.quadraticCurveTo(px - 18, 70, px + (r() - 0.5) * 20, 20 + r() * 40); x.quadraticCurveTo(px + 16, 80, px + 12, 128); x.fill(); } P.emis = 0x1a0600; P.rep = 3; break;
      case 'vulcao': fill('#1a0d08'); x.strokeStyle = '#ff5a10'; x.lineWidth = 2.5; for (let i = 0; i < 16; i++) { x.beginPath(); let px = r() * 128, py = r() * 128; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 40; py += (r() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); } P.emis = 0x200800; break;
      case 'obsidiana': grad(['#0a0a0e', '#1e1a26', '#08080a']); for (let i = 0; i < 10; i++) { x.strokeStyle = 'rgba(160,120,255,0.15)'; x.beginPath(); x.moveTo(r() * 128, 0); x.lineTo(r() * 128, 128); x.stroke(); } P.shin = 150; P.spec = 0x9a8aff; break;
      case 'aurora': grad(['#ff4fa8', '#8a4aff', '#3ad0ff', '#ffe04a'], 128, 0); P.shin = 120; P.spec = 0xffffff; P.rep = 1; break;
      case 'galaxia': grad(['#0a0420', '#2a0a5a', '#0a2a5a']); for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; x.fillRect(r() * 128, r() * 128, r() < 0.1 ? 2 : 1, r() < 0.1 ? 2 : 1); } blobs(['rgba(255,80,200,0.15)', 'rgba(80,200,255,0.12)'], 4, 14, 26); P.emis = 0x08041a; P.shin = 90; P.rep = 3; break;
      case 'esmeralda': facets('#0a6a3a', '180,255,210'); P.shin = 150; P.spec = 0xb0ffd0; P.emis = 0x02140a; break;
      case 'rubi': facets('#8a0a1a', '255,180,190'); P.shin = 150; P.spec = 0xffc0c8; P.emis = 0x180206; break;
      case 'safira': facets('#0a2a8a', '180,200,255'); P.shin = 150; P.spec = 0xc0d0ff; P.emis = 0x02061a; break;
      case 'holografico': for (let i = 0; i < 128; i++) { x.fillStyle = `hsl(${(i * 5) % 360},80%,70%)`; x.fillRect(i, 0, 1, 128); } for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, r() * 128, 128, 1); } P.shin = 160; P.spec = 0xffffff; P.emis = 0x101018; P.rep = 2; break;
      case 'arcoiris': for (let i = 0; i < 128; i++) { x.fillStyle = `hsl(${i * 2.8},90%,55%)`; x.fillRect(i, 0, 1, 128); } P.shin = 90; P.spec = 0x888888; break;
      default: fill('#777');
    }
    cv._p = P;
    return (canv[id] = cv);
  }
  const thumbs = {};
  S.thumb = id => thumbs[id] || (thumbs[id] = draw(id || 'cromo').toDataURL());
  S.mat = id => {
    if (mats[id]) return mats[id];
    const cv = draw(id), P = cv._p;
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(P.rep, P.rep);
    return (mats[id] = new THREE.MeshPhongMaterial({ map: tex, shininess: P.shin, specular: P.spec, emissive: P.emis }));
  };
  // aplica o acabamento nas peças "pintáveis" (mantém as pretas, lentes e emissivas)
  S.apply = (g, id) => {
    const mat = S.mat(id);
    g.traverse(o => {
      if (!o.isMesh || !o.material || o.userData.noSkin) return;
      const m = o.material;
      if (m.transparent || (m.emissive && m.emissive.getHex() > 0)) return;
      const c = m.color; if (c && (c.r + c.g + c.b) / 3 < 0.05) return;
      o.material = mat;
    });
  };

  // ---------------- Facas ----------------
  // Convenção dos modelos de arma: origem no punho, lâmina para −Z, perfil (f = frente, y = altura) extrudado na largura (x).
  S.KNIVES = [
    ['combate', 'Faca de Combate', 'Padrão: lâmina reta com serrilha curta.'],
    ['karambit', 'Karambit', 'Lâmina em garra e anel para o dedo. Gira no dedo ao inspecionar.'],
    ['borboleta', 'Faca Borboleta', 'Dois cabos que se abrem e fecham girando.'],
    ['baioneta', 'Baioneta', 'Lâmina longa de ponta de lança com anel de encaixe.'],
    ['baionetaTatica', 'Baioneta Tática', 'Ponta recortada e serra no dorso.'],
    ['bowie', 'Bowie', 'Lâmina larga de ponta recortada e guarda de latão.'],
    ['canivete', 'Canivete Dobrável', 'Abre com um giro da lâmina.'],
    ['caca', 'Faca de Caça', 'Gancho no dorso e cabo com encaixe para os dedos.'],
    ['punhal', 'Punhal de Soco', 'Cabo em T, a lâmina sai entre os dedos.'],
    ['tanto', 'Tantō', 'Ponta angular e cabo trançado.'],
    ['kukri', 'Kukri', 'Lâmina curvada para a frente e pomo largo.'],
    ['adaga', 'Adaga', 'Lâmina simétrica de dois fios com guarda em cruz.'],
    ['machadinha', 'Machadinha Tática', 'Cabeça de machado com ponta no verso.'],
    ['facao', 'Facão', 'Lâmina longa e larga para abrir caminho.']
  ];
  S.knifeById = {}; for (const k of S.KNIVES) S.knifeById[k[0]] = k;
  const mc = {};
  const phong = (c, sh, sp) => mc['p' + c + sh] || (mc['p' + c + sh] = new THREE.MeshPhongMaterial({ color: c, shininess: sh, specular: sp || 0x555555 }));
  const BLADE = () => phong(0xc0c4ca, 130, 0xffffff), EDGE = () => phong(0xe8eaee, 160, 0xffffff), DK = () => phong(0x1a1a1a, 10, 0x111111);
  const RUB = () => phong(0x2a2c2e, 12, 0x1a1a1a), BRASS = () => phong(0xc8a050, 100, 0xffe0a0), WOOD = () => phong(0x7a4a26, 30, 0x2a1a10);
  const OLIVE = () => phong(0x4a5034, 18, 0x222222), ORANGE = () => phong(0xd8682a, 30, 0x333333);
  function shp(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]); } return s; }
  function E(g, pts, depth, mat, o) {
    o = o || {};
    const s = pts instanceof THREE.Shape ? pts : shp(pts);
    if (o.holes) for (const h of o.holes) { const p = new THREE.Path(); p.absarc(h[0], h[1], h[2], 0, Math.PI * 2, false); s.holes.push(p); }
    const b = o.bevel === undefined ? Math.min(0.0018, depth * 0.3) : o.bevel;
    const geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0004, depth - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 2, curveSegments: 14 });
    geo.rotateY(Math.PI / 2); geo.translate(-(depth / 2 - b) + (o.x || 0), 0, 0);
    const m = new THREE.Mesh(geo, mat); g.add(m); return m;
  }
  function cylZ(g, r, f0, f1, y, mat) { const geo = new THREE.CylinderGeometry(r, r, Math.abs(f1 - f0), 14); geo.rotateX(-Math.PI / 2); geo.translate(0, y, -(f0 + f1) / 2); const m = new THREE.Mesh(geo, mat); g.add(m); return m; }
  function tor(g, R, t, f, y, mat, axis) { const geo = new THREE.TorusGeometry(R, t, 8, 22); if (axis === 'x') geo.rotateY(Math.PI / 2); geo.translate(0, y, -f); const m = new THREE.Mesh(geo, mat); g.add(m); return m; }
  const grip = (g, f0, f1, h, mat, w) => E(g, [[f0, -h / 2], [f1, -h / 2 - 0.002], [f1, h / 2 + 0.002], [f0, h / 2]], w || 0.024, mat, { bevel: 0.005 });
  const groovedGrip = (g, f0, f1, mat) => { const pts = [[f1, -0.016]]; const n = 4; for (let i = 1; i <= n; i++) { const f = f1 + (f0 - f1) * i / n; pts.push([f + (f0 - f1) / n * 0.5, -0.021]); pts.push([f, -0.016]); } pts.push([f0, 0.017], [f1, 0.017]); E(g, pts, 0.025, mat, { bevel: 0.005 }); };
  const sharp = s => s.map(p => p);    // marcador (perfis já com fio)

  const KB = {
    karambit(k, A) {
      const bl = E(k, [[0.0, 0.014], [0.05, 0.016, 0.1, -0.005], [0.12, -0.03, 0.105, -0.075], [0.085, -0.03, 0.035, -0.014], [0.0, -0.012]], 0.005, BLADE());
      E(k, [[0.002, 0.007], [0.05, 0.009, 0.09, -0.004], [0.1, -0.02, 0.098, -0.05], [0.085, -0.02, 0.05, -0.002], [0.002, 0.001]], 0.0058, EDGE(), { bevel: 0 }).userData.noSkin = false;
      E(k, [[0.0, -0.015], [-0.09, -0.02, -0.105, 0.01], [-0.06, 0.02], [0.0, 0.018]], 0.024, RUB(), { bevel: 0.005 });
      const ring = tor(k, 0.022, 0.006, 0.122, 0.0, DK(), 'x');
      A.spin = { obj: k, pivot: [0, 0, 0.122] };
    },
    borboleta(k, A) {
      E(k, [[0.0, -0.01], [0.13, -0.01], [0.175, 0.008], [0.12, 0.012, 0.0, 0.012]], 0.004, BLADE());
      E(k, [[0.06, 0.0], [0.13, 0.0], [0.13, 0.004], [0.06, 0.004]], 0.0046, EDGE(), { bevel: 0 });
      const mkHandle = (side) => {
        const pv = new THREE.Group(); k.add(pv);
        const h = E(pv, [[0.0, -0.011], [-0.12, -0.011], [-0.125, 0.0], [-0.12, 0.011], [0.0, 0.011]], 0.009, phong(0x8a8e94, 90, 0xcccccc), { holes: [[-0.03, 0, 0.004], [-0.055, 0, 0.004], [-0.08, 0, 0.004], [-0.105, 0, 0.004]], x: side * 0.0068 });
        return pv;
      };
      A.flip = [mkHandle(1), mkHandle(-1)];
      cylZ(k, 0.004, -0.003, 0.003, 0, DK()).rotation.y = Math.PI / 2;
    },
    baioneta(k) {
      E(k, [[0.0, -0.014], [0.2, -0.012], [0.235, 0.002], [0.2, 0.015], [0.0, 0.016]], 0.0055, BLADE());
      E(k, [[0.03, 0.0], [0.18, 0.0], [0.18, 0.004], [0.03, 0.004]], 0.0062, phong(0x8a8e94, 60), { bevel: 0 });
      E(k, [[-0.006, -0.03], [0.008, -0.03], [0.008, 0.032], [-0.006, 0.032]], 0.028, DK(), { bevel: 0.003 });
      tor(k, 0.009, 0.003, 0.0, 0.04, DK(), 'z');
      groovedGrip(k, -0.006, -0.12, RUB()); cylZ(k, 0.014, -0.13, -0.118, 0, phong(0x5a5e64, 60));
    },
    baionetaTatica(k) {
      const teeth = []; for (let i = 0; i < 7; i++) { teeth.push([0.03 + i * 0.016, 0.017]); teeth.push([0.038 + i * 0.016, 0.022]); }
      E(k, [[0.0, -0.015], [0.15, -0.015], [0.2, -0.004, 0.225, 0.006], [0.17, 0.008], [0.145, 0.017], ...teeth.reverse(), [0.0, 0.017]], 0.0055, BLADE());
      E(k, [[-0.006, -0.03], [0.008, -0.034], [0.008, 0.028], [-0.006, 0.028]], 0.03, DK(), { bevel: 0.004 });
      tor(k, 0.011, 0.003, -0.003, -0.042, DK(), 'z');
      E(k, [[-0.006, -0.017], [-0.11, -0.019, -0.12, 0.0], [-0.11, 0.018, -0.006, 0.017]], 0.026, OLIVE(), { bevel: 0.006 });
    },
    bowie(k) {
      E(k, [[0.0, -0.02], [0.18, -0.02], [0.245, -0.004, 0.25, 0.012], [0.2, 0.002], [0.17, 0.018], [0.0, 0.02]], 0.006, BLADE());
      E(k, [[0.02, 0.012], [0.16, 0.012], [0.16, 0.016], [0.02, 0.016]], 0.0066, phong(0x8a8e94, 60), { bevel: 0 });
      E(k, [[-0.008, -0.034], [0.006, -0.034], [0.006, 0.034], [-0.008, 0.034]], 0.03, BRASS(), { bevel: 0.004 });
      E(k, [[-0.008, -0.018], [-0.11, -0.022, -0.125, 0.0], [-0.11, 0.022, -0.008, 0.019]], 0.028, WOOD(), { bevel: 0.007 });
      E(k, [[-0.118, -0.02], [-0.134, -0.02], [-0.134, 0.02], [-0.118, 0.02]], 0.03, BRASS(), { bevel: 0.004 });
    },
    canivete(k, A) {
      const bp = new THREE.Group(); k.add(bp);
      E(bp, [[0.0, -0.012], [0.11, -0.012], [0.14, 0.004], [0.12, 0.012], [0.0, 0.013]], 0.0045, BLADE());
      E(bp, [[0.0, 0.004], [0.11, 0.004], [0.11, 0.008], [0.0, 0.008]], 0.005, EDGE(), { bevel: 0 });
      E(k, [[0.006, -0.013], [-0.11, -0.016, -0.12, 0.0], [-0.11, 0.015, 0.006, 0.014]], 0.02, phong(0x2a3a5a, 40), { bevel: 0.005 });
      cylZ(k, 0.006, -0.004, 0.004, 0.0, phong(0xc8c8c8, 90)).rotation.y = Math.PI / 2;
      A.fold = bp;
    },
    caca(k) {
      E(k, [[0.0, -0.016], [0.15, -0.016], [0.205, 0.0, 0.21, 0.014], [0.18, 0.012], [0.172, 0.006, 0.165, 0.016], [0.0, 0.018]], 0.006, BLADE());
      E(k, [[-0.006, -0.026], [0.006, -0.026], [0.006, 0.026], [-0.006, 0.026]], 0.026, DK(), { bevel: 0.003 });
      groovedGrip(k, -0.006, -0.115, ORANGE());
    },
    punhal(k) {
      // segurado com a lâmina saindo entre os dedos: cabo atravessado (eixo x)
      E(k, [[0.0, -0.014], [0.075, -0.004], [0.1, 0.0], [0.075, 0.004], [0.0, 0.014]], 0.006, BLADE());
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.085, 12), RUB()); h.rotation.z = Math.PI / 2; h.position.set(0, 0, 0.012); k.add(h);
      for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), RUB()); c.position.set(sx * 0.043, 0, 0.012); k.add(c); }
    },
    tanto(k) {
      E(k, [[0.0, -0.014], [0.17, -0.014], [0.2, 0.005], [0.195, 0.015], [0.0, 0.015]], 0.006, BLADE());
      E(k, [[0.0, 0.002], [0.168, 0.002], [0.17, 0.005], [0.0, 0.005]], 0.0065, phong(0x8a8e94, 60), { bevel: 0 });
      E(k, [[-0.004, -0.024], [0.006, -0.024], [0.006, 0.024], [-0.004, 0.024]], 0.036, phong(0x3a3a3a, 50), { bevel: 0.004 });
      grip(k, -0.004, -0.12, 0.03, phong(0x14141a, 20), 0.026);
      for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.006), phong(0x8a2020, 30)); d.position.set(0, (i % 2 ? 1 : -1) * 0.004, 0.012 + i * 0.018); d.rotation.x = i % 2 ? 0.6 : -0.6; k.add(d); }
    },
    kukri(k) {
      E(k, [[0.0, -0.012], [0.07, -0.02, 0.15, -0.05], [0.2, -0.065, 0.21, -0.04], [0.19, -0.015, 0.12, 0.004], [0.06, 0.016, 0.0, 0.016], [0.004, 0.0], [0.0, -0.004]], 0.007, BLADE());
      E(k, [[-0.004, -0.02], [0.006, -0.02], [0.006, 0.022], [-0.004, 0.022]], 0.03, BRASS(), { bevel: 0.003 });
      E(k, [[-0.004, -0.015], [-0.08, -0.016], [-0.11, -0.03], [-0.125, -0.02], [-0.118, 0.02], [-0.08, 0.016], [-0.004, 0.016]], 0.028, WOOD(), { bevel: 0.006 });
    },
    adaga(k) {
      E(k, [[0.0, -0.016], [0.17, -0.005], [0.205, 0.0], [0.17, 0.005], [0.0, 0.016]], 0.0055, BLADE());
      E(k, [[0.0, -0.002], [0.17, -0.001], [0.17, 0.001], [0.0, 0.002]], 0.008, phong(0x9a9ea4, 120), { bevel: 0 });
      E(k, [[-0.007, -0.045], [0.006, -0.045], [0.006, 0.045], [-0.007, 0.045]], 0.016, BRASS(), { bevel: 0.004 });
      grip(k, -0.007, -0.1, 0.028, phong(0x3a1a12, 25));
      const pm = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), BRASS()); pm.position.set(0, 0, 0.11); k.add(pm);
    },
    machadinha(k) {
      E(k, [[-0.11, -0.014], [0.12, -0.012], [0.12, 0.014], [-0.11, 0.016]], 0.024, OLIVE(), { bevel: 0.006 });
      E(k, [[0.1, 0.012], [0.13, 0.012], [0.155, 0.07, 0.115, 0.085], [0.1, 0.06], [0.095, 0.03]], 0.008, BLADE());
      E(k, [[0.105, -0.012], [0.125, -0.012], [0.14, -0.05], [0.112, -0.03]], 0.009, BLADE());
      E(k, [[0.09, -0.016], [0.14, -0.016], [0.14, 0.018], [0.09, 0.018]], 0.03, DK(), { bevel: 0.004 });
    },
    facao(k) {
      E(k, [[0.0, -0.022], [0.24, -0.026], [0.285, -0.01, 0.28, 0.012], [0.0, 0.018]], 0.005, BLADE());
      E(k, [[-0.004, -0.024], [0.006, -0.024], [0.006, 0.022], [-0.004, 0.022]], 0.024, DK(), { bevel: 0.003 });
      grip(k, -0.004, -0.12, 0.032, RUB(), 0.026);
    }
  };
  // monta o modelo da faca no estilo pedido (mesma origem/escala do modelo padrão)
  S.knifeModel = (style) => {
    const g = new THREE.Group();
    const muzzle = new THREE.Object3D(); g.add(muzzle); g.userData.muzzle = muzzle;
    const k = new THREE.Group(); k.position.set(0, -0.045, -0.02); g.add(k);
    const A = {};
    (KB[style] || KB.baioneta)(k, A);
    // animação de inspecionar/sacar específica do estilo
    g.userData.anim = (st) => {
      const insp = st.inspect, d = st.draw;
      if (A.flip) {
        // borboleta: cabos giram abrindo/fechando ao sacar e inspecionar
        const open = insp >= 0 ? 0.5 - 0.5 * Math.cos(insp * Math.PI * 6) : Math.min(1, d * 1.6);
        A.flip[0].rotation.y = open * Math.PI; A.flip[1].rotation.y = -open * Math.PI;
      }
      if (A.fold) A.fold.rotation.x = d > 0 ? -d * 2.6 : insp >= 0 ? Math.sin(insp * Math.PI * 2) * 0.4 : 0;
      if (A.spin) { const a = insp >= 0 ? insp * Math.PI * 4 : 0; k.rotation.x = a; }
    };
    muzzle.position.set(0, -0.045, -0.2);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  };

  // ---------------- integração com o desenho das armas ----------------
  const baseGun = G.Models.gun;
  G.Models.gun = (def) => {
    const local = S.local;
    const style = local && def.id === 'knife' ? (S.data.knife || 'combate') : 'combate';
    const g = style !== 'combate' ? S.knifeModel(style) : baseGun(def);
    const sk = local ? S.data.skins[def.id] : null;
    if (sk) S.apply(g, sk);
    return g;
  };
  S.equip = (wid, fin) => { if (fin) S.data.skins[wid] = fin; else delete S.data.skins[wid]; S.save(); };
  S.setKnife = (style) => { S.data.knife = style; S.save(); };
  // chave de cache dos modelos do jogador local
  S.localKey = (id) => (id === 'knife' ? '@' + (S.data.knife || 'combate') : '') + (S.data.skins[id] ? '#' + S.data.skins[id] : '');
})();
