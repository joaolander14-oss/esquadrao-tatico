// Detalhes procedurais do cenário (só visual, não mexe na colisão):
// degraus nas rampas íngremes (escadas) com corrimão, cornijas/rodapés/frisos nas paredes, telhados das casas
// (duas águas, laje com platibanda ou ameias), janelas com moldura e peitoril, calhas, ar-condicionado, luminárias,
// toldos, placas, tubulações de fábrica, fios e varais sobre becos, luzes e vigas nas salas cobertas.
(function () {
  const D = G.Detail = {};
  const U = G.U;
  // estilo por mapa (o que combina com cada lugar)
  const STY = {
    default: { roof: 'flat', roofTex: 'roofTop', parapet: 1, trim: 0xd9ccb0, base: 0x9a8a70, shutters: [0x3a6a8a, 0x8a4a2a, 0x2f6a4a], frame: 0x5a4430, win: 1, pipe: 0.08, ac: 0.08, lamp: 0.05, awn: 0, sign: 0, hpipe: 0, wires: 0.25, laundry: 0, band: 1, roofProps: 0.5, beams: 1, crenel: 0, light: 0xfff0c8 },
    sirocco: { furn: 'residential', furnDens: 0.14, roof: 'flat', parapet: 1, trim: 0xe6d6b2, base: 0xa08a64, awn: 0.12, ac: 0.1, wires: 0.35, laundry: 0.25 },
    porto: { furn: 'industrial', furnDens: 0.16, roof: 'gable', roofTex: 'roofRed', trim: 0xc8c0b0, base: 0x7a7470, frame: 0x3a3a3a, pipe: 0.14, hpipe: 0.25, sign: 0.06, ac: 0.06, wires: 0.2 },
    nevada: { furn: 'residential', furnDens: 0.12, roof: 'gable', roofTex: 'roofSnow', trim: 0xe8e8e8, base: 0x6a5a4a, frame: 0x4a3020, shutters: [0x6a2a1a, 0x2a4a2a], pipe: 0.06, ac: 0, wires: 0.15, light: 0xffe0a0 },
    colonial: { furn: 'residential', furnDens: 0.12, roof: 'gable', roofTex: 'terracotta', trim: 0xf0e6d0, base: 0x8a7a64, frame: 0x6a4a2a, shutters: [0x2a5a3a, 0x3a4a7a, 0x7a3a2a], awn: 0.06, wires: 0.3, laundry: 0.2 },
    usina: { furn: 'plant', furnDens: 0.24, roof: 'flat', parapet: 1, trim: 0xa8acb0, base: 0x5a5e62, frame: 0x3a3e42, pipe: 0.2, hpipe: 0.4, ac: 0.05, sign: 0.08, wires: 0.1, roofProps: 0.9, light: 0xd8f0ff },
    ferro: { furn: 'industrial', furnDens: 0.16, roof: 'gable', roofTex: 'corrugated', trim: 0xa09a90, base: 0x5a5048, frame: 0x3a342e, pipe: 0.12, hpipe: 0.2, sign: 0.06, wires: 0.2 },
    templo: { furn: 'ancient', furnDens: 0.1, roof: 'flat', parapet: 1, trim: 0xe0c898, base: 0xa08050, frame: 0x6a5030, ac: 0, pipe: 0, lamp: 0.03, wires: 0, band: 1 },
    fortaleza: { furn: 'ancient', furnDens: 0.1, roof: 'flat', parapet: 0, crenel: 1, trim: 0xb8a890, base: 0x7a6a58, frame: 0x4a3626, ac: 0, pipe: 0, wires: 0, lamp: 0.04, light: 0xffc070 },
    neon: { furn: 'urban', furnDens: 0.14, roof: 'flat', parapet: 1, trim: 0x6a6e78, base: 0x2a2c32, frame: 0x1e2026, ac: 0.3, pipe: 0.15, sign: 0.1, wires: 0.45, laundry: 0.1, roofProps: 0.8, light: 0xbfe0ff },
    fundicao: { furn: 'industrial', furnDens: 0.24, roof: 'gable', roofTex: 'corrugated', trim: 0x9a9690, base: 0x4a4642, frame: 0x2e2c2a, pipe: 0.25, hpipe: 0.5, sign: 0.1, ac: 0.04, wires: 0.15, roofProps: 0.9, light: 0xe0f0ff },
    bairro: { furn: 'residential', furnDens: 0.18, roof: 'gable', roofTex: 'roofRed', trim: 0xf2ece0, base: 0x8a7c6a, frame: 0x5a4632, shutters: [0x3a6a8a, 0x6a3a2a, 0x3a6a3a, 0x8a7a2a], ac: 0.16, pipe: 0.1, awn: 0.08, wires: 0.45, laundry: 0.4, lamp: 0.07 }
  };
  const rgb = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
  const mul = (c, f) => [c[0] * f, c[1] * f, c[2] * f];

  // ---------- montagem de geometria mesclada ----------
  function bucket() { return { p: [], n: [], u: [], c: [] }; }
  function pushV(b, p, n, uv, col) { b.p.push(p[0], p[1], p[2]); b.n.push(n[0], n[1], n[2]); b.u.push(uv[0], uv[1]); b.c.push(col[0], col[1], col[2]); }
  function addBox(b, x0, y0, z0, x1, y1, z1, col, s, skipBottom) {
    s = s || 2; col = col || [1, 1, 1];
    const F = [
      [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], 0],
      [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], 0],
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], 1],
      [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], 1],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], 2],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], 2]
    ];
    for (let f = 0; f < 6; f++) {
      if (skipBottom && f === 5) continue;
      const [n, v, ax] = F[f];
      const sh = n[1] > 0 ? 1 : n[1] < 0 ? 0.55 : n[0] !== 0 ? 0.84 : 0.92, cc = mul(col, sh);
      for (const q of [0, 1, 2, 0, 2, 3]) { const p = v[q]; pushV(b, p, n, ax === 0 ? [p[2] / s, p[1] / s] : ax === 1 ? [p[0] / s, p[1] / s] : [p[0] / s, p[2] / s], cc); }
    }
  }
  function addQuad(b, v, col, s, uvAx) {
    // normal pela regra da mão direita (v em sentido anti-horário visto de fora)
    const a = v[0], bb = v[1], c = v[2];
    const ux = bb[0] - a[0], uy = bb[1] - a[1], uz = bb[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    const sh = 0.75 + 0.25 * Math.max(0, ny);
    const uvOf = p => uvAx === 'x' ? [p[2] / s, p[1] / s] : uvAx === 'z' ? [p[0] / s, p[1] / s] : uvAx === 'rx' ? [p[0] / s, (p[1] + p[2]) / s] : uvAx === 'rz' ? [p[2] / s, (p[1] + p[0]) / s] : [p[0] / s, p[2] / s];
    const idx = v.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2];
    for (const q of idx) pushV(b, v[q], [nx, ny, nz], uvOf(v[q]), mul(col, sh));
  }

  D.build = (group, M, quality) => {
    const W = M.W, H = M.H, S = M.S, grid = M.grid, isWall = M.isWall, corn = M.corn, ramp = M.ramp, cb = M.cb, th = M.theme, TYPES = M.TYPES;
    const st = Object.assign({}, STY.default, STY[M.current] || {});
    const dens = quality > 0 ? 1 : 0.6;
    const hq = quality > 0;
    const bk = {};
    const B = (tex, basic) => { const k = tex + (basic ? '#b' : ''); return (bk[k] || (bk[k] = { b: bucket(), tex, basic })).b; };
    const K = (i, j) => j * W + i, inb = (i, j) => i >= 0 && j >= 0 && i < W && j < H;
    const cr = k => [corn[k * 4], corn[k * 4 + 1], corn[k * 4 + 2], corn[k * 4 + 3]];
    const topH = k => Math.max(...cr(k)), lowH = k => Math.min(...cr(k));
    const hash = (a, b) => U.hash2(a, b);
    const roofed = k => cb[k] < 900 && !isWall[k];
    const wallTex = th.mats.wall, trimC = rgb(st.trim), baseC = rgb(st.base), frameC = rgb(st.frame);
    const lines = [];           // fios/varais (malhas avulsas)
    const extra = [];           // cilindros avulsos (caixas d'água, corrimãos)

    // ================= 1) escadas (rampas íngremes ou dentro de salas) =================
    const stairTex = th.mats.stair || 'stone';
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = K(i, j); if (!ramp[k] || isWall[k]) continue;
      const c = cr(k), lo = Math.min(...c), hi = Math.max(...c), rise = hi - lo;
      if (rise < 0.25 || (rise < 0.55 && !roofed(k))) continue;
      const gx = ((c[1] - c[0]) + (c[3] - c[2])) / 2, gz = ((c[2] - c[0]) + (c[3] - c[1])) / 2;
      const alongX = Math.abs(gx) >= Math.abs(gz), up = (alongX ? gx : gz) > 0 ? 1 : -1;
      const n = Math.max(2, Math.round(rise / 0.19)), x0 = i * S, z0 = j * S;
      const b = B(stairTex), col = [0.95, 0.94, 0.92];
      for (let s = 0; s < n; s++) {
        const t0 = s / n, t1 = (s + 1) / n, y1 = lo + rise * t1 + 0.012;
        const a0 = up > 0 ? t0 * S : (1 - t1) * S, a1 = up > 0 ? t1 * S : (1 - t0) * S;
        const cc = mul(col, s % 2 ? 0.96 : 1);
        if (alongX) addBox(b, x0 + a0, lo - 0.05, z0, x0 + a1, y1, z0 + S, cc, 1.5, true);
        else addBox(b, x0, lo - 0.05, z0 + a0, x0 + S, y1, z0 + a1, cc, 1.5, true);
        // focinho escuro do degrau
        const nb = B('metal'), lip = 0.035, dk = [0.35, 0.35, 0.36];
        const ef = up > 0 ? a0 : a1;   // borda de baixo do degrau
        if (alongX) addBox(nb, x0 + ef - (up > 0 ? 0 : lip), y1 - 0.03, z0 + 0.02, x0 + ef + (up > 0 ? lip : 0), y1 + 0.004, z0 + S - 0.02, dk, 1);
        else addBox(nb, x0 + 0.02, y1 - 0.03, z0 + ef - (up > 0 ? 0 : lip), x0 + S - 0.02, y1 + 0.004, z0 + ef + (up > 0 ? lip : 0), dk, 1);
      }
      // corrimão nas laterais abertas (vizinho mais baixo)
      const sides = alongX ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
      for (const [di, dj] of sides) {
        const ni = i + di, nj = j + dj; if (!inb(ni, nj)) continue;
        const nk = K(ni, nj); if (isWall[nk] || (ramp[nk] && Math.abs(topH(nk) - hi) < 0.3)) continue;
        if (lowH(nk) > hi - 0.6) continue;
        const ex = alongX ? null : (di > 0 ? x0 + S - 0.08 : x0 + 0.08), ez = alongX ? (dj > 0 ? z0 + S - 0.08 : z0 + 0.08) : null;
        const pA = alongX ? [x0, ez] : [ex, z0], pB = alongX ? [x0 + S, ez] : [ex, z0 + S];
        const hA = M.heightAt(pA[0] + (alongX ? 0.01 : 0), pA[1] + (alongX ? 0 : 0.01)), hB = M.heightAt(pB[0] - (alongX ? 0.01 : 0), pB[1] - (alongX ? 0 : 0.01));
        extra.push({ kind: 'rail', a: [pA[0], hA + 0.95, pA[1]], b: [pB[0], hB + 0.95, pB[1]], posts: [[pA[0], hA, pA[1]], [(pA[0] + pB[0]) / 2, (hA + hB) / 2, (pA[1] + pB[1]) / 2]] });
      }
    }

    // ================= 2) paredes: rodapé, friso, cornija, janelas e equipamentos =================
    const NB = [[1, 0, 'x', 1], [-1, 0, 'x', -1], [0, 1, 'z', 1], [0, -1, 'z', -1]];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = K(i, j); if (!isWall[k]) continue;
      const wt = topH(k);
      for (const [di, dj, ax, dir] of NB) {
        const ni = i + di, nj = j + dj; if (!inb(ni, nj)) continue;
        const nk = K(ni, nj); if (isWall[nk]) continue;
        const nc = cr(nk), edge = ax === 'x' ? (dir > 0 ? [nc[0], nc[2]] : [nc[1], nc[3]]) : (dir > 0 ? [nc[0], nc[1]] : [nc[2], nc[3]]);
        const nf = Math.min(edge[0], edge[1]), nfMax = Math.max(edge[0], edge[1]);
        const hgt = wt - nf; if (hgt < 1.6) continue;
        const pos = ax === 'x' ? (dir > 0 ? (i + 1) * S : i * S) : (dir > 0 ? (j + 1) * S : j * S);
        const a0 = ax === 'x' ? j * S : i * S, a1 = a0 + S;
        const inside = roofed(nk), ceil = inside ? cb[nk] : 1e9;
        // tira ao longo da face: dist = saliência; y0..y1
        const strip = (b, y0, y1, prot, col, ext) => {
          const e0 = ext ? prot : 0, e1 = ext ? prot : 0, eps = ax === 'x' ? 0.002 : 0;
          if (ax === 'x') { const xa = dir > 0 ? pos : pos - prot, xb = dir > 0 ? pos + prot : pos; addBox(b, xa, y0 + eps, a0 - e0, xb, y1 + eps, a1 + e1, col, 1.2); }
          else { const za = dir > 0 ? pos : pos - prot, zb = dir > 0 ? pos + prot : pos; addBox(b, a0 - e0, y0, za, a1 + e1, y1, zb, col, 1.2); }
        };
        // a ponta da parede é uma quina externa? (estende a tira para fechar o canto)
        const outer = (() => {
          const ai = ax === 'x' ? i : i - 1, aj = ax === 'x' ? j - 1 : j, bi = ax === 'x' ? i : i + 1, bj = ax === 'x' ? j + 1 : j;
          const open = (ii, jj) => !inb(ii, jj) || !isWall[K(ii, jj)];
          return open(ai, aj) || open(bi, bj);
        })();
        // rodapé (não em rampas)
        if (!ramp[nk] && nfMax - nf < 0.05) strip(B(st.baseTex || 'stone'), nf - 0.02, nf + 0.42, 0.06, baseC, outer);
        // friso entre andares (só externo, paredes altas)
        if (st.band && !inside && hgt > 6.2 && nfMax - nf < 0.05) strip(B(st.baseTex || 'stone'), nf + 3.25, nf + 3.42, 0.07, trimC, outer);
        // cornija no topo (externa) / sob o teto (interna, só se o teto estiver abaixo do topo)
        if (!inside || ceil > wt - 0.1) {
          if (!st.crenel) { strip(B(st.baseTex || 'stone'), wt - 0.26, wt - 0.06, 0.16, trimC, outer); strip(B(st.baseTex || 'stone'), wt - 0.06, wt + 0.02, 0.22, mul(trimC, 0.92), outer); }
        }
        if (inside) continue;
        // janela já existente (mesma regra do motor): moldura, peitoril e venezianas
        const hasWin = th.window !== 'none' && Math.min(...[wt]) - nf > 4.8 && hash(i * 3 + dir, j * 5 + (ax === 'x' ? 1 : 2)) < th.winChance;
        const out = (d) => dir * d;    // deslocamento para fora da parede
        const P = (along, y, o) => ax === 'x' ? [pos + out(o), y, along] : [along, y, pos + out(o)];
        const fb = B('wood');
        const boxAt = (b, al0, al1, y0, y1, o0, o1, col, s) => {
          const p0 = P(al0, y0, o0), p1 = P(al1, y1, o1);
          addBox(b, Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), Math.min(p0[2], p1[2]), Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1]), Math.max(p0[2], p1[2]), col, s || 1);
        };
        if (hasWin && st.win) {
          const wa = a0 + 0.9, wb = a0 + 2.1, wy0 = nf + 2.6, wy1 = nf + 4.2;
          boxAt(fb, wa - 0.1, wa, wy0 - 0.05, wy1 + 0.05, 0, 0.09, frameC); boxAt(fb, wb, wb + 0.1, wy0 - 0.05, wy1 + 0.05, 0, 0.09, frameC);
          boxAt(fb, wa - 0.1, wb + 0.1, wy1, wy1 + 0.12, 0, 0.1, frameC);
          boxAt(B(st.baseTex || 'stone'), wa - 0.22, wb + 0.22, wy0 - 0.14, wy0, 0, 0.2, trimC);                 // peitoril
          if (th.window === 'shutter' && st.shutters.length) {
            const sc = rgb(st.shutters[(i * 7 + j * 3) % st.shutters.length]);
            boxAt(B('planks'), wa - 0.62, wa - 0.12, wy0, wy1, 0.02, 0.07, sc, 0.6); boxAt(B('planks'), wb + 0.12, wb + 0.62, wy0, wy1, 0.02, 0.07, sc, 0.6);
          }
          // segunda fileira de janelas em paredes muito altas
          if (hgt > 8.4 && hash(i + 11, j + 7) < 0.7) {
            const y0 = nf + 5.9, y1 = nf + 7.3;
            boxAt(B('metal'), wa + 0.05, wb - 0.05, y0, y1, 0.005, 0.02, [0.16, 0.2, 0.24]);
            boxAt(fb, wa - 0.08, wb + 0.08, y0 - 0.12, y0, 0, 0.16, trimC); boxAt(fb, wa - 0.08, wb + 0.08, y1, y1 + 0.1, 0, 0.08, frameC);
          }
        }
        const r = hash(i * 13 + (ax === 'x' ? 5 : 9) + dir, j * 17 + 3);
        let acc = 0;
        const pick = (p) => { const hit = r >= acc && r < acc + p * dens; acc += p * dens; return hit; };
        if (pick(st.pipe)) {              // calha / tubo de descida
          const al = a0 + 0.25;
          boxAt(B('metal'), al, al + 0.14, nf, wt - 0.1, 0.05, 0.19, [0.55, 0.56, 0.58]);
          for (let y = nf + 1.4; y < wt - 0.5; y += 1.6) boxAt(B('metal'), al - 0.02, al + 0.16, y, y + 0.06, 0, 0.21, [0.4, 0.4, 0.42]);
        } else if (!hasWin && hgt > 4 && pick(st.ac)) {   // ar-condicionado
          const al = a0 + 0.6 + r * 0.8, y = nf + 2.3 + (r * 7 % 1) * 1.2;
          boxAt(B('metal'), al, al + 0.85, y, y + 0.56, 0, 0.42, [0.85, 0.86, 0.84]);
          boxAt(B('grate'), al + 0.08, al + 0.77, y + 0.06, y + 0.5, 0.42, 0.425, [0.5, 0.5, 0.5]);
          boxAt(B('metal'), al + 0.1, al + 0.75, y - 0.08, y, 0.02, 0.4, [0.3, 0.3, 0.3]);
        } else if (pick(st.lamp)) {      // luminária de parede
          const al = a0 + 1.5;
          boxAt(B('metal'), al - 0.08, al + 0.08, nf + 2.7, nf + 2.95, 0, 0.3, [0.15, 0.15, 0.15]);
          boxAt(B('light', true), al - 0.1, al + 0.1, nf + 2.62, nf + 2.72, 0.12, 0.32, rgb(st.light));
        } else if (st.awn && !hasWin && pick(st.awn)) {   // toldo inclinado
          const ac = rgb([0xb84a3a, 0x3a7a9a, 0xd8b04a, 0x4a8a4a][(i + j) % 4]), y = nf + 2.75;
          const v = ax === 'x'
            ? (dir > 0 ? [[pos, y + 0.45, a0 + 0.2], [pos, y + 0.45, a1 - 0.2], [pos + 1.3, y, a1 - 0.2], [pos + 1.3, y, a0 + 0.2]].reverse() : [[pos, y + 0.45, a0 + 0.2], [pos, y + 0.45, a1 - 0.2], [pos - 1.3, y, a1 - 0.2], [pos - 1.3, y, a0 + 0.2]])
            : (dir > 0 ? [[a0 + 0.2, y + 0.45, pos], [a1 - 0.2, y + 0.45, pos], [a1 - 0.2, y, pos + 1.3], [a0 + 0.2, y, pos + 1.3]] : [[a0 + 0.2, y + 0.45, pos], [a1 - 0.2, y + 0.45, pos], [a1 - 0.2, y, pos - 1.3], [a0 + 0.2, y, pos - 1.3]].reverse());
          addQuad(B('cloth'), v, ac, 1.2); addQuad(B('cloth'), v.slice().reverse(), mul(ac, 0.7), 1.2);
        } else if (st.sign && !hasWin && hgt > 4 && pick(st.sign)) {    // placa
          const sc = rgb([0x2a4a8a, 0x8a2a2a, 0x2a6a3a, 0xc89a2a, 0x3a3a3a][(i * 3 + j) % 5]);
          boxAt(B('steelPlate'), a0 + 0.4, a1 - 0.4, nf + 3.0, nf + 3.9, 0, 0.06, sc);
          boxAt(B('light', true), a0 + 0.6, a1 - 0.6, nf + 3.35, nf + 3.5, 0.06, 0.065, [0.95, 0.95, 0.9]);
        }
        // tubulação horizontal de fábrica (em trechos contínuos de 4 células)
        if (st.hpipe && hgt > 4.5 && hash(ax === 'x' ? i * 2 + dir : (i >> 2) + 77, ax === 'x' ? (j >> 2) + 31 : j * 2 + dir) < st.hpipe * dens) {
          const y = nf + 3.6 + (hash(i, j >> 2) > 0.5 ? 0.5 : 0);
          boxAt(B('metal'), a0 - (outer ? 0 : 0.01), a1 + (outer ? 0 : 0.01), y, y + 0.22, 0.12, 0.34, [0.62, 0.5, 0.36]);
          boxAt(B('metal'), a0 + 1.4, a0 + 1.6, y - 0.05, y + 0.27, 0, 0.36, [0.3, 0.3, 0.32]);
        }
      }
    }

    // ================= 3) telhados (retângulos de paredes com o mesmo topo) =================
    const seen = new Uint8Array(W * H);
    const border = (i, j) => i === 0 || j === 0 || i === W - 1 || j === H - 1;
    const rects = [];
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = K(i, j); if (!isWall[k] || seen[k]) continue;
      const h = topH(k);
      const okC = (ii, jj) => inb(ii, jj) && !border(ii, jj) && isWall[K(ii, jj)] && !seen[K(ii, jj)] && Math.abs(topH(K(ii, jj)) - h) < 0.01;
      let w = 1; while (okC(i + w, j) && w < 8) w++;
      let d = 1; outer: while (d < 8) { for (let q = 0; q < w; q++) if (!okC(i + q, j + d)) break outer; d++; }
      for (let jj = j; jj < j + d; jj++) for (let ii = i; ii < i + w; ii++) seen[K(ii, jj)] = 1;
      rects.push({ i, j, w, d, h });
    }
    const roofB = B(st.roofTex), gableB = B(wallTex), parB = B(st.baseTex || 'stone');
    for (const r of rects) {
      const x0 = r.i * S, z0 = r.j * S, x1 = (r.i + r.w) * S, z1 = (r.j + r.d) * S, y = r.h;
      if (st.roof === 'gable' && r.w >= 2 && r.d >= 2) {
        const o = 0.35, alongX = (x1 - x0) >= (z1 - z0), span = alongX ? (z1 - z0) : (x1 - x0), rh = Math.min(2.8, span * 0.36);
        const X0 = x0 - o, X1 = x1 + o, Z0 = z0 - o, Z1 = z1 + o, rc = [1, 1, 1];
        if (alongX) {
          const zm = (z0 + z1) / 2;
          addQuad(roofB, [[X0, y - 0.12, Z1], [X1, y - 0.12, Z1], [X1, y + rh, zm], [X0, y + rh, zm]], rc, 2.5, 'rx');
          addQuad(roofB, [[X1, y - 0.12, Z0], [X0, y - 0.12, Z0], [X0, y + rh, zm], [X1, y + rh, zm]], mul(rc, 0.92), 2.5, 'rx');
          addQuad(roofB, [[X0, y - 0.12, Z0], [X1, y - 0.12, Z0], [X1, y + rh, zm], [X0, y + rh, zm]].reverse(), mul(rc, 0.5), 2.5, 'rx');   // forro (visto de baixo)
          addQuad(gableB, [[x0, y, z0], [x0, y, z1], [x0, y + rh - 0.1, zm]], trimC, 3, 'x');
          addQuad(gableB, [[x1, y, z1], [x1, y, z0], [x1, y + rh - 0.1, zm]], trimC, 3, 'x');
          addBox(B('metal'), X0, y + rh - 0.04, zm - 0.12, X1, y + rh + 0.1, zm + 0.12, [0.45, 0.42, 0.4], 1);
        } else {
          const xm = (x0 + x1) / 2;
          addQuad(roofB, [[X1, y - 0.12, Z1], [X1, y - 0.12, Z0], [xm, y + rh, Z0], [xm, y + rh, Z1]], rc, 2.5, 'rz');
          addQuad(roofB, [[X0, y - 0.12, Z0], [X0, y - 0.12, Z1], [xm, y + rh, Z1], [xm, y + rh, Z0]], mul(rc, 0.92), 2.5, 'rz');
          addQuad(gableB, [[x0, y, z1], [x1, y, z1], [xm, y + rh - 0.1, z1]], trimC, 3, 'z');
          addQuad(gableB, [[x1, y, z0], [x0, y, z0], [xm, y + rh - 0.1, z0]], trimC, 3, 'z');
          addBox(B('metal'), xm - 0.12, y + rh - 0.04, Z0, xm + 0.12, y + rh + 0.1, Z1, [0.45, 0.42, 0.4], 1);
        }
        // chaminé
        if (hash(r.i * 5, r.j * 9) < 0.35) { const cx = x0 + S * 0.7, cz = z0 + S * 0.7; addBox(parB, cx - 0.35, y, cz - 0.35, cx + 0.35, y + rh + 0.9, cz + 0.35, baseC, 1.5); }
        continue;
      }
      // laje: platibanda (ou ameias) + objetos no telhado
      const pt = 0.22, ph = st.crenel ? 0.9 : 0.55;
      const rim = (xa, za, xb, zb) => {
        if (!st.crenel) { addBox(parB, xa, y, za, xb, y + ph, zb, trimC, 1.5); return; }
        const along = (xb - xa) > (zb - za), L = along ? xb - xa : zb - za, n = Math.max(1, Math.round(L / 1.1));
        addBox(parB, xa, y, za, xb, y + 0.4, zb, trimC, 1.5);
        for (let q = 0; q < n; q += 2) { const s0 = q * L / n, s1 = (q + 1) * L / n; if (along) addBox(parB, xa + s0, y + 0.4, za, xa + s1, y + ph + 0.4, zb, trimC, 1.5); else addBox(parB, xa, y + 0.4, za + s0, xb, y + ph + 0.4, za + s1, trimC, 1.5); }
      };
      if (st.parapet || st.crenel) { rim(x0, z0, x1, z0 + pt); rim(x0, z1 - pt, x1, z1); rim(x0, z0 + pt, x0 + pt, z1 - pt); rim(x1 - pt, z0 + pt, x1, z1 - pt); }
      if (r.w * r.d >= 2 && hash(r.i * 3 + 1, r.j * 7 + 2) < st.roofProps) {
        const cx = (x0 + x1) / 2 + (hash(r.i, r.j) - 0.5) * (x1 - x0) * 0.4, cz = (z0 + z1) / 2 + (hash(r.j, r.i) - 0.5) * (z1 - z0) * 0.4, t = hash(r.i + 9, r.j + 4);
        if (t < 0.4) { addBox(B('metal'), cx - 0.6, y, cz - 0.45, cx + 0.6, y + 0.9, cz + 0.45, [0.82, 0.83, 0.82], 1); addBox(B('grate'), cx - 0.4, y + 0.9, cz - 0.3, cx + 0.4, y + 0.93, cz + 0.3, [0.4, 0.4, 0.4], 0.5); }
        else if (t < 0.75) extra.push({ kind: 'tank', x: cx, y, z: cz });
        else { addBox(B('metal'), cx - 0.25, y, cz - 0.25, cx + 0.25, y + 1.2, cz + 0.25, [0.5, 0.5, 0.52], 1); addBox(B('metal'), cx - 0.4, y + 1.2, cz - 0.4, cx + 0.4, y + 1.35, cz + 0.4, [0.35, 0.35, 0.36], 1); }
      }
    }

    // ================= 4) células especiais: janelas ('j'), muretas ('h'), salas cobertas =================
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = K(i, j), T = TYPES[grid[k]] || {};
      const x0 = i * S, z0 = j * S, f = topH(k);
      if (T.window) {
        // batentes e peitoril de madeira nos dois lados abertos
        for (const [di, dj, ax] of NB) {
          const ni = i + di, nj = j + dj; if (!inb(ni, nj) || isWall[K(ni, nj)]) continue;
          if (ax === 'x') { const x = di > 0 ? x0 + S : x0; addBox(B('wood'), x - 0.08, f - 0.02, z0 + 0.05, x + 0.08, f + 0.06, z0 + S - 0.05, frameC, 1); addBox(B('wood'), x - 0.06, cb[k] - 0.12, z0 + 0.05, x + 0.06, cb[k], z0 + S - 0.05, frameC, 1); }
          else { const z = dj > 0 ? z0 + S : z0; addBox(B('wood'), x0 + 0.05, f - 0.02, z - 0.08, x0 + S - 0.05, f + 0.06, z + 0.08, frameC, 1); addBox(B('wood'), x0 + 0.05, cb[k] - 0.12, z - 0.06, x0 + S - 0.05, cb[k], z + 0.06, frameC, 1); }
        }
        // montante central
        const open = NB.filter(([di, dj]) => inb(i + di, j + dj) && !isWall[K(i + di, j + dj)]);
        if (open.length && open[0][2] === 'x') addBox(B('wood'), x0 + S / 2 - 0.04, f, z0 + S / 2 - 0.04, x0 + S / 2 + 0.04, cb[k], z0 + S / 2 + 0.04, frameC, 1);
        else if (open.length) addBox(B('wood'), x0 + S / 2 - 0.04, f, z0 + S / 2 - 0.04, x0 + S / 2 + 0.04, cb[k], z0 + S / 2 + 0.04, frameC, 1);
      }
      if (T.low) addBox(parB, x0 - 0.04, f - 0.02, z0 - 0.04, x0 + S + 0.04, f + 0.08, z0 + S + 0.04, trimC, 1.5);     // capa da mureta
      if (roofed(k) && !T.window && cb[k] - f > 2.4) {
        const y = cb[k];
        // vigas do forro em linhas alternadas
        if (st.beams && i % 2 === 0) addBox(B(st.roof === 'gable' ? 'wood' : 'concrete'), x0 + S / 2 - 0.14, y - 0.32, z0, x0 + S / 2 + 0.14, y, z0 + S, [0.75, 0.72, 0.68], 1.5, false);
        // luminária de teto
        if ((i + j) % 2 === 0) {
          addBox(B('metal'), x0 + S / 2 - 0.5, y - 0.12, z0 + S / 2 - 0.12, x0 + S / 2 + 0.5, y - 0.04, z0 + S / 2 + 0.12, [0.3, 0.3, 0.3], 1);
          addBox(B('light', true), x0 + S / 2 - 0.45, y - 0.135, z0 + S / 2 - 0.08, x0 + S / 2 + 0.45, y - 0.12, z0 + S / 2 + 0.08, rgb(st.light), 1);
        }
        // tubulação no teto (fábricas)
        if (st.hpipe && j % 3 === 0) addBox(B('metal'), x0 - 0.01, y - 0.55, z0 + 0.5, x0 + S + 0.01, y - 0.35, z0 + 0.7, [0.62, 0.5, 0.36], 1);
      }
    }

    // ================= 5) fios e varais sobre becos estreitos =================
    if (st.wires || st.laundry) for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = K(i, j); if (isWall[k] || roofed(k)) continue;
      const wx = isWall[K(i - 1, j)] && isWall[K(i + 1, j)], wz = isWall[K(i, j - 1)] && isWall[K(i, j + 1)];
      if (!wx && !wz) continue;
      const hTop = wx ? Math.min(topH(K(i - 1, j)), topH(K(i + 1, j))) : Math.min(topH(K(i, j - 1)), topH(K(i, j + 1)));
      const f = topH(k); if (hTop - f < 4.6) continue;
      const r = hash(i * 31 + 7, j * 19 + 3);
      if (r < st.wires * dens) lines.push({ x: wx, i, j, y: Math.min(hTop - 0.8, f + 5.6), cloth: r < st.laundry * dens * st.wires });
    }

    // ---------- materializa ----------
    for (const key in bk) {
      const { b, tex, basic } = bk[key]; if (!b.p.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.u, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
      const mat = basic ? new THREE.MeshBasicMaterial({ vertexColors: true })
        : new THREE.MeshLambertMaterial({ map: G.Tex.get(tex, hq ? 256 : 128), vertexColors: true, side: tex === 'cloth' ? THREE.DoubleSide : THREE.FrontSide });
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = true; m.castShadow = hq && (tex === st.roofTex || tex === stairTex);
      m.userData.detail = true;
      group.add(m);
    }
    const metalM = new THREE.MeshLambertMaterial({ color: 0x55585c });
    const wireM = new THREE.LineBasicMaterial({ color: 0x15161a });
    for (const e of extra) {
      if (e.kind === 'tank') {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.1, 14), new THREE.MeshLambertMaterial({ color: 0x3a5a8a, map: G.Tex.get('metal', 128) }));
        t.position.set(e.x, e.y + 0.95, e.z); t.castShadow = hq; group.add(t);
        for (const [dx, dz] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), metalM); l.position.set(e.x + dx, e.y + 0.2, e.z + dz); group.add(l); }
      } else if (e.kind === 'rail') {
        const a = new THREE.Vector3(...e.a), b = new THREE.Vector3(...e.b), L = a.distanceTo(b);
        const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L, 6), metalM);
        rl.position.copy(a).add(b).multiplyScalar(0.5); rl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); group.add(rl);
        for (const p of e.posts) { const ps = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), metalM); ps.position.set(p[0], p[1] + 0.475, p[2]); group.add(ps); }
      }
    }
    const clothCols = [0xd84a4a, 0x4a8ad8, 0xe8e0c8, 0x6ab04a, 0xe8c040, 0xb06ad8];
    for (const L of lines) {
      const x0 = L.i * S, z0 = L.j * S, pts = [];
      for (let q = 0; q <= 8; q++) {
        const t = q / 8, sag = Math.sin(t * Math.PI) * 0.35;
        pts.push(L.x ? new THREE.Vector3(x0 + t * S, L.y - sag, z0 + S * 0.5) : new THREE.Vector3(x0 + S * 0.5, L.y - sag, z0 + t * S));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireM));
      if (L.cloth) for (let q = 1; q < 4; q++) {
        const t = q / 4 + (hash(L.i + q, L.j) - 0.5) * 0.1, sag = Math.sin(t * Math.PI) * 0.35, w = 0.45 + hash(q, L.i) * 0.3, h = 0.5 + hash(L.j, q) * 0.35;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ color: clothCols[(L.i + L.j + q) % clothCols.length], side: THREE.DoubleSide, map: G.Tex.get('cloth', 128) }));
        if (L.x) m.position.set(x0 + t * S, L.y - sag - h / 2, z0 + S * 0.5); else { m.position.set(x0 + S * 0.5, L.y - sag - h / 2, z0 + t * S); m.rotation.y = Math.PI / 2; }
        group.add(m);
      }
    }
  };
  D.styles = STY;
})();
