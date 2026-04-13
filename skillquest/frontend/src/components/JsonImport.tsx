import React, { useState, useRef } from 'react';
import { directionsApi } from '../api/client';
import { X, Copy, Check, Upload, FileJson, Sparkles } from 'lucide-react';

interface Props {
  onImported: () => void;
  onClose: () => void;
}

const AI_PROMPT = `Ты генератор JSON для платформы SkillQuest. Создай структуру направления обучения.

ВАЖНО: Верни ТОЛЬКО чистый JSON без markdown, без блоков кода, без пояснений. Только сам объект {}.

═══════════════════════════════════════
ПОЛНАЯ СХЕМА С ПРИМЕРОМ
═══════════════════════════════════════

{
  "name": "Веб-разработка",
  "slug": "web-dev",
  "icon_type": "code",
  "description": "Полный путь от верстки до fullstack",
  "color_hex": "#e8003d",
  "branches": [
    {
      "title": "HTML & CSS",
      "description": "Основы верстки",
      "color_hex": "#e8003d",
      "order": 0,
      "is_hardcore": false,
      "checkpoints": [
        {
          "title": "Основы HTML",
          "description": "Структура документа",
          "icon_type": "code",
          "xp_reward": 200,
          "order": 0,
          "pos_x": 430,
          "pos_y": 480,
          "prerequisite_orders": [],
          "achievement_name": "",
          "achievement_description": "",
          "achievement_icon": "🏆",
          "tasks": [
            {
              "title": "Создать HTML страницу",
              "content_md": "Сделай базовую HTML страницу с заголовком, параграфами и списками",
              "xp_reward": 50,
              "difficulty_rating": 1,
              "order": 0,
              "hardcore_xp_multiplier": 2.0,
              "hardcore_description": ""
            },
            {
              "title": "Добавить CSS стили",
              "content_md": "Подключи CSS и настрой цвета, шрифты, отступы",
              "xp_reward": 50,
              "difficulty_rating": 1,
              "order": 1,
              "hardcore_xp_multiplier": 2.0,
              "hardcore_description": ""
            }
          ]
        },
        {
          "title": "Flexbox & Grid",
          "description": "Современные layout системы",
          "icon_type": "cpu",
          "xp_reward": 300,
          "order": 1,
          "pos_x": 430,
          "pos_y": 340,
          "prerequisite_orders": [0],
          "achievement_name": "Верстальщик",
          "achievement_description": "Ты освоил основы HTML и CSS",
          "achievement_icon": "🎨",
          "tasks": [
            {
              "title": "Flexbox карточки",
              "content_md": "Создай сетку карточек используя Flexbox",
              "xp_reward": 100,
              "difficulty_rating": 2,
              "order": 0,
              "hardcore_xp_multiplier": 2.0,
              "hardcore_description": ""
            }
          ]
        }
      ]
    },
    {
      "title": "HARDCORE: Марафон",
      "description": "Хардкорная версия — всё сразу",
      "color_hex": "#ff0000",
      "order": 1,
      "is_hardcore": true,
      "checkpoints": [
        {
          "title": "HTML Sprint",
          "description": "",
          "icon_type": "bolt",
          "xp_reward": 400,
          "order": 0,
          "pos_x": 200,
          "pos_y": 400,
          "prerequisite_orders": [],
          "achievement_name": "",
          "achievement_description": "",
          "achievement_icon": "🏆",
          "tasks": [
            {
              "title": "Полный сайт за день",
              "content_md": "Сверстай 5-страничный сайт за один день",
              "xp_reward": 400,
              "difficulty_rating": 3,
              "order": 0,
              "hardcore_xp_multiplier": 2.0,
              "hardcore_description": "Без перерывов, без туториалов"
            }
          ]
        },
        {
          "title": "CSS Sprint",
          "description": "",
          "icon_type": "palette",
          "xp_reward": 400,
          "order": 1,
          "pos_x": 660,
          "pos_y": 400,
          "prerequisite_orders": [],
          "achievement_name": "",
          "achievement_description": "",
          "achievement_icon": "🏆",
          "tasks": [
            {
              "title": "Pixel-perfect верстка",
              "content_md": "Перенеси макет из Figma без единого пикселя отклонения",
              "xp_reward": 400,
              "difficulty_rating": 3,
              "order": 0,
              "hardcore_xp_multiplier": 2.0,
              "hardcore_description": ""
            }
          ]
        },
        {
          "title": "ФИНАЛ: Fullstack",
          "description": "Объединяет все задания",
          "icon_type": "trophy",
          "xp_reward": 2000,
          "order": 2,
          "pos_x": 430,
          "pos_y": 220,
          "prerequisite_orders": [0, 1],
          "achievement_name": "HARDCORE: Мастер Верстки",
          "achievement_description": "Ты прошёл хардкорный путь",
          "achievement_icon": "💀",
          "tasks": [
            {
              "title": "Готовый проект в портфолио",
              "content_md": "Задеплой проект и добавь в портфолио",
              "xp_reward": 2000,
              "difficulty_rating": 3,
              "order": 0,
              "hardcore_xp_multiplier": 2.0,
              "hardcore_description": ""
            }
          ]
        }
      ]
    }
  ]
}

═══════════════════════════════════════
ПРАВИЛА КОТОРЫЕ НЕЛЬЗЯ НАРУШАТЬ
═══════════════════════════════════════

1. PREREQUISITE_ORDERS — это МАССИВ номеров order:
   [] = нет зависимостей (первые узлы в ветке)
   [0] = нужно сначала выполнить checkpoint с order:0
   [0, 1] = нужно выполнить ОБА checkpoint 0 и 1 (для финала хардкора)

2. ПОЗИЦИИ (pos_x, pos_y):
   - Дерево растёт СНИЗУ ВВЕРХ: начинай с pos_y=480, уменьшай на ~140 для каждого следующего уровня
   - Одна линия: pos_x=430 (центр)
   - Параллельные ветки: разнеси по x (например 200 и 660)
   - Финал хардкора где сходятся несколько веток: pos_x=430 и pos_y меньше всех остальных

3. ACHIEVEMENT (ачивка):
   - Заполняй ТОЛЬКО для важных milestone-точек (финал ветки, финал хардкора)
   - Для промежуточных точек оставляй achievement_name: "" 

4. ИКОНКИ (icon_type):
   code | palette | globe | brain | trophy | star | target | cpu | bolt | book | music | fire

5. СЛОЖНОСТЬ (difficulty_rating):
   1 = легко (новичку под силу)
   2 = средне (нужно постараться)
   3 = сложно (серьёзный вызов)

6. HARDCORE ВЕТКА:
   - is_hardcore: true
   - Несколько параллельных стартовых точек (prerequisite_orders: [])
   - Все они ведут к одной финальной точке (prerequisite_orders: [0, 1, 2...])
   - XP в 2-3 раза больше обычного

═══════════════════════════════════════
ТВОЁ ЗАДАНИЕ
═══════════════════════════════════════

Создай направление обучения для: [ВСТАВЬ ТЕМУ СЮДА]

Структура:
- 2-3 обычные ветки (is_hardcore: false)  
- 1 хардкорная ветка (is_hardcore: true)
- В каждой ветке 3-5 checkpoints
- В каждом checkpoint 2-4 задания
- Последний checkpoint каждой ветки — milestone с achievement_name

Верни ТОЛЬКО JSON. Никаких объяснений.`;

export default function JsonImport({ onImported, onClose }: Props) {
  const [mode, setMode] = useState<'prompt' | 'json'>('prompt');
  const [json, setJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setJson(ev.target?.result as string); setMode('json'); };
    reader.readAsText(file);
  };

  const importJson = async () => {
    setError(''); setImporting(true);
    try {
      const parsed = JSON.parse(json);
      await directionsApi.importJson(parsed);
      setSuccess(true);
      setTimeout(() => { onImported(); }, 1500);
    } catch (e: any) {
      if (e instanceof SyntaxError) setError('Невалидный JSON: ' + e.message);
      else setError(e?.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Ошибка импорта');
    } finally { setImporting(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#07070f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
        width: '100%', maxWidth: 740, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 80px rgba(0,0,0,0.9)',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8e8f0' }}>
                AI · JSON Импорт
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                Сгенерируй программу через ИИ и импортируй
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px' }}>
          {([['prompt', '① Промпт для ИИ'], ['json', '② Вставить JSON']] as const).map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '12px 16px', background: 'none', border: 'none', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.1em', cursor: 'pointer', color: mode === m ? '#a855f7' : 'rgba(255,255,255,0.4)',
              borderBottom: mode === m ? '2px solid #a855f7' : '2px solid transparent',
              fontFamily: "'Rajdhani',sans-serif",
            }}>{l}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {mode === 'prompt' ? (
            <div>
              {/* How it works */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {[
                  { n: '01', t: 'Скопируй промпт', d: 'Нажми кнопку ниже — промпт уже содержит схему JSON' },
                  { n: '02', t: 'Укажи тему', d: 'Замени [YOUR TOPIC HERE] на свою тему обучения' },
                  { n: '03', t: 'Вставь в Claude/GPT', d: 'Скопируй ответ ИИ и вставь на вкладке JSON' },
                ].map(step => (
                  <div key={step.n} style={{
                    flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 900, color: '#7c3aed33', marginBottom: 4 }}>{step.n}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d0d0e0', marginBottom: 4 }}>{step.t}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{step.d}</div>
                  </div>
                ))}
              </div>

              {/* Prompt display */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                  ПРОМПТ ДЛЯ ИИ
                </div>
                <pre style={{
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '14px 16px', fontSize: 11, color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6, overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {AI_PROMPT}
                </pre>
                <button onClick={copyPrompt} style={{
                  position: 'absolute', top: 30, right: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)',
                  border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(124,58,237,0.4)'}`,
                  borderRadius: 6, color: copied ? '#10b981' : '#a855f7',
                  fontSize: 11, fontWeight: 600, padding: '6px 12px', cursor: 'pointer',
                  fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em',
                }}>
                  {copied ? <><Check size={12} /> Скопировано</> : <><Copy size={12} /> Копировать</>}
                </button>
              </div>

              <button onClick={() => setMode('json')} style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(232,0,61,0.1))',
                border: '1px solid rgba(124,58,237,0.4)', color: '#c084fc',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', cursor: 'pointer',
                fontFamily: "'Rajdhani',sans-serif",
              }}>
                Уже сгенерировал → Перейти к импорту →
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <button onClick={() => fileRef.current?.click()} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600,
                  padding: '7px 12px', cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em',
                }}>
                  <Upload size={13} /> Загрузить .json файл
                </button>
                <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', alignSelf: 'center' }}>или вставь JSON вручную ↓</div>
              </div>

              <textarea
                value={json}
                onChange={e => setJson(e.target.value)}
                placeholder={`{\n  "name": "My Direction",\n  "slug": "my-direction",\n  ...\n}`}
                style={{
                  width: '100%', minHeight: 280, background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${error ? 'rgba(255,100,100,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, color: '#a0e0a0', fontFamily: "'Courier New', monospace",
                  fontSize: 12, padding: '14px 16px', resize: 'vertical', outline: 'none',
                  lineHeight: 1.5,
                }}
              />

              {error && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.25)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#ff6060', fontFamily: "'Courier New', monospace", whiteSpace: 'pre-wrap' }}>{error}</div>
                </div>
              )}

              {success && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#10b981" />
                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Импорт успешен! Загружаю...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'json' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Отмена</button>
            <button onClick={importJson} disabled={importing || !json.trim()} style={{
              flex: 2, padding: '10px', borderRadius: 8, border: 'none',
              background: json.trim() ? 'linear-gradient(135deg,#7c3aed,#e8003d)' : 'rgba(255,255,255,0.05)',
              color: json.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', fontFamily: "'Cinzel',serif", cursor: importing || !json.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {importing ? 'Импортирую...' : <><FileJson size={14} /> Импортировать</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
