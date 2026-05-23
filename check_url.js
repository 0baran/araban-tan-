const https = require('https');

https.request('https://raw.githubusercontent.com/0baran/araban-tan-/main/ArabaniTani-v3.1.16.apk', { method: 'HEAD' }, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
}).end();
