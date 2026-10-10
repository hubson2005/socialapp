// Usage : node apply-nfc.mjs [chemin/vers/Home.jsx]
// Ajoute la section Carte NFC et remplace l'image du profil digital.
// Crée une sauvegarde Home.jsx.bak et s'arrête sans rien modifier si un repère est introuvable.
import fs from 'node:fs';

const file = process.argv[2] || 'src/pages/Home.jsx';
let s = fs.readFileSync(file, 'utf8');

if (s.includes('id="nfc"')) { console.log('La section NFC existe déjà : rien à faire.'); process.exit(0); }

const edits = [];
const add = (name, find, replace) => edits.push({ name, find, replace });

// 1) imports
add('import image profil',
  "import profilMockup from '../assets/INTERFACE_SOCIALAPP.png';",
  "import carteVisiteWebp from '../assets/CARTE_VISITE_DIGITALE.webp';\n" +
  "import carteVisitePng from '../assets/CARTE_VISITE_DIGITALE.png';\n" +
  "import carteNfcWebp from '../assets/CARTE_NFC_SOCIALAPP.webp';\n" +
  "import carteNfcPng from '../assets/CARTE_NFC_SOCIALAPP.png';");

// 2) lien WhatsApp
add('constante NFC_WA',
  'const NAV_LINKS = [',
  "const NFC_WA = 'https://wa.me/2250576031212?text=' + encodeURIComponent('Bonjour, je souhaite commander ma carte NFC SocialApp.');\n\nconst NAV_LINKS = [");

// 3) image de la section Profil digital
add('image profil digital',
  `<div style={{display:"flex",justifyContent:"center",alignItems:"center"}}><img src={profilMockup} alt="Profil digital SocialApp" loading="lazy" className="sa-float" style={{ width: '80%', maxWidth: '480px', objectFit: 'contain', filter: 'drop-shadow(0 40px 80px rgba(255,107,53,.25))' }} /></div>`,
  `<div style={{display:"flex",justifyContent:"center",alignItems:"center"}}><picture><source srcSet={carteVisiteWebp} type="image/webp" /><img src={carteVisitePng} alt="Carte de visite digitale SocialApp sur smartphone" width="700" height="1050" loading="lazy" decoding="async" className="sa-float" style={{ width: '100%', maxWidth: '340px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 40px 80px rgba(255,107,53,.25))' }} /></picture></div>`);

// 4) nouvelle section NFC avant la section #f
const nfc = `<section className="sa-sec" id="nfc" style={{ paddingTop: '20px' }}>
<div className="sa-w sa-two">
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
<picture><source srcSet={carteNfcWebp} type="image/webp" /><img src={carteNfcPng} alt="Carte NFC SocialApp avec logo et QR code" width="800" height="800" loading="lazy" decoding="async" className="sa-float" style={{ width: '100%', maxWidth: '520px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 40px 70px rgba(29,26,43,.28))' }} /></picture>
</div>
<div>
<div className="sa-badge" style={{ background: 'rgba(29,26,43,.08)', border: '1px solid rgba(29,26,43,.18)', color: '#2b2740' }}><span className="sa-dot" />Carte NFC</div>
<h2>Une carte physique qui ouvre<br /><span className="sa-gt">votre profil d'un geste</span></h2>
<p className="sa-sub" style={{ marginBottom: '28px' }}>La carte NFC SocialApp reprend votre logo et votre QR code. Votre client l'approche de son téléphone et votre profil s'ouvre aussitôt, sans application à installer sur la plupart des smartphones récents. Si son téléphone ne lit pas le NFC, il scanne le QR code imprimé sur la carte.</p>
<div className="sa-it"><div className="sa-ic" style={{ background: 'rgba(99,102,241,.12)' }}><Ic n="users" /></div><div><b>Se présenter en rendez-vous</b><span>Vous remettez la carte au lieu d'un numéro à noter. Le contact obtient d'un coup vos réseaux, votre WhatsApp, votre boutique et vos coordonnées.</span></div></div>
<div className="sa-it"><div className="sa-ic" style={{ background: 'rgba(255,107,53,.12)' }}><Ic n="sliders" /></div><div><b>Rester à jour sans réimprimer</b><span>Vous changez un lien, un numéro ou un produit depuis votre dashboard. La carte déjà distribuée affiche toujours la version à jour.</span></div></div>
<div className="sa-it"><div className="sa-ic" style={{ background: 'rgba(245,158,11,.16)' }}><Ic n="bag" /></div><div><b>Vendre au comptoir ou en salon</b><span>Posée sur votre stand ou votre vitrine, elle permet au client de découvrir vos produits et de vous commander sur WhatsApp en quelques secondes.</span></div></div>
<div className="sa-it"><div className="sa-ic" style={{ background: 'rgba(34,197,94,.12)' }}><Ic n="chart" /></div><div><b>Capter des prospects</b><span>Chaque visite de votre profil est comptée dans vos statistiques. Avec l'offre BUSINESS, les contacts collectés arrivent dans votre CRM.</span></div></div>
<span className="sa-pl" style={{ background: 'rgba(255,107,53,.12)', color: '#c2410c', maxWidth: '100%' }}>Carte NFC incluse dans les offres PRO et BUSINESS</span>
<p style={{ fontSize: '13px', color: '#5d5a6e', margin: '14px 0 22px', lineHeight: 1.7 }}>Après votre souscription, notre équipe vous contacte sur WhatsApp pour personnaliser votre carte. Vous la recevez sous 7 jours.</p>
<a className="sa-btn sa-l" href={NFC_WA} target="_blank" rel="noopener noreferrer">Obtenir ma carte NFC →</a>
</div>
</div>
</section>
`;
add('section NFC',
  '<section className="sa-sec" id="f" style={{paddingTop:"20px"}}>',
  nfc + '<section className="sa-sec" id="f" style={{paddingTop:"20px"}}>');

// vérification : chaque repère doit exister exactement une fois
for (const e of edits) {
  const n = s.split(e.find).length - 1;
  if (n !== 1) {
    console.error(`Repère « ${e.name} » trouvé ${n} fois (attendu : 1). Aucun changement n'a été fait.`);
    process.exit(1);
  }
}
fs.writeFileSync(file + '.bak', s);
for (const e of edits) s = s.replace(e.find, () => e.replace);
fs.writeFileSync(file, s);
console.log(`OK : ${edits.length} modifications appliquées à ${file} (sauvegarde : ${file}.bak)`);
