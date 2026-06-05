const Jimp = require('jimp');
new Jimp(1024, 1024, '#3498db', async (err, image) => {
  if (err) {
    throw err;
  }
  await image.writeAsync('blank.png');
  console.log('Created blank.png');
});
