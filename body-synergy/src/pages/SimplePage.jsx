// src/pages/SimplePage.jsx
import '../styles/Detail.css'

const PAGE_CONFIG = {
  levels: {
    modifier: 'simple-page--levels',
    title: 'УРОВНИ',
    sub: 'Программа тренировок по уровням сложности',
    icon: '🎯',
    desc: 'Здесь будут все уровни программы с детальным описанием упражнений, целей и прогресса',
  },
  tips: {
    modifier: 'simple-page--tips',
    title: 'МОТИВАЦИЯ / СОВЕТЫ',
    sub: 'Откровенные советы и мотивация для роста',
    icon: '💙',
    desc: 'Мотивирующие сценарии, советы по технике и объяснения пользы каждого упражнения для твоей жизни',
  },
  poses: {
    modifier: 'simple-page--poses',
    title: 'СЕКС ПОЗЫ',
    sub: 'Руководство по позам и технике',
    icon: '🌸',
    desc: 'Этот раздел находится в разработке',
  },
}

export default function SimplePage({ page }) {
  const cfg = PAGE_CONFIG[page]
  if (!cfg) return null

  return (
    <div className={`simple-page ${cfg.modifier} page-enter`}>
      <div className="simple-page__title">{cfg.title}</div>
      <div className="simple-page__sub">{cfg.sub}</div>
      <div className="soon-wrap">
        <div className="soon-wrap__icon">{cfg.icon}</div>
        <div className="soon-wrap__label">СКОРО</div>
        <div className="soon-wrap__desc">{cfg.desc}</div>
      </div>
    </div>
  )
}
