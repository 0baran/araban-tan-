const sharp = require('sharp');

async function run() {
  try {
    const input = 'C:/Users/BALKAN/.gemini/antigravity/brain/b9b8b1ab-22de-4510-96ce-0328934f762e/check_engine_logo_1779369214579.png';
    await sharp(input)
      .trim() // Automatically remove all surrounding black/empty space
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .toFile('massive_icon.png');
      
    console.log('Successfully created massive_icon.png');
  } catch(e) {
    console.error(e);
  }
}
run();
