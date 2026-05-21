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

  // Simple bold engine icon - scaled for visibility at small sizes
  const bw = 128 * s;
  const bh = 92 * s;
  const bx = cx - bw / 2;
  const by = cy - bh / 2 + 6 * s;
  const tw = 72 * s;
  const th = 22 * s;
  const tx = cx - tw / 2;
  const ty = by - th + 2 * s;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="55%">
        <stop offset="0%" style="stop-color:#0f0c29"/>
        <stop offset="100%" style="stop-color:#1a1a2e"/>
      </radialGradient>
      <linearGradient id="mil" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#FFD54F"/>
        <stop offset="50%" style="stop-color:#FFC107"/>
        <stop offset="100%" style="stop-color:#FFA000"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${28 * s}" fill="url(#bg)"/>
    <!-- Engine block - main body -->
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${12 * s}" fill="url(#mil)"/>
    <!-- Top section (valve cover) -->
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${6 * s}" fill="url(#mil)"/>
    <!-- Dark internal contrast line -->
    <rect x="${bx + 14 * s}" y="${by + 18 * s}" width="${bw - 28 * s}" height="${4 * s}" rx="${2 * s}" fill="#0f0c29" opacity="0.3"/>
    <rect x="${bx + 14 * s}" y="${by + 38 * s}" width="${bw - 28 * s}" height="${4 * s}" rx="${2 * s}" fill="#0f0c29" opacity="0.3"/>
    <rect x="${bx + 14 * s}" y="${by + 58 * s}" width="${bw - 28 * s}" height="${4 * s}" rx="${2 * s}" fill="#0f0c29" opacity="0.3"/>
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
