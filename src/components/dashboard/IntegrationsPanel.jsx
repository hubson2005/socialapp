import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Zap, Globe, Link2, Copy, Check, ExternalLink,
  Loader2, RefreshCw, X, ChevronDown, ChevronRight, Settings,
  BarChart3, ShoppingBag, Bell, Mail, MessageSquare, Database,
  Plus, Trash2, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';

// ─── Intégrations disponibles ─────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    id: 'zapier',
    name: 'Zapier',
    desc: 'Automatisez plus de 6 000 apps sans coder',
    category: 'Automatisation',
    color: '#ff4f00',
    bg: 'rgba(255,79,0,0.12)',
    icon: '⚡',
    docsUrl: 'https://zapier.com',
    hasWebhook: true,
    fields: [],
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    desc: 'Créez des scénarios automatisation visuels',
    category: 'Automatisation',
    color: '#6c5ce7',
    bg: 'rgba(108,92,231,0.12)',
    icon: '🔮',
    docsUrl: 'https://make.com',
    hasWebhook: true,
    fields: [],
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    desc: 'Suivez vos visiteurs et conversions en détail',
    category: 'Analytics',
    color: '#e37400',
    bg: 'rgba(227,116,0,0.12)',
    icon: '📊',
    docsUrl: 'https://analytics.google.com',
    hasWebhook: false,
    fields: [{ key: 'measurement_id', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX', type: 'text' }],
  },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel',
    desc: 'Trackez les conversions Facebook & Instagram',
    category: 'Analytics',
    color: '#0082fb',
    bg: 'rgba(0,130,251,0.12)',
    icon: '🎯',
    docsUrl: 'https://business.facebook.com',
    hasWebhook: false,
    fields: [{ key: 'pixel_id', label: 'Pixel ID', placeholder: '123456789012345', type: 'text' }],
  },
  {
    id: 'notion',
    name: 'Notion',
    desc: 'Synchronisez vos leads dans votre workspace',
    category: 'CRM',
    color: '#03530e',
    bg: 'rgba(255,255,255,0.08)',
    icon: '📝',
    docsUrl: 'https://notion.so',
    hasWebhook: true,
    fields: [{ key: 'database_id', label: 'Database ID', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'text' }],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    desc: 'Exportez automatiquement vos contacts',
    category: 'CRM',
    color: '#18bfff',
    bg: 'rgba(24,191,255,0.12)',
    icon: '🗃️',
    docsUrl: 'https://airtable.com',
    hasWebhook: true,
    fields: [
      { key: 'base_id', label: 'Base ID', placeholder: 'appXXXXXXXXXXXXXX', type: 'text' },
      { key: 'table_name', label: 'Table', placeholder: 'Leads', type: 'text' },
    ],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    desc: 'Ajoutez vos contacts à vos listes email',
    category: 'Email',
    color: '#a79106',
    bg: 'rgba(255,224,27,0.10)',
    icon: '🐵',
    docsUrl: 'https://mailchimp.com',
    hasWebhook: false,
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1', type: 'password' },
      { key: 'list_id', label: 'Audience ID', placeholder: 'xxxxxxxxxx', type: 'text' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Recevez des notifications en temps réel',
    category: 'Notifications',
    color: '#4a154b',
    bg: 'rgba(74,21,75,0.15)',
    icon: '💬',
    docsUrl: 'https://slack.com',
    hasWebhook: true,
    fields: [{ key: 'webhook_url', label: 'Webhook URL Slack', placeholder: 'https://hooks.slack.com/services/...', type: 'text' }],
  },
];

const CATEGORIES = ['Tous', 'Automatisation', 'Analytics', 'CRM', 'Email', 'Notifications'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateWebhookUrl(profileId, integrationId) {
  return `https://api.socialapp.work/webhooks/${profileId}/${integrationId}`;
}

// ─── Composant Carte Intégration ──────────────────────────────────────────────
function IntegrationCard({ integration, config, onSave, onDisconnect }) {
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState(config?.fields || {});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState({});

  const isConnected = !!config?.connected;
  const webhookUrl = config?.webhook_url || '';

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copié !');
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(integration.id, { fields, connected: true });
    setSaving(false);
    setExpanded(false);
    toast.success(`${integration.name} connecté !`);
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Déconnecter ${integration.name} ?`)) return;
    await onDisconnect(integration.id);
    setFields({});
    toast.success(`${integration.name} déconnecté`);
  };

  return (
    <motion.div
      layout
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '18px',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', cursor: 'pointer' }}
      >
        {/* Icon */}
        <div style={{
          width: '46px', height: '46px', borderRadius: '13px',
          background: integration.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '22px', flexShrink: 0,
          border: `1px solid ${integration.color}33`,
        }}>
          {integration.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>{integration.name}</span>
            {isConnected && (
              <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', letterSpacing: '0.05em' }}>
                ✓ CONNECTÉ
              </span>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {integration.desc}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {isConnected && (
            <button onClick={handleDisconnect}
              style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Webhook URL (si applicable) */}
              {integration.hasWebhook && (
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Webhook URL
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '9px 12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {webhookUrl}
                    </span>
                    <button onClick={() => handleCopy(webhookUrl)}
                      style={{ width: '26px', height: '26px', borderRadius: '7px', background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {copied ? <Check size={11} color="#22c55e" /> : <Copy size={11} color="rgba(255,255,255,0.5)" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Champs de configuration */}
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
                      style={{ width: '100%', boxSizing: 'border-box', padding: f.type === 'password' ? '9px 38px 9px 12px' : '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '12px', outline: 'none', fontFamily: f.type === 'password' ? 'inherit' : 'monospace' }}
                    />
                    {f.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowSecret(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}
                      >
                        {showSecret[f.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Boutons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: '9px', background: `linear-gradient(135deg, ${integration.color}, ${integration.color}aa)`, border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {isConnected ? 'Mettre à jour' : 'Connecter'}
                </button>
                <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Panel principal ───────────────────────────────────────────────────────────
export default function IntegrationsPanel({ profileId }) {
  const [configs, setConfigs] = useState({});   // { integrationId: { connected, fields, webhook_url } }
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Tous');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Chargement ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profileId) return;
    loadConfigs();
  }, [profileId]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_integrations')
        .select('*')
        .eq('profile_id', profileId);

      if (error) {
        // Table inexistante → utiliser localStorage comme fallback
        const stored = localStorage.getItem(`integrations_${profileId}`);
        if (stored) setConfigs(JSON.parse(stored));
      } else {
        const map = {};
        (data || []).forEach(row => {
          map[row.integration_id] = {
            connected: row.is_connected,
            fields: row.config || {},
            webhook_url: generateWebhookUrl(profileId, row.integration_id),
          };
        });
        setConfigs(map);
      }
    } catch {
      const stored = localStorage.getItem(`integrations_${profileId}`);
      if (stored) setConfigs(JSON.parse(stored));
    }
    setLoading(false);
  };

  // ── Sauvegarde ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (integrationId, data) => {
    const newConfig = {
      ...data,
      webhook_url: generateWebhookUrl(profileId, integrationId),
    };

    // Optimistic update
    setConfigs(prev => ({ ...prev, [integrationId]: newConfig }));

    // localStorage fallback
    const updated = { ...configs, [integrationId]: newConfig };
    localStorage.setItem(`integrations_${profileId}`, JSON.stringify(updated));

    // Supabase
    try {
      await supabase.from('profile_integrations').upsert({
        profile_id: profileId,
        integration_id: integrationId,
        is_connected: data.connected,
        config: data.fields || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,integration_id' });
    } catch {
      // silently ignore if table doesn't exist
    }
  }, [profileId, configs]);

  // ── Déconnexion ──────────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(async (integrationId) => {
    setConfigs(prev => {
      const next = { ...prev };
      delete next[integrationId];
      return next;
    });

    const updated = { ...configs };
    delete updated[integrationId];
    localStorage.setItem(`integrations_${profileId}`, JSON.stringify(updated));

    try {
      await supabase.from('profile_integrations')
        .update({ is_connected: false, config: {} })
        .eq('profile_id', profileId)
        .eq('integration_id', integrationId);
    } catch { /* silently ignore */ }
  }, [profileId, configs]);

  // ── Filtrage ─────────────────────────────────────────────────────────────────
  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = category === 'Tous' || i.category === category;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const connectedCount = Object.values(configs).filter(c => c?.connected).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Intégrations</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            {connectedCount} intégration{connectedCount !== 1 ? 's' : ''} active{connectedCount !== 1 ? 's' : ''} · {INTEGRATIONS.length} disponibles
          </p>
        </div>
        <button onClick={loadConfigs}
          style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <RefreshCw size={13} color="rgba(255,255,255,0.5)" />
        </button>
      </div>

      {/* ── Stats rapides ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[
          { label: 'Connectées',    value: connectedCount,                icon: Check,      color: '#22c55e' },
          { label: 'Disponibles',   value: INTEGRATIONS.length,           icon: Sparkles,   color: '#6366f1' },
          { label: 'Automatisations', value: INTEGRATIONS.filter(i => i.category === 'Automatisation' && configs[i.id]?.connected).length, icon: Zap, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={12} color={s.color} />
              </div>
            </div>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Webhook global info ── */}
      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Link2 size={16} color="#a78bfa" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontSize: '12px', fontWeight: 700, margin: 0 }}>Webhook universel</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
            {generateWebhookUrl(profileId, '{integration}')}
          </p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(generateWebhookUrl(profileId, 'universal')); toast.success('URL copiée !'); }}
          style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Copy size={13} color="rgba(255,255,255,0.5)" />
        </button>
      </div>

      {/* ── Filtres + Recherche ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Barre de recherche */}
        <div style={{ position: 'relative' }}>
          <Sparkles size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une intégration…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 34px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px', outline: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Catégories */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '5px 12px', borderRadius: '20px', border: '1px solid',
                borderColor: category === cat ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)',
                background: category === cat ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                color: category === cat ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                fontSize: '11px', fontWeight: category === cat ? 700 : 400, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat}
              {cat !== 'Tous' && (
                <span style={{ marginLeft: '5px', opacity: 0.6 }}>
                  {INTEGRATIONS.filter(i => i.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Liste des intégrations ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 size={24} color="rgba(99,102,241,0.6)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
          <Sparkles size={24} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>Aucune intégration trouvée</p>
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', margin: '4px 0 0' }}>Essayez un autre filtre ou terme de recherche</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Connectées en tête */}
          {filtered.some(i => configs[i.id]?.connected) && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 2px 4px' }}>
              Actives
            </p>
          )}
          {filtered.filter(i => configs[i.id]?.connected).map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              config={configs[integration.id]}
              onSave={handleSave}
              onDisconnect={handleDisconnect}
            />
          ))}

          {filtered.some(i => !configs[i.id]?.connected) && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '8px 0 2px 4px' }}>
              Disponibles
            </p>
          )}
          {filtered.filter(i => !configs[i.id]?.connected).map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              config={configs[integration.id]}
              onSave={handleSave}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}