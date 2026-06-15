const fs = require('fs');
const targets = [
  'src/components/dashboard/BoostPanel.jsx',
  'src/components/dashboard/MetaIntegrationPanel.jsx',
  'src/hooks/useWhatsappCRM.js',
  'src/pages/PublicProfile.jsx',
];
targets.forEach(f => {
  if (!fs.existsSync(f)) return console.log('SKIP: ' + f);
  let c = fs.readFileSync(f, 'utf8');
  // Cas multilignes : .single() seul sur sa ligne apres un select
  c = c.replace(/\.single\(\)/g, function(match, offset) {
    // Verifie si preceded par insert ou update dans les 200 chars avant
    const before = c.substring(Math.max(0, offset - 200), offset);
    if (/\.(insert|update)\s*\(/.test(before)) return match;
    return '.maybeSingle()';
  });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK: ' + f);
});
