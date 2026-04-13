// src/pages/Poses.jsx
import {useState, useMemo} from 'react'
import '../styles/Poses.css'
import {
    POSES, CATEGORIES, PENETRATION, CLITORIS, DIFFICULTY,
} from '../data/poses'

// ── Icons ─────────────────────────────────────────────────
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
)
const ArrowRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
    </svg>
)

// ── Pose Card ─────────────────────────────────────────────
function PoseCard({pose, onClick}) {
    const diff = DIFFICULTY[pose.difficulty]
    const cat = CATEGORIES[pose.category]
    const pen = PENETRATION[pose.penetration]
    const clit = CLITORIS[pose.clitoris]

    // Prefer gif > image for card thumbnail
    const cardMedia = pose.media.gif || pose.media.image

    return (
        <div className="pose-card" onClick={() => onClick(pose)}>
            {/* Media */}
            <div className="pose-card__media">
                {cardMedia
                    ? <img src={cardMedia} alt={pose.name} className="pose-card__img"/>
                    : (
                        <div className="pose-card__placeholder">
                            <div className="pose-card__placeholder-icon">📷</div>
                            <div className="pose-card__placeholder-text">Добавь фото / гифку</div>
                        </div>
                    )
                }
                <span className="pose-card__diff" style={{color: diff.color}}>{diff.label}</span>
                <span className="pose-card__cat">{cat.icon} {cat.label}</span>
            </div>

            {/* Body */}
            <div className="pose-card__body">
                <div className="pose-card__name">{pose.name}</div>
                <div className="pose-card__tagline">{pose.tagline}</div>
                <div className="pose-card__tags">
                    {pose.penetration !== 'none' && (
                        <span className="pose-tag pose-tag--pen">🔱 {pen.label}</span>
                    )}
                    {pose.clitoris !== 'none' && (
                        <span className="pose-tag pose-tag--clit">✦ {clit.label}</span>
                    )}
                    {pose.bdsm && <span className="pose-tag pose-tag--bdsm">⛓ БДСМ</span>}
                    {pose.toys && <span className="pose-tag pose-tag--toys">🎲 Игрушки</span>}
                </div>
            </div>
        </div>
    )
}

// ── Pose Modal ────────────────────────────────────────────
function PoseModal({pose, onClose}) {
    const [mediaTab, setMediaTab] = useState(
        pose.media.gif ? 'gif' : pose.media.image ? 'image' : pose.media.video ? 'video' : null
    )

    const hasGif = !!pose.media.gif
    const hasImage = !!pose.media.image
    const hasVideo = !!pose.media.video
    const hasAny = hasGif || hasImage || hasVideo

    const diff = DIFFICULTY[pose.difficulty]
    const cat = CATEGORIES[pose.category]
    const pen = PENETRATION[pose.penetration]
    const clit = CLITORIS[pose.clitoris]

    function renderMedia() {
        if (!hasAny) {
            return (
                <div className="pose-modal__no-media">
                    <span style={{fontSize: 40, opacity: 0.2}}>📷</span>
                    <p>Медиа не добавлено — укажи image/gif/video в poses.js</p>
                </div>
            )
        }
        if (mediaTab === 'video' && hasVideo) {
            return <video src={pose.media.video} controls autoPlay muted loop className="pose-modal__media-img"/>
        }
        const src = mediaTab === 'gif' ? pose.media.gif : pose.media.image
        return <img src={src} alt={pose.name} className="pose-modal__media-img"/>
    }

    return (
        <div className="pose-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="pose-modal">

                {/* Media header */}
                <div className="pose-modal__media">
                    {renderMedia()}
                    <div className="pose-modal__media-overlay"/>

                    {/* Media tabs — only show if >1 type available */}
                    {[hasGif, hasImage, hasVideo].filter(Boolean).length > 1 && (
                        <div className="pose-modal__media-tabs">
                            {hasGif && <button className={`pose-modal__media-tab${mediaTab === 'gif' ? ' active' : ''}`}
                                               onClick={() => setMediaTab('gif')}>GIF</button>}
                            {hasImage &&
                                <button className={`pose-modal__media-tab${mediaTab === 'image' ? ' active' : ''}`}
                                        onClick={() => setMediaTab('image')}>Фото</button>}
                            {hasVideo &&
                                <button className={`pose-modal__media-tab${mediaTab === 'video' ? ' active' : ''}`}
                                        onClick={() => setMediaTab('video')}>Видео</button>}
                        </div>
                    )}

                    <button className="pose-modal__close" onClick={onClose}><CloseIcon/></button>
                </div>

                {/* Body */}
                <div className="pose-modal__body">
                    <div className="pose-modal__top">
                        <div>
                            <div className="pose-modal__name">{pose.name}</div>
                            <div className="pose-modal__tagline">{pose.tagline}</div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="pose-modal__tags">
            <span className="pose-tag pose-tag--pen" style={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.12)',
                color: diff.color
            }}>
              Сложность: {diff.label}
            </span>
                        <span className="pose-tag pose-tag--pen">{cat.icon} {cat.label}</span>
                        {pose.penetration !== 'none' && <span className="pose-tag pose-tag--pen">🔱 {pen.label}</span>}
                        {pose.clitoris !== 'none' &&
                            <span className="pose-tag pose-tag--clit">✦ Клитор: {clit.label}</span>}
                        {pose.bdsm && <span className="pose-tag pose-tag--bdsm">⛓ БДСМ</span>}
                        {pose.toys && <span className="pose-tag pose-tag--toys">🎲 Игрушки</span>}
                    </div>

                    {/* Description */}
                    <div className="pose-modal__section-title">Описание</div>
                    <div className="pose-modal__desc">{pose.description}</div>

                    {/* Technique */}
                    <div className="pose-modal__section-title">Техника</div>
                    <div className="pose-modal__technique">
                        {pose.technique.map((step, i) => (
                            <div key={i} className="pose-modal__technique-item">
                                <span className="pose-modal__technique-num">{i + 1}</span>
                                <span>{step}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tip */}
                    <div className="pose-modal__tip">{pose.tip}</div>

                    {/* Requirements */}
                    {pose.requirements && pose.requirements.length > 0 && (
                        <>
                            <div className="pose-modal__section-title">Подготовка — рекомендуемые уровни</div>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20}}>
                                {pose.requirements.map((req, i) => (
                                    <div key={i} className="pose-modal__training">
                                        <ArrowRight/>
                                        {req.label}
                                        {req.level && (
                                            <span style={{
                                                marginLeft: 4,
                                                padding: '1px 7px',
                                                borderRadius: 100,
                                                background: 'rgba(139,60,255,0.15)',
                                                border: '1px solid rgba(139,60,255,0.3)',
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: 'var(--purple-glow)'
                                            }}>
                        Ур.{req.level}+
                      </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Filter Pill ───────────────────────────────────────────
function Pill({label, icon, active, onClick, type}) {
    return (
        <button
            className={`filter-pill${active ? ' active' : ''}`}
            data-type={type}
            onClick={onClick}
        >
            {icon && <span>{icon}</span>}
            {label}
        </button>
    )
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function Poses() {
    const [selectedPose, setSelectedPose] = useState(null)

    // Filters state
    const [activeCategories, setActiveCategories] = useState([])
    const [activePenetration, setActivePenetration] = useState([])
    const [activeClitoris, setActiveClitoris] = useState([])
    const [bdsm, setBdsm] = useState(false)
    const [toys, setToys] = useState(false)

    function toggleArr(arr, setArr, val) {
        setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
    }

    // Filtered poses
    const filtered = useMemo(() => {
        return POSES.filter(p => {
            if (activeCategories.length && !activeCategories.includes(p.category)) return false
            if (activePenetration.length && !activePenetration.includes(p.penetration)) return false
            if (activeClitoris.length && !activeClitoris.includes(p.clitoris)) return false
            if (bdsm && !p.bdsm) return false
            if (toys && !p.toys) return false
            return true
        })
    }, [activeCategories, activePenetration, activeClitoris, bdsm, toys])

    return (
        <div className="poses-page page-enter">

            <div className="poses-header">
                <div className="poses-header__title">ПОЗЫ</div>
                <div className="poses-header__sub">Руководство с техникой, советами и связью с тренировками</div>

                <div className="poses-filters">
                    {/* Category */}
                    <div className="poses-filter-row">
                        <span className="poses-filter-label">Категория</span>
                        <div className="poses-filter-pills">
                            {Object.values(CATEGORIES).map(cat => (
                                <Pill
                                    key={cat.id}
                                    label={cat.label}
                                    icon={cat.icon}
                                    type="category"
                                    active={activeCategories.includes(cat.id)}
                                    onClick={() => toggleArr(activeCategories, setActiveCategories, cat.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Penetration */}
                    <div className="poses-filter-row">
                        <span className="poses-filter-label">Проникновение</span>
                        <div className="poses-filter-pills">
                            {Object.values(PENETRATION).map(p => (
                                <Pill
                                    key={p.id}
                                    label={p.label}
                                    type="penetration"
                                    active={activePenetration.includes(p.id)}
                                    onClick={() => toggleArr(activePenetration, setActivePenetration, p.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Clitoris */}
                    <div className="poses-filter-row">
                        <span className="poses-filter-label">Клитор</span>
                        <div className="poses-filter-pills">
                            {Object.values(CLITORIS).map(c => (
                                <Pill
                                    key={c.id}
                                    label={c.label}
                                    type="clitoris"
                                    active={activeClitoris.includes(c.id)}
                                    onClick={() => toggleArr(activeClitoris, setActiveClitoris, c.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* BDSM + Toys */}
                    <div className="poses-filter-row">
                        <span className="poses-filter-label">Дополнительно</span>
                        <div className="poses-filter-pills">
                            <Pill label="БДСМ" icon="⛓️" type="bdsm" active={bdsm} onClick={() => setBdsm(v => !v)}/>
                            <Pill label="Игрушки" icon="🎲" type="toys" active={toys} onClick={() => setToys(v => !v)}/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="poses-divider"/>
            <div className="poses-count">
                Найдено: <span>{filtered.length}</span> из {POSES.length}
            </div>

            <div className="poses-grid">
                {filtered.map(pose => (
                    <PoseCard key={pose.id} pose={pose} onClick={setSelectedPose}/>
                ))}
                {filtered.length === 0 && (
                    <div style={{
                        gridColumn: '1/-1',
                        textAlign: 'center',
                        padding: '60px 0',
                        color: 'var(--text-muted)'
                    }}>
                        Нет поз с такими фильтрами. Попробуй убрать часть фильтров.
                    </div>
                )}
            </div>

            {selectedPose && (
                <PoseModal pose={selectedPose} onClose={() => setSelectedPose(null)}/>
            )}
        </div>
    )
}