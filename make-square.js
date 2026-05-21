const Jimp = require('jimp');

async function makeSquare() {
  try {
    const image = await Jimp.read('logo.png');
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    if (width === height) {
      console.log('Already square');
      await image.writeAsync('logo-square.png');
      return;
    }
    
    const size = Math.max(width, height);
    
    new Jimp(size, size, 0x00000000, async (err, bg) => {
      if (err) throw err;
      const x = (size - width) / 2;
      const y = (size - height) / 2;
      bg.composite(image, x, y);
      await bg.writeAsync('logo-square.png');
      console.log('Made square: ' + size + 'x' + size);
    });
  } catch(e) {
    console.error(e);
  }
}

makeSquare();
