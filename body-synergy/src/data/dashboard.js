// src/data/dashboard.js
// ============================================================
// ДАННЫЕ ДАШБОРДА — дневник, избранное, поиск, уведомления
// ============================================================

// ── localStorage keys ────────────────────────────────────
export const SK = {
    DIARY: 'bs_diary_v1',      // [{ id, date, text, mood, tags }]
    FAVORITES: 'bs_favs_v1',       // [{ id, type, ref }]
    THEME: 'bs_theme_v1',      // 'dark' | 'red'
    ONBOARDED: 'bs_onboarded_v1',  // boolean
    NOTIF: 'bs_notif_v1',      // { enabled, time }
    SYNERGY_HISTORY: 'bs_syn_hist_v1', // [{ date, value }]
    WORKOUT_HISTORY: 'bs_wh_v1',   // [{ date, dayId, doneCount, totalCount, duration }]
}

// ── MOODS ────────────────────────────────────────────────
export const MOODS = [
    {id: 'fire', emoji: '🔥', label: 'Огонь', color: '#e8304a'},
    {id: 'power', emoji: '💪', label: 'Сила', color: '#a855f7'},
    {id: 'calm', emoji: '🌊', label: 'Спокойствие', color: '#3b82f6'},
    {id: 'tired', emoji: '😮‍💨', label: 'Устал', color: '#5a4858'},
    {id: 'focused', emoji: '🎯', label: 'Фокус', color: '#fbbf24'},
]

// ── DIARY helpers ─────────────────────────────────────────
export function loadDiary() {
    try {
        return JSON.parse(localStorage.getItem(SK.DIARY)) || []
    } catch {
        return []
    }
}

export function saveDiary(entries) {
    try {
        localStorage.setItem(SK.DIARY, JSON.stringify(entries))
    } catch {
    }
}

export function addDiaryEntry(entry) {
    const entries = loadDiary()
    const newEntry = {...entry, id: Date.now().toString(), date: new Date().toISOString()}
    const updated = [newEntry, ...entries]
    saveDiary(updated)
    return updated
}

export function deleteDiaryEntry(id) {
    const updated = loadDiary().filter(e => e.id !== id)
    saveDiary(updated)
    return updated
}

// ── FAVORITES helpers ─────────────────────────────────────
export function loadFavorites() {
    try {
        return JSON.parse(localStorage.getItem(SK.FAVORITES)) || []
    } catch {
        return []
    }
}

export function toggleFavorite(item) {
    const favs = loadFavorites()
    const exists = favs.find(f => f.id === item.id && f.type === item.type)
    const updated = exists
        ? favs.filter(f => !(f.id === item.id && f.type === item.type))
        : [...favs, item]
    try {
        localStorage.setItem(SK.FAVORITES, JSON.stringify(updated))
    } catch {
    }
    return updated
}

export function isFavorite(id, type) {
    return loadFavorites().some(f => f.id === id && f.type === type)
}

// ── SYNERGY HISTORY ───────────────────────────────────────
export function loadSynergyHistory() {
    try {
        return JSON.parse(localStorage.getItem(SK.SYNERGY_HISTORY)) || []
    } catch {
        return []
    }
}

export function recordSynergy(value) {
    const history = loadSynergyHistory()
    const today = new Date().toISOString().slice(0, 10)
    const filtered = history.filter(h => h.date !== today)
    const updated = [...filtered, {date: today, value}].slice(-90) // keep 90 days
    try {
        localStorage.setItem(SK.SYNERGY_HISTORY, JSON.stringify(updated))
    } catch {
    }
}

// ── WORKOUT HISTORY ───────────────────────────────────────
export function loadWorkoutHistory() {
    try {
        return JSON.parse(localStorage.getItem(SK.WORKOUT_HISTORY)) || []
    } catch {
        return []
    }
}

// ── THEME ─────────────────────────────────────────────────
export function loadTheme() {
    try {
        return localStorage.getItem(SK.THEME) || 'dark'
    } catch {
        return 'dark'
    }
}

export function saveTheme(theme) {
    try {
        localStorage.setItem(SK.THEME, theme)
    } catch {
    }
}

// ── ONBOARDING ────────────────────────────────────────────
export function isOnboarded() {
    try {
        return !!localStorage.getItem(SK.ONBOARDED)
    } catch {
        return false
    }
}

export function setOnboarded() {
    try {
        localStorage.setItem(SK.ONBOARDED, '1')
    } catch {
    }
}

// ── SEARCH INDEX ──────────────────────────────────────────
// Built at runtime from all data files
export function buildSearchIndex(zones, levelsData, poses, tips, scenarios) {
    const items = []

    // Zones / exercises
    Object.values(zones).forEach(zone => {
        zone.exercises.forEach(ex => {
            items.push({
                id: `ex-${ex.id}`,
                type: 'exercise',
                title: ex.name,
                subtitle: zone.name,
                preview: ex.why,
                color: zone.nameColor,
                action: {type: 'OPEN_ZONE', zoneId: zone.id},
            })
        })
    })

    // Levels
    Object.values(levelsData).forEach(zone => {
        zone.subdirections.forEach(sd => {
            sd.levels.forEach(lvl => {
                items.push({
                    id: `lvl-${lvl.id}`,
                    type: 'level',
                    title: lvl.name,
                    subtitle: `${zone.name} → ${sd.name}`,
                    preview: lvl.description?.slice(0, 80) + '...',
                    color: zone.colorRaw,
                    action: {type: 'SET_TAB', tab: 'levels'},
                })
            })
        })
    })

    // Poses
    poses.forEach(pose => {
        items.push({
            id: `pose-${pose.id}`,
            type: 'pose',
            title: pose.name,
            subtitle: pose.tagline,
            preview: pose.description?.slice(0, 80) + '...',
            color: '#f472b6',
            action: {type: 'SET_TAB', tab: 'poses'},
            poseRef: pose,
        })
    })

    // Tips
    tips.forEach(tip => {
        items.push({
            id: `tip-${tip.id}`,
            type: 'tip',
            title: tip.title,
            subtitle: tip.categoryLabel,
            preview: tip.text?.slice(0, 80) + '...',
            color: tip.color,
            action: {type: 'SET_TAB', tab: 'tips'},
        })
    })

    // Scenarios
    scenarios.forEach(sc => {
        items.push({
            id: `sc-${sc.id}`,
            type: 'scenario',
            title: sc.title,
            subtitle: sc.mood,
            preview: sc.preview,
            color: sc.moodColor,
            action: {type: 'SET_TAB', tab: 'tips'},
        })
    })

    return items
}

export function searchIndex(index, query) {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return index
        .filter(item =>
            item.title?.toLowerCase().includes(q) ||
            item.subtitle?.toLowerCase().includes(q) ||
            item.preview?.toLowerCase().includes(q)
        )
        .slice(0, 12)
}

// ── NOTIFICATION helpers ──────────────────────────────────
export function requestNotifPermission() {
    if (!('Notification' in window)) return Promise.resolve('denied')
    return Notification.requestPermission()
}

export function scheduleNotification(title, body, delayMs) {
    if (Notification.permission !== 'granted') return
    setTimeout(() => new Notification(title, {body, icon: '/favicon.ico'}), delayMs)
}

export function loadNotifSettings() {
    try {
        return JSON.parse(localStorage.getItem(SK.NOTIF)) || {enabled: false, hour: 8}
    } catch {
        return {enabled: false, hour: 8}
    }
}

export function saveNotifSettings(settings) {
    try {
        localStorage.setItem(SK.NOTIF, JSON.stringify(settings))
    } catch {
    }
}

// ── DATE helpers ──────────────────────────────────────────
export function formatDate(isoString) {
    const d = new Date(isoString)
    return d.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})
}

export function todayStr() {
    return new Date().toISOString().slice(0, 10)
}

export function getLast7Days() {
    const days = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().slice(0, 10))
    }
    return days
}