const $ = id => document.getElementById(id);

const el = {
  color1: $('color1'), color2: $('color2'),
  r1: $('r1'), g1: $('g1'), b1: $('b1'),
  r2: $('r2'), g2: $('g2'), b2: $('b2'),
  preview1: $('preview1'), preview2: $('preview2'),
  resultPreview: $('resultPreview'),
  resultHex: $('resultHex'),
  resultRgb: $('resultRgb'),
  resultHsl: $('resultHsl'),
  mode: $('mode'),
  downloadBtn: $('downloadBtn')
};

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substr(0, 2), 16),
    g: parseInt(hex.substr(2, 2), 16),
    b: parseInt(hex.substr(4, 2), 16)
  };
}

function rgbToHex(r, g, b) {
  const toHex = n => n.toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function blendColors(c1, c2, mode) {
  let r, g, b;
  switch (mode) {
    case 'add':
      r = clamp(c1.r + c2.r); g = clamp(c1.g + c2.g); b = clamp(c1.b + c2.b);
      break;
    case 'average':
      r = clamp((c1.r + c2.r) / 2); g = clamp((c1.g + c2.g) / 2); b = clamp((c1.b + c2.b) / 2);
      break;
    case 'multiply':
      r = clamp((c1.r * c2.r) / 255); g = clamp((c1.g * c2.g) / 255); b = clamp((c1.b * c2.b) / 255);
      break;
    case 'screen':
      r = clamp(255 - ((255 - c1.r) * (255 - c2.r)) / 255);
      g = clamp(255 - ((255 - c1.g) * (255 - c2.g)) / 255);
      b = clamp(255 - ((255 - c1.b) * (255 - c2.b)) / 255);
      break;
    case 'subtract':
      r = clamp(c1.r - c2.r); g = clamp(c1.g - c2.g); b = clamp(c1.b - c2.b);
      break;
    case 'difference':
      r = Math.abs(c1.r - c2.r); g = Math.abs(c1.g - c2.g); b = Math.abs(c1.b - c2.b);
      break;
    default:
      r = clamp((c1.r + c2.r) / 2); g = clamp((c1.g + c2.g) / 2); b = clamp((c1.b + c2.b) / 2);
  }
  return { r, g, b };
}

function updateAll() {
  const c1 = { r: +el.r1.value, g: +el.g1.value, b: +el.b1.value };
  const c2 = { r: +el.r2.value, g: +el.g2.value, b: +el.b2.value };

  el.preview1.style.background = rgbToHex(c1.r, c1.g, c1.b);
  el.preview2.style.background = rgbToHex(c2.r, c2.g, c2.b);
  el.color1.value = rgbToHex(c1.r, c1.g, c1.b);
  el.color2.value = rgbToHex(c2.r, c2.g, c2.b);

  const result = blendColors(c1, c2, el.mode.value);
  const hex = rgbToHex(result.r, result.g, result.b);
  const hsl = rgbToHsl(result.r, result.g, result.b);

  el.resultPreview.style.background = hex;
  el.resultHex.textContent = hex.toUpperCase();
  el.resultRgb.textContent = `rgb(${result.r}, ${result.g}, ${result.b})`;
  el.resultHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

// Event listeners
[el.r1, el.g1, el.b1, el.r2, el.g2, el.b2].forEach(input => {
  input.addEventListener('input', updateAll);
});

el.color1.addEventListener('input', e => {
  const { r, g, b } = hexToRgb(e.target.value);
  el.r1.value = r; el.g1.value = g; el.b1.value = b;
  updateAll();
});

el.color2.addEventListener('input', e => {
  const { r, g, b } = hexToRgb(e.target.value);
  el.r2.value = r; el.g2.value = g; el.b2.value = b;
  updateAll();
});

el.mode.addEventListener('change', updateAll);

// Download sebagai PNG
el.downloadBtn.addEventListener('click', () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const bgColor = el.resultPreview.style.background;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Text HEX
  const hexText = el.resultHex.textContent;
  ctx.fillStyle = getContrastColor(hexText);
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hexText, size / 2, size / 2);

  // Download
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warna-${hexText.replace('#', '')}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

function getContrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? '#000000' : '#FFFFFF';
}

updateAll();

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}
