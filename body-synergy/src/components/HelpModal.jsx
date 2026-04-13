// src/components/HelpModal.jsx
import { useState } from 'react'
import '../styles/Detail.css'

export default function HelpModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="help-btn" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Справка
      </button>

      {open && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="modal-box">
            <div className="modal-box__title">🔥 Body Synergy</div>
            <div className="modal-box__body">
              <p>Твой личный трекер физического совершенства.</p>
              <p>
                <strong style={{ color: 'var(--red-glow)' }}>Главная</strong> —
                синергетический балл и три зоны тела. Нажми на карточку чтобы открыть тренировку.
              </p>
              <p>
                <strong style={{ color: 'var(--purple-glow)' }}>Уровни</strong> —
                программа по уровням сложности (скоро)
              </p>
              <p>
                <strong style={{ color: 'var(--blue-glow)' }}>Советы</strong> —
                мотивация и техника (скоро)
              </p>
              <p>
                <strong style={{ color: 'var(--pink)' }}>Позы</strong> —
                справочник (скоро)
              </p>
              <p>Отмечай упражнения — Total Synergy растёт с каждым шагом.</p>
            </div>
            <button className="modal-box__close" onClick={() => setOpen(false)}>
              Понял, начинаю!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
