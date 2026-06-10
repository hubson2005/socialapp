import React from 'react';

export default function ModalSendMsg({
  S,
  C,
  AVAT,
  TAG_C,
  msgTarget,
  msgText,
  setMsgText,
  selectedTpl,
  setSelectedTpl,
  TEMPLATES,
  MAX_MSG,
  connected,
  sending,
  closeModal,
  handleSendMsg,
  WaIcon,
  Spinner,
}) {
  const target = msgTarget;

  if (!target) return null;

  const tagColors = TAG_C[target.tag] || [
    'rgba(255,255,255,0.06)',
    C.textMute,
  ];

  const canSend =
    connected &&
    !sending &&
    msgText.trim().length > 0;

  return (
    <div
      style={S.overlay}
      onClick={(e) =>
        e.target === e.currentTarget &&
        closeModal()
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
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Envoyer un message WhatsApp
          </h3>

          <button
            onClick={closeModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.text,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {/* CONTACT */}
        <div
          style={{
            ...S.card,
            marginBottom: 16,
            padding: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background:
                  AVAT[
                    target.id
                      ? target.id % AVAT.length
                      : 0
                  ],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {target.name
                ?.charAt(0)
                ?.toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: C.text,
                }}
              >
                {target.name}
              </div>

              <div
                style={{
                  color: C.textMute,
                  fontSize: 13,
                }}
              >
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
              background:
                'rgba(37,211,102,0.08)',
              border:
                '1px solid rgba(37,211,102,0.2)',
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
          <label style={S.lbl}>
            Modèle de message
          </label>

          <select
            value={selectedTpl || ''}
            style={S.sel}
            onChange={(e) => {
              const value = e.target.value;

              setSelectedTpl(value);

              if (!value) return;

              const tpl = TEMPLATES.find(
                (t) =>
                  t.id === Number(value)
              );

              if (tpl) {
                setMsgText(tpl.text);
              }
            }}
          >
            <option value="">
              Choisir un modèle
            </option>

            {TEMPLATES.map((tpl) => (
              <option
                key={tpl.id}
                value={tpl.id}
              >
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* MESSAGE */}
        <div>
          <label style={S.lbl}>
            Message
          </label>

          <textarea
            rows={8}
            value={msgText}
            maxLength={MAX_MSG}
            placeholder="Saisissez votre message..."
            onChange={(e) =>
              setMsgText(e.target.value)
            }
            style={{
              ...S.ta,
              minHeight: 180,
              marginTop: 8,
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            <span
              style={{
                color: C.textMute,
              }}
            >
              Maximum {MAX_MSG} caractères
            </span>

            <span
              style={{
                color:
                  msgText.length >
                  MAX_MSG * 0.9
                    ? '#ef4444'
                    : C.textMute,
                fontWeight: 600,
              }}
            >
              {msgText.length}/{MAX_MSG}
            </span>
          </div>
        </div>

        {/* CONNEXION */}
        {!connected && (
          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 8,
              background:
                'rgba(239,68,68,0.08)',
              border:
                '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
              fontSize: 12,
            }}
          >
            Connectez d'abord votre webhook
            Make.com dans les paramètres.
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
          <button
            style={S.btn('ghost')}
            onClick={closeModal}
          >
            Annuler
          </button>

          <button
            style={{
              ...S.btn('green', sending),
              opacity: canSend ? 1 : 0.6,
              cursor: canSend
                ? 'pointer'
                : 'not-allowed',
            }}
            disabled={!canSend}
            onClick={handleSendMsg}
          >
            {sending ? (
              <>
                <Spinner />
                Envoi...
              </>
            ) : (
              <>
                <WaIcon
                  size={16}
                  color="#25D366"
                />
                Envoyer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}