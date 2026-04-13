import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════
const KEY = "nikonichi_v4";
const initState = () => ({
  activeDay: null, activePage: null,
  completedTasks: {}, completedDays: {},
  note: "", directionNotes: {},
  rep: { discipline: 0, focus: 0, creativity: 0, practice: 0 },
  contract: null, contractHistory: [],
  bossHistory: {},
});

function createStore(init) {
  let state = (() => {
    try { const s = localStorage.getItem(KEY); return s ? { ...init(), ...JSON.parse(s) } : init(); }
    catch { return init(); }
  })();
  const ls = new Set();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  return {
    get: () => state,
    set: (fn) => { state = { ...state, ...fn(state) }; save(); ls.forEach(l => l()); },
    sub: (l) => { ls.add(l); return () => ls.delete(l); },
  };
}
const store = createStore(initState);
function useStore() {
  const [s, setS] = useState(store.get());
  useEffect(() => store.sub(() => setS({ ...store.get() })), []);
  return s;
}

const today = () => new Date().toISOString().slice(0, 10);
const getWeekKey = () => {
  const d = new Date(), j = new Date(d.getFullYear(), 0, 1);
  const w = Math.ceil((((d - j) / 86400000) + j.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(w).padStart(2, "0")}`;
};
const getMissedStreak = () => {
  const days = store.get().completedDays;
  let streak = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (!days[d.toISOString().slice(0, 10)]) streak++; else break;
  }
  return streak;
};

// ═══════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════
const DAY_A_TASKS = [
  { id: "a1", emoji: "🎀", label: "Маркетинг", sub: "Grind University", mins: 30,
    rep: { creativity: 3, practice: 2 },
    cheers: ["Ты создаёшь свой мир, шаг за шагом 💕", "Каждый урок — шаг к мечте ✨", "Ты умнее, чем думаешь! 🌸"] },
  { id: "a2", emoji: "📖", label: "Навыки продаж", sub: "Книга / курс", mins: 20,
    rep: { practice: 3, discipline: 2 },
    cheers: ["Слова — твоё супероружие 🌷", "Читать — значит расти 🌱", "Даже 20 минут меняют всё! ✿"] },
  { id: "a3", emoji: "🖌️", label: "Дизайн в Figma", sub: "SuperFigma", mins: 30,
    rep: { creativity: 5, focus: 2 },
    cheers: ["Красота рождается в деталях 🌸", "Твой вкус растёт с каждым пикселем 💜", "Дизайн — это магия! ✨"] },
  { id: "a4", emoji: "🌸", label: "Китайский", sub: "Дорамы / твой сайт", mins: 40,
    rep: { discipline: 3, focus: 3 },
    cheers: ["加油！Давай, справишься! 💪", "Каждое слово — дверь в мир 🗝️", "Языки — суперсила 🌟"] },
  { id: "a5", emoji: "💻", label: "Личный проект", sub: "Сайт через ИИ", mins: 30,
    rep: { creativity: 3, practice: 4 },
    cheers: ["Ты строишь свою вселенную! 🌙", "Каждая строчка — это твоё 💖", "Проект мечты строится сейчас ✨"] },
];
const DAY_B_TASKS = [
  { id: "b1", emoji: "⬡", label: "Программирование", sub: "Core Objective", mins: 60,
    rep: { focus: 5, discipline: 4 },
    cheers: ["Нейронные пути расширяются", "Фокус активирован. Выполняй.", "Ты и есть алгоритм."] },
  { id: "b2", emoji: "◈", label: "3D в Blender", sub: "Mesh Operations", mins: 40,
    rep: { creativity: 4, focus: 3 },
    cheers: ["Геометрия — твой язык", "Строй мир. Одна вершина.", "Полигоны подчиняются тебе."] },
  { id: "b3", emoji: "◉", label: "Японский", sub: "Game + Anki", mins: 30,
    rep: { discipline: 3, practice: 3 },
    cheers: ["語学力: растёт", "言語習得中... захват идёт", "Беглость: активирована"] },
  { id: "b4", emoji: "◈", label: "Английский", sub: "Rick & Morty / Input", mins: 20,
    rep: { practice: 3, creativity: 2 },
    cheers: ["Языковой модуль: загружается", "Понимание +2%", "Wubba Lubba = прогресс"] },
  { id: "b5", emoji: "⬡", label: "3D / Дизайн", sub: "Personal Build", mins: 20,
    rep: { creativity: 4, practice: 3 },
    cheers: ["Рендер-ферма: в сети", "Творческое ядро: разблокировано", "Отправь. Улучши потом."] },
];

const LINES = {
  A: {
    taskDone: ["Это и есть твоя сила — не останавливаться 🌸", "Ты только что стала чуть лучше, чем вчера ✨", "Я горжусь тобой 💕", "Каждый выполненный пункт — реальность мечты 🌷"],
    taskUndone: ["Окей, бывает. Ты всё равно здесь 🤍", "Отметила — значит честна с собой.", "Иногда важно признать. Завтра начни с этого 🌸"],
    dayDone: ["Ты сделала это. Весь день. Ты настоящая ✨✨", "Юмэ плачет от гордости (в хорошем смысле) 🌸💕"],
    missed1: ["Вчера не было тебя. Сегодня ты здесь — это считается 🌷", "Один пропуск — не паттерн. Паттерн — когда снова 🌸"],
    missed2: ["Это уже второй день. Ты замечаешь это? 🤍", "Что-то тебя держит. Что именно? Напиши в заметках."],
    missed3: ["Три дня — это выбор. Осознанный или нет?", "Ты опять выбрала лёгкое. Это паттерн. Честно."],
    contractKept: ["Ты сдержала слово. Себе. Это редко. 💜", "Контракт выполнен. Ты тому, кем хочешь быть ✨"],
    contractBroken: ["Ты нарушила обещание. Не мне — себе.", "Это не конец. Но нужно понять — почему."],
    bossWin: ["ВЫЗОВ ПРИНЯТ 🌸 Закрой всё — и победа за тобой!", "Юмэ в восторге. Докажи — можешь всё ✨"],
    bossFail: ["Не страшно. Ты попробовала. Это уже победа 🌷"],
  },
  B: {
    taskDone: ["Нейронный путь закреплён. Продолжай.", "STAT +1. Это не случайность — это система.", "Выполнено. Ты строишь того, кем хочешь быть.", "Кен доволен. И ты знаешь почему."],
    taskUndone: ["Снял отметку. Зафиксировано.", "Честность — часть дисциплины.", "Откат зафиксирован. Завтра закрой."],
    dayDone: ["ВСЕ МИССИИ ВЫПОЛНЕНЫ. СТАТУС: ЛЕГЕНДА.", "День закрыт полностью. Такие дни строят личность."],
    missed1: ["Вчера — пустота. Сегодня — возможность. Выбирай.", "Пропуск зафиксирован. Система ждёт."],
    missed2: ["Два дня подряд. Тенденция. Ты это видишь?", "Паттерн формируется. Какой — решаешь ты."],
    missed3: ["Три дня — это не случайность. Это решение. Чьё?", "Ты хочешь быть технарём или просто играться с идеей?"],
    contractKept: ["Контракт исполнен. Слово — это код. Ты его не сломал.", "DISCIPLINE +30. Обещание себе — самое важное."],
    contractBroken: ["Контракт нарушен. Это данные, не приговор. Анализируй.", "Почему сломал? Запиши. Честно."],
    bossWin: ["ВЫЗОВ ПРИНЯТ. ЗАКРОЙ ВСЁ. СТАНЬ ЛЕГЕНДОЙ.", "Редкий шанс. Таких дней мало. Не упусти."],
    bossFail: ["Не добил. Данные собраны. Реванш — следующая неделя."],
  },
};
const getLine = (isA, type) => {
  const l = LINES[isA ? "A" : "B"][type] || ["..."];
  return l[Math.floor(Math.random() * l.length)];
};

const getFutureProjection = (rep, completedDays, isA) => {
  const total = Object.values(rep).reduce((a, b) => a + b, 0);
  const days = Object.keys(completedDays).length;
  const dis = rep.discipline || 0;
  if (isA) {
    if (total > 200) return { good: "Через 3 месяца — сильный портфолио, уверенность в продажах, китайский A2. Люди заметят перемену.", bad: null };
    if (dis < 20) return { good: "Потенциал есть. Но без дисциплины он останется потенциалом.", bad: "Ты будешь знать больше — и всё равно не делать. Классическая ловушка умных людей." };
    return { good: `${days} дней активности — фундамент уже строится. Ещё 60 — результат станет виден другим.`, bad: "Если остановишься сейчас — через 3 месяца ты там же, где сегодня." };
  } else {
    if (total > 200) return { good: "Через 3 месяца — реальные проекты в портфолио, японский B1, уверенный стек. Работодатель заметит.", bad: null };
    if (dis < 20) return { good: "База заложена. Но фундамент без стен — просто бетон.", bad: "Пропускаешь → навык не закрепляется → через 3 месяца ноль прироста. Математика жестокая." };
    return { good: `${days} дней — привычка в стадии формирования. Ещё 66 — и она станет частью тебя.`, bad: "Если забьёшь — мозг вернёт в дефолт. Придётся начинать заново." };
  }
};

const REP_STATS = [
  { key: "discipline", labelA: "🧠 Дисциплина", labelB: "DISCIPLINE", color: "#e879a8", colorB: "#b89fff" },
  { key: "focus",      labelA: "⚡ Фокус",      labelB: "FOCUS",      color: "#c084fc", colorB: "#7c3aed" },
  { key: "creativity", labelA: "🎨 Креатив",    labelB: "CREATIVITY", color: "#f472b6", colorB: "#a78bfa" },
  { key: "practice",   labelA: "💰 Практика",   labelB: "PRACTICE",   color: "#fb923c", colorB: "#8b5cf6" },
];
const MAX_REP = 300;

// ═══════════════════════════════════════════════════════════════════════
// CANVAS — PETALS (День А)
// ═══════════════════════════════════════════════════════════════════════
function PetalCanvas({ degradeLevel = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    const onR = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    window.addEventListener("resize", onR);
    const count = Math.max(6, 32 - degradeLevel * 7);
    const petals = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H - H,
      r: 5 + Math.random() * 7, speed: 0.5 + Math.random() * 1.4,
      drift: (Math.random() - 0.5) * 0.7, angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04,
      hue: degradeLevel > 0 ? 0 : 318 + Math.random() * 44,
      sat: Math.max(0, 78 - degradeLevel * 20),
      alpha: Math.max(0.1, 0.5 - degradeLevel * 0.1),
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of petals) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${degradeLevel > 0 ? 55 : 76}%,${p.alpha})`; ctx.fill();
        ctx.restore();
        p.y += p.speed * (degradeLevel > 2 ? 0.4 : 1);
        p.x += p.drift + Math.sin(p.y * 0.014) * 0.6;
        p.angle += p.spin * (degradeLevel > 2 ? 0.3 : 1);
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }, [degradeLevel]);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
}

// ═══════════════════════════════════════════════════════════════════════
// CANVAS — NEURAL NET (День Б)
// ═══════════════════════════════════════════════════════════════════════
function ElegantCanvas({ degradeLevel = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    const onR = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    window.addEventListener("resize", onR);
    const count = Math.max(10, 55 - degradeLevel * 12);
    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * Math.max(0.05, 0.4 - degradeLevel * 0.08),
      vy: (Math.random() - 0.5) * Math.max(0.05, 0.4 - degradeLevel * 0.08),
      r: 1 + Math.random() * 2,
    }));
    let raf;
    const connDist = Math.max(60, 160 - degradeLevel * 30);
    const baseA = Math.max(0.03, 0.12 - degradeLevel * 0.025);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connDist) {
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(${degradeLevel > 2 ? "80,60,80" : "180,140,255"},${baseA * (1 - dist / connDist)})`;
            ctx.lineWidth = 0.8; ctx.stroke();
          }
        }
      }
      for (const d of dots) {
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${degradeLevel > 2 ? "100,80,100" : "200,160,255"},${Math.max(0.05, 0.35 - degradeLevel * 0.07)})`; ctx.fill();
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }, [degradeLevel]);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.7 }} />;
}

// ═══════════════════════════════════════════════════════════════════════
// HUD CORNERS
// ═══════════════════════════════════════════════════════════════════════
function HUDFrame({ color = "#b89fff", size = 14, thick = 1.5 }) {
  const b = `${thick}px`;
  return <>
    <div style={{ position: "absolute", top: 0, left: 0, width: size, height: size, borderTop: `${b} solid ${color}`, borderLeft: `${b} solid ${color}` }} />
    <div style={{ position: "absolute", top: 0, right: 0, width: size, height: size, borderTop: `${b} solid ${color}`, borderRight: `${b} solid ${color}` }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, width: size, height: size, borderBottom: `${b} solid ${color}`, borderLeft: `${b} solid ${color}` }} />
    <div style={{ position: "absolute", bottom: 0, right: 0, width: size, height: size, borderBottom: `${b} solid ${color}`, borderRight: `${b} solid ${color}` }} />
  </>;
}

// ═══════════════════════════════════════════════════════════════════════
// REPUTATION BAR
// ═══════════════════════════════════════════════════════════════════════
function RepBar({ stat, value, isA, degradeLevel }) {
  const pct = Math.min(100, Math.round((value / MAX_REP) * 100));
  const acc = isA ? stat.color : stat.colorB;
  const desat = degradeLevel > 0 ? `grayscale(${degradeLevel * 22}%)` : "none";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: isA ? 13 : 11, color: isA ? "#b06090" : "#8060b0" }}>
          {isA ? stat.labelA : stat.labelB}
        </span>
        <span style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: isA ? 13 : 11, color: acc, fontWeight: 700, filter: desat }}>
          {isA ? `${value} ✦` : `${value}/${MAX_REP}`}
        </span>
      </div>
      <div style={{ height: isA ? 9 : 6, background: isA ? "rgba(232,121,168,0.1)" : "rgba(184,159,255,0.08)", borderRadius: isA ? 99 : 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${acc}88,${acc})`, borderRadius: isA ? 99 : 3, transition: "width 0.8s cubic-bezier(.34,1.2,.64,1)", filter: desat, boxShadow: !isA && pct > 0 ? `0 0 8px ${acc}66` : "none" }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CHARACTER SPEECH BUBBLE
// ═══════════════════════════════════════════════════════════════════════
function CharacterSpeech({ text, isA, onDismiss }) {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    if (!text) return;
    setVis(true);
    const t = setTimeout(() => { setVis(false); setTimeout(onDismiss, 400); }, 5500);
    return () => clearTimeout(t);
  }, [text, onDismiss]);
  if (!text) return null;
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 700, maxWidth: 420, width: "90vw", opacity: vis ? 1 : 0, transition: "opacity 0.4s ease", animation: vis ? "speechIn 0.4s cubic-bezier(.34,1.56,.64,1)" : "none" }}>
      <div style={{ background: isA ? "rgba(255,242,254,0.97)" : "rgba(18,10,40,0.97)", border: `1px solid ${isA ? "rgba(232,121,168,0.5)" : "rgba(184,159,255,0.4)"}`, borderRadius: isA ? 20 : 10, padding: "16px 20px", backdropFilter: "blur(20px)", boxShadow: isA ? "0 12px 50px rgba(232,121,168,0.25)" : "0 12px 50px rgba(100,60,180,0.35)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>{isA ? "🦊" : "🤖"}</div>
          <div style={{ flex: 1, fontFamily: isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif", fontSize: isA ? 14 : 13, color: isA ? "#5a2050" : "#d4b8ff", lineHeight: 1.6, fontWeight: isA ? 700 : 500 }}>{text}</div>
          <button onClick={() => { setVis(false); setTimeout(onDismiss, 300); }} style={{ background: "none", border: "none", color: isA ? "#c08aaa" : "#6a4a8a", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `8px solid ${isA ? "rgba(255,242,254,0.97)" : "rgba(18,10,40,0.97)"}` }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONTRACT MODAL
// ═══════════════════════════════════════════════════════════════════════
function ContractModal({ tasks, isA, existingContract, onConfirm, onClose }) {
  const [sel, setSel] = useState(existingContract?.taskId || null);
  const [stake, setStake] = useState(existingContract?.stake || "rep_loss");
  const acc = isA ? "#e879a8" : "#b89fff";
  const bg = isA ? "rgba(255,242,254,0.97)" : "rgba(18,10,40,0.97)";
  const txt = isA ? "#4a1942" : "#e8d5ff";
  const muted = isA ? "#b06090" : "#8060b0";
  const font = isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif";
  const mono = isA ? "'Nunito',sans-serif" : "'DM Mono',monospace";
  const stakes = isA
    ? [{ id: "rep_loss", label: "−15 очков репутации", icon: "💔" }, { id: "gacha_block", label: "Заблокировать гачу", icon: "🔒" }, { id: "streak_reset", label: "Сбросить цепочку", icon: "💧" }]
    : [{ id: "rep_loss", label: "REP −15 штраф", icon: "⬇" }, { id: "gacha_block", label: "GACHA: LOCKED", icon: "🔒" }, { id: "streak_reset", label: "STREAK: RESET", icon: "⚠" }];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(14px)" }}>
      <div style={{ background: bg, borderRadius: isA ? 28 : 10, padding: "2rem", width: 380, maxWidth: "94vw", border: `1px solid ${acc}55`, boxShadow: `0 0 80px ${acc}22,0 24px 80px rgba(0,0,0,0.5)`, position: "relative" }}>
        {!isA && <HUDFrame color={acc} size={14} thick={1.5} />}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: muted, letterSpacing: isA ? 0 : 2, marginBottom: 5 }}>{isA ? "✦ контракт с собой" : "// SELF_CONTRACT.exe"}</div>
          <h2 style={{ fontFamily: isA ? "'Pacifico',cursive" : "'Orbitron',monospace", fontSize: isA ? 24 : 18, color: acc, letterSpacing: isA ? 0 : 2 }}>{isA ? "Обещание дня" : "DAILY CONTRACT"}</h2>
          <p style={{ fontFamily: font, fontSize: 13, color: muted, marginTop: 6, lineHeight: 1.5 }}>{isA ? "Выбери главную задачу и ставку. Слово — это уже действие. 🌸" : "Выбери ПРИОРИТЕТ и СТАВКУ. Обещание себе — это код."}</p>
        </div>
        <div style={{ marginBottom: "1.4rem" }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: muted, marginBottom: 8 }}>{isA ? "Главная задача:" : "PRIMARY TARGET:"}</div>
          {tasks.map(t => (
            <div key={t.id} onClick={() => setSel(t.id)} style={{ padding: "10px 14px", borderRadius: isA ? 14 : 6, marginBottom: 6, cursor: "pointer", background: sel === t.id ? `${acc}22` : "transparent", border: `1px solid ${sel === t.id ? acc : `${acc}22`}`, display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
              <span style={{ fontSize: 18 }}>{t.emoji}</span>
              <span style={{ fontFamily: font, fontSize: 13, color: sel === t.id ? acc : txt, fontWeight: sel === t.id ? 700 : 400 }}>{t.label}</span>
              {sel === t.id && <span style={{ marginLeft: "auto", color: acc }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ marginBottom: "1.6rem" }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: muted, marginBottom: 8 }}>{isA ? "Ставка (если не выполню):" : "STAKE (penalty on fail):"}</div>
          {stakes.map(st => (
            <div key={st.id} onClick={() => setStake(st.id)} style={{ padding: "9px 14px", borderRadius: isA ? 12 : 6, marginBottom: 5, cursor: "pointer", background: stake === st.id ? `${acc}18` : "transparent", border: `1px solid ${stake === st.id ? acc + "66" : acc + "18"}`, display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
              <span style={{ fontSize: 16 }}>{st.icon}</span>
              <span style={{ fontFamily: font, fontSize: 12, color: stake === st.id ? acc : muted }}>{st.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${acc}33`, borderRadius: isA ? 14 : 6, color: muted, fontFamily: font, fontSize: 13, cursor: "pointer" }}>{isA ? "Отмена" : "ABORT"}</button>
          <button onClick={() => sel && onConfirm({ taskId: sel, stake, createdAt: today() })} disabled={!sel}
            style={{ flex: 2, padding: "12px", background: sel ? `linear-gradient(135deg,${acc},${isA ? "#c084fc" : "#7c3aed"})` : `${acc}33`, border: "none", borderRadius: isA ? 14 : 6, color: sel ? "#fff" : muted, fontFamily: font, fontWeight: 800, fontSize: 14, cursor: sel ? "pointer" : "not-allowed" }}>
            {isA ? "✦ Дать обещание" : "SIGN CONTRACT"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// POMODORO (с анти-побегом)
// ═══════════════════════════════════════════════════════════════════════
function PomodoroModal({ task, isA, onClose }) {
  const [work, setWork] = useState(task.mins);
  const [rest, setRest] = useState(5);
  const [phase, setPhase] = useState("idle");
  const [secs, setSecs] = useState(0);
  const iRef = useRef(null);
  const acc = isA ? "#e879a8" : "#b89fff";
  const bg = isA ? "linear-gradient(135deg,rgba(255,242,252,0.97),rgba(248,228,255,0.95))" : "linear-gradient(135deg,rgba(18,12,38,0.98),rgba(22,14,48,0.97))";
  const txt = isA ? "#4a1942" : "#e8d5ff";
  const muted = isA ? "#b06090" : "#9070c0";
  const font = isA ? "'Nunito',sans-serif" : "'DM Mono',monospace";
  const total = phase === "work" ? work * 60 : rest * 60;
  const progress = (phase === "work" || phase === "rest") ? 1 - secs / total : 0;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const r = 68; const circ = 2 * Math.PI * r;

  const startWork = () => { setSecs(work * 60); setPhase("work"); };
  const stop = () => { clearInterval(iRef.current); setPhase("idle"); setSecs(0); };

  // Анти-побег
  useEffect(() => {
    if (phase !== "work") return;
    const onVis = () => {
      if (document.visibilityState === "hidden") { clearInterval(iRef.current); setPhase("escaped"); }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  useEffect(() => {
    if (phase === "work" || phase === "rest") {
      iRef.current = setInterval(() => setSecs(p => {
        if (p <= 1) { clearInterval(iRef.current); setPhase(phase === "work" ? "rest_ready" : "done"); return 0; }
        return p - 1;
      }), 1000);
    }
    return () => clearInterval(iRef.current);
  }, [phase]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(14px)" }}>
      <div style={{ background: bg, borderRadius: isA ? 28 : 8, padding: "2rem", width: 340, border: `1px solid ${acc}55`, boxShadow: `0 0 80px ${acc}25,0 24px 80px rgba(0,0,0,0.5)`, position: "relative" }}>
        {!isA && <HUDFrame color={acc} size={14} thick={1.5} />}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.4rem" }}>
          <div>
            <div style={{ color: muted, fontFamily: font, fontSize: 11, marginBottom: 3 }}>{isA ? "✦ фокус-таймер" : "FOCUS_TIMER"}</div>
            <div style={{ color: txt, fontFamily: font, fontWeight: 800, fontSize: 16 }}>{task.label}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: muted, cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        {phase === "escaped" ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{isA ? "🌧️" : "⚠"}</div>
            <div style={{ fontFamily: isA ? "'Pacifico',cursive" : "'Orbitron',monospace", fontSize: isA ? 22 : 16, color: acc, marginBottom: 8 }}>
              {isA ? "Ты убежала" : "FOCUS BROKEN"}
            </div>
            <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif", fontSize: 13, color: muted, lineHeight: 1.6, marginBottom: 20 }}>
              {isA ? "Таймер остановлен — ты вышла с вкладки. Это привычка убегать. Замечай её. 🌸" : "Вкладка потеряла фокус. Таймер остановлен. Это данные о твоём внимании."}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setSecs(work * 60); setPhase("work"); }}
                style={{ flex: 1, padding: "12px", background: `linear-gradient(135deg,${acc},${isA ? "#c084fc" : "#7c3aed"})`, border: "none", borderRadius: isA ? 14 : 6, color: "#fff", fontFamily: font, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                {isA ? "↩ Вернуться" : "RESUME"}
              </button>
              <button onClick={stop}
                style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${acc}44`, borderRadius: isA ? 14 : 6, color: muted, fontFamily: font, fontSize: 13, cursor: "pointer" }}>
                {isA ? "Закончить" : "ABORT"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {phase === "idle" && (
              <div style={{ display: "flex", gap: 10, marginBottom: "1.4rem" }}>
                {[["Фокус", work, setWork, 5, 90], ["Отдых", rest, setRest, 1, 30]].map(([l, v, sv, mn, mx]) => (
                  <label key={l} style={{ flex: 1, color: muted, fontFamily: font, fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                    {l}<input type="number" value={v} min={mn} max={mx} onChange={e => sv(+e.target.value)}
                      style={{ background: isA ? "rgba(255,255,255,0.5)" : "rgba(184,159,255,0.1)", border: `1px solid ${acc}44`, borderRadius: isA ? 10 : 4, color: txt, fontFamily: font, padding: "6px 10px", fontSize: 14, outline: "none", width: "100%" }} />
                  </label>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center", margin: "0.5rem 0 1.4rem" }}>
              <svg width={160} height={160} viewBox="0 0 160 160">
                <circle cx={80} cy={80} r={r} fill="none" stroke={`${acc}22`} strokeWidth={8} />
                <circle cx={80} cy={80} r={r} fill="none" stroke={acc} strokeWidth={8}
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
                  strokeLinecap={isA ? "round" : "square"} transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset 0.8s linear", filter: !isA ? `drop-shadow(0 0 8px ${acc})` : "none" }} />
                <text x={80} y={75} textAnchor="middle" fill={txt} fontSize={32} fontFamily={isA ? "'Pacifico',cursive" : "'Orbitron',monospace"} fontWeight={isA ? 400 : 700}>{mm}:{ss}</text>
                <text x={80} y={97} textAnchor="middle" fill={muted} fontSize={11} fontFamily={font}>
                  {phase === "work" ? (isA ? "✿ фокус" : "FOCUSED") : phase === "rest" || phase === "rest_ready" ? (isA ? "☕ отдых" : "BREAK") : phase === "done" ? (isA ? "🌸 готово!" : "DONE") : (isA ? "старт" : "READY")}
                </text>
              </svg>
            </div>
            {phase === "idle" && <button onClick={startWork} style={{ width: "100%", padding: "13px", background: `linear-gradient(135deg,${acc},${isA ? "#c084fc" : "#7c3aed"})`, border: "none", borderRadius: isA ? 14 : 6, color: "#fff", fontFamily: font, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>{isA ? "✨ Начать" : "▶ EXECUTE"}</button>}
            {(phase === "work" || phase === "rest") && <button onClick={stop} style={{ width: "100%", padding: "13px", background: "transparent", border: `1px solid ${acc}44`, borderRadius: isA ? 14 : 6, color: muted, fontFamily: font, fontSize: 14, cursor: "pointer" }}>{isA ? "Остановить" : "ABORT"}</button>}
            {phase === "rest_ready" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setSecs(rest * 60); setPhase("rest"); }} style={{ flex: 1, padding: "12px", background: `${acc}22`, border: `1px solid ${acc}55`, borderRadius: isA ? 14 : 6, color: acc, fontFamily: font, fontSize: 13, cursor: "pointer", fontWeight: 700 }}>{isA ? "☕ Отдохнуть" : "BREAK"}</button>
                <button onClick={stop} style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${acc}22`, borderRadius: isA ? 14 : 6, color: muted, fontFamily: font, fontSize: 13, cursor: "pointer" }}>{isA ? "Пропустить" : "SKIP"}</button>
              </div>
            )}
            {phase === "done" && <button onClick={stop} style={{ width: "100%", padding: "13px", background: `linear-gradient(135deg,${acc},${isA ? "#c084fc" : "#7c3aed"})`, border: "none", borderRadius: isA ? 14 : 6, color: "#fff", fontFamily: font, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>{isA ? "🌸 Молодец!" : "COMMIT SUCCESS"}</button>}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// NO-MIND MODE
// ═══════════════════════════════════════════════════════════════════════
function NoMindMode({ tasks, isA, completedToday, onClose }) {
  const incomplete = tasks.filter(t => !completedToday[`${today()}_${t.id}`]);
  const [task] = useState(incomplete[0] || tasks[0]);
  const [active, setActive] = useState(false);
  const [secs, setSecs] = useState(task.mins * 60);
  const iRef = useRef(null);
  const acc = isA ? "#e879a8" : "#b89fff";
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const r = 80; const circ = 2 * Math.PI * r;
  const progress = 1 - secs / (task.mins * 60);

  useEffect(() => {
    if (!active) return;
    iRef.current = setInterval(() => setSecs(p => {
      if (p <= 1) { clearInterval(iRef.current); setActive(false); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(iRef.current);
  }, [active]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: isA ? "linear-gradient(135deg,#fff0f8,#f5e8ff)" : "linear-gradient(135deg,#0a0620,#14083a)" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: isA ? "#c08aaa" : "#6a4a8a", cursor: "pointer", fontSize: 24 }}>×</button>
      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: isA ? 13 : 11, color: isA ? "#c08aaa" : "#6a4a8a", marginBottom: 10, letterSpacing: isA ? 0 : 2 }}>
          {isA ? "Сейчас только одно ✿" : "// ONE PROCESS. ONE FOCUS."}
        </div>
        <div style={{ fontFamily: isA ? "'Pacifico',cursive" : "'Orbitron',monospace", fontSize: isA ? 36 : 26, color: acc, marginBottom: 6, letterSpacing: isA ? 0 : 2 }}>{task.label}</div>
        <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: 13, color: isA ? "#b06090" : "#8060b0", marginBottom: 40 }}>{task.sub}</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <svg width={200} height={200} viewBox="0 0 200 200">
            <circle cx={100} cy={100} r={r} fill="none" stroke={`${acc}18`} strokeWidth={10} />
            <circle cx={100} cy={100} r={r} fill="none" stroke={acc} strokeWidth={10}
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round" transform="rotate(-90 100 100)"
              style={{ transition: "stroke-dashoffset 1s linear", filter: isA ? "none" : `drop-shadow(0 0 10px ${acc})` }} />
            <text x={100} y={95} textAnchor="middle" fill={acc} fontSize={38} fontFamily={isA ? "'Pacifico',cursive" : "'Orbitron',monospace"} fontWeight={isA ? 400 : 900}>{mm}:{ss}</text>
            <text x={100} y={118} textAnchor="middle" fill={isA ? "#c08aaa" : "#6a4a8a"} fontSize={12} fontFamily={isA ? "'Nunito',sans-serif" : "'DM Mono',monospace"}>
              {active ? (isA ? "✿ ты в фокусе" : "// FOCUSED") : secs === 0 ? (isA ? "🌸 готово!" : "// DONE") : (isA ? "нажми старт" : "// READY")}
            </text>
          </svg>
        </div>
        {!active && secs > 0 && (
          <button onClick={() => setActive(true)}
            style={{ padding: "18px 48px", background: `linear-gradient(135deg,${acc},${isA ? "#c084fc" : "#7c3aed"})`, border: "none", borderRadius: isA ? 99 : 8, color: "#fff", fontFamily: isA ? "'Nunito',sans-serif" : "'Orbitron',monospace", fontWeight: 900, fontSize: 18, cursor: "pointer", boxShadow: `0 0 30px ${acc}44`, letterSpacing: isA ? 0 : 2 }}>
            {isA ? "✨ Начать" : "▶ EXECUTE"}
          </button>
        )}
        {active && (
          <button onClick={() => { setActive(false); clearInterval(iRef.current); }}
            style={{ padding: "14px 36px", background: "transparent", border: `1px solid ${acc}44`, borderRadius: isA ? 99 : 8, color: isA ? "#c08aaa" : "#8060b0", fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: 14, cursor: "pointer" }}>
            {isA ? "Пауза" : "PAUSE"}
          </button>
        )}
        {secs === 0 && (
          <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif", fontSize: 14, color: acc, marginTop: 20 }}>
            {isA ? "🌸 Сессия завершена. Отметь задачу выполненной!" : "SESSION COMPLETE. MARK TASK DONE."}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FUTURE SELF
// ═══════════════════════════════════════════════════════════════════════
function FutureSelfScreen({ rep, completedDays, isA, onClose }) {
  const proj = getFutureProjection(rep, completedDays, isA);
  const total = Object.values(rep).reduce((a, b) => a + b, 0);
  const daysActive = Object.keys(completedDays).length;
  const acc = isA ? "#e879a8" : "#b89fff";
  const bg = isA ? "linear-gradient(160deg,#fff5fb,#fde8f7,#ede0ff)" : "linear-gradient(160deg,#0e0820,#160c38,#1a0e44)";
  const cardBg = isA ? "rgba(255,255,255,0.65)" : "rgba(22,14,50,0.75)";
  const border = isA ? "rgba(232,121,168,0.25)" : "rgba(184,159,255,0.14)";
  const txt = isA ? "#4a1942" : "#e8d5ff";
  const muted = isA ? "#b06090" : "#8060b0";
  const font = isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif";
  const mono = isA ? "'Nunito',sans-serif" : "'DM Mono',monospace";

  return (
    <div style={{ position: "fixed", inset: 0, background: bg, zIndex: 800, overflowY: "auto" }}>
      {isA ? <PetalCanvas degradeLevel={0} /> : <ElegantCanvas degradeLevel={0} />}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 80px", position: "relative", zIndex: 2 }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: isA ? 99 : 8, color: muted, fontFamily: font, fontSize: 13, padding: "8px 18px", cursor: "pointer", marginBottom: 32 }}>
          {isA ? "← Назад" : "← BACK"}
        </button>
        <div style={{ fontFamily: isA ? "'Pacifico',cursive" : "'Orbitron',monospace", fontSize: isA ? 32 : 22, color: acc, marginBottom: 6, letterSpacing: isA ? 0 : 2 }}>
          {isA ? "Ты через 3 месяца ✦" : "YOU // +3 MONTHS"}
        </div>
        <div style={{ fontFamily: font, fontSize: 13, color: muted, marginBottom: 32 }}>
          {isA ? `Активных дней: ${daysActive} · Суммарно: ${total}` : `ACTIVE: ${daysActive} | TOTAL_REP: ${total}`}
        </div>
        <div style={{ background: cardBg, border: `1px solid ${acc}44`, borderRadius: isA ? 22 : 10, padding: "24px", marginBottom: 16, backdropFilter: "blur(20px)", position: "relative" }}>
          {!isA && <HUDFrame color={`${acc}33`} size={10} thick={1} />}
          <div style={{ fontFamily: mono, fontWeight: 800, fontSize: isA ? 15 : 12, color: isA ? "#22c55e" : "#4ade80", marginBottom: 12 }}>{isA ? "✦ Если продолжишь" : "// IF: CONTINUE"}</div>
          <p style={{ fontFamily: font, fontSize: 14, color: txt, lineHeight: 1.8 }}>{proj.good}</p>
        </div>
        {proj.bad && (
          <div style={{ background: cardBg, border: "1px solid rgba(239,68,68,0.35)", borderRadius: isA ? 22 : 10, padding: "24px", marginBottom: 24, backdropFilter: "blur(20px)" }}>
            <div style={{ fontFamily: mono, fontWeight: 800, fontSize: isA ? 15 : 12, color: "#ef4444", marginBottom: 12 }}>{isA ? "✦ Если остановишься" : "// IF: ABORT"}</div>
            <p style={{ fontFamily: font, fontSize: 14, color: isA ? "#7a3060" : "#c8a8f0", lineHeight: 1.8 }}>{proj.bad}</p>
          </div>
        )}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: isA ? 22 : 10, padding: "24px", backdropFilter: "blur(20px)" }}>
          <div style={{ fontFamily: mono, fontWeight: 800, fontSize: isA ? 14 : 11, color: muted, marginBottom: 16 }}>{isA ? "✦ Прогноз через 90 дней" : "// REP_FORECAST: +90 DAYS"}</div>
          {REP_STATS.map(stat => {
            const cur = rep[stat.key] || 0;
            const projected = Math.min(MAX_REP, Math.round(cur + (daysActive > 0 ? (cur / daysActive) * 90 : 15)));
            return (
              <div key={stat.key} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: font, fontSize: 13, color: muted }}>{isA ? stat.labelA : stat.labelB}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: isA ? stat.color : stat.colorB, fontWeight: 700 }}>{cur} → {projected}</span>
                </div>
                <div style={{ height: 7, background: `${acc}12`, borderRadius: isA ? 99 : 2, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(100, (cur / MAX_REP) * 100)}%`, background: `${isA ? stat.color : stat.colorB}88`, borderRadius: isA ? 99 : 2 }} />
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(100, (projected / MAX_REP) * 100)}%`, background: `linear-gradient(90deg,transparent ${Math.min(100, (cur / MAX_REP) * 100)}%,${isA ? stat.color : stat.colorB} ${Math.min(100, (cur / MAX_REP) * 100)}%)`, borderRadius: isA ? 99 : 2, opacity: 0.4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BOSS MODAL
// ═══════════════════════════════════════════════════════════════════════
function BossModal({ isA, onAccept, onClose }) {
  const acc = isA ? "#e879a8" : "#b89fff";
  const bg = isA ? "rgba(255,242,254,0.97)" : "rgba(12,6,32,0.98)";
  const muted = isA ? "#b06090" : "#8060b0";
  const font = isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif";
  const txt = isA ? "#4a1942" : "#e8d5ff";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(14px)" }}>
      <div style={{ background: bg, borderRadius: isA ? 28 : 8, padding: "2rem", width: 400, maxWidth: "94vw", border: `1px solid ${acc}77`, boxShadow: `0 0 100px ${acc}33,0 30px 80px rgba(0,0,0,0.6)`, position: "relative" }}>
        {!isA && <HUDFrame color={acc} size={16} thick={2} />}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 64, marginBottom: 12, display: "inline-block", animation: "bossFloat 2s ease-in-out infinite", filter: `drop-shadow(0 0 20px ${acc}66)` }}>
            {isA ? "🐉" : "⚔"}
          </div>
          <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: 11, color: muted, letterSpacing: isA ? 0 : 2, marginBottom: 6 }}>
            {isA ? "✦ БОСС-ДЕНЬ" : "// BOSS_WEEK_ACTIVE"}
          </div>
          <h2 style={{ fontFamily: isA ? "'Pacifico',cursive" : "'Orbitron',monospace", fontSize: isA ? 26 : 18, color: acc, letterSpacing: isA ? 0 : 2, marginBottom: 10 }}>
            {isA ? "Страх пропустить" : "PROCRASTINATION_BOSS"}
          </h2>
          <p style={{ fontFamily: font, fontSize: 13, color: muted, lineHeight: 1.7 }}>
            {isA ? "Сегодня особый день. Закрой ВСЕ задачи — получишь +30 ко всем статам репутации. Если нет — ничего страшного. Но ты будешь знать." : "WEEKLY BOSS DETECTED. Закрой ВСЕ миссии без побегов из таймера. Победишь — ALL STATS +30. Реванш — следующая неделя."}
          </p>
        </div>
        <div style={{ background: `${acc}12`, borderRadius: isA ? 16 : 6, padding: "14px", marginBottom: "1.5rem", border: `1px solid ${acc}22` }}>
          <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: 12, color: acc, fontWeight: 700, marginBottom: 6 }}>{isA ? "Награда за победу:" : "VICTORY REWARD:"}</div>
          <div style={{ fontFamily: font, fontSize: 13, color: txt }}>{isA ? "✦ +30 к каждому стату репутации" : "+30 ALL STATS · WEEKLY_CHAMPION badge"}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${acc}33`, borderRadius: isA ? 14 : 6, color: muted, fontFamily: font, fontSize: 13, cursor: "pointer" }}>{isA ? "Позже" : "SKIP"}</button>
          <button onClick={onAccept} style={{ flex: 2, padding: "12px", background: `linear-gradient(135deg,${acc},${isA ? "#c084fc" : "#7c3aed"})`, border: "none", borderRadius: isA ? 14 : 6, color: "#fff", fontFamily: font, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            {isA ? "⚔️ Принять вызов!" : "ACCEPT CHALLENGE"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TASK CARDS
// ═══════════════════════════════════════════════════════════════════════
function TaskCardA({ task, done, onToggle, onTimer, onOpen, isContract }) {
  const [hover, setHover] = useState(false);
  const cheer = task.cheers[Math.floor(Date.now() / 1000 / 60 / 3) % task.cheers.length];
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ borderRadius: 18, marginBottom: 10, transition: "all 0.3s ease",
        background: done ? "linear-gradient(135deg,rgba(232,121,168,0.2),rgba(192,132,252,0.16))" : hover ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.52)",
        border: `1px solid ${isContract ? "#e879a8" : done ? "rgba(232,121,168,0.55)" : hover ? "rgba(232,121,168,0.4)" : "rgba(230,190,220,0.3)"}`,
        backdropFilter: "blur(10px)", padding: "14px 16px",
        boxShadow: isContract ? "0 0 20px rgba(232,121,168,0.3)" : hover ? "0 8px 32px rgba(232,121,168,0.2)" : "none",
        transform: hover ? "translateY(-2px)" : "none" }}>
      {isContract && <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: "#e879a8", marginBottom: 6, fontWeight: 800 }}>✦ КОНТРАКТ ДНЯ</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={onToggle} style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
            background: done ? "linear-gradient(135deg,#e879a8,#c084fc)" : "rgba(255,255,255,0.85)",
            border: `2px solid ${done ? "transparent" : "rgba(232,121,168,0.4)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            boxShadow: done ? "0 0 18px rgba(232,121,168,0.55)" : "none",
            transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", transform: done ? "scale(1.1)" : hover ? "scale(1.05)" : "scale(1)" }}>
          {done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
        </div>
        <div style={{ fontSize: 20 }}>{task.emoji}</div>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={onToggle}>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, color: done ? "#b06090" : "#4a1942", textDecoration: done ? "line-through" : "none" }}>{task.label}</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, color: "#b06090", marginTop: 1 }}>{task.sub} · {task.mins} мин</div>
        </div>
        <button onClick={onTimer} style={{ background: "rgba(232,121,168,0.1)", border: "1px solid rgba(232,121,168,0.3)", borderRadius: 10, color: "#c06090", fontFamily: "'Nunito',sans-serif", fontSize: 12, padding: "5px 10px", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(232,121,168,0.25)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(232,121,168,0.1)"}>⏱</button>
        <button onClick={onOpen} style={{ background: "none", border: "none", color: "#d0a0c0", cursor: "pointer", fontSize: 18, padding: "5px 6px", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#e879a8"; e.currentTarget.style.transform = "scale(1.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#d0a0c0"; e.currentTarget.style.transform = "scale(1)"; }}>✦</button>
      </div>
      {(hover || done) && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(232,121,168,0.2)", fontFamily: "'Nunito',sans-serif", fontSize: 12, color: "#c06898", fontStyle: "italic", animation: "fadeSlide 0.3s ease" }}>
          {done ? "✨ " + task.cheers[2] : "💕 " + cheer}
        </div>
      )}
    </div>
  );
}

function TaskCardB({ task, done, onToggle, onTimer, onOpen, idx, isContract }) {
  const [hover, setHover] = useState(false);
  const acc = "#b89fff";
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ borderRadius: 8, marginBottom: 9, position: "relative", transition: "all 0.25s ease",
        background: done ? "rgba(184,159,255,0.1)" : hover ? "rgba(184,159,255,0.07)" : "rgba(18,12,38,0.7)",
        border: `1px solid ${isContract ? acc : done ? "rgba(184,159,255,0.5)" : hover ? "rgba(184,159,255,0.3)" : "rgba(184,159,255,0.12)"}`,
        backdropFilter: "blur(14px)", padding: "14px 16px",
        boxShadow: isContract ? "0 0 24px rgba(184,159,255,0.25)" : done ? "0 0 24px rgba(184,159,255,0.12)" : "none" }}>
      {hover && <HUDFrame color={done ? "rgba(184,159,255,0.7)" : "rgba(184,159,255,0.4)"} size={9} thick={1} />}
      {isContract && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: acc, marginBottom: 6, letterSpacing: 1 }}>// CONTRACT_TARGET</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={onToggle} style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 4,
            background: done ? "rgba(184,159,255,0.3)" : "transparent",
            border: `1.5px solid ${done ? acc : hover ? "rgba(184,159,255,0.5)" : "rgba(184,159,255,0.25)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            boxShadow: done ? "0 0 14px rgba(184,159,255,0.5)" : "none", transition: "all 0.3s" }}>
          {done && <span style={{ color: "#d4b8ff", fontSize: 11, fontWeight: 700 }}>✓</span>}
        </div>
        <div style={{ color: "rgba(184,159,255,0.6)", fontFamily: "'DM Mono',monospace", fontSize: 10, minWidth: 28 }}>{String(idx + 1).padStart(2, "0")}</div>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={onToggle}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: done ? "rgba(212,184,255,0.5)" : hover ? "#e8d5ff" : "#c8b0f0", textDecoration: done ? "line-through" : "none" }}>{task.label}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6a4a9a", marginTop: 2 }}>{task.sub} · {task.mins}min</div>
        </div>
        <button onClick={onTimer} style={{ background: "transparent", border: "1px solid rgba(184,159,255,0.2)", borderRadius: 6, color: "#7a5aaa", fontFamily: "'DM Mono',monospace", fontSize: 11, padding: "5px 9px", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = acc; e.currentTarget.style.color = acc; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,159,255,0.2)"; e.currentTarget.style.color = "#7a5aaa"; }}>▸ timer</button>
        <button onClick={onOpen} style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 14, padding: "5px 6px", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = acc; e.currentTarget.style.transform = "scale(1.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#5a3a8a"; e.currentTarget.style.transform = "scale(1)"; }}>▸</button>
      </div>
      {(hover || done) && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(184,159,255,0.1)", fontFamily: "'DM Mono',monospace", fontSize: 10, color: done ? "rgba(184,159,255,0.6)" : "#5a3a8a", animation: "fadeSlide 0.3s ease" }}>
          {done ? "✦ " + task.cheers[1] : "→ " + task.cheers[0]}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════════════════
function CalendarStrip({ completedDays, isA }) {
  const days = [];
  for (let i = 20; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    days.push({ key: k, label: d.toLocaleDateString("ru", { weekday: "short" }).slice(0, 2).toUpperCase(), num: d.getDate() });
  }
  return (
    <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4 }}>
      {days.map(({ key, label, num }) => {
        const st = completedDays[key]; const isToday = key === today();
        return (
          <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 30 }}>
            <span style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: 9, color: isA ? "#c08aaa" : "#6a4a8a" }}>{label}</span>
            <div style={{ width: 26, height: 26, borderRadius: isA ? (st === "A" ? "50%" : 4) : 4,
                background: st === "A" ? "linear-gradient(135deg,#f9a8d4,#e879a8)" : st === "B" ? "linear-gradient(135deg,#7c3aed,#b89fff)" : "transparent",
                border: `1.5px solid ${isToday ? (isA ? "#e879a8" : "#b89fff") : st ? "transparent" : (isA ? "rgba(232,121,168,0.25)" : "rgba(184,159,255,0.18)")}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: st === "B" ? "0 0 10px rgba(184,159,255,0.4)" : st === "A" ? "0 0 8px rgba(232,121,168,0.3)" : "none", transition: "all 0.3s" }}>
              <span style={{ color: st ? "#fff" : (isA ? "#c08aaa" : "#6a4a8a"), fontFamily: isA ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: 9, fontWeight: 700 }}>{num}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DIRECTION PAGE
// ═══════════════════════════════════════════════════════════════════════
const DIRECTIONS = {
  a1: { title: "Маркетинг", subtitle: "Grind University", color: "#e879a8", colorDim: "rgba(232,121,168,0.15)", imageSrc: null, imageHint: "Персонаж: девочка с кистью и маркетингом", defaultText: "Мой план по маркетингу:\n\n— Пройти модуль в Grind University\n— Придумать идею для личного проекта\n— Сделать заметки по уроку\n\nПиши что хочешь — этот текст только твой 🌸" },
  a2: { title: "Навыки продаж", subtitle: "Книги / курсы", color: "#f472b6", colorDim: "rgba(244,114,182,0.15)", imageSrc: null, imageHint: "Персонаж: уверенная девушка с книгой", defaultText: "Что читаю сейчас:\n\nЧто хочу освоить:\n\nМои инсайты:" },
  a3: { title: "Дизайн в Figma", subtitle: "SuperFigma", color: "#c084fc", colorDim: "rgba(192,132,252,0.15)", imageSrc: null, imageHint: "Персонаж: художница с планшетом", defaultText: "Текущий проект:\n\nЧто изучаю:\n\nИдеи для практики:" },
  a4: { title: "Китайский", subtitle: "Дорамы / сайт", color: "#fb7185", colorDim: "rgba(251,113,133,0.15)", imageSrc: null, imageHint: "Персонаж: девочка в китайском стиле", defaultText: "Слова дня:\n\nФразы из дорамы:\n\nПрогресс:\n\n加油！你可以的！" },
  a5: { title: "Личный проект", subtitle: "Сайт через ИИ", color: "#a78bfa", colorDim: "rgba(167,139,250,0.15)", imageSrc: null, imageHint: "Персонаж: девочка-разработчик с ноутбуком", defaultText: "Проект:\n\nЧто делаю сегодня:\n\nПромпты которые сработали:" },
  b1: { title: "Программирование", subtitle: "Core Objective", color: "#b89fff", colorDim: "rgba(184,159,255,0.12)", imageSrc: null, imageHint: "Персонаж: техно-девушка с голографическим экраном", defaultText: "Что изучаю:\n\nСниппеты:\n\n// TODO: напиши свои цели\n// каждый день код — каждый день рост" },
  b2: { title: "3D в Blender", subtitle: "Mesh Operations", color: "#8b5cf6", colorDim: "rgba(139,92,246,0.12)", imageSrc: null, imageHint: "Персонаж: 3D-дизайнер с моделью", defaultText: "Текущая модель:\n\nЧто изучаю:\n\nHotkeys которые запомнил:\n\n// TOPOLOGY IS EVERYTHING" },
  b3: { title: "Японский", subtitle: "Anki + Game", color: "#a78bfa", colorDim: "rgba(167,139,250,0.12)", imageSrc: null, imageHint: "Персонаж: аниме-персонаж с книгой", defaultText: "Слова дня:\n\nГрамматика:\n\nИз аниме/игры:\n\n// 継続は力なり" },
  b4: { title: "Английский", subtitle: "Passive Input", color: "#7c3aed", colorDim: "rgba(124,58,237,0.12)", imageSrc: null, imageHint: "Персонаж: крутой персонаж с наушниками", defaultText: "Фразы из Rick & Morty:\n\nНовые слова:\n\nЧто слушаю:\n\n// PASSIVE INPUT IS STILL INPUT" },
  b5: { title: "3D / Дизайн проект", subtitle: "Personal Build", color: "#9333ea", colorDim: "rgba(147,51,234,0.12)", imageSrc: null, imageHint: "Персонаж: художник-технарь с планшетом", defaultText: "Проект:\n\nСегодняшняя задача:\n\nРеференсы:\n\n// SHIP IT. REFINE LATER." },
};

function DirectionPage({ dirId, isA, onBack }) {
  const s = useStore();
  const dir = DIRECTIONS[dirId];
  const [text, setText] = useState(s.directionNotes?.[dirId] ?? dir.defaultText);
  const saveText = (val) => { setText(val); store.set(prev => ({ directionNotes: { ...prev.directionNotes, [dirId]: val } })); };
  const bg = isA ? "linear-gradient(160deg,#fff5fb,#fde8f7,#ede0ff)" : "linear-gradient(160deg,#0e0820,#160c38,#1a0e44)";
  const cardBg = isA ? "rgba(255,255,255,0.62)" : "rgba(22,14,50,0.75)";
  const border = isA ? "rgba(232,121,168,0.25)" : "rgba(184,159,255,0.14)";
  const muted = isA ? "#b06090" : "#8060b0";
  const font = isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif";
  const mono = isA ? "'Nunito',sans-serif" : "'DM Mono',monospace";
  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: bg, position: "relative", overflow: "hidden" }}>
      {isA ? <PetalCanvas degradeLevel={0} /> : <ElegantCanvas degradeLevel={0} />}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 780, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ paddingTop: 28, marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: isA ? 99 : 8, color: muted, fontFamily: font, fontSize: 13, padding: "8px 18px", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = dir.color; e.currentTarget.style.color = dir.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}>
            {isA ? "← Назад" : "← BACK"}
          </button>
        </div>
        {/* Hero */}
        <div style={{ borderRadius: isA ? 28 : 12, overflow: "hidden", marginBottom: 20, position: "relative", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", minHeight: 220, display: "flex", alignItems: "stretch" }}>
          {!isA && <div style={{ position: "absolute", inset: 0, borderRadius: 12 }}><HUDFrame color={`${dir.color}55`} size={18} thick={1.5} /></div>}
          <div style={{ flex: 1, padding: "32px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: dir.color, letterSpacing: isA ? 0 : 2, marginBottom: 6, opacity: 0.8 }}>{isA ? "✦ направление" : "// DIRECTION"}</div>
            <h1 style={{ fontFamily: isA ? "'Pacifico',cursive" : "'Orbitron',monospace", fontSize: isA ? 36 : 26, fontWeight: isA ? 400 : 900, letterSpacing: isA ? 0 : 2, lineHeight: 1.2, marginBottom: 8, ...(isA ? { background: `linear-gradient(135deg,${dir.color},#c084fc)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: dir.color, textShadow: `0 0 30px ${dir.color}55` }) }}>
              {dir.title}
            </h1>
            <div style={{ fontFamily: font, fontSize: 13, color: muted }}>{dir.subtitle}</div>
          </div>
          <div style={{ width: 200, flexShrink: 0, position: "relative", overflow: "hidden" }}>
            {dir.imageSrc ? (
              // ═══════════════════════════════════════════════════════════
              // ▼ МЕСТО ДЛЯ ИЗОБРАЖЕНИЯ ПЕРСОНАЖА
              // Замени imageSrc в объекте DIRECTIONS[dirId] выше.
              // Используй PNG с прозрачностью — персонаж будет
              // плавно сливаться с фоном карточки.
              // Пример: imageSrc: "/chars/marketing-girl.png"
              // ═══════════════════════════════════════════════════════════
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <img src={dir.imageSrc} alt={dir.imageHint}
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain",
                    filter: isA ? `drop-shadow(0 0 20px ${dir.color}44)` : `drop-shadow(0 0 30px ${dir.color}66)`,
                    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 25%, black 80%, transparent 100%)",
                    maskImage: "linear-gradient(to right, transparent 0%, black 25%, black 80%, transparent 100%)" }} />
              </div>
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${dir.colorDim},transparent)`, gap: 8 }}>
                <div style={{ fontSize: 44, opacity: 0.35 }}>{isA ? "🦊" : "🤖"}</div>
                <div style={{ fontFamily: mono, fontSize: 9, color: dir.color, opacity: 0.4, textAlign: "center", padding: "0 12px", lineHeight: 1.5 }}>{dir.imageHint}</div>
                <div style={{ fontFamily: mono, fontSize: 8, color: muted, opacity: 0.3, textAlign: "center", padding: "0 12px" }}>
                  {isA ? "вставь imageSrc выше ↑" : "// set imageSrc above ↑"}
                </div>
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${cardBg} 0%, transparent 40%)`, pointerEvents: "none" }} />
          </div>
        </div>
        {/* Notes */}
        <div style={{ borderRadius: isA ? 22 : 10, background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", padding: "22px 24px", position: "relative" }}>
          {!isA && <HUDFrame color={`${dir.color}33`} size={10} thick={1} />}
          <div style={{ fontFamily: mono, fontWeight: 800, fontSize: isA ? 14 : 12, color: muted, marginBottom: 12, letterSpacing: isA ? 0 : 1 }}>{isA ? "✦ Мои заметки и план" : "// notes.md"}</div>
          <textarea value={text} onChange={e => saveText(e.target.value)}
            style={{ width: "100%", minHeight: 200, background: isA ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)", border: `1px solid ${border}`, borderRadius: isA ? 14 : 6, color: isA ? "#4a1942" : "#c8a8f0", fontFamily: isA ? "'Nunito',sans-serif" : mono, fontSize: isA ? 13 : 12, padding: "14px 16px", resize: "vertical", outline: "none", lineHeight: 1.8, transition: "border-color 0.2s" }}
            onFocus={e => e.currentTarget.style.borderColor = dir.color}
            onBlur={e => e.currentTarget.style.borderColor = border} />
          <div style={{ marginTop: 8, fontFamily: mono, fontSize: 11, color: muted, opacity: 0.6 }}>{isA ? "✦ сохраняется автоматически" : "// auto-saved to localStorage"}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════
function Toast({ msg, isA, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4200); return () => clearTimeout(t); }, [onClose]);
  const acc = isA ? "#e879a8" : "#b89fff";
  return (
    <div style={{ position: "fixed", bottom: 90, right: 24, maxWidth: 320, zIndex: 600,
        background: isA ? "rgba(255,240,252,0.97)" : "rgba(20,12,45,0.97)",
        border: `1px solid ${acc}55`, borderRadius: isA ? 16 : 10, padding: "12px 16px", backdropFilter: "blur(20px)",
        color: isA ? "#7a3060" : "#c8a8ff", fontFamily: isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif",
        fontSize: isA ? 14 : 13, lineHeight: 1.5,
        boxShadow: isA ? "0 8px 40px rgba(232,121,168,0.25)" : "0 8px 40px rgba(100,60,180,0.3)",
        animation: "toastIn 0.4s cubic-bezier(.34,1.56,.64,1)" }}>
      {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INTRO
// ═══════════════════════════════════════════════════════════════════════
function IntroScreen({ onChoose }) {
  const [hov, setHov] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 30% 40%,#1e0a3c,#050510 65%)", zIndex: 900, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {[...Array(35)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: i % 5 === 0 ? 3 : 2, height: i % 5 === 0 ? 3 : 2, borderRadius: "50%", background: i % 3 === 0 ? "#f9a8d4" : i % 3 === 1 ? "#b89fff" : "#fff", left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 90}%`, opacity: 0.15 + Math.random() * 0.55, animation: `twinkle ${1.5 + Math.random() * 3}s ease-in-out infinite`, animationDelay: `${Math.random() * 4}s` }} />
      ))}
      <div style={{ textAlign: "center", animation: "fadeIn 0.9s ease", position: "relative", zIndex: 1, padding: "0 20px" }}>
        <div style={{ fontFamily: "'Pacifico',cursive", fontSize: 16, color: "rgba(249,168,212,0.55)", letterSpacing: 10, marginBottom: 6 }}>日々</div>
        <h1 style={{ fontFamily: "'Pacifico',cursive", fontSize: "clamp(40px,6vw,72px)", margin: "0 0 8px", background: "linear-gradient(135deg,#f9a8d4,#e879a8,#c084fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 40px rgba(232,121,168,0.3))" }}>NikoNichi</h1>
        <p style={{ color: "rgba(190,160,230,0.65)", fontFamily: "'Nunito',sans-serif", fontSize: 15, marginBottom: 52 }}>Сегодня я хочу быть...</p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { d: "A", em: "🦊", name: "Юмэ", df: "'Pacifico',cursive", desc: "Креативный день\nМечты и творчество\nРасти с любовью", hint: "Нажми, чтобы начать ✨", fs: 28, acc: "#e879a8", r: 28 },
            { d: "B", em: "🤖", name: "КЕН", df: "'Orbitron',monospace", desc: "CODE + 3D\nGRIND PROTOCOL\nEXECUTE GREATNESS", hint: "> INITIALIZE...", fs: 20, acc: "#b89fff", r: 12 },
          ].map(({ d, em, name, df, desc, hint, fs, acc, r }) => (
            <div key={d} onClick={() => onChoose(d)} onMouseEnter={() => setHov(d)} onMouseLeave={() => setHov(null)}
              style={{ width: 210, padding: "2.2rem 1.8rem", borderRadius: r, cursor: "pointer",
                background: hov === d ? `rgba(${d === "A" ? "255,240,250" : "184,159,255"},0.12)` : `rgba(${d === "A" ? "255,240,250" : "184,159,255"},0.05)`,
                border: `1px solid ${hov === d ? acc + "aa" : acc + "22"}`,
                boxShadow: hov === d ? `0 0 60px ${acc}33,0 20px 60px rgba(0,0,0,0.35)` : "0 10px 40px rgba(0,0,0,0.2)",
                transform: hov === d ? "translateY(-10px) scale(1.03)" : "translateY(0) scale(1)",
                transition: "all 0.4s cubic-bezier(.34,1.2,.64,1)", position: "relative" }}>
              {d === "B" && <HUDFrame color={hov === "B" ? "rgba(184,159,255,0.7)" : "rgba(184,159,255,0.3)"} size={16} thick={1.5} />}
              <div style={{ fontSize: 66, marginBottom: 14, filter: `drop-shadow(0 0 20px ${acc}55)` }}>{em}</div>
              <div style={{ fontFamily: df, fontSize: fs, color: acc, marginBottom: 10, letterSpacing: d === "B" ? 2 : 0, textShadow: d === "B" ? `0 0 20px ${acc}55` : "none" }}>{name}</div>
              <div style={{ fontFamily: d === "A" ? "'Nunito',sans-serif" : "'DM Sans',sans-serif", fontSize: 13, color: `${acc}99`, lineHeight: 1.8, whiteSpace: "pre-line" }}>{desc}</div>
              <div style={{ marginTop: 14, height: 18, fontFamily: d === "A" ? "'Nunito',sans-serif" : "'DM Mono',monospace", fontSize: 12, color: acc, fontStyle: d === "A" ? "italic" : "normal", opacity: hov === d ? 1 : 0, transition: "opacity 0.3s" }}>{hint}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════
function GS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Pacifico&family=Orbitron:wght@400;700;900&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      html,body{width:100%;min-height:100%}
      ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(184,159,255,0.2);border-radius:99px}
      textarea,input{font-family:inherit}
      @keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
      @keyframes fadeSlide{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
      @keyframes mascotBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
      @keyframes toastIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
      @keyframes speechIn{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
      @keyframes twinkle{0%,100%{opacity:0.15}50%{opacity:0.85}}
      @keyframes bossFloat{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-8px) rotate(2deg)}}
      @keyframes degradePulse{0%,100%{opacity:1}50%{opacity:0.7}}
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════
export default function NikoNichi() {
  const s = useStore();
  const isA = s.activeDay === "A";
  const tasks = isA ? DAY_A_TASKS : DAY_B_TASKS;

  const [timerTask, setTimerTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [speech, setSpeech] = useState(null);
  const [showContract, setShowContract] = useState(false);
  const [showNoMind, setShowNoMind] = useState(false);
  const [showFuture, setShowFuture] = useState(false);
  const [showBoss, setShowBoss] = useState(false);
  const [bossAccepted, setBossAccepted] = useState(false);

  const missed = useMemo(() => getMissedStreak(), [s.completedDays]);
  const weekKey = getWeekKey();
  const degradeLevel = Math.min(4, missed);
  const degradeFilter = degradeLevel > 0 ? `saturate(${Math.max(0.2, 1 - degradeLevel * 0.2)}) brightness(${Math.max(0.7, 1 - degradeLevel * 0.07)})` : "none";

  // Реплика при пропусках — один раз в день
  useEffect(() => {
    if (!s.activeDay) return;
    const k = `speech_${today()}`;
    if (localStorage.getItem(k)) return;
    if (missed >= 3) { setSpeech(getLine(isA, "missed3")); localStorage.setItem(k, "1"); }
    else if (missed === 2) { setSpeech(getLine(isA, "missed2")); localStorage.setItem(k, "1"); }
    else if (missed === 1) { setSpeech(getLine(isA, "missed1")); localStorage.setItem(k, "1"); }
  }, [s.activeDay, missed]);

  // Босс в понедельник
  useEffect(() => {
    if (new Date().getDay() !== 1 || s.bossHistory?.[weekKey] || !s.activeDay) return;
    const bk = `boss_shown_${weekKey}`;
    if (!localStorage.getItem(bk)) { setTimeout(() => setShowBoss(true), 1500); localStorage.setItem(bk, "1"); }
  }, [s.activeDay]);

  const getKey = (id) => `${today()}_${id}`;
  const isDone = (id) => !!s.completedTasks[getKey(id)];
  const doneTasks = tasks.filter(t => isDone(t.id)).length;
  const rep = s.rep || { discipline: 0, focus: 0, creativity: 0, practice: 0 };

  const toggle = useCallback((task) => {
    const key = getKey(task.id);
    const wasDone = isDone(task.id);
    const rg = task.rep || {};
    store.set(prev => ({
      completedTasks: { ...prev.completedTasks, [key]: !wasDone },
      rep: Object.fromEntries(
        Object.entries(prev.rep || { discipline: 0, focus: 0, creativity: 0, practice: 0 }).map(([k, v]) =>
          [k, wasDone ? Math.max(0, v - (rg[k] || 0)) : v + (rg[k] || 0)]
        )
      ),
    }));
    setSpeech(getLine(isA, wasDone ? "taskUndone" : "taskDone"));

    // Контракт выполнен
    if (!wasDone && s.contract?.taskId === task.id && s.contract?.createdAt === today()) {
      setTimeout(() => {
        setSpeech(getLine(isA, "contractKept"));
        setToast(isA ? "🌸 Контракт выполнен! Дисциплина +30!" : "✦ CONTRACT KEPT. DISCIPLINE +30.");
        store.set(prev => ({
          rep: { ...prev.rep, discipline: (prev.rep?.discipline || 0) + 30 },
          contractHistory: [...(prev.contractHistory || []), { taskId: task.id, kept: true, date: today() }],
          contract: null,
        }));
      }, 300);
    }

    // День закрыт
    setTimeout(() => {
      const upd = store.get().completedTasks;
      if (tasks.every(t => !!upd[`${today()}_${t.id}`])) {
        store.set(prev => ({ completedDays: { ...prev.completedDays, [today()]: s.activeDay } }));
        setSpeech(getLine(isA, "dayDone"));
        if (bossAccepted) {
          store.set(prev => ({
            rep: { discipline: (prev.rep?.discipline || 0) + 30, focus: (prev.rep?.focus || 0) + 30, creativity: (prev.rep?.creativity || 0) + 30, practice: (prev.rep?.practice || 0) + 30 },
            bossHistory: { ...prev.bossHistory, [weekKey]: { beaten: true } },
          }));
          setToast(isA ? "🏆 БОСС ПОВЕРЖЕН! +30 ко всем статам!" : "🏆 BOSS DEFEATED. ALL STATS +30.");
        }
      }
    }, 100);
  }, [isA, tasks, s.activeDay, s.contract, bossAccepted, weekKey]);

  const bgA = degradeLevel > 2 ? "linear-gradient(160deg,#f0eaf4,#e8ddf0,#e4d8ee)" : "linear-gradient(160deg,#fff5fb,#fde8f7,#ede0ff)";
  const bgB = degradeLevel > 2 ? "linear-gradient(160deg,#080610,#0c0820,#0e0a1a)" : "linear-gradient(160deg,#0e0820,#160c38,#1a0e44)";
  const cardBg = isA ? `rgba(255,255,255,${Math.max(0.35, 0.62 - degradeLevel * 0.06)})` : "rgba(22,14,50,0.75)";
  const border = isA ? "rgba(232,121,168,0.25)" : "rgba(184,159,255,0.14)";
  const muted = isA ? "#b06090" : "#8060b0";
  const font = isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif";
  const mono = isA ? "'Nunito',sans-serif" : "'DM Mono',monospace";
  const acc = isA ? "#e879a8" : "#b89fff";

  if (s.activePage) return <><GS /><DirectionPage dirId={s.activePage} isA={isA} onBack={() => store.set(() => ({ activePage: null }))} /></>;
  if (!s.activeDay) return <><GS /><IntroScreen onChoose={d => store.set(() => ({ activeDay: d }))} /></>;
  if (showFuture) return <><GS /><FutureSelfScreen rep={rep} completedDays={s.completedDays} isA={isA} onClose={() => setShowFuture(false)} /></>;
  if (showNoMind) return <><GS /><NoMindMode tasks={tasks} isA={isA} completedToday={s.completedTasks} onClose={() => setShowNoMind(false)} /></>;

  return (
    <>
      <GS />
      <div style={{ width: "100vw", minHeight: "100vh", background: isA ? bgA : bgB, transition: "background 1s ease", position: "relative", overflow: "hidden", filter: degradeFilter }}>
        {isA ? <PetalCanvas degradeLevel={degradeLevel} /> : <ElegantCanvas degradeLevel={degradeLevel} />}
        {!isA && <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.025) 3px,rgba(0,0,0,0.025) 4px)" }} />}
        {!isA && <>
          <div style={{ position: "fixed", top: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,rgba(124,58,237,${Math.max(0.04, 0.12 - degradeLevel * 0.025)}) 0%,transparent 70%)`, pointerEvents: "none", zIndex: 1 }} />
          <div style={{ position: "fixed", bottom: "-15%", left: "-8%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,rgba(184,159,255,${Math.max(0.03, 0.1 - degradeLevel * 0.02)}) 0%,transparent 70%)`, pointerEvents: "none", zIndex: 1 }} />
        </>}
        {degradeLevel >= 3 && <div style={{ position: "fixed", inset: 0, background: isA ? "rgba(100,80,100,0.08)" : "rgba(20,10,20,0.15)", pointerEvents: "none", zIndex: 2, animation: "degradePulse 4s ease-in-out infinite" }} />}

        <div style={{ width: "100%", maxWidth: 760, margin: "0 auto", padding: "0 24px 100px", position: "relative", zIndex: 3 }}>

          {/* HEADER */}
          <div style={{ paddingTop: 36, paddingBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              {isA ? (
                <>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, color: "#c08aaa", marginBottom: 5 }}>
                    {new Date().toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long" })} ✦
                  </div>
                  <h1 style={{ fontFamily: "'Pacifico',cursive", fontSize: "clamp(26px,4.5vw,44px)", ...(degradeLevel > 1 ? { color: "#b08090" } : { background: "linear-gradient(135deg,#e879a8,#c084fc,#f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }), lineHeight: 1.1, margin: 0 }}>
                    {degradeLevel >= 3 ? "День Юмэ..." : "День Юмэ ✿"}
                  </h1>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: degradeLevel > 1 ? "#908090" : "#c08aaa", marginTop: 5, fontStyle: "italic" }}>
                    {degradeLevel >= 3 ? "Лепестки увядают. Ты помнишь, зачем начинала?" : degradeLevel >= 1 ? "Вернись. Мечты ждут 🌸" : "Твой день для роста и мечтаний 💕"}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: mono, fontSize: 10, color: degradeLevel > 1 ? "#3a2a4a" : "#5a3a8a", letterSpacing: 1.5, marginBottom: 7 }}>
                    {`${today()} // ${degradeLevel > 0 ? `ALERT: ${missed}_DAYS_MISSED` : "OPERATOR: КЕН"}`}
                  </div>
                  <h1 style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: "clamp(20px,3.5vw,36px)", color: degradeLevel > 1 ? "#6a4a8a" : "#c8a8ff", letterSpacing: 2, textShadow: degradeLevel < 2 ? "0 0 30px rgba(184,159,255,0.35)" : "none", margin: 0 }}>
                    {degradeLevel >= 3 ? "ДЕНЬ КЕН..." : "ДЕНЬ КЕН"}
                  </h1>
                  <div style={{ fontFamily: mono, fontSize: 11, color: degradeLevel > 1 ? "#3a2a4a" : "#6a4a9a", marginTop: 6 }}>
                    {degradeLevel >= 3 ? "// SYSTEM: DEGRADING. RESTART REQUIRED." : degradeLevel >= 1 ? "// WARNING: STREAK BROKEN. RECOVER." : "Фокус. Код. Рост. Каждый день."}
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {["A", "B"].map(d => (
                  <button key={d} onClick={() => store.set(() => ({ activeDay: d }))}
                    style={{ padding: "8px 18px", borderRadius: d === "A" ? 99 : 8, cursor: "pointer", border: `1.5px solid ${s.activeDay === d ? (d === "A" ? "#e879a8" : "#b89fff") : "rgba(150,130,180,0.2)"}`, background: s.activeDay === d ? (d === "A" ? "rgba(232,121,168,0.18)" : "rgba(184,159,255,0.15)") : "transparent", color: s.activeDay === d ? (d === "A" ? "#e879a8" : "#b89fff") : "rgba(150,130,180,0.4)", fontFamily: d === "A" ? "'Nunito',sans-serif" : "'Orbitron',monospace", fontSize: d === "A" ? 13 : 11, fontWeight: 800, letterSpacing: d === "B" ? 1 : 0, transition: "all 0.25s ease" }}>
                    {d === "A" ? "🌸 А" : "⚡ Б"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {[
                  { la: "✿ без мыслей", lb: "// no-mind", fn: () => setShowNoMind(true), active: false },
                  { la: "✦ будущее", lb: "// +3mo", fn: () => setShowFuture(true), active: false },
                  { la: s.contract ? "✦ контракт ✓" : "✦ контракт", lb: s.contract ? "// CONTRACT ✓" : "// contract", fn: () => setShowContract(true), active: !!s.contract },
                ].map(({ la, lb, fn, active }, i) => (
                  <button key={i} onClick={fn}
                    style={{ padding: "6px 12px", borderRadius: isA ? 99 : 6, border: `1px solid ${active ? acc + "cc" : acc + "44"}`, background: active ? `${acc}18` : "transparent", color: active ? acc : muted, fontFamily: mono, fontSize: 11, cursor: "pointer", fontWeight: active ? 700 : 400, transition: "all 0.2s" }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = acc; e.currentTarget.style.color = acc; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = acc + "44"; e.currentTarget.style.color = muted; } }}>
                    {isA ? la : lb}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ПРЕДУПРЕЖДЕНИЕ О ПРОПУСКАХ */}
          {missed >= 2 && (
            <div style={{ background: isA ? "rgba(255,200,200,0.3)" : "rgba(60,20,20,0.5)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: isA ? 18 : 8, padding: "12px 18px", marginBottom: 14, backdropFilter: "blur(10px)" }}>
              <div style={{ fontFamily: font, fontSize: 13, color: isA ? "#b04040" : "#f87171", lineHeight: 1.6 }}>
                {isA ? `🌧️ Пропущено ${missed} дня подряд. Лепестки теряют цвет.` : `⚠ ALERT: ${missed} DAYS MISSED. SYSTEM DEGRADING.`}
              </div>
            </div>
          )}

          {/* КОНТРАКТ БАННЕР */}
          {s.contract?.createdAt === today() && (() => {
            const ct = tasks.find(t => t.id === s.contract.taskId);
            return ct ? (
              <div style={{ background: isA ? "rgba(232,121,168,0.1)" : "rgba(184,159,255,0.08)", border: `1px solid ${acc}55`, borderRadius: isA ? 18 : 8, padding: "12px 18px", marginBottom: 14, backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>{ct.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: mono, fontSize: 11, color: muted, marginBottom: 2 }}>{isA ? "✦ Контракт дня" : "// DAILY CONTRACT"}</div>
                  <div style={{ fontFamily: font, fontSize: 13, color: acc, fontWeight: 700 }}>{ct.label}</div>
                </div>
                {isDone(ct.id) && <div style={{ color: "#4ade80", fontFamily: mono, fontSize: 12, fontWeight: 700 }}>{isA ? "ВЫПОЛНЕНО ✓" : "KEPT ✓"}</div>}
              </div>
            ) : null;
          })()}

          {/* ПРОГРЕСС */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: isA ? 22 : 10, padding: "18px 22px", marginBottom: 14, backdropFilter: "blur(20px)", position: "relative", boxShadow: isA ? "0 8px 40px rgba(232,121,168,0.12)" : "0 8px 40px rgba(100,60,180,0.15)" }}>
            {!isA && <HUDFrame color="rgba(184,159,255,0.3)" size={11} thick={1} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'Orbitron',monospace", fontWeight: 800, fontSize: isA ? 15 : 12, color: isA ? "#4a1942" : "#c8a8ff", letterSpacing: isA ? 0 : 1 }}>
                {isA ? "✨ Сегодня тебя ждут" : "MISSION QUEUE"}
                {bossAccepted && <span style={{ marginLeft: 8, fontSize: 11, color: acc }}>⚔️ BOSS DAY</span>}
              </span>
              <span style={{ fontFamily: isA ? "'Nunito',sans-serif" : mono, fontSize: isA ? 15 : 12, color: acc, fontWeight: 700 }}>
                {isA ? `${doneTasks}/${tasks.length} ✦` : `[${doneTasks}/${tasks.length}]`}
              </span>
            </div>
            <div style={{ height: isA ? 12 : 8, background: isA ? "rgba(232,121,168,0.1)" : "rgba(184,159,255,0.08)", borderRadius: isA ? 99 : 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(doneTasks / tasks.length) * 100}%`, background: isA ? "linear-gradient(90deg,#f9a8d4,#e879a8,#c084fc)" : "linear-gradient(90deg,#7c3aed,#b89fff,#d4b8ff)", borderRadius: isA ? 99 : 3, transition: "width 0.8s cubic-bezier(.34,1.2,.64,1)", boxShadow: !isA ? "0 0 14px rgba(184,159,255,0.45)" : "none", position: "relative", overflow: "hidden" }}>
                {isA && <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)", animation: "shimmer 2s ease-in-out infinite" }} />}
              </div>
            </div>
            {isA && doneTasks === tasks.length && <div style={{ marginTop: 8, textAlign: "center", fontFamily: "'Pacifico',cursive", fontSize: 14, color: "#e879a8" }}>✨ Ты справилась! Это просто магия!</div>}
          </div>

          {/* ЗАДАЧИ */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: isA ? 22 : 10, padding: "18px 18px 12px", marginBottom: 14, backdropFilter: "blur(20px)" }}>
            <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'Orbitron',monospace", fontWeight: 800, fontSize: isA ? 14 : 11, color: isA ? "#b06090" : "#7a5aaa", marginBottom: 14, paddingBottom: 10, letterSpacing: isA ? 0 : 1.5, borderBottom: `1px solid ${border}` }}>
              {isA ? "✦ Твои задачи на день" : "ACTIVE MISSIONS"}
            </div>
            {tasks.map((task, i) => isA
              ? <TaskCardA key={task.id} task={task} done={isDone(task.id)} isContract={s.contract?.taskId === task.id && s.contract?.createdAt === today()} onToggle={() => toggle(task)} onTimer={() => setTimerTask(task)} onOpen={() => store.set(() => ({ activePage: task.id }))} />
              : <TaskCardB key={task.id} task={task} done={isDone(task.id)} idx={i} isContract={s.contract?.taskId === task.id && s.contract?.createdAt === today()} onToggle={() => toggle(task)} onTimer={() => setTimerTask(task)} onOpen={() => store.set(() => ({ activePage: task.id }))} />
            )}
          </div>

          {/* РЕПУТАЦИЯ */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: isA ? 22 : 10, padding: "18px 22px", marginBottom: 14, backdropFilter: "blur(20px)", position: "relative" }}>
            {!isA && <HUDFrame color="rgba(184,159,255,0.22)" size={10} thick={1} />}
            <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'Orbitron',monospace", fontWeight: 800, fontSize: isA ? 14 : 11, color: isA ? "#b06090" : "#7a5aaa", marginBottom: 16, letterSpacing: isA ? 0 : 1.5 }}>
              {isA ? "✦ Репутация" : "REPUTATION MATRIX"}
            </div>
            {REP_STATS.map(stat => <RepBar key={stat.key} stat={stat} value={rep[stat.key] || 0} isA={isA} degradeLevel={degradeLevel} />)}
            <div style={{ fontFamily: mono, fontSize: 11, color: muted, marginTop: 8, opacity: 0.7 }}>
              {isA ? "✦ Каждое действие качает разные статы" : "// each action builds different stats"}
            </div>
          </div>

          {/* CALENDAR */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: isA ? 22 : 10, padding: "18px 22px", marginBottom: 14, backdropFilter: "blur(20px)" }}>
            <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'Orbitron',monospace", fontWeight: 800, fontSize: isA ? 14 : 11, color: isA ? "#b06090" : "#7a5aaa", marginBottom: 14, letterSpacing: isA ? 0 : 1.5 }}>
              {isA ? "🌸 Цепочка успеха" : "ACTIVITY LOG"}
            </div>
            <CalendarStrip completedDays={s.completedDays} isA={isA} />
            <div style={{ marginTop: 10, fontFamily: mono, fontSize: 11, color: muted, fontStyle: isA ? "italic" : "normal" }}>
              {missed > 0
                ? (isA ? `⚠️ ${missed} дня без практики. Цепочка ждёт.` : `// ${missed} DAYS BROKEN. RESTART NOW.`)
                : (isA ? "💕 Каждый закрашенный день — победа над собой!" : "// consistency = mastery. Never skip.")}
            </div>
          </div>

          {/* ЗАМЕТКА */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: isA ? 22 : 10, padding: "18px 22px", backdropFilter: "blur(20px)" }}>
            <div style={{ fontFamily: isA ? "'Nunito',sans-serif" : "'Orbitron',monospace", fontWeight: 800, fontSize: isA ? 14 : 11, color: isA ? "#b06090" : "#7a5aaa", marginBottom: 12, letterSpacing: isA ? 0 : 1.5 }}>
              {isA ? "✿ Быстрая мысль" : "QUICK NOTE"}
            </div>
            <textarea value={s.note} onChange={e => store.set(() => ({ note: e.target.value }))}
              placeholder={isA ? "Запиши идею, пока она живёт... 🌸" : "// thoughts, code, ideas"}
              style={{ width: "100%", minHeight: 90, background: isA ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)", border: `1px solid ${border}`, borderRadius: isA ? 14 : 6, color: isA ? "#4a1942" : "#c8a8f0", fontFamily: isA ? "'Nunito',sans-serif" : mono, fontSize: isA ? 13 : 12, padding: "12px 14px", resize: "vertical", outline: "none", lineHeight: 1.7, transition: "border-color 0.2s" }}
              onFocus={e => e.currentTarget.style.borderColor = isA ? "rgba(232,121,168,0.5)" : "rgba(184,159,255,0.35)"}
              onBlur={e => e.currentTarget.style.borderColor = border} />
          </div>

          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button onClick={() => { if (confirm("Сбросить все данные?")) { localStorage.removeItem(KEY); window.location.reload(); } }}
              style={{ background: "none", border: "none", color: isA ? "rgba(180,100,140,0.2)" : "rgba(184,159,255,0.15)", fontFamily: mono, fontSize: 11, cursor: "pointer" }}>
              {isA ? "✦ сброс" : "// reset"}
            </button>
          </div>
        </div>

        {/* МАСКОТ */}
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 500 }}>
          <div onClick={() => setSpeech(getLine(isA, "taskDone"))}
            style={{ fontSize: 44, cursor: "pointer", filter: isA ? "drop-shadow(0 4px 16px rgba(232,121,168,0.5))" : "drop-shadow(0 0 20px rgba(150,100,255,0.6))", animation: "mascotBob 3s ease-in-out infinite", transition: "transform 0.2s", userSelect: "none" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.18) rotate(-6deg)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1) rotate(0deg)"}>
            {degradeLevel >= 3 ? (isA ? "🌧️" : "💀") : (isA ? "🦊" : "🤖")}
          </div>
        </div>

        {/* МОДАЛЫ */}
        {speech && <CharacterSpeech text={speech} isA={isA} onDismiss={() => setSpeech(null)} />}
        {timerTask && <PomodoroModal task={timerTask} isA={isA} onClose={() => setTimerTask(null)} />}
        {toast && <Toast msg={toast} isA={isA} onClose={() => setToast(null)} />}
        {showContract && (
          <ContractModal tasks={tasks} isA={isA} existingContract={s.contract}
            onConfirm={c => { store.set(() => ({ contract: c })); setShowContract(false); setSpeech(isA ? "Контракт подписан. Теперь это обещание 🌸" : "CONTRACT SIGNED. KEEP YOUR WORD."); }}
            onClose={() => setShowContract(false)} />
        )}
        {showBoss && (
          <BossModal isA={isA}
            onAccept={() => { setBossAccepted(true); setShowBoss(false); setSpeech(getLine(isA, "bossWin")); }}
            onClose={() => setShowBoss(false)} />
        )}
      </div>
    </>
  );
}
