// Modelos low-poly: soldados, armas (1ª e 3ª pessoa)
(function () {
  const Mo = G.Models = {};
  const matCache = {};
  const lam = (color, extra) => { const k = color + ':' + (extra ? JSON.stringify(extra) : ''); return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}))); };
  function box(parent, w, h, d, x, y, z, mat, rx, ry, rz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
    parent.add(m); return m;
  }
  function cyl(parent, r, len, x, y, z, mat, axis) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
    m.position.set(x, y, z);
    if (axis === 'z') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.z = Math.PI / 2;
    parent.add(m); return m;
  }

  // ------------- Armas -------------
  // Origem = punho. Cano aponta para -Z. Retorna group com userData.muzzle (Object3D)
  Mo.gun = (def) => {
    const g = new THREE.Group();
    const metal = lam(def.color || 0x2a2a2a), dark = lam(0x161616), wood = lam(0x6e4224), tan = lam(0x8a7a5a), steel = lam(0x8a8d90);
    const muzzle = new THREE.Object3D(); g.add(muzzle);
    const sh = def.shape;
    const rifleBase = (o) => {
      const L = o.len || 0.42, bl = o.barrel || 0.3, fm = o.furn || metal;
      box(g, 0.06, 0.09, L, 0, 0.04, -L / 2 + 0.06, metal);                      // receptor
      box(g, 0.055, 0.06, o.hg || 0.22, 0, 0.03, -L + 0.06 - (o.hg || 0.22) / 2 + 0.06, fm); // guarda-mão
      cyl(g, 0.012, bl, 0, 0.05, -L + 0.06 - bl / 2, dark, 'z');                 // cano
      box(g, 0.045, 0.12, 0.05, 0, -0.06, 0.0, o.gripMat || dark, 0.3);          // punho
      if (o.stock !== false) box(g, 0.05, 0.08, o.stockLen || 0.22, 0, 0.02, 0.06 + (o.stockLen || 0.22) / 2, o.stockMat || fm);
      if (o.mag) box(g, 0.04, o.mag, 0.07, 0, -0.02 - o.mag / 2, -0.12, o.magMat || dark, o.magAng || 0.15);
      if (o.scope) { cyl(g, 0.022, 0.2, 0, 0.12, -0.12, dark, 'z'); box(g, 0.02, 0.04, 0.03, 0, 0.09, -0.12, dark); }
      else if (o.sight !== false) box(g, 0.012, 0.03, 0.02, 0, 0.1, -0.05, dark);
      if (o.silencer) cyl(g, 0.022, 0.16, 0, 0.05, -L + 0.06 - bl - 0.07, dark, 'z');
      muzzle.position.set(0, 0.05, -L + 0.06 - bl - (o.silencer ? 0.16 : 0));
    };
    switch (sh) {
      case 'pistol': case 'heavyPistol': case 'mpistol': case 'dual': case 'revolver': {
        const big = sh === 'heavyPistol' ? 1.25 : 1;
        box(g, 0.035 * big, 0.04 * big, 0.2 * big, 0, 0.05, -0.07, metal);
        box(g, 0.032, 0.11, 0.045, 0, -0.01, 0.0, dark, 0.25);
        if (sh === 'mpistol') box(g, 0.03, 0.1, 0.035, 0, -0.03, -0.07, dark, 0.1);
        if (sh === 'revolver') cyl(g, 0.03, 0.05, 0, 0.04, -0.03, steel, 'z');
        if (def.silencer === true) cyl(g, 0.016, 0.12, 0, 0.055, -0.23 * big, dark, 'z');
        muzzle.position.set(0, 0.055, -0.17 * big - (def.silencer ? 0.12 : 0));
        if (sh === 'dual') { const g2 = Mo.gun(Object.assign({}, def, { shape: 'pistol' })); g2.position.set(-0.22, 0, 0); g.add(g2); }
        break;
      }
      case 'smg': rifleBase({ len: 0.28, barrel: 0.08, hg: 0.12, mag: 0.16, magAng: 0.05, stockLen: 0.16 }); break;
      case 'smgSD': rifleBase({ len: 0.3, barrel: 0.06, hg: 0.12, mag: 0.15, stockLen: 0.16, silencer: true }); break;
      case 'bullpupSmg': box(g, 0.07, 0.12, 0.5, 0, 0.03, -0.12, metal); box(g, 0.05, 0.03, 0.3, 0, 0.1, -0.12, dark); box(g, 0.04, 0.1, 0.05, 0, -0.07, -0.04, dark, 0.3); muzzle.position.set(0, 0.04, -0.38); break;
      case 'shotgun': rifleBase({ len: 0.4, barrel: 0.38, hg: 0.2, furn: wood, stockMat: wood }); cyl(g, 0.016, 0.4, 0, 0.0, -0.4, dark, 'z'); break;
      case 'shotgunShort': rifleBase({ len: 0.34, barrel: 0.2, hg: 0.16, furn: wood, stockLen: 0.12, stockMat: wood, mag: def.id === 'bloco' ? 0.1 : 0 }); break;
      case 'mg': rifleBase({ len: 0.6, barrel: 0.35, hg: 0.25, stockLen: 0.24 }); box(g, 0.12, 0.12, 0.14, 0.04, -0.06, -0.12, tan); break;
      case 'rifleAK': rifleBase({ len: 0.48, barrel: 0.25, hg: 0.2, furn: wood, stockMat: wood, mag: 0.2, magAng: 0.35 }); break;
      case 'rifle': rifleBase({ len: 0.46, barrel: 0.24, hg: 0.2, mag: 0.18, magAng: 0.25 }); break;
      case 'rifleM4': rifleBase({ len: 0.44, barrel: 0.26, hg: 0.22, mag: 0.17, magAng: 0.12, silencer: def.silencer === true }); box(g, 0.03, 0.03, 0.12, 0, 0.11, -0.05, dark); break;
      case 'rifleScoped': rifleBase({ len: 0.48, barrel: 0.26, hg: 0.2, mag: 0.18, magAng: 0.2, scope: true }); break;
      case 'bullpup': box(g, 0.07, 0.1, 0.55, 0, 0.04, -0.14, metal); box(g, 0.04, 0.14, 0.05, 0, 0.13, -0.18, dark); cyl(g, 0.012, 0.15, 0, 0.05, -0.48, dark, 'z'); box(g, 0.04, 0.12, 0.05, 0, -0.06, -0.06, dark, 0.3); box(g, 0.04, 0.14, 0.06, 0, -0.04, 0.07, dark, 0.15); muzzle.position.set(0, 0.05, -0.56); break;
      case 'bullpupScoped': box(g, 0.07, 0.1, 0.55, 0, 0.04, -0.14, metal); cyl(g, 0.025, 0.18, 0, 0.13, -0.16, dark, 'z'); cyl(g, 0.012, 0.15, 0, 0.05, -0.48, dark, 'z'); box(g, 0.04, 0.12, 0.05, 0, -0.06, -0.08, dark, 0.3); box(g, 0.04, 0.14, 0.06, 0, -0.04, 0.07, dark, 0.15); muzzle.position.set(0, 0.05, -0.56); break;
      case 'sniperLight': rifleBase({ len: 0.5, barrel: 0.38, hg: 0.2, mag: 0.07, scope: true, stockLen: 0.24 }); break;
      case 'sniper': rifleBase({ len: 0.56, barrel: 0.45, hg: 0.26, mag: 0.08, scope: true, stockLen: 0.28 }); break;
      case 'autoSniper': rifleBase({ len: 0.52, barrel: 0.36, hg: 0.24, mag: 0.12, scope: true, stockLen: 0.26 }); break;
      case 'taser': box(g, 0.04, 0.06, 0.15, 0, 0.04, -0.05, lam(0xd8c020)); box(g, 0.03, 0.1, 0.04, 0, -0.02, 0.0, dark, 0.25); muzzle.position.set(0, 0.04, -0.13); break;
      case 'knife': box(g, 0.025, 0.035, 0.11, 0, 0, 0.02, dark); box(g, 0.008, 0.04, 0.2, 0, 0.005, -0.13, steel); box(g, 0.05, 0.02, 0.015, 0, 0, -0.035, steel); muzzle.position.set(0, 0, -0.2); break;
      case 'c4': box(g, 0.2, 0.06, 0.12, 0, 0, -0.05, lam(0x6a6a50)); box(g, 0.08, 0.02, 0.06, 0.03, 0.04, -0.05, lam(0x222222)); box(g, 0.02, 0.01, 0.02, -0.05, 0.035, -0.07, lam(0xff2020, { emissive: 0x880000 })); muzzle.position.set(0, 0, -0.1); break;
      default:
        if (sh && sh.startsWith('nade')) {
          if (sh === 'nadeHE') { const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), metal); s.scale.y = 1.2; g.add(s); }
          else cyl(g, 0.035, 0.11, 0, 0, 0, metal);
          if (sh === 'nadeMolotov') { cyl(g, 0.015, 0.06, 0, 0.08, 0, lam(0x5a8a5a, { transparent: true, opacity: 0.8 })); box(g, 0.02, 0.04, 0.02, 0, 0.12, 0, lam(0xddccaa)); }
          else { box(g, 0.02, 0.03, 0.02, 0, 0.07, 0, steel); box(g, 0.01, 0.08, 0.015, 0.03, 0.04, 0, steel); }
          muzzle.position.set(0, 0, -0.05);
        } else rifleBase({});
    }
    g.userData.muzzle = muzzle;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  };

  // ------------- Soldado -------------
  const TEAM_COL = {
    T: { shirt: 0x8c7552, pants: 0x5b4c36, vest: 0x3d3a2c, head: 0x2b2520, skin: 0xb98c62, accent: 0x7a2f22 },
    CT: { shirt: 0x2d405e, pants: 0x283142, vest: 0x1b2230, head: 0x293447, skin: 0xc89a70, accent: 0x6aa8ff }
  };
  Mo.soldier = (team) => {
    const c = TEAM_COL[team];
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);
    const mShirt = lam(c.shirt), mPants = lam(c.pants), mVest = lam(c.vest), mHead = lam(c.head), mSkin = lam(c.skin), mBoot = lam(0x1c1a17), mAcc = lam(c.accent);
    // pernas (pivô no quadril)
    const legs = [];
    for (const s of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(0.11 * s, 0.88, 0); body.add(leg);
      box(leg, 0.17, 0.48, 0.2, 0, -0.24, 0, mPants);
      const shin = new THREE.Group(); shin.position.set(0, -0.46, 0); leg.add(shin);
      box(shin, 0.15, 0.36, 0.17, 0, -0.18, 0, mPants);
      box(shin, 0.16, 0.08, 0.26, 0, -0.38, -0.04, mBoot);
      leg.userData.shin = shin;
      legs.push(leg);
    }
    const upper = new THREE.Group(); upper.position.set(0, 0.88, 0); body.add(upper);
    box(upper, 0.44, 0.58, 0.24, 0, 0.3, 0, mShirt);
    box(upper, 0.47, 0.42, 0.29, 0, 0.32, 0, mVest);
    box(upper, 0.12, 0.08, 0.06, 0.12, 0.42, -0.16, mAcc);
    box(upper, 0.46, 0.08, 0.27, 0, 0.0, 0, lam(0x2a2418));
    // cabeça
    const head = new THREE.Group(); head.position.set(0, 0.68, 0); upper.add(head);
    box(head, 0.22, 0.25, 0.24, 0, 0.12, 0, mSkin);
    if (team === 'CT') {
      box(head, 0.26, 0.12, 0.28, 0, 0.25, 0.01, mHead);
      box(head, 0.2, 0.06, 0.04, 0, 0.15, -0.12, lam(0x111418));
    } else {
      box(head, 0.235, 0.16, 0.255, 0, 0.2, 0.005, mHead);
      box(head, 0.235, 0.09, 0.255, 0, 0.03, 0.005, mHead);
      box(head, 0.18, 0.04, 0.02, 0, 0.12, -0.125, lam(0x1a1410));
    }
    // braços apontando a arma
    const armR = new THREE.Group(); armR.position.set(0.25, 0.52, 0); upper.add(armR);
    box(armR, 0.12, 0.12, 0.42, 0, -0.04, -0.17, mShirt, 0.35);
    box(armR, 0.1, 0.1, 0.1, 0, -0.12, -0.38, mSkin);
    const armL = new THREE.Group(); armL.position.set(-0.25, 0.52, 0); upper.add(armL);
    box(armL, 0.12, 0.12, 0.5, 0.1, -0.05, -0.22, mShirt, 0.3, -0.35);
    box(armL, 0.1, 0.1, 0.1, 0.2, -0.13, -0.45, mSkin);
    const gunHold = new THREE.Group(); gunHold.position.set(0.18, 0.4, -0.38); upper.add(gunHold);
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    return { root, body, upper, head, legs, armR, armL, gunHold, gun: null, gunId: null };
  };
  Mo.setSoldierGun = (sol, def, extra) => {
    const gid = def ? def.id + (G.Cheats ? G.Cheats.skinKey(def.id) : '') + (extra || '') : null;
    if (sol.gunId === gid) return;
    if (sol.gun) sol.gunHold.remove(sol.gun);
    sol.gun = null; sol.gunId = gid;
    if (def) { sol.gun = Mo.gun(def); sol.gunHold.add(sol.gun); }
  };

  // ------------- Viewmodel (1ª pessoa) -------------
  Mo.viewmodel = (def, team) => {
    const g = new THREE.Group();
    const gun = Mo.gun(def);
    g.add(gun);
    const c = TEAM_COL[team];
    const sleeve = lam(c.shirt), glove = lam(0x22201c);
    const isNade = def.cat === 'grenade' || def.cat === 'c4';
    // braço direito (do punho para trás/baixo)
    const ra = new THREE.Group(); ra.position.set(0.0, -0.06, 0.04); gun.add(ra);
    box(ra, 0.075, 0.075, 0.07, 0, 0, 0, glove);
    box(ra, 0.09, 0.09, 0.42, 0.03, -0.06, 0.22, sleeve, 0.25, -0.1);
    // braço esquerdo (no guarda-mão)
    const lh = gun.userData.lh;
    if (!isNade && def.cat !== 'knife' && def.cat !== 'pistol' && def.cat !== 'equip') {
      const la = new THREE.Group(); la.position.set(-0.01, lh ? lh[1] - 0.005 : 0, lh ? -lh[0] : -0.26); gun.add(la);
      box(la, 0.075, 0.07, 0.08, 0, -0.03, 0, glove);
      box(la, 0.065, 0.065, 0.3, -0.05, -0.12, 0.12, sleeve, 0.7, 0.3);
    } else if (def.cat === 'pistol' && def.shape !== 'dual') {
      const la = new THREE.Group(); la.position.set(-0.04, -0.06, 0.02); gun.add(la);
      box(la, 0.07, 0.075, 0.07, 0, 0, 0, glove);
      box(la, 0.09, 0.09, 0.42, -0.1, -0.06, 0.2, sleeve, 0.2, 0.45);
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    // posição base em relação à câmera
    g.scale.setScalar(0.5);
    gun.rotation.y = 0.05;
    const base = def.cat === 'pistol' ? [0.085, -0.09, -0.22] : def.cat === 'knife' ? [0.1, -0.1, -0.2] : isNade ? [0.1, -0.1, -0.2] : [0.085, -0.085, -0.19];
    g.userData.base = new THREE.Vector3(...base);
    g.userData.gun = gun;
    g.userData.muzzle = gun.userData.muzzle;
    return g;
  };

  // modelo da bomba plantada
  Mo.bomb = () => {
    const g = new THREE.Group();
    box(g, 0.34, 0.12, 0.22, 0, 0.06, 0, lam(0x6a6a50));
    box(g, 0.12, 0.03, 0.08, 0.06, 0.13, 0, lam(0x222222));
    const led = box(g, 0.03, 0.02, 0.03, -0.1, 0.13, 0.05, new THREE.MeshBasicMaterial({ color: 0xff2020 }));
    for (let i = 0; i < 3; i++) box(g, 0.3, 0.02, 0.025, 0, 0.06, -0.08 + i * 0.08, lam(0xaa3322));
    g.userData.led = led;
    return g;
  };
})();
