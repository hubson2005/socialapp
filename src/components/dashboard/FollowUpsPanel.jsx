import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Check, ChevronDown, ChevronUp, Clock, Loader2, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { normalizePhone, isValidPhone } from '../../lib/phone';
import { useCrmTasks } from '../../hooks/useCrmTasks';

// ─── FollowUpsPanel — « À relancer » ──────────────────────────────────────────
// Liste les tâches ouvertes de `crm_tasks` ayant une échéance (due_at), groupées
// en : En retard / Aujourd'hui / À venir (7 jours). Actions rapides par ligne :
//   • Message : ouvre un modèle de relance professionnel ADAPTÉ au lead (statut,
//               retard de la relance), modifiable, puis ouvre WhatsApp (wa.me)
//               et trace l'envoi dans l'historique.
//   • Reporter : +1 / +3 / +7 jours à 09:00 ; reminder_sent_at remis à NULL pour
//                que le cron `crm-task-reminders` renvoie la notification.
//   • Terminé : status = 'done' + completed_at, déclenche task_completed [A10].
// Les rappels eux-mêmes (notification à l'échéance) sont envoyés côté base par
// crm_send_task_reminders() — ce composant ne fait que l'affichage et les actions.
//
// [M1] Modèles de messages : vouvoiement, ton courtois, signature automatique
//      avec le nom du profil (link_profiles.display_name). Les modèles proposés
//      dépendent du statut du lead (prospect / chaud / client / froid / perdu)
//      et d'un éventuel retard de la relance (≥ 2 jours).
//
// [H1] Les tâches viennent du hook partagé useCrmTasks (même source que
//      TasksCRMPanel) : « Terminé » passe par completeTask, qui trace
//      'task_done' dans la timeline du lead et déclenche task_completed.
//
// Props : profileId, leads (liste déjà chargée), onOpenLead(lead), refreshKey
// (incrémenter pour forcer un rechargement après création d'une relance).

const DAY_MS = 86400000;
const MAX_MSG = 1000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const daysLate   = (iso) => Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY_MS);

const dueLabel = (iso) => {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / DAY_MS);
  const hh = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 0)  return `En retard de ${-diff} j`;
  if (diff === 0) return `Aujourd'hui · ${hh}`;
  if (diff === 1) return `Demain · ${hh}`;
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })} · ${hh}`;
};

// ── [M1] Modèles de messages de relance ──────────────────────────────────────
// Le corps ne contient ni salutation ni signature : buildMessage() les ajoute.
const TEMPLATES_BY_STATUS = {
  prospect: [
    { id: 'p1', label: 'Suite à notre échange',  body: "Je reviens vers vous suite à notre échange. Souhaitez-vous des précisions pour avancer sur votre projet ?" },
    { id: 'p2', label: 'Proposer un échange',    body: "Pourrions-nous convenir d'un court échange cette semaine afin de répondre à vos questions ?" },
  ],
  chaud: [
    { id: 'c1', label: 'Finaliser',              body: "Je reviens vers vous concernant notre proposition. Y a-t-il un point à clarifier pour que nous puissions finaliser ?" },
    { id: 'c2', label: 'Confirmer un créneau',   body: "Afin d'avancer rapidement, pouvez-vous me confirmer le créneau qui vous convient pour finaliser les détails ?" },
  ],
  client: [
    { id: 'k1', label: 'Prendre des nouvelles',  body: "Je souhaitais savoir si tout se passe comme prévu de votre côté et si je peux vous aider en quoi que ce soit." },
    { id: 'k2', label: 'Merci + nouveautés',     body: "Merci pour votre confiance. Nous avons des nouveautés qui pourraient vous intéresser. Souhaitez-vous que je vous en parle ?" },
  ],
  froid: [
    { id: 'f1', label: 'Reprise de contact',     body: "Cela fait un moment que nous n'avons pas échangé. Votre besoin est-il toujours d'actualité ? Si oui, je reste à votre disposition pour vous accompagner." },
  ],
  perdu: [
    { id: 'l1', label: 'Garder le lien',         body: "Je me permets de vous recontacter. Si votre situation a évolué, je reste à votre disposition pour en discuter." },
  ],
};
const GENERIC_TEMPLATES = [
  { id: 'g1', label: 'Rappel courtois', body: "Je me permets de revenir vers vous. Avez-vous eu le temps d'y réfléchir ?" },
  { id: 'g2', label: 'Sans réponse',    body: "Je n'ai pas eu de retour à mon précédent message. Si le sujet n'est plus d'actualité, dites-le-moi simplement afin que je ne vous dérange pas davantage." },
  { id: 'g3', label: 'Message libre',   body: '' },
];
const LATE_TEMPLATE = { id: 'g0', label: 'Après un délai', body: "Veuillez excuser le délai de ma réponse. Je reviens vers vous pour faire le point sur votre demande. Êtes-vous disponible pour en parler ?" };

// Modèles proposés : « Après un délai » en tête si la relance a ≥ 2 jours de retard
const templatesFor = (status, late) => [
  ...(late ? [LATE_TEMPLATE] : []),
  ...(TEMPLATES_BY_STATUS[status] || TEMPLATES_BY_STATUS.prospect),
  ...GENERIC_TEMPLATES,
];

// Salutation + corps + signature (omises proprement si prénom / expéditeur inconnus)
const buildMessage = (body, { first, sender }) => {
  const hello = `Bonjour${first ? ' ' + first : ''},\n\n`;
  if (!body) return hello;   // message libre : salutation seule
  return `${hello}${body}${sender ? `\n\nCordialement,\n${sender}` : ''}`;
};

const GROUPS = [
  { key: 'overdue',  label: 'En retard',   color: '#dc2626', bg: 'rgba(220,38,38,0.08)'  },
  { key: 'today',    label: "Aujourd'hui", color: '#b45309', bg: 'rgba(245,158,11,0.12)' },
  { key: 'upcoming', label: 'À venir',     color: '#4f46e5', bg: 'rgba(99,102,241,0.10)' },
];
const UPCOMING_MAX = 5;

const smallBtn = (color = '#6b7280', bg = '#f6f7fb', border = '#e6e8f0') => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  height: 34, minWidth: 34, padding: '0 10px', borderRadius: 9,
  border: `1px solid ${border}`, background: bg, color,
  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
});

// ── [M1] Modale de message de relance ────────────────────────────────────────
// [M2] Exportée : réutilisée par LeadsCRMPanel pour les boutons WhatsApp des leads.
export function WhatsAppComposerModal({ lead, late = false, title = 'Message de relance', sender, onClose, onSend }) {
  const first = (lead?.name || '').trim().split(/\s+/)[0];
  const templates = useMemo(() => templatesFor(lead?.status, late), [lead?.status, late]);
  const [tplId, setTplId] = useState(templates[0].id);
  const [text, setText]   = useState(() => buildMessage(templates[0].body, { first, sender }));

  const pick = (tpl) => { setTplId(tpl.id); setText(buildMessage(tpl.body, { first, sender })); };
  const canSend = text.trim().length > 0;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <style>{`.fu-modal{max-height:90vh;max-height:90dvh;}`}</style>
      <div className="fu-modal" style={{ width: '100%', maxWidth: 480, background: '#ffffff', border: '1px solid #e6e8f0', borderRadius: 18, boxShadow: '0 30px 80px rgba(15,23,42,0.25)', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, color: '#161a2e', fontSize: 15, fontWeight: 800 }}>{title}</h3>
            <div style={{ color: '#8a90a2', fontSize: 12, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead?.name}{lead?.company ? ` · ${lead.company}` : ''}{lead?.phone ? ` · ${lead.phone}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #e6e8f0', background: '#f6f7fb', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        <div>
          <div style={{ color: '#8a90a2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
            Modèle adapté
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {templates.map(t => {
              const on = t.id === tplId;
              return (
                <button key={t.id} onClick={() => pick(t)} style={{ padding: '5px 11px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${on ? '#6366f1' : '#e6e8f0'}`, background: on ? 'rgba(99,102,241,0.12)' : '#ffffff', color: on ? '#4f46e5' : '#5b6072', fontSize: 12, fontWeight: on ? 700 : 500 }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
            maxLength={MAX_MSG}
            style={{ width: '100%', background: '#f6f7fb', border: '1px solid #e6e8f0', borderRadius: 12, padding: '11px 13px', color: '#161a2e', fontSize: 13, lineHeight: 1.55, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ color: '#a2a7b5', fontSize: 11 }}>Vous pouvez modifier le message avant l'envoi.</span>
            <span style={{ color: text.length > MAX_MSG * 0.9 ? '#ff9500' : '#a2a7b5', fontSize: 11 }}>{text.length}/{MAX_MSG}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...smallBtn(), height: 40, padding: '0 16px', fontSize: 13 }}>Annuler</button>
          <button
            onClick={() => canSend && onSend(text)}
            disabled={!canSend}
            style={{ ...smallBtn('#15803d', 'rgba(37,211,102,0.15)', 'rgba(37,211,102,0.45)'), height: 40, padding: '0 16px', fontSize: 13, opacity: canSend ? 1 : 0.45, cursor: canSend ? 'pointer' : 'not-allowed' }}
          >
            <MessageCircle size={14} /> Ouvrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowUpRow({ task, lead, color, busy, onMessage, onDone, onSnooze, onOpen }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '10px 12px', background: '#ffffff', border: '1px solid #e6e8f0',
      borderLeft: `3px solid ${color}`, borderRadius: 10,
    }}>
      <div
        onClick={lead ? onOpen : undefined}
        style={{ flex: 1, minWidth: 160, cursor: lead ? 'pointer' : 'default' }}
      >
        <div style={{ color: '#161a2e', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{task.title}</div>
        <div style={{ color: '#8a90a2', fontSize: 11.5, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {lead?.name && <span style={{ color: '#454b5a', fontWeight: 600 }}>{lead.name}</span>}
          <span style={{ color, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> {dueLabel(task.due_at)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {lead && (
          <button
            onClick={onMessage}
            disabled={!lead.phone?.trim()}
            title={lead.phone?.trim() ? `Écrire sur WhatsApp : ${lead.phone}` : 'Numéro manquant'}
            style={{
              ...smallBtn('#15803d', 'rgba(37,211,102,0.15)', 'rgba(37,211,102,0.35)'),
              opacity: lead.phone?.trim() ? 1 : 0.45, cursor: lead.phone?.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <MessageCircle size={13} /> Message
          </button>
        )}
        {[1, 3, 7].map(n => (
          <button key={n} onClick={() => onSnooze(n)} disabled={busy} title={`Reporter de ${n} jour${n > 1 ? 's' : ''}`} style={smallBtn()}>
            +{n} j
          </button>
        ))}
        <button
          onClick={onDone}
          disabled={busy}
          title="Marquer comme terminée"
          style={smallBtn('#16a34a', 'rgba(34,197,94,0.12)', 'rgba(34,197,94,0.35)')}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function FollowUpsPanel({ profileId, leads = [], onOpenLead, refreshKey = 0 }) {
  const { open: openTasks, loading: tasksLoading, completeTask, reload } = useCrmTasks({ profileId });
  const [ready, setReady]       = useState(false);  // évite le clignotement lors des rechargements
  const [open, setOpen]         = useState(null);   // null = automatique (ouvert si retard/aujourd'hui)
  const [busyId, setBusyId]     = useState(null);
  const [sender, setSender]     = useState('');     // [M1] nom du profil, signature des messages
  const [composer, setComposer] = useState(null);   // [M1] { task, lead } : modale ouverte

  useEffect(() => { if (!tasksLoading) setReady(true); }, [tasksLoading]);

  // Rechargement demandé par le parent (relance programmée, fiche lead fermée)
  useEffect(() => { if (refreshKey) reload(); }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rechargement quand l'onglet reprend le focus (les rappels tombent en arrière-plan)
  useEffect(() => {
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);

  // [M1] Nom d'expéditeur pour la signature (silencieux si indisponible)
  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    supabase.from('link_profiles').select('display_name').eq('id', profileId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setSender((data?.display_name || '').trim()); });
    return () => { cancelled = true; };
  }, [profileId]);

  // Tâches ouvertes avec échéance dans les 7 prochains jours (retards inclus)
  const tasks = useMemo(() => {
    const horizon = endOfDay(new Date(Date.now() + 7 * DAY_MS)).getTime();
    return openTasks.filter(t => t.due_at && new Date(t.due_at).getTime() <= horizon);
  }, [openTasks]);

  const leadById = useMemo(() => new Map(leads.map(l => [l.id, l])), [leads]);

  const grouped = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd   = endOfDay(new Date());
    const g = { overdue: [], today: [], upcoming: [] };
    tasks.forEach(t => {
      const d = new Date(t.due_at);
      if (d < todayStart) g.overdue.push(t);
      else if (d <= todayEnd) g.today.push(t);
      else g.upcoming.push(t);
    });
    return g;
  }, [tasks]);

  const urgent = grouped.overdue.length + grouped.today.length;
  const isOpen = open ?? urgent > 0;

  // ── Actions ────────────────────────────────────────────────────
  const openComposer = (task, lead) => {
    if (!lead?.phone?.trim()) { toast.error('Numéro manquant'); return; }
    if (!isValidPhone(lead.phone)) { toast.error('Numéro invalide : corrigez la fiche du lead'); return; }
    setComposer({ task, lead });
  };

  // [M1] Ouvre WhatsApp avec le message choisi, puis trace dans l'historique du lead
  const sendWhatsApp = async (text) => {
    const { lead } = composer;
    window.open(`https://wa.me/${normalizePhone(lead.phone)}?text=${encodeURIComponent(text.trim())}`, '_blank', 'noopener,noreferrer');
    setComposer(null);
    await supabase.from('lead_activities').insert([{ lead_id: lead.id, type: 'whatsapp', description: 'Relance WhatsApp (rappel)' }]);
  };

  const markDone = async (task) => {
    setBusyId(task.id);
    try {
      await completeTask(task);   // optimiste + trace 'task_done' + déclencheur task_completed
      toast.success('Relance terminée');
    } catch (e) {
      toast.error(e.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const snooze = async (task, days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    setBusyId(task.id);
    // reminder_sent_at = NULL : le cron renverra la notification à la nouvelle échéance
    const { error } = await supabase.from('crm_tasks')
      .update({ due_at: d.toISOString(), reminder_sent_at: null })
      .eq('id', task.id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Reportée de ${days} jour${days > 1 ? 's' : ''}`);
    await reload();
  };

  if (!profileId || !ready) return null;

  const total = tasks.length;
  const panelStyle = { background: '#ffffff', border: '1px solid #e6e8f0', borderRadius: 14, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' };

  if (total === 0) {
    return (
      <div style={{ ...panelStyle, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bell size={15} color="#a2a7b5" />
        <span style={{ color: '#8a90a2', fontSize: 12.5 }}>
          Aucune relance prévue. Programmez-en une depuis la fiche d'un lead.
        </span>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <button
        onClick={() => setOpen(!isOpen)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <Bell size={16} color={urgent > 0 ? '#dc2626' : '#6366f1'} />
        <span style={{ color: '#161a2e', fontSize: 14, fontWeight: 800 }}>À relancer</span>
        {grouped.overdue.length > 0 && (
          <span style={{ background: GROUPS[0].bg, color: GROUPS[0].color, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>
            {grouped.overdue.length} en retard
          </span>
        )}
        {grouped.today.length > 0 && (
          <span style={{ background: GROUPS[1].bg, color: GROUPS[1].color, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>
            {grouped.today.length} aujourd'hui
          </span>
        )}
        {grouped.upcoming.length > 0 && (
          <span style={{ background: GROUPS[2].bg, color: GROUPS[2].color, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>
            {grouped.upcoming.length} à venir
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: '#8a90a2', display: 'flex' }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isOpen && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {GROUPS.map(g => {
            const list = grouped[g.key];
            if (!list.length) return null;
            const shown = g.key === 'upcoming' ? list.slice(0, UPCOMING_MAX) : list;
            return (
              <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ color: g.color, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {g.label} ({list.length})
                </div>
                {shown.map(t => {
                  const lead = leadById.get(t.lead_id) || t.leads;   // t.leads : jointure du hook (repli)
                  return (
                    <FollowUpRow
                      key={t.id}
                      task={t}
                      lead={lead}
                      color={g.color}
                      busy={busyId === t.id}
                      onMessage={() => openComposer(t, lead)}
                      onDone={() => markDone(t)}
                      onSnooze={(n) => snooze(t, n)}
                      onOpen={() => onOpenLead && lead && onOpenLead(lead)}
                    />
                  );
                })}
                {g.key === 'upcoming' && list.length > UPCOMING_MAX && (
                  <span style={{ color: '#8a90a2', fontSize: 11.5 }}>+ {list.length - UPCOMING_MAX} autre(s) dans les 7 prochains jours</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {composer && (
        <WhatsAppComposerModal
          lead={composer.lead}
          late={daysLate(composer.task.due_at) >= 2}
          sender={sender}
          onClose={() => setComposer(null)}
          onSend={sendWhatsApp}
        />
      )}
    </div>
  );
}