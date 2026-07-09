import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
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
        <Loader2 size={22} className="animate-spin" color="#a78bfa" />
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div style={pageWrap}>
        <AlertCircle size={22} color="#f87171" />
        <p style={msgStyle}>Ce formulaire n'existe pas ou a été supprimé.</p>
      </div>
    );
  }

  if (error === 'inactive') {
    return (
      <div style={pageWrap}>
        <AlertCircle size={22} color="#fbbf24" />
        <p style={msgStyle}>Ce formulaire n'est plus disponible actuellement.</p>
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

const pageWrap = {
  minHeight: '100vh', background: '#060412',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: '12px', padding: '20px', textAlign: 'center',
};

const msgStyle = { color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 };
