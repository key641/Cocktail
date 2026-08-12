import type { Cocktail } from "./types";
import type { ShareCaption } from "./captionGenerator";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片读取失败"));
    image.src = src;
  });
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
  } else {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
  }
  context.closePath();
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const character of paragraph) {
      const next = line + character;
      if (context.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = character;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export function shareImageFilename(cocktail: Cocktail) {
  return `${cocktail.englishName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || cocktail.id}-share.png`;
}

export async function createShareImage(cocktail: Cocktail, photoUrl: string, caption: ShareCaption) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持生成图片");

  context.fillStyle = "#f6f7f1";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(39,73,57,.08)";
  context.lineWidth = 1;
  for (let x = 96; x < canvas.width; x += 192) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }

  context.fillStyle = "#315846";
  context.font = "500 30px system-ui, sans-serif";
  context.fillText("今晚我完成了一杯", 88, 112);
  context.font = "500 78px Georgia, serif";
  context.fillText(cocktail.englishName, 88, 218);
  context.fillStyle = "#6c766f";
  context.font = "32px system-ui, sans-serif";
  context.fillText(cocktail.name, 90, 270);

  roundedRect(context, 80, 320, 920, 650, 38);
  context.fillStyle = "#e8ece4";
  context.fill();
  if (photoUrl) {
    const photo = await loadImage(photoUrl);
    const scale = Math.max(920 / photo.width, 650 / photo.height);
    const width = photo.width * scale;
    const height = photo.height * scale;
    context.save();
    roundedRect(context, 80, 320, 920, 650, 38);
    context.clip();
    context.drawImage(photo, 80 + (920 - width) / 2, 320 + (650 - height) / 2, width, height);
    context.restore();
  }

  context.fillStyle = "#244537";
  context.font = "42px Georgia, 'Noto Serif SC', serif";
  const lines = wrapText(context, caption.captionFull, 900).slice(0, 5);
  lines.forEach((line, index) => context.fillText(line, 88, 1055 + index * 62));

  context.fillStyle = "#78817b";
  context.font = "26px system-ui, sans-serif";
  context.fillText(caption.shareTags.map((tag) => `#${tag}`).join("  "), 88, 1370);
  context.fillStyle = "#315846";
  context.font = "600 24px system-ui, sans-serif";
  context.fillText("AI 调酒师 · 我的成品", 758, 1370);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片生成失败")), "image/png", 0.94);
  });
}
