const fs = require('fs');

let file = 'src/services/OBD2Service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replaceAll(
  'if (this.dataCallback) {\n      this.dataCallback({...this.currentData});\n    }',
  'this.dataCallbacks.forEach(cb => cb({...this.currentData}));',
);
code = code.replaceAll(
  'if (this.dataCallback) {\n        this.dataCallback({...this.currentData});\n      }',
  'this.dataCallbacks.forEach(cb => cb({...this.currentData}));',
);

fs.writeFileSync(file, code);
console.log('OBD2Service second pass refactored!');
