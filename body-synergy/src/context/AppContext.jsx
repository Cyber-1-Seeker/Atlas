// src/context/AppContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react'

const STORAGE_KEY = 'bs_v3'

const defaultState = {
  currentTab:  'home',
  currentZone: null,
  synergy:     69,
  scores:      { hands: 42, legs: 88, groin: 75 },
  done:        {},
  results:     {},
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    // only persist these keys
    const { synergy, scores, done, results } = parsed
    return { synergy, scores, done, results }
  } catch { return {} }
}

function reducer(state, action) {
  switch (action.type) {

    case 'SET_TAB':
      return { ...state, currentTab: action.tab, currentZone: null }

    case 'OPEN_ZONE':
      return { ...state, currentZone: action.zoneId }

    case 'CLOSE_ZONE':
      return { ...state, currentZone: null }

    case 'TOGGLE_DONE': {
      const done = { ...state.done, [action.exId]: !state.done[action.exId] }
      const doneCount = Object.values(done).filter(Boolean).length
      const synergy = Math.min(99, 69 + doneCount * 2)
      const scores = { ...state.scores }
      const baseScores = { hands: 42, legs: 88, groin: 75 }
      const ZONES_EX = action.zonesExercises
      Object.keys(ZONES_EX).forEach(zid => {
        const cnt = ZONES_EX[zid].filter(e => done[e.id]).length
        scores[zid] = baseScores[zid] + cnt * 5
      })
      return { ...state, done, synergy, scores }
    }

    case 'SAVE_RESULT':
      return { ...state, results: { ...state.results, [action.exId]: action.value } }

    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const saved = loadState()
  const [state, dispatch] = useReducer(reducer, { ...defaultState, ...saved })

  useEffect(() => {
    try {
      const { synergy, scores, done, results } = state
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ synergy, scores, done, results }))
    } catch {}
  }, [state.synergy, state.scores, state.done, state.results])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
