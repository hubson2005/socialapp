import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Trash2,
  Mail,
  Phone,
  UserPlus,
  Loader2,
  Download,
} from 'lucide-react';

import { toast } from 'sonner';
import { supabase } from '../../supabase';

// ─────────────────────────────────────────────────────────────
// Leads CRM Panel
// ─────────────────────────────────────────────────────────────
export default function LeadsCRMPanel({ profileId }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddLead, setShowAddLead] = useState(false);

  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    tag: 'prospect',
    notes: '',
  });

  const TAGS = [
    {
      id: 'prospect',
      label: 'Prospect',
      color: '#6366f1',
    },
    {
      id: 'chaud',
      label: '🔥 Chaud',
      color: '#ef4444',
    },
    {
      id: 'client',
      label: '✅ Client',
      color: '#22c55e',
    },
    {
      id: 'froid',
      label: '❄️ Froid',
      color: '#06b6d4',
    },
    {
      id: 'perdu',
      label: 'Perdu',
      color: '#6b7280',
    },
  ];

  useEffect(() => {
    if (!profileId) return;

    loadLeads();
  }, [profileId]);

  const loadLeads = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    setLeads(data || []);
    setLoading(false);
  };

  const addLead = async () => {
    if (!newLead.name.trim()) {
      toast.error('Nom requis');
      return;
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          ...newLead,
          profile_id: profileId,
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    setLeads((prev) => [data, ...prev]);

    setNewLead({
      name: '',
      email: '',
      phone: '',
      tag: 'prospect',
      notes: '',
    });

    setShowAddLead(false);

    toast.success('Lead ajouté');
  };

  const deleteLead = async (id) => {
    await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    setLeads((prev) =>
      prev.filter((l) => l.id !== id)
    );

    toast.success('Lead supprimé');
  };

  const updateTag = async (id, tag) => {
    await supabase
      .from('leads')
      .update({ tag })
      .eq('id', id);

    setLeads((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, tag } : l
      )
    );
  };

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();

    const matchSearch =
      !q ||
      (l.name || '')
        .toLowerCase()
        .includes(q) ||
      (l.email || '')
        .toLowerCase()
        .includes(q);

    const matchFilter =
      filter === 'all' || l.tag === filter;

    return matchSearch && matchFilter;
  });

  const tagCounts = TAGS.reduce((acc, t) => {
    acc[t.id] = leads.filter(
      (l) => l.tag === t.id
    ).length;

    return acc;
  }, {});

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '12px',
    color: 'white',
    outline: 'none',
    fontSize: '13px',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: 800,
              margin: 0,
            }}
          >
            Leads & CRM
          </h2>

          <p
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '14px',
              margin: '4px 0 0',
            }}
          >
            {leads.length} contact
            {leads.length > 1 ? 's' : ''} dans votre
            pipeline
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={() => {
              const csv = [
                'Nom,Email,Téléphone,Tag,Notes',
                ...leads.map((l) =>
                  [
                    l.name,
                    l.email,
                    l.phone,
                    l.tag,
                    l.notes,
                  ]
                    .map(
                      (v) =>
                        '"' + (v || '') + '"'
                    )
                    .join(',')
                ),
              ].join('\n');

              const a =
                document.createElement('a');

              a.href = URL.createObjectURL(
                new Blob([csv])
              );

              a.download = 'leads.csv';
              a.click();
            }}
            style={{
              height: '44px',
              padding: '0 18px',
              borderRadius: '12px',
              border:
                '1px solid rgba(255,255,255,0.1)',
              background:
                'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            Export CSV
          </button>

          <button
            onClick={() =>
              setShowAddLead((v) => !v)
            }
            style={{
              height: '44px',
              padding: '0 18px',
              borderRadius: '12px',
              border: 'none',
              background:
                'linear-gradient(135deg,#8b5cf6,#6366f1)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow:
                '0 10px 30px rgba(99,102,241,0.35)',
            }}
          >
            <Plus size={15} />
            Ajouter lead
          </button>
        </div>
      </div>

      {/* TAGS */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {TAGS.map((t) => (
          <button
            key={t.id}
            onClick={() =>
              setFilter(
                filter === t.id
                  ? 'all'
                  : t.id
              )
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: '999px',
              border:
                filter === t.id
                  ? '1px solid ' + t.color
                  : '1px solid rgba(255,255,255,0.08)',
              background:
                filter === t.id
                  ? t.color + '22'
                  : 'rgba(255,255,255,0.04)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: t.color,
              }}
            />

            {t.label}

            <span
              style={{
                background:
                  'rgba(255,255,255,0.08)',
                borderRadius: '6px',
                padding: '1px 6px',
                fontSize: '10px',
              }}
            >
              {tagCounts[t.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div
        style={{
          position: 'relative',
        }}
      >
        <Search
          size={16}
          color="rgba(255,255,255,0.3)"
          style={{
            position: 'absolute',
            top: '50%',
            left: '14px',
            transform: 'translateY(-50%)',
          }}
        />

        <input
          placeholder="Rechercher un lead..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: '100%',
            height: '44px',
            background: 'rgba(255,255,255,0.05)',
            border:
              '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            paddingLeft: '42px',
            color: 'white',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ADD LEAD */}
      <AnimatePresence>
        {showAddLead && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            style={{
              background:
                'rgba(255,255,255,0.04)',
              border:
                '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '18px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: '12px',
              }}
            >
              <input
                placeholder="Nom"
                value={newLead.name}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    name: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <input
                placeholder="Email"
                value={newLead.email}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    email: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <input
                placeholder="Téléphone"
                value={newLead.phone}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    phone: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <select
                value={newLead.tag}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    tag: e.target.value,
                  })
                }
                style={inputStyle}
              >
                {TAGS.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                  >
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={4}
              placeholder="Notes..."
              value={newLead.notes}
              onChange={(e) =>
                setNewLead({
                  ...newLead,
                  notes: e.target.value,
                })
              }
              style={{
                ...inputStyle,
                marginTop: '12px',
                resize: 'none',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '14px',
              }}
            >
              <button
                onClick={() =>
                  setShowAddLead(false)
                }
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border:
                    '1px solid rgba(255,255,255,0.08)',
                  background:
                    'rgba(255,255,255,0.05)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>

              <button
                onClick={addLead}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background:
                    'linear-gradient(135deg,#8b5cf6,#6366f1)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Ajouter le lead
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEADS LIST */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border:
            '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '20px',
          minHeight: '280px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div
            style={{
              height: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader2
              size={22}
              color="white"
              className="animate-spin"
            />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              height: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            <UserPlus size={28} />

            <p
              style={{
                marginTop: '12px',
                marginBottom: '4px',
                fontSize: '15px',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              Aucun lead pour l'instant
            </p>

            <span
              style={{
                fontSize: '12px',
              }}
            >
              Ajoutez vos premiers contacts
            </span>
          </div>
        ) : (
          filtered.map((lead) => {
            const tag = TAGS.find(
              (t) => t.id === lead.tag
            );

            return (
              <motion.div
                key={lead.id}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                style={{
                  padding: '16px',
                  borderBottom:
                    '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <h3
                    style={{
                      color: 'white',
                      margin: 0,
                      fontSize: '15px',
                    }}
                  >
                    {lead.name}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      gap: '14px',
                      marginTop: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {lead.email && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color:
                            'rgba(255,255,255,0.55)',
                          fontSize: '12px',
                        }}
                      >
                        <Mail size={12} />
                        {lead.email}
                      </div>
                    )}

                    {lead.phone && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color:
                            'rgba(255,255,255,0.55)',
                          fontSize: '12px',
                        }}
                      >
                        <Phone size={12} />
                        {lead.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <select
                    value={lead.tag}
                    onChange={(e) =>
                      updateTag(
                        lead.id,
                        e.target.value
                      )
                    }
                    style={{
                      background:
                        'rgba(255,255,255,0.05)',
                      border:
                        '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '8px',
                      color: 'white',
                    }}
                  >
                    {TAGS.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      deleteLead(lead.id)
                    }
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: 'none',
                      background:
                        'rgba(239,68,68,0.12)',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

