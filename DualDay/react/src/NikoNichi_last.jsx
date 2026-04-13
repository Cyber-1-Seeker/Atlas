import { useState, useEffect, useRef, useCallback } from "react";

// ─── STORE ────────────────────────────────────────────────────────────────────
const KEY = "nikonichi_v3";
const initState = () => ({
  activeDay: null,
  activePage: null, // "yume" | "ken" | null
  completedTasks: {},
  completedDays: {},
  note: "",
  directionNotes: { yume: "", ken: "" },
  xp: { marketing: 0, coding: 0, languages: 0 },
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

// ─── DATA ─────────────────────────────────────────────────────────────────────
const DAY_A_TASKS = [
  { id:"a1", emoji:"🎀", label:"Маркетинг", sub:"Grind University", mins:30, xpCat:"marketing",
    cheers:["Ты создаёшь свой мир, шаг за шагом 💕","Каждый урок — это шаг к мечте ✨","Ты умнее, чем думаешь! 🌸"] },
  { id:"a2", emoji:"📖", label:"Навыки продаж", sub:"Книга / лёгкий курс", mins:20, xpCat:"marketing",
    cheers:["Слова — твоё супероружие 🌷","Читать — значит расти 🌱","Даже 20 минут меняют всё! ✿"] },
  { id:"a3", emoji:"🖌️", label:"Дизайн в Figma", sub:"SuperFigma", mins:30, xpCat:"marketing",
    cheers:["Красота рождается в деталях 🌸","Твой вкус растёт с каждым пикселем 💜","Дизайн — это магия! ✨"] },
  { id:"a4", emoji:"🌸", label:"Китайский", sub:"Дорамы / твой сайт", mins:40, xpCat:"languages",
    cheers:["加油！Давай, ты справишься! 💪","Каждое слово — дверь в новый мир 🗝️","Языки — это суперсила 🌟"] },
  { id:"a5", emoji:"💻", label:"Личный проект", sub:"Сайт через ИИ", mins:30, xpCat:"coding",
    cheers:["Ты строишь свою вселенную! 🌙","Каждая строчка — это твоё 💖","Проект мечты создаётся сейчас ✨"] },
];
const DAY_B_TASKS = [
  { id:"b1", emoji:"⬡", label:"Программирование", sub:"Главный приоритет / Core", mins:60, xpCat:"coding",
    cheers:["Нейронные пути расширяются","Фокус активирован. Выполняй.","Ты и есть алгоритм."] },
  { id:"b2", emoji:"◈", label:"3D в Blender", sub:"Super Blender / Mesh", mins:40, xpCat:"coding",
    cheers:["Геометрия — твой язык","Строй мир. Одна вершина.","Полигоны подчиняются тебе."] },
  { id:"b3", emoji:"◉", label:"Японский", sub:"Игра + Anki протокол", mins:30, xpCat:"languages",
    cheers:["語学力: растёт","言語習得中... идёт захват","Беглость: активирована"] },
  { id:"b4", emoji:"◈", label:"Английский", sub:"Rick & Morty / пассивный ввод", mins:20, xpCat:"languages",
    cheers:["Языковой модуль: загружается","Понимание +2%","Wubba Lubba = прогресс"] },
  { id:"b5", emoji:"⬡", label:"3D / Дизайн проект", sub:"Личный билд / рендер", mins:20, xpCat:"coding",
    cheers:["Рендер-ферма: в сети","Творческое ядро: разблокировано","Отправь. Улучши потом."] },
];
const QUOTES_A = [
  "Ты уже лучше, чем вчера 🌸","Мечты сбываются у тех, кто работает 💕",
  "Ты — главный персонаж своей истории ✨","Каждый маленький шаг — победа 🌷",
  "Верь в себя так, как я верю в тебя 💜","Прогресс реален, даже если ты его не видишь 🌟",
];
const QUOTES_B = [
  "Талант — это просто разблокированный потенциал.","Твоё будущее «я» наблюдает. Не разочаровывай.",
  "Гринд — это путь. Выполняй.","Постоянство > мотивации. Всегда.",
  "Каждый великий разработчик начинал там, где ты.","Отправь. Учись. Итерируй. Доминируй.",
];

// ─── CANVAS: FALLING PETALS ───────────────────────────────────────────────────
function PetalCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    const onResize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    const petals = Array.from({length:32}, () => ({
      x: Math.random()*W, y: Math.random()*H - H,
      r: 5+Math.random()*7, speed: 0.5+Math.random()*1.4,
      drift: (Math.random()-0.5)*0.7, angle: Math.random()*Math.PI*2,
      spin: (Math.random()-0.5)*0.04, hue: 318+Math.random()*44,
      alpha: 0.35+Math.random()*0.5,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      for (const p of petals) {
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
        ctx.beginPath(); ctx.ellipse(0,0,p.r,p.r*0.55,0,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},78%,76%,${p.alpha})`; ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.r*0.3,0,p.r*0.75,p.r*0.42,Math.PI/4,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue+12},72%,82%,${p.alpha*0.65})`; ctx.fill();
        ctx.restore();
        p.y+=p.speed; p.x+=p.drift+Math.sin(p.y*0.014)*0.6; p.angle+=p.spin;
        if(p.y>H+20){p.y=-20;p.x=Math.random()*W;}
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",onResize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}} />;
}

// ─── CANVAS: ELEGANT PARTICLES (День Б — не матрица, а элегантные частицы) ────
function ElegantCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    const onResize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    // Частицы-линии как нейронная сеть
    const dots = Array.from({length:55}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
      r: 1+Math.random()*2,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      // Соединяем близкие точки
      for (let i=0;i<dots.length;i++) {
        for (let j=i+1;j<dots.length;j++) {
          const dx=dots[i].x-dots[j].x, dy=dots[i].y-dots[j].y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<160) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x,dots[i].y);
            ctx.lineTo(dots[j].x,dots[j].y);
            const alpha = (1-dist/160)*0.12;
            ctx.strokeStyle=`rgba(180,140,255,${alpha})`;
            ctx.lineWidth=0.8; ctx.stroke();
          }
        }
      }
      for (const d of dots) {
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(200,160,255,0.35)`; ctx.fill();
        d.x+=d.vx; d.y+=d.vy;
        if(d.x<0||d.x>W) d.vx*=-1;
        if(d.y<0||d.y>H) d.vy*=-1;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",onResize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:0.7}} />;
}

// ─── HUD CORNERS ─────────────────────────────────────────────────────────────
function HUDFrame({color="#b89fff",size=14,thick=1.5}) {
  const s={position:"absolute",width:size,height:size,borderColor:color,borderStyle:"solid"};
  return <>
    <div style={{...s,top:0,left:0,borderWidth:`${thick}px 0 0 ${thick}px`}}/>
    <div style={{...s,top:0,right:0,borderWidth:`${thick}px ${thick}px 0 0`}}/>
    <div style={{...s,bottom:0,left:0,borderWidth:`0 0 ${thick}px ${thick}px`}}/>
    <div style={{...s,bottom:0,right:0,borderWidth:`0 ${thick}px ${thick}px 0`}}/>
  </>;
}

// ─── POMODORO ────────────────────────────────────────────────────────────────
function PomodoroModal({task, isA, onClose}) {
  const [work,setWork]=useState(task.mins);
  const [rest,setRest]=useState(5);
  const [phase,setPhase]=useState("idle");
  const [secs,setSecs]=useState(0);
  const iRef=useRef(null);
  const total=phase==="work"?work*60:rest*60;
  const progress=(phase==="work"||phase==="rest")?1-secs/total:0;
  const mm=String(Math.floor(secs/60)).padStart(2,"0");
  const ss=String(secs%60).padStart(2,"0");
  const r=68; const circ=2*Math.PI*r;
  const acc=isA?"#e879a8":"#b89fff";
  const bg=isA?"linear-gradient(135deg,rgba(255,242,252,0.97),rgba(248,228,255,0.95))"
              :"linear-gradient(135deg,rgba(18,12,38,0.98),rgba(22,14,48,0.97))";
  const txt=isA?"#4a1942":"#e8d5ff";
  const muted=isA?"#b06090":"#9070c0";
  const font=isA?"'Nunito',sans-serif":"'DM Mono','Share Tech Mono',monospace";

  const startWork=()=>{setSecs(work*60);setPhase("work");};
  const stop=()=>{clearInterval(iRef.current);setPhase("idle");setSecs(0);};
  useEffect(()=>{
    if(phase==="work"||phase==="rest"){
      iRef.current=setInterval(()=>setSecs(p=>{
        if(p<=1){clearInterval(iRef.current);setPhase(phase==="work"?"rest_ready":"done");return 0;}
        return p-1;
      }),1000);
    }
    return ()=>clearInterval(iRef.current);
  },[phase]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(14px)"}}>
      <div style={{background:bg,borderRadius:isA?28:8,padding:"2rem",width:340,border:`1px solid ${acc}55`,boxShadow:`0 0 80px ${acc}25,0 24px 80px rgba(0,0,0,0.5)`,position:"relative"}}>
        {!isA&&<HUDFrame color={acc} size={14} thick={1.5}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.4rem"}}>
          <div>
            <div style={{color:muted,fontFamily:font,fontSize:11,letterSpacing:isA?0:1,marginBottom:3}}>{isA?"✦ таймер фокуса":"FOCUS_TIMER"}</div>
            <div style={{color:txt,fontFamily:font,fontWeight:800,fontSize:16}}>{task.label}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:muted,cursor:"pointer",fontSize:22}}>×</button>
        </div>
        {phase==="idle"&&(
          <div style={{display:"flex",gap:10,marginBottom:"1.4rem"}}>
            {[["Фокус",work,setWork,5,90],["Отдых",rest,setRest,1,30]].map(([l,v,sv,mn,mx])=>(
              <label key={l} style={{flex:1,color:muted,fontFamily:font,fontSize:12,display:"flex",flexDirection:"column",gap:4}}>
                {l}<input type="number" value={v} min={mn} max={mx} onChange={e=>sv(+e.target.value)}
                  style={{background:isA?"rgba(255,255,255,0.5)":"rgba(184,159,255,0.1)",border:`1px solid ${acc}44`,borderRadius:isA?10:4,color:txt,fontFamily:font,padding:"6px 10px",fontSize:14,outline:"none",width:"100%"}}/>
              </label>
            ))}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"center",margin:"0.5rem 0 1.4rem"}}>
          <svg width={160} height={160} viewBox="0 0 160 160">
            <circle cx={80} cy={80} r={r} fill="none" stroke={`${acc}22`} strokeWidth={8}/>
            <circle cx={80} cy={80} r={r} fill="none" stroke={acc} strokeWidth={8}
              strokeDasharray={circ} strokeDashoffset={circ*(1-progress)}
              strokeLinecap={isA?"round":"square"} transform="rotate(-90 80 80)"
              style={{transition:"stroke-dashoffset 0.8s linear",filter:isA?"none":`drop-shadow(0 0 8px ${acc})`}}/>
            <text x={80} y={75} textAnchor="middle" fill={txt} fontSize={32} fontFamily={isA?"'Pacifico',cursive":"'Orbitron',monospace"} fontWeight={isA?400:700}>{mm}:{ss}</text>
            <text x={80} y={97} textAnchor="middle" fill={muted} fontSize={11} fontFamily={font}>
              {phase==="work"?(isA?"✿ фокус":"FOCUSED"):phase==="rest"||phase==="rest_ready"?(isA?"☕ отдых":"BREAK"):phase==="done"?(isA?"🌸 готово!":"DONE"):(isA?"нажми старт":"READY")}
            </text>
          </svg>
        </div>
        {phase==="idle"&&<button onClick={startWork} style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${acc},${isA?"#c084fc":"#7c3aed"})`,border:"none",borderRadius:isA?14:6,color:"#fff",fontFamily:font,fontWeight:800,fontSize:15,cursor:"pointer",letterSpacing:isA?0:1}}>{isA?"✨ Начать сессию":"▶ EXECUTE"}</button>}
        {(phase==="work"||phase==="rest")&&<button onClick={stop} style={{width:"100%",padding:"13px",background:"transparent",border:`1px solid ${acc}44`,borderRadius:isA?14:6,color:muted,fontFamily:font,fontSize:14,cursor:"pointer"}}>{isA?"Остановить":"ABORT"}</button>}
        {phase==="rest_ready"&&<div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setSecs(rest*60);setPhase("rest");}} style={{flex:1,padding:"12px",background:`${acc}22`,border:`1px solid ${acc}55`,borderRadius:isA?14:6,color:acc,fontFamily:font,fontSize:13,cursor:"pointer",fontWeight:700}}>{isA?"☕ Отдохнуть":"BREAK"}</button>
          <button onClick={stop} style={{flex:1,padding:"12px",background:"transparent",border:`1px solid ${acc}22`,borderRadius:isA?14:6,color:muted,fontFamily:font,fontSize:13,cursor:"pointer"}}>{isA?"Пропустить":"SKIP"}</button>
        </div>}
        {phase==="done"&&<button onClick={stop} style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${acc},${isA?"#c084fc":"#7c3aed"})`,border:"none",borderRadius:isA?14:6,color:"#fff",fontFamily:font,fontWeight:800,fontSize:15,cursor:"pointer"}}>{isA?"🌸 Молодец!":"COMMIT SUCCESS"}</button>}
      </div>
    </div>
  );
}

// ─── TASK CARD A ──────────────────────────────────────────────────────────────
function TaskCardA({task,done,onToggle,onTimer}) {
  const [hover,setHover]=useState(false);
  const cheer=task.cheers[Math.floor(Date.now()/1000/60/3)%task.cheers.length];
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{borderRadius:18,marginBottom:10,transition:"all 0.3s ease",
        background:done?"linear-gradient(135deg,rgba(232,121,168,0.2),rgba(192,132,252,0.16))":hover?"rgba(255,255,255,0.72)":"rgba(255,255,255,0.52)",
        border:`1px solid ${done?"rgba(232,121,168,0.55)":hover?"rgba(232,121,168,0.4)":"rgba(230,190,220,0.3)"}`,
        backdropFilter:"blur(10px)",padding:"14px 16px",
        boxShadow:hover?"0 8px 32px rgba(232,121,168,0.2)":done?"0 4px 20px rgba(232,121,168,0.14)":"none",
        transform:hover?"translateY(-2px)":"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div onClick={onToggle} style={{flexShrink:0,width:26,height:26,borderRadius:"50%",
            background:done?"linear-gradient(135deg,#e879a8,#c084fc)":"rgba(255,255,255,0.85)",
            border:`2px solid ${done?"transparent":"rgba(232,121,168,0.4)"}`,
            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
            boxShadow:done?"0 0 18px rgba(232,121,168,0.55)":"none",
            transition:"all 0.3s cubic-bezier(.34,1.56,.64,1)",
            transform:done?"scale(1.1)":hover?"scale(1.06)":"scale(1)"}}>
          {done&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
        </div>
        <div style={{fontSize:22}}>{task.emoji}</div>
        <div style={{flex:1,cursor:"pointer"}} onClick={onToggle}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:14,color:done?"#b06090":"#4a1942",textDecoration:done?"line-through":"none",transition:"all 0.2s"}}>{task.label}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:"#b06090",marginTop:1}}>{task.sub} · {task.mins} мин</div>
        </div>
        <button onClick={onTimer}
          style={{background:"rgba(232,121,168,0.1)",border:"1px solid rgba(232,121,168,0.3)",borderRadius:10,color:"#c06090",fontFamily:"'Nunito',sans-serif",fontSize:12,padding:"5px 10px",cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(232,121,168,0.25)";e.currentTarget.style.transform="scale(1.05)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(232,121,168,0.1)";e.currentTarget.style.transform="scale(1)";}}>⏱ старт</button>
      </div>
      {(hover||done)&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(232,121,168,0.2)",fontFamily:"'Nunito',sans-serif",fontSize:12,color:"#c06898",fontStyle:"italic",animation:"fadeSlide 0.3s ease"}}>
        {done?"✨ "+task.cheers[2]:"💕 "+cheer}
      </div>}
    </div>
  );
}

// ─── TASK CARD B ──────────────────────────────────────────────────────────────
function TaskCardB({task,done,onToggle,onTimer,idx}) {
  const [hover,setHover]=useState(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{borderRadius:8,marginBottom:9,transition:"all 0.25s ease",position:"relative",
        background:done?"rgba(184,159,255,0.1)":hover?"rgba(184,159,255,0.07)":"rgba(18,12,38,0.7)",
        border:`1px solid ${done?"rgba(184,159,255,0.5)":hover?"rgba(184,159,255,0.3)":"rgba(184,159,255,0.12)"}`,
        backdropFilter:"blur(14px)",padding:"14px 16px",
        boxShadow:done?"0 0 24px rgba(184,159,255,0.15)":hover?"0 0 20px rgba(184,159,255,0.1)":"none"}}>
      {hover&&<HUDFrame color={done?"rgba(184,159,255,0.7)":"rgba(184,159,255,0.4)"} size={9} thick={1}/>}
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div onClick={onToggle} style={{flexShrink:0,width:22,height:22,borderRadius:4,
            background:done?"rgba(184,159,255,0.3)":"transparent",
            border:`1.5px solid ${done?"#b89fff":hover?"rgba(184,159,255,0.5)":"rgba(184,159,255,0.25)"}`,
            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
            boxShadow:done?"0 0 14px rgba(184,159,255,0.5)":"none",transition:"all 0.3s"}}>
          {done&&<span style={{color:"#d4b8ff",fontSize:11,fontWeight:700}}>✓</span>}
        </div>
        <div style={{color:done?"rgba(184,159,255,0.5)":"rgba(184,159,255,0.7)",fontFamily:"'DM Mono','Share Tech Mono',monospace",fontSize:10,minWidth:28}}>
          {String(idx+1).padStart(2,"0")}
        </div>
        <div style={{flex:1,cursor:"pointer"}} onClick={onToggle}>
          <div style={{fontFamily:"'DM Sans','Nunito',sans-serif",fontWeight:700,fontSize:14,color:done?"rgba(212,184,255,0.5)":hover?"#e8d5ff":"#c8b0f0",textDecoration:done?"line-through":"none",transition:"all 0.2s"}}>{task.label}</div>
          <div style={{fontFamily:"'DM Mono','Share Tech Mono',monospace",fontSize:11,color:"#6a4a9a",marginTop:2}}>{task.sub} · {task.mins}min</div>
        </div>
        <button onClick={onTimer}
          style={{background:"transparent",border:"1px solid rgba(184,159,255,0.2)",borderRadius:6,color:"#7a5aaa",fontFamily:"'DM Mono','Share Tech Mono',monospace",fontSize:11,padding:"5px 9px",cursor:"pointer",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(184,159,255,0.5)";e.currentTarget.style.color="#b89fff";e.currentTarget.style.boxShadow="0 0 12px rgba(184,159,255,0.2)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(184,159,255,0.2)";e.currentTarget.style.color="#7a5aaa";e.currentTarget.style.boxShadow="none";}}>▸ timer</button>
      </div>
      {(hover||done)&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(184,159,255,0.1)",fontFamily:"'DM Mono','Share Tech Mono',monospace",fontSize:10,color:done?"rgba(184,159,255,0.6)":"#5a3a8a",letterSpacing:0.5,animation:"fadeSlide 0.3s ease"}}>
        {done?"✦ "+task.cheers[1]:"→ "+task.cheers[0]}
      </div>}
    </div>
  );
}

// ─── XP BAR ──────────────────────────────────────────────────────────────────
function XPBar({label,value,max,isA}) {
  const pct=Math.min(100,Math.round((value/max)*100));
  const acc=isA?"#e879a8":"#b89fff";
  const fill=isA?"linear-gradient(90deg,#f9a8d4,#e879a8,#c084fc)":"linear-gradient(90deg,#7c3aed,#b89fff,#d4b8ff)";
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontFamily:isA?"'Nunito',sans-serif":"'DM Sans',sans-serif",fontSize:13,color:isA?"#b06090":"#8060b0"}}>{label}</span>
        <span style={{fontFamily:isA?"'Nunito',sans-serif":"'DM Mono','Share Tech Mono',monospace",fontSize:isA?13:11,color:acc,fontWeight:700}}>{isA?`${value} XP ✦`:`${value} / ${max}`}</span>
      </div>
      <div style={{height:isA?10:7,background:isA?"rgba(232,121,168,0.12)":"rgba(184,159,255,0.1)",borderRadius:isA?99:3,overflow:"hidden",position:"relative"}}>
        <div style={{height:"100%",width:`${pct}%`,background:fill,borderRadius:isA?99:3,transition:"width 0.8s cubic-bezier(.34,1.2,.64,1)",
            boxShadow:!isA?`0 0 10px rgba(184,159,255,0.4)`:"none",position:"relative",overflow:"hidden"}}>
          {isA&&<div style={{position:"absolute",top:0,bottom:0,width:"40%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)",animation:"shimmer 2s ease-in-out infinite"}}/>}
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR STRIP ───────────────────────────────────────────────────────────
function CalendarStrip({completedDays,isA}) {
  const days=[];
  for(let i=20;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10);days.push({key:k,label:d.toLocaleDateString("ru",{weekday:"short"}).slice(0,2).toUpperCase(),num:d.getDate()});}
  return (
    <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
      {days.map(({key,label,num})=>{
        const s=completedDays[key]; const isToday=key===today();
        return (
          <div key={key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:30}}>
            <span style={{fontFamily:isA?"'Nunito',sans-serif":"'DM Mono','Share Tech Mono',monospace",fontSize:9,color:isA?"#c08aaa":"#6a4a8a"}}>{label}</span>
            <div style={{width:26,height:26,borderRadius:isA?(s==="A"?"50%":s==="B"?4:"50%"):(s?4:4),
                background:s==="A"?"linear-gradient(135deg,#f9a8d4,#e879a8)":s==="B"?"linear-gradient(135deg,#7c3aed,#b89fff)":"transparent",
                border:`1.5px solid ${isToday?(isA?"#e879a8":"#b89fff"):s?"transparent":(isA?"rgba(232,121,168,0.25)":"rgba(184,159,255,0.2)")}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:s==="B"?"0 0 10px rgba(184,159,255,0.4)":s==="A"?"0 0 8px rgba(232,121,168,0.3)":"none",
                transition:"all 0.3s"}}>
              <span style={{color:s?"#fff":(isA?"#c08aaa":"#6a4a8a"),fontFamily:isA?"'Nunito',sans-serif":"'DM Mono','Share Tech Mono',monospace",fontSize:9,fontWeight:700}}>{num}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MASCOT ──────────────────────────────────────────────────────────────────
function Mascot({isA,onQuote}) {
  const [pop,setPop]=useState(false);
  const [q,setQ]=useState("");
  const handle=()=>{
    const quotes=isA?QUOTES_A:QUOTES_B;
    const picked=quotes[Math.floor(Math.random()*quotes.length)];
    setQ(picked);setPop(true);onQuote(picked);
    setTimeout(()=>setPop(false),3500);
  };
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:500,textAlign:"right"}}>
      {pop&&<div style={{position:"absolute",bottom:72,right:0,maxWidth:230,padding:"10px 14px",
          background:isA?"rgba(255,240,252,0.97)":"rgba(20,12,45,0.97)",
          border:`1px solid ${isA?"rgba(232,121,168,0.45)":"rgba(184,159,255,0.35)"}`,
          borderRadius:isA?"16px 16px 4px 16px":10,
          color:isA?"#7a3060":"#c8a8ff",fontFamily:isA?"'Nunito',sans-serif":"'DM Sans',sans-serif",
          fontSize:isA?13:12,lineHeight:1.6,backdropFilter:"blur(16px)",
          boxShadow:isA?"0 8px 32px rgba(232,121,168,0.2)":"0 8px 32px rgba(100,60,180,0.3)",
          animation:"popIn 0.35s cubic-bezier(.34,1.56,.64,1)"}}>
        {q}
      </div>}
      <div onClick={handle} style={{fontSize:46,cursor:"pointer",display:"inline-block",
          filter:isA?"drop-shadow(0 4px 16px rgba(232,121,168,0.5))":"drop-shadow(0 0 20px rgba(150,100,255,0.6))",
          animation:"mascotBob 3s ease-in-out infinite",transition:"transform 0.2s",userSelect:"none"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.18) rotate(-6deg)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1) rotate(0deg)"}>
        {isA?"🦊":"🤖"}
      </div>
    </div>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({msg,isA,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,4200);return ()=>clearTimeout(t);},[onClose]);
  return (
    <div style={{position:"fixed",bottom:90,right:24,maxWidth:300,zIndex:600,
        background:isA?"rgba(255,240,252,0.97)":"rgba(20,12,45,0.97)",
        border:`1px solid ${isA?"rgba(232,121,168,0.5)":"rgba(184,159,255,0.4)"}`,
        borderRadius:isA?16:10,padding:"12px 16px",backdropFilter:"blur(20px)",
        color:isA?"#7a3060":"#c8a8ff",fontFamily:isA?"'Nunito',sans-serif":"'DM Sans',sans-serif",
        fontSize:isA?14:13,lineHeight:1.5,
        boxShadow:isA?"0 8px 40px rgba(232,121,168,0.25)":"0 8px 40px rgba(100,60,180,0.3)",
        animation:"toastIn 0.4s cubic-bezier(.34,1.56,.64,1)"}}>
      {msg}
    </div>
  );
}

// ─── DIRECTION PAGE ───────────────────────────────────────────────────────────
// Страница конкретного "направления" (Маркетинг, Программирование и т.д.)
// с местом под изображение персонажа, редактируемым текстом и задачами
const DIRECTIONS = {
  // День А
  a1: { title:"Маркетинг", subtitle:"Grind University", color:"#e879a8", colorDim:"rgba(232,121,168,0.15)",
    defaultText:"Напиши здесь всё что нужно знать и сделать для этого направления.\n\nНапример:\n— Пройти модуль 3 в Grind University\n— Придумать идею для личного проекта\n— Сделать заметки по уроку\n\nЭтот текст сохранится локально — редактируй как хочешь 🌸",
    // ↓ СЮДА ВСТАВЬ ПУТЬ К ИЗОБРАЖЕНИЮ ПЕРСОНАЖА
    // например: imageSrc: "/characters/marketing-girl.png"
    imageSrc: null,
    imageHint: "Персонаж: девочка с кистью и маркетинговыми иконками",
  },
  a2: { title:"Навыки продаж", subtitle:"Книги / курсы", color:"#f472b6", colorDim:"rgba(244,114,182,0.15)",
    defaultText:"Что читаю сейчас:\n\nЧто хочу освоить:\n\nМои инсайты:\n\nДобавь свои заметки — они здесь в безопасности 💕",
    imageSrc: null, imageHint:"Персонаж: уверенная девушка с книгой",
  },
  a3: { title:"Дизайн в Figma", subtitle:"SuperFigma", color:"#c084fc", colorDim:"rgba(192,132,252,0.15)",
    defaultText:"Текущий проект:\n\nЧто изучаю:\n\nИдеи для практики:\n\nТвой вкус — твоя суперсила 🎨",
    imageSrc: null, imageHint:"Персонаж: художница с планшетом",
  },
  a4: { title:"Китайский", subtitle:"Дорамы / сайт", color:"#fb7185", colorDim:"rgba(251,113,133,0.15)",
    defaultText:"Слова дня:\n\nФразы из дорамы:\n\nПрогресс:\n\n加油！你可以的！ 🌸",
    imageSrc: null, imageHint:"Персонаж: девочка в китайском стиле",
  },
  a5: { title:"Личный проект", subtitle:"Сайт через ИИ", color:"#a78bfa", colorDim:"rgba(167,139,250,0.15)",
    defaultText:"Проект:\n\nЧто сегодня делаю:\n\nПромпты которые сработали:\n\nТы строишь свою вселенную 🌙",
    imageSrc: null, imageHint:"Персонаж: девочка-разработчик с ноутбуком",
  },
  // День Б
  b1: { title:"Программирование", subtitle:"Core Objective", color:"#b89fff", colorDim:"rgba(184,159,255,0.12)",
    defaultText:"Что изучаю:\n\nСниппеты которые сработали:\n\n// TODO: напиши свои цели здесь\n// каждый день код — каждый день рост",
    imageSrc: null, imageHint:"Персонаж: техно-девушка с голографическим экраном",
  },
  b2: { title:"3D в Blender", subtitle:"Mesh Operations", color:"#8b5cf6", colorDim:"rgba(139,92,246,0.12)",
    defaultText:"Текущая модель:\n\nЧто изучаю:\n\nHotkeys которые запомнил:\n\n// TOPOLOGY IS EVERYTHING",
    imageSrc: null, imageHint:"Персонаж: дизайнер с 3D-объектом",
  },
  b3: { title:"Японский", subtitle:"Anki + Game Protocol", color:"#a78bfa", colorDim:"rgba(167,139,250,0.12)",
    defaultText:"Слова дня:\n\nГрамматика:\n\nИз игры/аниме:\n\n// 継続は力なり — постоянство — сила",
    imageSrc: null, imageHint:"Персонаж: аниме-персонаж с книгой",
  },
  b4: { title:"Английский", subtitle:"Passive Input Protocol", color:"#7c3aed", colorDim:"rgba(124,58,237,0.12)",
    defaultText:"Фразы из Rick & Morty:\n\nНовые слова:\n\nЧто слушаю:\n\n// PASSIVE INPUT IS STILL INPUT",
    imageSrc: null, imageHint:"Персонаж: крутой персонаж с наушниками",
  },
  b5: { title:"3D / Дизайн проект", subtitle:"Personal Build", color:"#9333ea", colorDim:"rgba(147,51,234,0.12)",
    defaultText:"Проект:\n\nСегодняшняя задача:\n\nРеференсы:\n\n// SHIP IT. REFINE LATER.",
    imageSrc: null, imageHint:"Персонаж: художник-технарь с планшетом",
  },
};

function DirectionPage({dirId, isA, onBack}) {
  const s = useStore();
  const dir = DIRECTIONS[dirId];
  const savedNote = s.directionNotes?.[dirId];
  const [text, setText] = useState(savedNote !== undefined ? savedNote : dir.defaultText);
  const saveText = (val) => {
    setText(val);
    store.set(prev => ({ directionNotes: { ...prev.directionNotes, [dirId]: val } }));
  };

  const bg = isA
    ? "linear-gradient(160deg,#fff5fb 0%,#fde8f7 25%,#ede0ff 55%,#ffeaf8 80%,#fff0fb 100%)"
    : "linear-gradient(160deg,#0e0820 0%,#160c38 30%,#1a0e44 55%,#120a2e 80%,#0e0820 100%)";
  const cardBg = isA ? "rgba(255,255,255,0.62)" : "rgba(22,14,50,0.75)";
  const border = isA ? "rgba(232,121,168,0.25)" : "rgba(184,159,255,0.15)";
  const txt = isA ? "#4a1942" : "#e8d5ff";
  const muted = isA ? "#b06090" : "#8060b0";
  const font = isA ? "'Nunito',sans-serif" : "'DM Sans',sans-serif";
  const monoFont = isA ? "'Nunito',sans-serif" : "'DM Mono','Share Tech Mono',monospace";

  return (
    <div style={{minHeight:"100vh",width:"100vw",background:bg,position:"relative",overflow:"hidden"}}>
      {isA ? <PetalCanvas/> : <ElegantCanvas/>}
      {!isA&&<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.02) 3px,rgba(0,0,0,0.02) 4px)"}}/>}

      <div style={{position:"relative",zIndex:2,maxWidth:780,margin:"0 auto",padding:"0 24px 80px"}}>

        {/* Back button */}
        <div style={{paddingTop:28,marginBottom:20}}>
          <button onClick={onBack}
            style={{background:"transparent",border:`1px solid ${border}`,borderRadius:isA?99:8,
              color:muted,fontFamily:font,fontSize:13,padding:"8px 18px",cursor:"pointer",
              display:"flex",alignItems:"center",gap:6,transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=dir.color;e.currentTarget.style.color=dir.color;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=border;e.currentTarget.style.color=muted;}}>
            {isA?"← Назад к дню Юмэ":"← Вернуться к КЕН"}
          </button>
        </div>

        {/* Hero блок с изображением */}
        <div style={{borderRadius:isA?28:12,overflow:"hidden",marginBottom:20,position:"relative",
            background:cardBg,border:`1px solid ${border}`,backdropFilter:"blur(20px)",
            minHeight:220,display:"flex",alignItems:"stretch",
            boxShadow:isA?"0 12px 60px rgba(232,121,168,0.15)":"0 12px 60px rgba(100,60,180,0.2)"}}>
          {!isA&&<div style={{position:"absolute",inset:0,borderRadius:12}}><HUDFrame color={`${dir.color}55`} size={18} thick={1.5}/></div>}

          {/* Левая часть — текст */}
          <div style={{flex:1,padding:"32px 36px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontFamily:monoFont,fontSize:11,color:dir.color,letterSpacing:isA?0:2,marginBottom:6,opacity:0.8}}>
              {isA?"✦ направление":"// DIRECTION"}
            </div>
            <h1 style={{fontFamily:isA?"'Pacifico',cursive":"'Orbitron',monospace",
                fontSize:isA?38:28,fontWeight:isA?400:900,
                color:isA?"transparent":dir.color,letterSpacing:isA?0:2,lineHeight:1.2,marginBottom:8,
                ...(isA?{background:`linear-gradient(135deg,${dir.color},#c084fc)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}:
                         {textShadow:`0 0 30px ${dir.color}55`})}}>
              {dir.title}
            </h1>
            <div style={{fontFamily:font,fontSize:13,color:muted,marginBottom:16}}>{dir.subtitle}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <div style={{padding:"4px 14px",borderRadius:isA?99:4,background:`${dir.color}18`,border:`1px solid ${dir.color}33`,fontFamily:monoFont,fontSize:11,color:dir.color}}>
                {isA?"активное направление":"ACTIVE MODULE"}
              </div>
            </div>
          </div>

          {/* Правая часть — ИЗОБРАЖЕНИЕ */}
          <div style={{width:220,flexShrink:0,position:"relative",overflow:"hidden"}}>
            {dir.imageSrc ? (
              // ════════════════════════════════════════════════════════
              // ▼▼▼ МЕСТО ДЛЯ ИЗОБРАЖЕНИЯ ПЕРСОНАЖА ▼▼▼
              // Замени imageSrc в объекте DIRECTIONS[dirId] выше
              // Изображение должно быть PNG с прозрачностью или
              // такого же цвета как фон чтобы красиво сливаться
              // ════════════════════════════════════════════════════════
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                <img src={dir.imageSrc} alt={dir.imageHint}
                  style={{maxHeight:"100%",maxWidth:"100%",objectFit:"contain",
                    filter:isA?`drop-shadow(0 0 20px ${dir.color}44)`:`drop-shadow(0 0 30px ${dir.color}66)`,
                    // Маска для плавного слияния с фоном снизу/сбоку:
                    WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
                    maskImage:"linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)"}}/>
              </div>
            ) : (
              // Placeholder пока нет изображения
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  background:`linear-gradient(135deg,${dir.colorDim},transparent)`,gap:8}}>
                <div style={{fontSize:48,opacity:0.4}}>{isA?"🦊":"🤖"}</div>
                <div style={{fontFamily:monoFont,fontSize:10,color:dir.color,opacity:0.5,textAlign:"center",padding:"0 16px",lineHeight:1.5}}>
                  {dir.imageHint}
                </div>
                <div style={{fontFamily:monoFont,fontSize:9,color:muted,opacity:0.4,textAlign:"center",padding:"0 12px"}}>
                  {isA?"вставь imageSrc в DIRECTIONS":"// SET imageSrc IN DIRECTIONS"}
                </div>
              </div>
            )}
            {/* Градиентный оверлей для слияния с картой слева */}
            <div style={{position:"absolute",inset:0,background:`linear-gradient(to right, ${cardBg} 0%, transparent 40%)`,pointerEvents:"none"}}/>
          </div>
        </div>

        {/* Редактируемый текст */}
        <div style={{borderRadius:isA?22:10,background:cardBg,border:`1px solid ${border}`,
            backdropFilter:"blur(20px)",padding:"22px 24px",marginBottom:16,position:"relative",
            boxShadow:isA?"0 8px 40px rgba(232,121,168,0.1)":"0 8px 40px rgba(100,60,180,0.12)"}}>
          {!isA&&<HUDFrame color={`${dir.color}33`} size={10} thick={1}/>}
          <div style={{fontFamily:isA?"'Nunito',sans-serif":monoFont,fontWeight:800,fontSize:isA?14:12,
              color:isA?"#b06090":muted,marginBottom:12,letterSpacing:isA?0:1}}>
            {isA?"✦ Мои заметки и план":"// notes & plan"}
          </div>
          <textarea value={text} onChange={e=>saveText(e.target.value)}
            style={{width:"100%",minHeight:180,background:isA?"rgba(255,255,255,0.5)":"rgba(0,0,0,0.2)",
              border:`1px solid ${border}`,borderRadius:isA?14:6,
              color:isA?"#4a1942":"#c8a8f0",
              fontFamily:isA?"'Nunito',sans-serif":monoFont,
              fontSize:isA?13:12,padding:"14px 16px",resize:"vertical",outline:"none",lineHeight:1.8,
              transition:"border-color 0.2s"}}
            onFocus={e=>e.currentTarget.style.borderColor=dir.color}
            onBlur={e=>e.currentTarget.style.borderColor=border}
            placeholder={isA?"Пиши что хочешь — заметки, планы, мысли... 🌸":"// write your notes here\n// plans, snippets, ideas"}/>
          <div style={{marginTop:8,fontFamily:monoFont,fontSize:11,color:muted,opacity:0.6}}>
            {isA?"✦ сохраняется автоматически":"// auto-saved to localStorage"}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── INTRO SCREEN ────────────────────────────────────────────────────────────
function IntroScreen({onChoose}) {
  const [hov,setHov]=useState(null);
  return (
    <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 30% 40%,#1e0a3c,#050510 65%)",zIndex:900,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      {[...Array(35)].map((_,i)=>(
        <div key={i} style={{position:"absolute",width:i%5===0?3:2,height:i%5===0?3:2,borderRadius:"50%",
            background:i%3===0?"#f9a8d4":i%3===1?"#b89fff":"#ffffff",
            left:`${5+Math.random()*90}%`,top:`${5+Math.random()*90}%`,
            opacity:0.15+Math.random()*0.55,
            animation:`twinkle ${1.5+Math.random()*3}s ease-in-out infinite`,
            animationDelay:`${Math.random()*4}s`}}/>
      ))}
      <div style={{textAlign:"center",animation:"fadeIn 0.9s ease",position:"relative",zIndex:1,padding:"0 20px"}}>
        <div style={{fontFamily:"'Pacifico',cursive",fontSize:16,color:"rgba(249,168,212,0.55)",letterSpacing:10,marginBottom:6}}>日々</div>
        <h1 style={{fontFamily:"'Pacifico',cursive",fontSize:clamp(40,6,"vw",72),margin:"0 0 8px",
            background:"linear-gradient(135deg,#f9a8d4 0%,#e879a8 35%,#c084fc 65%,#818cf8 100%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            filter:"drop-shadow(0 0 40px rgba(232,121,168,0.3))"}}>
          NikoNichi
        </h1>
        <p style={{color:"rgba(190,160,230,0.65)",fontFamily:"'Nunito',sans-serif",fontSize:15,marginBottom:52,letterSpacing:0.5}}>
          Сегодня я хочу быть...
        </p>
        <div style={{display:"flex",gap:24,justifyContent:"center",flexWrap:"wrap"}}>
          {/* Карточка А */}
          <div onClick={()=>onChoose("A")} onMouseEnter={()=>setHov("A")} onMouseLeave={()=>setHov(null)}
            style={{width:210,padding:"2.2rem 1.8rem",borderRadius:28,cursor:"pointer",
              background:hov==="A"?"linear-gradient(135deg,rgba(255,240,250,0.14),rgba(245,220,255,0.1))":"linear-gradient(135deg,rgba(255,240,250,0.07),rgba(245,220,255,0.05))",
              border:`1px solid ${hov==="A"?"rgba(232,121,168,0.65)":"rgba(232,121,168,0.22)"}`,
              boxShadow:hov==="A"?"0 0 60px rgba(232,121,168,0.28),0 20px 60px rgba(0,0,0,0.35)":"0 10px 40px rgba(0,0,0,0.2)",
              transform:hov==="A"?"translateY(-10px) scale(1.03)":"translateY(0) scale(1)",
              transition:"all 0.4s cubic-bezier(.34,1.2,.64,1)"}}>
            <div style={{fontSize:66,marginBottom:14,display:"block",filter:"drop-shadow(0 8px 20px rgba(232,121,168,0.45))"}}>🦊</div>
            <div style={{fontFamily:"'Pacifico',cursive",fontSize:26,color:"#f9a8d4",marginBottom:10}}>Юмэ</div>
            <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:"rgba(249,168,212,0.62)",lineHeight:1.8}}>
              ✦ Креативный день<br/>✦ Мечты и творчество<br/>✦ Расти с любовью
            </div>
            <div style={{marginTop:14,height:18,fontFamily:"'Nunito',sans-serif",fontSize:12,color:"#e879a8",fontStyle:"italic",opacity:hov==="A"?1:0,transition:"opacity 0.3s"}}>
              Нажми, чтобы начать ✨
            </div>
          </div>
          {/* Карточка Б */}
          <div onClick={()=>onChoose("B")} onMouseEnter={()=>setHov("B")} onMouseLeave={()=>setHov(null)}
            style={{width:210,padding:"2.2rem 1.8rem",borderRadius:12,cursor:"pointer",
              background:hov==="B"?"linear-gradient(135deg,rgba(184,159,255,0.12),rgba(124,58,237,0.1))":"linear-gradient(135deg,rgba(184,159,255,0.05),rgba(124,58,237,0.04))",
              border:`1px solid ${hov==="B"?"rgba(184,159,255,0.65)":"rgba(184,159,255,0.18)"}`,
              boxShadow:hov==="B"?"0 0 60px rgba(184,159,255,0.22),0 20px 60px rgba(0,0,0,0.35)":"0 10px 40px rgba(0,0,0,0.2)",
              transform:hov==="B"?"translateY(-10px) scale(1.03)":"translateY(0) scale(1)",
              transition:"all 0.4s cubic-bezier(.34,1.2,.64,1)",position:"relative"}}>
            <HUDFrame color={hov==="B"?"rgba(184,159,255,0.7)":"rgba(184,159,255,0.3)"} size={16} thick={1.5}/>
            <div style={{fontSize:66,marginBottom:14,filter:"drop-shadow(0 0 24px rgba(184,159,255,0.55))"}}>🤖</div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:20,color:"#b89fff",marginBottom:10,letterSpacing:2,textShadow:"0 0 20px rgba(184,159,255,0.4)"}}>КЕН</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(184,159,255,0.58)",lineHeight:1.8}}>
              ▸ CODE + 3D<br/>▸ GRIND PROTOCOL<br/>▸ EXECUTE GREATNESS
            </div>
            <div style={{marginTop:14,height:18,fontFamily:"'DM Mono','Share Tech Mono',monospace",fontSize:11,color:"#b89fff",letterSpacing:1,opacity:hov==="B"?1:0,transition:"opacity 0.3s"}}>
              {">"} INITIALIZE...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp(min,val,unit,max){return `clamp(${min}px,${val}${unit},${max}px)`;}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function NikoNichi() {
  const s = useStore();
  const isA = s.activeDay === "A";
  const tasks = isA ? DAY_A_TASKS : DAY_B_TASKS;
  const [timerTask,setTimerTask] = useState(null);
  const [toast,setToast] = useState(null);

  const getKey = (id) => `${today()}_${id}`;
  const isDone = (id) => !!s.completedTasks[getKey(id)];
  const doneTasks = tasks.filter(t=>isDone(t.id)).length;

  const toggle = useCallback((task) => {
    const key = getKey(task.id);
    const wasDone = isDone(task.id);
    const xpGain = Math.round(task.mins*1.8);
    store.set(prev=>({
      completedTasks:{...prev.completedTasks,[key]:!wasDone},
      xp:wasDone?{...prev.xp,[task.xpCat]:Math.max(0,prev.xp[task.xpCat]-xpGain)}
                :{...prev.xp,[task.xpCat]:prev.xp[task.xpCat]+xpGain},
    }));
    if(!wasDone){
      setToast(isA?`🌸 +${xpGain} XP! ${task.cheers[0]}`:`✦ +${xpGain} XP — ${task.cheers[0]}`);
      setTimeout(()=>{
        const upd=store.get().completedTasks;
        if(tasks.every(t=>!!upd[`${today()}_${t.id}`])){
          store.set(prev=>({completedDays:{...prev.completedDays,[today()]:s.activeDay}}));
          setTimeout(()=>setToast(isA?"✨✨ День завершён! Ты просто чудо! ✨✨":"✦ ALL MISSIONS COMPLETE. LEGENDARY."),500);
        }
      },100);
    }
  },[isA,tasks,s.activeDay]);

  const bgA = "linear-gradient(160deg,#fff5fb 0%,#fde8f7 25%,#ede0ff 55%,#ffeaf8 80%,#fff0fb 100%)";
  const bgB = "linear-gradient(160deg,#0e0820 0%,#160c38 30%,#1a0e44 55%,#120a2e 80%,#0e0820 100%)";
  const cardBg = isA?"rgba(255,255,255,0.6)":"rgba(22,14,50,0.72)";
  const border = isA?"rgba(232,121,168,0.25)":"rgba(184,159,255,0.14)";
  const txt = isA?"#4a1942":"#e8d5ff";
  const muted = isA?"#b06090":"#8060b0";
  const font = isA?"'Nunito',sans-serif":"'DM Sans',sans-serif";
  const monoFont = isA?"'Nunito',sans-serif":"'DM Mono','Share Tech Mono',monospace";

  // Если открыта страница направления
  if(s.activePage) {
    return (
      <>
        <GlobalStyles isA={isA}/>
        <DirectionPage dirId={s.activePage} isA={isA} onBack={()=>store.set(()=>({activePage:null}))}/>
      </>
    );
  }

  if(!s.activeDay) return (
    <>
      <GlobalStyles isA={false}/>
      <IntroScreen onChoose={(d)=>store.set(()=>({activeDay:d}))}/>
    </>
  );

  return (
    <>
      <GlobalStyles isA={isA}/>
      <div style={{width:"100vw",minHeight:"100vh",background:isA?bgA:bgB,transition:"background 1s ease",position:"relative",overflow:"hidden"}}>
        {isA?<PetalCanvas/>:<ElegantCanvas/>}
        {!isA&&<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,
            background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.025) 3px,rgba(0,0,0,0.025) 4px)"}}/>}

        {/* ─ Декоративные glow-сферы для дня Б */}
        {!isA&&<>
          <div style={{position:"fixed",top:"-20%",right:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)",pointerEvents:"none",zIndex:1}}/>
          <div style={{position:"fixed",bottom:"-15%",left:"-8%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(184,159,255,0.1) 0%,transparent 70%)",pointerEvents:"none",zIndex:1}}/>
        </>}

        <div style={{width:"100%",maxWidth:760,margin:"0 auto",padding:"0 24px 100px",position:"relative",zIndex:3}}>

          {/* ── HEADER ── */}
          <div style={{paddingTop:36,paddingBottom:26,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
            <div>
              {isA?(
                <>
                  <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:"#c08aaa",marginBottom:5,letterSpacing:0.5}}>
                    {new Date().toLocaleDateString("ru",{weekday:"long",day:"numeric",month:"long"})} ✦
                  </div>
                  <h1 style={{fontFamily:"'Pacifico',cursive",fontSize:clamp(28,5,"vw",46),
                      background:"linear-gradient(135deg,#e879a8,#c084fc,#f9a8d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                      filter:"drop-shadow(0 4px 24px rgba(232,121,168,0.3))",lineHeight:1.1,margin:0}}>
                    День Юмэ ✿
                  </h1>
                  <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:"#c08aaa",marginTop:5,fontStyle:"italic"}}>
                    Твой день для роста и мечтаний 💕
                  </div>
                </>
              ):(
                <>
                  <div style={{fontFamily:monoFont,fontSize:10,color:"#5a3a8a",letterSpacing:1.5,marginBottom:7}}>
                    {`${today()} // OPERATOR: КЕН`}
                  </div>
                  <h1 style={{fontFamily:"'Orbitron',monospace",fontWeight:900,fontSize:clamp(22,4,"vw",38),
                      color:"#c8a8ff",letterSpacing:2,
                      textShadow:"0 0 30px rgba(184,159,255,0.35),0 0 60px rgba(124,58,237,0.2)",margin:0}}>
                    ДЕНЬ КЕН
                  </h1>
                  <div style={{fontFamily:monoFont,fontSize:11,color:"#6a4a9a",marginTop:6,letterSpacing:0.5}}>
                    Фокус. Код. Рост. Каждый день.
                  </div>
                </>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
              <div style={{display:"flex",gap:8}}>
                {["A","B"].map(d=>(
                  <button key={d} onClick={()=>store.set(()=>({activeDay:d}))}
                    style={{padding:"8px 18px",borderRadius:d==="A"?99:8,cursor:"pointer",
                      border:`1.5px solid ${s.activeDay===d?(d==="A"?"#e879a8":"#b89fff"):"rgba(150,130,180,0.2)"}`,
                      background:s.activeDay===d?(d==="A"?"rgba(232,121,168,0.18)":"rgba(184,159,255,0.15)"):"transparent",
                      color:s.activeDay===d?(d==="A"?"#e879a8":"#b89fff"):"rgba(150,130,180,0.45)",
                      fontFamily:d==="A"?"'Nunito',sans-serif":"'Orbitron',monospace",
                      fontSize:d==="A"?13:11,fontWeight:800,letterSpacing:d==="B"?1:0,
                      boxShadow:s.activeDay===d?(d==="B"?"0 0 18px rgba(184,159,255,0.25)":"0 4px 18px rgba(232,121,168,0.2)"):"none",
                      transition:"all 0.25s cubic-bezier(.34,1.2,.64,1)"}}>
                    {d==="A"?"🌸 А":"⚡ Б"}
                  </button>
                ))}
              </div>
              <div style={{fontFamily:monoFont,fontSize:isA?13:11,color:muted,letterSpacing:isA?0:0.5}}>
                {isA?`✦ ${Object.values(s.xp).reduce((a,b)=>a+b,0)} XP накоплено`:`XP: ${Object.values(s.xp).reduce((a,b)=>a+b,0)}`}
              </div>
            </div>
          </div>

          {/* ── ПРОГРЕСС ── */}
          <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:isA?22:10,
              padding:"18px 22px",marginBottom:14,backdropFilter:"blur(20px)",position:"relative",
              boxShadow:isA?"0 8px 40px rgba(232,121,168,0.12)":"0 8px 40px rgba(100,60,180,0.15)"}}>
            {!isA&&<HUDFrame color="rgba(184,159,255,0.3)" size={11} thick={1}/>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontFamily:isA?"'Nunito',sans-serif":"'Orbitron',monospace",fontWeight:800,fontSize:isA?15:12,color:isA?"#4a1942":"#c8a8ff",letterSpacing:isA?0:1}}>
                {isA?"✨ Сегодня тебя ждут":"MISSION QUEUE"}
              </span>
              <span style={{fontFamily:isA?"'Nunito',sans-serif":monoFont,fontSize:isA?15:12,color:isA?"#e879a8":"#b89fff",fontWeight:700}}>
                {isA?`${doneTasks}/${tasks.length} ✦`:`[${doneTasks}/${tasks.length}]`}
              </span>
            </div>
            <div style={{height:isA?12:8,background:isA?"rgba(232,121,168,0.1)":"rgba(184,159,255,0.08)",borderRadius:isA?99:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(doneTasks/tasks.length)*100}%`,
                  background:isA?"linear-gradient(90deg,#f9a8d4,#e879a8,#c084fc)":"linear-gradient(90deg,#7c3aed,#b89fff,#d4b8ff)",
                  borderRadius:isA?99:3,transition:"width 0.8s cubic-bezier(.34,1.2,.64,1)",
                  boxShadow:!isA?"0 0 14px rgba(184,159,255,0.45)":"none",position:"relative",overflow:"hidden"}}>
                {isA&&<div style={{position:"absolute",top:0,bottom:0,width:"40%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)",animation:"shimmer 2s ease-in-out infinite"}}/>}
              </div>
            </div>
            {isA&&doneTasks===tasks.length&&<div style={{marginTop:8,textAlign:"center",fontFamily:"'Pacifico',cursive",fontSize:14,color:"#e879a8"}}>✨ Ты справилась! Это просто магия!</div>}
          </div>

          {/* ── ЗАДАЧИ ── */}
          <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:isA?22:10,
              padding:"18px 18px 12px",marginBottom:14,backdropFilter:"blur(20px)",
              boxShadow:isA?"0 8px 40px rgba(232,121,168,0.1)":"0 8px 40px rgba(100,60,180,0.12)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                fontFamily:isA?"'Nunito',sans-serif":"'Orbitron',monospace",fontWeight:800,fontSize:isA?14:11,
                color:isA?"#b06090":"#7a5aaa",marginBottom:14,paddingBottom:10,letterSpacing:isA?0:1.5,
                borderBottom:`1px solid ${border}`}}>
              <span>{isA?"✦ Твои задачи на день":"ACTIVE MISSIONS"}</span>
              <span style={{fontFamily:monoFont,fontSize:11,color:muted,fontWeight:400,letterSpacing:0}}>
                {isA?"нажми → открыть заметки":"click → open notes"}
              </span>
            </div>
            {tasks.map((task,i)=>(
              <div key={task.id} style={{position:"relative"}}>
                {isA?(
                  <TaskCardA task={task} done={isDone(task.id)} onToggle={()=>toggle(task)} onTimer={()=>setTimerTask(task)}/>
                ):(
                  <TaskCardB task={task} done={isDone(task.id)} idx={i} onToggle={()=>toggle(task)} onTimer={()=>setTimerTask(task)}/>
                )}
                {/* Кнопка открыть страницу направления */}
                <button onClick={()=>store.set(()=>({activePage:task.id}))}
                  style={{position:"absolute",top:"50%",right:isA?96:90,transform:"translateY(-50%)",
                    background:"transparent",border:"none",cursor:"pointer",
                    color:isA?"#c08aaa":"#5a3a8a",fontFamily:monoFont,fontSize:isA?18:14,
                    padding:"4px 6px",transition:"all 0.2s",lineHeight:1}}
                  title="Открыть страницу направления"
                  onMouseEnter={e=>{e.currentTarget.style.color=isA?"#e879a8":"#b89fff";e.currentTarget.style.transform="translateY(-50%) scale(1.2)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=isA?"#c08aaa":"#5a3a8a";e.currentTarget.style.transform="translateY(-50%) scale(1)";}}>
                  {isA?"✦":"▸"}
                </button>
              </div>
            ))}
          </div>

          {/* ── XP ── */}
          <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:isA?22:10,
              padding:"18px 22px",marginBottom:14,backdropFilter:"blur(20px)",position:"relative",
              boxShadow:isA?"0 8px 40px rgba(232,121,168,0.1)":"0 8px 40px rgba(100,60,180,0.12)"}}>
            {!isA&&<HUDFrame color="rgba(184,159,255,0.22)" size={10} thick={1}/>}
            <div style={{fontFamily:isA?"'Nunito',sans-serif":"'Orbitron',monospace",fontWeight:800,fontSize:isA?14:11,color:isA?"#b06090":"#7a5aaa",marginBottom:16,letterSpacing:isA?0:1.5}}>
              {isA?"✦ Прогресс навыков":"SKILL MATRIX"}
            </div>
            <XPBar label={isA?"🎀 Маркетинг":"Marketing"} value={s.xp.marketing} max={500} isA={isA}/>
            <XPBar label={isA?"💻 Программирование":"Coding"} value={s.xp.coding} max={500} isA={isA}/>
            <XPBar label={isA?"🌸 Языки":"Languages"} value={s.xp.languages} max={500} isA={isA}/>
          </div>

          {/* ── CALENDAR ── */}
          <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:isA?22:10,
              padding:"18px 22px",marginBottom:14,backdropFilter:"blur(20px)"}}>
            <div style={{fontFamily:isA?"'Nunito',sans-serif":"'Orbitron',monospace",fontWeight:800,fontSize:isA?14:11,color:isA?"#b06090":"#7a5aaa",marginBottom:14,letterSpacing:isA?0:1.5}}>
              {isA?"🌸 Цепочка успеха":"ACTIVITY LOG"}
            </div>
            <CalendarStrip completedDays={s.completedDays} isA={isA}/>
            <div style={{marginTop:10,fontFamily:monoFont,fontSize:11,color:muted,fontStyle:isA?"italic":"normal",letterSpacing:isA?0:0.3}}>
              {isA?"💕 Каждый закрашенный день — победа над собой!":"Consistency = mastery. Never skip."}
            </div>
          </div>

          {/* ── ЗАМЕТКА ── */}
          <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:isA?22:10,
              padding:"18px 22px",backdropFilter:"blur(20px)"}}>
            <div style={{fontFamily:isA?"'Nunito',sans-serif":"'Orbitron',monospace",fontWeight:800,fontSize:isA?14:11,color:isA?"#b06090":"#7a5aaa",marginBottom:12,letterSpacing:isA?0:1.5}}>
              {isA?"✿ Быстрая идея / мысль":"QUICK NOTE"}
            </div>
            <textarea value={s.note} onChange={e=>store.set(()=>({note:e.target.value}))}
              placeholder={isA?"Запиши идею, пока она живёт... 🌸":"// thoughts, code snippets, ideas"}
              style={{width:"100%",minHeight:90,background:isA?"rgba(255,255,255,0.5)":"rgba(0,0,0,0.2)",
                border:`1px solid ${border}`,borderRadius:isA?14:6,
                color:txt,fontFamily:monoFont,fontSize:isA?13:12,
                padding:"12px 14px",resize:"vertical",outline:"none",lineHeight:1.7,transition:"border-color 0.2s"}}
              onFocus={e=>e.currentTarget.style.borderColor=isA?"rgba(232,121,168,0.5)":"rgba(184,159,255,0.35)"}
              onBlur={e=>e.currentTarget.style.borderColor=border}/>
          </div>

          <div style={{textAlign:"center",marginTop:28}}>
            <button onClick={()=>{if(confirm("Сбросить все данные?")){{localStorage.removeItem(KEY);window.location.reload();}}}}
              style={{background:"none",border:"none",color:isA?"rgba(180,100,140,0.25)":"rgba(184,159,255,0.2)",fontFamily:monoFont,fontSize:11,cursor:"pointer",letterSpacing:isA?0:0.5}}>
              {isA?"✦ сброс":"// reset"}
            </button>
          </div>
        </div>

        <Mascot isA={isA} onQuote={()=>{}}/>
        {timerTask&&<PomodoroModal task={timerTask} isA={isA} onClose={()=>setTimerTask(null)}/>}
        {toast&&<Toast msg={toast} isA={isA} onClose={()=>setToast(null)}/>}
      </div>
    </>
  );
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
function GlobalStyles({isA}) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Pacifico&family=Orbitron:wght@400;700;900&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&family=Share+Tech+Mono&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; min-height: 100%; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${isA?"rgba(232,121,168,0.3)":"rgba(184,159,255,0.2)"}; border-radius: 99px; }
      @keyframes shimmer { from{transform:translateX(-100%)} to{transform:translateX(300%)} }
      @keyframes fadeSlide { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mascotBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
      @keyframes toastIn { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
      @keyframes popIn { from{opacity:0;transform:scale(0.82) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      @keyframes twinkle { 0%,100%{opacity:0.15} 50%{opacity:0.85} }
      textarea { font-family: inherit; }
    `}</style>
  );
}
