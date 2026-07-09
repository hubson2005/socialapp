import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FileX, Clock3 } from 'lucide-react';
import { supabase } from '../../supabase';
import FormPreview from "./FormPreview";
import { triggerFormSubmit } from "../../lib/triggers/form";

export default function PublicForm() {
  const { formId } = useParams();
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();

      if (cancelled) return;

      if (dbError || !data) {
        setError('not_found');
      } else if (data.status !== 'actif') {
        setError('inactive');
      } else {
        setForm(data);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [formId]);

  const handleSubmit = async (values) => {
    // 1. Sauvegarder la réponse (submissions_count est incrémenté
    // automatiquement côté DB par un trigger AFTER INSERT)
    const { error: insertError } = await supabase
      .from('form_submissions')
      .insert([{ form_id: formId, data: values }]);
    if (insertError) throw insertError;

    // 2. Déclencher les automations liées au formulaire
    await triggerFormSubmit(form.profile_id, {
      name:      values.name  || '',
      email:     values.email || '',
      phone:     values.phone || '',
      formId:    form.id,
      formTitle: form.title,
    });
  };

  if (loading) {
    return (
      <div style={pageWrap}>
        <StatusCard>
          <Loader2 size={19} className="animate-spin" color="#a78bfa" />
          <p style={msgStyle}>Chargement du formulaire…</p>
        </StatusCard>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div style={pageWrap}>
        <StatusCard>
          <IconBadge color="#f87171" bg="rgba(248,113,113,0.14)">
            <FileX size={19} color="#f87171" />
          </IconBadge>
          <div>
            <p style={titleStyle}>Formulaire introuvable</p>
            <p style={msgStyle}>Ce formulaire n'existe pas ou a été supprimé.</p>
          </div>
        </StatusCard>
      </div>
    );
  }

  if (error === 'inactive') {
    return (
      <div style={pageWrap}>
        <StatusCard>
          <IconBadge color="#fbbf24" bg="rgba(251,191,36,0.14)">
            <Clock3 size={19} color="#fbbf24" />
          </IconBadge>
          <div>
            <p style={titleStyle}>Formulaire indisponible</p>
            <p style={msgStyle}>Ce formulaire n'est plus disponible actuellement.</p>
          </div>
        </StatusCard>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060412', padding: '40px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <FormPreview form={form} mode="public" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

// ─── Éléments partagés loading/erreur, dans le même langage visuel que FormPreview ──
function StatusCard({ children }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '18px',
      boxShadow: '0 12px 28px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.24)',
      padding: '32px 28px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
      maxWidth: '360px', textAlign: 'center',
    }}>
      {children}
    </div>
  );
}

function IconBadge({ children, bg }) {
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '50%',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}

const pageWrap = {
  minHeight: '100vh', background: '#060412',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px',
};

const titleStyle = { color: 'white', fontSize: '14px', fontWeight: 700, margin: '0 0 5px' };
const msgStyle = { color: 'rgba(255,255,255,0.5)', fontSize: '12.5px', margin: 0, lineHeight: 1.5 };