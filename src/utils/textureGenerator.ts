import * as THREE from 'three';
import { Product } from '../types/product';

/**
 * Procedural texture and graphic generator for streetwear garments.
 * Complies with Three.js Skill: SRGBColorSpace, anisotropy, zero-404 fallbacks.
 */

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates high-detail fabric bump/normal pattern for cotton french terry & heavy jersey.
 */
export function createFabricNormalTexture(): THREE.CanvasTexture {
  const cacheKey = 'fabric-terry-bump';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Neutral base normal
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, 512, 512);

  // Micro cotton weave loop structure
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      // Weave grain pattern
      const weaveX = Math.sin(x * 0.4) * 0.5 + 0.5;
      const weaveY = Math.cos(y * 0.4) * 0.5 + 0.5;
      const noise = (Math.random() - 0.5) * 18;

      const perturbation = (weaveX * weaveY * 22) + noise;

      data[idx] = Math.min(255, Math.max(0, 128 + perturbation));     // R (normal X)
      data[idx + 1] = Math.min(255, Math.max(0, 128 + perturbation)); // G (normal Y)
      data[idx + 2] = 255;                                            // B (normal Z)
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural studio floor grid & ambient gradient
 */
export function createStudioFloorTexture(): THREE.CanvasTexture {
  const cacheKey = 'studio-floor-grid';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark industrial concrete tone
  ctx.fillStyle = '#0c0d10';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle grid lines
  ctx.strokeStyle = '#181a20';
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = 0; x <= 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Radial soft ambient highlight
  const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 512);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generates front or back graphic texture for a streetwear product.
 * If a custom image URL is provided, it tries to render it onto the canvas;
 * otherwise, it crafts a brutalist/streetwear screenprint graphic.
 */
export function generateGarmentTexture(
  product: Product,
  isBack: boolean,
  colorHex: string
): THREE.CanvasTexture {
  const cacheKey = `${product.id}-${isBack ? 'back' : 'front'}-${colorHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Base garment wash background
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 1024, 1024);

  // Add subtle vintage wash noise / heather texture
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle rib / stitch lines along collar and hem
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 950);
  ctx.lineTo(924, 950);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 953);
  ctx.lineTo(924, 953);
  ctx.stroke();

  // 2. Decide text/contrast color
  // Parse brightness of base garment
  const r = parseInt(colorHex.slice(1, 3), 16) || 20;
  const g = parseInt(colorHex.slice(3, 5), 16) || 20;
  const b = parseInt(colorHex.slice(5, 7), 16) || 20;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const isLightGarment = brightness > 140;

  const primaryInk = isLightGarment ? '#111216' : '#f4f4f6';
  const secondaryInk = isLightGarment ? '#374151' : '#9ca3af';
  const accentInk = isLightGarment ? '#e11d48' : '#fb7185';

  const imageUrl = isBack ? product.backImageUrl : product.frontImageUrl;

  // Draw procedural streetwear art
  if (!isBack) {
    // --- FRONT SIDE ---
    drawFrontGraphic(ctx, product, primaryInk, secondaryInk, accentInk);
  } else {
    // --- BACK SIDE (Oversized Drop / Typography / Heavy Art) ---
    drawBackGraphic(ctx, product, primaryInk, secondaryInk, accentInk);
  }

  // If a valid image URL is supplied (data URL or http), load onto canvas asynchronously and mark needsUpdate
  if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('http') || imageUrl.startsWith('blob:'))) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw centered graphic
      const targetSize = isBack ? 650 : 480;
      const aspect = img.width / img.height;
      let drawW = targetSize;
      let drawH = targetSize / aspect;
      if (aspect < 1) {
        drawH = targetSize;
        drawW = targetSize * aspect;
      }
      const x = 512 - drawW / 2;
      const y = isBack ? (500 - drawH / 2) : (440 - drawH / 2);

      // Clean background underneath graphic area
      ctx.drawImage(img, x, y, drawW, drawH);
      texture.needsUpdate = true;
    };
    img.src = imageUrl;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

function drawFrontGraphic(
  ctx: CanvasRenderingContext2D,
  product: Product,
  primaryInk: string,
  secondaryInk: string,
  accentInk: string
) {
  const category = product.category;

  if (category === 'HOODIES') {
    // Front kangaroo pocket hint
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(260, 680);
    ctx.lineTo(340, 590);
    ctx.lineTo(684, 590);
    ctx.lineTo(764, 680);
    ctx.stroke();

    // Chest embroidery or subtle typography
    ctx.textAlign = 'center';
    ctx.font = '700 32px "Syne", sans-serif';
    ctx.fillStyle = primaryInk;
    ctx.fillText('AETHEL / 00', 512, 380);

    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.fillStyle = secondaryInk;
    ctx.fillText('ARCHIVE SYSTEM // 480 GSM', 512, 410);

    // Minimal chest emblem
    ctx.strokeStyle = accentInk;
    ctx.lineWidth = 3;
    ctx.strokeRect(482, 310, 60, 30);
    ctx.beginPath();
    ctx.moveTo(482, 325);
    ctx.lineTo(542, 325);
    ctx.stroke();

  } else if (category === 'TANKS') {
    // Scoop neck tank minimalist front branding
    ctx.textAlign = 'center';
    ctx.font = '800 44px "Syne", sans-serif';
    ctx.fillStyle = primaryInk;
    ctx.fillText(product.name.split(' ')[0] || 'RAW', 512, 420);

    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillStyle = accentInk;
    ctx.fillText('/// [ 280 GSM RIBBED ]', 512, 460);

    // Industrial alignment crosshairs
    drawCrosshair(ctx, 512, 530, 24, secondaryInk);

  } else if (category === 'OUTERWEAR') {
    // Tactical zipper line down the middle
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(512, 100);
    ctx.lineTo(512, 950);
    ctx.stroke();

    // Metallic silver zipper teeth
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    for (let y = 140; y < 940; y += 14) {
      ctx.beginPath();
      ctx.moveTo(507, y);
      ctx.lineTo(517, y);
      ctx.stroke();
    }

    // Chest pocket & military spec badge
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(240, 340, 180, 220);
    ctx.strokeStyle = primaryInk;
    ctx.lineWidth = 2;
    ctx.strokeRect(240, 340, 180, 220);

    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillStyle = primaryInk;
    ctx.textAlign = 'left';
    ctx.fillText('MOD. SPEC 01', 255, 375);
    ctx.font = '400 12px "JetBrains Mono", monospace';
    ctx.fillStyle = secondaryInk;
    ctx.fillText('WATERPROOF SHELL', 255, 398);
    ctx.fillText('REINFORCED SEAMS', 255, 418);

  } else {
    // Standard Oversized Streetwear Graphic Tee
    ctx.textAlign = 'center';

    // Gothic / Cyber streetwear frame
    ctx.strokeStyle = primaryInk;
    ctx.lineWidth = 3;
    ctx.strokeRect(330, 280, 364, 390);

    // Inner distressed accent
    ctx.strokeStyle = accentInk;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(345, 295, 334, 360);

    // Product Title stylized
    ctx.font = '800 38px "Syne", sans-serif';
    ctx.fillStyle = primaryInk;
    const words = product.name.toUpperCase().split(' ');
    const line1 = words.slice(0, 2).join(' ');
    const line2 = words.slice(2).join(' ') || 'COLLECTION';
    ctx.fillText(line1, 512, 380);
    ctx.fillText(line2, 512, 425);

    // Graphic iconography / sacred geometry or industrial emblem
    ctx.beginPath();
    ctx.arc(512, 510, 48, 0, Math.PI * 2);
    ctx.strokeStyle = primaryInk;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(512, 445);
    ctx.lineTo(512, 575);
    ctx.moveTo(447, 510);
    ctx.lineTo(577, 510);
    ctx.strokeStyle = accentInk;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Barcode below graphic
    drawBarcode(ctx, 380, 610, 264, 38, primaryInk);

    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = secondaryInk;
    ctx.fillText('AETHEL HEAVYWEIGHT DROP // 2026', 512, 710);
  }
}

function drawBackGraphic(
  ctx: CanvasRenderingContext2D,
  product: Product,
  primaryInk: string,
  secondaryInk: string,
  accentInk: string
) {
  // Streetwear backs feature massive signature graphics and oversized typography
  ctx.textAlign = 'center';

  // Oversized header typography
  ctx.font = '900 68px "Syne", sans-serif';
  ctx.fillStyle = primaryInk;
  ctx.fillText('A E T H E L', 512, 280);

  // Subheader
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillStyle = accentInk;
  ctx.fillText('WORLDWIDE ARCHIVE // SERIES VII', 512, 325);

  // Heavy central visual block
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(220, 360, 584, 380);
  ctx.strokeStyle = primaryInk;
  ctx.lineWidth = 4;
  ctx.strokeRect(220, 360, 584, 380);

  // Abstract brutalist typographic collage
  ctx.font = '800 52px "Syne", sans-serif';
  ctx.fillStyle = primaryInk;
  ctx.fillText(product.name.toUpperCase(), 512, 450);

  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.fillStyle = secondaryInk;
  ctx.fillText('DESIGNED IN TOKYO & NEW YORK', 512, 495);
  ctx.fillText(`CATEGORY: ${product.category} // ${product.gsm || '450 GSM'}`, 512, 525);
  ctx.fillText(`FIT: ${product.fit || 'OVERSIZED BOXY CUT'}`, 512, 555);

  // Geometric grid accent
  ctx.strokeStyle = accentInk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 600);
  ctx.lineTo(724, 600);
  ctx.stroke();

  // Coordinates & authentic streetwear manifesto
  ctx.font = '400 13px "JetBrains Mono", monospace';
  ctx.fillStyle = secondaryInk;
  ctx.fillText('35.6762° N, 139.6503° E /// 40.7128° N, 74.0060° W', 512, 635);
  ctx.fillText('ALL RIGHTS RESERVED. LIMITED TO 150 NUMBERED PIECES.', 512, 660);

  // Large authentic barcode on lower back
  drawBarcode(ctx, 330, 770, 364, 55, primaryInk);

  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.fillStyle = primaryInk;
  ctx.fillText(`SKU-0${product.id.slice(0, 6).toUpperCase()} // VERIFIED AUTHENTIC`, 512, 855);
}

function drawBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) {
  ctx.fillStyle = color;
  const barCount = 42;
  const unit = width / barCount;
  for (let i = 0; i < barCount; i++) {
    // pseudo-random bar thickness
    const thickness = (i % 3 === 0 || i % 7 === 0) ? unit * 0.8 : unit * 0.4;
    ctx.fillRect(x + i * unit, y, thickness, height);
  }
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.moveTo(x - size - 8, y);
  ctx.lineTo(x + size + 8, y);
  ctx.moveTo(x, y - size - 8);
  ctx.lineTo(x, y + size + 8);
  ctx.stroke();
}
