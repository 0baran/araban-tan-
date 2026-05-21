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

function createSVG(size) {
  const s = size / 192;
  const x = (v) => Math.round(v * s);
  const cx = size / 2;
  const cy = size / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f0c29"/>
        <stop offset="50%" style="stop-color:#302b63"/>
        <stop offset="100%" style="stop-color:#24243e"/>
      </linearGradient>
      <linearGradient id="car" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#00d2ff"/>
        <stop offset="100%" style="stop-color:#3a7bd5"/>
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#00ff7f;stop-opacity:0.3"/>
        <stop offset="100%" style="stop-color:#00bfff;stop-opacity:0.1"/>
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="${x(2)}" stdDeviation="${x(3)}" flood-color="#00bfff" flood-opacity="0.4"/>
      </filter>
    </defs>
    <rect width="${size}" height="${size}" rx="${x(28)}" fill="url(#bg)"/>
    <rect x="${x(8)}" y="${x(8)}" width="${size - x(16)}" height="${size - x(16)}" rx="${x(24)}" fill="url(#glow)"/>
    <circle cx="${cx}" cy="${cy}" r="${x(52)}" fill="none" stroke="url(#car)" stroke-width="${x(2)}" opacity="0.2"/>
    <g filter="url(#shadow)">
      <rect x="${x(36)}" y="${cy + x(8)}" width="${x(120)}" height="${x(54)}" rx="${x(8)}" fill="url(#car)"/>
      <rect x="${x(64)}" y="${cy - x(24)}" width="${x(80)}" height="${x(38)}" rx="${x(6)}" fill="url(#car)"/>
      <rect x="${x(68)}" y="${cy - x(18)}" width="${x(72)}" height="${x(24)}" rx="${x(3)}" fill="#0f0c29"/>
      <rect x="${x(38)}" y="${cy + x(8)}" width="${x(50)}" height="${x(36)}" rx="${x(4)}" fill="#0f0c29" opacity="0.4"/>
      <rect x="${x(104)}" y="${cy + x(8)}" width="${x(50)}" height="${x(36)}" rx="${x(4)}" fill="#0f0c29" opacity="0.4"/>
      <circle cx="${x(62)}" cy="${cy + x(62)}" r="${x(16)}" fill="#0f0c29"/>
      <circle cx="${x(62)}" cy="${cy + x(62)}" r="${x(16)}" fill="none" stroke="#00ff7f" stroke-width="${x(3)}" opacity="0.8"/>
      <circle cx="${x(130)}" cy="${cy + x(62)}" r="${x(16)}" fill="#0f0c29"/>
      <circle cx="${x(130)}" cy="${cy + x(62)}" r="${x(16)}" fill="none" stroke="#00ff7f" stroke-width="${x(3)}" opacity="0.8"/>
      <circle cx="${x(62)}" cy="${cy + x(62)}" r="${x(7)}" fill="#3a7bd5"/>
      <circle cx="${x(130)}" cy="${cy + x(62)}" r="${x(7)}" fill="#3a7bd5"/>
    </g>
    <text x="${cx}" y="${cy - x(58)}" text-anchor="middle" fill="#00d2ff" font-size="${x(14)}" font-weight="bold" font-family="sans-serif" letter-spacing="${x(3)}">OBD2</text>
    ${size >= 96 ? `<text x="${cx}" y="${cy + x(90)}" text-anchor="middle" fill="#00ff7f" font-size="${x(9)}" font-family="sans-serif" opacity="0.7">ARABANI TANI</text>` : ''}
  </svg>`;
}

async function main() {
  for (const [dir, size] of Object.entries(SIZES)) {
    const svg = createSVG(size);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    fs.writeFileSync(`${ICON_DIR}/${dir}/ic_launcher.png`, png);
    fs.writeFileSync(`${ICON_DIR}/${dir}/ic_launcher_round.png`, png);
    console.log(`✓ ${dir} (${size}x${size})`);
  }
  // Clean stale scripts
  for (const f of ['check-jimp.js', 'check-jimp2.js', 'check-jimp3.js', 'test-jimp.js']) {
    try { fs.unlinkSync(`scripts/${f}`); } catch {}
  }
  console.log('Icons generated successfully!');
}

main().catch(console.error);
