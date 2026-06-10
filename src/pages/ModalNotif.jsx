import React from 'react';

export default function ModalNotif({
  S,
  C,
  newN,
  setNewN,
  closeModal,
  handleAddNotif,
}) {
  const TITLE_MAX = 100;
  const MESSAGE_MAX = 500;

  const isValid =
    newN.title.trim().length > 0 &&
    newN.message.trim().length > 0;

  return (
    <div style={S.backdrop}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.modalHead}>
          <h3 style={{ margin: 0 }}>
            Nouvelle notification
          </h3>

          <button
            style={S.iconBtn}
            onClick={closeModal}
          >
            ✕
          </button>
        </div>

        {/* Formulaire */}
        <div
          style={{
            display: 'grid',
            gap: 16,
          }}
        >
          {/* Titre */}
          <div>
            <label style={S.label}>
              Titre
            </label>

            <input
              style={S.input}
              placeholder="Ex : Maintenance prévue ce soir"
              maxLength={TITLE_MAX}
              value={newN.title}
              onChange={(e) =>
                setNewN({
                  ...newN,
                  title: e.target.value,
                })
              }
            />

            <div
              style={{
                textAlign: 'right',
                marginTop: 4,
                color: C.muted,
                fontSize: 12,
              }}
            >
              {newN.title.length}/{TITLE_MAX}
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={S.label}>
              Message
            </label>

            <textarea
              rows={6}
              placeholder="Décrivez votre notification..."
              maxLength={MESSAGE_MAX}
              value={newN.message}
              onChange={(e) =>
                setNewN({
                  ...newN,
                  message: e.target.value,
                })
              }
              style={{
                ...S.input,
                resize: 'vertical',
                minHeight: 140,
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                fontSize: 12,
              }}
            >
              <span style={{ color: C.muted }}>
                Maximum {MESSAGE_MAX} caractères
              </span>

              <span
                style={{
                  color:
                    newN.message.length >
                    MESSAGE_MAX * 0.9
                      ? '#ef4444'
                      : C.muted,
                  fontWeight: 600,
                }}
              >
                {newN.message.length}/{MESSAGE_MAX}
              </span>
            </div>
          </div>

          {/* Type */}
          <div>
            <label style={S.label}>
              Type de notification
            </label>

            <select
              style={S.input}
              value={newN.type}
              onChange={(e) =>
                setNewN({
                  ...newN,
                  type: e.target.value,
                })
              }
            >
              <option value="info">
                ℹ️ Information
              </option>

              <option value="success">
                ✅ Succès
              </option>

              <option value="warning">
                ⚠️ Alerte
              </option>

              <option value="error">
                ❌ Erreur
              </option>
            </select>
          </div>

          {/* Aperçu */}
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                color: '#fff',
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {newN.title || 'Titre de la notification'}
            </div>

            <div
              style={{
                color: C.muted,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {newN.message ||
                'Le contenu de votre notification apparaîtra ici.'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={S.modalActions}>
          <button
            style={S.btnGhost}
            onClick={closeModal}
          >
            Annuler
          </button>

          <button
            style={{
              ...S.btnPrimary,
              opacity: isValid ? 1 : 0.6,
              cursor: isValid
                ? 'pointer'
                : 'not-allowed',
            }}
            disabled={!isValid}
            onClick={handleAddNotif}
          >
            Ajouter la notification
          </button>
        </div>
      </div>
    </div>
  );
}