const sharp = require('sharp');

async function run() {
  try {
    const input = 'C:/Users/BALKAN/.gemini/antigravity/brain/b9b8b1ab-22de-4510-96ce-0328934f762e/check_engine_logo_1779369214579.png';
    // Get metadata to know dimensions
    const metadata = await sharp(input).metadata();
    
    // We want to zoom in (crop the edges) to make the engine larger.
    // Let's crop 15% from all sides.
    const cropX = Math.floor(metadata.width * 0.15);
    const cropY = Math.floor(metadata.height * 0.15);
    const newWidth = metadata.width - (cropX * 2);
    const newHeight = metadata.height - (cropY * 2);

    await sharp(input)
      .extract({ left: cropX, top: cropY, width: newWidth, height: newHeight })
      .resize(1024, 1024)
      .toFile('large_icon.png');
      
    console.log('Successfully created large_icon.png');
  } catch(e) {
    console.error(e);
  }
}
run();
