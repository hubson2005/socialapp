const fs = require('fs');
const files = [
  'src/hooks/useWhatsappCRM.js',
  'src/pages/Dashboard.jsx',
  'src/pages/PublicProfile.jsx',
  'src/pages/UserDashboard.jsx',
  'src/components/dashboard/LeadsCRMPanel.jsx',
];
files.forEach(f => {
  if (!fs.existsSync(f)) return console.log('SKIP: ' + f);
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\.select\(([^)]*)\)\.single\(\)/g, '.select($1).maybeSingle()');
  c = c.replace(/\.select\(\)\.single\(\)/g, '.select().maybeSingle()');
  c = c.replace(/\.limit\(1\)\.single\(\)/g, '.limit(1).maybeSingle()');
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK: ' + f);
});
