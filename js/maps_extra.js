// Identidade de cada mapa: quantas casas entram, mobília própria, peças-chave do tema (mundo com colisão) e construções de fundo.
// Aplicado por cima dos mapas já registrados (maps.js e maps3.js).
(function () {
  const M = G.Map, S3 = 3;
  const DS = (G.Detail && G.Detail.styles) || {};
  // estilos de acabamento (detail.js) dos mapas novos
  Object.assign(DS, {
    ruinas: { roof: 'flat', parapet: 0, crenel: 0, trim: 0x8a8a74, base: 0x6a6a58, frame: 0x4a4a3a, win: 0, ac: 0, pipe: 0, wires: 0, lamp: 0, band: 0, roofProps: 0, awn: 0, sign: 0, beams: 0, laundry: 0 },
    esgoto: { roof: 'flat', parapet: 0, trim: 0x4a5a3a, base: 0x2a3a22, frame: 0x2a3022, win: 0, ac: 0, pipe: 0.06, hpipe: 0.35, wires: 0, lamp: 0.06, band: 0, roofProps: 0, awn: 0, sign: 0, beams: 1, light: 0xd8e8a0 },
    pontes: { roof: 'gable', roofTex: 'roofRed', trim: 0xf2ece0, base: 0x8a7c6a, frame: 0x4a3220, shutters: [0x3a6a8a, 0x6a3a2a, 0x3a6a3a, 0x8a7a2a], ac: 0, pipe: 0.1, awn: 0.1, wires: 0.35, laundry: 0.3, lamp: 0.07, light: 0xffe2a0 }
  });
  const X = {
    sirocco: {
      houses: 3, ladderCount: 1, furnDens: 0.14,
      furnLib: { inS: ['wardrobe', 'bookshelf', 'urn', 'shelf:wood'], inD: ['table', 'sofa', 'bed'], outS: ['urn', 'barrelRow', 'planter'], outD: ['stall', 'cart', 'hay', 'urn'] },
      setpieces: [['well', 22, 26, 0, { r: 2 }], ['stall', 20, 18, 0, { n: 0 }], ['stall', 24, 20, 180, { n: 1 }], ['stall', 20, 24, 0, { n: 2 }], ['cart', 23, 14, 90], ['hay', 21, 30, 0], ['stall', 24, 12, 0, { n: 3 }], ['urn', 19, 12], ['urn', 25, 28]],
      decor(d, c, S) {
        d.cyl(1.5, 16, c(11), 8, c(15), 0xe8dcc0, 'plaster'); d.cyl(2.0, 1.2, c(11), 16.6, c(15), 0xd8c8a0, 'plaster'); d.cyl(2.4, 2.6, c(11), 18.5, c(15), 0x3a8a8a, 'tiles', 0);
        d.cyl(1.2, 12, c(34), 6, c(18), 0xe8dcc0, 'plaster'); d.cyl(1.7, 2.4, c(34), 13.2, c(18), 0x3a8a8a, 'tiles', 0);
        for (const [x, z] of [[c(4), c(14)], [c(40), c(6)], [c(12), c(22)]]) d.tree(x, z, 2.2, false, true);
      }
    },
    porto: {
      houses: 1, ladderCount: 2, furnDens: 0.16,
      furnLib: { inS: ['shelf', 'cabinet', 'lockers'], inD: ['workbench', 'forklift', 'compressor'], outS: ['barrelRow', 'gasCyl', 'valves'], outD: ['forklift', 'pallet', 'pallet:sacks', 'spool', 'generator'] },
      setpieces: [['craneLeg', 5, 6, 0, { r: 0 }], ['craneLeg', 21, 6, 0, { r: 0 }], ['forklift', 12, 19, 90], ['forklift', 31, 19, 0, { color: 'blue' }], ['barrelRow', 16, 5, 0], ['barrelRow', 7, 17, 0], ['pallet', 28, 19, 0]],
      decor(d, c, S) {
        d.box(50, 0.9, 1.1, 40.5, 10.0, c(6), 0xd8a72a, 'metal'); d.box(2.4, 1.0, 1.6, 30, 9.0, c(6), 0x3a3e44, 'metal'); d.cyl(0.06, 5, 30, 6.0, c(6), 0x222222); d.box(1.0, 0.8, 1.0, 30, 3.3, c(6), 0xd8a72a, 'metal');
        d.cyl(2.2, 18, c(10), 9, c(1), 0xf0ece4, 'plaster'); d.cyl(2.8, 2.2, c(10), 19, c(1), 0xb02a2a, 'plaster'); d.glow(c(10), 19.5, c(1) + 1, 0xfff0a0, 1.2, 40);
        d.cyl(4.5, 3, c(38), 9.5, c(34), 0x8a2a24, 'corrugated'); d.cyl(0.5, 8, c(38), 16, c(34), 0x6a6a6a);
      }
    },
    nevada: {
      houses: 3, ladderCount: 1, furnDens: 0.12,
      furnLib: { inS: ['wardrobe', 'bookshelf', 'fridge', 'stove'], inD: ['table', 'bed', 'sofa'], outS: ['firewood', 'snowman', 'planter'], outD: ['firewood', 'snowman', 'hay', 'cart'] },
      setpieces: [['snowman', 18, 6, 0], ['snowman', 30, 5, 0], ['firewood', 21, 11, 0], ['well', 21, 9, 0], ['cart', 22, 17, 90], ['firewood', 12, 12, 0], ['snowman', 6, 16, 0], ['hay', 38, 10, 0]],
      decor(d, c, S) {
        d.box(5, 12, 5, c(16), 6, c(9), 0xd8d0c4, 'plaster'); d.cyl(3.4, 7, c(16), 15.5, c(9), 0x6a3a2a, 'roofSnow', 0); d.box(0.3, 1.6, 0.3, c(16), 19.8, c(9), 0xc8c8c8); d.box(1.2, 0.3, 0.3, c(16), 19.6, c(9), 0xc8c8c8);
        for (const [x, z] of [[c(3), c(8)], [c(40), c(4)], [c(2), c(25)], [c(30), c(36)], [c(44), c(20)], [c(12), c(35)]]) d.tree(x, z, 2.0, true);
      }
    },
    colonial: {
      houses: 3, ladderCount: 2, furnDens: 0.12,
      furnLib: { inS: ['bookshelf', 'wardrobe', 'cabinet'], inD: ['table', 'sofa', 'desk', 'bed'], outS: ['urn', 'planter', 'bench'], outD: ['statue', 'well', 'stall', 'cart'] },
      setpieces: [['fountain', 22, 17, 0, { r: 2 }], ['statue', 30, 19, 0], ['well', 12, 20, 0], ['stall', 16, 19, 0, { n: 0 }], ['stall', 28, 17, 180, { n: 2 }], ['bench', 18, 21, 0], ['bench', 26, 21, 0]],
      decor(d, c, S) {
        d.box(6, 22, 6, c(26), 11, c(11), 0xe6d8bc, 'plaster'); d.cyl(4.4, 8, c(26), 26, c(11), 0xb04a2a, 'terracotta', 0); d.box(2.0, 2.0, 0.2, c(26), 18, c(11) + 3.1, 0xf2ecd8); d.glow(c(26), 18, c(11) + 3.3, 0xfff0c0, 0.6, 12);
        d.box(6, 14, 6, c(8), 7, c(10), 0xd8c8a8, 'plaster'); d.cyl(4.4, 5, c(8), 16.5, c(10), 0xb04a2a, 'terracotta', 0);
      }
    },
    ferro: {
      houses: 1, ladderCount: 3, furnDens: 0.14,
      furnLib: { inS: ['cabinet', 'shelf', 'lockers', 'panel'], inD: ['workbench', 'compressor', 'pump'], outS: ['barrelRow', 'valves', 'gasCyl', 'cabinet'], outD: ['forklift', 'pallet', 'boiler', 'spool'] },
      setpieces: [['locomotive', 14, 17, 90, { color: 'red', r: 1 }], ['trainCar', 24, 17, 90, { n: 1, r: 1 }], ['trainCar', 33, 17, 90, { n: 2, r: 1 }], ['trainCar', 16, 21, 90, { n: 3, r: 1 }], ['trainCar', 27, 21, 90, { n: 0, r: 1 }], ['boiler', 40, 12, 0, { r: 2 }]],
      decor(d, c, S) {
        for (const [x, z] of [[c(11) - 1.2, c(13) - 1.2], [c(11) + 1.2, c(13) - 1.2], [c(11) - 1.2, c(13) + 1.2], [c(11) + 1.2, c(13) + 1.2]]) d.box(0.3, 12, 0.3, x, 6, z, 0x5a4a3a, 'wood');
        d.cyl(3.6, 4.2, c(11), 14, c(13), 0x6a5a48, 'planks'); d.cyl(3.7, 1.4, c(11), 17.2, c(13), 0x4a3a2a, 'roofRed', 0);
        for (const x of [c(14), c(22), c(30)]) { d.box(0.3, 7, 0.3, x, 3.5, 15 * S - 0.3, 0x3a3a3a); d.box(0.7, 1.4, 0.4, x, 7.4, 15 * S - 0.3, 0x2a2a2a); d.glow(x, 7.4, 15 * S - 0.1, 0x40ff60, 0.5, 8); }
      }
    },
    templo: {
      houses: 0, ladderCount: 1, glass: false, furnDens: 0.1,
      furnLib: { inS: ['bookshelf', 'shelf:wood', 'wardrobe', 'brazier'], inD: ['table', 'brazier', 'pallet:sacks'], outS: ['urn', 'brazier', 'planter:wood'], outD: ['urn', 'pallet:sacks', 'brazier'] },
      setpieces: [['obelisk', 14, 18, 0, { r: 1 }], ['obelisk', 30, 18, 0, { r: 1 }], ['statue', 33, 6, 0], ['statue', 4, 7, 0], ['brazier', 18, 12, 0], ['brazier', 24, 12, 0], ['brazier', 18, 30, 0], ['brazier', 24, 30, 0], ['columnBroken', 13, 16], ['columnBroken', 13, 21], ['columnBroken', 29, 16], ['columnBroken', 29, 21], ['column', 27, 10], ['column', 27, 32], ['urn', 9, 18], ['urn', 35, 18]],
      decor(d, c, S) {
        for (let i = 0; i < 5; i++) d.box(34 - i * 6, 3, 24 - i * 4, c(36), 1.5 + i * 3, c(2) + 4, 0xc8a878, 'sandstone');
        d.cyl(0.6, 1.0, c(36), 17.2, c(2) + 4, 0xd8b040, 'metal', 0.0);
        d.banner(c(20) - 0.1, 3.8, c(15), Math.PI / 2, 0xb8801a, 1.1, 2.4); d.banner(c(22) + 0.1, 3.8, c(15), -Math.PI / 2, 0xb8801a, 1.1, 2.4);
      }
    },
    fortaleza: {
      houses: 1, ladderCount: 2, glass: false, furnDens: 0.1,
      furnLib: { inS: ['bookshelf', 'shelf:wood', 'wardrobe', 'brazier'], inD: ['table', 'workbench', 'pallet:sacks'], outS: ['brazier', 'barrelRow'], outD: ['cart', 'sandbagWall', 'hay', 'firewood'] },
      setpieces: [['well', 25, 14, 0], ['statue', 21, 20, 0], ['brazier', 20, 12, 0], ['brazier', 26, 12, 0], ['sandbagWall', 22, 23, 0], ['cart', 34, 25, 90]],
      decor(d, c, S) {
        for (const [x, z] of [[c(2), c(2)], [c(43), c(2)], [c(2), c(35)], [c(43), c(35)]]) { d.cyl(3.6, 17, x, 8.5, z, 0x8a8478, 'stoneWall'); d.cyl(4.2, 1.4, x, 17.7, z, 0x6a645a, 'stoneWall'); d.cyl(4.2, 3.6, x, 20, z, 0x8a2a24, 'roofRed', 0); }
        d.banner(c(22), 11, 7 * S + 0.1, 0, 0x8a1a1a, 2.0, 5); d.banner(c(24), 11, 7 * S + 0.1, 0, 0x1a3a8a, 2.0, 5);
      }
    },
    neon: {
      houses: 2, ladderCount: 4, furnDens: 0.14,
      furnLib: { inS: ['vending', 'cabinet', 'panel', 'shelf'], inD: ['desk', 'workbench', 'compressor', 'vending'], outS: ['vending', 'barrelRow', 'gasCyl'], outD: ['generator', 'pallet', 'compressor', 'cart'] },
      setpieces: [['vending', 11, 16, 0, { color: 0xff3fa8 }], ['vending', 35, 16, 180, { color: 0x3fe0ff }], ['barrelRow', 20, 19, 0], ['vending', 23, 17, 0, { color: 0x7cff6a }], ['cart', 30, 19, 90]],
      decor(d, c, S) {
        for (const [x, z, w, h] of [[c(1), c(1), 14, 46], [c(44), c(1), 14, 38], [c(1), c(36), 14, 42], [c(44), c(36), 14, 50], [c(22), c(1) - 3, 12, 34], [c(22), c(36) + 3, 12, 40]]) {
          d.box(w, h, w, x, h / 2, z, 0x1e2230, 'concrete');
          for (let k = 0; k < 7; k++) d.box(w + 0.1, 0.5, w + 0.1, x, 3 + k * (h / 7), z, [0xff3fa8, 0x3fe0ff, 0xffcf3f, 0x7cff6a][(k + (x | 0)) % 4], null).material.transparent = false;
          d.cyl(0.3, 8, x, h + 4, z, 0x444444); d.glow(x, h + 8, z, 0xff3030, 0.8, 18);
        }
      }
    },
    fundicao: {
      houses: 0, ladderCount: 3, furnDens: 0.2,
      theme: { water: 0xff6a18, waterGlow: 0x7a2a08, waterOpacity: 0.92, waterFx: 0xffb070, deadName: 'Metal fundido', mats: { pool: 'slag' } },
      carve2(fill) { fill(21, 27, 21, 28, 'k', -3.0); fill(24, 27, 24, 28, 'k', -3.0); },
      furnLib: { inS: ['cabinet', 'panel', 'valves', 'lockers'], inD: ['pump', 'boiler', 'compressor', 'tank'], outS: ['valves', 'barrelRow', 'gasCyl'], outD: ['boiler', 'generator', 'pallet', 'spool'] },
      setpieces: [['furnace', 36, 12, 0, { r: 2 }], ['crucible', 32, 15, 0, { r: 2 }], ['conveyor', 22, 25, 90, { r: 2 }], ['conveyor', 12, 24, 90, { r: 1 }], ['forklift', 27, 17, 0], ['boiler', 18, 17, 90, { r: 1 }], ['forklift', 40, 27, 90]],
      decor(d, c, S) {
        d.glow(c(22) + 1.5, 0.2, c(27) + 1.5, 0xff7a20, 1.6, 20);
        d.box(2.0, 0.03, 6.4, c(21) - 0.1, 0.01, c(27) + 1.5, 0xffffff, 'hazard'); d.box(2.0, 0.03, 6.4, c(24) + 0.1, 0.01, c(27) + 1.5, 0xffffff, 'hazard');
        d.sign('CUIDADO · METAL FUNDIDO', '#f0d020', '#111', 'rad', c(22) + 1.5, 3.2, 26 * S + 0.03, 0, 3.0, 0.8);
        d.cyl(1.6, 30, c(44), 15, c(10), 0x5a524a, 'brick'); d.cyl(1.6, 24, c(44), 12, c(26), 0x5a524a, 'brick'); d.glow(c(44), 31, c(10), 0xff8a30, 0.8, 24);
      }
    },
    bairro: {
      houses: 3, ladderCount: 2, furnDens: 0.16,
      furnLib: { inS: ['wardrobe', 'bookshelf', 'shelf:wood', 'fridge', 'stove'], inD: ['table', 'bed', 'sofa', 'desk'], outS: ['bench', 'planter', 'urn', 'firewood'], outD: ['cart', 'hay', 'stall', 'urn'] },
      setpieces: [['fountain', 23, 17, 0, { r: 2 }], ['stall', 33, 20, 0, { n: 0 }], ['stall', 36, 23, 0, { n: 1 }], ['stall', 39, 21, 180, { n: 2 }], ['well', 9, 10, 0], ['statue', 8, 8, 0], ['cart', 29, 30, 0], ['hay', 33, 29, 0], ['stall', 20, 28, 0, { n: 3 }]],
      decor(d, c, S) {
        d.box(4.4, 9, 4.4, c(30), 4.5, c(1), 0xe6d8bc, 'plaster'); d.cyl(3.2, 5, c(30), 11.5, c(1), 0xb04a2a, 'roofRed', 0); d.glow(c(30), 7.4, c(1) + 2.3, 0xfff0c0, 0.5, 10);
      }
    },
    usina: {
      houses: 0, ladderCount: 2,
      decor(d, c, S) { d.banner(c(36), 5.2, 3 * S + 0.12, 0, 0xc83a1a, 1.4, 2.6); }
    }
  };
  // pele das caixas e barris de cada mapa (textura/cor) e estilo das torres de vigia
  const COVER = {
    sirocco: { crateTex: 'planks', crateColor: 0xe6c690, barrelColor: 0x9a6a3a },
    porto: { crateTex: 'container', crateColor: 0x4a7a9a, barrelColor: 0x2a5a8a },
    nevada: { crateTex: 'planks', crateColor: 0xb4ccdc, barrelColor: 0x4a6a8a },
    colonial: { crateTex: 'wood', crateColor: 0xd8b890, barrelColor: 0x6a4a2a },
    usina: { crateTex: 'steelPlate', crateColor: 0x9aa0a4, barrelColor: 0xd8b020 },
    ferro: { crateTex: 'corrugated', crateColor: 0x9a5a3a, barrelColor: 0x3a5a3a },
    templo: { crateTex: 'sandstone', crateColor: 0xe8d8a8, barrelColor: 0xb08a4a },
    fortaleza: { crateTex: 'stoneWall', crateColor: 0xb8b4a8, barrelColor: 0x6a4a2a },
    neon: { crateTex: 'darkTiles', crateColor: 0x8a5ac0, barrelColor: 0xd040b0 },
    fundicao: { crateTex: 'slag', crateColor: 0x8a6a5a, barrelColor: 0xc86a1a },
    bairro: { crateTex: 'plaster', crateColor: 0xd8c8a8, barrelColor: 0x4a7a5a },
    ruinas: { crateTex: 'moss', crateColor: 0xb8c8a0, barrelColor: 0x6a6a50 },
    esgoto: { crateTex: 'metal', crateColor: 0x4a6a4a, barrelColor: 0x6a9a2a },
    pontes: { crateTex: 'wood', crateColor: 0xc8a070, barrelColor: 0x8a5a3a }
  };
  const TOWER = { sirocco: 'stone', porto: 'metal', nevada: 'ice', colonial: 'wood', usina: 'metal', ferro: 'metal', templo: 'stone', fortaleza: 'stone', neon: 'metal', fundicao: 'metal', bairro: 'wood', ruinas: 'ruin', esgoto: 'metal', pontes: 'wood' };
  for (const id in X) {
    const def = M.defs[id], ex = X[id]; if (!def) continue;
    for (const k of ['houses', 'ladderCount', 'glass', 'furnDens', 'furnLib', 'setpieces', 'carve2', 'pipeCount', 'towerCount', 'towerStyle', 'glassColor', 'ladders']) if (ex[k] !== undefined) def[k] = ex[k];
    if (COVER[id]) def.theme = Object.assign({}, def.theme, COVER[id]);
    if (TOWER[id]) def.towerStyle = TOWER[id];
    if (ex.theme) { const th = Object.assign({}, def.theme, ex.theme); th.mats = Object.assign({}, (def.theme || {}).mats || {}, ex.theme.mats || {}); def.theme = th; }
    if (ex.decor) { const od = def.decor; def.decor = d => { if (od) od(d); ex.decor(d, d.c, d.S); }; }
  }
})();
