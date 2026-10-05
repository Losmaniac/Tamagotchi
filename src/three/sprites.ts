import { CanvasTexture, SRGBColorSpace } from 'three';

export type SpriteKind =
  'heart' | 'sparkle' | 'bubble' | 'crumb' | 'z' | 'stink' | 'note' | 'star' | 'shadow' | 'bolt';

const cache = new Map<SpriteKind, CanvasTexture>();
const SIZE = 64;

function draw(kind: SpriteKind, ctx: CanvasRenderingContext2D): void {
  const c = SIZE / 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (kind) {
    case 'heart': {
      ctx.fillStyle = '#ff4d8d';
      ctx.beginPath();
      ctx.moveTo(c, 52);
      ctx.bezierCurveTo(4, 30, 14, 6, c, 20);
      ctx.bezierCurveTo(50, 6, 60, 30, c, 52);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(21, 22, 5, 3, -0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sparkle':
    case 'star': {
      ctx.fillStyle = kind === 'star' ? '#ffd23f' : '#fff27a';
      ctx.beginPath();
      const spikes = kind === 'star' ? 5 : 4;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? 28 : kind === 'star' ? 12 : 7;
        const a = (i * Math.PI) / spikes - Math.PI / 2;
        ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'bubble': {
      ctx.strokeStyle = 'rgba(120,200,255,0.9)';
      ctx.fillStyle = 'rgba(190,235,255,0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c, c, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(22, 22, 6, 4, -0.7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'crumb': {
      ctx.fillStyle = '#c98a4b';
      ctx.beginPath();
      ctx.moveTo(14, 34);
      ctx.lineTo(30, 14);
      ctx.lineTo(50, 26);
      ctx.lineTo(44, 50);
      ctx.lineTo(20, 50);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'z': {
      ctx.fillStyle = '#7b5cff';
      ctx.font = 'bold 50px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Z', c, c + 2);
      break;
    }
    case 'stink': {
      ctx.strokeStyle = '#7fae3a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(c, 58);
      ctx.bezierCurveTo(10, 44, 54, 30, c, 18);
      ctx.bezierCurveTo(20, 10, 40, 6, c, 4);
      ctx.stroke();
      break;
    }
    case 'shadow': {
      const g = ctx.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0, 'rgba(60,30,110,0.9)');
      g.addColorStop(0.45, 'rgba(60,30,110,0.5)');
      g.addColorStop(1, 'rgba(60,30,110,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SIZE, SIZE);
      break;
    }
    case 'bolt': {
      ctx.fillStyle = '#ffe14d';
      ctx.strokeStyle = '#2f9df4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(36, 4);
      ctx.lineTo(16, 34);
      ctx.lineTo(30, 34);
      ctx.lineTo(24, 60);
      ctx.lineTo(48, 26);
      ctx.lineTo(34, 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'note': {
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.ellipse(24, 46, 11, 8, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(32, 10, 5, 36);
      ctx.fillRect(32, 10, 18, 6);
      break;
    }
  }
}

/** Procedurally drawn particle textures (no image files). */
export function spriteTexture(kind: SpriteKind): CanvasTexture {
  let tex = cache.get(kind);
  if (!tex) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(kind, ctx);
    tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    cache.set(kind, tex);
  }
  return tex;
}
