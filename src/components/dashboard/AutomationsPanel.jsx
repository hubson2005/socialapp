// AutomationsPanel.jsx — intégré au Dashboard SocialApp
import { useState, useEffect } from "react";
import { supabase } from '../../supabase';

/* ─── CSS ────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.ap-root{color:#f0f0f0;font-family:'DM Sans',sans-serif;font-size:13.5px}
:root{
  --bg:#111215;--card:#1a1c21;--card2:#1f2128;--border:rgba(255,255,255,0.07);
  --hover:#22252c;--hover2:#2a2d35;
  --orange:#f5841f;--orangeD:rgba(245,132,31,0.12);
  --green:#22d07a;--greenD:rgba(34,208,122,0.1);
  --blue:#4d9cf8;--blueD:rgba(77,156,248,0.1);
  --purple:#a78bfa;--purpleD:rgba(167,139,250,0.1);
  --red:#f45b5b;--yellow:#fbbf24;
  --t1:#f0f0f0;--t2:#9fa3b0;--t3:#5c6070;
}
.ap-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.ap-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;display:flex;align-items:center;gap:9px}
.ap-subtitle{font-size:12.5px;color:var(--t2);margin-top:3px}
.ap-btn-primary{display:flex;align-items:center;gap:6px;background:var(--orange);color:#fff;border:none;border-radius:9px;padding:0 16px;height:36px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:filter .12s}
.ap-btn-primary:hover{filter:brightness(1.1)}
.ap-btn-sec{display:flex;align-items:center;gap:6px;background:var(--hover);border:1px solid var(--border);border-radius:9px;padding:0 14px;height:36px;font-size:13px;color:var(--t2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .12s}
.ap-btn-sec:hover{background:var(--hover2);color:var(--t1)}
.hdr-btns{display:flex;gap:8px;flex-wrap:wrap}
.ap-stats{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.ap-stat{background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:13px;padding:12px 16px;display:flex;align-items:center;gap:11px;flex:1;min-width:130px}
.ap-stat-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.ap-stat-num{font-family:'Syne',sans-serif;font-size:19px;font-weight:700}
.ap-stat-lbl{font-size:10.5px;color:var(--t2);margin-top:1px}
.ap-tabs{display:flex;gap:2px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:11px;padding:3px;margin-bottom:18px;width:fit-content}
.ap-tab{padding:6px 16px;border-radius:8px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--t2);transition:all .12s;border:none;background:none}
.ap-tab:hover{color:var(--t1)}
.ap-tab.on{background:rgba(255,255,255,0.08);color:var(--t1);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.ap-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.ap-filter-btn{padding:5px 12px;border-radius:7px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:var(--hover);color:var(--t2);font-family:'DM Sans',sans-serif;transition:all .12s}
.ap-filter-btn:hover{background:var(--hover2);color:var(--t1)}
.ap-filter-btn.on{background:var(--orangeD);border-color:rgba(245,132,31,.3);color:var(--orange);font-weight:600}
.ap-search{background:var(--hover);border:1px solid var(--border);border-radius:9px;display:flex;align-items:center;gap:7px;padding:0 12px;height:34px;margin-left:auto}
.ap-search input{background:none;border:none;outline:none;color:var(--t1);font-size:13px;width:200px;font-family:'DM Sans',sans-serif}
.ap-search input::placeholder{color:var(--t3)}
.auto-list{display:flex;flex-direction:column;gap:10px}
.auto-card{background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:14px;padding:16px;display:flex;align-items:flex-start;gap:14px;transition:border-color .15s,background .15s;cursor:pointer}
.auto-card:hover{border-color:rgba(255,255,255,.13);background:rgba(255,255,255,0.06)}
.auto-card.active-card{border-color:rgba(245,132,31,.25)}
.auto-ico{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.auto-body{flex:1;min-width:0}
.auto-name{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.auto-desc{font-size:12px;color:var(--t2);margin-top:4px;line-height:1.5}
.auto-meta{display:flex;align-items:center;gap:14px;margin-top:10px;flex-wrap:wrap}
.auto-badge{font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px}
.ab-trigger{background:var(--blueD);color:var(--blue)}
.ab-action{background:var(--orangeD);color:var(--orange)}
.ab-freq{background:rgba(167,139,250,.1);color:var(--purple)}
.auto-stat{font-size:11px;color:var(--t3);display:flex;align-items:center;gap:4px}
.auto-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0}
.ap-tog-wrap{display:flex;align-items:center;gap:7px;font-size:12px}
.ap-tog-lbl{color:var(--t2)}
.ap-toggle{position:relative;width:36px;height:20px;border-radius:10px;cursor:pointer;border:none;transition:background .2s;flex-shrink:0}
.ap-toggle.on{background:var(--green)}
.ap-toggle.off{background:var(--hover2)}
.ap-toggle::after{content:'';position:absolute;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left .2s}
.ap-toggle.on::after{left:19px}
.ap-toggle.off::after{left:3px}
.flow{display:flex;align-items:center;margin-top:11px;flex-wrap:wrap;gap:4px}
.flow-step{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:11.5px;color:var(--t2)}
.flow-arrow{color:var(--t3);font-size:14px;margin:0 2px}
.tmpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.tmpl-card{background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:13px;padding:15px;cursor:pointer;transition:border-color .15s,background .15s;position:relative;overflow:hidden}
.tmpl-card:hover{border-color:rgba(245,132,31,.3);background:rgba(255,255,255,0.06)}
.tmpl-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:13px 13px 0 0}
.tmpl-card.c-orange::before{background:var(--orange)}
.tmpl-card.c-blue::before{background:var(--blue)}
.tmpl-card.c-green::before{background:var(--green)}
.tmpl-card.c-purple::before{background:var(--purple)}
.tmpl-ico{font-size:24px;margin-bottom:8px}
.tmpl-name{font-size:13.5px;font-weight:600;margin-bottom:4px;color:var(--t1)}
.tmpl-desc{font-size:11.5px;color:var(--t2);line-height:1.5;margin-bottom:10px}
.tmpl-tags{display:flex;gap:5px;flex-wrap:wrap}
.tmpl-tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;background:var(--hover);color:var(--t2);border:1px solid var(--border)}
.tmpl-use{width:100%;margin-top:10px;background:var(--orangeD);border:1px dashed rgba(245,132,31,.3);border-radius:8px;padding:7px;font-size:12px;color:var(--orange);cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:background .12s}
.tmpl-use:hover{background:rgba(245,132,31,.2)}
.log-list{display:flex;flex-direction:column}
.log-row{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--border);background:rgba(255,255,255,0.03);font-size:12.5px;transition:background .12s}
.log-row:first-child{border-radius:13px 13px 0 0}
.log-row:last-child{border-radius:0 0 13px 13px;border-bottom:none}
.log-row:hover{background:rgba(255,255,255,0.06)}
.log-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.log-name{font-weight:500;flex:1;color:var(--t1)}
.log-trigger{color:var(--t2);flex:1}
.log-status{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px}
.ls-ok{background:var(--greenD);color:var(--green)}
.ls-err{background:rgba(244,91,91,.12);color:var(--red)}
.ls-skip{background:rgba(100,100,120,.2);color:var(--t2)}
.log-time{color:var(--t3);font-size:11px;flex-shrink:0}
.ap-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.ap-modal{background:#1a1c21;border:1px solid rgba(255,255,255,0.1);border-radius:18px;width:100%;max-width:520px;padding:24px;display:flex;flex-direction:column;gap:16px;animation:ap-slideUp .2s ease;max-height:90vh;overflow-y:auto}
@keyframes ap-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.ap-modal-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;display:flex;align-items:center;gap:10px;color:var(--t1)}
.ap-modal-close{margin-left:auto;background:none;border:none;color:var(--t2);font-size:20px;cursor:pointer;line-height:1;padding:0}
.ap-field-label{font-size:12px;font-weight:600;color:var(--t2);margin-bottom:5px}
.ap-field-input{width:100%;background:var(--hover);border:1px solid var(--border);border-radius:9px;padding:10px 13px;font-size:13px;color:var(--t1);outline:none;font-family:'DM Sans',sans-serif;box-sizing:border-box}
.ap-field-input:focus{border-color:rgba(245,132,31,.4)}
.ap-field-input::placeholder{color:var(--t3)}
.ap-field-select{width:100%;background:var(--hover);border:1px solid var(--border);border-radius:9px;padding:10px 13px;font-size:13px;color:var(--t1);outline:none;font-family:'DM Sans',sans-serif;cursor:pointer;box-sizing:border-box}
.ap-modal-footer{display:flex;gap:8px;justify-content:flex-end;padding-top:4px;border-top:1px solid var(--border)}
.ap-sec-lbl{font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--t3);margin-bottom:8px;margin-top:4px}
`;

const DEFAULT_AUTOMATIONS = [
  { id:"a1", name:"Message de bienvenue WhatsApp", active:true,  icon:"💬", color:"rgba(37,211,102,.1)",  desc:"Envoie automatiquement un message de bienvenue à chaque nouveau lead via WhatsApp Business.", trigger:"Nouveau lead",          action:"Message WhatsApp",  freq:"Immédiat",      runs:247, lastRun:"il y a 3min",    flow:[["👤","Nouveau lead"],["🔍","Vérif. WhatsApp"],["💬","Envoi message"],["✅","Lead notifié"]] },
  { id:"a2", name:"Export leads Google Sheets",     active:true,  icon:"📊", color:"rgba(34,208,122,.1)", desc:"Exporte chaque nouveau lead dans une feuille Google Sheets avec toutes ses informations.",      trigger:"Nouveau lead",          action:"Ajout G. Sheets",   freq:"Temps réel",    runs:247, lastRun:"il y a 3min",    flow:[["👤","Nouveau lead"],["📊","Ouverture Sheets"],["📝","Écriture ligne"],["✅","Synchronisé"]] },
  { id:"a3", name:"Relance lead froid (J+3)",       active:false, icon:"🔥", color:"rgba(245,132,31,.1)", desc:"Relance automatiquement les leads froids 3 jours après leur première interaction.",              trigger:"Lead froid",            action:"Email de relance",  freq:"J+3",           runs:43,  lastRun:"hier",             flow:[["❄️","Lead froid"],["⏰","Attente 3j"],["📧","Email relance"],["📊","Mise à jour statut"]] },
  { id:"a4", name:"Rapport hebdomadaire",           active:true,  icon:"📈", color:"rgba(77,156,248,.1)", desc:"Génère et envoie un rapport de performance chaque lundi matin à 8h.",                           trigger:"Planifié (Lundi 8h)",   action:"Email rapport",     freq:"Hebdo",         runs:12,  lastRun:"lundi dernier",    flow:[["📅","Planificateur"],["📊","Collecte données"],["📄","Génère rapport"],["📧","Envoi email"]] },
  { id:"a5", name:"Notif Slack nouveau lead chaud", active:false, icon:"🔔", color:"rgba(167,139,250,.1)",desc:"Envoie une notification Slack instantanée dès qu'un lead est qualifié comme 'Chaud'.",          trigger:"Lead chaud détecté",    action:"Notif Slack",       freq:"Immédiat",      runs:0,   lastRun:"Jamais",            flow:[["🔥","Lead chaud"],["🔌","Connexion Slack"],["🔔","Envoi notif"],["✅","Équipe alertée"]] },
];

const TEMPLATES = [
  {id:"t1",ico:"💬",name:"Welcome WhatsApp",  color:"c-green",  desc:"Message de bienvenue automatique pour chaque nouveau lead.",     tags:["WhatsApp","Lead","Bienvenue"]},
  {id:"t2",ico:"📧",name:"Email de nurturing", color:"c-orange", desc:"Séquence d'emails pour convertir tes prospects en clients.",     tags:["Email","Conversion","Séquence"]},
  {id:"t3",ico:"📊",name:"Rapport auto",       color:"c-blue",   desc:"Rapport hebdomadaire envoyé automatiquement par email.",         tags:["Rapport","Email","Planifié"]},
  {id:"t4",ico:"🔥",name:"Relance leads froids",color:"c-purple",desc:"Réactivation des leads inactifs après 3 jours.",                tags:["Lead","Relance","Automatique"]},
  {id:"t5",ico:"⭐",name:"Score de lead",       color:"c-orange", desc:"Attribution automatique d'un score selon les interactions.",    tags:["Lead","Score","Analytics"]},
  {id:"t6",ico:"📱",name:"QR Code scan alert", color:"c-blue",   desc:"Notification instantanée à chaque scan de ton QR Code.",       tags:["QR Code","Alerte","Temps réel"]},
];

const LOGS = [
  {id:1,auto:"Welcome WhatsApp",  trigger:"Lead: Konan A.",   status:"ok",   time:"il y a 3min"},
  {id:2,auto:"Export G. Sheets",  trigger:"Lead: Konan A.",   status:"ok",   time:"il y a 3min"},
  {id:3,auto:"Welcome WhatsApp",  trigger:"Lead: Touré K.",   status:"ok",   time:"il y a 2h"},
  {id:4,auto:"Export G. Sheets",  trigger:"Lead: Touré K.",   status:"ok",   time:"il y a 2h"},
  {id:5,auto:"Relance J+3",       trigger:"Lead: Diabaté B.", status:"skip", time:"hier"},
  {id:6,auto:"Rapport hebdo",     trigger:"Lundi 08:00",      status:"ok",   time:"lundi"},
  {id:7,auto:"Notif Slack",       trigger:"Lead: Bamba S.",   status:"err",  time:"lundi"},
];

const TRIGGERS = ["Nouveau lead","Lead froid","Lead chaud détecté","Planifié (Lundi 8h)","Scan QR Code","Clic WhatsApp","Formulaire soumis"];
const ACTIONS  = ["Message WhatsApp","Email de relance","Export G. Sheets","Notif Slack","Email rapport","Mise à jour statut"];

export default function AutomationsPanel({ profileId }) {

  // STATES
  const [automations, setAutomations] = useState([]);
  const [tab, setTab] = useState("automations");
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  // useEffect LOAD SUPABASE
  useEffect(() => {
    const loadAutomations = async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("profile_id", profileId);

      if (error) {
        console.log("LOAD ERROR:", error);
        return;
      }

      console.log("LOADED:", data);

      setAutomations(data);
    };

    if (profileId) {
      loadAutomations();
    }
  }, [profileId]);

  // TOGGLE
  const toggleAuto = async (id) => {
    setAutomations(prev =>
      prev.map(a => {
        if (a.id !== id) return a;

        const updated = {
          ...a,
          active: !a.active
        };

        supabase
          .from("automations")
          .upsert({
            id: updated.id,
            profile_id: profileId,
            name: updated.name,
            icon: updated.icon,
            description: updated.description,
            color: updated.color,
            active: updated.active
          })
          .then(({ error }) => {
            if (error) {
              console.log("TOGGLE ERROR:", error);
            }
          });

        return updated;
      })
    );
  };

  // ensuite le reste du composant...

  const filtered = automations.filter(a => {
    const matchFilter = filter === "Tous" || (filter === "Actives" && a.active) || (filter === "Inactives" && !a.active);
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.trigger.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalRuns  = automations.reduce((s, a) => s + a.runs, 0);
  const nbActive   = automations.filter(a => a.active).length;
  const nbInactive = automations.filter(a => !a.active).length;

  const logStatusCls = s => ({ ok:"log-status ls-ok", err:"log-status ls-err", skip:"log-status ls-skip" }[s] || "log-status ls-skip");
  const logStatusLbl = s => ({ ok:"✓ Succès", err:"✗ Erreur", skip:"⏭ Ignoré" }[s] || s);
  const logDotCol    = s => ({ ok:"#22d07a", err:"#f45b5b", skip:"#5c6070" }[s] || "#5c6070");

  return (
    <>
      <style>{STYLE}</style>
      <div className="ap-root">

        {/* ── Header ── */}
        <div className="ap-hdr">
          <div>
            <div className="ap-title">⚡ Automatisations</div>
            <div className="ap-subtitle">Automatise tes actions marketing et commerciales</div>
          </div>
          <div className="hdr-btns">
            <button className="ap-btn-sec">📖 Documentation</button>
            <button className="ap-btn-primary" onClick={() => setModal("create")}>+ Nouvelle automation</button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="ap-stats">
          {[
            { ico:"✅", bg:"rgba(34,208,122,.1)",  num:nbActive,   lbl:"Actives",      col:"#22d07a" },
            { ico:"⏸",  bg:"rgba(100,100,120,.1)", num:nbInactive, lbl:"Inactives",    col:"#9fa3b0" },
            { ico:"🔄", bg:"rgba(77,156,248,.1)",  num:totalRuns,  lbl:"Exécutions",   col:"#4d9cf8" },
            { ico:"✓",  bg:"rgba(34,208,122,.1)",  num:LOGS.filter(l=>l.status==="ok").length,  lbl:"Succès (7j)",  col:"#22d07a" },
            { ico:"✗",  bg:"rgba(244,91,91,.1)",   num:LOGS.filter(l=>l.status==="err").length, lbl:"Erreurs (7j)", col:"#f45b5b" },
          ].map(s => (
            <div key={s.lbl} className="ap-stat">
              <div className="ap-stat-ico" style={{ background: s.bg }}>{s.ico}</div>
              <div>
                <div className="ap-stat-num" style={{ color: s.col }}>{s.num}</div>
                <div className="ap-stat-lbl">{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Onglets ── */}
        <div className="ap-tabs">
          {[["automations","⚡ Mes automations"],["templates","📋 Templates"],["logs","📜 Historique"]].map(([id,lbl]) => (
            <button key={id} className={`ap-tab${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>

        {/* ═══ Automations ═══ */}
        {tab === "automations" && (
          <>
            <div className="ap-toolbar">
              {["Tous","Actives","Inactives"].map(f => (
                <button key={f} className={`ap-filter-btn${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
              <div className="ap-search">
                <span style={{ fontSize:14, color:"#5c6070" }}>🔍</span>
                <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="auto-list">
              {filtered.map(auto => (
                <div key={auto.id} className={`auto-card${auto.active ? " active-card" : ""}`} onClick={() => setModal(auto)}>
                  <div className="auto-ico" style={{ background: auto.color }}>{auto.icon}</div>
                  <div className="auto-body">
                    <div className="auto-name">
                      {auto.name}
                      {auto.active
                        ? <span style={{ fontSize:10, fontWeight:700, background:"rgba(34,208,122,.1)", color:"#22d07a", padding:"2px 8px", borderRadius:20 }}>Actif</span>
                        : <span style={{ fontSize:10, fontWeight:700, background:"rgba(100,100,120,.2)", color:"#5c6070", padding:"2px 8px", borderRadius:20 }}>Inactif</span>
                      }
                    </div>
                    <div className="auto-desc">{auto.desc}</div>
                    <div className="flow">
                      {auto.flow.map(([ico,lbl],i) => (
                        <span key={i} style={{ display:"flex", alignItems:"center" }}>
                          <span className="flow-step"><span style={{ fontSize:14 }}>{ico}</span>{lbl}</span>
                          {i < auto.flow.length - 1 && <span className="flow-arrow">→</span>}
                        </span>
                      ))}
                    </div>
                    <div className="auto-meta">
                      <span className="auto-badge ab-trigger">🎯 {auto.trigger}</span>
                      <span className="auto-badge ab-action">⚡ {auto.action}</span>
                      <span className="auto-badge ab-freq">🔄 {auto.freq}</span>
                      <span className="auto-stat">🔄 {auto.runs} exécutions</span>
                      <span className="auto-stat">🕐 {auto.lastRun}</span>
                    </div>
                  </div>
                  <div className="auto-right" onClick={e => e.stopPropagation()}>
                    <div className="ap-tog-wrap">
                      <span className="ap-tog-lbl">{auto.active ? "ON" : "OFF"}</span>
                      <button className={`ap-toggle ${auto.active ? "on" : "off"}`} onClick={() => toggleAuto(auto.id)} />
                    </div>
                    <button className="ap-btn-sec" style={{ fontSize:11.5, height:30, padding:"0 10px" }} onClick={e => { e.stopPropagation(); setModal(auto); }}>✏ Modifier</button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign:"center", padding:"60px 0", color:"#5c6070", fontSize:13 }}>Aucune automation trouvée</div>
              )}
            </div>
          </>
        )}

        {/* ═══ Templates ═══ */}
        {tab === "templates" && (
          <>
            <p style={{ fontSize:13, color:"#9fa3b0", marginBottom:14 }}>Démarre rapidement avec un template prêt à l'emploi.</p>
            <div className="tmpl-grid">
              {TEMPLATES.map(t => (
                <div key={t.id} className={`tmpl-card ${t.color}`}>
                  <div className="tmpl-ico">{t.ico}</div>
                  <div className="tmpl-name">{t.name}</div>
                  <div className="tmpl-desc">{t.desc}</div>
                  <div className="tmpl-tags">{t.tags.map(tag => <span key={tag} className="tmpl-tag">{tag}</span>)}</div>
                  <button className="tmpl-use" onClick={() => setModal("create")}>Utiliser ce template →</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ Logs ═══ */}
        {tab === "logs" && (
          <>
            <p style={{ fontSize:13, color:"#9fa3b0", marginBottom:14 }}>Historique des {LOGS.length} dernières exécutions.</p>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 14px", fontSize:11, fontWeight:700, letterSpacing:".5px", textTransform:"uppercase", color:"#5c6070", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ flex:1 }}>Automation</span><span style={{ flex:1 }}>Déclencheur</span><span style={{ width:90 }}>Statut</span><span style={{ width:90, textAlign:"right" }}>Heure</span>
            </div>
            <div className="log-list">
              {LOGS.map(log => (
                <div key={log.id} className="log-row">
                  <div className="log-dot" style={{ background: logDotCol(log.status) }} />
                  <span className="log-name">{log.auto}</span>
                  <span className="log-trigger">{log.trigger}</span>
                  <span className={logStatusCls(log.status)}>{logStatusLbl(log.status)}</span>
                  <span className="log-time">{log.time}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ Modal ═══ */}
        {modal && (
          <div className="ap-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div className="ap-modal">
              <div className="ap-modal-title">
                <span style={{ fontSize:22 }}>{modal === "create" ? "⚡" : (modal.icon || "⚡")}</span>
                {modal === "create" ? "Nouvelle automation" : `Modifier : ${modal.name}`}
                <button className="ap-modal-close" onClick={() => setModal(null)}>✕</button>
              </div>
              <div>
                <div className="ap-field-label">Nom de l'automation</div>
                <input className="ap-field-input" type="text" placeholder="Ex: Welcome WhatsApp nouveau lead" defaultValue={modal !== "create" ? modal.name : ""} />
              </div>
              <div>
                <div className="ap-field-label">Description</div>
                <input className="ap-field-input" type="text" placeholder="Décris ce que fait cette automation..." defaultValue={modal !== "create" ? modal.desc : ""} />
              </div>
              <div>
                <div className="ap-sec-lbl">Déclencheur (Trigger)</div>
                <select className="ap-field-select" defaultValue={modal !== "create" ? modal.trigger : ""}>
                  <option value="">Choisir un déclencheur...</option>
                  {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="ap-sec-lbl">Action</div>
                <select className="ap-field-select" defaultValue={modal !== "create" ? modal.action : ""}>
                  <option value="">Choisir une action...</option>
                  {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <div className="ap-field-label">Délai (optionnel)</div>
<input
  className="ap-field-input"
  type="text"
  placeholder="Ex: Immédiat, 1 heure, 3 jours..."
  defaultValue={modal !== "create" ? modal.freq : ""}
/>

</div>

<div className="ap-modal-footer">

  <button
    className="ap-btn-sec"
    onClick={() => setModal(null)}
  >
    Annuler
  </button>

  <button
    className="ap-btn-primary"
    onClick={async () => {

      // ✅ CREATE AUTOMATION
      if (modal === "create") {

        const payload = {
          profile_id: profileId,
          name: "Nouvelle automation",
          active: false,
          icon: "⚡",
          color: "rgba(245,132,31,.1)",
          description: "Automation personnalisée",
          trigger: "Nouveau lead",
          action: "Message WhatsApp",
          freq: "Immédiat",
          runs: 0,
          lastRun: "Jamais"
        };

        const { data, error } = await supabase
          .from("automations")
          .insert(payload)
          .select();

        if (error) {
          console.log("CREATE ERROR:", error);
          return;
        }

        console.log("CREATED:", data);

        // ✅ update UI instantly
        setAutomations(prev => [data[0], ...prev]);
      }

      setModal(null);
    }}
  >
    {modal === "create"
      ? "Créer l'automation"
      : "Sauvegarder"}
  </button>

</div>
              </div>
            </div>
        )}
      </div>
    </>
  );
}