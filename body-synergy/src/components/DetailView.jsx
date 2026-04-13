// src/components/DetailView.jsx
import { useState, useEffect, useRef } from 'react'
import '../styles/Detail.css'
import { useApp } from '../context/AppContext'
import { ZONES, ZONES_EXERCISES } from '../data/zones'

function fmtTime(s) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${r < 10 ? '0' : ''}${r}` : `${s}с`
}

function TimerButton({ ex }) {
  const [remaining, setRemaining] = useState(ex.timer)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef(null)

  // cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  function toggle() {
    if (running) {
      clearInterval(intervalRef.current)
      setRunning(false)
      setRemaining(ex.timer)
      setFinished(false)
      return
    }
    setRunning(true)
    setFinished(false)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setFinished(true)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const label = finished
    ? '✓ Готово!'
    : running
    ? `${fmtTime(remaining)} ▶ СТОП`
    : `⏱ ${fmtTime(ex.timer)}`

  return (
    <button
      className={`btn btn-timer${running ? ' btn-timer--running' : ''}`}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {label}
    </button>
  )
}

function ExerciseBlock({ ex, zone }) {
  const { state, dispatch } = useApp()
  const isDone = !!state.done[ex.id]
  const savedVal = state.results[ex.id] || ''

  function toggle() {
    dispatch({ type: 'TOGGLE_DONE', exId: ex.id, zonesExercises: ZONES_EXERCISES })
  }
  function saveResult(val) {
    dispatch({ type: 'SAVE_RESULT', exId: ex.id, value: val })
  }

  return (
    <div className={`ex-block${isDone ? ' ex-block--done' : ''}`}>
      <div className="ex-block__head">
        <div className="ex-block__icon" style={zone.icoStyle}>
          {ex.icon}
        </div>
        <div>
          <div className="ex-block__name" style={{ color: zone.nameColor }}>
            {ex.name}
          </div>
          <div className="ex-block__why">{ex.why}</div>
        </div>
      </div>

      <div className="ex-block__steps">
        {ex.steps.map((step, i) => (
          <div className="ex-block__step" key={i}>
            <div className="ex-block__step-num" style={{ color: zone.stepColor }}>
              {i + 1}
            </div>
            <div>{step}</div>
          </div>
        ))}
      </div>

      <div className="ex-block__actions">
        <button
          className={`btn btn-do${isDone ? ' btn-do--done' : ''}`}
          onClick={toggle}
        >
          {isDone ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              ГОТОВО
            </>
          ) : '○ ВЫПОЛНИТЬ'}
        </button>

        {ex.timer && <TimerButton ex={ex} />}

        <div className="result-row">
          <input
            className="result-input"
            type="number"
            placeholder={ex.target}
            defaultValue={savedVal}
            onChange={e => saveResult(e.target.value)}
          />
          <span className="result-label">{ex.metric}</span>
        </div>
      </div>
    </div>
  )
}

export default function DetailView() {
  const { state, dispatch } = useApp()
  const zone = state.currentZone ? ZONES[state.currentZone] : null

  useEffect(() => {
    if (zone) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [zone])

  if (!zone) return null

  const doneCount = zone.exercises.filter(e => state.done[e.id]).length
  const pct = Math.round((doneCount / zone.exercises.length) * 100)

  return (
    <div className="detail-view">
      {/* Header */}
      <div className="detail-view__header">
        <div
          className="detail-view__back"
          onClick={() => dispatch({ type: 'CLOSE_ZONE' })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </div>
        <div className="detail-view__title" style={{ color: zone.titleColor }}>
          {zone.emoji} {zone.name}
        </div>
      </div>

      {/* Body */}
      <div className="detail-view__body">
        {/* Motivation */}
        <div className="motiv-box">
          <div className="motiv-box__icon">{zone.emoji}</div>
          <p className="motiv-box__text">{zone.why}</p>
        </div>

        {/* Exercises */}
        {zone.exercises.map(ex => (
          <ExerciseBlock key={ex.id} ex={ex} zone={zone} />
        ))}

        {/* Progress */}
        <div className="sess-progress">
          <div className="sess-progress__title">📊 ПРОГРЕСС СЕССИИ</div>
          <div className="sess-progress__track">
            <div className="sess-progress__fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="sess-progress__text">
            {doneCount} из {zone.exercises.length} выполнено · {pct}%
          </div>
        </div>
      </div>
    </div>
  )
}
