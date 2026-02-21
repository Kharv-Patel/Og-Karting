const imageInput = document.getElementById("trackImage");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const canvas = document.getElementById("outputCanvas");
const statusLabel = document.getElementById("status");
const ctx = canvas.getContext("2d");

const appState = {
  loadedImage: null,
};

imageInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const image = await loadImage(file);
    appState.loadedImage = image;
    drawImageToCanvas(image);
    generateBtn.disabled = false;
    setStatus("Image loaded. Click ‘Generate Racing Line’.", "ok");
    lockDownload();
  } catch {
    setStatus("Could not load that image. Try another file.", "error");
  }
});

generateBtn.addEventListener("click", () => {
  if (!appState.loadedImage) {
    return;
  }

  setStatus("Generating racing line…", "ok");
  window.requestAnimationFrame(() => {
    drawImageToCanvas(appState.loadedImage);
    const points = detectTrackCenterline(ctx, canvas.width, canvas.height);

    if (points.length < 12) {
      setStatus("Could not detect enough track detail. Try a clearer layout image.", "error");
      lockDownload();
      return;
    }

    drawRacingLine(points);
    unlockDownload();
    setStatus("Done! Your racing line is ready to download.", "ok");
  });
});

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function drawImageToCanvas(image) {
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));

  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function detectTrackCenterline(context, width, height) {
  const data = context.getImageData(0, 0, width, height).data;
  const columnStep = Math.max(3, Math.floor(width / 160));
  const points = [];

  for (let x = 0; x < width; x += columnStep) {
    let bestY = -1;
    let bestScore = -Infinity;

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;

      if (brightness > bestScore) {
        bestScore = brightness;
        bestY = y;
      }
    }

    if (bestY >= 0) {
      points.push({ x, y: bestY });
    }
  }

  return smoothPoints(points, 6);
}

function smoothPoints(points, windowSize) {
  const smoothed = [];

  for (let i = 0; i < points.length; i++) {
    let sumY = 0;
    let count = 0;

    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j < 0 || j >= points.length) continue;
      sumY += points[j].y;
      count += 1;
    }

    smoothed.push({ x: points[i].x, y: sumY / count });
  }

  return smoothed;
}

function drawRacingLine(points) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[Math.min(i + 1, points.length - 1)];

    const heading1 = Math.atan2(b.y - a.y, b.x - a.x);
    const heading2 = Math.atan2(c.y - b.y, c.x - b.x);
    const turnIntensity = Math.min(1, Math.abs(heading2 - heading1) * 1.4);

    const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    const colorA = blendGreenRed(turnIntensity * 0.8);
    const colorB = blendGreenRed(turnIntensity);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(1, colorB);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(4, canvas.width * 0.01);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function blendGreenRed(ratio) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const r = Math.round(35 + clamped * 210);
  const g = Math.round(225 - clamped * 170);
  const b = Math.round(65 - clamped * 50);
  return `rgb(${r} ${g} ${b})`;
}

function unlockDownload() {
  downloadBtn.href = canvas.toDataURL("image/png");
  downloadBtn.setAttribute("aria-disabled", "false");
}

function lockDownload() {
  downloadBtn.removeAttribute("href");
  downloadBtn.setAttribute("aria-disabled", "true");
}

function setStatus(text, tone) {
  statusLabel.textContent = text;
  statusLabel.style.color = tone === "error" ? "#ff6b6b" : "#a1a1a1";
}