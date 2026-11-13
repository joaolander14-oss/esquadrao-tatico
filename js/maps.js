// Mapas originais do Esquadrão Tático.
// carve(fill, ramp): fill(c1,r1,c2,r2,tipo,altura?) · ramp(c1,r1,c2,r2,direção_que_sobe,h0,h1,tipo?)
// Legenda: '#' parede · '.' chão · ',' chão alt. · 'T'/'C' spawns · 'a' A elevado · 'A'/'B'/'b' bombsites · 'q'/'r' bombsite coberto
// '1' '2' '3' degraus · 'u' passarela · 't' túnel · 'i' sala coberta · 'n' arco · 'w' canal com água · '/' rampa
// props(a): a.door(i,j,lado,{width,kind,open}) · a.gate(i,j,lado,largura) = portão de spawn (abre quando a rodada começa)
(function () {
  const M = G.Map;
  const hidden = (a, x, z, w, h, d) => a.prop(x, z, w, h, d, 'hidden');

  // =====================================================================
  M.register({
    id: 'sirocco', name: 'Vila Sirocco', place: 'Deserto · vilarejo de adobe', tag: 'Clássico',
    desc: 'Vielas, túneis que descem sob o vilarejo, portas no meio e no B e um bombsite A elevado com rampas.',
    theme: { window: 'shutter', door: 'wood' },
    carve(fill, ramp) {
      fill(17, 2, 27, 6, 'C');
      fill(14, 3, 16, 5, '.'); fill(28, 3, 28, 5, '.'); ramp(29, 3, 31, 5, 'E', 0, 1);
      fill(32, 2, 43, 11, 'a'); fill(32, 2, 33, 3, 'u'); ramp(32, 4, 33, 5, 'N', 1, 2); fill(38, 2, 39, 2, '#');
      fill(40, 12, 43, 30, '.'); ramp(40, 12, 43, 13, 'N', 0, 1); fill(44, 13, 44, 17, '.');
      fill(40, 24, 40, 25, '#'); fill(43, 24, 43, 25, '#'); fill(41, 24, 42, 25, 'n');
      fill(34, 28, 43, 32, '.'); fill(37, 29, 38, 30, '#');
      fill(13, 33, 30, 36, 'T'); fill(31, 33, 35, 35, '.');
      fill(20, 7, 24, 32, '.'); fill(19, 22, 25, 31, '.');
      fill(20, 8, 20, 9, '#'); fill(24, 8, 24, 9, '#'); fill(21, 8, 23, 9, 'n'); fill(21, 9, 21, 9, '#'); fill(23, 9, 23, 9, '#');
      fill(20, 26, 20, 27, '#');
      fill(20, 7, 20, 7, '#'); fill(24, 7, 24, 7, '#');
      fill(20, 32, 20, 32, '#'); fill(24, 32, 24, 32, '#');
      fill(25, 14, 29, 16, '.'); ramp(30, 14, 32, 16, 'E', 0, 2); fill(33, 13, 36, 16, 'u'); ramp(33, 12, 36, 12, 'S', 1, 2);
      fill(13, 10, 19, 12, '.'); fill(14, 10, 15, 12, 'n'); fill(16, 10, 16, 10, '#'); fill(15, 10, 15, 10, '#'); fill(15, 12, 15, 12, '#');
      fill(2, 2, 13, 12, 'b'); fill(11, 2, 13, 3, '#');
      // túneis do B descendo 1,5 m
      ramp(3, 13, 8, 15, 'N', -1.5, 0, 't'); fill(3, 16, 8, 23, 't', -1.5); ramp(3, 24, 8, 26, 'S', -1.5, 0, 't');
      fill(3, 13, 3, 13, '#'); fill(8, 13, 8, 13, '#'); fill(6, 17, 7, 18, '#');
      ramp(9, 19, 11, 21, 'E', -1.5, 0, 't'); fill(12, 19, 19, 21, 't'); fill(14, 19, 15, 19, '#');
      fill(2, 27, 12, 31, '.'); fill(9, 32, 12, 35, '.'); fill(6, 29, 7, 29, '#');
      fill(16, 15, 18, 17, 'i'); fill(17, 18, 17, 18, 'i'); fill(19, 16, 19, 16, 'j');           // sala com janela para o meio
      fill(37, 14, 38, 15, 'i', 2.0); fill(39, 14, 39, 15, 'j', 3.0);                             // sala com janela sobre o longo
    },
    props(a) {
      const c = a.c;
      a.crate(c(37), c(6), 2.2); a.crate(c(37) + 1.65, c(6) + 0.5, 1.1); a.crate(c(35), c(3), 1.2, 2);
      a.crate(c(41), c(4), 1.2); a.crate(c(42), c(4) + 0.2, 1.2); a.car(c(41) + 0.6, c(8), false);
      a.barrel(c(33) - 0.6, c(10)); a.barrel(c(33) + 0.3, c(10) + 0.5); a.sandbag(c(35), c(11) + 0.9, 4.5, 0.8);
      a.crate(c(41) - 0.6, c(20), 1.2); a.crate(c(43) + 0.6, c(16), 1.2, 2);
      a.barrel(c(43) + 0.7, c(27)); a.barrel(c(43) + 0.7, c(28) - 0.2); a.crate(c(36), c(31), 1.2); a.car(c(41), c(31) + 0.4, true);
      a.crate(c(22), c(19), 1.2); a.crate(c(22), c(19) + 1.2, 1.2, 2); a.crate(c(19) - 0.6, c(28), 1.2); a.sandbag(c(22), c(11) + 0.6, 3, 0.8);
      a.crate(c(26), c(14) - 0.8, 1.2);
      a.crate(c(5), c(5), 2.2); a.crate(c(5) + 1.65, c(5) + 0.4, 1.1); a.crate(c(10), c(4), 1.2, 2); a.crate(c(10) - 1.2, c(4), 1.2);
      a.car(c(9), c(9), true); a.barrel(c(3) - 0.5, c(10)); a.barrel(c(3) - 0.5, c(11)); a.crate(c(12), c(7), 1.2); a.sandbag(c(4), c(12) - 0.2, 0.8, 2.2);
      a.crate(c(12), c(19) - 0.8, 1.2); a.crate(c(4) - 0.6, c(22), 1.2);
      a.car(c(16), c(34) + 0.5, true); a.crate(c(28), c(35), 1.2, 2); a.crate(c(18) + 0.3, c(3), 1.2); a.crate(c(26), c(5), 1.2, 2);
      a.crate(c(5), c(29), 1.2); a.barrel(c(11), c(28));
      // portas
      a.door(22, 9, 'N', { kind: 'wood' });                 // portas do meio
      a.door(15, 11, 'W', { kind: 'wood' });                // portas do B
      a.door(41, 24, 'N', { width: 2, kind: 'metal' });     // portões do longo
      // portões de spawn
      a.gate(21, 32, 'N', 3); a.gate(13, 33, 'W', 3); a.gate(31, 33, 'W', 3);
      a.gate(17, 3, 'W', 3); a.gate(27, 3, 'E', 3); a.gate(21, 6, 'S', 3);
    },
    spots: P => ({
      tSpawn: [P(17, 34), P(20, 35), P(22, 34), P(24, 35), P(26, 34)],
      ctSpawn: [P(19, 4), P(21, 3), P(22, 5), P(24, 3), P(25, 5)],
      A: P(37, 8), B: P(7, 8),
      plantA: [P(36, 8), P(39, 6), P(34, 6), P(38, 9)], plantB: [P(7, 7), P(9, 5), P(4, 8), P(8, 10)],
      routes: {
        A: [[P(33, 34), P(41, 29), P(41, 22), P(41, 14), P(39, 8)], [P(22, 30), P(22, 18), P(27, 15), P(34, 14), P(36, 8)]],
        B: [[P(11, 33), P(6, 28), P(5, 20), P(5, 13), P(7, 7)], [P(22, 30), P(19, 20), P(10, 20), P(5, 15), P(7, 8)]]
      },
      holdA: [P(38, 10, 180), P(35, 9, -150), P(42, 9, 180), P(34, 6, 160)], holdB: [P(6, 9, 180), P(10, 6, 150), P(4, 4, -160), P(12, 9, 160)],
      holdMid: [P(22, 6, 180), P(22, 12, 180)],
      postA: [P(41, 11, 0), P(34, 10, 30), P(39, 3, -150), P(35, 15, 30)], postB: [P(5, 12, 0), P(11, 10, 60), P(3, 4, -40), P(10, 2, 160)],
      lurk: [P(21, 21, 0), P(42, 18, 0), P(6, 22, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.letter('A', 40 * S + 0.03, 2.8, c(18), 0, Math.PI / 2, 2.2);
      d.letter('B', c(10), 2.6, 27 * S + 0.03, 0, 0, 2.0);
      d.letter('A', c(28), 2.8, 14 * S + 0.03, 0, 0, 2.0);
      d.letter('B', c(18), 2.8, 10 * S + 0.03, 0, 0, 2.0);
      d.awning(c(22), 7 * S + 0.6, 6, 1.6, 0, 4.2);
      d.awning(c(30), 33 * S - 0.7, 5, 1.4, Math.PI, 3.8);
      d.awning(c(9), 27 * S + 0.6, 4, 1.4, 0, 3.6);
    }
  });

  // =====================================================================
  M.register({
    id: 'porto', name: 'Porto Ferrugem', place: 'Litoral · terminal de cargas', tag: 'Reformado',
    desc: 'Pátio de contêineres no A e um armazém rebaixado no B, com rampas de carga e portas de metal. Portão no meio da avenida.',
    theme: {
      mats: { wall: 'corrugated', roof: 'concrete', ground: 'asphalt', ground2: 'concrete', spawn: 'darkTiles', site: 'darkTiles', stair: 'grate', upper: 'grate', tunnel: 'concrete', slab: 'grate', raise: 'concrete', ramp: 'steelPlate' },
      sky: ['#5f6d79', '#97a4ae', '#c3c7c6'], fog: 0xa9b1b8, fogNear: 45, fogFar: 175,
      hemi: [0xc8d2dc, 0x5a5650, 0.8], sun: [0xe6edf5, 0.55], sunDir: [30, 100, 40],
      wallH: [6, 2, 3], window: 'industrial', winChance: 0.3, tintVar: 0.18, weather: 'rain', door: 'metal',
      radar: { ground: [104, 108, 114], site: [150, 108, 88], roof: [72, 76, 82] }
    },
    carve(fill, ramp) {
      fill(2, 15, 7, 23, 'T');
      fill(3, 4, 6, 14, '.'); fill(7, 4, 25, 8, ',');
      fill(14, 9, 16, 16, '.');
      fill(8, 17, 36, 21, '.'); fill(19, 17, 19, 17, '#'); fill(19, 21, 19, 21, '#');
      fill(26, 2, 36, 10, 'A'); fill(33, 2, 36, 4, 'u'); ramp(30, 2, 32, 4, 'E', 0, 2);
      fill(30, 11, 32, 16, '.');
      ramp(27, 22, 29, 26, 'N', -1.5, 0);                   // rampa de carga descendo para o armazém
      fill(3, 24, 6, 33, '.'); fill(7, 29, 23, 33, ',');
      fill(12, 22, 14, 28, '.');
      fill(24, 27, 35, 35, 'r', -1.5);                      // armazém rebaixado (B)
      fill(24, 27, 24, 30, '#'); fill(24, 32, 24, 35, '#');
      ramp(21, 31, 23, 31, 'W', -1.5, 0);                   // rampa da porta oeste
      fill(28, 30, 28, 30, '#'); fill(31, 32, 31, 32, '#');
      fill(37, 4, 40, 14, '.'); fill(37, 24, 40, 33, '.');
      ramp(36, 31, 37, 31, 'E', -1.5, 0);                   // rampa da porta leste
      fill(37, 15, 43, 23, 'C');
      fill(3, 14, 3, 14, '#'); fill(3, 24, 3, 24, '#');
    },
    props(a) {
      const c = a.c;
      a.container(c(28), c(3) + 0.3, true, 0xb0402c);
      a.container(c(30), c(9) + 0.6, true, [0x2f6fa8, 0x3c8a4a], 2);
      a.container(c(35), c(7), false, 0xd08a1c);
      a.crate(c(27), c(5), 1.2, 2); a.crate(c(32), c(7) - 0.4, 1.2);
      a.barrel(c(36) + 0.6, c(10) + 0.5); a.barrel(c(36) + 0.6, c(10) - 0.4);
      a.container(c(24), c(18) - 0.3, true, 0x8a2a2a); a.container(c(31), c(20) + 0.3, true, 0x2a6a8a);
      a.crate(c(11), c(17) - 0.5, 1.2); a.crate(c(16), c(21) + 0.5, 1.2, 2); a.barrel(c(28), c(17) - 0.6);
      a.crate(c(26), c(30), 1.2, 2); a.crate(c(26) + 1.2, c(30), 1.2); a.crate(c(33), c(29), 1.2);
      a.container(c(30), c(34) + 0.2, true, 0x5a5a5a); a.barrel(c(34) + 0.5, c(33)); a.barrel(c(34) + 0.5, c(34));
      a.car(c(15), c(31), true, 0x6a7a8a); a.car(c(20), c(6), true, 0xa04030);
      a.crate(c(5), c(12), 1.2); a.crate(c(4), c(27), 1.2, 2); a.container(c(41), c(16) - 0.4, true, 0x3a5a3a);
      a.crate(c(38) + 0.5, c(10), 1.2); a.crate(c(38) + 0.5, c(28), 1.2);
      a.door(19, 18, 'W', { width: 3, kind: 'metal' });      // portão do meio da avenida
      a.door(24, 31, 'W', { kind: 'metal' }); a.door(36, 31, 'W', { kind: 'metal' });
      a.gate(4, 15, 'N', 3); a.gate(4, 23, 'S', 3); a.gate(8, 17, 'W', 5);
      a.gate(37, 15, 'N', 4); a.gate(37, 23, 'S', 4); a.gate(37, 17, 'W', 5);
    },
    spots: P => ({
      tSpawn: [P(4, 17), P(5, 19), P(3, 21), P(6, 20), P(4, 22)],
      ctSpawn: [P(40, 18), P(41, 19), P(39, 21), P(42, 20), P(40, 22)],
      A: P(29, 6), B: P(29, 31),
      plantA: [P(29, 6), P(31, 6), P(27, 8), P(33, 8)], plantB: [P(29, 31), P(26, 28), P(33, 33), P(27, 34)],
      routes: {
        A: [[P(5, 10), P(12, 6), P(22, 6), P(28, 6)], [P(10, 19), P(22, 19), P(31, 17), P(31, 12), P(31, 7)]],
        B: [[P(5, 28), P(12, 31), P(20, 31), P(27, 31)], [P(10, 19), P(22, 19), P(28, 22), P(28, 26), P(29, 31)]]
      },
      holdA: [P(34, 9, 90), P(33, 5, 100), P(35, 10, 120), P(31, 10, 30)], holdB: [P(34, 31, 90), P(32, 28, 60), P(33, 35, 90), P(30, 33, 90)],
      holdMid: [P(36, 19, 90), P(31, 14, 180)],
      postA: [P(28, 5, -90), P(27, 9, -60), P(34, 3, 180), P(29, 5, 180)], postB: [P(26, 33, -90), P(25, 29, 0), P(30, 29, 0), P(27, 34, -60)],
      lurk: [P(15, 12, 0), P(13, 25, 0), P(17, 19, -90)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.letter('A', 26 * S + 0.03, 3, c(9), 0, Math.PI / 2, 2.2);
      d.letter('B', c(28), 1.5, 27 * S + 0.03, 0, 0, 2.2);
      for (const [x, z] of [[c(10), c(17) - 1.2], [c(22), c(21) + 1.2], [c(34), c(17) - 1.2], [c(12), c(29) - 1.2], [c(20), c(4) - 1.2]]) d.lamp(x, z, 5.5, 0xfff1c0);
      const yel = new THREE.MeshLambertMaterial({ color: 0xd9a521 });
      const add = (w, h, dd, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), yel); m.position.set(x, y, z); m.castShadow = true; d.group.add(m); };
      for (const x of [c(27), c(33)]) for (const z of [-2, 4]) add(0.6, 22, 0.6, x, 11, z);
      add(c(33) - c(27) + 1, 1.2, 1.2, (c(27) + c(33)) / 2, 22, -2); add(c(33) - c(27) + 1, 1.2, 1.2, (c(27) + c(33)) / 2, 22, 4);
      add(1.2, 1.2, 30, c(30), 23, -6); add(4, 3, 4, c(30), 25, 2);
      d.pipe(c(8), 9 * S - 0.4, c(13), 9 * S - 0.4, 3.2, 0.25, 0x6a5040);
      d.pipe(c(25), 22 * S - 0.4, c(26), 22 * S - 0.4, 3.6, 0.3, 0x7a7f84);
    }
  });

  // =====================================================================
  const nevadaTrees = [[25.5, 10.5], [48.5, 106.5], [94.5, 106.5], [16.5, 94.5], [62.5, 46.5]];
  M.register({
    id: 'nevada', name: 'Vila Nevada', place: 'Montanha · aldeia na neve', tag: 'Reformado',
    desc: 'Praça da igreja elevada no A, celeiro com varanda no B, túnel de pedra que afunda 2 m na rota leste e portas nas passagens curtas.',
    theme: {
      mats: { wall: 'stoneWall', roof: 'roofSnow', ground: 'snow', ground2: 'snow', spawn: 'cobble', site: 'cobble', stair: 'stone', upper: 'planks', tunnel: 'cobble', slab: 'planks', raise: 'stoneWall', ramp: 'cobble' },
      sky: ['#7aa0c8', '#c2d4e4', '#eef2f6'], fog: 0xdbe3ea, fogNear: 45, fogFar: 185,
      hemi: [0xe0ecf8, 0x8a9098, 0.85], sun: [0xffffff, 0.72], sunDir: [-40, 70, -60],
      wallH: [5, 1.5, 3], window: 'wood', winChance: 0.45, tintVar: 0.14, weather: 'snow', door: 'wood',
      radar: { ground: [196, 202, 210], site: [168, 146, 134], roof: [118, 122, 130] }
    },
    carve(fill, ramp) {
      fill(18, 2, 28, 6, 'C');
      fill(16, 3, 17, 6, '.'); ramp(14, 3, 15, 6, 'W', 0, 1);
      fill(29, 3, 31, 8, '.');
      fill(3, 4, 13, 13, 'a'); fill(3, 4, 5, 6, '#'); fill(3, 4, 5, 5, 'i', 1); fill(4, 6, 4, 6, 'i', 1); fill(6, 5, 6, 5, 'j', 2.0);
      fill(16, 11, 18, 11, '.'); ramp(14, 10, 15, 12, 'W', 0, 1);
      fill(19, 7, 23, 20, '.'); fill(19, 19, 28, 21, '.'); fill(24, 20, 28, 31, '.');
      fill(19, 7, 19, 7, '#'); fill(23, 7, 23, 7, '#');
      fill(14, 32, 31, 36, 'T');
      fill(4, 16, 8, 31, '.'); ramp(4, 14, 8, 15, 'N', 0, 1);
      fill(9, 30, 13, 34, '.');
      fill(32, 8, 43, 17, 'b'); fill(38, 8, 43, 12, 'r'); fill(35, 11, 36, 12, '#');
      ramp(40, 14, 43, 15, 'S', 0, 1.5); fill(40, 16, 43, 17, '3'); ramp(41, 10, 43, 12, 'N', 0, 2, 'r'); fill(41, 8, 43, 9, 'r', 2.0);
      fill(24, 14, 29, 14, '.'); fill(24, 13, 29, 15, '.'); fill(30, 14, 31, 14, '.');
      // túnel leste afundando 2 m
      fill(37, 18, 42, 18, '.'); ramp(37, 19, 42, 21, 'N', -2, 0); fill(37, 22, 42, 27, 't', -2); ramp(37, 28, 42, 30, 'S', -2, 0); fill(37, 31, 42, 31, '.');
      fill(32, 31, 36, 34, '.');
      fill(24, 31, 24, 31, '#'); fill(28, 31, 28, 31, '#');
    },
    props(a) {
      const c = a.c;
      a.block(c(10), c(7), 2.4, 1.2, 2.4, 'stoneWall', 0xdddddd);
      a.crate(c(5), c(11), 1.2, 2); a.crate(c(12), c(12), 1.2); a.sandbag(c(8), c(13) + 0.6, 3, 0.8);
      a.barrel(c(13) + 0.4, c(5) - 0.4); a.barrel(c(13) + 0.4, c(7));
      a.block(c(39), c(9), 2.4, 1.2, 1.2, 'planks', 0xd8c070); a.block(c(39), c(9) - 0.3, 1.2, 2.0, 0.6, 'planks', 0xd8c070);
      a.crate(c(33), c(13), 1.2, 2); a.crate(c(39) - 0.6, c(14), 1.2); a.barrel(c(43), c(13)); a.barrel(c(43), c(13) + 0.8);
      a.crate(c(21), c(14), 1.2); a.crate(c(26), c(25), 1.2, 2); a.crate(c(6), c(22), 1.2); a.barrel(c(38), c(24)); a.barrel(c(41), c(25));
      a.car(c(20), c(35) - 0.5, true, 0x8a3030); a.crate(c(27), c(35), 1.2, 2); a.crate(c(19) + 0.3, c(3), 1.2); a.crate(c(27), c(5), 1.2, 2);
      for (const [x, z] of nevadaTrees) hidden(a, x, z, 0.5, 3.5, 0.5);
      a.door(18, 11, 'E', { kind: 'wood' });      // passagem curta do A
      a.door(4, 6, 'S', { kind: 'wood' });       // capela
      a.door(31, 14, 'E', { kind: 'wood' });      // passagem curta do B
      a.gate(18, 3, 'W', 4); a.gate(28, 3, 'E', 4); a.gate(20, 6, 'S', 3);
      a.gate(14, 32, 'W', 3); a.gate(25, 32, 'N', 3); a.gate(31, 32, 'E', 3);
    },
    spots: P => ({
      tSpawn: [P(17, 34), P(23, 35), P(23, 33), P(26, 35), P(29, 34)],
      ctSpawn: [P(21, 4), P(22, 3), P(23, 5), P(25, 3), P(26, 5)],
      A: P(8, 9), B: P(38, 13),
      plantA: [P(8, 8), P(7, 11), P(11, 9), P(10, 5)], plantB: [P(37, 10), P(34, 9), P(39, 10), P(34, 15)],
      routes: {
        A: [[P(12, 32), P(6, 26), P(6, 18), P(6, 15), P(8, 9)], [P(26, 30), P(26, 21), P(21, 15), P(17, 11), P(9, 9)]],
        B: [[P(33, 32), P(39, 29), P(39, 24), P(39, 19), P(37, 12)], [P(26, 30), P(26, 21), P(22, 15), P(28, 14), P(35, 13)]]
      },
      holdA: [P(9, 12, 180), P(4, 9, 160), P(12, 6, -120), P(7, 5, 150)], holdB: [P(38, 9, 180), P(42, 10, 160), P(33, 9, 135), P(41, 16, 180)],
      holdMid: [P(21, 8, 180), P(22, 10, 180)],
      postA: [P(10, 12, 180), P(4, 7, 135), P(12, 8, -90), P(7, 12, 0)], postB: [P(37, 16, 180), P(42, 9, 135), P(33, 11, 90), P(39, 11, 180)],
      lurk: [P(24, 24, 0), P(6, 24, 0), P(39, 31, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.letter('A', c(6), 2.4, 16 * S + 0.03, 0, 0, 2.2);
      d.letter('B', 37 * S + 0.03, 2.8, c(17) - 0.5, 0, Math.PI / 2, 2.0);
      for (const [x, z] of nevadaTrees) d.tree(x, z, 1.2, true);
      for (const [x, z] of [[c(19) + 0.3, c(9)], [c(23) - 0.3, c(16)], [c(24) + 0.3, c(28)], [c(4) + 0.3, c(20)], [c(42) - 0.3, c(18)]]) d.lamp(x, z, 4.2, 0xffd890);
      const st = new THREE.MeshLambertMaterial({ map: G.Tex.get('stoneWall') });
      const tw = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 6), st); tw.position.set(c(4), 10, c(5)); tw.castShadow = true; d.group.add(tw);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 5, 4), new THREE.MeshLambertMaterial({ color: 0x5a3a2a })); roof.position.set(c(4), 16.5, c(5)); roof.rotation.y = Math.PI / 4; d.group.add(roof);
      d.awning(c(40), 13 * S - 0.6, 5, 1.4, Math.PI, 3.4, 0x7a9ab8);
    }
  });

  // =====================================================================
  const colTrees = [[76.5, 40.5], [76.5, 73.5], [28.5, 4.5]];
  M.register({
    id: 'colonial', name: 'Bairro Colonial', place: 'Cidade antiga · fim de tarde', tag: 'Reformado',
    desc: 'Praça com chafariz e terraço no A, passagem subterrânea até o pátio do B e portas na arcada e no portão do pátio.',
    theme: {
      mats: { wall: 'brick', roof: 'roofRed', ground: 'cobble', ground2: 'cobble', spawn: 'paving', site: 'terracotta', stair: 'stone', upper: 'planks', tunnel: 'paving', slab: 'planks', raise: 'stone', ramp: 'paving' },
      sky: ['#2f4277', '#d98a5e', '#f3c28a'], fog: 0xd99a72, fogNear: 60, fogFar: 210,
      hemi: [0xffc8a0, 0x5a4a40, 0.62], sun: [0xffa860, 1.08], sunDir: [90, 45, 25],
      wallH: [6, 1.5, 3], window: 'glass', winChance: 0.5, tintVar: 0.26, door: 'wood',
      radar: { ground: [140, 128, 118], site: [176, 110, 86], roof: [92, 82, 74] }
    },
    carve(fill, ramp) {
      fill(38, 14, 43, 24, 'T');
      fill(2, 15, 8, 23, 'C');
      fill(9, 2, 19, 10, 'A'); fill(14, 2, 19, 3, 'a'); ramp(14, 4, 19, 4, 'N', 0, 1); fill(12, 7, 13, 8, '#');
      fill(20, 4, 25, 6, 't'); fill(20, 4, 20, 4, '#'); fill(20, 6, 20, 6, '#');
      fill(26, 3, 37, 7, ','); fill(38, 3, 41, 13, '.');
      fill(20, 8, 23, 15, '.'); fill(20, 12, 25, 25, '.');
      fill(26, 16, 37, 22, ','); fill(37, 16, 37, 17, '#'); fill(37, 21, 37, 22, '#');
      fill(9, 17, 19, 21, '.'); fill(9, 17, 9, 17, '#'); fill(9, 21, 9, 21, '#');
      ramp(20, 26, 23, 29, 'N', -2, 0);                     // descida para a passagem subterrânea
      fill(23, 21, 24, 22, '2'); ramp(23, 23, 24, 24, 'N', 0, 1);   // coreto
      fill(8, 28, 17, 35, 'b'); fill(8, 28, 8, 28, 'j'); fill(8, 30, 8, 30, 'j');
      ramp(18, 30, 20, 32, 'W', -2, 0, 't'); fill(21, 30, 22, 32, 't', -2); ramp(23, 30, 25, 32, 'E', -2, 0, 't');
      fill(26, 29, 37, 34, ','); fill(38, 25, 41, 34, '.');
      fill(3, 5, 8, 14, '.'); fill(3, 14, 4, 14, '#'); fill(8, 14, 8, 14, '#');
      fill(3, 24, 7, 30, '.'); fill(3, 24, 3, 24, '#'); fill(7, 24, 7, 24, '#');
    },
    props(a) {
      const c = a.c;
      a.block(c(16), c(8) + 0.5, 2.6, 0.9, 2.6, 'stoneWall', 0xd8d0c4);
      a.car(c(11), c(3), true, 0x2a4a6a); a.crate(c(18), c(6), 1.2); a.barrel(c(9) + 0.5, c(10)); a.sandbag(c(19), c(9), 0.8, 2.4);
      a.block(c(22), c(19), 1.6, 2.5, 1.6, 'stoneWall', 0xcfc8bc);
      a.car(c(30), c(17), true, 0x6a2a2a); a.car(c(34), c(21), true, 0x2a5a3a);
      a.block(c(27), c(20) + 0.5, 2.6, 1.0, 1.4, 'planks', 0xb08060); a.block(c(35), c(18) - 0.5, 2.6, 1.0, 1.4, 'planks', 0xb08060);
      a.block(c(12), c(31), 1.8, 1.0, 1.8, 'stoneWall', 0xd0c8bc);
      a.car(c(15), c(34), true, 0x5a4a3a); a.crate(c(10), c(29) - 0.4, 1.2, 2); a.crate(c(17), c(35) - 0.3, 1.2); a.barrel(c(16) + 0.5, c(28));
      a.crate(c(24), c(14), 1.2); a.crate(c(21), c(24), 1.2, 2); a.crate(c(28), c(7) + 0.4, 1.2); a.crate(c(28), c(33) + 0.4, 1.2, 2);
      a.crate(c(41), c(15), 1.2, 2); a.crate(c(4), c(16), 1.2);
      for (const [x, z] of colTrees) hidden(a, x, z, 0.5, 3.5, 0.5);
      a.door(20, 5, 'W', { kind: 'wood' });                  // porta da arcada para o A
      a.door(8, 29, 'W', { kind: 'wood' });                  // portão do pátio do B
      a.gate(38, 14, 'N', 4); a.gate(38, 24, 'S', 4); a.gate(38, 18, 'W', 3);
      a.gate(5, 15, 'N', 3); a.gate(4, 23, 'S', 3); a.gate(8, 18, 'E', 3);
    },
    spots: P => ({
      tSpawn: [P(40, 17), P(41, 18), P(39, 20), P(42, 21), P(40, 23)],
      ctSpawn: [P(4, 18), P(5, 18), P(3, 20), P(6, 21), P(4, 22)],
      A: P(14, 5), B: P(12, 33),
      plantA: [P(14, 6), P(11, 9), P(17, 5), P(18, 9)], plantB: [P(10, 31), P(14, 31), P(11, 34), P(16, 29)],
      routes: {
        A: [[P(39, 10), P(36, 5), P(28, 5), P(22, 5), P(15, 6)], [P(35, 19), P(27, 18), P(22, 13), P(21, 9), P(13, 9)]],
        B: [[P(39, 28), P(36, 31), P(28, 31), P(21, 31), P(13, 31)], [P(35, 19), P(27, 18), P(22, 24), P(21, 28), P(15, 30)]]
      },
      holdA: [P(10, 8, -90), P(16, 3, -100), P(11, 4, -80), P(15, 10, -60)], holdB: [P(10, 30, -90), P(14, 35, -70), P(9, 33, -90), P(11, 28, -110)],
      holdMid: [P(19, 19, -90), P(12, 19, -90)],
      postA: [P(18, 5, 90), P(12, 10, 90), P(16, 2, 180), P(18, 9, 90)], postB: [P(16, 31, 90), P(15, 33, 90), P(12, 29, 120), P(17, 33, 90)],
      lurk: [P(22, 14, 90), P(22, 23, 90), P(30, 21, 90)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.letter('A', 26 * S - 0.03, 2.8, c(4), 0, -Math.PI / 2, 2.2);
      d.letter('B', 26 * S - 0.03, 2.2, c(29) + 1, 0, -Math.PI / 2, 2.0);
      for (const [x, z] of colTrees) d.tree(x, z, 1.1, false);
      for (const [x, z] of [[c(27), c(16) - 1], [c(31), c(22) + 1], [c(35), c(16) - 1], [c(27), c(29) - 1], [c(33), c(34) + 1], [c(28), c(3) - 1], [c(12), c(17) - 1]]) d.lamp(x, z, 4.6, 0xffcf80);
      d.awning(c(27), 16 * S + 0.6, 4, 1.4, 0, 3.4, 0x2e6a4a); d.awning(c(35), 16 * S + 0.6, 4, 1.4, 0, 3.4, 0x8a2a3a);
      d.awning(c(31), 23 * S - 0.6, 5, 1.4, Math.PI, 3.6, 0x2a4a8a); d.awning(c(10), 2 * S + 0.6, 5, 1.4, 0, 3.6);
    }
  });

  // =====================================================================
  M.register({
    id: 'usina', name: 'Usina Nuclear Vulcano', place: 'Complexo nuclear · reator na piscina', tag: 'Reformado', houses: 0, ladderCount: 2,
    desc: 'O reator fica submerso numa piscina letal no subsolo (B): quem cair morre. Passarelas sobre a piscina, sala de bombas, pátio dos transformadores no A e o salão do turbogerador. Torres de refrigeração e o prédio de contenção ao fundo.',
    theme: {
      mats: { wall: 'concrete', roof: 'concrete', ground: 'asphalt', ground2: 'steelPlate', spawn: 'darkTiles', site: 'darkTiles', stair: 'steelPlate', upper: 'grate', tunnel: 'steelPlate', slab: 'grate', raise: 'concrete', ramp: 'steelPlate', pool: 'darkTiles' },
      sky: ['#6c7480', '#a8acae', '#d2c8b4'], fog: 0xb8b2a4, fogNear: 50, fogFar: 190,
      hemi: [0xd8dce0, 0x6a6258, 0.82], sun: [0xfff0dc, 0.7], sunDir: [-50, 85, 35],
      wallH: [7, 2, 3], window: 'industrial', winChance: 0.4, tintVar: 0.16, door: 'metal', gate: 0x8a6a2a,
      water: 0x2ad8ee, waterGlow: 0x0a5a66, waterOpacity: 0.8, waterFx: 0xbff4ff, deadName: 'Piscina do reator',
      radar: { ground: [110, 112, 116], site: [150, 110, 88], roof: [70, 72, 78] }
    },
    carve(fill, ramp) {
      fill(18, 2, 27, 6, 'C');
      fill(9, 3, 17, 4, '.'); ramp(9, 5, 11, 8, 'N', -3, 0, 't');         // rampa coberta CT -> B
      fill(28, 3, 28, 5, '.'); ramp(29, 3, 29, 5, 'E', 0, 1);              // CT -> A
      fill(30, 3, 42, 12, 'a'); fill(40, 3, 42, 4, 'u', 2.5); ramp(40, 5, 42, 6, 'N', 1, 2.5);   // passarela do A
      fill(4, 9, 15, 17, 'r', -3);                                        // salão do reator (B), subterrâneo
      fill(4, 9, 8, 9, '#'); fill(12, 9, 15, 9, '#');
      fill(6, 14, 6, 14, '#'); fill(14, 11, 14, 11, '#');                 // pilares
      fill(7, 12, 12, 14, 'k', -6);                                       // PISCINA DO REATOR (letal)
      fill(7, 11, 12, 11, 'r', -2.0); fill(7, 15, 12, 15, 'r', -2.0);     // passarelas sobre a piscina
      ramp(6, 11, 6, 11, 'E', -3, -2, 'r'); ramp(13, 11, 13, 11, 'W', -3, -2, 'r');
      ramp(6, 15, 6, 15, 'E', -3, -2, 'r'); ramp(13, 15, 13, 15, 'W', -3, -2, 'r');
      fill(2, 18, 5, 24, 't', -3); ramp(2, 25, 5, 28, 'S', -3, 0, 't');   // túnel de ventilação
      fill(4, 18, 5, 18, 't', -3);
      ramp(16, 13, 19, 15, 'E', -3, 0, 't');                              // rampa do meio -> B
      fill(20, 7, 25, 31, '.'); fill(20, 7, 20, 7, '#'); fill(25, 7, 25, 7, '#'); fill(20, 31, 20, 31, '#'); fill(25, 31, 25, 31, '#');
      fill(27, 10, 29, 16, 'i'); fill(26, 14, 26, 14, 'i'); fill(26, 11, 26, 11, 'j'); fill(26, 16, 26, 16, 'j'); ramp(28, 10, 29, 11, 'E', 0, 1, 'i');   // salão de turbinas
      fill(36, 15, 43, 31, '.'); ramp(36, 13, 42, 14, 'N', 0, 1);
      fill(14, 32, 31, 36, 'T');
      fill(6, 28, 13, 33, '.'); fill(2, 29, 5, 30, '.');
      fill(32, 30, 36, 35, '.');
      fill(30, 22, 35, 25, ',');
    },
    props(a) {
      const c = a.c;
      // A: pátio dos transformadores, torre de água de refrigeração
      a.furn('waterTank', c(38), c(5), 0); a.furn('transformer', c(33), c(10), 180); a.furn('transformer', c(35) + 1.1, c(10), 180);
      a.crate(c(35), c(4), 1.2, 2); a.crate(c(41), c(10), 1.2); a.crate(c(41) - 1.2, c(10), 1.2); a.barrel(c(31), c(5)); a.barrel(c(31) + 0.6, c(5) + 0.8);
      a.block(c(36), c(9), 3, 1.1, 1.4, 'steelPlate', 0x9aa0a4);
      // B: o reator dentro da piscina e as bombas d'água
      a.furn('reactorPool', 30, 40.5, 0, { y: -6 });
      a.furn('bigPump', c(5), c(16), 0, { n: 1 }); a.furn('bigPump', c(14), c(16), 270, { n: 2, color: 'red' });
      a.crate(c(15), c(10), 1.2, 2); a.crate(c(5), c(10), 1.2); a.barrel(c(10), c(10)); a.barrel(c(10) + 0.8, c(10));
      // meio e pátio
      a.crate(c(21) - 0.3, c(18), 1.2, 2); a.crate(c(23), c(24), 1.2); a.block(c(22), c(12), 2.6, 1.0, 1.0, 'concrete', 0xb0aaa0);
      a.container(c(39), c(22), false, 0x8a6a2a); a.crate(c(42), c(28), 1.2, 2); a.barrel(c(37), c(17)); a.crate(c(32), c(23), 1.2);
      a.crate(c(10), c(30), 1.2, 2); a.car(c(28), c(34), true, 0x4a5a6a); a.crate(c(19) + 0.3, c(3), 1.2);
      a.furn('turbine', c(28) + 1.2, c(14) + 1.6, 0);          // turbogerador
      a.door(26, 14, 'W', { kind: 'metal' });                  // salão de turbinas
      a.door(4, 18, 'N', { width: 2, kind: 'metal' });         // ventilação -> salão do reator
      a.gate(18, 3, 'W', 2); a.gate(27, 3, 'E', 3); a.gate(21, 6, 'S', 4);
      a.gate(21, 32, 'N', 4); a.gate(14, 32, 'W', 2); a.gate(31, 32, 'E', 4);
    },
    spots: P => ({
      tSpawn: [P(17, 34), P(20, 35), P(23, 34), P(26, 35), P(29, 34)],
      ctSpawn: [P(19, 4), P(21, 3), P(23, 5), P(24, 3), P(26, 5)],
      A: P(36, 7), B: P(5, 13),
      plantA: [P(36, 7), P(33, 5), P(39, 10), P(34, 11)], plantB: [P(5, 13), P(5, 12), P(14, 13), P(9, 11)],
      routes: {
        A: [[P(33, 33), P(39, 28), P(39, 18), P(39, 14), P(37, 9)], [P(22, 30), P(22, 18), P(24, 14), P(27, 14), P(29, 11), P(34, 7)]],
        B: [[P(10, 31), P(4, 27), P(4, 21), P(5, 19), P(5, 15), P(5, 13)], [P(22, 30), P(22, 16), P(19, 14), P(16, 14), P(14, 14), P(13, 12)]]
      },
      holdA: [P(37, 10, 180), P(41, 7, 160), P(32, 7, 140), P(33, 4, 150)], holdB: [P(7, 10, 180), P(13, 12, -90), P(10, 16, 0), P(5, 14, 180)],
      holdMid: [P(22, 8, 180), P(23, 11, 180)],
      postA: [P(33, 11, 180), P(40, 4, 180), P(37, 11, 90), P(31, 4, 90)], postB: [P(13, 10, 0), P(7, 16, 0), P(8, 10, -90), P(12, 16, 90)],
      lurk: [P(22, 22, 0), P(41, 25, 0), P(4, 22, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      // chaminés, torres de refrigeração com vapor e o prédio de contenção do reator (fora do mapa)
      d.cyl(1.2, 26, -6, 13, 30, 0x8a8478, 'concrete'); d.cyl(1.2, 26, -6, 13, 60, 0x8a8478, 'concrete');
      d.coolingTower(185, 22, 1); d.coolingTower(196, 82, 1.1);
      d.containment(112, -42, 1);
      d.pipe(c(44) + 2, c(8), 175, c(8), 6, 0.9, 0x5a7a9a); d.pipe(c(44) + 2, c(27), 185, c(27), 5, 0.9, 0x5a7a9a);
      // piscina do reator: brilho ciano, faixas de perigo, placas e guindaste de manutenção
      d.glow(30, -4.6, 40.5, 0x40e8ff, 1.6, 30); d.glow(30, -0.4, 40.5, 0x40e8ff, 0.6, 16);
      d.box(0.4, 0.03, 9.4, 20.8, -2.985, 40.5, 0xffffff, 'hazard'); d.box(0.4, 0.03, 9.4, 39.2, -2.985, 40.5, 0xffffff, 'hazard');
      d.box(18, 0.03, 0.3, 30, -1.985, 35.82, 0xffffff, 'hazard'); d.box(18, 0.03, 0.3, 30, -1.985, 45.18, 0xffffff, 'hazard');
      d.sign('CUIDADO · PISCINA DO REATOR · QUEDA FATAL', '#f0d020', '#111111', 'rad', 12.03, -1.6, c(13), Math.PI / 2, 3.2, 0.95);
      d.sign('CUIDADO · PISCINA DO REATOR · QUEDA FATAL', '#f0d020', '#111111', 'rad', 16 * S - 0.03, -1.6, c(11), -Math.PI / 2, 3.2, 0.95);
      d.box(0.7, 0.6, 11, 21, 1.0, 40.5, 0xd8a72a, 'metal'); d.box(0.7, 0.6, 11, 39, 1.0, 40.5, 0xd8a72a, 'metal');
      d.box(18.4, 0.7, 0.8, 30, 1.05, 37.2, 0xd8a72a, 'metal'); d.box(1.6, 0.9, 1.4, 27, 0.4, 37.2, 0x3a3e44, 'metal'); d.cyl(0.05, 2.4, 27, -1.1, 37.2, 0x222222); d.box(0.5, 0.5, 0.5, 27, -2.45, 37.2, 0xd8a72a, 'metal');
      d.sign('SALA DO REATOR · CIRCUITO PRIMÁRIO', '#2a5a8a', '#ffffff', null, c(10), -0.9, 10 * S + 0.03, 0, 2.6, 0.8);
      d.pipe(c(4) - 1, 10 * S + 0.45, c(8) + 1, 10 * S + 0.45, 0.85, 0.24, 0x2f5f8f); d.pipe(c(12) - 1, 10 * S + 0.45, c(15) + 1, 10 * S + 0.45, 0.85, 0.24, 0x2f5f8f);
      d.pipe(c(5), 18 * S - 0.45, c(15) + 1, 18 * S - 0.45, 0.6, 0.3, 0x3a8a5a); d.pipe(4 * S + 0.45, c(10), 4 * S + 0.45, c(17), 0.9, 0.2, 0xa8302a);
      d.fan(16 * S - 0.1, -1.6, c(11), -Math.PI / 2, 0.7); d.fan(16 * S - 0.1, -1.6, c(17), -Math.PI / 2, 0.7);
      d.sign('PERIGO ALTA TENSÃO', '#f0d020', '#111111', 'volt', 26 * S + 0.03, 2.4, c(12), -Math.PI / 2, 1.4, 0.7);
      d.sign('SALÃO DO TURBOGERADOR', '#e8e4dc', '#1a1a1a', null, 26 * S - 0.03, 3.2, c(15), -Math.PI / 2, 2.2, 0.6);
      d.sign('PÁTIO DOS TRANSFORMADORES', '#e8e4dc', '#1a1a1a', null, c(36), 4.4, 3 * S + 0.03, 0, 2.6, 0.6);
      d.pipe(c(20), 15 * S, c(25), 15 * S, 4.5, 0.35, 0x8a3a2a); d.pipe(c(36), 13 * S, c(43), 13 * S, 3.8, 0.3, 0x3a6a8a);
      d.pipe(c(9), 3 * S + 0.4, c(17), 3 * S + 0.4, 3.4, 0.25, 0x6a6a30);
      for (const [x, z] of [[c(22), c(20)], [c(39), c(20)], [c(10), c(31)], [c(5), c(10)], [c(14), c(10)]]) d.lamp(x, z, 4.2, 0xfff0c0);
      d.letter('B', c(5), -2.97, c(13), -Math.PI / 2, 0, 2.4);
      d.letter('A', c(39), 2.2, 13 * S + 0.03, 0, 0, 2.0);
    }
  });

  // =====================================================================
  M.register({
    id: 'ferro', name: 'Pátio Ferroviário', place: 'Interior · estação de cargas', tag: 'Novo',
    desc: 'Vagões de carga parados no A, armazém com três portas no B e uma vala de trilhos rebaixada atravessando o meio.',
    theme: {
      mats: { wall: 'brick', roof: 'corrugated', ground: 'sand', ground2: 'rail', spawn: 'concrete', site: 'darkTiles', stair: 'concrete', upper: 'grate', tunnel: 'concrete', slab: 'grate', raise: 'concrete', ramp: 'concrete' },
      sky: ['#5a8ac0', '#a8c4dc', '#e8dcc4'], fog: 0xd2c8b2, fogNear: 60, fogFar: 220,
      hemi: [0xd8e4f0, 0x8a7a60, 0.75], sun: [0xfff2dc, 0.95], sunDir: [60, 80, 50],
      wallH: [5.5, 1.5, 3], window: 'glass', winChance: 0.35, tintVar: 0.2, door: 'metal', gate: 0x5a6a5a,
      radar: { ground: [146, 136, 116], site: [160, 110, 90], roof: [80, 78, 74] }
    },
    carve(fill, ramp) {
      fill(2, 14, 7, 24, 'T');
      fill(38, 13, 43, 23, 'C');
      fill(3, 4, 6, 13, '.'); fill(7, 3, 19, 8, '.');
      fill(20, 2, 34, 10, 'A'); fill(20, 3, 34, 3, 'A'); fill(28, 2, 29, 2, '#');
      fill(35, 3, 40, 12, '.');
      fill(24, 11, 26, 15, '.');
      fill(8, 16, 37, 19, '.');
      fill(12, 20, 33, 22, ',', -1.5); ramp(10, 20, 11, 22, 'W', -1.5, 0); ramp(34, 20, 35, 22, 'E', -1.5, 0);   // vala dos trilhos
      fill(8, 20, 9, 22, '.'); fill(36, 20, 37, 22, '.');
      fill(8, 16, 8, 17, '#'); fill(37, 16, 37, 17, '#'); fill(8, 21, 8, 22, '#'); fill(37, 21, 37, 22, '#');
      fill(22, 23, 24, 27, '.');
      fill(32, 11, 33, 12, 'u'); ramp(32, 13, 33, 15, 'N', 0, 2);   // torre de sinalização
      fill(18, 33, 18, 33, 'j');
      fill(18, 28, 30, 35, 'r'); fill(22, 28, 22, 28, '#'); fill(24, 28, 24, 28, '#');
      fill(3, 25, 6, 33, '.'); fill(7, 29, 17, 33, '.');
      fill(18, 29, 18, 30, '#'); fill(18, 32, 18, 35, '#');
      fill(35, 24, 40, 33, '.'); fill(31, 30, 34, 30, '.');
      fill(30, 28, 30, 29, '#'); fill(30, 31, 30, 35, '#');
      fill(3, 13, 3, 13, '#'); fill(3, 25, 3, 25, '#');
    },
    props(a) {
      const c = a.c;
      // vagões no A
      a.prop(c(24), c(4), 12, 3.0, 2.8, 'container', null, { color: 0x6a3a2a });
      a.prop(c(30) + 1, c(8), 12, 3.0, 2.8, 'container', null, { color: 0x2a4a6a });
      a.crate(c(32), c(5), 1.2, 2); a.crate(c(21), c(8), 1.2); a.barrel(c(27), c(10)); a.barrel(c(27) + 0.8, c(10));
      // meio
      a.prop(c(21), c(21), 9, 2.6, 2.6, 'container', null, { color: 0x4a5a3a });
      a.crate(c(16), c(17), 1.2); a.crate(c(29), c(18), 1.2, 2); a.barrel(c(13), c(16) - 0.5);
      // armazém B
      a.block(c(20), c(33), 1.0, 3.2, 5.4, 'planks', 0x8a6a4a); a.block(c(28), c(33), 1.0, 3.2, 5.4, 'planks', 0x8a6a4a);
      a.crate(c(25), c(31), 1.2, 2); a.crate(c(23), c(34), 1.2); a.block(c(27), c(29), 2.2, 1.4, 1.4, 'steelPlate', 0xd8a020);
      a.crate(c(12), c(31), 1.2, 2); a.car(c(10), c(5), true, 0x3a4a5a); a.crate(c(38), c(28), 1.2, 2); a.crate(c(38), c(7), 1.2);
      a.door(18, 31, 'W', { kind: 'metal' }); a.door(30, 30, 'E', { kind: 'metal' }); a.door(23, 28, 'N', { kind: 'wood' });
      a.gate(3, 14, 'N', 4); a.gate(3, 24, 'S', 4); a.gate(8, 18, 'W', 3);
      a.gate(38, 13, 'N', 3); a.gate(38, 23, 'S', 3); a.gate(38, 18, 'W', 3);
    },
    spots: P => ({
      tSpawn: [P(3, 16), P(5, 18), P(4, 20), P(6, 22), P(3, 23)],
      ctSpawn: [P(40, 15), P(41, 17), P(39, 19), P(42, 21), P(40, 22)],
      A: P(27, 6), B: P(24, 32),
      plantA: [P(27, 6), P(23, 9), P(32, 3), P(29, 10)], plantB: [P(24, 32), P(20, 30), P(26, 34), P(26, 29)],
      routes: {
        A: [[P(5, 10), P(10, 6), P(17, 5), P(22, 6)], [P(10, 18), P(20, 18), P(25, 15), P(25, 12), P(26, 8)]],
        B: [[P(5, 28), P(10, 31), P(16, 31), P(21, 31)], [P(10, 18), P(18, 18), P(23, 24), P(23, 27), P(24, 31)]]
      },
      holdA: [P(33, 6, 90), P(29, 3, 110), P(33, 10, 70), P(26, 10, 0)], holdB: [P(28, 31, 90), P(21, 33, 60), P(25, 29, 0), P(29, 33, 120)],
      holdMid: [P(36, 18, 90), P(30, 17, 90)],
      postA: [P(22, 3, -90), P(28, 10, 180), P(23, 6, -90), P(31, 10, -60)], postB: [P(20, 29, -90), P(22, 34, -90), P(27, 33, 0), P(19, 33, -60)],
      lurk: [P(12, 7, 0), P(12, 30, 0), P(15, 18, -90)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      // trilhos
      const rm = new THREE.MeshLambertMaterial({ color: 0x8a8d90 }), sm = new THREE.MeshLambertMaterial({ color: 0x4a3422 });
      const track = (x1, x2, z, y) => {
        for (const o of [-0.72, 0.72]) { const r = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, 0.12, 0.08), rm); r.position.set((x1 + x2) / 2, y + 0.12, z + o); d.group.add(r); }
        for (let x = x1; x < x2; x += 0.9) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 2.2), sm); s.position.set(x, y + 0.04, z); d.group.add(s); }
      };
      track(20 * S, 35 * S, c(4), 0); track(20 * S, 35 * S, c(8), 0); track(12 * S, 34 * S, c(21), -1.5);
      // rodas dos vagões
      const wm = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
      for (const [x, z] of [[c(24), c(4)], [c(30) + 1, c(8)], [c(21), c(21)]]) for (const dx of [-4, -2.6, 2.6, 4]) for (const dz of [-1.0, 1.0]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 12), wm); w.rotation.x = Math.PI / 2; w.position.set(x + dx, M.groundAt(x + dx, z + dz * 1.6) + 0.1, z + dz * 1.32); d.group.add(w);
      }
      for (const [x, z] of [[c(14), c(16) - 1], [c(31), c(16) - 1], [c(9), c(30)], [c(37), c(26)]]) d.lamp(x, z, 5, 0xffeec0);
      d.letter('A', 20 * S + 0.03, 3, c(6), 0, Math.PI / 2, 2.2);
      d.letter('B', c(23) - 2, 3, 28 * S + 0.03, 0, 0, 2.0);
      d.box(8, 1.2, 0.3, c(23), 5.5, 28 * S - 0.4, 0x2a3a2a).material.map = null;
    }
  });

  // =====================================================================
  const palms = [[c0(9), c0(13)], [c0(16), c0(13)], [c0(27), c0(13)], [c0(34), c0(24)], [c0(13), c0(25)], [c0(28), c0(26)]];
  function c0(i) { return i * 3 + 1.5; }
  M.register({
    id: 'templo', name: 'Templo das Areias', place: 'Deserto · ruínas às margens do canal', tag: 'Novo',
    desc: 'Um canal de água rasa divide o mapa. Três travessias com rampas, corredor interno do templo com portas, colunas no A e o pátio das palmeiras no B.',
    theme: {
      mats: { wall: 'sandstone', roof: 'roofTop', ground: 'sand', ground2: 'paving', spawn: 'paving', site: 'hiero', stair: 'sandstone', upper: 'sandstone', tunnel: 'paving', slab: 'sandstone', raise: 'sandstone', ramp: 'sandstone', canal: 'stone' },
      sky: ['#4f8ad0', '#9cc4e6', '#f2dfb8'], fog: 0xe6d6b4, fogNear: 70, fogFar: 240,
      hemi: [0xd0e4f8, 0xc8a070, 0.78], sun: [0xfff0d0, 1.05], sunDir: [-60, 95, -30],
      wallH: [5.5, 2, 3], window: 'arch', winChance: 0.42, tintVar: 0.18, door: 'wood', gate: 0x7a5a32, water: 0x2f7a86,
      radar: { ground: [170, 146, 104], site: [184, 128, 92], roof: [118, 100, 76] }
    },
    carve(fill, ramp) {
      fill(38, 14, 43, 23, 'T');
      fill(2, 15, 6, 23, 'C');
      // canal
      fill(20, 2, 22, 35, 'w');
      // margem oeste
      fill(6, 3, 16, 11, 'A'); fill(8, 3, 11, 5, '2'); ramp(8, 6, 11, 6, 'N', 0, 1);
      fill(17, 4, 19, 29, '.');
      ramp(18, 5, 19, 6, 'W', -1, 0); ramp(18, 17, 19, 19, 'W', -1, 0); ramp(18, 30, 19, 31, 'W', -1, 0);
      fill(7, 15, 16, 21, '.'); fill(7, 15, 7, 16, '#'); fill(7, 20, 7, 21, '#');
      fill(7, 27, 17, 35, 'B'); fill(7, 27, 7, 27, 'j'); fill(7, 29, 7, 29, 'j'); fill(7, 30, 7, 30, '#'); fill(17, 30, 19, 31, '.'); ramp(18, 30, 19, 31, 'W', -1, 0);
      fill(2, 6, 5, 14, '.'); fill(2, 24, 6, 30, '.');
      // margem leste
      fill(23, 4, 37, 8, ','); ramp(23, 5, 24, 6, 'E', -1, 0);
      fill(23, 15, 37, 21, ','); ramp(23, 17, 24, 19, 'E', -1, 0); fill(37, 15, 37, 16, '#'); fill(37, 20, 37, 21, '#');
      fill(23, 29, 37, 33, ','); ramp(23, 30, 24, 31, 'E', -1, 0);
      fill(38, 4, 41, 13, '.'); fill(38, 24, 41, 33, '.');
      fill(31, 9, 31, 14, 'i');                                         // corredor do templo
      fill(23, 12, 26, 13, 'u'); ramp(25, 9, 26, 11, 'S', 0, 2);        // mirante sobre o canal
      fill(2, 14, 2, 14, '#'); fill(6, 24, 6, 24, '#');
    },
    props(a) {
      const c = a.c;
      // colunas do A
      for (const [i, j] of [[7, 4], [14, 4], [7, 10], [14, 10]]) a.block(c(i), c(j), 1.1, 5.2, 1.1, 'sandstone', 0xe0c896);
      a.block(c(12), c(9), 2.2, 1.0, 1.2, 'hiero', 0xffffff); a.crate(c(15), c(7), 1.2); a.barrel(c(6) + 0.5, c(8)); a.barrel(c(6) + 0.5, c(9));
      // obelisco e estátuas
      a.block(c(30), c(18), 1.6, 9, 1.6, 'hiero', 0xe6d0a0);
      a.block(c(17), c(12), 1.4, 3.2, 1.4, 'sandstone', 0xd8c090); a.block(c(17), c(25), 1.4, 3.2, 1.4, 'sandstone', 0xd8c090);
      a.block(c(12), c(18), 2.2, 1.1, 2.2, 'sandstone', 0xd0b888);
      // B
      a.block(c(12), c(31), 2.4, 1.0, 2.4, 'stoneWall', 0xd8c8a8); a.crate(c(9), c(33), 1.2, 2); a.crate(c(15), c(28), 1.2); a.barrel(c(16) + 0.5, c(34)); a.barrel(c(16), c(34) - 0.8);
      a.crate(c(27), c(4), 1.2, 2); a.crate(c(34), c(31), 1.2); a.crate(c(26), c(17), 1.2); a.barrel(c(40), c(8)); a.crate(c(40), c(29), 1.2, 2);
      for (const [x, z] of palms) hidden(a, x, z, 0.5, 5, 0.5);
      a.door(31, 9, 'N', { kind: 'wood' }); a.door(31, 14, 'S', { kind: 'wood' });
      a.door(7, 28, 'W', { kind: 'wood' });
      a.gate(2, 15, 'N', 4); a.gate(2, 23, 'S', 5); a.gate(7, 17, 'W', 3);
      a.gate(38, 14, 'N', 4); a.gate(38, 23, 'S', 4); a.gate(38, 17, 'W', 3);
    },
    spots: P => ({
      tSpawn: [P(40, 16), P(41, 18), P(39, 20), P(42, 21), P(40, 22)],
      ctSpawn: [P(3, 16), P(4, 18), P(3, 20), P(5, 21), P(4, 22)],
      A: P(13, 8), B: P(12, 32),
      plantA: [P(13, 8), P(9, 9), P(15, 4), P(15, 10)], plantB: [P(12, 33), P(9, 29), P(15, 34), P(10, 34)],
      routes: {
        A: [[P(39, 10), P(36, 6), P(27, 6), P(23, 6), P(19, 6), P(14, 7)], [P(35, 18), P(26, 18), P(23, 18), P(19, 18), P(18, 12), P(14, 9)]],
        B: [[P(39, 28), P(35, 31), P(27, 31), P(23, 31), P(19, 31), P(13, 31)], [P(35, 18), P(26, 18), P(23, 18), P(19, 18), P(18, 26), P(15, 30)]]
      },
      holdA: [P(9, 8, -90), P(12, 4, -100), P(14, 11, -70), P(8, 10, -80)], holdB: [P(9, 31, -90), P(12, 35, -60), P(10, 28, -120), P(15, 33, -90)],
      holdMid: [P(15, 18, -90), P(10, 17, -90)],
      postA: [P(15, 5, 90), P(13, 10, 90), P(10, 9, 90), P(16, 7, 120)], postB: [P(16, 32, 90), P(14, 28, 120), P(11, 34, 90), P(16, 29, 90)],
      lurk: [P(31, 11, 0), P(27, 31, 90), P(30, 16, 90)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      for (const [x, z] of palms) d.tree(x, z, 1.0, false, true);
      d.letter('A', 17 * S - 0.03, 2.8, c(9), 0, -Math.PI / 2, 2.0);
      d.letter('B', 17 * S + 0.03, 2.8, c(28), 0, Math.PI / 2, 2.0);
      // portal do templo sobre a passagem do meio (decorativo, acima da cabeça)
      d.box(1.2, 7, 1.2, c(23) - 2, 3.5, c(16) - 1.6, 0xe0c896, 'sandstone'); d.box(1.2, 7, 1.2, c(23) - 2, 3.5, c(20) + 1.6, 0xe0c896, 'sandstone');
      d.box(1.6, 1.2, 15, c(23) - 2, 7.6, c(18), 0xe6d0a0, 'hiero');
      for (const [x, z] of [[c(17), c(16)], [c(17), c(22)], [c(24), c(14)], [c(24), c(22)]]) d.lamp(x, z, 3.6, 0xffb860);
      d.awning(c(33), 29 * S + 0.6, 5, 1.4, 0, 3.4, 0x2a5a8a); d.awning(c(11), 15 * S + 0.6, 4, 1.4, 0, 3.4, 0xa83a2a);
    }
  });

  // =====================================================================
  M.register({
    id: 'fortaleza', name: 'Fortaleza Rubra', place: 'Serra · castelo antigo', tag: 'Novo',
    desc: 'Muralha elevada percorrível sobre o pátio das armas (A), capela com janelas e coro elevado (B), claustro, praça da fonte e portões de madeira.',
    theme: {
      mats: { wall: 'stoneWall', roof: 'stone', ground: 'cobble', ground2: 'sand', spawn: 'paving', site: 'paving', stair: 'stone', upper: 'stone', tunnel: 'stone', slab: 'planks', raise: 'stoneWall', ramp: 'stone' },
      sky: ['#7d93ad', '#c4ccd4', '#e2dccf'], fog: 0xc6cad0, fogNear: 40, fogFar: 170,
      hemi: [0xd8e0ea, 0x6e6658, 0.8], sun: [0xfff2dc, 0.8], sunDir: [-70, 75, 40],
      wallH: [7, 1.5, 3], window: 'arch', winChance: 0.35, tintVar: 0.18, door: 'wood', gate: 0x5a3a24,
      radar: { ground: [128, 124, 118], site: [168, 120, 96], roof: [86, 84, 80] }
    },
    carve(fill, ramp) {
      fill(18, 2, 27, 6, 'C');
      fill(5, 3, 17, 6, '.'); fill(9, 7, 10, 8, '.');
      fill(28, 3, 43, 5, '.'); fill(28, 6, 31, 7, '.');
      ramp(42, 6, 43, 8, 'S', 0, 2); fill(42, 9, 43, 16, 'u'); ramp(42, 17, 43, 19, 'N', 0, 2);   // muralha
      fill(31, 8, 41, 17, 'A');
      fill(4, 9, 13, 16, 'r'); fill(4, 9, 6, 10, 'r', 2.0); ramp(4, 11, 6, 13, 'N', 0, 2, 'r');      // capela + coro
      fill(14, 10, 14, 10, 'j'); fill(14, 15, 14, 15, 'j'); fill(14, 12, 14, 12, '.');
      fill(15, 8, 17, 24, '.'); fill(16, 7, 16, 7, '.');
      fill(18, 11, 28, 22, '.');
      fill(21, 7, 24, 11, '.'); fill(21, 9, 24, 10, 'n');
      fill(29, 11, 29, 11, '.'); fill(30, 11, 30, 11, 'j'); fill(29, 16, 29, 16, '.'); fill(30, 16, 30, 16, 'j');
      fill(29, 13, 30, 14, '.');
      fill(21, 23, 24, 31, '.'); fill(21, 26, 24, 27, 'n');
      fill(16, 32, 29, 36, 'T');
      fill(13, 30, 15, 33, '.'); fill(2, 26, 13, 31, '.'); fill(6, 17, 9, 25, '.'); fill(6, 17, 6, 17, '#'); fill(9, 17, 9, 17, '#');
      fill(30, 30, 33, 33, '.'); fill(33, 20, 43, 31, '.'); fill(33, 18, 38, 19, '.'); fill(33, 18, 34, 18, '#'); fill(37, 18, 38, 18, '#');
      fill(26, 24, 27, 25, 'h'); fill(18, 20, 19, 20, 'h');
    },
    props(a) {
      const c = a.c;
      a.block(c(23), c(17), 3.0, 1.0, 3.0, 'stoneWall', 0xd0ccc4);
      a.crate(c(19), c(13), 1.2, 2); a.crate(c(27), c(20), 1.2); a.barrel(c(18) + 0.5, c(22)); a.barrel(c(28), c(12));
      a.crate(c(38), c(10), 1.2, 2); a.barrel(c(40), c(16) + 0.6); a.block(c(32), c(15), 2.2, 1.0, 1.2, 'planks', 0x9a7a52); a.crate(c(35), c(9), 1.2);
      a.block(c(11), c(9) + 0.2, 2.0, 1.0, 1.0, 'stoneWall', 0xe0d8c8);
      a.crate(c(8), c(24), 1.2); a.crate(c(11), c(28), 1.2, 2); a.crate(c(39), c(24), 1.2, 2); a.barrel(c(36), c(29));
      a.crate(c(19) + 0.3, c(3), 1.2); a.crate(c(16), c(20), 1.2);
      a.door(14, 12, 'W', { kind: 'wood' }); a.door(9, 8, 'S', { width: 2, kind: 'wood' }); a.door(7, 17, 'N', { width: 2, kind: 'wood' });
      a.door(35, 18, 'N', { width: 2, kind: 'wood' }); a.door(30, 13, 'E', { width: 2, kind: 'wood' });
      a.gate(18, 3, 'W', 4); a.gate(27, 3, 'E', 3); a.gate(21, 6, 'S', 4);
      a.gate(21, 32, 'N', 4); a.gate(16, 32, 'W', 2); a.gate(29, 32, 'E', 2);
    },
    spots: P => ({
      tSpawn: [P(18, 34), P(21, 35), P(23, 34), P(25, 35), P(27, 34)],
      ctSpawn: [P(19, 4), P(21, 3), P(23, 5), P(24, 3), P(26, 5)],
      A: P(36, 12), B: P(9, 13),
      plantA: [P(36, 12), P(33, 10), P(39, 15), P(34, 16)], plantB: [P(9, 13), P(11, 11), P(8, 15), P(12, 15)],
      routes: {
        A: [[P(31, 32), P(38, 27), P(36, 21), P(35, 19), P(36, 14)], [P(22, 29), P(22, 18), P(27, 14), P(29, 13), P(34, 13)]],
        B: [[P(14, 31), P(8, 28), P(8, 22), P(8, 18), P(9, 13)], [P(22, 29), P(20, 18), P(16, 15), P(14, 12), P(10, 12)]]
      },
      holdA: [P(33, 9, 135), P(40, 12, 180), P(36, 16, 180), P(42, 12, 90)], holdB: [P(5, 10, 180), P(12, 10, -90), P(9, 16, 0), P(12, 14, -90)],
      holdMid: [P(22, 8, 180), P(23, 11, 180)],
      postA: [P(38, 16, 0), P(33, 16, -30), P(40, 9, -90), P(34, 9, 180)], postB: [P(11, 15, 0), P(6, 15, 0), P(12, 9, 180), P(8, 12, -90)],
      lurk: [P(16, 21, 0), P(39, 26, 0), P(24, 20, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      const keep = d.box(14, 30, 10, c(22), 15, -8, 0x8a8478, 'stoneWall');
      d.box(16, 2, 12, c(22), 31, -8, 0x6a645a, 'stoneWall');
      for (let i = 0; i < 9; i++) d.box(0.9, 1.0, 0.9, 44 * S + 0.6, 2.0 + M.heightAt(c(43), c(9 + i)) - 1.5, c(9 + i), 0x8a8478, 'stoneWall');   // ameias da muralha
      for (const [x, z, col] of [[c(25), 11 * S + 0.6, 0x8a1a1a], [c(36), 8 * S + 0.6, 0x1a3a8a], [c(9), 9 * S + 0.6, 0x8a1a1a], [c(23), 23 * S + 0.6, 0x1a3a8a]]) d.awning(x, z, 2.2, 2.6, 0, 4.2, col);
      for (const [x, z] of [[c(15) + 0.3, c(12)], [c(28) - 0.3, c(18)], [c(31) + 0.3, c(9)], [c(21) + 0.3, c(28)], [c(33) + 0.3, c(25)]]) d.lamp(x, z, 2.6, 0xffa040);
      d.letter('A', 31 * S + 0.03, 2.6, c(9), 0, Math.PI / 2, 2.0);
      d.letter('B', 14 * S + 0.03, 3.6, c(13) + 1, 0, Math.PI / 2, 2.0);
    }
  });

  // =====================================================================
  M.register({
    id: 'neon', name: 'Distrito Neon', place: 'Metrópole · madrugada chuvosa', tag: 'Novo',
    desc: 'Bombsite A num telhado a 3 m com três acessos, mercado coberto com mezanino no B, vitrines entre a avenida e o beco e uma sacada sobre a avenida.',
    theme: {
      mats: { wall: 'concrete', roof: 'concrete', ground: 'asphalt', ground2: 'paving', spawn: 'darkTiles', site: 'darkTiles', stair: 'steelPlate', upper: 'grate', tunnel: 'concrete', slab: 'concrete', raise: 'concrete', ramp: 'steelPlate' },
      sky: ['#05070f', '#0d1428', '#1c2240'], fog: 0x0e1424, fogNear: 30, fogFar: 140,
      hemi: [0x5a6a9a, 0x14161e, 0.7], sun: [0x8aa0ff, 0.4], sunDir: [40, 90, -60],
      wallH: [7, 2.5, 3], window: 'lit', winChance: 0.55, tintVar: 0.35, weather: 'rain', door: 'metal', gate: 0x3a4a6a,
      radar: { ground: [70, 76, 92], site: [140, 90, 120], roof: [52, 56, 70] }
    },
    carve(fill, ramp) {
      fill(2, 15, 7, 23, 'T');
      fill(38, 14, 43, 22, 'C');
      fill(3, 4, 6, 14, '.'); fill(7, 4, 9, 6, '.'); ramp(10, 4, 17, 6, 'E', 0, 3);
      fill(18, 2, 28, 9, 'a', 3.0);
      fill(18, 10, 21, 13, 'p'); fill(25, 10, 28, 13, 'p'); ramp(22, 10, 24, 13, 'N', 0, 3);
      ramp(29, 4, 34, 6, 'W', 0, 3); fill(35, 4, 38, 6, '.'); fill(39, 3, 42, 13, '.');
      fill(8, 14, 37, 20, '.'); fill(20, 16, 25, 18, '#');
      fill(33, 11, 35, 13, 'u'); ramp(36, 11, 38, 13, 'W', 0, 2);
      fill(9, 21, 9, 21, '.'); fill(36, 21, 36, 21, '.'); fill(9, 22, 36, 23, '.');
      fill(12, 21, 12, 21, 'j'); fill(18, 21, 18, 21, 'j'); fill(27, 21, 27, 21, 'j'); fill(31, 21, 31, 21, 'j');
      fill(16, 26, 29, 33, 'r');
      fill(18, 24, 18, 25, '.'); fill(27, 24, 27, 25, '.');
      fill(16, 26, 16, 28, '#'); fill(16, 31, 16, 33, '#'); fill(29, 26, 29, 28, '#'); fill(29, 31, 29, 33, '#');
      fill(17, 31, 20, 33, 'r', 2.0); ramp(21, 31, 23, 33, 'W', 0, 2, 'r');
      fill(3, 24, 6, 27, '.'); fill(3, 28, 15, 31, '.');
      fill(39, 23, 42, 31, '.'); fill(30, 28, 38, 31, '.');
      fill(14, 17, 15, 17, 'h'); fill(30, 15, 31, 15, 'h');
    },
    props(a) {
      const c = a.c;
      a.car(c(13), c(14) + 0.4, true, 0x8a2030); a.car(c(30), c(20) - 0.4, true, 0x2a6a9a); a.car(c(35), c(17), false, 0xc0c0c0);
      a.block(c(11), c(22) + 0.4, 1.8, 1.3, 1.0, 'steelPlate', 0x3a6a4a); a.block(c(33), c(23) - 0.3, 1.8, 1.3, 1.0, 'steelPlate', 0x6a4a3a);
      a.block(c(26), c(3), 1.4, 1.2, 1.4, 'steelPlate', 0x9aa0a8); hidden(a, c(27), c(2), 2.6, 4, 2.6); a.crate(c(21), c(7), 1.2);
      a.block(c(21), c(28), 2.4, 1.0, 1.2, 'planks', 0x8a5a3a); a.block(c(25), c(28), 2.4, 1.0, 1.2, 'planks', 0x5a3a8a);
      a.crate(c(27), c(32), 1.2, 2); a.barrel(c(17) + 0.4, c(27)); a.crate(c(10), c(30), 1.2, 2); a.crate(c(37), c(29), 1.2);
      a.door(18, 25, 'S', { kind: 'metal' }); a.door(27, 25, 'S', { kind: 'metal' });
      a.door(16, 29, 'W', { width: 2, kind: 'metal' }); a.door(29, 29, 'E', { width: 2, kind: 'metal' });
      a.gate(3, 15, 'N', 4); a.gate(3, 23, 'S', 4); a.gate(8, 15, 'W', 6);
      a.gate(38, 14, 'N', 5); a.gate(39, 22, 'S', 4); a.gate(38, 14, 'W', 7);
    },
    spots: P => ({
      tSpawn: [P(4, 16), P(5, 18), P(3, 20), P(6, 21), P(4, 22)],
      ctSpawn: [P(40, 15), P(41, 17), P(39, 19), P(42, 20), P(40, 21)],
      A: P(23, 5), B: P(23, 29),
      plantA: [P(23, 5), P(20, 3), P(25, 7), P(19, 8)], plantB: [P(23, 29), P(19, 28), P(26, 31), P(18, 32)],
      routes: {
        A: [[P(5, 10), P(8, 5), P(13, 5), P(17, 5), P(21, 5)], [P(10, 16), P(18, 15), P(23, 14), P(23, 12), P(23, 8)]],
        B: [[P(5, 26), P(8, 29), P(13, 29), P(15, 29), P(19, 29)], [P(10, 19), P(9, 22), P(17, 23), P(18, 25), P(19, 28)]]
      },
      holdA: [P(25, 4, 90), P(27, 8, 180), P(21, 8, 150), P(24, 6, 100)], holdB: [P(26, 29, 90), P(22, 32, 60), P(27, 30, 0), P(18, 32, 0)],
      holdMid: [P(34, 12, 180), P(36, 16, 90)],
      postA: [P(19, 4, -90), P(21, 8, -30), P(19, 7, -90), P(24, 3, -90)], postB: [P(20, 29, -90), P(19, 27, 0), P(22, 32, -90), P(18, 31, -60)],
      lurk: [P(12, 15, -90), P(30, 22, 90), P(5, 25, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.neon('HOTEL ESTRELA', c(23), 7.6, 2 * S + 0.05, 0, '#ff3fa8', 7, 1.5);
      d.neon('MERCADO', c(22), 4.4, 26 * S - 0.06, Math.PI, '#3fe0ff', 5, 1.2);
      d.neon('RAMEN 24H', c(14), 4.2, 21 * S - 0.06, Math.PI, '#ffcf3f', 4, 1.0);
      d.neon('BAR', c(31), 4.2, 21 * S - 0.06, Math.PI, '#7cff6a', 2, 0.8);
      d.neon('CINEMA', 25 * S + 0.06, 6.5, c(17), Math.PI / 2, '#b06aff', 5, 1.2);
      d.neon('LOJA', 20 * S - 0.06, 3.8, c(17), -Math.PI / 2, '#ff6a3f', 3, 1.0);
      for (const [x, z] of [[c(10), 14 * S + 0.4], [c(17), 20 * S + 2.6], [c(27), 14 * S + 0.4], [c(33), 20 * S + 2.6], [c(14), c(23)], [c(30), c(23)], [c(10), c(29)], [c(34), c(29)]]) d.lamp(x, z, 4.4, 0xbfe0ff);
      d.cyl(1.3, 3.2, c(27), 3 + 1.6, c(2), 0x5a5e66, 'corrugated');
      d.letter('A', c(23), 3.03, c(9) - 0.5, -Math.PI / 2, 0, 2.4);
      d.letter('B', 16 * S + 0.03, 2.4, c(27), 0, Math.PI / 2, 2.0);
    }
  });

  // =====================================================================
  // Fundição Aurora: fábrica com galpões que dá para entrar (A coberto + plataforma de controle,
  // B = armazém com mezanino), casa de bombas no meio com duas portas, duto estreito e beco de serviço.
  M.register({
    id: 'fundicao', name: 'Fundição Aurora', place: 'Polo industrial · siderúrgica', tag: 'Novo',
    desc: 'Galpão do forno coberto e plataforma de controle com escada no A, armazém com mezanino no B, casa de bombas no meio (entre por duas portas), duto estreito e beco de serviço.',
    theme: {
      mats: { wall: 'concrete', roof: 'corrugated', ground: 'asphalt', ground2: 'concrete', spawn: 'steelPlate', site: 'darkTiles', stair: 'steelPlate', upper: 'grate', tunnel: 'concrete', slab: 'steelPlate', raise: 'concrete', ramp: 'steelPlate' },
      sky: ['#6a7a8c', '#a8b0b8', '#d8c8b0'], fog: 0xb0aca4, fogNear: 50, fogFar: 180,
      hemi: [0xd0d8e0, 0x6a6258, 0.75], sun: [0xffe8c8, 0.85], sunDir: [60, 80, 50],
      wallH: [8, 2, 3], window: 'industrial', winChance: 0.45, tintVar: 0.22, door: 'metal', gate: 0x5a5e62,
      radar: { ground: [96, 98, 102], site: [150, 110, 90], roof: [70, 72, 76] }
    },
    carve(fill, ramp) {
      fill(18, 2, 27, 5, 'C');
      fill(5, 3, 17, 5, '.'); fill(8, 6, 9, 9, '.');                      // CT → B
      fill(28, 3, 42, 5, '.'); fill(36, 6, 38, 7, '.');                    // CT → A
      fill(21, 6, 24, 10, '.'); fill(21, 8, 24, 9, 'n');                   // CT → meio (arco)
      fill(31, 8, 42, 17, 'A'); fill(31, 8, 35, 12, 'q');                  // pátio A + galpão do forno (coberto)
      fill(40, 8, 42, 10, 'u'); ramp(40, 11, 42, 13, 'N', 0, 2);           // plataforma de controle + escada
      fill(4, 10, 13, 18, 'r');                                            // armazém B (coberto)
      fill(4, 10, 6, 11, 'r', 2.0); ramp(4, 12, 6, 14, 'N', 0, 2, 'r');    // mezanino + escada interna
      fill(14, 12, 14, 12, 'j'); fill(14, 16, 14, 16, 'j'); fill(14, 14, 14, 14, '.');
      fill(15, 11, 29, 22, '.'); fill(15, 11, 17, 13, ',');                // pátio de escória (meio)
      fill(19, 14, 24, 18, '#'); fill(20, 15, 23, 17, 'i');                // casa de bombas (entra pelas portas)
      fill(19, 16, 19, 16, 'i'); fill(24, 16, 24, 16, 'i'); fill(21, 14, 21, 14, 'j'); fill(22, 18, 22, 18, 'j');
      fill(30, 13, 30, 13, '.'); fill(30, 11, 30, 11, 'j'); fill(30, 15, 30, 15, 'j');
      fill(29, 23, 29, 30, '.'); fill(26, 30, 29, 31, '.');                // beco de serviço (estreito)
      fill(21, 23, 24, 31, '.'); fill(21, 26, 24, 27, 'n');
      fill(17, 32, 28, 35, 'T');
      fill(29, 33, 41, 35, '.'); fill(38, 23, 41, 32, '.'); fill(33, 19, 43, 22, '.'); fill(36, 18, 39, 18, '.');
      fill(42, 24, 43, 29, '2'); ramp(42, 30, 43, 31, 'N', 0, 1);          // doca de carga
      fill(2, 24, 12, 31, '.'); fill(10, 32, 16, 34, '.');
      fill(7, 19, 8, 23, '.');
      fill(14, 21, 14, 28, 't'); fill(13, 28, 13, 28, 't');                // duto estreito
      fill(16, 20, 17, 20, 'h'); fill(26, 13, 27, 13, 'h');
    },
    props(a) {
      const c = a.c;
      a.block(c(33), c(10), 2.4, 2.2, 2.4, 'steelPlate', 0x6a6e74);        // forno
      a.block(c(38), c(15), 2.6, 1.3, 1.4, 'steelPlate', 0x8a6a3a); a.crate(c(35), c(16), 1.2, 2); a.barrel(c(41) + 0.3, c(16)); a.crate(c(32), c(15), 1.2);
      a.crate(c(6), c(16), 1.2, 2); a.crate(c(11), c(12), 1.2); a.block(c(9), c(14), 3.0, 1.1, 1.2, 'planks', 0x8a6a4a); a.barrel(c(12) + 0.4, c(17));
      a.block(c(21), c(16), 1.6, 1.4, 1.0, 'steelPlate', 0x3a6a8a); a.barrel(c(23) - 0.2, c(15) + 0.3);  // bomba d'água dentro da casa
      a.crate(c(17), c(18), 1.2, 2); a.crate(c(27), c(16), 1.2); a.barrel(c(28), c(21)); a.block(c(26), c(20), 1.4, 1.6, 2.4, 'steelPlate', 0xd8a020);
      a.container(c(36), c(21), true, 0x2a5a8a); a.crate(c(40), c(27), 1.2, 2); a.barrel(c(39), c(31));
      a.container(c(4), c(27), false, 0x8a3a2a); a.crate(c(10), c(29), 1.2, 2); a.barrel(c(8), c(25)); a.crate(c(23), c(29), 1.2);
      a.door(8, 10, 'N', { width: 2, kind: 'metal' }); a.door(7, 19, 'N', { width: 2, kind: 'metal' });
      a.door(14, 14, 'W', { kind: 'metal' }); a.door(30, 13, 'E', { kind: 'metal' });
      a.door(19, 16, 'W', { kind: 'metal' }); a.door(24, 16, 'E', { kind: 'metal' });
      a.gate(18, 3, 'W', 3); a.gate(27, 3, 'E', 3); a.gate(21, 5, 'S', 4);
      a.gate(21, 32, 'N', 4); a.gate(26, 32, 'N', 3); a.gate(17, 32, 'W', 3); a.gate(28, 33, 'E', 3);
    },
    spots: P => ({
      tSpawn: [P(19, 33), P(21, 34), P(23, 33), P(25, 34), P(27, 33)],
      ctSpawn: [P(19, 3), P(21, 4), P(23, 3), P(24, 5), P(26, 4)],
      A: P(37, 13), B: P(9, 16),
      plantA: [P(37, 13), P(33, 15), P(40, 16), P(34, 12)], plantB: [P(9, 16), P(11, 11), P(7, 17), P(11, 17)],
      routes: {
        A: [[P(35, 34), P(40, 30), P(40, 24), P(37, 20), P(37, 15)], [P(29, 29), P(29, 24), P(27, 18), P(29, 13), P(32, 14)]],
        B: [[P(13, 33), P(7, 28), P(8, 22), P(8, 20), P(9, 16)], [P(13, 33), P(12, 28), P(14, 26), P(14, 22), P(16, 18), P(15, 14), P(12, 14)]]
      },
      holdA: [P(41, 9, 180), P(33, 16, 90), P(38, 10, 180), P(36, 14, 180)], holdB: [P(5, 10, 180), P(9, 12, 180), P(11, 16, -90), P(11, 13, -90)],
      holdMid: [P(22, 11, 180), P(27, 12, 180)],
      postA: [P(39, 17, 0), P(33, 13, 90), P(41, 9, 180), P(35, 10, 180)], postB: [P(5, 10, 180), P(12, 13, 180), P(7, 17, 0), P(10, 17, 90)],
      lurk: [P(16, 21, 0), P(39, 26, 0), P(14, 25, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.cyl(1.1, 22, 19 * S + 1.2, 11, 14 * S + 1.2, 0x5a524a, 'brick');                 // chaminé da casa de bombas
      d.cyl(2.6, 9, c(44) + 2, 4.5, c(12), 0x8a8e94, 'corrugated'); d.cyl(2.6, 9, c(44) + 2, 4.5, c(18), 0x8a8e94, 'corrugated');   // silos
      d.pipe(c(15), c(20) + 0.5, c(29), c(20) + 0.5, 7.4, 0.35, 0x8a6a42); d.pipe(c(15), c(12) - 0.4, c(29), c(12) - 0.4, 8.2, 0.25, 0x6a7078);
      for (const [x, z] of [[c(16), c(14)], [c(28), c(14)], [c(22), c(21)], [c(36), c(20)], [c(40), c(29)], [c(6), c(25)], [c(25), c(30)]]) d.lamp(x, z, 5, 0xd8f0ff);
      d.letter('A', c(37), 0.03, c(9) + 0.4, -Math.PI / 2, 0, 2.6);
    }
  });

  // =====================================================================
  // Bairro Alto: vizinhança em dois níveis ligados por escadarias; casas que dá para entrar
  // (porta + janelas + sala), praça da igreja no alto (A), mercado coberto embaixo (B), becos estreitos.
  M.register({
    id: 'bairro', name: 'Bairro Alto', place: 'Cidade antiga · encosta', tag: 'Novo',
    desc: 'Praça da igreja no alto (A) com escadarias e beco-escada, mercado coberto no B, casas com sala, porta e janelas, terraço a 3 m sobre a praça do meio.',
    theme: {
      mats: { wall: 'plaster', roof: 'roofRed', ground: 'cobble', ground2: 'paving', spawn: 'paving', site: 'tiles', stair: 'stone', upper: 'paving', tunnel: 'plaster', slab: 'planks', raise: 'stone', ramp: 'cobble' },
      sky: ['#5b8fd0', '#a8c8e8', '#f0dcc0'], fog: 0xd8d0c4, fogNear: 60, fogFar: 200,
      hemi: [0xdce8f8, 0x9a8a70, 0.75], sun: [0xfff0d8, 0.95], sunDir: [60, 85, -50],
      wallH: [6.5, 1.5, 3], window: 'wood', winChance: 0.5, tintVar: 0.35, door: 'wood', gate: 0x6a4a2a,
      radar: { ground: [150, 140, 126], site: [180, 120, 100], roof: [120, 70, 60] }
    },
    carve(fill, ramp) {
      fill(19, 2, 26, 5, 'C', 2.0);
      fill(8, 3, 18, 5, '.', 2.0);
      fill(4, 6, 13, 14, 'a', 2.0);                                        // praça da igreja (A), no alto
      fill(27, 3, 38, 5, '.', 2.0);
      ramp(36, 6, 38, 8, 'S', 2, 0); fill(36, 9, 38, 18, '.');             // escadaria leste
      fill(21, 6, 24, 9, '.', 2.0); ramp(21, 10, 24, 12, 'S', 2, 0);       // escadaria do meio
      fill(16, 13, 29, 22, '.');
      fill(17, 18, 20, 21, '#'); fill(18, 19, 19, 20, 'i'); fill(19, 21, 19, 21, 'i');   // casa do meio
      fill(17, 19, 17, 19, 'j'); fill(18, 18, 18, 18, 'j');
      fill(26, 13, 28, 15, 'p'); ramp(26, 16, 28, 19, 'N', 0, 3);          // terraço + escada
      ramp(14, 13, 15, 13, 'W', 0, 2);                                     // beco-escada até a praça
      ramp(6, 15, 9, 17, 'N', 0, 2); fill(5, 18, 10, 23, '.');             // escadaria oeste
      fill(4, 24, 15, 31, '.');
      fill(9, 26, 12, 29, '#'); fill(10, 27, 11, 28, 'i'); fill(10, 29, 10, 29, 'i');   // casa da rua oeste
      fill(12, 27, 12, 27, 'j'); fill(9, 28, 9, 28, 'j');
      fill(14, 32, 17, 34, '.');
      fill(18, 32, 27, 35, 'T');
      fill(21, 23, 24, 31, '.');
      fill(30, 20, 31, 20, '.');                                           // beco até o mercado
      fill(32, 19, 42, 27, 'b'); fill(32, 19, 36, 22, 'r'); fill(32, 27, 37, 27, '#');
      fill(28, 32, 30, 34, '.'); fill(29, 28, 43, 31, '.');
      fill(32, 29, 34, 30, '#'); fill(33, 30, 33, 30, 'i'); fill(33, 29, 33, 29, 'j');   // quiosque
      fill(18, 14, 19, 14, 'h'); fill(40, 24, 41, 24, 'h');
    },
    props(a) {
      const c = a.c;
      a.block(c(8), c(9), 2.0, 0.9, 2.0, 'stone', 0xd8d0c0); a.block(c(5), c(12), 2.0, 0.5, 0.6, 'planks', 0x8a6a4a); a.crate(c(12), c(7), 1.2); a.barrel(c(4) + 0.5, c(14));
      a.car(c(17), c(15), true, 0xb03030); a.crate(c(25), c(21), 1.2, 2); a.block(c(22), c(20), 2.6, 1.1, 1.2, 'planks', 0x7a5a3a); a.barrel(c(29) - 0.3, c(14));
      a.block(c(18) + 0.4, c(20), 1.2, 0.8, 0.7, 'planks', 0x6a4a2a);      // mesa dentro da casa do meio
      a.block(c(11) - 0.2, c(27) + 0.3, 1.0, 0.9, 0.6, 'planks', 0x6a4a2a); // armário da casa oeste
      a.block(c(34), c(24), 2.4, 1.0, 1.2, 'planks', 0x9a5a3a); a.block(c(40), c(22) + 0.6, 2.4, 1.0, 1.2, 'planks', 0x3a6a8a); a.crate(c(37), c(20), 1.2, 2); a.crate(c(42), c(26), 1.2); a.barrel(c(35), c(19) + 0.4);
      a.car(c(6), c(30), true, 0x3a6aa8); a.car(c(38), c(29), true, 0x2a2a2a); a.crate(c(14), c(25), 1.2); a.crate(c(42), c(30), 1.2, 2);
      a.door(10, 29, 'S', { kind: 'wood' }); a.door(19, 21, 'S', { kind: 'wood' }); a.door(31, 20, 'E', { kind: 'wood' }); a.door(33, 30, 'S', { kind: 'wood' });
      a.gate(19, 3, 'W', 3); a.gate(26, 3, 'E', 3); a.gate(21, 5, 'S', 4);
      a.gate(21, 32, 'N', 4); a.gate(18, 32, 'W', 3); a.gate(27, 32, 'E', 3);
    },
    spots: P => ({
      tSpawn: [P(19, 33), P(21, 34), P(23, 33), P(25, 34), P(26, 33)],
      ctSpawn: [P(20, 3), P(22, 4), P(23, 3), P(24, 5), P(25, 4)],
      A: P(8, 11), B: P(38, 24),
      plantA: [P(8, 11), P(5, 8), P(11, 12), P(10, 7)], plantB: [P(38, 24), P(34, 21), P(41, 26), P(36, 26)],
      routes: {
        A: [[P(15, 33), P(10, 30), P(7, 22), P(7, 16), P(8, 11)], [P(22, 28), P(20, 15), P(16, 13), P(14, 13), P(11, 12)]],
        B: [[P(29, 33), P(36, 30), P(40, 28), P(39, 24)], [P(22, 26), P(26, 20), P(29, 20), P(31, 20), P(34, 21)]]
      },
      holdA: [P(5, 7, 180), P(11, 7, 180), P(9, 9, 180), P(11, 11, -90)], holdB: [P(41, 20, 180), P(37, 21, 180), P(34, 25, 0), P(40, 26, 90)],
      holdMid: [P(22, 8, 180), P(27, 14, 180)],
      postA: [P(5, 8, 180), P(12, 11, -90), P(9, 13, 180), P(5, 13, 0)], postB: [P(34, 20, -90), P(41, 21, 180), P(38, 25, 0), P(35, 26, 0)],
      lurk: [P(13, 25, 0), P(41, 30, 0), P(16, 20, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.box(8, 18, 6, c(8), 9, -3, 0xece4d4, 'plaster');                    // igreja atrás da praça
      d.box(3, 9, 3, c(8), 22.5, -3, 0xece4d4, 'plaster'); d.cyl(0.25, 3, c(8), 28.5, -3, 0x3a3a3a);
      for (const [x, z, col] of [[c(33), 19 * S + 0.6, 0xb84a3a], [c(41), 19 * S + 0.6, 0x3a7a9a], [c(23), 22 * S + 0.6, 0xd8b04a]]) d.awning(x, z, 2.6, 2.4, 0, 3.4, col);
      for (const [x, z] of [[c(12), c(13)], [c(16), c(16)], [c(29), c(19)], [c(23), c(28)], [c(37), c(12)], [c(31), c(30)], [c(6), c(25)]]) d.lamp(x, z, 3.6, 0xffe2a0);
      d.tree(c(4) + 0.5, c(6) + 0.5, 1.0); d.tree(c(13), c(6) + 0.5, 0.9); d.tree(c(16), c(21), 0.8);
    }
  });

  M.load('sirocco');
})();
