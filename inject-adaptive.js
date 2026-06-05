const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function generate() {
  try {
    const image = await Jimp.read('logo.png'); // use original logo

    // Adaptive icon foregrounds need to be larger (108x108 mdpi) with the center 72x72 being the safe zone.
    // So we pad it with black to the correct adaptive size.

    for (const [folder, size] of Object.entries(SIZES)) {
      const dir = path.join('android', 'app', 'src', 'main', 'res', folder);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
      }

      // Calculate safe zone (which is ~66% of the total size)
      const safeSize = Math.floor(size * 0.66);

      // Resize original image to fit safe zone
      const resized = image.clone().scaleToFit(safeSize, safeSize);

      // Create a solid black background of the full size
      new Jimp(size, size, 0x000000ff, async (err, bg) => {
        if (err) {
          throw err;
        }

        // Center the resized logo on the black background
        const x = (size - resized.bitmap.width) / 2;
        const y = (size - resized.bitmap.height) / 2;
        bg.composite(resized, x, y);

        const p1 = path.join(dir, 'ic_launcher_foreground.png');
        await bg.writeAsync(p1);
        console.log(`Written foreground ${size}x${size} to ${folder}`);
      });
    }

    // Write colors.xml
    const valuesDir = path.join(
      'android',
      'app',
      'src',
      'main',
      'res',
      'values',
    );
    if (!fs.existsSync(valuesDir)) {
      fs.mkdirSync(valuesDir, {recursive: true});
    }
    const colorsXml =
      '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#000000</color>\n</resources>';
    fs.writeFileSync(path.join(valuesDir, 'colors.xml'), colorsXml);

    // Write adaptive icon xmls
    const v26Dir = path.join(
      'android',
      'app',
      'src',
      'main',
      'res',
      'mipmap-anydpi-v26',
    );
    if (!fs.existsSync(v26Dir)) {
      fs.mkdirSync(v26Dir, {recursive: true});
    }

    const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:color="@color/ic_launcher_background"/>
    <foreground android:mipmap="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    fs.writeFileSync(path.join(v26Dir, 'ic_launcher.xml'), adaptiveXml);
    fs.writeFileSync(path.join(v26Dir, 'ic_launcher_round.xml'), adaptiveXml);

    console.log('Adaptive icons setup complete.');
  } catch (e) {
    console.error(e);
  }
}

generate();
