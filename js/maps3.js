// Três mapas novos: Ruínas Esquecidas (templo na selva), Galerias do Esgoto (subsolo) e Vila das Pontes (cidade medieval com rio).
(function () {
  const M = G.Map;

  // =====================================================================
  M.register({
    id: 'ruinas', name: 'Ruínas Esquecidas', place: 'Selva · templo em ruínas', tag: 'Novo', houses: 0, ladderCount: 1, glass: false,
    desc: 'Santuário coberto no A com dois poços sem fundo ao lado da passarela central (quem cair morre), zigurate no meio com rampas nos quatro lados, praça alagada no B com riacho e pontes de pedra, colunas quebradas e selva fechada.',
    theme: {
      mats: { wall: 'moss', roof: 'moss', ground: 'grass', ground2: 'dirt', spawn: 'dirt', site: 'sandstone', stair: 'stoneWall', upper: 'moss', tunnel: 'moss', slab: 'stoneWall', raise: 'stoneWall', ramp: 'stoneWall', canal: 'dirt', pool: 'moss' },
      sky: ['#4c7a6a', '#8fb8a0', '#dfe4bc'], fog: 0x7fa08a, fogNear: 30, fogFar: 135,
      hemi: [0xcfe8d0, 0x4a5a30, 0.82], sun: [0xfff0c8, 0.85], sunDir: [40, 80, -30],
      wallH: [6, 1.5, 3], window: 'arch', winChance: 0.3, tintVar: 0.25, door: 'wood', gate: 0x5a4a2a,
      water: 0x3a8a6a, waterOpacity: 0.72, waterGlow: 0x06201a, waterFx: 0x9ad0b0, deadName: 'Poço sem fundo',
      radar: { ground: [84, 110, 60], site: [170, 150, 100], roof: [80, 90, 70] }
    },
    furnLib: { inS: ['urn', 'brazier', 'statue:'], inD: ['urn', 'brazier'], outS: ['urn', 'columnBroken'], outD: ['columnBroken', 'urn', 'brazier'] },
    furnDens: 0.09,
    carve(fill, ramp) {
      fill(2, 3, 12, 25, '.'); fill(8, 10, 43, 25, '.');                                   // selva oeste e grande clareira central
      fill(2, 26, 9, 33, 'T'); fill(37, 4, 43, 9, 'C'); fill(10, 28, 13, 31, '.');
      fill(2, 3, 12, 9, '.'); fill(13, 4, 13, 6, '.');                                     // entrada oeste do santuário
      fill(14, 3, 23, 9, 'q'); fill(14, 10, 19, 10, '#');                                   // santuário (A), coberto
      fill(17, 5, 17, 7, 'k', -5); fill(20, 5, 20, 7, 'k', -5);                             // poços ao lado da passarela central
      fill(24, 3, 24, 9, '#'); fill(24, 5, 36, 6, 't');                                     // túnel leste (CT -> A)
      fill(15, 10, 15, 10, 'j'); fill(18, 10, 18, 10, 'j'); fill(24, 8, 24, 8, 'j');
      // zigurate: base a 1 m, topo a 2 m, rampas nos quatro lados
      fill(19, 14, 27, 22, 'u', 1.0); fill(21, 16, 25, 19, 'u', 2.0); ramp(21, 20, 25, 20, 'N', 1, 2);
      ramp(17, 17, 18, 19, 'E', 0, 1); ramp(28, 17, 29, 19, 'W', 0, 1); ramp(21, 12, 25, 13, 'S', 0, 1); ramp(21, 23, 25, 24, 'N', 0, 1);
      // muros em ruínas na clareira
      fill(10, 13, 11, 13, '#'); fill(12, 21, 12, 23, '#'); fill(33, 13, 35, 13, '#'); fill(36, 20, 36, 22, '#'); fill(30, 21, 31, 21, '#'); fill(15, 15, 15, 16, '#'); fill(31, 16, 31, 17, '#');
      // praça alagada (B)
      fill(14, 25, 30, 25, '#'); fill(17, 25, 18, 25, '.'); fill(22, 25, 24, 25, '.'); fill(28, 25, 29, 25, '.');
      fill(14, 26, 30, 33, 'b'); fill(14, 29, 30, 29, 'w'); fill(17, 29, 18, 29, '.'); fill(23, 29, 24, 29, '.'); fill(27, 29, 28, 29, '.');
      fill(20, 25, 20, 25, 'j'); fill(26, 25, 26, 25, 'j');
      fill(31, 26, 43, 33, '.');
    },
    props(a) {
      const c = a.c;
      a.furn('statue', c(19), c(3), 0); a.furn('brazier', c(15), c(4), 0); a.furn('brazier', c(23), c(4), 0); a.furn('brazier', c(15), c(9), 0); a.furn('brazier', c(23), c(9), 0);
      a.furn('obelisk', c(23), c(17), 0); a.furn('obelisk', c(21), c(18), 0);
      for (const [i, j, k] of [[15, 12, 0], [11, 16, 1], [13, 19, 0], [33, 15, 1], [36, 18, 0], [31, 23, 1], [9, 22, 1], [38, 14, 0], [16, 23, 1], [29, 13, 0]]) a.furn(k ? 'columnBroken' : 'column', c(i), c(j), 0);
      for (const [i, j] of [[15, 27], [29, 27], [16, 32], [28, 32], [22, 31], [20, 28], [24, 28]]) a.furn(((i + j) % 3 ? 'column' : 'columnBroken'), c(i), c(j), 0);
      a.furn('statue', c(22), c(26), 0); a.furn('urn', c(17), c(32), 0); a.furn('urn', c(27), c(32), 0); a.furn('urn', c(34), c(18), 0); a.furn('urn', c(8), c(13), 0);
      a.gate(2, 26, 'N', 8); a.gate(9, 28, 'E', 4); a.gate(37, 9, 'S', 7); a.gate(37, 5, 'W', 2);
    },
    spots: P => ({
      tSpawn: [P(4, 28), P(6, 29), P(3, 31), P(7, 31), P(5, 32)],
      ctSpawn: [P(39, 6), P(41, 7), P(38, 8), P(42, 8), P(40, 5)],
      A: P(18, 8), B: P(22, 27),
      plantA: [P(18, 8), P(15, 5), P(22, 5), P(19, 4)], plantB: [P(22, 27), P(17, 27), P(27, 27), P(20, 32)],
      routes: {
        A: [[P(8, 29), P(5, 22), P(4, 14), P(5, 6), P(10, 5), P(14, 5)], [P(10, 25), P(14, 19), P(16, 19), P(22, 12), P(22, 10), P(21, 8)]],
        B: [[P(10, 30), P(15, 31), P(20, 31)], [P(10, 28), P(14, 27), P(19, 27), P(22, 27)]]
      },
      holdA: [P(15, 8, 0), P(23, 8, 0), P(21, 4, 90), P(16, 5, 90)], holdB: [P(16, 27, 90), P(28, 27, 90), P(22, 32, 0), P(18, 31, 0)],
      holdMid: [P(20, 12, 180), P(26, 12, 180)],
      postA: [P(15, 5, 0), P(23, 5, 180), P(19, 4, 0), P(22, 8, 180)], postB: [P(16, 27, 0), P(28, 27, 180), P(20, 32, 0), P(26, 31, 0)],
      lurk: [P(8, 18, 0), P(34, 14, 0), P(30, 30, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      // pirâmide escalonada ao fundo e árvores gigantes da selva
      for (let i = 0; i < 4; i++) d.box(26 - i * 6, 3, 14 - i * 3, c(30), 1.5 + i * 3, c(7), 0x8a8a74, 'moss');
      for (const [x, z] of [[c(5), c(1)], [c(12), c(1)], [c(30), c(1)], [c(41), c(1)], [c(0) + 1, c(20)], [c(44), c(27)], [c(44), c(14)], [c(20), c(36)], [c(30), c(36)]]) d.tree(x, z, 3.2, false, true);
      d.letter('A', c(18), 0.03, c(8), -Math.PI / 2, 0, 2.4); d.letter('B', c(22), 0.03, c(27), -Math.PI / 2, 0, 2.4);
      d.sign('SANTUÁRIO · NÃO PISE NOS POÇOS', '#6a5a30', '#f0e0b0', null, 14 * S + 0.03, 3.2, c(8), Math.PI / 2, 2.8, 0.7);
      d.banner(c(14) + 0.2, 4.2, c(4), Math.PI / 2, 0x3a7a5a, 1.2, 2.6); d.banner(c(23) - 0.2, 4.2, c(4), -Math.PI / 2, 0x3a7a5a, 1.2, 2.6);
    }
  });

  // =====================================================================
  M.register({
    id: 'esgoto', name: 'Galerias do Esgoto', place: 'Subsolo · rede de esgoto', tag: 'Novo', houses: 0, ladderCount: 3,
    desc: 'Tudo coberto: canal de esgoto no meio com pontes, câmara das válvulas no A com mezanino, reservatório no B com poço de lodo tóxico (a passarela central é o único caminho seguro sobre ele) e túneis estreitos de tijolo úmido.',
    theme: {
      mats: { wall: 'wetBrick', roof: 'wetBrick', ground: 'concrete', ground2: 'slime', spawn: 'concrete', site: 'steelPlate', stair: 'steelPlate', upper: 'grate', tunnel: 'wetBrick', slab: 'concrete', raise: 'wetBrick', ramp: 'steelPlate', canal: 'slime', pool: 'slime' },
      sky: ['#1a221a', '#2a3a2a', '#3a4a32'], fog: 0x2a3a22, fogNear: 22, fogFar: 110,
      hemi: [0xa8c896, 0x3a4a30, 0.95], sun: [0xd8f0b0, 0.4], sunDir: [20, 60, -20],
      wallH: [6, 1.5, 3], window: 'none', winChance: 0, tintVar: 0.25, door: 'metal', gate: 0x4a5a3a,
      water: 0x6a8a2a, waterOpacity: 0.85, waterGlow: 0x1a2a08, waterFx: 0xa8c860, deadName: 'Lodo tóxico',
      radar: { ground: [76, 84, 70], site: [110, 120, 80], roof: [50, 58, 46] }
    },
    furnLib: { inS: ['valves', 'cabinet', 'gasCyl', 'panel', 'valves'], inD: ['bigPipe', 'pump', 'tank', 'barrelRow', 'valves'], outS: [], outD: [] },
    furnDens: 0.2,
    carve(fill, ramp) {
      fill(2, 15, 8, 22, 'Y'); fill(37, 15, 43, 22, 'Z');                                   // praças de manutenção (spawns cobertos)
      fill(9, 15, 36, 16, 'i'); fill(9, 20, 36, 21, 'i'); fill(9, 17, 36, 19, 'w');         // passarelas e o canal de esgoto
      fill(17, 17, 18, 19, 'i'); fill(27, 17, 28, 19, 'i');                                 // pontes sobre o canal
      // A: câmara das válvulas
      fill(14, 3, 26, 11, 'q'); fill(19, 12, 21, 14, 't'); fill(15, 3, 19, 4, 'q', 2.0); ramp(15, 5, 17, 7, 'N', 0, 2, 'q');
      fill(4, 8, 7, 14, 't'); fill(3, 3, 8, 7, 'i'); fill(9, 5, 13, 7, 't');                // oeste: T -> A
      fill(38, 8, 41, 14, 't'); fill(37, 3, 42, 7, 'i'); fill(27, 5, 36, 7, 't');           // leste: CT -> A
      // B: reservatório com poço de lodo tóxico
      fill(14, 26, 30, 34, 'r'); fill(19, 28, 25, 32, 'k', -4); fill(19, 30, 25, 30, 'r');  // passarela central sobre o poço
      fill(15, 33, 19, 34, 'r', 2.0); ramp(15, 30, 17, 32, 'S', 0, 2, 'r');
      fill(21, 22, 23, 25, 't');                                                            // canal -> B
      fill(4, 23, 7, 29, 't'); fill(3, 30, 10, 35, 'i'); fill(11, 31, 13, 33, 't');         // oeste: T -> B
      fill(38, 23, 41, 29, 't'); fill(36, 30, 43, 35, 'i'); fill(31, 31, 35, 33, 't');      // leste: CT -> B
      fill(32, 14, 32, 14, 'h'); fill(13, 22, 13, 22, 'h');
    },
    props(a) {
      const c = a.c;
      a.furn('valves', c(20), c(8), 0); a.furn('valves', c(23), c(8), 0); a.furn('tank', c(25), c(4), 0, { color: 'blue' }); a.furn('bigPump', c(16), c(10), 0, { n: 1 });
      a.furn('pump', c(17), c(27), 0); a.furn('pump', c(29), c(33), 180); a.furn('tank', c(28), c(27), 0); a.furn('tank', c(16), c(31) - 4, 0);
      a.crate(c(11), c(16), 1.2, 2); a.barrel(c(33), c(20)); a.crate(c(24), c(15), 1.2); a.crate(c(14), c(21), 1.2);
      a.door(9, 5, 'W', { kind: 'metal' }); a.door(36, 5, 'E', { kind: 'metal' }); a.door(21, 22, 'N', { kind: 'metal', width: 1 });
      a.gate(2, 15, 'N', 7); a.gate(2, 22, 'S', 7); a.gate(8, 17, 'E', 3); a.gate(37, 15, 'N', 7); a.gate(37, 22, 'S', 7); a.gate(37, 17, 'W', 3);
    },
    spots: P => ({
      tSpawn: [P(4, 17), P(6, 18), P(4, 20), P(7, 20), P(5, 21)],
      ctSpawn: [P(39, 17), P(41, 18), P(39, 20), P(42, 20), P(40, 21)],
      A: P(21, 8), B: P(16, 28),
      plantA: [P(21, 8), P(24, 5), P(23, 10), P(17, 10)], plantB: [P(16, 28), P(28, 31), P(22, 27), P(22, 33)],
      routes: {
        A: [[P(5, 19), P(5, 12), P(5, 6), P(11, 6), P(15, 8)], [P(10, 16), P(18, 16), P(20, 13), P(21, 9)]],
        B: [[P(5, 22), P(5, 27), P(6, 32), P(12, 32), P(16, 32)], [P(10, 21), P(21, 21), P(22, 24), P(22, 27)]]
      },
      holdA: [P(15, 9, 0), P(25, 9, 0), P(21, 4, 90), P(24, 10, 180)], holdB: [P(16, 28, 90), P(28, 30, 90), P(22, 33, 0), P(22, 27, 180)],
      holdMid: [P(18, 16, 180), P(27, 20, 180)],
      postA: [P(15, 10, 0), P(25, 6, 180), P(21, 4, 0), P(23, 10, 180)], postB: [P(15, 27, 0), P(29, 28, 180), P(22, 33, 0), P(27, 33, 180)],
      lurk: [P(10, 21, 0), P(33, 16, 0), P(5, 25, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.glow(c(22), 1.0, c(30), 0xa8e040, 1.0, 20); d.glow(c(20), 1.5, c(7), 0xd8e8a0, 0.7, 18);
      d.pipe(c(9), 15 * S + 0.4, c(36), 15 * S + 0.4, 3.4, 0.28, 0x6a5a40); d.pipe(c(9), 22 * S - 0.4, c(36), 22 * S - 0.4, 3.2, 0.22, 0x3a5a3a);
      d.sign('CÂMARA DAS VÁLVULAS', '#2a4a3a', '#d8f0c8', null, c(20), 3.6, 3 * S + 0.03, 0, 2.8, 0.7);
      d.sign('RESERVATÓRIO · LODO TÓXICO · NÃO PISE', '#f0d020', '#111', 'rad', c(22), 3.2, 26 * S + 0.03, 0, 3.0, 0.8);
      d.letter('A', c(21), 0.03, c(8), -Math.PI / 2, 0, 2.4); d.letter('B', c(16), 0.03, c(28), -Math.PI / 2, 0, 2.4);
    }
  });

  // =====================================================================
  M.register({
    id: 'pontes', name: 'Vila das Pontes', place: 'Cidade medieval · rio e castelo', tag: 'Novo', houses: 3, ladderCount: 3,
    desc: 'Rio de pedra no meio com três pontes, praça do mercado com fonte no B (margem oeste) e pátio do castelo elevado no A (margem leste), casas de enxaimel que dá para entrar, moinho, torre de vigia e ruas de paralelepípedo.',
    theme: {
      mats: { wall: 'timber', roof: 'roofRed', ground: 'cobble', ground2: 'paving', spawn: 'cobble', site: 'paving', stair: 'stoneWall', upper: 'planks', tunnel: 'stoneWall', slab: 'planks', raise: 'stoneWall', ramp: 'cobble', canal: 'moss' },
      sky: ['#5b8fd0', '#a8c8e8', '#f0e0c4'], fog: 0xd2d8de, fogNear: 60, fogFar: 200,
      hemi: [0xdce8f8, 0x9a8a70, 0.78], sun: [0xfff0d8, 0.95], sunDir: [55, 85, -45],
      wallH: [6.5, 1.5, 3], window: 'wood', winChance: 0.5, tintVar: 0.3, door: 'wood', gate: 0x6a4a2a,
      water: 0x3a6a8a, waterOpacity: 0.7, waterGlow: 0x04121c,
      radar: { ground: [140, 132, 120], site: [180, 130, 100], roof: [150, 80, 64] }
    },
    furnLib: { inS: ['wardrobe', 'bookshelf', 'shelf:wood', 'fridge', 'stove'], inD: ['table', 'bed', 'sofa', 'desk'], outS: ['bench', 'planter', 'urn', 'firewood'], outD: ['cart', 'hay', 'stall', 'well'] },
    furnDens: 0.15,
    carve(fill, ramp) {
      fill(2, 3, 20, 35, '.'); fill(25, 2, 44, 35, '.');                                    // margens oeste e leste
      fill(21, 2, 24, 35, 'w');                                                             // rio
      fill(21, 8, 24, 9, '.'); fill(21, 17, 24, 19, '.'); fill(21, 27, 24, 28, '.');          // três pontes
      fill(3, 29, 10, 34, 'T'); fill(36, 3, 43, 9, 'C');
      fill(6, 13, 16, 21, 'b');                                                             // praça do mercado (B)
      // quarteirões de casas (viram salas com porta e janelas)
      fill(3, 4, 8, 9, '#'); fill(11, 4, 16, 8, '#'); fill(3, 23, 8, 27, '#'); fill(13, 24, 18, 28, '#'); fill(3, 12, 4, 20, '#');
      // castelo: pátio elevado (A)
      fill(28, 11, 41, 22, '#'); fill(29, 12, 40, 21, 'a');
      ramp(26, 15, 28, 17, 'E', 0, 1); ramp(35, 9, 36, 11, 'S', 0, 1);
      fill(33, 14, 37, 17, '#');                                                           // torre de menagem
      fill(30, 24, 35, 29, '#'); fill(38, 25, 43, 31, '#');
      fill(41, 13, 43, 15, 'p');                                                           // plataforma da torre de vigia (escada de mão)
      fill(25, 31, 29, 35, ',');
    },
    props(a) {
      const c = a.c;
      a.furn('fountain', c(11), c(17), 0); a.furn('stall', c(8), c(15), 0, { n: 0 }); a.furn('stall', c(14), c(15), 0, { n: 1 }); a.furn('stall', c(8), c(20), 180, { n: 2 }); a.furn('stall', c(14), c(20), 180, { n: 3 });
      a.furn('well', c(19), c(22), 0); a.furn('cart', c(18), c(12), 90); a.furn('hay', c(19), c(30), 0); a.furn('well', c(30), c(8), 0); a.furn('statue', c(35), c(20), 0);
      a.furn('cart', c(27), c(10), 0); a.furn('firewood', c(42), c(20), 0); a.crate(c(29), c(4), 1.2, 2); a.barrel(c(28), c(33)); a.crate(c(12), c(33), 1.2, 2);
      a.gate(3, 29, 'N', 8); a.gate(10, 30, 'E', 4); a.gate(36, 9, 'S', 8); a.gate(36, 4, 'W', 4);
    },
    spots: P => ({
      tSpawn: [P(4, 30), P(6, 31), P(8, 30), P(5, 33), P(9, 32)],
      ctSpawn: [P(37, 4), P(39, 5), P(41, 4), P(38, 8), P(42, 7)],
      A: P(32, 19), B: P(11, 20),
      plantA: [P(32, 19), P(31, 13), P(38, 19), P(39, 13)], plantB: [P(9, 18), P(13, 19), P(8, 14), P(14, 16)],
      routes: {
        A: [[P(12, 30), P(19, 30), P(23, 28), P(27, 24), P(27, 18), P(30, 16)], [P(12, 24), P(19, 18), P(23, 18), P(26, 17), P(30, 17)]],
        B: [[P(7, 28), P(10, 25), P(10, 22), P(11, 20)], [P(12, 28), P(12, 24), P(12, 22), P(12, 20)]]
      },
      holdA: [P(31, 13, 0), P(39, 13, 180), P(38, 20, 180), P(30, 20, 0)], holdB: [P(8, 14, 90), P(12, 15, 90), P(9, 20, 0), P(13, 20, 0)],
      holdMid: [P(19, 18, 0), P(27, 18, 180)],
      postA: [P(31, 20, 0), P(39, 20, 180), P(31, 13, 180), P(39, 14, 90)], postB: [P(7, 20, 0), P(15, 20, 180), P(9, 14, 0), P(13, 14, 0)],
      lurk: [P(18, 31, 0), P(27, 6, 0), P(27, 32, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      d.fan(c(20) + 1.0, 2.2, c(12), Math.PI / 2, 2.2);                                    // roda d'água do moinho
      d.box(3.5, 5.5, 4.6, c(19), 2.75, c(12), 0xe4d8bc, 'timber'); d.box(3.8, 0.4, 5.0, c(19), 5.6, c(12), 0x8a3a2a, 'roofRed');
      for (const [x, z, r, h] of [[c(25) - 2, c(2) + 1, 2.4, 14], [c(44), c(2), 2.4, 14], [c(25) - 2, c(36) - 1, 2.4, 14], [c(44), c(36), 2.4, 14]]) { d.cyl(r, h, x, h / 2, z, 0x9a948a, 'stoneWall'); d.cyl(r + 0.5, 3, x, h + 1.5, z, 0x8a2a24, 'roofRed', 0); }
      for (const s of [-1, 1]) { d.box(0.25, 1.0, 12, c(21) + 0.35 + (s > 0 ? 3 * S - 0.7 : 0), 0.5, c(18) + 0, 0x9a948a, 'stoneWall'); }
      d.banner(c(28) - 0.2, 5.5, c(15), Math.PI / 2, 0x9a1a1a, 1.4, 3.2); d.banner(c(28) - 0.2, 5.5, c(17), Math.PI / 2, 0x1a3a8a, 1.4, 3.2);
      d.letter('A', c(32), 1.03, c(19), -Math.PI / 2, 0, 2.4); d.letter('B', c(11), 0.03, c(20) - 1, -Math.PI / 2, 0, 2.4);
      d.sign('MERCADO', '#6a3a22', '#f0e0b8', null, c(6) + 1, 4.2, 13 * S + 0.03, 0, 3.2, 0.9);
    }
  });
})();
