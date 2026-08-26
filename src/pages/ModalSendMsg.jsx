import React, { useEffect, useRef } from 'react';

// ✅ Valeurs par défaut sur S et C pour éviter un crash TypeError si le parent oublie ces props
export default function ModalSendMsg({
  S = {},
  C = {},
  AVAT = [],
  TAG_C = {},
  msgTarget,
  msgText,
  setMsgText,
  selectedTpl,
  setSelectedTpl,
  TEMPLATES = [],
  MAX_MSG = 1000,
  connected,
  sending,
  closeModal,
  handleSendMsg,
  WaIcon,
  Spinner,
}) {
  const target = msgTarget;

  // ✅ FIX UX 1 : fermeture au clavier — Échap ferme, Entrée n'envoie pas accidentellement
  // [FIX HOOKS] Ce useEffect doit être appelé à CHAQUE rendu, avant tout
  // `return` conditionnel. Auparavant le composant faisait `if (!target)
  // return null` avant ce Hook : dès que `msgTarget` passait de null à un
  // objet (ou l'inverse) pendant que le composant restait monté, le
  // nombre de Hooks appelés changeait d'un rendu à l'autre → crash React
  // ("Rendered fewer hooks than expected"). Le Hook est donc remonté ici,
  // et le `return null` déplacé juste en dessous.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  if (!target) return null;

  const tagColors = TAG_C[target.tag] || [
    'rgba(255,255,255,0.06)',
    C.textMute || '#4a4e6a',
  ];

  const canSend =
    connected &&
    !sending &&
    msgText.trim().length > 0;

  // ✅ FIX Bug bloquant : avatar UUID-safe
  // Si target.id est un UUID string, target.id % N = NaN → AVAT[NaN] = undefined → avatar invisible.
  // On utilise un hash simple sur la string pour obtenir un index stable et toujours valide.
  const getAvatarIndex = (id) => {
    if (!id || AVAT.length === 0) return 0;
    if (typeof id === 'number') return id % AVAT.length;
    // Hash de la string : somme des charCodes modulo la longueur du tableau
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) {
      hash = (hash + str.charCodeAt(i)) % AVAT.length;
    }
    return hash;
  };

  const avatarGrad = AVAT[getAvatarIndex(target.id)] || AVAT[0] || 'rgba(108,99,255,0.3)';

  // ✅ FIX Risque latent : selectedTpl normalisé en string pour que le <select> retrouve la bonne option
  const selectValue = selectedTpl != null ? String(selectedTpl) : '';

  // Template actuellement sélectionné (pour l'aperçu)
  const currentTpl = TEMPLATES.find(
    (t) => String(t.id) === selectValue
  ) || null;

  return (
    <div
      style={S.overlay}
      onClick={(e) =>
        e.target === e.currentTarget && closeModal()
      }
    >
      <div style={S.modal}>

        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            Envoyer un message WhatsApp
          </h3>
          <button
            onClick={closeModal}
            aria-label="Fermer"
            style={{
              background: 'transparent',
              border: 'none',
              color: C.text || '#fff',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* CONTACT */}
        <div style={{ ...S.card, marginBottom: 16, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                // ✅ avatarGrad toujours défini même pour un UUID
                background: avatarGrad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {target.name?.charAt(0)?.toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: C.text || '#fff' }}>
                {target.name}
              </div>
              <div style={{ color: C.textMute || '#4a4e6a', fontSize: 13 }}>
                {target.phone}
              </div>
            </div>

            {target.tag && (
              <span
                style={{
                  display: 'inline-flex',
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  background: tagColors[0],
                  color: tagColors[1],
                }}
              >
                {target.tag}
              </span>
            )}
          </div>

          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(37,211,102,0.08)',
              border: '1px solid rgba(37,211,102,0.2)',
              color: '#25D366',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            WhatsApp : {target.phone}
          </div>
        </div>

        {/* TEMPLATE */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.lbl}>Modèle de message</label>
          <select
            // ✅ FIX Risque latent : valeur normalisée en string pour correspondre aux options
            value={selectValue}
            style={S.sel}
            onChange={(e) => {
              const value = e.target.value;
              // On stocke l'id en number pour rester cohérent avec TEMPLATES
              setSelectedTpl(value ? Number(value) : null);
              if (!value) return;
              const tpl = TEMPLATES.find(
                (t) => String(t.id) === value
              );
              if (tpl) setMsgText(tpl.text);
            }}
          >
            <option value="">Choisir un modèle</option>
            {TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={String(tpl.id)}>
                {tpl.name}
              </option>
            ))}
          </select>

          {/* ✅ FIX UX 2 : aperçu du template directement sous le select */}
          {currentTpl && (
            <div
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(108,99,255,0.08)',
                border: '1px solid rgba(108,99,255,0.25)',
                fontSize: 12,
                lineHeight: 1.6,
                color: C.textSub || '#8b8fa8',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: C.purpleL || '#8b84ff',
                  marginBottom: 4,
                }}
              >
                Aperçu
              </div>
              {currentTpl.text}
            </div>
          )}
        </div>

        {/* MESSAGE */}
        <div>
          <label style={S.lbl}>Message</label>
          <textarea
            rows={8}
            value={msgText}
            maxLength={MAX_MSG}
            placeholder="Saisissez votre message..."
            onChange={(e) => setMsgText(e.target.value)}
            style={{ ...S.ta, minHeight: 180, marginTop: 8 }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            <span style={{ color: C.textMute || '#4a4e6a' }}>
              Maximum {MAX_MSG} caractères
            </span>
            <span
              style={{
                color:
                  msgText.length > MAX_MSG * 0.9
                    ? '#ef4444'
                    : C.textMute || '#4a4e6a',
                fontWeight: 600,
              }}
            >
              {msgText.length}/{MAX_MSG}
            </span>
          </div>
        </div>

        {/* AVERTISSEMENT CONNEXION */}
        {!connected && (
          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
              fontSize: 12,
            }}
          >
            Connectez d'abord votre webhook Make.com dans les paramètres.
          </div>
        )}

        {/* ACTIONS */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 22,
          }}
        >
          <button style={S.btn('ghost')} onClick={closeModal}>
            Annuler
          </button>
          <button
            style={{
              ...S.btn('green', sending),
              opacity: canSend ? 1 : 0.6,
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
            disabled={!canSend}
            onClick={handleSendMsg}
          >
            {sending ? (
              <><Spinner /> Envoi...</>
            ) : (
              <><WaIcon size={16} color="#25D366" /> Envoyer</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}