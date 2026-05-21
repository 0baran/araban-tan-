const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generate() {
  try {
    const image = await Jimp.read('logo-square.png');
    
    for (const [folder, size] of Object.entries(SIZES)) {
      const dir = path.join('android', 'app', 'src', 'main', 'res', folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      const resized = image.clone().resize(size, size);
      
      const p1 = path.join(dir, 'ic_launcher.png');
      const p2 = path.join(dir, 'ic_launcher_round.png');
      
      await resized.writeAsync(p1);
      await resized.writeAsync(p2);
      
      console.log(`Written ${size}x${size} to ${folder}`);
    }
  } catch(e) {
    console.error(e);
  }
}

generate();
