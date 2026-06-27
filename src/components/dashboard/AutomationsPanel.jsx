// AutomationsPanel.jsx — intégré au Dashboard SocialApp
//
//  [M1] Import depuis ../../lib/constants (source unique de vérité)
//  [M2] TRIGGERS/ACTIONS locaux supprimés → TRIGGER_OPTIONS / ACTION_OPTIONS
//  [M3] IMPLEMENTED_ACTIONS utilise les clés moteur
//  [M4] TEMPLATE_PRESETS utilise le format multi-actions
//  [M5] ActionConfigFields dynamique depuis ACTION_CONFIG_FIELDS
//  [M6] handleCreate / handleSave : actions enregistrées en [{type, config}]
//  [M7] openEdit : reconstruit actions[] depuis actions[] ou action legacy
//  [M8] Badges et flow reconstruits depuis TRIGGER_LABELS / ACTION_LABELS
//  [M9] MULTI-ACTIONS : form.actions[] remplace form.action + form.config

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";
import {
  TRIGGER_OPTIONS,
  TRIGGER_LABELS,
  ACTION_OPTIONS,
  ACTION_LABELS,
  ACTION_CONFIG_FIELDS,
} from "../../lib/constants";

/* ─── CSS ────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.ap-root{ color:#f0f0f0; font-family:'DM Sans',sans-serif; font-size:13.5px; }

:root{
  --bg:#111215; --card:#1a1c21; --card2:#1f2128;
  --border:rgba(255,255,255,0.07); --hover:#22252c; --hover2:#2a2d35;
  --orange:#f5841f; --orangeD:rgba(245,132,31,0.12);
  --green:#22d07a;  --greenD:rgba(34,208,122,0.1);
  --blue:#4d9cf8;   --blueD:rgba(77,156,248,0.1);
  --purple:#a78bfa; --purpleD:rgba(167,139,250,0.1);
  --red:#f45b5b; --yellow:#fbbf24;
  --t1:#f0f0f0; --t2:#9fa3b0; --t3:#5c6070;
}
*{ box-sizing:border-box; }

.ap-hdr{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:12px; }
.ap-title{ font-family:'Syne',sans-serif; font-size:18px; font-weight:700; display:flex; align-items:center; gap:9px; }
.ap-subtitle{ font-size:12px; color:var(--t2); margin-top:3px; }
.hdr-btns{ display:flex; gap:8px; flex-shrink:0; flex-wrap:wrap; }

.ap-btn-primary{
  display:flex; align-items:center; gap:5px;
  background:var(--orange); color:#fff; border:none;
  border-radius:9px; padding:0 13px; height:34px;
  font-size:12.5px; font-weight:600; cursor:pointer;
  font-family:'DM Sans',sans-serif; transition:filter .12s; white-space:nowrap;
}
.ap-btn-primary:hover{ filter:brightness(1.08); }

.ap-btn-sec{
  display:flex; align-items:center; gap:5px;
  background:var(--hover); border:1px solid var(--border);
  border-radius:9px; padding:0 12px; height:34px;
  font-size:12.5px; color:var(--t2); cursor:pointer;
  font-family:'DM Sans',sans-serif; transition:all .12s; white-space:nowrap;
}
.ap-btn-sec:hover{ background:var(--hover2); color:var(--t1); }

.ap-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:18px; }
.ap-stat{
  background:rgba(255,255,255,0.05); border:1px solid var(--border);
  border-radius:12px; padding:11px 10px;
  display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;
}
.ap-stat-ico{ width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.ap-stat-num{ font-family:'Syne',sans-serif; font-size:20px; font-weight:700; line-height:1; }
.ap-stat-lbl{ font-size:10px; color:var(--t2); }

.ap-tabs{
  display:flex; gap:2px; background:rgba(255,255,255,0.05);
  border:1px solid var(--border); border-radius:11px; padding:3px; margin-bottom:16px;
  width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch;
}
.ap-tab{
  flex:1; padding:7px 10px; border-radius:8px; font-size:12px;
  cursor:pointer; font-family:'DM Sans',sans-serif; color:var(--t2);
  transition:all .12s; border:none; background:none; white-space:nowrap; text-align:center;
}
.ap-tab:hover{ color:var(--t1); }
.ap-tab.on{ background:rgba(255,255,255,0.08); color:var(--t1); font-weight:600; }

.ap-toolbar{ display:flex; align-items:center; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
.ap-filter-btn{
  padding:5px 11px; border-radius:7px; font-size:12px; cursor:pointer;
  border:1px solid var(--border); background:var(--hover); color:var(--t2);
  font-family:'DM Sans',sans-serif; transition:all .12s;
}
.ap-filter-btn:hover{ background:var(--hover2); color:var(--t1); }
.ap-filter-btn.on{ background:var(--orangeD); border-color:rgba(245,132,31,.3); color:var(--orange); font-weight:600; }
.ap-search{
  background:var(--hover); border:1px solid var(--border);
  border-radius:9px; display:flex; align-items:center;
  gap:7px; padding:0 11px; height:34px; width:100%; margin-top:4px;
}
.ap-search input{ background:none; border:none; outline:none; color:var(--t1); font-size:13px; flex:1; min-width:0; font-family:'DM Sans',sans-serif; }
.ap-search input::placeholder{ color:var(--t3); }

.auto-list{ display:flex; flex-direction:column; gap:10px; }
.auto-card{
  background:rgba(255,255,255,0.04); border:1px solid var(--border);
  border-radius:14px; padding:14px; display:flex;
  align-items:flex-start; gap:12px;
  transition:border-color .15s,background .15s; cursor:pointer;
}
.auto-card:hover{ border-color:rgba(255,255,255,.13); background:rgba(255,255,255,0.06); }
.auto-card.active-card{ border-color:rgba(245,132,31,.25); }
.auto-ico{ width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.auto-body{ flex:1; min-width:0; }
.auto-name{ font-size:13.5px; font-weight:600; display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
.auto-desc{ font-size:12px; color:var(--t2); margin-top:4px; line-height:1.5; }
.auto-meta{ display:flex; align-items:center; gap:6px; margin-top:8px; flex-wrap:wrap; }
.auto-badge{ font-size:10px; font-weight:600; padding:2px 7px; border-radius:20px; }
.ab-trigger{ background:var(--blueD); color:var(--blue); }
.ab-action{ background:var(--orangeD); color:var(--orange); }
.ab-freq{ background:rgba(167,139,250,.1); color:var(--purple); }
.ab-count{ background:rgba(77,156,248,.1); color:var(--blue); }
.auto-stat{ font-size:10.5px; color:var(--t3); display:flex; align-items:center; gap:3px; }
.auto-right{ display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; }
.ap-tog-wrap{ display:flex; align-items:center; gap:6px; font-size:11px; }
.ap-tog-lbl{ color:var(--t2); }
.ap-toggle{ position:relative; width:34px; height:19px; border-radius:10px; cursor:pointer; border:none; transition:background .2s; flex-shrink:0; }
.ap-toggle.on{ background:var(--green); }
.ap-toggle.off{ background:var(--hover2); }
.ap-toggle::after{ content:''; position:absolute; top:3px; width:13px; height:13px; border-radius:50%; background:#fff; transition:left .2s; }
.ap-toggle.on::after{ left:18px; }
.ap-toggle.off::after{ left:3px; }

.flow{ display:flex; align-items:center; margin-top:9px; flex-wrap:wrap; gap:4px; }
.flow-step{ display:flex; align-items:center; gap:4px; background:rgba(255,255,255,0.06); border:1px solid var(--border); border-radius:7px; padding:4px 8px; font-size:11px; color:var(--t2); }
.flow-arrow{ color:var(--t3); font-size:13px; margin:0 1px; }

.tmpl-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; }
.tmpl-card{
  background:rgba(255,255,255,0.04); border:1px solid var(--border);
  border-radius:13px; padding:14px; cursor:pointer;
  transition:border-color .15s,background .15s;
  position:relative; overflow:hidden;
}
.tmpl-card:hover{ border-color:rgba(245,132,31,.3); background:rgba(255,255,255,0.06); }
.tmpl-card::before{ content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:13px 13px 0 0; }
.tmpl-card.c-orange::before{background:var(--orange)}
.tmpl-card.c-blue::before{background:var(--blue)}
.tmpl-card.c-green::before{background:var(--green)}
.tmpl-card.c-purple::before{background:var(--purple)}
.tmpl-ico{ font-size:22px; margin-bottom:7px; }
.tmpl-name{ font-size:13px; font-weight:600; margin-bottom:4px; color:var(--t1); }
.tmpl-desc{ font-size:11.5px; color:var(--t2); line-height:1.5; margin-bottom:9px; }
.tmpl-tags{ display:flex; gap:5px; flex-wrap:wrap; }
.tmpl-tag{ font-size:10px; font-weight:600; padding:2px 7px; border-radius:20px; background:var(--hover); color:var(--t2); border:1px solid var(--border); }
.tmpl-use{ width:100%; margin-top:9px; background:var(--orangeD); border:1px dashed rgba(245,132,31,.3); border-radius:8px; padding:7px; font-size:12px; color:var(--orange); cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:600; }

.log-list{ display:flex; flex-direction:column; }
.log-row{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid var(--border); background:rgba(255,255,255,0.03); font-size:12px; flex-wrap:wrap; }
.log-row:last-child{ border-bottom:none; }
.log-dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.log-name{ font-weight:500; flex:1; min-width:80px; color:var(--t1); }
.log-trigger{ color:var(--t2); flex:1; min-width:80px; }
.log-status{ font-size:10.5px; font-weight:600; padding:2px 8px; border-radius:20px; }
.ls-ok{ background:var(--greenD); color:var(--green); }
.ls-err{ background:rgba(244,91,91,.12); color:var(--red); }
.ls-skip{ background:rgba(100,100,120,.2); color:var(--t2); }
.log-time{ color:var(--t3); font-size:10.5px; flex-shrink:0; }
.log-reason{ flex-basis:100%; font-size:11px; color:var(--t3); padding-left:17px; margin-top:-2px; }

.ap-modal-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,.65);
  backdrop-filter:blur(5px); z-index:200;
  display:flex; align-items:flex-end; justify-content:center; padding:0;
}
@media(min-width:600px){
  .ap-modal-overlay{ align-items:center; padding:20px; }
  .ap-modal{ border-radius:18px !important; max-height:90vh; }
}
.ap-modal{
  background:#1a1c21; border:1px solid rgba(255,255,255,0.1);
  border-radius:20px 20px 0 0; width:100%; max-width:520px;
  padding:20px 18px 28px; display:flex; flex-direction:column;
  gap:14px; max-height:92vh; overflow-y:auto; -webkit-overflow-scrolling:touch;
}
.ap-modal-title{ font-family:'Syne',sans-serif; font-size:16px; font-weight:700; display:flex; align-items:center; gap:10px; color:var(--t1); }
.ap-modal-close{ margin-left:auto; background:none; border:none; color:var(--t2); font-size:20px; cursor:pointer; }
.ap-field-label{ font-size:12px; font-weight:600; color:var(--t2); margin-bottom:5px; }
.ap-sec-lbl{ font-size:10.5px; font-weight:700; letter-spacing:.7px; text-transform:uppercase; color:var(--t3); margin-bottom:7px; margin-top:2px; }
.ap-field-input,.ap-field-select,.ap-field-textarea{
  width:100%; background:var(--hover); border:1px solid var(--border);
  border-radius:9px; padding:10px 13px; font-size:13px; color:var(--t1);
  outline:none; font-family:'DM Sans',sans-serif;
}
.ap-field-textarea{ resize:vertical; min-height:64px; }
.ap-field-input:focus,.ap-field-select:focus,.ap-field-textarea:focus{ border-color:rgba(245,132,31,.4); }
.ap-field-input::placeholder,.ap-field-textarea::placeholder{ color:var(--t3); }

.ap-config-box{ background:rgba(245,132,31,.05); border:1px solid rgba(245,132,31,.18); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:10px; }
.ap-config-title{ font-size:11px; font-weight:700; color:var(--orange); display:flex; align-items:center; gap:6px; text-transform:uppercase; letter-spacing:.5px; }
.ap-config-note{ font-size:11.5px; color:var(--t2); line-height:1.5; background:rgba(255,255,255,0.04); border:1px dashed var(--border); border-radius:8px; padding:9px 11px; }

/* [M9] Multi-actions */
.ap-action-item{
  background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
  border-radius:11px; padding:12px; display:flex; flex-direction:column; gap:10px; margin-bottom:8px;
}
.ap-action-item-hdr{ display:flex; align-items:center; gap:8px; }
.ap-action-num{ font-size:11px; font-weight:700; color:var(--orange); background:var(--orangeD); border-radius:6px; padding:2px 8px; flex-shrink:0; }
.ap-action-arrow{ font-size:18px; color:var(--t3); text-align:center; margin:-4px 0; }
.ap-action-del{ margin-left:auto; background:none; border:none; color:var(--red); cursor:pointer; font-size:16px; line-height:1; padding:0 4px; }
.ap-add-action{
  width:100%; background:rgba(255,255,255,0.03); border:1px dashed rgba(255,255,255,0.12);
  border-radius:9px; padding:10px; font-size:12.5px; color:var(--t2);
  cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:600;
  display:flex; align-items:center; justify-content:center; gap:6px; transition:all .15s;
}
.ap-add-action:hover{ border-color:rgba(245,132,31,.3); color:var(--orange); background:var(--orangeD); }

.ap-modal-footer{ display:flex; gap:8px; justify-content:flex-end; padding-top:4px; border-top:1px solid var(--border); flex-wrap:wrap; }
.ap-loading{ padding:60px 20px; text-align:center; color:var(--t2); }
`;

/* ─── Constantes ──────────────────────────────────────────── */

const IMPLEMENTED_ACTIONS = new Set([
  'create_lead', 'create_task', 'send_whatsapp',
  'add_score', 'add_tag', 'notify_owner',
]);

const COMING_SOON_ACTIONS = [
  { value: 'change_status', label: '🔄 Changer statut' },
  { value: 'send_email',    label: '📧 Envoyer un email' },
  { value: 'webhook_call',  label: '🔗 Appeler un webhook' },
];

// [M4] Templates avec format multi-actions
const TEMPLATE_PRESETS = {
  'lead-vip':  {
    name:'Lead VIP', desc:'Tag automatiquement les nouveaux prospects.',
    trigger:'new_lead', freq:'Immédiat',
    actions:[{ type:'add_tag', config:{ tag:'vip' } }],
  },
  'lead-cold': {
    name:'Relance WhatsApp', desc:'Envoie un message de relance aux nouveaux contacts.',
    trigger:'new_lead', freq:'Manuel',
    actions:[{ type:'send_whatsapp', config:{ message:"Bonjour, nous n'avons pas eu de vos nouvelles ! Toujours intéressé(e) ?" } }],
  },
  'whatsapp':  {
    name:'WhatsApp Lead', desc:"Crée un lead et une tâche quand un visiteur clique sur WhatsApp.",
    trigger:'whatsapp_click', freq:'Immédiat',
    actions:[
      { type:'create_lead', config:{ status:'prospect', score:50 } },
      { type:'create_task', config:{ taskTitle:'Rappeler ce contact WhatsApp' } },
    ],
  },
  'qr':        {
    name:'QR Tracking', desc:"Ajoute des points au score lors d'un scan QR.",
    trigger:'qr_scan', freq:'Immédiat',
    actions:[{ type:'add_score', config:{ score:5 } }],
  },
  'score':     {
    name:'Lead Scoring', desc:'Attribution automatique de score aux nouveaux leads.',
    trigger:'new_lead', freq:'Immédiat',
    actions:[
      { type:'create_lead', config:{ status:'prospect' } },
      { type:'add_score',   config:{ score:10 } },
    ],
  },
};

const TEMPLATES = [
  { id:'lead-vip',  ico:'🔥', color:'c-orange', tags:['CRM','VIP','Lead']   },
  { id:'lead-cold', ico:'💬', color:'c-purple', tags:['WhatsApp','Relance'] },
  { id:'whatsapp',  ico:'📱', color:'c-green',  tags:['WhatsApp','Lead']    },
  { id:'qr',        ico:'📷', color:'c-blue',   tags:['QR','Analytics']     },
  { id:'score',     ico:'📊', color:'c-orange', tags:['Score','CRM']        },
].map(t => ({ ...t, ...TEMPLATE_PRESETS[t.id] }));

const LEAD_STATUSES = [
  { id:'prospect', label:'Prospect' },
  { id:'chaud',    label:'🔥 Chaud' },
  { id:'client',   label:'✅ Client' },
  { id:'froid',    label:'❄️ Froid' },
  { id:'perdu',    label:'Perdu' },
];

// [M9] Form vide avec actions[]
const EMPTY_FORM = { name:'', desc:'', trigger:'', actions:[], freq:'' };

/* ─── Helpers ────────────────────────────────────────────── */
function formatLastRun(isoDate) {
  if (!isoDate) return 'Jamais';
  const d = new Date(isoDate);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
}

/* ─── [M5] ActionConfigFields ────────────────────────────── */
function ActionConfigFields({ action, config, setConfigField }) {
  if (!action) return null;

  if (!IMPLEMENTED_ACTIONS.has(action)) {
    return (
      <div className="ap-config-box">
        <div className="ap-config-note">
          ⏳ Cette action sera disponible prochainement.
        </div>
      </div>
    );
  }

  const fields = ACTION_CONFIG_FIELDS[action];
  if (!fields?.length) return null;

  return (
    <div className="ap-config-box">
      <div className="ap-config-title">⚙️ Configuration</div>
      {fields.map(field => (
        <div key={field.key}>
          <div className="ap-field-label">{field.label}</div>
          {field.type === 'select' ? (
            <select className="ap-field-select" value={config[field.key] || ''} onChange={setConfigField(field.key)}>
              <option value="">Choisir...</option>
              {field.key === 'status'
                ? LEAD_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)
                : (field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)
              }
            </select>
          ) : field.type === 'textarea' ? (
            <textarea className="ap-field-textarea" placeholder={field.placeholder || ''} value={config[field.key] || ''} onChange={setConfigField(field.key)} />
          ) : (
            <input className="ap-field-input" type={field.type || 'text'} placeholder={field.placeholder || ''} value={config[field.key] ?? ''} onChange={setConfigField(field.key)} />
          )}
        </div>
      ))}
      {action === 'send_whatsapp' && (
        <div className="ap-config-note">
          💡 Nécessite l'intégration WhatsApp Business dans le panneau Intégrations.
        </div>
      )}
    </div>
  );
}

/* ─── [M9] ActionItem ────────────────────────────────────── */
function ActionItem({ actionDef, index, total, onChange, onDelete }) {
  const setConfigField = (key) => (e) =>
    onChange(index, { ...actionDef, config: { ...actionDef.config, [key]: e.target.value } });

  return (
    <div className="ap-action-item">
      <div className="ap-action-item-hdr">
        <span className="ap-action-num">Action {index + 1}</span>
        {total > 1 && (
          <button className="ap-action-del" onClick={() => onDelete(index)} title="Supprimer">✕</button>
        )}
      </div>
      <select
        className="ap-field-select"
        value={actionDef.type || ''}
        onChange={e => onChange(index, { type: e.target.value, config: {} })}
      >
        <option value="">Choisir une action...</option>
        <optgroup label="── Disponibles ──">
          {ACTION_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </optgroup>
        <optgroup label="── Bientôt ──">
          {COMING_SOON_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </optgroup>
      </select>
      <ActionConfigFields action={actionDef.type} config={actionDef.config || {}} setConfigField={setConfigField} />
    </div>
  );
}

/* ─── Composant principal ────────────────────────────────── */
export default function AutomationsPanel({ profileId }) {
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [tab, setTab]                 = useState('automations');
  const [filter, setFilter]           = useState('Tous');
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  const isCreate = modal === 'create';
  const setField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // [M9] Handlers actions
  const addAction    = () => setForm(prev => ({ ...prev, actions: [...prev.actions, { type: '', config: {} }] }));
  const updateAction = (idx, updated) => setForm(prev => ({ ...prev, actions: prev.actions.map((a, i) => i === idx ? updated : a) }));
  const deleteAction = (idx) => setForm(prev => ({ ...prev, actions: prev.actions.filter((_, i) => i !== idx) }));

  useEffect(() => { if (profileId) loadAutomations(); }, [profileId]);
  useEffect(() => { if (tab === 'logs' && profileId) loadLogs(); }, [tab, profileId]);

  const loadAutomations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automations').select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) { console.error('LOAD ERROR:', error); setLoading(false); return; }
    setAutomations((data || []).map(item => ({ ...item, desc: item.description || '' })));
    setLoading(false);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    const { data, error } = await supabase
      .from('automation_logs').select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) setLogs(data || []);
    setLogsLoading(false);
  };

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };

  const useTemplate = (t) => {
    setForm({ name: t.name || '', desc: t.desc || '', trigger: t.trigger || '', actions: t.actions || [], freq: t.freq || '' });
    setModal('create');
  };

  // [M7][M9] Ouvrir l'édition — reconstruit actions[]
  const openEdit = (auto) => {
    let actionsList = [];
    if (Array.isArray(auto.actions) && auto.actions.length > 0) {
      actionsList = auto.actions;
    } else if (auto.action) {
      actionsList = [{ type: auto.action, config: auto.action_config || {} }];
    }
    setForm({ name: auto.name || '', desc: auto.desc || auto.description || '', trigger: auto.trigger || '', actions: actionsList, freq: auto.freq || '' });
    setModal(auto);
  };

  // [M6][M9] Payload moteur
  const buildPayload = () => {
    const cleanActions = form.actions.filter(a => a.type);
    const flow = [
      ['🎯', TRIGGER_LABELS[form.trigger] || form.trigger || 'Déclencheur'],
      ...cleanActions.map(a => ['⚡', ACTION_LABELS[a.type] || a.type]),
      ['✅', 'Exécuté'],
    ];
    return {
      profile_id:    profileId,
      name:          form.name.trim(),
      description:   form.desc.trim(),
      trigger:       form.trigger,
      action:        cleanActions[0]?.type   || '',   // legacy
      action_config: cleanActions[0]?.config || {},   // legacy
      actions:       cleanActions,                     // moteur
      freq:          form.freq || 'Immédiat',
      flow, icon: '⚡', color: 'rgba(245,132,31,.1)',
      updated_at:    new Date().toISOString(),
    };
  };

  const handleCreate = async () => {
    if (!form.name.trim())                      { alert('Le nom est requis'); return; }
    if (!form.trigger)                           { alert('Le déclencheur est requis'); return; }
    if (!form.actions.some(a => a.type))         { alert('Au moins une action est requise'); return; }
    const payload = { ...buildPayload(), active: true, runs: 0 };
    const { data, error } = await supabase.from('automations').insert(payload).select().maybeSingle();
    if (error) { console.error('CREATE ERROR:', error); return; }
    if (data)  setAutomations(prev => [{ ...data, desc: data.description || '' }, ...prev]);
    setModal(null); setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!modal || modal === 'create') return;
    const payload = buildPayload();
    const { data, error } = await supabase.from('automations').update(payload).eq('id', modal.id).select().maybeSingle();
    if (error) { console.error('SAVE ERROR:', error); return; }
    if (data) setAutomations(prev => prev.map(a => a.id === modal.id ? { ...a, ...data, desc: data.description || '' } : a));
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette automation ?')) return;
    const { error } = await supabase.from('automations').delete().eq('id', id);
    if (error) { console.error('DELETE ERROR:', error); return; }
    setAutomations(prev => prev.filter(a => a.id !== id));
    setModal(null);
  };

  const toggleAuto = async (id) => {
    const target = automations.find(a => a.id === id);
    if (!target) return;
    const newStatus = !target.active;
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: newStatus } : a));
    const { error } = await supabase.from('automations').update({ active: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: target.active } : a));
  };

  const filtered = useMemo(() => automations.filter(a => {
    const matchFilter = filter === 'Tous' || (filter === 'Actives' && a.active) || (filter === 'Inactives' && !a.active);
    const triggerLabel = TRIGGER_LABELS[a.trigger] || a.trigger || '';
    const matchSearch  = (a.name || '').toLowerCase().includes(search.toLowerCase())
                      || triggerLabel.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }), [automations, filter, search]);

  const totalRuns  = automations.reduce((sum, a) => sum + (a.runs || 0), 0);
  const totalScore = automations.reduce((sum, a) => sum + (a.score || 0), 0);
  const nbActive   = automations.filter(a => a.active).length;
  const nbInactive = automations.filter(a => !a.active).length;

  const logStatusCls = s => ({ ok:'log-status ls-ok', err:'log-status ls-err', skip:'log-status ls-skip' }[s] || 'log-status ls-skip');
  const logStatusLbl = s => ({ ok:'✓ Succès', err:'✗ Erreur', skip:'⏭ Ignoré' }[s] || s);
  const logDotCol    = s => ({ ok:'#22d07a', err:'#f45b5b', skip:'#5c6070' }[s] || '#5c6070');

  return (
    <>
      <style>{STYLE}</style>
      <div className="ap-root">

        {/* HEADER */}
        <div className="ap-hdr">
          <div>
            <div className="ap-title">⚡ Automatisations</div>
            <div className="ap-subtitle">Automatise tes actions marketing</div>
          </div>
          <div className="hdr-btns">
            <button className="ap-btn-primary" onClick={openCreate}>+ Nouvelle</button>
          </div>
        </div>

        {/* STATS */}
        <div className="ap-stats">
          {[
            { ico:'✅', bg:'rgba(34,208,122,.1)',   num:nbActive,   lbl:'Actives',    col:'#22d07a' },
            { ico:'⏸',  bg:'rgba(100,100,120,.1)', num:nbInactive, lbl:'Inactives',  col:'#9fa3b0' },
            { ico:'🔄', bg:'rgba(77,156,248,.1)',   num:totalRuns,  lbl:'Exécutions', col:'#4d9cf8' },
            { ico:'🏆', bg:'rgba(245,132,31,.1)',   num:totalScore, lbl:'Score CRM',  col:'#f5841f' },
          ].map(s => (
            <div key={s.lbl} className="ap-stat">
              <div className="ap-stat-ico" style={{ background: s.bg }}>{s.ico}</div>
              <div className="ap-stat-num" style={{ color: s.col }}>{s.num}</div>
              <div className="ap-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="ap-tabs">
          {[['automations','⚡ Mes auto.'],['templates','📋 Templates'],['logs','📜 Historique']].map(([id, lbl]) => (
            <button key={id} className={`ap-tab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>

        {/* ── AUTOMATIONS ── */}
        {tab === 'automations' && (
          <>
            <div className="ap-toolbar">
              {['Tous','Actives','Inactives'].map(f => (
                <button key={f} className={`ap-filter-btn${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
              <div className="ap-search">
                <span style={{ fontSize:14, color:'#5c6070' }}>🔍</span>
                <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="ap-loading">Chargement...</div>
            ) : (
              <div className="auto-list">
                {filtered.map(auto => {
                  const triggerLabel = TRIGGER_LABELS[auto.trigger] || auto.trigger || 'Aucun';
                  const actionsList  = Array.isArray(auto.actions) && auto.actions.length > 0
                    ? auto.actions
                    : auto.action ? [{ type: auto.action }] : [];
                  const cardFlow = [
                    ['🎯', triggerLabel],
                    ...actionsList.map(a => ['⚡', ACTION_LABELS[a.type] || a.type || 'Action']),
                    ['✅', 'Exécuté'],
                  ];

                  return (
                    <div key={auto.id} className={`auto-card${auto.active ? ' active-card' : ''}`} onClick={() => openEdit(auto)}>
                      <div className="auto-ico" style={{ background: auto.color }}>{auto.icon}</div>
                      <div className="auto-body">
                        <div className="auto-name">
                          {auto.name}
                          <span style={{ fontSize:10, fontWeight:700, background:auto.active?'rgba(34,208,122,.1)':'rgba(100,100,120,.2)', color:auto.active?'#22d07a':'#5c6070', padding:'2px 7px', borderRadius:20 }}>
                            {auto.active ? 'Actif' : 'Inactif'}
                          </span>
                          {actionsList.length > 1 && (
                            <span className="auto-badge ab-count">{actionsList.length} actions</span>
                          )}
                        </div>
                        <div className="auto-desc">{auto.desc}</div>
                        <div className="flow">
                          {cardFlow.map(([ico, lbl], i) => (
                            <span key={i} style={{ display:'flex', alignItems:'center' }}>
                              <span className="flow-step"><span style={{ fontSize:13 }}>{ico}</span>{lbl}</span>
                              {i < cardFlow.length - 1 && <span className="flow-arrow">→</span>}
                            </span>
                          ))}
                        </div>
                        <div className="auto-meta">
                          <span className="auto-badge ab-trigger">{triggerLabel}</span>
                          {actionsList.slice(0, 2).map((a, i) => (
                            <span key={i} className="auto-badge ab-action">{ACTION_LABELS[a.type] || a.type}</span>
                          ))}
                          {actionsList.length > 2 && <span className="auto-badge ab-action">+{actionsList.length - 2}</span>}
                          {auto.freq && <span className="auto-badge ab-freq">🔄 {auto.freq}</span>}
                          <span className="auto-stat">🔄 {auto.runs || 0} exéc.</span>
                          <span className="auto-stat">⏱ {formatLastRun(auto.last_run)}</span>
                        </div>
                      </div>
                      <div className="auto-right" onClick={e => e.stopPropagation()}>
                        <div className="ap-tog-wrap">
                          <span className="ap-tog-lbl">{auto.active ? 'ON' : 'OFF'}</span>
                          <button className={`ap-toggle ${auto.active ? 'on' : 'off'}`} onClick={() => toggleAuto(auto.id)} />
                        </div>
                        <button className="ap-btn-sec" style={{ fontSize:11, height:28, padding:'0 9px' }} onClick={e => { e.stopPropagation(); openEdit(auto); }}>✏ Modifier</button>
                      </div>
                    </div>
                  );
                })}
                {!filtered.length && (
                  <div style={{ textAlign:'center', padding:'50px 0', color:'#5c6070', fontSize:13 }}>Aucune automation trouvée</div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── TEMPLATES ── */}
        {tab === 'templates' && (
          <>
            <p style={{ fontSize:13, color:'#9fa3b0', marginBottom:14 }}>Démarre rapidement avec un template prêt à l'emploi.</p>
            <div className="tmpl-grid">
              {TEMPLATES.map(t => (
                <div key={t.id} className={`tmpl-card ${t.color}`}>
                  <div className="tmpl-ico">{t.ico}</div>
                  <div className="tmpl-name">{t.name}</div>
                  <div className="tmpl-desc">{t.desc}</div>
                  <div className="tmpl-tags">{t.tags.map(tag => <span key={tag} className="tmpl-tag">{tag}</span>)}</div>
                  <button className="tmpl-use" onClick={() => useTemplate(t)}>Utiliser ce template →</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── LOGS ── */}
        {tab === 'logs' && (
          <>
            <p style={{ fontSize:13, color:'#9fa3b0', marginBottom:14 }}>Historique des dernières exécutions.</p>
            {logsLoading ? (
              <div className="ap-loading">Chargement des logs...</div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#5c6070', fontSize:13 }}>Aucune exécution enregistrée pour le moment.</div>
            ) : (
              <div className="log-list">
                {logs.map(log => (
                  <div key={log.id} className="log-row">
                    <div className="log-dot" style={{ background: logDotCol(log.status) }} />
                    <span className="log-name">{log.automation_name}</span>
                    <span className="log-trigger">{log.trigger_label || '—'}</span>
                    <span className={logStatusCls(log.status)}>{logStatusLbl(log.status)}</span>
                    <span className="log-time">{formatLastRun(log.created_at)}</span>
                    {log.error_message && (
                      <span className="log-reason">{log.status === 'err' ? '✗' : 'ℹ'} {log.error_message}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MODAL ── */}
        {modal && (
          <div className="ap-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="ap-modal">
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'-4px' }}>
                <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
              </div>
              <div className="ap-modal-title">
                <span style={{ fontSize:20 }}>{isCreate ? '⚡' : (modal.icon || '⚡')}</span>
                {isCreate ? 'Nouvelle automation' : `Modifier : ${modal.name}`}
                <button className="ap-modal-close" onClick={() => setModal(null)}>✕</button>
              </div>

              {/* Nom */}
              <div>
                <div className="ap-field-label">Nom de l'automation</div>
                <input className="ap-field-input" type="text" placeholder="Ex: WhatsApp Lead" value={form.name} onChange={setField('name')} />
              </div>

              {/* Description */}
              <div>
                <div className="ap-field-label">Description</div>
                <input className="ap-field-input" type="text" placeholder="Décris ce que fait cette automation..." value={form.desc} onChange={setField('desc')} />
              </div>

              {/* Déclencheur */}
              <div>
                <div className="ap-sec-lbl">Déclencheur</div>
                <select className="ap-field-select" value={form.trigger} onChange={setField('trigger')}>
                  <option value="">Choisir un déclencheur...</option>
                  {TRIGGER_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* [M9] Actions multiples */}
              <div>
                <div className="ap-sec-lbl">
                  Actions {form.actions.length > 0 && `(${form.actions.length})`}
                </div>

                {form.actions.map((actionDef, idx) => (
                  <div key={idx}>
                    {idx > 0 && <div className="ap-action-arrow">↓</div>}
                    <ActionItem
                      actionDef={actionDef}
                      index={idx}
                      total={form.actions.length}
                      onChange={updateAction}
                      onDelete={deleteAction}
                    />
                  </div>
                ))}

                <button className="ap-add-action" onClick={addAction}>
                  + Ajouter une action
                </button>
              </div>

              {/* Délai */}
              <div>
                <div className="ap-field-label">Délai</div>
                <input className="ap-field-input" type="text" placeholder="Ex: Immédiat, 3 jours..." value={form.freq} onChange={setField('freq')} />
              </div>

              <div className="ap-modal-footer">
                {!isCreate && (
                  <button className="ap-btn-sec" onClick={() => handleDelete(modal.id)} style={{ marginRight:'auto', color:'#f45b5b' }}>🗑 Supprimer</button>
                )}
                <button className="ap-btn-sec" onClick={() => setModal(null)}>Annuler</button>
                <button className="ap-btn-primary" onClick={isCreate ? handleCreate : handleSave}>
                  {isCreate ? 'Créer' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}