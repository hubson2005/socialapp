import React from 'react';

export default function ModalCampaign({
  S,
  C,
  AVAT,
  TAG_C,
  contacts,
  newCam,
  setNewCam,
  camStep,
  setCamStep,
  closeModal,
  handleLaunchCampaign,
  TEMPLATES,
  MAX_MSG,
}) {
  return (
    <div style={S.backdrop}>
      <div style={S.modal}>
        <div style={S.modalHead}>
          <h3 style={{ margin: 0 }}>Nouvelle campagne</h3>

          <button style={S.iconBtn} onClick={closeModal}>
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={S.label}>Nom de la campagne</label>

            <input
              style={S.input}
              value={newCam.name}
              onChange={(e) =>
                setNewCam({
                  ...newCam,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label style={S.label}>Template</label>

            <select
              style={S.input}
              value={newCam.template}
              onChange={(e) =>
                setNewCam({
                  ...newCam,
                  template: e.target.value,
                })
              }
            >
              <option value="">Choisir...</option>

              {TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={S.label}>
              Délai entre messages (secondes)
            </label>

            <input
              type="number"
              style={S.input}
              value={camStep}
              onChange={(e) =>
                setCamStep(Number(e.target.value))
              }
            />
          </div>

          <div>
            <label style={S.label}>Message</label>

            <textarea
              rows={6}
              maxLength={MAX_MSG}
              style={S.input}
              value={newCam.message}
              onChange={(e) =>
                setNewCam({
                  ...newCam,
                  message: e.target.value,
                })
              }
            />
          </div>

          <div
            style={{
              color: C.muted,
              fontSize: 13,
            }}
          >
            Contacts ciblés : {contacts.length}
          </div>
        </div>

        <div style={S.modalActions}>
          <button style={S.btnGhost} onClick={closeModal}>
            Annuler
          </button>

          <button
            style={S.btnPrimary}
            onClick={handleLaunchCampaign}
          >
            Lancer la campagne
          </button>
        </div>
      </div>
    </div>
  );
}