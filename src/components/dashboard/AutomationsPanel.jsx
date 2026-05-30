// AutomationsPanel.jsx — intégré au Dashboard SocialApp
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";

/* ─── CSS ────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.ap-root{
  color:#f0f0f0;
  font-family:'DM Sans',sans-serif;
  font-size:13.5px;
}

:root{
  --bg:#111215;
  --card:#1a1c21;
  --card2:#1f2128;
  --border:rgba(255,255,255,0.07);
  --hover:#22252c;
  --hover2:#2a2d35;
  --orange:#f5841f;
  --orangeD:rgba(245,132,31,0.12);
  --green:#22d07a;
  --greenD:rgba(34,208,122,0.1);
  --blue:#4d9cf8;
  --blueD:rgba(77,156,248,0.1);
  --purple:#a78bfa;
  --purpleD:rgba(167,139,250,0.1);
  --red:#f45b5b;
  --yellow:#fbbf24;
  --t1:#f0f0f0;
  --t2:#9fa3b0;
  --t3:#5c6070;
}

*{ box-sizing:border-box; }

/* ── Header ── */
.ap-hdr{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  margin-bottom:20px;
  gap:12px;
}

.ap-title{
  font-family:'Syne',sans-serif;
  font-size:18px;
  font-weight:700;
  display:flex;
  align-items:center;
  gap:9px;
}

.ap-subtitle{
  font-size:12px;
  color:var(--t2);
  margin-top:3px;
}

.hdr-btns{
  display:flex;
  gap:8px;
  flex-shrink:0;
  flex-wrap:wrap;
}

.ap-btn-primary{
  display:flex;
  align-items:center;
  gap:5px;
  background:var(--orange);
  color:#fff;
  border:none;
  border-radius:9px;
  padding:0 13px;
  height:34px;
  font-size:12.5px;
  font-weight:600;
  cursor:pointer;
  font-family:'DM Sans',sans-serif;
  transition:filter .12s;
  white-space:nowrap;
}
.ap-btn-primary:hover{ filter:brightness(1.08); }

.ap-btn-sec{
  display:flex;
  align-items:center;
  gap:5px;
  background:var(--hover);
  border:1px solid var(--border);
  border-radius:9px;
  padding:0 12px;
  height:34px;
  font-size:12.5px;
  color:var(--t2);
  cursor:pointer;
  font-family:'DM Sans',sans-serif;
  transition:all .12s;
  white-space:nowrap;
}
.ap-btn-sec:hover{ background:var(--hover2); color:var(--t1); }

/* ── Stats : grille 3 colonnes fixes sur mobile ── */
.ap-stats{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  margin-bottom:18px;
}

.ap-stat{
  background:rgba(255,255,255,0.05);
  border:1px solid var(--border);
  border-radius:12px;
  padding:11px 10px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  text-align:center;
}

.ap-stat-ico{
  width:32px;
  height:32px;
  border-radius:9px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:15px;
  flex-shrink:0;
}

.ap-stat-num{
  font-family:'Syne',sans-serif;
  font-size:20px;
  font-weight:700;
  line-height:1;
}

.ap-stat-lbl{
  font-size:10px;
  color:var(--t2);
}

/* ── Tabs ── */
.ap-tabs{
  display:flex;
  gap:2px;
  background:rgba(255,255,255,0.05);
  border:1px solid var(--border);
  border-radius:11px;
  padding:3px;
  margin-bottom:16px;
  width:100%;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
}

.ap-tab{
  flex:1;
  padding:7px 10px;
  border-radius:8px;
  font-size:12px;
  cursor:pointer;
  font-family:'DM Sans',sans-serif;
  color:var(--t2);
  transition:all .12s;
  border:none;
  background:none;
  white-space:nowrap;
  text-align:center;
}
.ap-tab:hover{ color:var(--t1); }
.ap-tab.on{
  background:rgba(255,255,255,0.08);
  color:var(--t1);
  font-weight:600;
}

/* ── Toolbar ── */
.ap-toolbar{
  display:flex;
  align-items:center;
  gap:6px;
  margin-bottom:12px;
  flex-wrap:wrap;
}

.ap-filter-btn{
  padding:5px 11px;
  border-radius:7px;
  font-size:12px;
  cursor:pointer;
  border:1px solid var(--border);
  background:var(--hover);
  color:var(--t2);
  font-family:'DM Sans',sans-serif;
  transition:all .12s;
}
.ap-filter-btn:hover{ background:var(--hover2); color:var(--t1); }
.ap-filter-btn.on{
  background:var(--orangeD);
  border-color:rgba(245,132,31,.3);
  color:var(--orange);
  font-weight:600;
}

.ap-search{
  background:var(--hover);
  border:1px solid var(--border);
  border-radius:9px;
  display:flex;
  align-items:center;
  gap:7px;
  padding:0 11px;
  height:34px;
  width:100%;
  margin-top:4px;
}
.ap-search input{
  background:none;
  border:none;
  outline:none;
  color:var(--t1);
  font-size:13px;
  flex:1;
  min-width:0;
  font-family:'DM Sans',sans-serif;
}
.ap-search input::placeholder{ color:var(--t3); }

/* ── Auto cards ── */
.auto-list{ display:flex; flex-direction:column; gap:10px; }

.auto-card{
  background:rgba(255,255,255,0.04);
  border:1px solid var(--border);
  border-radius:14px;
  padding:14px;
  display:flex;
  align-items:flex-start;
  gap:12px;
  transition:border-color .15s,background .15s;
  cursor:pointer;
}
.auto-card:hover{
  border-color:rgba(255,255,255,.13);
  background:rgba(255,255,255,0.06);
}
.auto-card.active-card{ border-color:rgba(245,132,31,.25); }

.auto-ico{
  width:38px;
  height:38px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:18px;
  flex-shrink:0;
}

.auto-body{ flex:1; min-width:0; }

.auto-name{
  font-size:13.5px;
  font-weight:600;
  display:flex;
  align-items:center;
  gap:7px;
  flex-wrap:wrap;
}

.auto-desc{
  font-size:12px;
  color:var(--t2);
  margin-top:4px;
  line-height:1.5;
}

.auto-meta{
  display:flex;
  align-items:center;
  gap:6px;
  margin-top:8px;
  flex-wrap:wrap;
}

.auto-badge{
  font-size:10px;
  font-weight:600;
  padding:2px 7px;
  border-radius:20px;
}
.ab-trigger{ background:var(--blueD); color:var(--blue); }
.ab-action{ background:var(--orangeD); color:var(--orange); }
.ab-freq{ background:rgba(167,139,250,.1); color:var(--purple); }

.auto-stat{
  font-size:10.5px;
  color:var(--t3);
  display:flex;
  align-items:center;
  gap:3px;
}

/* ── Toggle + actions à droite ── */
.auto-right{
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:8px;
  flex-shrink:0;
}

.ap-tog-wrap{
  display:flex;
  align-items:center;
  gap:6px;
  font-size:11px;
}
.ap-tog-lbl{ color:var(--t2); }

.ap-toggle{
  position:relative;
  width:34px;
  height:19px;
  border-radius:10px;
  cursor:pointer;
  border:none;
  transition:background .2s;
  flex-shrink:0;
}
.ap-toggle.on{ background:var(--green); }
.ap-toggle.off{ background:var(--hover2); }
.ap-toggle::after{
  content:'';
  position:absolute;
  top:3px;
  width:13px;
  height:13px;
  border-radius:50%;
  background:#fff;
  transition:left .2s;
}
.ap-toggle.on::after{ left:18px; }
.ap-toggle.off::after{ left:3px; }

/* ── Flow ── */
.flow{
  display:flex;
  align-items:center;
  margin-top:9px;
  flex-wrap:wrap;
  gap:4px;
}
.flow-step{
  display:flex;
  align-items:center;
  gap:4px;
  background:rgba(255,255,255,0.06);
  border:1px solid var(--border);
  border-radius:7px;
  padding:4px 8px;
  font-size:11px;
  color:var(--t2);
}
.flow-arrow{ color:var(--t3); font-size:13px; margin:0 1px; }

/* ── Templates ── */
.tmpl-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:10px;
}

.tmpl-card{
  background:rgba(255,255,255,0.04);
  border:1px solid var(--border);
  border-radius:13px;
  padding:14px;
  cursor:pointer;
  transition:border-color .15s,background .15s;
  position:relative;
  overflow:hidden;
}
.tmpl-card:hover{
  border-color:rgba(245,132,31,.3);
  background:rgba(255,255,255,0.06);
}
.tmpl-card::before{
  content:'';
  position:absolute;
  top:0; left:0; right:0;
  height:3px;
  border-radius:13px 13px 0 0;
}
.tmpl-card.c-orange::before{background:var(--orange)}
.tmpl-card.c-blue::before{background:var(--blue)}
.tmpl-card.c-green::before{background:var(--green)}
.tmpl-card.c-purple::before{background:var(--purple)}

.tmpl-ico{ font-size:22px; margin-bottom:7px; }
.tmpl-name{ font-size:13px; font-weight:600; margin-bottom:4px; color:var(--t1); }
.tmpl-desc{ font-size:11.5px; color:var(--t2); line-height:1.5; margin-bottom:9px; }
.tmpl-tags{ display:flex; gap:5px; flex-wrap:wrap; }
.tmpl-tag{
  font-size:10px; font-weight:600; padding:2px 7px;
  border-radius:20px; background:var(--hover); color:var(--t2);
  border:1px solid var(--border);
}
.tmpl-use{
  width:100%; margin-top:9px;
  background:var(--orangeD);
  border:1px dashed rgba(245,132,31,.3);
  border-radius:8px; padding:7px;
  font-size:12px; color:var(--orange);
  cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:600;
}

/* ── Logs ── */
.log-list{ display:flex; flex-direction:column; }
.log-row{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  border-bottom:1px solid var(--border);
  background:rgba(255,255,255,0.03);
  font-size:12px;
  flex-wrap:wrap;
}
.log-row:last-child{ border-bottom:none; }
.log-dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.log-name{ font-weight:500; flex:1; min-width:80px; color:var(--t1); }
.log-trigger{ color:var(--t2); flex:1; min-width:80px; }
.log-status{ font-size:10.5px; font-weight:600; padding:2px 8px; border-radius:20px; }
.ls-ok{ background:var(--greenD); color:var(--green); }
.ls-err{ background:rgba(244,91,91,.12); color:var(--red); }
.ls-skip{ background:rgba(100,100,120,.2); color:var(--t2); }
.log-time{ color:var(--t3); font-size:10.5px; flex-shrink:0; }

/* ── Modal ── */
.ap-modal-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.65);
  backdrop-filter:blur(5px);
  z-index:200;
  display:flex;
  align-items:flex-end;   /* sur mobile : slide depuis le bas */
  justify-content:center;
  padding:0;
}

@media(min-width:600px){
  .ap-modal-overlay{
    align-items:center;
    padding:20px;
  }
  .ap-modal{
    border-radius:18px !important;
    max-height:90vh;
  }
}

.ap-modal{
  background:#1a1c21;
  border:1px solid rgba(255,255,255,0.1);
  border-radius:20px 20px 0 0;
  width:100%;
  max-width:520px;
  padding:20px 18px 28px;
  display:flex;
  flex-direction:column;
  gap:14px;
  max-height:92vh;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
}

.ap-modal-title{
  font-family:'Syne',sans-serif;
  font-size:16px;
  font-weight:700;
  display:flex;
  align-items:center;
  gap:10px;
  color:var(--t1);
}
.ap-modal-close{
  margin-left:auto;
  background:none;
  border:none;
  color:var(--t2);
  font-size:20px;
  cursor:pointer;
}

.ap-field-label{ font-size:12px; font-weight:600; color:var(--t2); margin-bottom:5px; }
.ap-sec-lbl{
  font-size:10.5px; font-weight:700; letter-spacing:.7px;
  text-transform:uppercase; color:var(--t3); margin-bottom:7px; margin-top:2px;
}

.ap-field-input,
.ap-field-select{
  width:100%;
  background:var(--hover);
  border:1px solid var(--border);
  border-radius:9px;
  padding:10px 13px;
  font-size:13px;
  color:var(--t1);
  outline:none;
  font-family:'DM Sans',sans-serif;
}
.ap-field-input:focus,
.ap-field-select:focus{ border-color:rgba(245,132,31,.4); }
.ap-field-input::placeholder{ color:var(--t3); }

.ap-modal-footer{
  display:flex;
  gap:8px;
  justify-content:flex-end;
  padding-top:4px;
  border-top:1px solid var(--border);
  flex-wrap:wrap;
}

.ap-loading{ padding:60px 20px; text-align:center; color:var(--t2); }
`;

const TEMPLATES = [
  { id:"t1", ico:"💬", name:"Welcome WhatsApp", color:"c-green", desc:"Message de bienvenue automatique pour chaque nouveau lead.", tags:["WhatsApp","Lead","Bienvenue"] },
  { id:"t2", ico:"📧", name:"Email de nurturing", color:"c-orange", desc:"Séquence d'emails pour convertir tes prospects en clients.", tags:["Email","Conversion","Séquence"] },
  { id:"t3", ico:"📊", name:"Rapport auto", color:"c-blue", desc:"Rapport hebdomadaire envoyé automatiquement par email.", tags:["Rapport","Email","Planifié"] },
  { id:"t4", ico:"🔥", name:"Relance leads froids", color:"c-purple", desc:"Réactivation des leads inactifs après 3 jours.", tags:["Lead","Relance","Automatique"] },
];

const LOGS = [
  { id:1, auto:"Welcome WhatsApp", trigger:"Lead: Konan A.", status:"ok",  time:"il y a 3min" },
  { id:2, auto:"Export G. Sheets",  trigger:"Lead: Konan A.", status:"ok",  time:"il y a 3min" },
  { id:3, auto:"Notif Slack",       trigger:"Lead: Bamba S.", status:"err", time:"lundi" },
];

const TRIGGERS = [
  "Nouveau lead","Lead froid","Lead chaud détecté",
  "Planifié (Lundi 8h)","Scan QR Code","Clic WhatsApp","Formulaire soumis",
];

const ACTIONS = [
  "Message WhatsApp","Email de relance","Export G. Sheets",
  "Notif Slack","Email rapport","Mise à jour statut",
];

const EMPTY_FORM = { name:"", desc:"", trigger:"", action:"", freq:"" };

export default function AutomationsPanel({ profileId }) {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState("automations");
  const [filter, setFilter]           = useState("Tous");
  const [search, setSearch]           = useState("");
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  const isCreate = modal === "create";
  const setField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  useEffect(() => { if (profileId) loadAutomations(); }, [profileId]);

  const loadAutomations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("automations").select("*").eq("profile_id", profileId).order("created_at", { ascending:false });
    if (error) { console.log("LOAD ERROR:", error); setLoading(false); return; }
    setAutomations((data || []).map(item => ({ ...item, desc:item.description || "", flow:item.flow || [] })));
    setLoading(false);
  };

  const openCreate = () => { setForm(EMPTY_FORM); setModal("create"); };

  const handleCreate = async () => {
    if (!form.name.trim()) { alert("Le nom est requis"); return; }
    const payload = {
      profile_id:profileId, name:form.name.trim(), description:form.desc.trim(),
      trigger:form.trigger, action:form.action, freq:form.freq, active:true,
      icon:"⚡", color:"rgba(245,132,31,.1)", runs:0, lastRun:"Jamais",
      flow:[["🎯", form.trigger||"Trigger"],["⚡", form.action||"Action"],["✅","Exécuté"]],
    };
    const { data, error } = await supabase.from("automations").insert(payload).select().single();
    if (error) { console.log("CREATE ERROR:", error); return; }
    setAutomations(prev => [{ ...data, desc:data.description||"" }, ...prev]);
    setModal(null); setForm(EMPTY_FORM);
  };

  const openEdit = (auto) => {
    setForm({ name:auto.name||"", desc:auto.desc||auto.description||"", trigger:auto.trigger||"", action:auto.action||"", freq:auto.freq||"" });
    setModal(auto);
  };

  const handleSave = async () => {
    if (!modal || modal === "create") return;
    const { data, error } = await supabase.from("automations").update({ name:form.name.trim(), description:form.desc.trim(), trigger:form.trigger, action:form.action, freq:form.freq }).eq("id", modal.id).select().single();
    if (error) { console.log("SAVE ERROR:", error); return; }
    setAutomations(prev => prev.map(a => a.id === modal.id ? { ...a, ...data, desc:data.description||"" } : a));
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette automation ?")) return;
    const { error } = await supabase.from("automations").delete().eq("id", id);
    if (error) { console.log("DELETE ERROR:", error); return; }
    setAutomations(prev => prev.filter(a => a.id !== id));
    setModal(null);
  };

  const toggleAuto = async (id) => {
    const target = automations.find(a => a.id === id);
    if (!target) return;
    const newStatus = !target.active;
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active:newStatus } : a));
    const { error } = await supabase.from("automations").update({ active:newStatus }).eq("id", id);
    if (error) { setAutomations(prev => prev.map(a => a.id === id ? { ...a, active:target.active } : a)); }
  };

  const filtered = useMemo(() => automations.filter(a => {
    const matchFilter = filter === "Tous" || (filter === "Actives" && a.active) || (filter === "Inactives" && !a.active);
    const matchSearch = (a.name||"").toLowerCase().includes(search.toLowerCase()) || (a.trigger||"").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }), [automations, filter, search]);

  const totalRuns  = automations.reduce((sum, a) => sum + (a.runs || 0), 0);
  const nbActive   = automations.filter(a => a.active).length;
  const nbInactive = automations.filter(a => !a.active).length;

  const logStatusCls = s => ({ ok:"log-status ls-ok", err:"log-status ls-err", skip:"log-status ls-skip" }[s] || "log-status ls-skip");
  const logStatusLbl = s => ({ ok:"✓ Succès", err:"✗ Erreur", skip:"⏭ Ignoré" }[s] || s);
  const logDotCol    = s => ({ ok:"#22d07a", err:"#f45b5b", skip:"#5c6070" }[s] || "#5c6070");

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

        {/* STATS — 3 colonnes égales, toujours visibles */}
        <div className="ap-stats">
          {[
            { ico:"✅", bg:"rgba(34,208,122,.1)",  num:nbActive,   lbl:"Actives",    col:"#22d07a" },
            { ico:"⏸",  bg:"rgba(100,100,120,.1)", num:nbInactive, lbl:"Inactives",  col:"#9fa3b0" },
            { ico:"🔄", bg:"rgba(77,156,248,.1)",  num:totalRuns,  lbl:"Exécutions", col:"#4d9cf8" },
          ].map(s => (
            <div key={s.lbl} className="ap-stat">
              <div className="ap-stat-ico" style={{ background:s.bg }}>{s.ico}</div>
              <div className="ap-stat-num" style={{ color:s.col }}>{s.num}</div>
              <div className="ap-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="ap-tabs">
          {[["automations","⚡ Mes auto."],["templates","📋 Templates"],["logs","📜 Historique"]].map(([id,lbl]) => (
            <button key={id} className={`ap-tab${tab===id?" on":""}`} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>

        {/* ── AUTOMATIONS ── */}
        {tab === "automations" && (
          <>
            <div className="ap-toolbar">
              {["Tous","Actives","Inactives"].map(f => (
                <button key={f} className={`ap-filter-btn${filter===f?" on":""}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
              <div className="ap-search">
                <span style={{ fontSize:14, color:"#5c6070" }}>🔍</span>
                <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="ap-loading">Chargement...</div>
            ) : (
              <div className="auto-list">
                {filtered.map(auto => (
                  <div key={auto.id} className={`auto-card${auto.active?" active-card":""}`} onClick={() => openEdit(auto)}>
                    <div className="auto-ico" style={{ background:auto.color }}>{auto.icon}</div>
                    <div className="auto-body">
                      <div className="auto-name">
                        {auto.name}
                        <span style={{ fontSize:10, fontWeight:700, background:auto.active?"rgba(34,208,122,.1)":"rgba(100,100,120,.2)", color:auto.active?"#22d07a":"#5c6070", padding:"2px 7px", borderRadius:20 }}>
                          {auto.active ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      <div className="auto-desc">{auto.desc}</div>
                      {!!auto.flow?.length && (
                        <div className="flow">
                          {auto.flow.map(([ico,lbl],i) => (
                            <span key={i} style={{ display:"flex", alignItems:"center" }}>
                              <span className="flow-step"><span style={{ fontSize:13 }}>{ico}</span>{lbl}</span>
                              {i < auto.flow.length-1 && <span className="flow-arrow">→</span>}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="auto-meta">
                        <span className="auto-badge ab-trigger">🎯 {auto.trigger||"Aucun"}</span>
                        <span className="auto-badge ab-action">⚡ {auto.action||"Aucune"}</span>
                        <span className="auto-badge ab-freq">🔄 {auto.freq||"—"}</span>
                        <span className="auto-stat">🔄 {auto.runs||0} exéc.</span>
                      </div>
                    </div>
                    <div className="auto-right" onClick={e => e.stopPropagation()}>
                      <div className="ap-tog-wrap">
                        <span className="ap-tog-lbl">{auto.active?"ON":"OFF"}</span>
                        <button className={`ap-toggle ${auto.active?"on":"off"}`} onClick={() => toggleAuto(auto.id)} />
                      </div>
                      <button className="ap-btn-sec" style={{ fontSize:11, height:28, padding:"0 9px" }} onClick={e => { e.stopPropagation(); openEdit(auto); }}>✏ Modifier</button>
                    </div>
                  </div>
                ))}
                {!filtered.length && (
                  <div style={{ textAlign:"center", padding:"50px 0", color:"#5c6070", fontSize:13 }}>Aucune automation trouvée</div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── TEMPLATES ── */}
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
                  <button className="tmpl-use" onClick={openCreate}>Utiliser ce template →</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <>
            <p style={{ fontSize:13, color:"#9fa3b0", marginBottom:14 }}>Historique des dernières exécutions.</p>
            <div className="log-list">
              {LOGS.map(log => (
                <div key={log.id} className="log-row">
                  <div className="log-dot" style={{ background:logDotCol(log.status) }} />
                  <span className="log-name">{log.auto}</span>
                  <span className="log-trigger">{log.trigger}</span>
                  <span className={logStatusCls(log.status)}>{logStatusLbl(log.status)}</span>
                  <span className="log-time">{log.time}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MODAL ── */}
        {modal && (
          <div className="ap-modal-overlay" onClick={e => { if (e.target===e.currentTarget) setModal(null); }}>
            <div className="ap-modal">
              {/* Handle mobile */}
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"-4px" }}>
                <div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,0.15)" }} />
              </div>

              <div className="ap-modal-title">
                <span style={{ fontSize:20 }}>{isCreate ? "⚡" : modal.icon||"⚡"}</span>
                {isCreate ? "Nouvelle automation" : `Modifier : ${modal.name}`}
                <button className="ap-modal-close" onClick={() => setModal(null)}>✕</button>
              </div>

              <div>
                <div className="ap-field-label">Nom de l'automation</div>
                <input className="ap-field-input" type="text" placeholder="Ex: Welcome WhatsApp" value={form.name} onChange={setField("name")} />
              </div>

              <div>
                <div className="ap-field-label">Description</div>
                <input className="ap-field-input" type="text" placeholder="Décris ce que fait cette automation..." value={form.desc} onChange={setField("desc")} />
              </div>

              <div>
                <div className="ap-sec-lbl">Déclencheur</div>
                <select className="ap-field-select" value={form.trigger} onChange={setField("trigger")}>
                  <option value="">Choisir un déclencheur...</option>
                  {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <div className="ap-sec-lbl">Action</div>
                <select className="ap-field-select" value={form.action} onChange={setField("action")}>
                  <option value="">Choisir une action...</option>
                  {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <div className="ap-field-label">Délai</div>
                <input className="ap-field-input" type="text" placeholder="Ex: Immédiat, 3 jours..." value={form.freq} onChange={setField("freq")} />
              </div>

              <div className="ap-modal-footer">
                {!isCreate && (
                  <button className="ap-btn-sec" onClick={() => handleDelete(modal.id)} style={{ marginRight:"auto", color:"#f45b5b" }}>🗑 Supprimer</button>
                )}
                <button className="ap-btn-sec" onClick={() => setModal(null)}>Annuler</button>
                <button className="ap-btn-primary" onClick={isCreate ? handleCreate : handleSave}>
                  {isCreate ? "Créer" : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

