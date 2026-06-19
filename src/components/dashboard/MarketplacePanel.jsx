import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, X, Heart, ShoppingBag, Tag, Pencil, Trash2, ImagePlus, Check, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';

const MAX_PRODUCTS = 10;
const MAX_SIZE_KB = 2000;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (price) =>
  price ? Number(price).toLocaleString('fr-FR') + ' F' : '';

// ─── Modal ajout / édition produit ───────────────────────────────────────────
function ProductModal({ product, profileId, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    title: product?.title || '',
    price: product?.price || '',
    original_price: product?.original_price || '',
    description: product?.description || '',
    image_url: product?.image_url || '',
    is_available: product?.is_available !== false,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const discount = form.original_price && form.price
    ? Math.round((1 - Number(form.price) / Number(form.original_price)) * 100)
    : 0;

  // ✅ Fonction handleImageUpload ajoutée
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_KB * 1024) {
      toast.error(`Image trop lourde — max ${MAX_SIZE_KB} Ko`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      // ✅ APRÈS — bucket avatars qui existe déjà
const fileName = 'market-' + profileId + '-' + Date.now() + '.' + file.name.split('.').pop();
const { error: upErr } = await supabase.storage
  .from('avatars')
  .upload(fileName, file, { upsert: true });
if (upErr) throw upErr;
const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      set('image_url', data.publicUrl);
      toast.success('Photo uploadée !');
    } catch (err) {
      toast.error('Upload échoué : ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Le nom du produit est requis'); return; }
    if (!form.price) { toast.error('Le prix est requis'); return; }
    setSaving(true);
    try {
      const payload = {
        profile_id: Number(profileId),
        title: form.title.trim(),
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        description: form.description.trim() || null,
        image_url: form.image_url || null,
        is_available: form.is_available,
      };
      if (isEdit) {
        const { error } = await supabase.from('marketplace_products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('marketplace_products').insert([payload]);
        if (error) throw error;
      }
      toast.success(isEdit ? 'Produit modifié !' : 'Produit ajouté !');
      onSaved();
    } catch (err) { toast.error('Erreur : ' + err.message); }
    finally { setSaving(false); }
  };

  
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0a0817', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={16} color="white" />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 800, margin: 0 }}>{isEdit ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>Marketplace SocialApp</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', width: '32px', height: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Image */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Photo du produit</label>
            {form.image_url ? (
              <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '4/3' }}>
                <img src={form.image_url} alt="produit" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                    <ImagePlus size={13} /> Changer
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
                  </label>
                  <button onClick={() => set('image_url', '')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: '#f87171', fontSize: '12px', fontWeight: 600 }}>
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <label
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px', padding: '28px 16px', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', aspectRatio: '4/3' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,107,53,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                {uploading
                  ? <Loader2 size={24} color="rgba(255,107,53,0.8)" style={{ animation: 'spin 1s linear infinite' }} />
                  : <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImagePlus size={22} color="rgba(255,107,53,0.8)" /></div>
                }
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{uploading ? 'Upload en cours...' : 'Ajouter une photo'}</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>JPG, PNG — max 2 Mo</p>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Nom */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Nom du produit *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ex: Robe longue élégante rose"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(255,107,53,0.5)'; e.target.style.background = 'rgba(255,107,53,0.06)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
            />
          </div>

          {/* Prix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Prix (FCFA) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="7 000"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(255,107,53,0.5)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Prix barré
                {discount > 0 && (
                  <span style={{ marginLeft: '6px', background: 'rgba(34,197,94,0.2)', color: '#22c55e', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' }}>-{discount}%</span>
                )}
              </label>
              <input
                type="number"
                value={form.original_price}
                onChange={e => set('original_price', e.target.value)}
                placeholder="10 000"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', outline: 'none' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(255,107,53,0.5)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Description (optionnel)</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Décrivez votre produit..."
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: 'white', fontSize: '13px', outline: 'none', resize: 'none' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(255,107,53,0.5)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
            />
          </div>

          {/* Disponibilité */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px' }}>
            <div>
              <p style={{ color: 'white', fontSize: '13px', fontWeight: 600, margin: 0 }}>Produit disponible</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>Visible et commandable sur votre profil</p>
            </div>
            <button
              onClick={() => set('is_available', !form.is_available)}
              style={{ width: '44px', height: '24px', borderRadius: '100px', background: form.is_available ? '#22c55e' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}
            >
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: form.is_available ? '23px' : '3px', transition: 'left 0.3s' }} />
            </button>
          </div>

          {/* Bouton sauvegarder */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <Check size={16} />
            }
            {isEdit ? 'Enregistrer les modifications' : 'Ajouter le produit'}
          </button>
        </div>
      </motion.div>

      {/* Keyframe spin pour les Loader2 sans Tailwind */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Carte produit ────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete, onToggleFav, isFav }) {
  const discount = product.original_price && product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative', cursor: 'pointer' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f5f5f5,#e8e8e8)' }}>
            <ShoppingBag size={32} color="#ccc" />
          </div>
        )}
        {/* Badge réduction */}
        {discount > 0 && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#22c55e', borderRadius: '8px', padding: '3px 8px', fontSize: '12px', fontWeight: 700, color: 'white' }}>{discount}%</div>
        )}
        {/* Indisponible overlay */}
        {!product.is_available && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>INDISPONIBLE</span>
          </div>
        )}
        {/* Bouton favoris */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(product.id); }}
          style={{ position: 'absolute', top: '10px', right: '10px', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        >
          <Heart size={16} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#999'} />
        </button>
        {/* Actions admin */}
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '5px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(product); }}
            style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
          >
            <Pencil size={12} color="#555" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(product); }}
            style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
          >
            <Trash2 size={12} color="white" />
          </button>
        </div>
      </div>

      {/* Infos */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: product.original_price ? '#ef4444' : '#111', display: 'block', lineHeight: 1.1 }}>
            {formatPrice(product.price)}
          </span>
          {product.original_price && (
            <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>{formatPrice(product.original_price)}</span>
          )}
        </div>
        <p style={{ color: '#222', fontSize: '13px', fontWeight: 600, margin: 0, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.title}</p>
        {product.description && (
          <p style={{ color: '#888', fontSize: '11px', margin: '4px 0 0', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.description}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Panel principal Marketplace ─────────────────────────────────────────────
export default function MarketplacePanel({ profileId }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [favs, setFavs] = useState({});
  const PRODUCTS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['marketplace', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('profile_id', Number(profileId))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      return data;
    },
    enabled: !!profileId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('marketplace_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', profileId] });
      toast.success('Produit supprimé');
    },
    onError: (e) => toast.error('Erreur : ' + e.message),
  });

  const handleDelete = (product) => {
    if (!window.confirm(`Supprimer "${product.title}" ?`)) return;
    deleteMutation.mutate(product.id);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowModal(true);
  };

  const handleAdd = () => {
    if (products.length >= MAX_PRODUCTS) {
      toast.error(`Limite atteinte — maximum ${MAX_PRODUCTS} produits autorisés`);
      return;
    }
    setEditProduct(null);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditProduct(null);
    queryClient.invalidateQueries({ queryKey: ['marketplace', profileId] });
    setCurrentPage(Math.ceil((products.length + 1) / PRODUCTS_PER_PAGE));
  };

  const handleClose = () => {
    setShowModal(false);
    setEditProduct(null);
  };

  const toggleFav = (id) => setFavs(f => ({ ...f, [id]: !f[id] }));

  const atLimit = products.length >= MAX_PRODUCTS;
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
const endIndex = startIndex + PRODUCTS_PER_PAGE;

const currentProducts = products.slice(startIndex, endIndex);

  return (
    <>
      {/* ── Bloc principal ── */}
      <div style={{ background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '22px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#ff6b35,#f7c948)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag size={16} color="white" />
            </div>
            <div>
              <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 700, margin: 0 }}>Marketplace</h3>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>
                {products.length} / {MAX_PRODUCTS} produits
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={atLimit}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: atLimit ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#ff6b35,#f7c948)', border: atLimit ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '10px', color: atLimit ? 'rgba(255,255,255,0.3)' : 'white', fontSize: '12px', fontWeight: 700, cursor: atLimit ? 'not-allowed' : 'pointer' }}
          >
            <Plus size={13} />
            Ajouter
          </button>
        </div>

        {/* Barre de progression */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Produits utilisés</span>
            <span style={{ color: atLimit ? '#f97316' : 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 600 }}>{products.length} / {MAX_PRODUCTS}</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: (products.length / MAX_PRODUCTS * 100) + '%', background: atLimit ? 'linear-gradient(90deg,#f97316,#ef4444)' : 'linear-gradient(90deg,#ff6b35,#f7c948)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Grille produits */}
<div style={{ padding: '14px' }}>
  {isLoading ? (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 0'
      }}
    >
      <Loader2
        size={20}
        color="rgba(255,107,53,0.6)"
        style={{ animation: 'spin 1s linear infinite' }}
      />
    </div>
  ) : products.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(255,107,53,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px'
        }}
      >
        <PackageOpen size={24} color="rgba(255,107,53,0.6)" />
      </div>

      <p
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '14px',
          fontWeight: 600,
          margin: '0 0 6px'
        }}
      >
        Aucun produit
      </p>

      <p
        style={{
          color: 'rgba(255,255,255,0.25)',
          fontSize: '12px',
          margin: '0 0 16px',
          lineHeight: 1.5
        }}
      >
        Ajoutez vos premiers produits
        <br />
        pour les afficher sur votre profil
      </p>

      <button
        onClick={handleAdd}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '9px 18px',
          background: 'linear-gradient(135deg,#ff6b35,#f7c948)',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Plus size={14} /> Ajouter un produit
      </button>
    </div>
  ) : (
    <>
      {/* Produits */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}
      >
        <AnimatePresence>
          {currentProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              isFav={!!favs[p.id]}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFav={toggleFav}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '18px'
          }}
        >
          <button
            onClick={() =>
              setCurrentPage(prev =>
                Math.max(prev - 1, 1)
              )
            }
            disabled={currentPage === 1}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              cursor:
                currentPage === 1
                  ? 'not-allowed'
                  : 'pointer',
              background:
                currentPage === 1
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg,#ff6b35,#f7c948)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            Précédent
          </button>

          <span
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage(prev =>
                Math.min(prev + 1, totalPages)
              )
            }
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              cursor:
                currentPage === totalPages
                  ? 'not-allowed'
                  : 'pointer',
              background:
                currentPage === totalPages
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg,#ff6b35,#f7c948)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            Suivant
          </button>
        </div>
      )}
    </>
  )}
</div>

        {/* Footer info */}
        {products.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={11} color="rgba(255,255,255,0.3)" />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Les produits s'affichent sur votre profil public</span>
          </div>
        )}
      </div>

      {/* ✅ Modal via portal — AnimatePresence retiré du wrapper, géré en interne */}
      {showModal && ReactDOM.createPortal(
        <ProductModal
          product={editProduct}
          profileId={profileId}
          onClose={handleClose}
          onSaved={handleSaved}
        />,
        document.body
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

