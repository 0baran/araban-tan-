const fs = require('fs');
let file = fs.readFileSync('src/screens/LiveDataScreen.tsx', 'utf8');

const injection = `];

OEM_SENSORS.forEach(sensor => {
  PARAM_META.push({
    key: sensor.id as any,
    label: sensor.name,
    unit: sensor.unit,
    color: sensor.color || '#ffffff',
    category: sensor.category || 'diğer'
  });
});
`;

file = file.replace(/  \},\n\];/, '  },\n' + injection);
fs.writeFileSync('src/screens/LiveDataScreen.tsx', file, 'utf8');
console.log('PARAM_META updated!');
