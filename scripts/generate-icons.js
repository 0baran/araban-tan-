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

  // Classic dashboard check engine light - solid yellow on transparent
  const bw = 120 * s;
  const bh = 80 * s;
  const bx = cx - bw / 2;
  const by = cy - 36 * s;
  const vw = 70 * s;
  const vh = 24 * s;
  const vx = cx - vw / 2;
  const vy = by - vh + 4 * s;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="55%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="100%" style="stop-color:#0f0c29"/>
      </radialGradient>
      <linearGradient id="mil" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#FFEB3B"/>
        <stop offset="40%" style="stop-color:#FFC107"/>
        <stop offset="100%" style="stop-color:#FF8F00"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${28 * s}" fill="url(#bg)"/>
    <!-- Engine block outline -->
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${10 * s}" fill="url(#mil)" stroke="#E65100" stroke-width="${3 * s}"/>
    <!-- Valve cover -->
    <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="${6 * s}" fill="url(#mil)" stroke="#E65100" stroke-width="${3 * s}"/>
    <!-- Horizontal detail lines -->
    <rect x="${bx + 16 * s}" y="${by + 16 * s}" width="${bw - 32 * s}" height="${5 * s}" rx="${2 * s}" fill="#E65100" opacity="0.4"/>
    <rect x="${bx + 16 * s}" y="${by + 36 * s}" width="${bw - 32 * s}" height="${5 * s}" rx="${2 * s}" fill="#E65100" opacity="0.4"/>
    <rect x="${bx + 16 * s}" y="${by + 56 * s}" width="${bw - 32 * s}" height="${5 * s}" rx="${2 * s}" fill="#E65100" opacity="0.4"/>
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
