const fs = require('fs');

// MetaIntegrationPanel.jsx ligne 232
let f1 = 'src/components/dashboard/MetaIntegrationPanel.jsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace('}]).select().single();', '}]).select().maybeSingle();');
fs.writeFileSync(f1, c1, 'utf8');
console.log('OK: ' + f1);

// useWhatsappCRM.js lignes 96, 164, 177
let f2 = 'src/hooks/useWhatsappCRM.js';
let c2 = fs.readFileSync(f2, 'utf8');
const lines = c2.split('\n');
[95, 163, 176].forEach(idx => {
  if (lines[idx] && lines[idx].includes('.single()')) {
    const before = lines.slice(Math.max(0, idx-10), idx).join('\n');
    if (!/(insert|update)\s*\(/.test(before)) {
      lines[idx] = lines[idx].replace('.single()', '.maybeSingle()');
      console.log('Fixed line ' + (idx+1) + ' in ' + f2);
    }
  }
});
fs.writeFileSync(f2, lines.join('\n'), 'utf8');
console.log('OK: ' + f2);
