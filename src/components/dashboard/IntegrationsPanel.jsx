// ─── Carte intégration — VERSION CORRIGÉE ────────────────────────────────────
//
// BUGS CORRIGÉS :
//  [P1] console.log debug supprimé (fuitait des infos à chaque re-render en prod)
//  [P2] onClick retiré du DIV wrapper externe — était en double avec le div enfant
//       → causait un double-toggle (false→true→false = aucun changement visible)
//  [P3] e.stopPropagation() ajouté sur bouton "Déconnecter"
//       → sans ça, cliquer Déconnecter déclenchait aussi le toggle du panneau
//  [P4] e.stopPropagation() ajouté sur bouton Chevron
//       → sans ça, le clic remontait au div parent et annulait le toggle

function IntegrationCard({ integration, config, onSave, onDisconnect }) {
  const [expanded, setExpanded] = useState(false); // [P1] console.log supprimé
  const [fields, setFields] = useState(config?.fields || {});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState({});

  const isConnected = !!config?.connected;
  const webhookUrl = config?.webhook_url || generateWebhookUrl('preview', integration.id);
  const { LogoComponent } = integration;
  const hasContent = integration.hasWebhook || integration.fields.length > 0;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copié !');
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(integration.id, { fields, connected: true });
      setExpanded(false);
      toast.success(`${integration.name} connecté !`);
    } catch { } finally { setSaving(false); }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Déconnecter ${integration.name} ?`)) return;
    try {
      await onDisconnect(integration.id);
      setFields({});
      setExpanded(false);
      toast.success(`${integration.name} déconnecté`);
    } catch { }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      minWidth: 0,
    }}>
      {/* [P2] onClick retiré du wrapper — il était en double avec le div enfant */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', minWidth: 0 }}>

        {/* [P2] Seule source du toggle : ce div enfant logo+texte */}
        <div
          onClick={() => hasContent && setExpanded(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            flex: 1, minWidth: 0,
            cursor: hasContent ? 'pointer' : 'default',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: integration.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${integration.color}33`,
            pointerEvents: 'none',
          }}>
            <LogoComponent />
          </div>
          <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {integration.name}
              </span>
              {isConnected && (
                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', letterSpacing: '0.05em', flexShrink: 0 }}>
                  ✓ CONNECTÉ
                </span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {integration.desc}
            </p>
          </div>
        </div>

        {/* Boutons — frères du div logo+texte, pas enfants */}
        {isConnected && (
          <button
            // [P3] stopPropagation : empêche le clic de remonter au div logo+texte
            onClick={e => { e.stopPropagation(); handleDisconnect(); }}
            style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={11} />
          </button>
        )}
        {hasContent && (
          <button
            // [P4] stopPropagation : empêche le clic de remonter au div logo+texte
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
      </div>

      {expanded && hasContent && (
        <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {integration.hasWebhook && (
            <div>
              <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Webhook URL
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '8px 12px', minWidth: 0 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {webhookUrl}
                </span>
                <button onClick={() => handleCopy(webhookUrl)} style={{ width: '24px', height: '24px', borderRadius: '6px', background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {copied ? <Check size={10} color="#22c55e" /> : <Copy size={10} color="rgba(255,255,255,0.5)" />}
                </button>
              </div>
            </div>
          )}

          {integration.fields.map(f => (
            <div key={f.key}>
              <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                {f.label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={f.type === 'password' && !showSecret[f.key] ? 'password' : 'text'}
                  value={fields[f.key] || ''}
                  onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', padding: f.type === 'password' ? '8px 36px 8px 12px' : '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '12px', outline: 'none', fontFamily: f.type === 'password' ? 'inherit' : 'monospace' }}
                />
                {f.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowSecret(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}
                  >
                    {showSecret[f.key] ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, padding: '9px', background: `linear-gradient(135deg, ${integration.color}, ${integration.color}aa)`, border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <Loader2 size={11} /> : <Check size={11} />}
              {isConnected ? 'Mettre à jour' : 'Connecter'}
            </button>
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}