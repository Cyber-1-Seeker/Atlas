/**
 * GuidePage — подробное руководство по использованию True Productivity.
 */
import {useState} from 'react';
import {Typography, Divider, Tag, Flex} from 'antd';

const {Title, Text, Paragraph} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

interface Section {
    id: string;
    emoji: string;
    title: string;
    color: string;
    content: React.ReactNode;
}

const sections: Section[] = [
    {
        id: 'philosophy',
        emoji: '🧭',
        title: 'Философия системы',
        color: '#667eea',
        content: (
            <div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    True Productivity — это не просто трекер задач. Это система, которая помогает вам жить осознанно: видеть картину целиком, замечать прогресс и понимать, куда движется ваша жизнь.
                </Paragraph>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    В основе лежит простая идея: <strong>что измеряется — то растёт</strong>. Когда вы регулярно фиксируете результаты и ставите конкретные цели, мозг начинает воспринимать их серьёзно. Вы перестаёте действовать «на автопилоте» и начинаете жить проактивно.
                </Paragraph>
                <div style={{background:'#f0f2ff',borderRadius:12,padding:'16px 20px',marginTop:16}}>
                    <Text strong style={{fontSize:14,color:'#667eea',display:'block',marginBottom:8}}>
                        💡 Три принципа системы:
                    </Text>
                    {[
                        ['Ясность', 'Разбивайте большие цели на конкретные задачи. Туманные желания превращайте в измеримые результаты.'],
                        ['Регулярность', 'Небольшие действия каждый день важнее редких подвигов. Система работает тогда, когда вы возвращаетесь к ней регулярно.'],
                        ['Обратная связь', 'Отслеживайте прогресс и корректируйте курс. Данные — ваш лучший советник.'],
                    ].map(([t,d])=>(
                        <div key={t} style={{marginBottom:10}}>
                            <Text strong style={{fontSize:14}}>{t}</Text>
                            <Paragraph style={{margin:0,fontSize:13,color:'#595959',lineHeight:1.6}}>{d}</Paragraph>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: '12weeks',
        emoji: '📅',
        title: '12 недель — система целеполагания',
        color: '#52c41a',
        content: (
            <div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    Год — это слишком долго, чтобы удерживать фокус. 12 недель — идеальный горизонт: достаточно большой для значительных изменений, достаточно короткий чтобы оставаться мотивированным.
                </Paragraph>
                <div style={{background:'#f6ffed',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
                    <Text strong style={{fontSize:14,color:'#52c41a',display:'block',marginBottom:10}}>
                        🎯 Как правильно ставить цели:
                    </Text>
                    {[
                        ['Будьте конкретны', 'Вместо "заниматься спортом" — "пробежать 5 км без остановки к 25 марта". Конкретная цель создаёт конкретный план.'],
                        ['Ограничьте количество', 'Максимум 3-5 целей на 12 недель. Больше — значит ни одна не получит достаточно внимания.'],
                        ['Сделайте их амбициозными, но реальными', 'Цель должна требовать усилий, но не казаться невозможной. Иначе мозг саботирует её.'],
                    ].map(([t,d])=>(
                        <div key={t} style={{marginBottom:10}}>
                            <Text strong style={{fontSize:13}}>{t}</Text>
                            <Paragraph style={{margin:0,fontSize:13,color:'#595959',lineHeight:1.6}}>{d}</Paragraph>
                        </div>
                    ))}
                </div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    <strong>Задачи</strong> — это конкретные шаги к цели. Раскидайте их по дням недели: что нужно сделать в понедельник, что в среду, что в пятницу. Не думайте "когда-нибудь" — думайте "в какой день и время".
                </Paragraph>
                <div style={{background:'#fff7e6',borderRadius:12,padding:'14px 18px'}}>
                    <Text strong style={{fontSize:13,color:'#fa8c16',display:'block',marginBottom:6}}>
                        📌 Еженедельный ритуал (10 минут в воскресенье вечером):
                    </Text>
                    <ol style={{margin:0,paddingLeft:20,color:'#595959',fontSize:13,lineHeight:1.9}}>
                        <li>Проверьте выполненное за неделю</li>
                        <li>Отметьте что шло хорошо, что — нет</li>
                        <li>Поставьте 3-5 конкретных задач на следующую неделю</li>
                        <li>Убедитесь, что они связаны с вашими 12-недельными целями</li>
                    </ol>
                </div>
            </div>
        ),
    },
    {
        id: 'progress',
        emoji: '📈',
        title: 'Прогресс — трекинг любых показателей',
        color: '#1677ff',
        content: (
            <div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    Трекер прогресса — это ваш личный дашборд реальности. Он показывает не то, что вы хотели сделать, а то, что происходит на самом деле.
                </Paragraph>
                <div style={{background:'#e6f4ff',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
                    <Text strong style={{fontSize:14,color:'#1677ff',display:'block',marginBottom:10}}>
                        📊 Что стоит отслеживать:
                    </Text>
                    {[
                        {tag:'Здоровье', items:['Вес тела','Часы сна','Количество шагов','Давление','Пульс']},
                        {tag:'Умственное развитие', items:['Страницы прочитано','Часы учёбы','Слова иностранного языка']},
                        {tag:'Финансы', items:['Ежемесячные расходы','Сбережения','Инвестиции']},
                        {tag:'Продуктивность', items:['Часы глубокой работы','Задачи выполнено','Скорость печати']},
                    ].map(({tag,items})=>(
                        <div key={tag} style={{marginBottom:10}}>
                            <Tag color="blue" style={{marginBottom:4}}>{tag}</Tag>
                            <Paragraph style={{margin:0,fontSize:12,color:'#595959'}}>{items.join(' · ')}</Paragraph>
                        </div>
                    ))}
                </div>
                <Paragraph style={{fontSize:14,lineHeight:1.8,color:'#595959'}}>
                    <strong>Совет:</strong> Не создавайте сразу 20 трекеров. Начните с 3-4 самых важных. Когда привычка сформируется — добавьте ещё. Перегруженная система перестаёт работать.
                </Paragraph>
                <div style={{background:'#f0f2ff',borderRadius:12,padding:'14px 18px'}}>
                    <Text strong style={{fontSize:13,color:'#667eea',display:'block',marginBottom:6}}>
                        🔍 Как читать графики:
                    </Text>
                    <ul style={{margin:0,paddingLeft:20,color:'#595959',fontSize:13,lineHeight:1.9}}>
                        <li><strong>Неделя → По дням</strong> — видите паттерны: в какие дни вы наиболее продуктивны</li>
                        <li><strong>Месяц → По неделям</strong> — замечаете тренды: растёте или стагнируете</li>
                        <li><strong>3 месяца / Всё время</strong> — оцениваете долгосрочный прогресс</li>
                        <li>Клик на столбец → детализация за этот период</li>
                    </ul>
                </div>
            </div>
        ),
    },
    {
        id: 'lifewheel',
        emoji: '⭕',
        title: 'Жизненный круг — баланс направлений',
        color: '#eb2f96',
        content: (
            <div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    Представьте, что ваша жизнь — это колесо. Если некоторые сектора значительно меньше остальных, колесо катится неровно. Жизненный круг помогает увидеть, какие области жизни вы развиваете, а какие игнорируете.
                </Paragraph>
                <div style={{background:'#fff0f6',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
                    <Text strong style={{fontSize:14,color:'#eb2f96',display:'block',marginBottom:10}}>
                        🎡 Типичные направления жизни:
                    </Text>
                    <Flex gap={6} wrap="wrap">
                        {['Здоровье','Карьера','Финансы','Отношения','Семья','Духовность','Развитие','Яркость жизни','Окружение','Отдых'].map(t=>(
                            <Tag key={t} color="pink" style={{fontSize:12}}>{t}</Tag>
                        ))}
                    </Flex>
                </div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    <strong>Как пользоваться:</strong> Раз в месяц честно оцените каждое направление от 1 до 10. Задайте себе вопрос: "Если бы эта область была идеальной, что в ней происходило бы?" Это поможет поставить конкретные задачи.
                </Paragraph>
                <div style={{background:'#fff0f6',borderRadius:12,padding:'14px 18px'}}>
                    <Text strong style={{fontSize:13,color:'#eb2f96',display:'block',marginBottom:6}}>
                        💭 Пример анализа:
                    </Text>
                    <Paragraph style={{margin:0,fontSize:13,color:'#595959',lineHeight:1.8,fontStyle:'italic'}}>
                        "Здоровье — 4/10. Что мешает быть 10/10? Нет режима сна, не занимаюсь спортом, питаюсь хаотично. 
                        Что сделать за 12 недель? Лечь спать до 23:00 ежедневно и тренироваться 3 раза в неделю."
                    </Paragraph>
                </div>
            </div>
        ),
    },
    {
        id: 'fitness',
        emoji: '💪',
        title: 'Фитнес — умные тренировки',
        color: '#fa541c',
        content: (
            <div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    Вкладка Фитнес — это полноценный спортивный дневник. Она помогает не просто "ходить в зал", а тренироваться системно: с программой, анализом нагрузки и отслеживанием прогресса.
                </Paragraph>
                <div style={{background:'#fff2e8',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
                    <Text strong style={{fontSize:14,color:'#fa541c',display:'block',marginBottom:10}}>
                        🗓 Как составить программу:
                    </Text>
                    <ol style={{margin:0,paddingLeft:20,color:'#595959',fontSize:13,lineHeight:2}}>
                        <li>Создайте программу (например, "Сплит 3×неделю")</li>
                        <li>Добавьте дни тренировок (Грудь+Трицепс, Спина+Бицепс, Ноги)</li>
                        <li>Внутри каждого дня добавьте разделы и упражнения из библиотеки</li>
                        <li>Укажите количество подходов для каждого упражнения</li>
                        <li><strong>Активируйте</strong> программу — она станет основной</li>
                        <li>Нажмите "Начать тренировку" и записывайте результаты</li>
                    </ol>
                </div>
                <Paragraph style={{fontSize:14,lineHeight:1.8,color:'#595959'}}>
                    <strong>1RM (одноповторный максимум)</strong> — стандартный способ сравнивать силовые показатели. Если сегодня вы сделали 80 кг × 10 раз, а в прошлый раз 75 кг × 12 раз — 1RM покажет, реально ли вы стали сильнее.
                </Paragraph>
                <div style={{background:'#fff2e8',borderRadius:12,padding:'14px 18px'}}>
                    <Text strong style={{fontSize:13,color:'#fa541c',display:'block',marginBottom:6}}>
                        📊 Синхронизация с Прогрессом:
                    </Text>
                    <Paragraph style={{margin:0,fontSize:13,color:'#595959',lineHeight:1.8}}>
                        После каждой тренировки результаты автоматически попадают в трекеры прогресса. Каждое упражнение становится отдельным трекером — так вы видите долгосрочный рост силы.
                    </Paragraph>
                </div>
            </div>
        ),
    },
    {
        id: 'board',
        emoji: '🗂️',
        title: 'Доска — визуальное мышление',
        color: '#722ed1',
        content: (
            <div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    Доска — это свободное пространство для визуализации идей. Когда мысли записаны и расставлены в пространстве, мозг лучше видит связи и противоречия.
                </Paragraph>
                <div style={{background:'#f9f0ff',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
                    <Text strong style={{fontSize:14,color:'#722ed1',display:'block',marginBottom:10}}>
                        🎨 Что можно делать на доске:
                    </Text>
                    {[
                        ['Майнд-карты', 'Запишите центральную идею и разветвляйте её. Связывайте стрелками. Так рождаются планы.'],
                        ['Разбор проблем', 'Напишите проблему в центре, вокруг — причины и решения. Визуальный анализ часто быстрее текстового.'],
                        ['Живые виджеты', 'Добавьте карточки ваших целей, трекеров и сегментов жизненного круга прямо на доску. Данные обновляются автоматически.'],
                        ['Таблицы и планы', 'Используйте таблицы для структурированной информации: сравнения, списки, расписания.'],
                    ].map(([t,d])=>(
                        <div key={t} style={{marginBottom:10}}>
                            <Text strong style={{fontSize:13}}>{t}</Text>
                            <Paragraph style={{margin:0,fontSize:13,color:'#595959',lineHeight:1.6}}>{d}</Paragraph>
                        </div>
                    ))}
                </div>
                <Paragraph style={{fontSize:14,color:'#595959',lineHeight:1.8}}>
                    <strong>Совет для творческих людей:</strong> Не бойтесь беспорядка. Сначала накидайте всё что в голове, потом группируйте и структурируйте. Доска сохраняется автоматически каждые 30 секунд.
                </Paragraph>
            </div>
        ),
    },
    {
        id: 'habits',
        emoji: '🧱',
        title: 'Как выстроить самодисциплину',
        color: '#13c2c2',
        content: (
            <div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    Самодисциплина — это не сила воли. Это система, которая делает правильные действия <strong>лёгкими</strong>, а неправильные — <strong>сложными</strong>.
                </Paragraph>
                <div style={{background:'#e6fffb',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
                    <Text strong style={{fontSize:14,color:'#13c2c2',display:'block',marginBottom:10}}>
                        🔑 Ключевые принципы:
                    </Text>
                    {[
                        ['Начните с малого', 'Хотите тренироваться — начните с 10 минут, а не с часа. Хотите читать — с 5 страниц. Привычка важнее объёма.'],
                        ['Привяжите к существующим привычкам', '"После утреннего кофе я открываю приложение и смотрю на цели". Новое поведение легче встроить рядом с существующим.'],
                        ['Сделайте прогресс видимым', 'Именно для этого здесь есть трекеры. Визуальный прогресс создаёт стимул не прерывать серию.'],
                        ['Планируйте провалы', '"Если я пропустил тренировку, то..." — заранее решите что делаете в случае срыва. Не "всё пропало", а конкретный план Б.'],
                        ['Окружение сильнее воли', 'Уберите с телефона отвлекающие приложения. Положите книгу на видное место. Среда управляет поведением.'],
                    ].map(([t,d])=>(
                        <div key={t} style={{marginBottom:12}}>
                            <Text strong style={{fontSize:14}}>{t}</Text>
                            <Paragraph style={{margin:0,fontSize:13,color:'#595959',lineHeight:1.7}}>{d}</Paragraph>
                        </div>
                    ))}
                </div>
                <div style={{background:'#e6fffb',borderRadius:12,padding:'14px 18px'}}>
                    <Text strong style={{fontSize:13,color:'#13c2c2',display:'block',marginBottom:6}}>
                        📅 Минимальная еженедельная рутина (30 минут):
                    </Text>
                    <ol style={{margin:0,paddingLeft:20,color:'#595959',fontSize:13,lineHeight:2}}>
                        <li>Воскресенье вечером — проверка целей 12 недель (5 мин)</li>
                        <li>Обновление жизненного круга раз в месяц (10 мин)</li>
                        <li>Добавление записей в трекеры — ежедневно по 1-2 минуты</li>
                        <li>Просмотр доски с планами раз в неделю (5 мин)</li>
                    </ol>
                </div>
            </div>
        ),
    },
    {
        id: 'planning',
        emoji: '🗺️',
        title: 'Система планирования жизни',
        color: '#fa8c16',
        content: (
            <div>
                <Paragraph style={{fontSize:15,lineHeight:1.8,color:'#434343'}}>
                    Правильное планирование — это не расписание каждой минуты. Это ясность в том, что <strong>важно</strong>, и защита времени для этого.
                </Paragraph>
                <div style={{background:'#fff7e6',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
                    <Text strong style={{fontSize:14,color:'#fa8c16',display:'block',marginBottom:10}}>
                        🔄 Трёхуровневая система планирования:
                    </Text>
                    {[
                        {
                            level:'12 недель (стратегия)',
                            color:'#f5222d',
                            text:'2-4 большие цели. Раз в 12 недель переосмыслите: что получилось, что нет, чего хотите дальше.',
                        },
                        {
                            level:'Неделя (тактика)',
                            color:'#fa8c16',
                            text:'3-7 конкретных задач. Каждое воскресенье выберите самые важные действия на неделю.',
                        },
                        {
                            level:'День (исполнение)',
                            color:'#52c41a',
                            text:'1-3 задачи с конкретным временем. Не пишите "заниматься спортом" — пишите "18:00 — зал".',
                        },
                    ].map(({level,color,text})=>(
                        <div key={level} style={{display:'flex',gap:12,marginBottom:12,alignItems:'flex-start'}}>
                            <div style={{width:12,height:12,borderRadius:'50%',background:color,flexShrink:0,marginTop:4}}/>
                            <div>
                                <Text strong style={{fontSize:13,color}}>{level}</Text>
                                <Paragraph style={{margin:0,fontSize:13,color:'#595959',lineHeight:1.6}}>{text}</Paragraph>
                            </div>
                        </div>
                    ))}
                </div>
                <Paragraph style={{fontSize:14,lineHeight:1.8,color:'#595959'}}>
                    <strong>Главная ошибка:</strong> планировать слишком много. Если вы выполнили 3 важные задачи за день — это отличный день. Не нужно делать 15 дел, чтобы чувствовать себя продуктивным.
                </Paragraph>
                <div style={{background:'#fff7e6',borderRadius:12,padding:'14px 18px'}}>
                    <Text strong style={{fontSize:13,color:'#fa8c16',display:'block',marginBottom:6}}>
                        🎯 Правило трёх приоритетов:
                    </Text>
                    <Paragraph style={{margin:0,fontSize:13,color:'#595959',lineHeight:1.8}}>
                        Каждое утро задайте себе вопрос: "Если сегодня я сделаю только три вещи, какие из них сделают день успешным?" Запишите их. Сделайте в первую очередь.
                    </Paragraph>
                </div>
            </div>
        ),
    },
];

const isMobile = () => window.innerWidth <= 768;

export function GuidePage() {
    const [active, setActive] = useState(sections[0].id);
    const mobile = isMobile();

    const current = sections.find(s => s.id === active) ?? sections[0];

    return (
        <div style={{
            maxWidth: 1000, margin: '0 auto',
            padding: mobile ? '14px 12px' : '0',
        }}>
            {/* Заголовок */}
            <div style={{
                background: GRADIENT,
                borderRadius: 16,
                padding: mobile ? '20px 16px' : '28px 32px',
                marginBottom: 24,
                color: 'white',
            }}>
                <Title level={mobile?3:2} style={{margin:0,color:'white'}}>📚 Руководство</Title>
                <Text style={{color:'rgba(255,255,255,0.85)',fontSize:mobile?13:15}}>
                    Как использовать True Productivity для изменения жизни
                </Text>
            </div>

            <div style={{
                display: 'flex',
                gap: 20,
                flexDirection: mobile ? 'column' : 'row',
                alignItems: 'flex-start',
            }}>
                {/* Навигация */}
                <div style={{
                    flexShrink: 0,
                    width: mobile ? '100%' : 220,
                }}>
                    {mobile ? (
                        /* Горизонтальный скролл на мобиле */
                        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
                            {sections.map(s=>(
                                <button key={s.id} onClick={()=>setActive(s.id)} style={{
                                    flexShrink:0,padding:'6px 14px',borderRadius:20,border:'none',
                                    cursor:'pointer',fontSize:12,fontWeight:600,transition:'all 0.15s',
                                    background:active===s.id?s.color:'#f5f5f5',
                                    color:active===s.id?'white':'#595959',
                                }}>
                                    {s.emoji} {s.title.split('—')[0].trim()}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{position:'sticky',top:20}}>
                            {sections.map(s=>(
                                <button key={s.id} onClick={()=>setActive(s.id)} style={{
                                    display:'flex',alignItems:'center',gap:10,width:'100%',
                                    padding:'10px 14px',borderRadius:10,border:'none',
                                    cursor:'pointer',textAlign:'left',
                                    background:active===s.id?`${s.color}15`:'transparent',
                                    borderLeft:active===s.id?`3px solid ${s.color}`:'3px solid transparent',
                                    marginBottom:2,transition:'all 0.15s',
                                }}>
                                    <span style={{fontSize:18,flexShrink:0}}>{s.emoji}</span>
                                    <Text style={{
                                        fontSize:13,fontWeight:active===s.id?700:400,
                                        color:active===s.id?s.color:'#434343',
                                        lineHeight:1.3,
                                    }}>
                                        {s.title}
                                    </Text>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Контент */}
                <div style={{
                    flex:1,background:'white',borderRadius:16,
                    boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
                    overflow:'hidden',
                }}>
                    {/* Шапка раздела */}
                    <div style={{
                        background:`linear-gradient(135deg, ${current.color}20, ${current.color}05)`,
                        borderBottom:`3px solid ${current.color}`,
                        padding:mobile?'16px 16px 14px':'20px 28px 18px',
                    }}>
                        <Flex align="center" gap={12}>
                            <span style={{fontSize:mobile?28:36}}>{current.emoji}</span>
                            <Title level={mobile?4:3} style={{margin:0,color:current.color}}>
                                {current.title}
                            </Title>
                        </Flex>
                    </div>

                    {/* Текст */}
                    <div style={{padding:mobile?'16px':'28px'}}>
                        {current.content}
                    </div>

                    {/* Навигация между разделами */}
                    <div style={{
                        padding:mobile?'12px 16px':'14px 28px',
                        borderTop:'1px solid #f0f0f0',
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                    }}>
                        {(() => {
                            const idx = sections.findIndex(s=>s.id===active);
                            const prev = sections[idx-1];
                            const next = sections[idx+1];
                            return (
                                <>
                                    {prev ? (
                                        <button onClick={()=>setActive(prev.id)} style={{
                                            background:'none',border:'none',cursor:'pointer',
                                            color:'#667eea',fontSize:13,fontWeight:600,
                                        }}>
                                            ← {prev.emoji} {prev.title.split('—')[0].trim()}
                                        </button>
                                    ) : <div/>}
                                    {next ? (
                                        <button onClick={()=>setActive(next.id)} style={{
                                            background:'none',border:'none',cursor:'pointer',
                                            color:'#667eea',fontSize:13,fontWeight:600,
                                        }}>
                                            {next.emoji} {next.title.split('—')[0].trim()} →
                                        </button>
                                    ) : <div/>}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
