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
  // Convenção dos modelos: origem no punho, lâmina para −Z. Perfis são desenhados em (f = frente, y = altura) e extrudados na espessura (x).
  S.KNIVES = [
    ['combate', 'Faca de Combate', 'Lâmina de ponta recortada com canal, cabo de couro empilhado e guarda em cruz.'],
    ['karambit', 'Karambit', 'Lâmina em garra com fio no lado de dentro e anel para o dedo. Gira no dedo ao inspecionar.'],
    ['borboleta', 'Faca Borboleta', 'Balisong: dois cabos vazados que giram em volta da lâmina. Abre ao sacar.'],
    ['baioneta', 'Baioneta', 'Lâmina longa com canal, anel de boca de cano na guarda e cabo ranhurado.'],
    ['baionetaTatica', 'Baioneta Tática', 'Lâmina grossa escura com serra no dorso e cabo de polímero.'],
    ['bowie', 'Bowie', 'Lâmina larga de ponta recortada côncava, guarda e fundo de latão.'],
    ['canivete', 'Canivete Dobrável', 'Lâmina de ponta caída com trava, presilha de bolso. Abre com um giro.'],
    ['caca', 'Faca de Caça', 'Lâmina curva de ponta caída, guarda curta e cabo de madeira.'],
    ['punhal', 'Punhal de Soco', 'Cabo em T entre os dedos e lâmina triangular curta.'],
    ['tanto', 'Tantō', 'Ponta angular, linha de têmpera e cabo trançado com tsuba.'],
    ['kukri', 'Kukri', 'Lâmina curvada para a frente, entalhe junto ao cabo e pomo largo.'],
    ['adaga', 'Adaga', 'Lâmina simétrica de dois fios com nervura central e guarda curva.'],
    ['machadinha', 'Machadinha Tática', 'Cabeça de machado com fio embaixo e ponta no verso.'],
    ['facao', 'Facão', 'Lâmina longa e larga de ponta recortada.']
  ];
  S.knifeById = {}; for (const k of S.KNIVES) S.knifeById[k[0]] = k;

  const mc = {};
  const phong = (c, sh, sp) => mc['p' + c + sh] || (mc['p' + c + sh] = new THREE.MeshPhongMaterial({ color: c, shininess: sh, specular: sp === undefined ? 0x555555 : sp }));
  const BLADE = () => phong(0xb4b8be, 150, 0xffffff), EDGE = () => phong(0xf2f4f8, 230, 0xffffff), GROOVE = () => phong(0x767c84, 90, 0x888888);
  const DKB = () => phong(0x2b2d31, 70, 0x777777), DKE = () => phong(0xd8dce2, 220, 0xffffff);
  const RUB = () => phong(0x1e1f21, 12, 0x161616), GRAY = () => phong(0x4a4d52, 40, 0x666666), STEELD = () => phong(0x6a6e75, 90, 0xbbbbbb);
  const BRASS = () => phong(0xc9a24f, 110, 0xffe0a0), WOOD = () => phong(0x6e4222, 35, 0x2a1a10), WOOD2 = () => phong(0x8a5a30, 35, 0x2a1a10);
  const LEATH = () => phong(0x5a3418, 18, 0x1a1410), LEATH2 = () => phong(0x3e2410, 18, 0x120c08);
  const OLIVE = () => phong(0x4b5236, 20, 0x222222), ORANGE = () => phong(0xd8662a, 30, 0x333333), BONE = () => phong(0xe4dcc8, 40, 0x555555);
  const RED = () => phong(0x8a1a1a, 25, 0x333333), BLUE = () => phong(0x2a3d62, 45, 0x555555), BLACK = () => phong(0x111114, 25, 0x222222);

  // ---- geometria 2D ----
  const bz = (a, c, b, n) => { const o = []; for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; };
  const cb = (a, c1, c2, b, n) => { const o = []; for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]); } return o; };
  const rect = (f0, f1, y0, y1) => [[f0, y0], [f1, y0], [f1, y1], [f0, y1]];
  function rrect(f0, f1, y0, y1, r) { const p = []; const arc = (cx, cy, a0) => { for (let i = 0; i <= 4; i++) { const a = a0 + i * Math.PI / 8; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }; arc(f1 - r, y1 - r, 0); arc(f0 + r, y1 - r, Math.PI / 2); arc(f0 + r, y0 + r, Math.PI); arc(f1 - r, y0 + r, Math.PI * 1.5); return p; }
  function shapeOf(pts, holes) {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath();
    if (holes) for (const h of holes) { const p = new THREE.Path(); p.absarc(h[0], h[1], h[2], 0, Math.PI * 2, true); s.holes.push(p); }
    return s;
  }
  // extruda um perfil na espessura "depth" (centrado em x); keep = peça que o acabamento da skin NÃO pinta
  function ext(g, pts, depth, mat, o) {
    o = o || {};
    const sh = pts instanceof THREE.Shape ? pts : shapeOf(pts, o.holes);
    const b = o.bevel === undefined ? Math.min(0.0016, depth * 0.28) : o.bevel;
    const geo = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.0004, depth - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 2, curveSegments: 12 });
    geo.rotateY(Math.PI / 2); geo.translate(-(depth / 2 - b) + (o.x || 0), 0, 0);
    const m = new THREE.Mesh(geo, mat); if (o.keep) m.userData.noSkin = true; g.add(m); return m;
  }
  function ringShape(cf, cy, R, r) { const s = new THREE.Shape(); s.absarc(cf, cy, R, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(cf, cy, r, 0, Math.PI * 2, true); s.holes.push(h); return s; }
  // cilindro com eixo ao longo do cano (z) ou na largura (x)
  function discZ(g, r, f0, f1, y, mat, keep, seg) { const geo = new THREE.CylinderGeometry(r, r, Math.abs(f1 - f0), seg || 16); geo.rotateX(Math.PI / 2); geo.translate(0, y, -(f0 + f1) / 2); const m = new THREE.Mesh(geo, mat); if (keep) m.userData.noSkin = true; g.add(m); return m; }
  function pinX(g, f, y, r, len, mat, x) { const geo = new THREE.CylinderGeometry(r, r, len, 10); geo.rotateZ(Math.PI / 2); geo.translate(x || 0, y, -f); const m = new THREE.Mesh(geo, mat || STEELD()); m.userData.noSkin = true; g.add(m); return m; }
  // faixa de fio (bisel polido) acompanhando uma polilinha, recuada para dentro da lâmina
  function strip(g, edge, w, depth, mat, ref) {
    const n = edge.length, off = [];
    for (let i = 0; i < n; i++) {
      const a = edge[Math.max(0, i - 1)], b = edge[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
      let nx = -ty, ny = tx; if (nx * (ref[0] - edge[i][0]) + ny * (ref[1] - edge[i][1]) < 0) { nx = -nx; ny = -ny; }
      const k = w * Math.min(1, (n - 1 - i) / 5 + 0.04);          // afina até a ponta
      off.push([edge[i][0] + nx * k, edge[i][1] + ny * k]);
    }
    return ext(g, edge.concat(off.reverse()), depth, mat, { bevel: 0.0002 });
  }
  // lâmina: edge = fio (base → ponta), spine = dorso (ponta → base)
  function blade(g, edge, spine, o) {
    o = o || {}; const t = o.t || 0.0055, pts = edge.concat(spine);
    ext(g, pts, t, o.mat || BLADE(), { bevel: Math.min(0.0012, t * 0.3) });
    let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
    strip(g, edge, o.ew || 0.0055, t + 0.0009, o.edgeMat || EDGE(), [cx, cy]);
    if (o.edge2) strip(g, spine.slice().reverse(), o.ew || 0.0055, t + 0.0009, o.edgeMat || EDGE(), [cx, cy]);
    if (o.fuller) { const [f0, f1, y, h] = o.fuller; ext(g, rrect(f0, f1, y - h / 2, y + h / 2, h * 0.45), t + 0.0007, GROOVE(), { bevel: 0 }); }
  }

  const KB = {
    combate(k) {
      const edge = [[0, -0.0175], [0.12, -0.0175]].concat(cb([0.12, -0.0175], [0.155, -0.0175], [0.18, -0.012], [0.19, 0.0015], 10));
      const spine = bz([0.19, 0.0015], [0.172, 0.012], [0.135, 0.0175], 8).concat([[0, 0.0175]]);
      blade(k, edge, spine, { fuller: [0.025, 0.14, 0.005, 0.0042] });
      ext(k, rrect(-0.013, 0.003, -0.032, 0.032, 0.004), 0.016, DKB(), { keep: true });                  // guarda
      for (let i = 0; i < 8; i++) discZ(k, 0.0155 - (i % 2) * 0.0005, -0.014 - i * 0.0128, -0.014 - (i + 1) * 0.0128 + 0.0012, 0, i % 2 ? LEATH2() : LEATH(), true);   // couro empilhado
      discZ(k, 0.0165, -0.116, -0.128, 0, DKB(), true); discZ(k, 0.012, -0.128, -0.136, 0, STEELD(), true);   // pomo
    },
    karambit(k, A) {
      const pv = new THREE.Group(); pv.position.set(0, -0.006, 0.138); k.add(pv);
      const b = new THREE.Group(); b.position.set(0, 0.006, -0.138); pv.add(b); A.spin = pv;
      const edge = cb([0.15, -0.066], [0.128, -0.02], [0.07, 0.002], [0.0, -0.012], 14);
      edge.unshift([0.15, -0.066]);
      const spine = cb([0, 0.018], [0.085, 0.032], [0.155, 0.012], [0.15, -0.066], 14);
      // polígono: base-fio → … → ponta → dorso de volta à base (o "fio" aqui é a curva de dentro)
      const e2 = edge.slice().reverse();               // base → ponta
      blade(b, e2, spine.slice().reverse(), { t: 0.0058, ew: 0.0065, fuller: null });
      // cabo ligeiramente curvo com sulcos para os dedos
      ext(b, rrect(-0.125, 0.004, -0.02, 0.021, 0.008), 0.02, BLUE(), { bevel: 0.004, keep: true });
      for (let i = 0; i < 4; i++) ext(b, rect(-0.095 + i * 0.022, -0.09 + i * 0.022, -0.0205, 0.0215), 0.0205, RUB(), { bevel: 0.001, keep: true });
      pinX(b, 0.001, 0.0, 0.0045, 0.024); pinX(b, -0.06, 0.0, 0.0035, 0.024);
      ext(b, ringShape(-0.142, -0.008, 0.026, 0.0165), 0.0068, STEELD(), { bevel: 0.0012, keep: true });   // anel
    },
    borboleta(k, A) {
      // lâmina (clip) presa ao eixo em f = 0
      const edge = [[0, -0.0125], [0.075, -0.0125]].concat(cb([0.075, -0.0125], [0.105, -0.0125], [0.125, -0.008], [0.135, 0.0035], 10));
      const spine = bz([0.135, 0.0035], [0.11, 0.0125], [0.075, 0.0138], 8).concat([[0.01, 0.0138], [0, 0.0132]]);
      blade(k, edge, spine, { t: 0.0046, ew: 0.005 });
      ext(k, rrect(-0.02, 0.012, -0.0155, 0.0155, 0.01), 0.0052, BLADE(), { bevel: 0.0006 });          // talão
      pinX(k, -0.008, 0.0072, 0.0033, 0.021); pinX(k, -0.008, -0.0072, 0.0033, 0.021); pinX(k, 0.0, 0.0, 0.0042, 0.023);
      const mkH = (side) => {
        const pv = new THREE.Group(); k.add(pv);
        const x = side * 0.0066, holes = []; for (let i = 0; i < 4; i++) holes.push([-0.03 - i * 0.022, 0, 0.0052]);
        ext(pv, rrect(-0.13, 0.008, -0.0115, 0.0115, 0.0085), 0.0068, STEELD(), { x, holes, bevel: 0.0009, keep: true });
        ext(pv, rect(-0.13, -0.116, -0.0115, 0.0115), 0.0072, GRAY(), { x, bevel: 0.0006, keep: true });
        pinX(pv, -0.126, 0.0, 0.0034, 0.0078, STEELD(), x);
        if (side < 0) ext(pv, rrect(-0.12, -0.085, 0.0075, 0.0135, 0.003), 0.0066, BLACK(), { x, bevel: 0.0006, keep: true });   // trava
        return pv;
      };
      A.flip = [mkH(1), mkH(-1)];
    },
    baioneta(k) {
      const edge = [[0, -0.0155], [0.115, -0.0155]].concat(cb([0.115, -0.0155], [0.155, -0.014], [0.18, -0.008], [0.198, 0.0025], 10));
      const spine = bz([0.198, 0.0025], [0.178, 0.0145], [0.14, 0.0155], 8).concat([[0.03, 0.0155], [0, 0.0155]]);
      blade(k, edge, spine, { t: 0.0058, fuller: [0.022, 0.14, 0.003, 0.0048] });
      ext(k, rrect(-0.009, 0.004, -0.024, 0.026, 0.004), 0.0155, DKB(), { keep: true });                   // guarda
      ext(k, ringShape(0.0, -0.0415, 0.0145, 0.0095), 0.0105, DKB(), { keep: true });                      // anel da boca do cano
      const gr = [[-0.009, -0.0165]]; for (let i = 0; i < 5; i++) { const f = -0.009 - i * 0.0205; gr.push([f - 0.0205, -0.0165]); }
      ext(k, rrect(-0.118, -0.009, -0.0165, 0.0165, 0.006), 0.0225, RUB(), { keep: true });
      for (let i = 0; i < 7; i++) ext(k, rect(-0.016 - i * 0.0145, -0.0128 - i * 0.0145, -0.0172, 0.0172), 0.0235, BLACK(), { bevel: 0.0006, keep: true });
      ext(k, rrect(-0.138, -0.116, -0.02, 0.02, 0.006), 0.019, DKB(), { keep: true });                      // pomo com trava
      ext(k, rect(-0.138, -0.128, 0.0, 0.032), 0.01, DKB(), { keep: true });
    },
    baionetaTatica(k) {
      const edge = [[0, -0.0165], [0.135, -0.0165]].concat(cb([0.135, -0.0165], [0.175, -0.0165], [0.205, -0.0095], [0.214, 0.004], 10));
      const spine = bz([0.214, 0.004], [0.196, 0.0135], [0.17, 0.0165], 6);
      spine.push([0.168, 0.0165]); for (let i = 0; i < 8; i++) { const f = 0.16 - i * 0.0155; spine.push([f, 0.0165], [f - 0.0057, 0.0235], [f - 0.0155 + 0.003, 0.0165]); } spine.push([0, 0.0165]);   // serra no dorso
      blade(k, edge, spine, { t: 0.0068, mat: DKB(), edgeMat: DKE(), ew: 0.006 });
      ext(k, rrect(-0.011, 0.004, -0.028, 0.03, 0.005), 0.0185, GRAY(), { keep: true });
      ext(k, ringShape(0.0, -0.0455, 0.0145, 0.0092), 0.0108, GRAY(), { keep: true });
      ext(k, rrect(-0.128, -0.011, -0.0175, 0.0185, 0.007), 0.0245, OLIVE(), { keep: true });
      for (let i = 0; i < 4; i++) ext(k, rect(-0.03 - i * 0.022, -0.024 - i * 0.022, -0.0185, 0.0195), 0.0255, BLACK(), { bevel: 0.0007, keep: true });
      discZ(k, 0.0125, -0.128, -0.138, 0, STEELD(), true);
    },
    bowie(k) {
      const edge = [[0, -0.0235], [0.17, -0.0235]].concat(cb([0.17, -0.0235], [0.21, -0.0235], [0.245, -0.013], [0.262, 0.006], 12));
      const spine = bz([0.262, 0.006], [0.222, 0.0095], [0.19, 0.0225], 10).concat([[0.18, 0.0235], [0, 0.0235]]);
      blade(k, edge, spine, { t: 0.0062, ew: 0.007, fuller: [0.025, 0.15, 0.005, 0.0045] });
      ext(k, rrect(-0.012, 0.007, -0.042, 0.04, 0.005), 0.0195, BRASS(), { keep: true });                     // guarda de latão
      ext(k, rect(-0.007, 0.0, -0.062, -0.042), 0.0105, BRASS(), { keep: true });
      ext(k, rrect(-0.132, -0.012, -0.0195, 0.0215, 0.008), 0.0265, WOOD(), { keep: true });
      for (let i = 0; i < 3; i++) pinX(k, -0.04 - i * 0.034, 0.0, 0.0034, 0.028, BRASS());
      ext(k, rrect(-0.15, -0.13, -0.024, 0.024, 0.008), 0.0275, BRASS(), { keep: true });
    },
    canivete(k, A) {
      const bp = new THREE.Group(); bp.position.set(0, 0, 0); k.add(bp); A.fold = bp;
      const edge = [[0, -0.0125], [0.07, -0.0125]].concat(cb([0.07, -0.0125], [0.092, -0.0115], [0.108, -0.006], [0.115, 0.0025], 9));
      const spine = bz([0.115, 0.0025], [0.1, 0.0135], [0.075, 0.0145], 7).concat([[0, 0.0145]]);
      blade(bp, edge, spine, { t: 0.0042, ew: 0.0048, fuller: [0.012, 0.07, 0.0045, 0.0034] });
      pinX(bp, 0.016, 0.0095, 0.0032, 0.011, STEELD());                                                        // pino de abertura
      ext(k, rrect(-0.118, 0.006, -0.0155, 0.0155, 0.007), 0.0155, BLUE(), { keep: true });                    // cabo
      ext(k, rrect(-0.118, 0.006, -0.0115, 0.0115, 0.006), 0.0188, GRAY(), { bevel: 0.001, keep: true });
      for (let i = 0; i < 5; i++) ext(k, rect(-0.1 + i * 0.0165, -0.0965 + i * 0.0165, -0.0126, 0.0126), 0.0196, RUB(), { bevel: 0.0005, keep: true });
      ext(k, rrect(-0.07, -0.01, 0.0118, 0.0158, 0.0022), 0.0043, STEELD(), { x: 0.0105, bevel: 0.0005, keep: true });    // presilha de bolso
      pinX(k, 0.0, 0.0, 0.0042, 0.021); pinX(k, -0.11, 0.0, 0.0032, 0.021);
    },
    caca(k) {
      const edge = [[0, -0.0185], [0.085, -0.0185]].concat(cb([0.085, -0.0185], [0.13, -0.0185], [0.17, -0.0095], [0.178, 0.0035], 12));
      const spine = bz([0.178, 0.0035], [0.16, 0.0125], [0.13, 0.0145], 8).concat(cb([0.13, 0.0145], [0.095, 0.0195], [0.05, 0.0185], [0.008, 0.0185], 8));
      blade(k, edge, spine, { t: 0.0058, ew: 0.0065 });
      // lombo do dorso com entalhes de polegar
      for (let i = 0; i < 5; i++) ext(k, rect(0.012 + i * 0.01, 0.015 + i * 0.01, 0.0176, 0.0218), 0.0059, GROOVE(), { bevel: 0, keep: false });
      ext(k, rrect(-0.01, 0.006, -0.036, 0.0215, 0.005), 0.0145, BRASS(), { keep: true });                    // guarda
      ext(k, rrect(-0.128, -0.01, -0.019, 0.02, 0.009), 0.0245, WOOD2(), { keep: true });
      for (let i = 0; i < 4; i++) ext(k, rect(-0.026 - i * 0.025, -0.02 - i * 0.025, -0.0196, 0.0206), 0.0255, WOOD(), { bevel: 0.0008, keep: true });
      ext(k, ringShape(-0.139, -0.001, 0.0125, 0.0058), 0.0165, BRASS(), { keep: true });                    // pomo com furo de cordão
    },
    punhal(k) {
      // lâmina triangular curta; o punho em T fica atravessado na largura (x)
      const edge = cb([0.0, -0.021], [0.04, -0.019], [0.085, -0.008], [0.118, 0.0], 10); edge.unshift([0.0, -0.021]);
      const spine = cb([0.118, 0.0], [0.085, 0.008], [0.04, 0.019], [0.0, 0.021], 10);
      blade(k, edge, spine, { t: 0.0075, edge2: true, ew: 0.0075 });
      ext(k, rrect(-0.032, 0.012, -0.0235, 0.0235, 0.008), 0.0135, GRAY(), { keep: true });                     // placa
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.095, 16), RUB()); bar.rotation.z = Math.PI / 2; bar.position.set(0, 0, 0.022); bar.userData.noSkin = true; k.add(bar);
      for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.0135, 12, 10), RUB()); c.position.set(s * 0.0475, 0, 0.022); c.userData.noSkin = true; k.add(c); }
      for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.0126, 0.0016, 6, 14), BLACK()); r.rotation.y = Math.PI / 2; r.position.set(-0.03 + i * 0.015, 0, 0.022); r.userData.noSkin = true; k.add(r); }
    },
    tanto(k) {
      const edge = [[0, -0.0145], [0.15, -0.0145]].concat(cb([0.15, -0.0145], [0.178, -0.0145], [0.2, -0.008], [0.212, 0.0075], 10));
      const spine = [[0.212, 0.0075], [0.195, 0.0105], [0.178, 0.0145], [0.172, 0.0145], [0, 0.0145]];
      blade(k, edge, spine, { t: 0.0058, ew: 0.0075, fuller: [0.01, 0.15, 0.0075, 0.0034] });
      discZ(k, 0.0285, -0.004, 0.003, 0, DKB(), true, 22);                                                      // tsuba
      discZ(k, 0.0235, 0.003, 0.0055, 0, BRASS(), true, 20);
      ext(k, rrect(-0.14, -0.004, -0.0125, 0.0125, 0.006), 0.0285, phong(0x15151c, 22, 0x222222), { keep: true });
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.0105, 0.0105), RED()); d.rotation.x = Math.PI / 4; d.position.set(s * 0.0147, 0, 0.018 + i * 0.019); d.userData.noSkin = true; k.add(d); }
      discZ(k, 0.0135, -0.138, -0.15, 0, BRASS(), true, 16);
    },
    kukri(k) {
      const edge = [[0, -0.0155], [0.035, -0.0175]].concat(bz([0.035, -0.0175], [0.0455, -0.0125], [0.052, -0.0165], 3)).concat(cb([0.052, -0.0165], [0.12, -0.056], [0.215, -0.07], [0.27, -0.036], 14));
      const spine = cb([0.27, -0.036], [0.225, 0.01], [0.13, 0.034], [0.0, 0.0165], 14);
      blade(k, edge, spine, { t: 0.0066, ew: 0.0072, fuller: [0.03, 0.15, 0.0, 0.0045] });
      ext(k, rrect(-0.013, 0.006, -0.023, 0.025, 0.005), 0.0175, BRASS(), { keep: true });
      ext(k, [[-0.013, -0.0155], [-0.06, -0.0175], [-0.098, -0.02], [-0.118, -0.034], [-0.138, -0.036], [-0.146, -0.016], [-0.146, 0.022], [-0.132, 0.034], [-0.112, 0.026], [-0.09, 0.0185], [-0.013, 0.0165]], 0.0255, WOOD(), { bevel: 0.0045, keep: true });
      for (let i = 0; i < 2; i++) pinX(k, -0.04 - i * 0.03, 0.0, 0.0034, 0.027, BRASS());
      discZ(k, 0.0125, -0.146, -0.153, -0.007, BRASS(), true);
    },
    adaga(k) {
      const edge = [[0, -0.0175], [0.025, -0.0172]].concat(cb([0.025, -0.0172], [0.09, -0.012], [0.16, -0.0045], [0.215, 0.0], 12));
      const spine = cb([0.215, 0.0], [0.16, 0.0045], [0.09, 0.012], [0.025, 0.0172], 12).concat([[0, 0.0175]]);
      blade(k, edge, spine, { t: 0.0052, edge2: true, ew: 0.0055 });
      ext(k, [[0.0, -0.0028], [0.2, -0.0004], [0.2, 0.0004], [0.0, 0.0028]], 0.0068, GROOVE(), { bevel: 0 });   // nervura central
      ext(k, [[-0.009, -0.05], [0.002, -0.046], [0.006, -0.03], [0.006, 0.03], [0.002, 0.046], [-0.009, 0.05], [-0.013, 0.032], [-0.013, -0.032]], 0.0125, BRASS(), { keep: true });
      for (let i = 0; i < 9; i++) discZ(k, 0.0125 + (i % 2) * 0.001, -0.014 - i * 0.0105, -0.014 - (i + 1) * 0.0105 + 0.0009, 0, i % 2 ? LEATH2() : BLACK(), true);
      const pm = new THREE.Mesh(new THREE.SphereGeometry(0.0195, 14, 10), BRASS()); pm.position.set(0, 0, 0.115); pm.scale.z = 0.8; pm.userData.noSkin = true; k.add(pm);
    },
    machadinha(k) {
      k.rotation.x = 0.62;                                                       // cabeça para cima: fio para frente e para baixo
      ext(k, [[-0.13, -0.011], [-0.05, -0.0125], [0.0, -0.0145], [0.1, -0.0105], [0.15, -0.0095], [0.15, 0.0125], [0.1, 0.0125], [0.0, 0.0165], [-0.05, 0.0145], [-0.13, 0.0125]], 0.021, OLIVE(), { bevel: 0.004, keep: true });
      for (let i = 0; i < 5; i++) ext(k, rect(-0.115 + i * 0.016, -0.111 + i * 0.016, -0.012, 0.0132), 0.0225, BLACK(), { bevel: 0.0006, keep: true });
      discZ(k, 0.0125, -0.14, -0.152, 0.0, BLACK(), true);
      const bit = [[0.098, -0.062]].concat(bz([0.098, -0.062], [0.145, -0.098], [0.192, -0.062], 10));
      blade(k, bit, [[0.168, -0.012], [0.105, -0.012]], { t: 0.0085, ew: 0.008, mat: DKB(), edgeMat: DKE() });
      ext(k, [[0.108, 0.014], [0.165, 0.014], [0.138, 0.088]], 0.0085, DKB());                                              // espigão no verso
      ext(k, rrect(0.1, 0.17, -0.0125, 0.0165, 0.003), 0.0165, GRAY(), { keep: true });
    },
    facao(k) {
      const edge = [[0, -0.0175], [0.04, -0.021]].concat(cb([0.04, -0.021], [0.14, -0.0275], [0.24, -0.029], [0.3, -0.0075], 14));
      const spine = bz([0.3, -0.0075], [0.268, 0.0], [0.24, 0.0185], 8).concat([[0.2, 0.0185], [0.04, 0.0185], [0, 0.0175]]);
      blade(k, edge, spine, { t: 0.0048, ew: 0.0072, mat: DKB(), edgeMat: DKE() });
      ext(k, rrect(-0.012, 0.007, -0.023, 0.026, 0.005), 0.0105, GRAY(), { keep: true });
      ext(k, rrect(-0.128, -0.012, -0.0195, 0.0245, 0.009), 0.0255, RUB(), { keep: true });
      for (let i = 0; i < 4; i++) ext(k, rect(-0.03 - i * 0.022, -0.0235 - i * 0.022, -0.0205, 0.0255), 0.0265, BLACK(), { bevel: 0.0007, keep: true });
      ext(k, ringShape(-0.126, 0.0, 0.0075, 0.0038), 0.0132, GRAY(), { keep: true });
    }
  };
  // monta o modelo da faca no estilo pedido (mesma origem/escala do modelo padrão)
  S.knifeModel = (style) => {
    const g = new THREE.Group();
    const muzzle = new THREE.Object3D(); g.add(muzzle); g.userData.muzzle = muzzle;
    const k = new THREE.Group(); k.position.set(0, -0.045, -0.02); g.add(k);
    const A = {};
    (KB[style] || KB.combate)(k, A);
    g.userData.anim = (st) => {
      const insp = st.inspect, d = st.draw;
      if (A.flip) {
        // borboleta: fecha ao guardar, abre ao sacar e faz o giro dos cabos ao inspecionar
        const spin = insp >= 0 ? insp * Math.PI * 4 : 0, c = Math.min(1, d * 1.5) * Math.PI;
        A.flip[0].rotation.x = spin + c; A.flip[1].rotation.x = -(spin + c);
      }
      if (A.fold) A.fold.rotation.x = d > 0 ? d * Math.PI * 0.94 : insp >= 0 ? Math.sin(insp * Math.PI) * 0.22 : 0;   // canivete: lâmina recolhe no cabo
      if (A.spin) A.spin.rotation.x = insp >= 0 ? insp * Math.PI * 6 : 0;                                       // karambit gira no dedo
    };
    muzzle.position.set(0, -0.045, -0.2);
    g.userData.vmTilt = style === 'machadinha' ? 0.12 : style === 'punhal' ? 0.25 : 0.42;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  };

  // ---------------- integração com o desenho das armas ----------------
  const baseGun = G.Models.gun;
  G.Models.gun = (def) => {
    const local = S.local;
    const style = local ? (S.data.knife || 'combate') : 'combate';
    const g = def.id === 'knife' ? S.knifeModel(style) : baseGun(def);
    const sk = local ? S.data.skins[def.id] : null;
    if (sk) S.apply(g, sk);
    return g;
  };
  S.equip = (wid, fin) => { if (fin) S.data.skins[wid] = fin; else delete S.data.skins[wid]; S.save(); };
  S.setKnife = (style) => { S.data.knife = style; S.save(); };
  // chave de cache dos modelos do jogador local
  S.localKey = (id) => (id === 'knife' ? '@' + (S.data.knife || 'combate') : '') + (S.data.skins[id] ? '#' + S.data.skins[id] : '');
})();
