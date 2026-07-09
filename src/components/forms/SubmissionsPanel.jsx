import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../supabase';

const ACCENT = '#a78bfa';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const db = {
  list: async (formId) => {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

export default function SubmissionsPanel({ formId, fields }) {
  const [expandedId, setExpandedId] = useState(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: () => db.list(formId),
    enabled: !!formId,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 size={20} className="animate-spin" color={ACCENT} />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={emptyIconWrap}>
          <Inbox size={20} color="rgba(255,255,255,0.25)" />
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, margin: 0 }}>Aucune réponse</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Les réponses s'afficheront ici</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 4 }}>
        {submissions.length} réponse{submissions.length !== 1 ? 's' : ''}
      </p>
      {submissions.map((sub) => {
        const isOpen = expandedId === sub.id;
        return (
          <div key={sub.id} style={cardStyle}>
            <button onClick={() => setExpandedId(isOpen ? null : sub.id)} style={headerBtnStyle}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {formatDate(sub.created_at)}
              </span>
              {isOpen
                ? <ChevronUp size={14} color="rgba(255,255,255,0.4)" />
                : <ChevronDown size={14} color="rgba(255,255,255,0.4)" />}
            </button>
            {isOpen && (
              <div style={detailsWrapStyle}>
                {fields.map((field) => (
                  <div key={field.id}>
                    <span style={fieldLabelStyle}>{field.label || field.id}</span>
                    <p style={fieldValueStyle}>{sub.data?.[field.id] ?? '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const emptyIconWrap = {
  width: 48, height: 48, borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 12px',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  overflow: 'hidden',
};

const headerBtnStyle = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
};

const detailsWrapStyle = {
  padding: '12px 16px 16px',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  display: 'flex', flexDirection: 'column', gap: 8,
};

const fieldLabelStyle = {
  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

const fieldValueStyle = { fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: '2px 0 0' };