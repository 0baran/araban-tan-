const sharp = require('sharp');
const fs = require('fs');

const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const ICON_DIR = 'android/app/src/main/res';

const MIL_YELLOW = '#FFC107';
const MIL_YELLOW2 = '#FFA000';
const BG_DARK = '#1a1a2e';

function createMILSVG(size) {
  const cx = size / 2;
  const s = size / 192;
  const cy = size / 2;

  // Engine block dimensions (relative to 192 base)
  const ew = 120 * s;   // engine width
  const eh = 80 * s;    // engine height
  const th = 24 * s;    // top (valve cover) height
  const tw = 76 * s;    // top width
  const sw = 8 * s;     // stroke width
  const r = 10 * s;     // corner radius

  const ex = cx - ew / 2;  // engine x
  const ey = cy - eh / 2 + 8 * s;  // engine y (shifted down slightly)
  const tx = cx - tw / 2;  // top x
  const ty = ey - th + 4 * s;  // top y
  const bx = cx - ew * 0.35;  // bolt x

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f0c29"/>
        <stop offset="100%" style="stop-color:#1a1a2e"/>
      </linearGradient>
      <linearGradient id="mil" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${MIL_YELLOW}"/>
        <stop offset="100%" style="stop-color:${MIL_YELLOW2}"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="${4 * s}" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="${size}" height="${size}" rx="${24 * s}" fill="url(#bg)"/>
    <g filter="url(#glow)" fill="url(#mil)">
      <!-- Engine block outline -->
      <rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" rx="${r}" fill="url(#mil)" stroke="${MIL_YELLOW}" stroke-width="${Math.max(1.5, sw)}"/>
      <!-- Valve cover on top -->
      <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${r * 0.5}" fill="url(#mil)" stroke="${MIL_YELLOW}" stroke-width="${Math.max(1.5, sw * 0.7)}"/>
      <!-- Horizontal detail lines inside block -->
      <line x1="${ex + 10 * s}" y1="${ey + 20 * s}" x2="${ex + ew - 10 * s}" y2="${ey + 20 * s}" stroke="${BG_DARK}" stroke-width="${Math.max(1, s * 2)}" opacity="0.5"/>
      <line x1="${ex + 10 * s}" y1="${ey + 40 * s}" x2="${ex + ew - 10 * s}" y2="${ey + 40 * s}" stroke="${BG_DARK}" stroke-width="${Math.max(1, s * 2)}" opacity="0.5"/>
      <line x1="${ex + 10 * s}" y1="${ey + 60 * s}" x2="${ex + ew - 10 * s}" y2="${ey + 60 * s}" stroke="${BG_DARK}" stroke-width="${Math.max(1, s * 2)}" opacity="0.5"/>
      <!-- Bolts on top -->
      <circle cx="${tx + 10 * s}" cy="${ty + th / 2}" r="${3 * s}" fill="${BG_DARK}" opacity="0.4"/>
      <circle cx="${tx + tw - 10 * s}" cy="${ty + th / 2}" r="${3 * s}" fill="${BG_DARK}" opacity="0.4"/>
    </g>
  </svg>`;
}

async function main() {
  for (const [dir, size] of Object.entries(SIZES)) {
    const svg = createMILSVG(size);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    fs.writeFileSync(`${ICON_DIR}/${dir}/ic_launcher.png`, png);
    fs.writeFileSync(`${ICON_DIR}/${dir}/ic_launcher_round.png`, png);
    console.log(`✓ ${dir} (${size}x${size})`);
  }
  for (const f of ['check-jimp.js', 'check-jimp2.js', 'check-jimp3.js', 'test-jimp.js']) {
    try { fs.unlinkSync(`scripts/${f}`); } catch {}
  }
  console.log('MIL icons generated successfully!');
}

main().catch(console.error);
