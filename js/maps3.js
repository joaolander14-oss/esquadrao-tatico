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
    carve(fill, ramp, hill) {
      fill(2, 3, 12, 25, '.'); fill(8, 10, 43, 25, '.');                                   // selva oeste e grande clareira central
      fill(2, 26, 9, 33, 'T'); fill(37, 4, 43, 9, 'C'); fill(10, 28, 13, 31, '.');
      fill(2, 3, 12, 9, '.'); fill(13, 4, 13, 6, '.');                                     // entrada oeste do santuário
      fill(14, 3, 23, 9, 'q'); fill(14, 10, 19, 10, '#');                                   // santuário (A), coberto
      fill(17, 5, 17, 7, 'k', -5); fill(20, 5, 20, 7, 'k', -5);                             // poços ao lado da passarela central
      fill(24, 3, 24, 9, '#'); fill(24, 5, 36, 6, 't');                                     // túnel leste (CT -> A)
      fill(15, 10, 15, 10, 'j'); fill(18, 10, 18, 10, 'j'); fill(24, 8, 24, 8, 'j');
      // pirâmide asteca de 3 patamares (1,5 / 3 / 4,5 m) com escadarias largas dos lados oeste e leste e um templo no topo
      fill(18, 12, 28, 24, 'u', 1.5); fill(20, 14, 26, 22, 'u', 3.0); fill(22, 16, 24, 20, 'u', 4.5);
      ramp(16, 17, 17, 19, 'E', 0, 1.5); ramp(18, 17, 19, 19, 'E', 1.5, 3.0); ramp(20, 17, 21, 19, 'E', 3.0, 4.5);
      ramp(29, 17, 30, 19, 'W', 0, 1.5); ramp(27, 17, 28, 19, 'W', 1.5, 3.0); ramp(25, 17, 26, 19, 'W', 3.0, 4.5);

      // muros em ruínas na clareira
      fill(10, 13, 11, 13, '#'); fill(12, 21, 12, 23, '#'); fill(33, 13, 35, 13, '#'); fill(36, 20, 36, 22, '#'); fill(30, 21, 31, 21, '#'); fill(15, 15, 15, 16, '#'); fill(31, 16, 31, 17, '#');
      // praça alagada (B)
      fill(14, 25, 30, 25, '#'); fill(17, 25, 18, 25, '.'); fill(22, 25, 24, 25, '.'); fill(28, 25, 29, 25, '.');
      fill(14, 26, 30, 33, 'b'); fill(14, 29, 30, 29, 'w'); fill(17, 29, 18, 29, '.'); fill(23, 29, 24, 29, '.'); fill(27, 29, 28, 29, '.');
      fill(20, 25, 20, 25, 'j'); fill(26, 25, 26, 25, 'j');
      fill(31, 26, 43, 33, '.');
      // morros da selva (por último: só sobem sobre chão livre)
      hill(8, 17, 4, 5, 2.0); hill(38, 17, 4, 4, 2.0); hill(37, 30, 3, 3, 1.6); hill(11, 12, 3, 3, 1.4); hill(40, 24, 3, 3, 1.5); hill(30, 12, 3, 2, 1.2); hill(8, 23, 2, 2, 1.0);
    },
    props(a) {
      const c = a.c;
      a.furn('statue', c(19), c(3), 0); a.furn('brazier', c(15), c(4), 0); a.furn('brazier', c(23), c(4), 0); a.furn('brazier', c(15), c(9), 0); a.furn('brazier', c(23), c(9), 0);
      // templo no topo da pirâmide (y = 4,5): paredes de pedra com portas a oeste e leste, teto e estátua
      { const y0 = 4.5, st = { tex: 'stoneWall', color: 0xcfc8b0 };
        a.prop(c(23), 48.3, 9.2, 3.0, 0.6, 'block', y0, st); a.prop(c(23), 62.7, 9.2, 3.0, 0.6, 'block', y0, st);
        for (const x of [66.3, 74.7]) { a.prop(x, 51.4, 0.6, 3.0, 5.6, 'block', y0, st); a.prop(x, 59.6, 0.6, 3.0, 5.6, 'block', y0, st); a.prop(x, 55.5, 0.6, 0.5, 2.6, 'block', y0 + 2.5, st); }
        a.prop(c(23), 55.5, 10.0, 0.5, 16.2, 'block', y0 + 3.0, { tex: 'moss', color: 0xb8c0a0 });
        a.prop(c(23), 55.5, 7.2, 0.5, 12.6, 'block', y0 + 3.5, st);
        a.furn('statue', c(23), 55.5, 0, { y: y0 }); a.furn('brazier', 68.2, 50.5, 0, { y: y0 }); a.furn('brazier', 72.8, 60.5, 0, { y: y0 }); a.furn('brazier', 72.8, 50.5, 0, { y: y0 }); a.furn('brazier', 68.2, 60.5, 0, { y: y0 }); }
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
        A: [[P(8, 29), P(5, 22), P(4, 14), P(5, 6), P(10, 5), P(14, 5)], [P(10, 25), P(14, 22), P(15, 14), P(22, 11), P(22, 10), P(21, 8)]],
        B: [[P(10, 30), P(15, 31), P(20, 31)], [P(10, 28), P(14, 27), P(19, 27), P(22, 27)]]
      },
      holdA: [P(15, 8, 0), P(23, 8, 0), P(21, 4, 90), P(16, 5, 90)], holdB: [P(16, 27, 90), P(28, 27, 90), P(22, 32, 0), P(18, 31, 0)],
      holdMid: [P(20, 11, 180), P(26, 11, 180)],
      postA: [P(15, 5, 0), P(23, 5, 180), P(19, 4, 0), P(22, 8, 180)], postB: [P(16, 27, 0), P(28, 27, 180), P(20, 32, 0), P(26, 31, 0)],
      lurk: [P(8, 18, 0), P(34, 14, 0), P(30, 30, 0)]
    }),
    decor(d) {
      const c = d.c, S = d.S;
      // pirâmide escalonada ao fundo e árvores gigantes da selva
      // faixa decorativa e tochas na escadaria
      d.glow(c(23), 9.2, c(18), 0xffc060, 1.4, 22);
      for (const [x, z] of [[c(5), c(1)], [c(12), c(1)], [c(30), c(1)], [c(41), c(1)], [c(0) + 1, c(20)], [c(44), c(27)], [c(44), c(14)], [c(20), c(36)], [c(30), c(36)]]) d.tree(x, z, 3.2, false, true);
      d.letter('A', c(18), 0.03, c(8), -Math.PI / 2, 0, 2.4); d.letter('B', c(22), 0.03, c(27), -Math.PI / 2, 0, 2.4);
      d.sign('SANTUÁRIO · NÃO PISE NOS POÇOS', '#6a5a30', '#f0e0b0', null, 14 * S + 0.03, 3.2, c(8), Math.PI / 2, 2.8, 0.7);
      d.banner(c(14) + 0.2, 4.2, c(4), Math.PI / 2, 0x3a7a5a, 1.2, 2.6); d.banner(c(23) - 0.2, 4.2, c(4), -Math.PI / 2, 0x3a7a5a, 1.2, 2.6);
    }
  });

  // =====================================================================
  M.register({
    id: 'esgoto', name: 'Galerias do Esgoto', place: 'Rua e subsolo · 3 andares de esgoto', tag: 'Reformado', houses: 4, ladderCount: 0, towerCount: 2, pipeCount: 0, ductCount: 0,
    desc: 'Térreo: rua com prédios e o bombsite A num convés sobre a cisterna. Subsolo -1: salas de partida (Insurgentes a oeste, Força Tática a leste), corredor central com o rio do esgoto, bueiros abertos com escada de mão até a rua. -2: galerias com a queda do rio e a grade onde ele termina. -3: a cisterna do bombsite B, bem embaixo do A (escada de mão no vão do convés).',
    theme: {
      mats: { wall: 'wetBrick', roof: 'asphalt', ground: 'asphalt', ground2: 'concrete', spawn: 'concrete', site: 'steelPlate', stair: 'steelPlate', upper: 'grate', tunnel: 'wetBrick', slab: 'concrete', raise: 'concrete', ramp: 'concrete', canal: 'slime', pool: 'slime' },
      sky: ['#10161c', '#26323a', '#44504c'], fog: 0x1c2a2a, fogNear: 30, fogFar: 150,
      hemi: [0xa8c0b0, 0x3a4a40, 0.95], sun: [0xc8e0d0, 0.5], sunDir: [20, 70, -20],
      wallH: [6, 1.5, 3], window: 'industrial', winChance: 0.3, tintVar: 0.25, door: 'metal', gate: 0x4a5a3a,
      water: 0x6a8a2a, waterOpacity: 0.85, waterGlow: 0x1a2a08, waterFx: 0xa8c860, deadName: 'Lodo tóxico',
      radar: { ground: [76, 84, 70], site: [110, 120, 80], roof: [50, 58, 46] }
    },
    furnLib: { inS: ['valves', 'cabinet', 'gasCyl', 'panel', 'valves'], inD: ['bigPipe', 'pump', 'tank', 'barrelRow', 'valves'], outS: ['planter', 'bench', 'barrelRow'], outD: ['vending', 'bench', 'planter', 'barrelRow'] },
    furnDens: 0.14,
    carve(fill, ramp) {
      // ---- térreo: a rua ----
      fill(1, 1, 44, 12, '.');
      for (const b of [[2, 2, 9, 6], [2, 8, 7, 11], [11, 2, 15, 5], [31, 2, 35, 5], [38, 2, 43, 6], [39, 8, 43, 11]]) fill(b[0], b[1], b[2], b[3], '#');
      // ---- -3: cisterna (B) bem embaixo do convés do A; entrada pelo sul, por baixo da rua ----
      fill(18, 3, 27, 10, 'b', -9);
      fill(22, 11, 23, 12, 'v3', -9); fill(22, 13, 23, 19, 't', -9);
      ramp(21, 20, 24, 23, 'S', -9, -6, 't');
      // ---- -2: galerias, vale-válvulas e câmara da queda do rio ----
      fill(13, 24, 24, 26, 't', -6); fill(25, 22, 32, 27, 't', -6); fill(27, 25, 31, 27, 'W', -6.4);
      fill(13, 25, 13, 25, '.', -6); fill(32, 24, 32, 24, '.', -6); fill(28, 27, 28, 27, 'w', -6.4);      // poços das escadas e a queda do rio (sem teto)
      ramp(21, 27, 24, 30, 'S', -6, -3, 't');
      // ---- -1: salas de partida, corredor central com o rio e túneis até os bueiros ----
      fill(9, 31, 36, 35, 't', -3); fill(2, 31, 8, 35, 'Y', -3); fill(37, 31, 43, 35, 'Z', -3);
      fill(28, 33, 36, 34, 'W', -3.6); fill(28, 28, 28, 32, 'W', -3.6);
      fill(9, 13, 9, 30, 't', -3); fill(36, 13, 36, 30, 't', -3);
      fill(9, 12, 9, 12, '.', -3); fill(36, 12, 36, 12, '.', -3);                 // bueiros abertos (escada de mão até a rua)
      fill(9, 25, 12, 25, 't', -3); fill(33, 24, 36, 24, 't', -3);                // ramais até as escadas para o -2
      for (const [pi, pj] of [[13, 32], [18, 34], [26, 32], [32, 32], [16, 31], [30, 35]]) fill(pi, pj, pi, pj, '#');       // pilares: quebram a linha de tiro do corredor
    },
    deck: {
      h: 0, zone: 'A', tex: 'steelPlate', color: 0x9aa09c,
      rects: [[18, 3, 27, 4], [18, 9, 27, 10], [19, 5, 20, 8], [18, 5, 18, 5], [18, 8, 18, 8], [25, 5, 26, 8], [27, 5, 27, 5], [27, 8, 27, 8]]
    },
    ladders: [[9, 12, 'N'], [36, 12, 'N'], [18, 6, 'W'], [27, 7, 'E'], [13, 25, 'W'], [32, 24, 'E']],
    props(a) {
      const c = a.c, dk = 0;
      // rua
      a.car(c(14), c(8), true, 0x4a5a6a); a.car(c(30), c(9), false, 0x6a4a3a); a.car(c(21), c(1) + 0.2, true, 0x3a4a3a);
      a.barrel(c(16), c(11)); a.barrel(c(16) + 0.8, c(11)); a.crate(c(29), c(11), 1.2, 2); a.crate(c(12), c(7) + 0.4, 1.2);
      // convés do A: caixas e cobertura
      a.prop(c(19), c(3), 1.2, 1.2, 1.2, 'crate', dk); a.prop(c(19), c(3), 1.2, 1.2, 1.2, 'crate', dk + 1.2); a.prop(c(26), c(10), 1.2, 1.2, 1.2, 'crate', dk);
      a.prop(c(24), c(4), 2.6, 1.0, 1.0, 'block', dk, { tex: 'concrete', color: 0xb0aaa0 }); a.prop(c(21), c(9), 2.6, 1.0, 1.0, 'block', dk, { tex: 'concrete', color: 0xb0aaa0 });
      // cisterna (B), -2 e -1
      a.furn('tank', c(19), c(9), 0, { color: 'blue', y: -9 }); a.furn('pump', c(26), c(9), 180, { y: -9 }); a.crate(c(19), c(4), 1.2, 2); a.barrel(c(26), c(4));
      a.furn('valves', c(15), c(26), 0); a.furn('pump', c(30), c(23), 0); a.furn('tank', c(18), c(25), 0); a.crate(c(14), c(24), 1.2);
      a.furn('bigPump', c(14), c(33), 0, { n: 1 }); a.furn('valves', c(31), c(31), 0); a.crate(c(12), c(33), 1.2, 2); a.barrel(c(34), c(31));
      a.gate(8, 31, 'E', 5); a.gate(37, 31, 'W', 5);
    },
    spots: P => {
      const D = (i, j, yaw) => P(i, j, yaw, 0), H = (i, j, yaw) => P(i, j, yaw, -9);
      return {
        tSpawn: [P(3, 32), P(5, 33), P(3, 34), P(6, 34), P(7, 32)],
        ctSpawn: [P(40, 32), P(42, 33), P(40, 34), P(43, 34), P(38, 33)],
        A: D(22, 4), B: H(22, 8),
        plantA: [D(22, 4), D(19, 4), D(26, 4), D(22, 10)], plantB: [H(22, 8), H(19, 5), H(26, 5), H(22, 4)],
        routes: {
          A: [[P(7, 33), P(9, 30), P(9, 16), P(9, 12), P(12, 10), P(16, 7), D(19, 4)],
              [P(8, 33), P(20, 32), P(22, 29), P(22, 25), P(22, 17), H(22, 9), H(18, 6), P(16, 6), D(19, 5)]],
          B: [[P(8, 33), P(20, 32), P(22, 29), P(22, 25), P(22, 17), H(22, 10), H(22, 8)],
              [P(7, 33), P(9, 28), P(10, 25), P(15, 25), P(21, 25), P(22, 17), H(22, 10), H(22, 8)]]
        },
        holdA: [D(19, 3, 0), D(26, 3, 0), D(22, 10, 180), D(25, 9, 180)], holdB: [H(19, 9, 0), H(26, 9, 0), H(22, 4, 90), H(21, 10, 0)],
        holdMid: [P(22, 17, 0), P(22, 19, 0)],
        postA: [D(20, 4, 0), D(25, 4, 0), D(22, 10, 180), D(19, 9, 90)], postB: [H(20, 9, 0), H(25, 9, 0), H(21, 4, 90), H(26, 4, 90)],
        lurk: [P(15, 25, 0), P(30, 23, 0), P(9, 20, 0)]
      };
    },
    decor(d) {
      const c = d.c, S = d.S;
      d.glow(c(22), -6.5, c(7), 0xa8e040, 1.1, 30); d.glow(c(22), 3.2, c(8), 0xfff0d0, 0.9, 30); d.glow(c(22), -4.5, c(25), 0xd8e8a0, 0.8, 20); d.glow(c(15), -1.4, c(33), 0xd8e8a0, 0.8, 20); d.glow(c(30), -1.4, c(33), 0xd8e8a0, 0.8, 20);
      for (const [x, z] of [[c(5), c(1)], [c(20), c(2)], [c(25), c(12)], [c(40), c(12)], [c(14), c(12)]]) d.lamp(x, z, 5.0, 0xfff0c0);
      // queda do rio (-1 → -2) e a grade onde ele termina
      d.box(2.6, 2.8, 0.2, c(28), -4.8, 28 * S - 0.1, 0xb8d870, 'slime');
      d.box(0.2, 2.6, 6.0, 33 * S - 0.12, -4.9, 81, 0x2a2e30, 'grate'); d.sign('GRADE DE RETENÇÃO', '#f0d020', '#111', null, 33 * S - 0.16, -3.1, 81, -Math.PI / 2, 3.0, 0.7);
      d.sign('ESTAÇÃO DE TRATAMENTO · CISTERNA', '#e8e4dc', '#1a1a1a', null, c(22), 2.6, 2 * S + 0.03, 0, 3.4, 0.7);
      d.sign('BUEIRO ABERTO · ESCADA', '#f0d020', '#111', null, c(9) + 0.0, 2.2, 12 * S + 0.03, 0, 2.2, 0.6); d.sign('BUEIRO ABERTO · ESCADA', '#f0d020', '#111', null, c(36), 2.2, 12 * S + 0.03, 0, 2.2, 0.6);
      d.letter('A', c(22), 0.03, c(4), -Math.PI / 2, 0, 2.6); d.letter('B', c(22), -8.97, c(8), -Math.PI / 2, 0, 2.6);
      d.pipe(c(9), 34 * S - 0.4, c(36), 34 * S - 0.4, -0.6, 0.28, 0x6a5a40); d.pipe(c(14), 24 * S + 0.4, c(32), 24 * S + 0.4, -3.6, 0.22, 0x3a5a3a);
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
