import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Product } from '../types/product';
import {
  generateGarmentTexture,
  createFabricNormalTexture,
  createStudioFloorTexture,
} from '../utils/textureGenerator';
import { soundEngine } from '../utils/audio';

interface ClothesRack3DProps {
  products: Product[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  isFlippedBack: boolean;
  onToggleFlip: () => void;
  selectedColorIndex: number;
  isInspectMode: boolean;
  onToggleInspect: () => void;
}

const SPACING = 2.4; // Distance between garments on the rail

export const ClothesRack3D: React.FC<ClothesRack3DProps> = ({
  products,
  activeIndex,
  onSelectIndex,
  isFlippedBack,
  onToggleFlip,
  selectedColorIndex,
  isInspectMode,
  onToggleInspect,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to keep state in sync with animation loop without re-instantiating scene
  const stateRef = useRef({
    products,
    activeIndex,
    isFlippedBack,
    selectedColorIndex,
    isInspectMode,
    targetRailX: 0,
    currentRailX: 0,
    railVelocity: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartRailX: 0,
    lastDragX: 0,
    lastDragTime: 0,
    dragVelocity: 0,
    // Inspect mode orbit
    inspectOrbitX: 0,
    inspectOrbitY: 0,
    targetInspectOrbitX: 0,
    targetInspectOrbitY: 0,
    isInspectDragging: false,
    inspectStartX: 0,
    inspectStartY: 0,
  });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current.products = products;
    stateRef.current.activeIndex = activeIndex;
    stateRef.current.isFlippedBack = isFlippedBack;
    stateRef.current.selectedColorIndex = selectedColorIndex;
    stateRef.current.isInspectMode = isInspectMode;
    stateRef.current.targetRailX = -activeIndex * SPACING;
  }, [products, activeIndex, isFlippedBack, selectedColorIndex, isInspectMode]);

  // Texture / Mesh storage
  const garmentNodesRef = useRef<
    Array<{
      group: THREE.Group;
      hanger: THREE.Group;
      clothMesh: THREE.Mesh;
      frontMaterial: THREE.MeshStandardMaterial;
      backMaterial: THREE.MeshStandardMaterial;
      accentMaterials: THREE.MeshStandardMaterial[];
      swingAngleZ: number;
      swingVelZ: number;
      flipAngleY: number;
    }>
  >([]);

  // Update garment color when active product color changes
  useEffect(() => {
    const activeItem = garmentNodesRef.current[activeIndex];
    const currentProduct = products[activeIndex];
    if (activeItem && currentProduct) {
      const activeColor =
        currentProduct.colors[selectedColorIndex]?.hex ||
        currentProduct.colors[0]?.hex ||
        '#141416';

      const newFrontTex = generateGarmentTexture(currentProduct, false, activeColor);
      const newBackTex = generateGarmentTexture(currentProduct, true, activeColor);

      activeItem.frontMaterial.map = newFrontTex;
      activeItem.frontMaterial.color.set(activeColor);
      activeItem.frontMaterial.needsUpdate = true;

      activeItem.backMaterial.map = newBackTex;
      activeItem.backMaterial.color.set(activeColor);
      activeItem.backMaterial.needsUpdate = true;

      activeItem.accentMaterials.forEach((m) => {
        m.color.set(activeColor);
        m.needsUpdate = true;
      });
    }
  }, [selectedColorIndex, activeIndex, products]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions guard: never allow 0 or NaN
    const getDimensions = () => {
      const w = container.clientWidth || window.innerWidth || 800;
      const h = container.clientHeight || window.innerHeight || 600;
      return { w: Math.max(w, 100), h: Math.max(h, 100) };
    };

    const { w: initW, h: initH } = getDimensions();

    // Detect software WebGL per Three.js skill guide (safely wrapped)
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0c0e');
    scene.fog = new THREE.FogExp2('#0b0c0e', 0.05);

    // Camera setup with safe aspect ratio
    const camera = new THREE.PerspectiveCamera(
      42,
      initW / initH,
      0.1,
      50
    );
    camera.position.set(0, 1.45, 4.4);
    camera.lookAt(0, 1.15, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(initW, initH);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // Studio Environment map using PMREMGenerator and RoomEnvironment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Safe fallback
    }

    // Studio 3-Point Lighting
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.4);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.02;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 14;
      keyLight.shadow.camera.left = -4;
      keyLight.shadow.camera.right = 4;
      keyLight.shadow.camera.top = 4;
      keyLight.shadow.camera.bottom = -4;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#90a4ae', 1.6);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const fillLight = new THREE.HemisphereLight('#f1f5f9', '#0f172a', 1.0);
    scene.add(fillLight);

    // Studio Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorTex = createStudioFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.85,
      metalness: 0.2,
      depthWrite: true,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Soft Radial Contact Shadow under the rack
    const shadowGeo = new THREE.PlaneGeometry(16, 2.8);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const radGrad = sCtx.createRadialGradient(256, 64, 10, 256, 64, 250);
    radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    radGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = radGrad;
    sCtx.fillRect(0, 0, 512, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.005, 0);
    scene.add(contactShadow);

    // ==========================================
    // PROCEDURAL METALLIC CLOTHING RACK (3-12 parts)
    // ==========================================
    const rackGroup = new THREE.Group();
    scene.add(rackGroup);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.96,
      roughness: 0.16,
    });
    const matteBlackMetal = new THREE.MeshStandardMaterial({
      color: '#1a1b1e',
      metalness: 0.85,
      roughness: 0.35,
    });

    const railY = 1.95;
    const railLength = Math.max(14, (products.length + 3) * SPACING);

    // 1. Horizontal Rail Pipe
    const railBarGeo = new THREE.CylinderGeometry(0.022, 0.022, railLength, 32);
    railBarGeo.rotateZ(Math.PI / 2);
    const railBar = new THREE.Mesh(railBarGeo, chromeMat);
    railBar.position.set(0, railY, 0);
    railBar.castShadow = !isSoftwareGl;
    rackGroup.add(railBar);

    // 2. Rail End Stoppers
    const stopperGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 24);
    stopperGeo.rotateZ(Math.PI / 2);
    const stopperL = new THREE.Mesh(stopperGeo, matteBlackMetal);
    stopperL.position.set(-railLength / 2, railY, 0);
    const stopperR = new THREE.Mesh(stopperGeo, matteBlackMetal);
    stopperR.position.set(railLength / 2, railY, 0);
    rackGroup.add(stopperL);
    rackGroup.add(stopperR);

    // 3. Vertical Legs / Stanchions
    const legGeo = new THREE.CylinderGeometry(0.026, 0.026, railY, 24);
    const legL = new THREE.Mesh(legGeo, matteBlackMetal);
    legL.position.set(-railLength / 2 + 0.6, railY / 2, 0);
    legL.castShadow = !isSoftwareGl;
    const legR = new THREE.Mesh(legGeo, matteBlackMetal);
    legR.position.set(railLength / 2 - 0.6, railY / 2, 0);
    legR.castShadow = !isSoftwareGl;
    rackGroup.add(legL);
    rackGroup.add(legR);

    // 4. Heavy Base Feet & Industrial Castings
    const footGeo = new THREE.BoxGeometry(0.18, 0.04, 0.65);
    const footL = new THREE.Mesh(footGeo, matteBlackMetal);
    footL.position.set(-railLength / 2 + 0.6, 0.02, 0);
    footL.receiveShadow = !isSoftwareGl;
    const footR = new THREE.Mesh(footGeo, matteBlackMetal);
    footR.position.set(railLength / 2 - 0.6, 0.02, 0);
    footR.receiveShadow = !isSoftwareGl;
    rackGroup.add(footL);
    rackGroup.add(footR);

    // ==========================================
    // GARMENTS CAROUSEL CONTAINER (Sliding on Rail)
    // ==========================================
    const carouselGroup = new THREE.Group();
    scene.add(carouselGroup);

    const normalTex = createFabricNormalTexture();

    // Reusable Hanger Geometries
    const hangerBodyGeo = createHangerGeometry();
    const hangerMat = new THREE.MeshStandardMaterial({
      color: '#1a1b1e',
      metalness: 0.8,
      roughness: 0.3,
    });
    const hookMat = new THREE.MeshStandardMaterial({
      color: '#f1f5f9',
      metalness: 0.98,
      roughness: 0.12,
    });

    const garmentNodes: typeof garmentNodesRef.current = [];

    products.forEach((product, i) => {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(i * SPACING, railY, 0);

      // Pivot group for realistic hanger swing
      const swingPivot = new THREE.Group();
      swingPivot.position.set(0, 0, 0); // hinges right on the rail
      itemGroup.add(swingPivot);

      // --- 1. Sleek Realistic Hanger ---
      const hangerGroup = new THREE.Group();

      // Metallic Hook curve around rail
      const hookCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0.03, 0),
        new THREE.Vector3(0.04, 0.09, 0),
        new THREE.Vector3(0, 0.14, 0)
      );
      const hookGeo = new THREE.TubeGeometry(hookCurve, 16, 0.005, 8, false);
      const hookMesh = new THREE.Mesh(hookGeo, hookMat);
      hangerGroup.add(hookMesh);

      // Hanger triangular frame
      const hangerMesh = new THREE.Mesh(hangerBodyGeo, hangerMat);
      hangerMesh.position.set(0, -0.06, 0);
      hangerMesh.castShadow = !isSoftwareGl;
      hangerGroup.add(hangerMesh);

      swingPivot.add(hangerGroup);

      // --- 2. 3D Garment Mesh Based on Category ---
      const activeColor =
        product.colors[product.selectedColorIndex || 0]?.hex ||
        product.colors[0]?.hex ||
        '#141416';

      const frontTex = generateGarmentTexture(product, false, activeColor);
      const backTex = generateGarmentTexture(product, true, activeColor);

      const frontMat = new THREE.MeshStandardMaterial({
        map: frontTex,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(0.25, 0.25),
        roughness: 0.88,
        metalness: 0.04,
        color: activeColor,
        side: THREE.FrontSide,
      });

      const backMat = new THREE.MeshStandardMaterial({
        map: backTex,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(0.25, 0.25),
        roughness: 0.88,
        metalness: 0.04,
        color: activeColor,
        side: THREE.BackSide,
      });

      const { mesh: clothMesh, accentMaterials } = createGarmentModel(
        product.category,
        frontMat,
        backMat,
        activeColor,
        isSoftwareGl
      );

      // Position garment naturally draped over hanger
      clothMesh.position.set(0, -0.08, 0);
      swingPivot.add(clothMesh);

      carouselGroup.add(itemGroup);

      garmentNodes.push({
        group: itemGroup,
        hanger: hangerGroup,
        clothMesh,
        frontMaterial: frontMat,
        backMaterial: backMat,
        accentMaterials,
        swingAngleZ: 0,
        swingVelZ: 0,
        flipAngleY: 0,
      });
    });

    garmentNodesRef.current = garmentNodes;

    // Raycaster for clicking garments
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // ==========================================
    // INTERACTION HANDLERS (Drag, Swipe, Scroll, Click)
    // ==========================================
    const onPointerDown = (e: PointerEvent) => {
      // Don't drag if clicking UI overlays
      if ((e.target as HTMLElement) !== renderer.domElement) return;

      const state = stateRef.current;
      if (state.isInspectMode) {
        state.isInspectDragging = true;
        state.inspectStartX = e.clientX;
        state.inspectStartY = e.clientY;
        return;
      }

      state.isDragging = true;
      state.dragStartX = e.clientX;
      state.dragStartRailX = state.targetRailX;
      state.lastDragX = e.clientX;
      state.lastDragTime = performance.now();
      state.dragVelocity = 0;
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = stateRef.current;
      const now = performance.now();

      if (state.isInspectMode && state.isInspectDragging) {
        const dx = e.clientX - state.inspectStartX;
        const dy = e.clientY - state.inspectStartY;
        state.targetInspectOrbitX += dx * 0.008;
        state.targetInspectOrbitY = Math.max(-0.5, Math.min(0.5, state.targetInspectOrbitY + dy * 0.005));
        state.inspectStartX = e.clientX;
        state.inspectStartY = e.clientY;
        return;
      }

      if (!state.isDragging) {
        // Hover pointer cursor detection
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(carouselGroup.children, true);
        renderer.domElement.style.cursor = intersects.length > 0 ? 'grab' : 'default';
        return;
      }

      const dx = e.clientX - state.dragStartX;
      const dt = Math.max(1, now - state.lastDragTime);
      const instantV = (e.clientX - state.lastDragX) / dt;
      state.dragVelocity = state.dragVelocity * 0.6 + instantV * 0.4;
      state.lastDragX = e.clientX;
      state.lastDragTime = now;

      // Sensitivity: 1 screen width = ~ 4 garments
      const worldDx = (dx / window.innerWidth) * 7.5;
      const minRail = -(state.products.length - 1) * SPACING;
      const maxRail = 0;

      // Rubber banding
      let newTarget = state.dragStartRailX + worldDx;
      if (newTarget > maxRail) {
        newTarget = maxRail + (newTarget - maxRail) * 0.25;
      } else if (newTarget < minRail) {
        newTarget = minRail + (newTarget - minRail) * 0.25;
      }
      state.targetRailX = newTarget;

      // Sound feedback for sliding
      if (Math.abs(state.dragVelocity) > 0.05) {
        soundEngine.playRailSlide(Math.min(1.5, Math.abs(state.dragVelocity) * 2));
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const state = stateRef.current;
      renderer.domElement.style.cursor = 'grab';

      if (state.isInspectMode) {
        state.isInspectDragging = false;
        return;
      }

      if (!state.isDragging) return;
      state.isDragging = false;

      // Inertia throw calculation
      let finalRailX = state.targetRailX + state.dragVelocity * 140;
      // Clamp index
      let targetIndex = Math.round(-finalRailX / SPACING);
      targetIndex = Math.max(0, Math.min(state.products.length - 1, targetIndex));

      // Check if was a quick click rather than a drag
      const totalMove = Math.abs(e.clientX - state.dragStartX);
      if (totalMove < 8) {
        // Raycast to check if an adjacent garment was clicked
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        garmentNodesRef.current.forEach((node, idx) => {
          const hits = raycaster.intersectObject(node.group, true);
          if (hits.length > 0) {
            targetIndex = idx;
            soundEngine.playHangerClink(0.35);
          }
        });
      }

      state.targetRailX = -targetIndex * SPACING;
      if (targetIndex !== state.activeIndex) {
        onSelectIndex(targetIndex);
        soundEngine.playHangerClink(0.4);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (stateRef.current.isInspectMode) return;
      // Horizontal or vertical scroll navigation
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 5) return;

      e.preventDefault();
      const state = stateRef.current;
      const step = delta > 0 ? 1 : -1;
      const nextIdx = Math.max(0, Math.min(state.products.length - 1, state.activeIndex + step));
      if (nextIdx !== state.activeIndex) {
        onSelectIndex(nextIdx);
        soundEngine.playHangerClink(0.3);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Window & Container resize handler
    const onResize = () => {
      if (!container) return;
      const { w, h } = getDimensions();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => onResize());
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', onResize);

    // ==========================================
    // RENDER ANIMATION LOOP (With Spring Physics)
    // ==========================================
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const state = stateRef.current;

      // 1. Smooth Rail Position with exponential damping
      const railDampSpeed = state.isDragging ? 22 : 10;
      const prevRailX = state.currentRailX;
      state.currentRailX = THREE.MathUtils.damp(
        state.currentRailX,
        state.targetRailX,
        railDampSpeed,
        delta
      );
      state.railVelocity = (state.currentRailX - prevRailX) / (delta || 0.016);
      carouselGroup.position.x = state.currentRailX;

      // 2. Camera transition (Normal Rail View vs 360 Inspect Mode)
      const targetCamZ = state.isInspectMode ? 2.8 : (window.innerWidth < 768 ? 5.2 : 4.4);
      const targetCamY = state.isInspectMode ? 1.25 : 1.45;
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 6, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 6, delta);

      if (state.isInspectMode) {
        state.inspectOrbitX = THREE.MathUtils.damp(
          state.inspectOrbitX,
          state.targetInspectOrbitX,
          10,
          delta
        );
        state.inspectOrbitY = THREE.MathUtils.damp(
          state.inspectOrbitY,
          state.targetInspectOrbitY,
          10,
          delta
        );
        camera.position.x = Math.sin(state.inspectOrbitX) * 2.8;
        camera.position.z = Math.cos(state.inspectOrbitX) * 2.8;
        camera.position.y = 1.3 + state.inspectOrbitY * 1.5;
        camera.lookAt(0, 1.2, 0);
      } else {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 8, delta);
        camera.lookAt(0, 1.15, 0);
        state.targetInspectOrbitX = 0;
        state.targetInspectOrbitY = 0;
      }

      // 3. Per-Garment Dynamics (Swinging Physics + 180 Flip + Scale)
      const nodes = garmentNodesRef.current;
      nodes.forEach((node, i) => {
        const itemWorldX = node.group.position.x + carouselGroup.position.x;
        const distFromCenter = Math.abs(itemWorldX);
        const isFocused = i === state.activeIndex;

        // Centered enlargement & subtle hero elevation
        const targetScale = isFocused ? 1.22 : Math.max(0.85, 1.0 - distFromCenter * 0.08);
        const currentScale = node.group.scale.x;
        const newScale = THREE.MathUtils.damp(currentScale, targetScale, 8, delta);
        node.group.scale.set(newScale, newScale, newScale);

        // Elevation when focused
        const targetElevation = isFocused ? -0.06 : 0;
        node.clothMesh.position.y = THREE.MathUtils.damp(
          node.clothMesh.position.y,
          -0.08 + targetElevation,
          6,
          delta
        );

        // Swinging physics along Z axis:
        // Inertia from rail acceleration + slight natural breathing sway
        const railAccel = state.railVelocity * 0.06;
        const naturalSway = isFocused ? Math.sin(elapsed * 1.8 + i) * 0.015 : 0;
        const targetAngleZ = -railAccel * 0.15 + naturalSway;

        // Harmonic oscillator: spring towards targetAngleZ
        const springK = 35;
        const dampingC = 6;
        const springForce = (targetAngleZ - node.swingAngleZ) * springK;
        const dampingForce = -node.swingVelZ * dampingC;
        const accel = springForce + dampingForce;

        node.swingVelZ += accel * delta;
        node.swingAngleZ += node.swingVelZ * delta;
        // Clamp extreme swing for aesthetic realism
        node.swingAngleZ = Math.max(-0.4, Math.min(0.4, node.swingAngleZ));

        // Apply swing rotation around top rail hook
        node.group.rotation.z = node.swingAngleZ;

        // 180° Front / Back Flip rotation
        let targetFlip = 0;
        if (isFocused && state.isFlippedBack) {
          targetFlip = Math.PI;
        }
        node.flipAngleY = THREE.MathUtils.damp(node.flipAngleY, targetFlip, 7, delta);
        node.clothMesh.rotation.y = node.flipAngleY;
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Cleanup
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
      }
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      // Dispose geometries & materials to prevent memory leak
      railBarGeo.dispose();
      stopperGeo.dispose();
      legGeo.dispose();
      footGeo.dispose();
      floorGeo.dispose();
      shadowGeo.dispose();
      hangerBodyGeo.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [products]); // Re-init scene when product count / collection drastically changes

  return (
    <div className="relative w-full h-full min-h-[400px] select-none overflow-hidden touch-none flex flex-col">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full min-h-[400px] flex-1" />

      {/* Subtle rail drag indicator when idle */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md text-[11px] tracking-widest text-zinc-300 uppercase font-mono transition-opacity duration-300 shadow-xl">
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>Drag Rail · Swipe · Arrow Keys</span>
      </div>
    </div>
  );
};

// ==========================================
// PROCEDURAL GEOMETRY BUILDERS (3-12 parts)
// ==========================================

/**
 * Creates realistic wooden/metal curved coat hanger geometry
 */
function createHangerGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Triangular hanger shape with rounded shoulder ends
  shape.moveTo(0, 0);
  shape.lineTo(0.48, -0.14);
  shape.lineTo(0.48, -0.17);
  shape.lineTo(-0.48, -0.17);
  shape.lineTo(-0.48, -0.14);
  shape.closePath();

  // Crossbar cutout
  const hole = new THREE.Path();
  hole.moveTo(0, -0.05);
  hole.lineTo(0.38, -0.14);
  hole.lineTo(-0.38, -0.14);
  hole.closePath();
  shape.holes.push(hole);

  const extrudeSettings = {
    steps: 1,
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 4,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  return geo;
}

/**
 * Procedural 3D Garment Construction based on streetwear categories:
 * T-Shirts, Hoodies, Tank Tops, Outerwear.
 */
function createGarmentModel(
  category: Product['category'],
  frontMat: THREE.MeshStandardMaterial,
  backMat: THREE.MeshStandardMaterial,
  colorHex: string,
  isSoftwareGl: boolean
): { mesh: THREE.Mesh; accentMaterials: THREE.MeshStandardMaterial[] } {
  const accentMaterials: THREE.MeshStandardMaterial[] = [];

  // Garment dimensions
  let width = 0.94;
  let height = 1.15;
  let depth = 0.06;

  if (category === 'HOODIES') {
    width = 1.02;
    height = 1.25;
    depth = 0.12;
  } else if (category === 'TANKS') {
    width = 0.72;
    height = 1.08;
    depth = 0.035;
  } else if (category === 'OUTERWEAR') {
    width = 1.06;
    height = 1.22;
    depth = 0.14;
  }

  // Create curved garment body
  const bodyGeo = new THREE.BoxGeometry(width, height, depth, 16, 16, 2);

  // Deform geometry slightly to create realistic draped cloth folds
  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Subtle front/back cloth curvature
    const curve = Math.sin((y / height + 0.5) * Math.PI) * 0.04;
    // Side drape taper
    const taper = 1.0 - (y / height) * 0.06;

    pos.setX(i, x * taper);
    pos.setZ(i, z + (z > 0 ? curve : -curve));
  }
  bodyGeo.computeVertexNormals();

  // Multi-material box:
  // Face 4 is FRONT (+Z), Face 5 is BACK (-Z), others are side/seam edges
  const edgeMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.9,
    metalness: 0.02,
  });
  accentMaterials.push(edgeMat);

  const materials = [
    edgeMat,  // right (+X)
    edgeMat,  // left (-X)
    edgeMat,  // top (+Y)
    edgeMat,  // bottom (+Y)
    frontMat, // front (+Z)
    backMat,  // back (-Z)
  ];

  const mainClothMesh = new THREE.Mesh(bodyGeo, materials);
  mainClothMesh.castShadow = !isSoftwareGl;
  mainClothMesh.receiveShadow = !isSoftwareGl;

  // Add 3D Category Accent Details
  if (category === 'HOODIES') {
    // 3D Dimensional Hood draped behind collar
    const hoodGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.36, 16, 8, true);
    hoodGeo.rotateX(Math.PI / 4);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    accentMaterials.push(hoodMat);
    const hoodMesh = new THREE.Mesh(hoodGeo, hoodMat);
    hoodMesh.position.set(0, height * 0.46, -0.12);
    mainClothMesh.add(hoodMesh);

    // Ribbed Hem Bar
    const hemGeo = new THREE.BoxGeometry(width * 0.98, 0.08, depth * 1.1);
    const hemMesh = new THREE.Mesh(hemGeo, edgeMat);
    hemMesh.position.set(0, -height / 2 + 0.04, 0);
    mainClothMesh.add(hemMesh);

  } else if (category === 'OUTERWEAR') {
    // Structured Collar
    const collarGeo = new THREE.TorusGeometry(0.26, 0.04, 8, 24, Math.PI);
    collarGeo.rotateX(Math.PI / 2);
    const collarMesh = new THREE.Mesh(collarGeo, edgeMat);
    collarMesh.position.set(0, height * 0.48, 0);
    mainClothMesh.add(collarMesh);

    // Silver Zipper Pull
    const pullGeo = new THREE.BoxGeometry(0.018, 0.055, 0.01);
    const pullMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.95,
      roughness: 0.15,
    });
    const pullMesh = new THREE.Mesh(pullGeo, pullMat);
    pullMesh.position.set(0, height * 0.38, depth / 2 + 0.015);
    mainClothMesh.add(pullMesh);

  } else if (category === 'TEES') {
    // Ribbed Neckband Ring
    const ribGeo = new THREE.TorusGeometry(0.22, 0.022, 8, 32, Math.PI);
    ribGeo.rotateX(Math.PI / 2);
    const ribMesh = new THREE.Mesh(ribGeo, edgeMat);
    ribMesh.position.set(0, height * 0.49, 0);
    mainClothMesh.add(ribMesh);
  }

  return { mesh: mainClothMesh, accentMaterials };
}
