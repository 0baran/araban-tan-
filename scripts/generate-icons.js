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

function createMILSVG(size) {
  const s = size / 192;
  const cx = size / 2;
  const cy = size / 2;
  const x = (v) => Math.round(v * s);

  const ew = 116 * s;
  const eh = 88 * s;
  const ex = cx - ew / 2;
  const ey = cy - eh / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="100%" style="stop-color:#0f0c29"/>
      </radialGradient>
      <linearGradient id="mil" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#FFD54F"/>
        <stop offset="50%" style="stop-color:#FFC107"/>
        <stop offset="100%" style="stop-color:#FF8F00"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="${x(6)}" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Rounded square background -->
    <rect width="${size}" height="${size}" rx="${x(28)}" fill="url(#bg)"/>
    <!-- Engine icon -->
    <g filter="url(#glow)" fill="url(#mil)" stroke="#FFC107" stroke-linejoin="round">
      <!-- Main engine block: a slightly taller rectangle with rounded corners -->
      <rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" rx="${x(8)}" fill="url(#mil)" stroke-width="${x(3)}"/>
      <!-- Top bump (valve cover / cylinder head) -->
      <rect x="${ex + ew * 0.22}" y="${ey - x(14)}" width="${ew * 0.56}" height="${x(20)}" rx="${x(4)}" fill="url(#mil)" stroke-width="${x(3)}"/>
      <!-- Left ear (accessory mount detail) -->
      <rect x="${ex - x(10)}" y="${ey + eh * 0.25}" width="${x(14)}" height="${eh * 0.35}" rx="${x(3)}" fill="url(#mil)" stroke-width="${x(2.5)}"/>
      <!-- Internal line detail: oil pan line at bottom -->
      <line x1="${ex + x(12)}" y1="${ey + eh - x(12)}" x2="${ex + ew - x(12)}" y2="${ey + eh - x(12)}" stroke="#0f0c29" stroke-width="${x(3)}" opacity="0.35" stroke-linecap="round"/>
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
