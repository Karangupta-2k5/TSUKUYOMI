import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d, Sparkles, Eye } from 'lucide-react';

export default function Watchtower3DModel() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showRefCard, setShowRefCard] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 360;

    // ─── Scene, Camera & Renderer ─────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a14, 0.025);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(17.5, 11.2, 17.5);
    camera.lookAt(0, 7.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ─── Procedural Voxel Textures (Crafted to match reference blocks) ────────
    function makeBlockTexture(baseHex: string, noiseHex: string, grid = false): THREE.CanvasTexture {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, 64, 64);

      // Subtle voxel speckles
      ctx.fillStyle = noiseHex;
      for (let i = 0; i < 48; i++) {
        const x = ((i * 37) % 16) * 4;
        const y = ((i * 53) % 16) * 4;
        ctx.fillRect(x, y, 4, 4);
      }

      if (grid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 62, 62);
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(64, 32);
        ctx.moveTo(32, 0);
        ctx.lineTo(32, 32);
        ctx.moveTo(16, 32);
        ctx.lineTo(16, 64);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    }

    const stoneTex = makeBlockTexture('#7d7b76', '#686662', true);
    const grassTopTex = makeBlockTexture('#4e7537', '#3f612b', false);
    const darkOakTex = makeBlockTexture('#4a3221', '#382517', false);
    const spruceTex = makeBlockTexture('#6b4c32', '#573c26', false);
    const birchWallTex = makeBlockTexture('#d8c598', '#c6b286', true);
    const prismarineTex = makeBlockTexture('#2c6e69', '#215753', true);
    const prismarineLightTex = makeBlockTexture('#3a8882', '#2c6e69', true);

    const matStone = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 });
    const matCobble = new THREE.MeshStandardMaterial({ color: 0x5d5c58, roughness: 0.95 });
    const matGrass = new THREE.MeshStandardMaterial({ map: grassTopTex, roughness: 0.85 });
    const matDarkOak = new THREE.MeshStandardMaterial({ map: darkOakTex, roughness: 0.78 });
    const matSpruce = new THREE.MeshStandardMaterial({ map: spruceTex, roughness: 0.75 });
    const matWall = new THREE.MeshStandardMaterial({ map: birchWallTex, roughness: 0.7 });
    const matRoof = new THREE.MeshStandardMaterial({ map: prismarineTex, roughness: 0.6, metalness: 0.1 });
    const matRoofRidge = new THREE.MeshStandardMaterial({ map: prismarineLightTex, roughness: 0.55, metalness: 0.12 });
    const matLanternGlow = new THREE.MeshBasicMaterial({ color: 0xffcf6e });
    const matLanternFrame = new THREE.MeshStandardMaterial({ color: 0x241f1c, roughness: 0.4, metalness: 0.7 });
    const matWindowGlow = new THREE.MeshBasicMaterial({ color: 0xff9b42 });
    const matSakuraPink = new THREE.MeshPhysicalMaterial({
      color: 0xff8da6,
      transparent: true,
      opacity: 0.82,
      roughness: 0.25,
    });
    const matSakuraLight = new THREE.MeshPhysicalMaterial({
      color: 0xffb8c9,
      transparent: true,
      opacity: 0.72,
      roughness: 0.2,
    });

    // ─── Master Group ─────────────────────────────────────────────────────────
    const world = new THREE.Group();
    scene.add(world);

    function addBox(
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      parent: THREE.Object3D = world,
    ) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    // ─── 1. Stepped Grass Mound & Courtyard Path ──────────────────────────────
    addBox(13.5, 0.7, 13.5, 0, 0.35, 0, matGrass);
    addBox(11.0, 0.6, 11.0, 0, 0.8, 0, matGrass);
    // Stone path tiles in front
    for (let i = 0; i < 4; i++) {
      addBox(1.1, 0.12, 1.1, (i % 2 === 0 ? -0.35 : 0.35), 1.12, 3.8 + i * 0.9, matStone);
    }

    // ─── 2. Stone Brick Fortress Base (with recessed arched doorway) ──────────
    const baseY = 2.4;
    addBox(5.2, 2.6, 5.2, 0, baseY, 0, matStone);
    // Stone corner buttresses
    for (const sx of [-2.55, 2.55]) {
      for (const sz of [-2.55, 2.55]) {
        addBox(0.7, 2.75, 0.7, sx, baseY, sz, matCobble);
      }
    }
    // Stone top lip
    addBox(5.6, 0.35, 5.6, 0, 3.75, 0, matStone);
    // Recessed doorway on front (+Z)
    addBox(1.1, 1.5, 0.25, 0, 1.85, 2.55, matLanternFrame);
    addBox(1.4, 0.3, 0.35, 0, 2.7, 2.58, matCobble);

    // Supply Cart & Chests on Left (matching reference image bottom-left)
    addBox(1.5, 0.25, 1.1, -3.6, 1.25, 2.1, matSpruce);
    addBox(0.65, 0.6, 0.65, -3.5, 1.68, 1.9, new THREE.MeshStandardMaterial({ color: 0xb87a3d, roughness: 0.6 }));
    addBox(0.65, 0.6, 0.65, -3.5, 1.68, 2.65, new THREE.MeshStandardMaterial({ color: 0x9c622b, roughness: 0.6 }));

    // ─── Helper: Build Curved Japanese Pagoda Roof Tier ───────────────────────
    function buildPagodaRoof(yBase: number, span: number, levels: number, isTopCap = false) {
      const roofGroup = new THREE.Group();
      roofGroup.position.y = yBase;

      // Dark wood eaves under-frame + rafters
      addBox(span + 0.9, 0.22, span + 0.9, 0, 0, 0, matDarkOak, roofGroup);
      addBox(span + 1.35, 0.16, 0.36, 0, 0.08, 0, matDarkOak, roofGroup);
      addBox(0.36, 0.16, span + 1.35, 0, 0.08, 0, matDarkOak, roofGroup);

      // Upturned eaves tips at the 4 corners (classic Japanese voxel roof flare)
      const tipDist = (span + 1.05) / 2;
      for (const cx of [-1, 1]) {
        for (const cz of [-1, 1]) {
          addBox(0.55, 0.25, 0.55, cx * tipDist, 0.18, cz * tipDist, matDarkOak, roofGroup);
          addBox(0.4, 0.28, 0.4, cx * (tipDist + 0.22), 0.36, cz * (tipDist + 0.22), matDarkOak, roofGroup);
        }
      }

      // Stepped turquoise/teal prismarine roof layers
      for (let i = 0; i < levels; i++) {
        const s = span + 0.4 - i * 0.68;
        if (s <= 0.4) break;
        addBox(s, 0.32, s, 0, 0.26 + i * 0.3, 0, i % 2 === 0 ? matRoof : matRoofRidge, roofGroup);
        // Dark wood gable ridges along X and Z axes
        addBox(s + 0.25, 0.14, 0.28, 0, 0.34 + i * 0.3, 0, matDarkOak, roofGroup);
        addBox(0.28, 0.14, s + 0.25, 0, 0.34 + i * 0.3, 0, matDarkOak, roofGroup);
      }

      if (isTopCap) {
        const topY = 0.26 + levels * 0.3;
        addBox(0.95, 0.42, 0.95, 0, topY, 0, matRoofRidge, roofGroup);
        addBox(0.45, 0.75, 0.45, 0, topY + 0.48, 0, matRoof, roofGroup);
      }

      world.add(roofGroup);
    }

    // ─── Helper: Hanging Voxel Lantern ────────────────────────────────────────
    const lanterns: THREE.Group[] = [];
    function addHangingLantern(x: number, y: number, z: number) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      // Chain
      addBox(0.08, 0.35, 0.08, 0, -0.15, 0, matLanternFrame, g);
      // Lantern cap & core
      addBox(0.32, 0.1, 0.32, 0, -0.35, 0, matLanternFrame, g);
      addBox(0.24, 0.3, 0.24, 0, -0.52, 0, matLanternGlow, g);
      addBox(0.3, 0.08, 0.3, 0, -0.7, 0, matLanternFrame, g);
      world.add(g);
      lanterns.push(g);
    }

    // ─── 3. First Timber Story (y = 3.9 to 5.8) ───────────────────────────────
    addBox(4.0, 2.0, 4.0, 0, 4.9, 0, matWall);
    for (const sx of [-1.95, 1.95]) {
      for (const sz of [-1.95, 1.95]) {
        addBox(0.45, 2.05, 0.45, sx, 4.9, sz, matSpruce);
      }
    }
    // Warm lit lattice windows
    addBox(1.5, 0.75, 4.12, 0, 5.05, 0, matWindowGlow);
    addBox(4.12, 0.75, 1.5, 0, 5.05, 0, matWindowGlow);
    addBox(1.6, 0.22, 4.2, 0, 4.65, 0, matDarkOak);
    addBox(4.2, 0.22, 1.6, 0, 4.65, 0, matDarkOak);

    // First Pagoda Roof Skirt
    buildPagodaRoof(5.9, 5.3, 3, false);
    for (const sx of [-2.7, 2.7]) {
      for (const sz of [-2.7, 2.7]) {
        addHangingLantern(sx, 5.85, sz);
      }
    }

    // ─── 4. Second Timber Story (y = 6.7 to 8.6) ──────────────────────────────
    addBox(3.5, 1.95, 3.5, 0, 7.65, 0, matWall);
    for (const sx of [-1.7, 1.7]) {
      for (const sz of [-1.7, 1.7]) {
        addBox(0.42, 2.0, 0.42, sx, 7.65, sz, matSpruce);
      }
    }
    addBox(1.3, 0.7, 3.62, 0, 7.8, 0, matWindowGlow);
    addBox(3.62, 0.7, 1.3, 0, 7.8, 0, matWindowGlow);

    // Second Pagoda Roof Skirt
    buildPagodaRoof(8.6, 4.9, 3, false);
    for (const sx of [-2.45, 2.45]) {
      for (const sz of [-2.45, 2.45]) {
        addHangingLantern(sx, 8.55, sz);
      }
    }

    // ─── 5. Third Story & Wooden Observation Deck (y = 9.4 to 12.2) ───────────
    addBox(3.1, 1.25, 3.1, 0, 9.95, 0, matSpruce);
    // Protruding wooden wrap-around observation balcony
    addBox(5.5, 0.35, 5.5, 0, 10.65, 0, matSpruce);
    // Balcony railings
    addBox(5.6, 0.48, 0.22, 0, 11.02, 2.66, matSpruce);
    addBox(5.6, 0.48, 0.22, 0, 11.02, -2.66, matSpruce);
    addBox(0.22, 0.48, 5.6, 2.66, 11.02, 0, matSpruce);
    addBox(0.22, 0.48, 5.6, -2.66, 11.02, 0, matSpruce);

    // Cobblestone & timber roof support pillars on observation deck
    for (const sx of [-2.15, 0, 2.15]) {
      for (const sz of [-2.15, 2.15]) {
        addBox(0.38, 0.65, 0.38, sx, 11.15, sz, matCobble);
        addBox(0.26, 0.95, 0.26, sx, 11.85, sz, matDarkOak);
      }
    }

    // ─── 6. Grand Teal Pagoda Crown Roof (y = 12.25+) ─────────────────────────
    buildPagodaRoof(12.25, 5.9, 6, true);
    for (const sx of [-2.85, 2.85]) {
      for (const sz of [-2.85, 2.85]) {
        addHangingLantern(sx, 12.2, sz);
      }
    }

    // ─── 7. Twin Glowing Pink Sakura Trees (Left & Right, matching image) ─────
    function buildSakuraTree(tx: number, tz: number, scale = 1.0) {
      const tree = new THREE.Group();
      tree.position.set(tx, 1.0, tz);
      tree.scale.setScalar(scale);

      // Gnarled trunk & branches
      addBox(0.65, 2.4, 0.65, 0, 1.2, 0, matDarkOak, tree);
      addBox(0.55, 1.6, 0.55, 0.35, 2.6, 0.2, matDarkOak, tree);
      addBox(0.5, 1.4, 0.5, -0.4, 2.4, -0.25, matDarkOak, tree);

      // Translucent pink glass-like voxel blossom clusters
      const clusters = [
        [0, 3.6, 0, 2.1, 1.4, 2.1],
        [0.9, 3.2, 0.6, 1.6, 1.2, 1.6],
        [-0.85, 3.1, -0.5, 1.7, 1.25, 1.6],
        [0.5, 4.3, -0.4, 1.5, 1.1, 1.5],
        [-0.5, 2.6, 0.8, 1.4, 1.0, 1.4],
        [1.2, 2.5, -0.6, 1.2, 1.0, 1.2],
      ];
      clusters.forEach(([cx, cy, cz, cw, ch, cd], idx) => {
        addBox(cw, ch, cd, cx, cy, cz, idx % 2 === 0 ? matSakuraPink : matSakuraLight, tree);
      });

      world.add(tree);
    }

    buildSakuraTree(-4.6, 1.5, 1.05);
    buildSakuraTree(4.5, -0.8, 0.95);

    // ─── 8. Floating Sakura Petals & Celestial Stars ──────────────────────────
    const particleCount = 110;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = Math.random() * 17 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 26;
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xffb7c5,
      size: 0.18,
      transparent: true,
      opacity: 0.85,
    });
    const petals = new THREE.Points(partGeo, partMat);
    scene.add(petals);

    // ─── 9. Warm Golden-Hour & Lantern Lighting ───────────────────────────────
    const ambient = new THREE.AmbientLight(0xd8c8e8, 0.85);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffdf9e, 1.85);
    sunLight.position.set(14, 22, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const lanternPointLight = new THREE.PointLight(0xff9d3b, 3.2, 16);
    lanternPointLight.position.set(0, 8.2, 3.2);
    world.add(lanternPointLight);

    const sakuraFillLight = new THREE.PointLight(0xff7eb3, 1.4, 14);
    sakuraFillLight.position.set(-5, 4.5, 3);
    world.add(sakuraFillLight);

    // ─── 10. Interactive Drag-to-Rotate & Zoom Controls ───────────────────────
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotY = 0.52;
    let tiltX = 0.02;
    let targetZoom = 23.0;

    const dom = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      rotY += dx * 0.008;
      tiltX = Math.max(-0.22, Math.min(0.35, tiltX + dy * 0.004));
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoom = Math.max(12.5, Math.min(26, targetZoom + e.deltaY * 0.01));
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // ─── Animation Loop ───────────────────────────────────────────────────────
    let reqId = 0;
    let clock = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      clock += 0.016;

      if (!isDragging) {
        rotY += 0.0032;
      }
      world.rotation.y = rotY;
      world.rotation.x = tiltX;

      // Smooth zoom interpolation
      const curDist = Math.hypot(camera.position.x, camera.position.z);
      const nextDist = curDist + (targetZoom - curDist) * 0.08;
      camera.position.set(nextDist * 0.707, 11.2, nextDist * 0.707);
      camera.lookAt(0, 7.6, 0);

      // Gentle lantern sway & warm pulse
      lanternPointLight.intensity = 2.9 + Math.sin(clock * 3.2) * 0.45;
      lanterns.forEach((l, idx) => {
        l.rotation.z = Math.sin(clock * 2.1 + idx) * 0.05;
      });

      // Drifting sakura petals
      const posArr = partGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] -= 0.018;
        posArr[i * 3] += Math.sin(clock + i) * 0.006;
        if (posArr[i * 3 + 1] < 0.8) {
          posArr[i * 3 + 1] = 16.5;
        }
      }
      partGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    // ─── Resize Handling ──────────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(reqId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative rounded-2xl border border-wt-gold/20 bg-gradient-to-b from-[#131324] via-[#0d0d1a] to-[#0a0a14] overflow-hidden mb-5 shadow-2xl">
      {/* Top Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(212,175,55,0.12) 0%, rgba(255,141,166,0.06) 38%, transparent 72%)',
        }}
      />

      {/* Interactive 3D WebGL Viewport */}
      <div
        ref={mountRef}
        className="w-full h-[380px] sm:h-[420px] cursor-grab active:cursor-grabbing relative z-10"
        title="Drag to rotate the 3D Watchtower · Scroll to zoom"
      />

      {/* Top-Left Badge */}
      <div className="absolute top-3.5 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-wt-ink/85 backdrop-blur-md border border-wt-gold/25">
        <Sparkles className="w-3.5 h-3.5 text-wt-gold animate-pulse" />
        <span className="text-[11px] font-wt-title uppercase tracking-widest text-wt-gold">
          3D Voxel Watchtower Sanctuary
        </span>
      </div>

      {/* Top-Right Reference Snapshot Toggle */}
      <button
        type="button"
        onClick={() => setShowRefCard((v) => !v)}
        className="absolute top-3.5 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wt-ink/85 hover:bg-wt-gold/15 backdrop-blur-md border border-wt-gold/25 text-[11px] font-wt-title text-wt-parchment/80 hover:text-wt-gold transition-all cursor-pointer"
      >
        <Eye className="w-3.5 h-3.5 text-wt-gold" />
        <span>{showRefCard ? 'Hide Blueprint' : 'View Reference'}</span>
      </button>

      {/* Reference Image Picture-in-Picture Preview */}
      {showRefCard && (
        <div className="absolute top-14 right-4 z-30 w-56 sm:w-64 rounded-xl overflow-hidden border-2 border-wt-gold/40 shadow-2xl bg-wt-ink animate-wt-fadeIn">
          <img
            src="/watchtower-hero.jpg"
            alt="Watchtower Architectural Reference"
            className="w-full h-36 object-cover"
          />
          <div className="px-3 py-1.5 bg-wt-ink/95 text-[10px] font-wt-serif text-wt-parchment/70 flex justify-between items-center">
            <span>Original Watchtower Blueprint</span>
            <span className="text-wt-gold font-wt-title">1:1 Voxel</span>
          </div>
        </div>
      )}

      {/* Bottom Interactive Controls Legend */}
      <div className="relative z-20 px-4 py-2.5 bg-wt-ink/80 backdrop-blur-md border-t border-wt-gold/15 flex flex-wrap items-center justify-between gap-2 text-xs font-wt-serif text-wt-parchment/60">
        <div className="flex items-center gap-2">
          <Rotate3d className="w-4 h-4 text-wt-gold" />
          <span>Drag to orbit 360° around the 3-tier pagoda watchtower &amp; sakura courtyard</span>
        </div>
        <span className="text-[11px] font-wt-title uppercase tracking-wider text-wt-gold/70">
          Scroll to Zoom · Live WebGL
        </span>
      </div>
    </div>
  );
}
