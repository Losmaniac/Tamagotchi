// Composes a framed "polaroid" from a canvas snapshot: background, pet, name and date.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export interface FrameOptions {
  snapshot: string;
  colors: [string, string];
  title: string;
  caption: string;
  width?: number;
  quality?: number;
}

export async function framePhoto({
  snapshot,
  colors,
  title,
  caption,
  width = 540,
  quality = 0.82,
}: FrameOptions): Promise<string> {
  const img = await loadImage(snapshot);
  const W = width;
  const H = Math.round(width * 1.25);
  const pad = Math.round(W * 0.05);
  const photoH = H - pad * 2 - Math.round(W * 0.2);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return snapshot;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, pad, 0, pad + photoH);
  g.addColorStop(0, colors[0]);
  g.addColorStop(1, colors[1]);
  ctx.fillStyle = g;
  ctx.fillRect(pad, pad, W - pad * 2, photoH);
  // Cover-fit the snapshot (centre crop).
  const boxW = W - pad * 2;
  const scale = Math.max(boxW / img.width, photoH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, pad, boxW, photoH);
  ctx.clip();
  ctx.drawImage(img, pad + (boxW - dw) / 2, pad + (photoH - dh) / 2, dw, dh);
  ctx.restore();
  ctx.fillStyle = '#2b1a3d';
  ctx.textAlign = 'center';
  ctx.font = `900 ${Math.round(W * 0.07)}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(title, W / 2, pad + photoH + Math.round(W * 0.095));
  ctx.fillStyle = '#6b5f7a';
  ctx.font = `600 ${Math.round(W * 0.04)}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(caption, W / 2, pad + photoH + Math.round(W * 0.155));
  return canvas.toDataURL('image/jpeg', quality);
}

export function dataUrlToFile(dataUrl: string, name: string): File {
  const [head, body] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(head ?? '')?.[1] ?? 'image/jpeg';
  const bin = atob(body ?? '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

/** Share via the system share sheet when possible, otherwise download. */
export async function shareOrDownload(file: File): Promise<void> {
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return;
    } catch {
      /* cancelled → fall back to download */
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
