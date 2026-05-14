import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Loader2, Trash2, Eye, EyeOff, ExternalLink, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '../../supabase';

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const PLAN_DOC_LIMITS = {
  basic:    1,
  pro:      3,
  business: 5,
  admin:    999,
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
};

// ─── Modal ajout document ─────────────────────────────────────────────────────
function AddDocumentModal({ profileId, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Seuls les fichiers PDF sont acceptés'); return; }
    if (f.size > MAX_SIZE_BYTES) { toast.error('Fichier trop lourd — max ' + MAX_SIZE_MB + ' Mo'); return; }
    setFile(f);
    if (!name) setName(f.name.replace(/\.pdf$/i, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Donnez un nom au document'); return; }
    if (!file) { toast.error('Sélectionnez un fichier PDF'); return; }
    setUploading(true);
    try {
      const fileName = 'doc-' + profileId + '-' + Date.now() + '.pdf';
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('profile_documents').insert([{
        profile_id: Number(profileId),
        name: name.trim(),
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: file.size,
        is_visible: true,
      }]);
      if (dbError) throw dbError;

      toast.success('Document ajouté !');
      onSaved();
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const canSave = !uploading && !!file && !!name.trim();

  return (
    // ✅ AnimatePresence retiré du portal — géré via motion.div interne
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0a0817', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} color="white" />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 800, margin: 0 }}>Ajouter un document</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>PDF uniquement · {MAX_SIZE_MB} Mo max</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', width: '32px', height: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Nom du document */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Nom affiché *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : Plaquette entreprise 2025"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(239,68,68,0.5)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
            />
          </div>

          {/* Zone upload PDF */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Fichier PDF *
            </label>

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} color="#ef4444" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>{formatSize(file.size)}</div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', width: '26px', height: '26px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: dragOver ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: '2px dashed ' + (dragOver ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'), borderRadius: '14px', padding: '28px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={22} color="rgba(239,68,68,0.7)" />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 500, margin: 0 }}>
                  {dragOver ? 'Déposez le fichier ici' : 'Glissez ou cliquez pour choisir'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>PDF uniquement · max {MAX_SIZE_MB} Mo</p>
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])}
                />
              </label>
            )}
          </div>

          {/* Bouton save */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '13px',
              background: canSave ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'rgba(255,255,255,0.08)',
              border: 'none', borderRadius: '14px',
              color: canSave ? 'white' : 'rgba(255,255,255,0.3)',
              fontSize: '14px', fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {uploading
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <FileText size={16} />
            }
            {uploading ? 'Upload en cours...' : 'Ajouter le document'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Panel principal Documents ────────────────────────────────────────────────
export default function DocumentsPanel({ profileId, userPlan = 'basic' }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const maxDocs = PLAN_DOC_LIMITS[userPlan] ?? PLAN_DOC_LIMITS.basic;

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_documents')
        .select('*')
        .eq('profile_id', Number(profileId))
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
    enabled: !!profileId,
    retry: false,
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_visible }) => {
      const { error } = await supabase.from('profile_documents').update({ is_visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', profileId] }),
    onError: e => toast.error('Erreur : ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, file_name }) => {
      if (file_name) {
        await supabase.storage.from('documents').remove([file_name]);
      }
      const { error } = await supabase.from('profile_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', profileId] });
      toast.success('Document supprimé');
    },
    onError: e => toast.error('Erreur : ' + e.message),
  });

  const handleDelete = (doc) => {
    if (!window.confirm(`Supprimer "${doc.name}" ?`)) return;
    deleteMutation.mutate({ id: doc.id, file_name: doc.file_name });
  };

  const atLimit = documents.length >= maxDocs;

  const handleOpenModal = () => {
    if (atLimit) {
      toast.error(`Limite atteinte — max ${maxDocs === 999 ? '∞' : maxDocs} documents pour votre offre`);
      return;
    }
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    queryClient.invalidateQueries({ queryKey: ['documents', profileId] });
  };

  return (
    <>
      <div style={{ background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '22px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={16} color="white" />
            </div>
            <div>
              <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 700, margin: 0 }}>Mes documents</h3>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>
                {documents.length} / {maxDocs === 999 ? '∞' : maxDocs} documents
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: atLimit ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#ef4444,#b91c1c)', border: atLimit ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '10px', color: atLimit ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {/* Barre de progression */}
        {maxDocs !== 999 && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Documents utilisés</span>
              <span style={{ color: atLimit ? '#f97316' : 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 600 }}>{documents.length} / {maxDocs}</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: Math.min((documents.length / maxDocs) * 100, 100) + '%', background: atLimit ? 'linear-gradient(90deg,#f97316,#ef4444)' : 'linear-gradient(90deg,#ef4444,#b91c1c)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* Liste documents */}
        <div style={{ padding: '12px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Loader2 size={18} color="rgba(239,68,68,0.6)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <FileText size={24} color="rgba(239,68,68,0.6)" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, margin: '0 0 5px' }}>Aucun document</p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: '0 0 16px', lineHeight: 1.5 }}>
                Ajoutez votre plaquette, catalogue<br />ou présentation PDF
              </p>
              <button
                onClick={handleOpenModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Plus size={14} /> Ajouter un document
              </button>
            </div>
          ) : (
            <AnimatePresence>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documents.map(doc => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={18} color="#ef4444" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        {doc.file_size && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{formatSize(doc.file_size)}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: doc.is_visible ? '#22c55e' : 'rgba(255,255,255,0.2)' }} />
                          <span style={{ fontSize: '10px', color: doc.is_visible ? '#22c55e' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                            {doc.is_visible ? 'Visible' : 'Masqué'}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => toggleVisibility.mutate({ id: doc.id, is_visible: !doc.is_visible })}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', background: doc.is_visible ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.07)', border: '1px solid ' + (doc.is_visible ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: doc.is_visible ? '#22c55e' : 'rgba(255,255,255,0.4)' }}
                      >
                        {doc.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {documents.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={11} color="rgba(255,255,255,0.3)" />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Les documents s'affichent sur votre profil public</span>
          </div>
        )}
      </div>

      {/* ✅ Portal sans AnimatePresence — les animations sont gérées en interne par motion.div */}
      {showModal && ReactDOM.createPortal(
        <AddDocumentModal
          profileId={profileId}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />,
        document.body
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}