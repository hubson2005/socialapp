import React from 'react';

// ✅ Valeur par défaut sur S pour éviter un crash si le parent oublie de passer la prop
export default function ModalAddContact({
  S = {},
  newC,
  setNewC,
  closeModal,
  handleAddContact,
}) {
  const NAME_MAX = 80;

  // ✅ FIX Risque 1 : regex renforcée — exige au moins 6 chiffres réels en plus des caractères autorisés
  const isPhoneValid =
    !newC.phone ||
    (
      /^[+\d\s()-]{8,20}$/.test(newC.phone.trim()) &&
      newC.phone.replace(/\D/g, '').length >= 6
    );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid =
    !newC.email || emailRegex.test(newC.email.trim());

  const isValid =
    newC.name.trim().length > 0 &&
    newC.phone.trim().length > 0 &&
    isPhoneValid &&
    isEmailValid;

  const handleSubmit = () => {
    if (!isValid) return;
    handleAddContact();
  };

  // ✅ FIX UX 1 : support de la touche Entrée pour soumettre le formulaire
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit();
    }
  };

  return (
    <div
      style={S.overlay}
      onClick={(e) =>
        e.target === e.currentTarget && closeModal()
      }
      // ✅ onKeyDown sur l'overlay pour capturer Entrée depuis n'importe quel champ
      onKeyDown={handleKeyDown}
    >
      <div style={S.modal}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={S.mT}>
            ➕ Nouveau contact
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            Ajoutez un nouveau contact à votre CRM
          </div>
        </div>

        {/* Nom */}
        <div style={S.fg}>
          <label style={S.lbl}>Nom complet *</label>
          <input
            // ✅ FIX UX 2 : auto-focus sur le premier champ à l'ouverture du modal
            autoFocus
            style={S.inp}
            placeholder="Sophie Martin"
            maxLength={NAME_MAX}
            value={newC.name}
            onChange={(e) =>
              setNewC((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <div style={{ textAlign: 'right', fontSize: 12, marginTop: 4, opacity: 0.6 }}>
            {newC.name.length}/{NAME_MAX}
          </div>
        </div>

        {/* Téléphone */}
        <div style={S.fg}>
          <label style={S.lbl}>Téléphone *</label>
          <input
            type="tel"
            style={S.inp}
            placeholder="+225 07 00 00 00"
            value={newC.phone}
            onChange={(e) =>
              setNewC((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          {newC.phone && !isPhoneValid && (
            <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
              Numéro invalide (minimum 6 chiffres requis)
            </div>
          )}
        </div>

        {/* Email */}
        <div style={S.fg}>
          <label style={S.lbl}>Email</label>
          <input
            type="email"
            style={S.inp}
            placeholder="contact@mail.ci"
            value={newC.email}
            onChange={(e) =>
              setNewC((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          {newC.email && !isEmailValid && (
            <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
              Adresse email invalide
            </div>
          )}
        </div>

        {/* Catégorie */}
        <div style={S.fg}>
          <label style={S.lbl}>Catégorie</label>
          <select
            style={S.sel}
            value={newC.tag}
            onChange={(e) =>
              setNewC((prev) => ({ ...prev, tag: e.target.value }))
            }
          >
            <option value="Client">👤 Client</option>
            <option value="Prospect">🎯 Prospect</option>
            <option value="VIP">⭐ VIP</option>
          </select>
        </div>

        {/* Aperçu */}
        <div
          style={{
            marginTop: 10,
            padding: 14,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {newC.name || 'Nom du contact'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
            {newC.phone || 'Numéro de téléphone'}
          </div>
          {newC.email && (
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {newC.email}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 20,
          }}
        >
          <button style={S.btn('ghost')} onClick={closeModal}>
            Annuler
          </button>
          <button
            style={{
              ...S.btn(),
              opacity: isValid ? 1 : 0.6,
              cursor: isValid ? 'pointer' : 'not-allowed',
            }}
            disabled={!isValid}
            onClick={handleSubmit}
          >
            Ajouter le contact
          </button>
        </div>

      </div>
    </div>
  );
}