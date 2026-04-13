import os, django, sys
sys.path.insert(0, '/home/claude/skillquest/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from skills.models import Direction, Branch, Checkpoint, Task

Task.objects.all().delete()
Checkpoint.objects.all().delete()
Branch.objects.all().delete()
Direction.objects.all().delete()

def cp(branch, title, order, px, py, xp=300, icon='star', ach_name='', ach_desc='', ach_icon='🏆'):
    return Checkpoint.objects.create(
        branch=branch, title=title, order=order,
        pos_x=px, pos_y=py, xp_reward=xp, icon_type=icon,
        achievement_name=ach_name, achievement_description=ach_desc, achievement_icon=ach_icon,
    )

def task(checkpoint, title, xp=100, diff=1, desc=''):
    Task.objects.create(checkpoint=checkpoint, title=title, xp_reward=xp, difficulty_rating=diff, content_md=desc, order=checkpoint.tasks.count())

# ── Tech & Design ──────────────────────────────────────────────────────────
td = Direction.objects.create(name='Tech & Design', slug='tech-design', icon_type='code',
    description='Веб-разработка, UX/UI и 3D', color_hex='#e8003d', order=0)

# Web Dev branch
web = Branch.objects.create(direction=td, title='Web Dev + AI', color_hex='#e8003d', order=0)
w0 = cp(web,'Foundations',0, 430,480, 200,'code')
task(w0,'Верстка лэндинга HTML/CSS',50,1,'Создай простую страницу лэндинга')
task(w0,'Flexbox & Grid',50,1)
task(w0,'CSS анимации',50,2)
task(w0,'Первый JS скрипт',50,1)

w1 = cp(web,'HTML / CSS',1, 430,350, 300,'code')
task(w1,'DOM манипуляции',75,2)
task(w1,'Async/Await и Fetch',75,2)
task(w1,'LocalStorage',75,1)
task(w1,'Простой блог',75,2)
w1.prerequisites.add(w0)

w2 = cp(web,'JS Core',2, 360,210, 500,'cpu',
    'Junior Developer','Ты готов к реальным проектам','🔰')
task(w2,'React компоненты и хуки',100,2)
task(w2,'State management',100,2)
task(w2,'REST API интеграция',100,2)
task(w2,'Deploy на Vercel',100,1)
task(w2,'Node.js + Express',100,3)
w2.prerequisites.add(w1)

w3 = cp(web,'React',3, 220,90, 400,'cpu')
task(w3,'AI интеграция (OpenAI API)',150,3)
task(w3,'LangChain + RAG',150,3)
w3.prerequisites.add(w2)

w4 = cp(web,'Advanced APIs',4, 520,90, 400,'globe')
task(w4,'GraphQL',150,3)
task(w4,'WebSockets',150,3)
w4.prerequisites.add(w2)

w5 = cp(web,'Full Stack',5, 370,-30, 800,'trophy',
    'Middle Developer','Full Stack + AI. Ты опасен.','⚡')
task(w5,'SaaS с AI',300,3)
task(w5,'CI/CD pipeline',200,2)
task(w5,'Публичный кейс-стади',300,3)
w5.prerequisites.add(w3)
w5.prerequisites.add(w4)

# UX/UI branch
ui = Branch.objects.create(direction=td, title='UX/UI Figma', color_hex='#7c3aed', order=1)
u0 = cp(ui,'Figma Basics',0, 430,480, 200,'palette')
task(u0,'Auto Layout',50,1)
task(u0,'Компоненты и варианты',50,1)
task(u0,'Первый мокап',100,2)

u1 = cp(ui,'UI Design',1, 430,340, 400,'palette',
    'UI Designer','Твои макеты говорят сами за себя','✨')
task(u1,'Дизайн-система',100,2)
task(u1,'Мобильное приложение',150,2)
task(u1,'User Research',150,3)
u1.prerequisites.add(u0)

u2 = cp(ui,'Senior Designer',2, 430,200, 600,'trophy',
    'Senior Designer','Ты создаёшь дизайн-системы','👑')
task(u2,'Полная дизайн-система',200,3)
task(u2,'Анимированный прототип',200,3)
u2.prerequisites.add(u1)

# Blender branch
bl = Branch.objects.create(direction=td, title='Blender 3D', color_hex='#f59e0b', order=2)
b0 = cp(bl,'3D Basics',0, 430,480, 200,'globe')
task(b0,'Интерфейс Blender',50,1)
task(b0,'Базовый моделинг',100,1)
task(b0,'Материалы и освещение',50,2)

b1 = cp(bl,'Modeling',1, 430,340, 400,'globe',
    '3D Artist','Ты видишь мир в полигонах','🌐')
task(b1,'Sculpting',100,2)
task(b1,'UV развёртка',150,3)
task(b1,'Финальный рендер',150,3)
b1.prerequisites.add(b0)

b2 = cp(bl,'3D Animator',2, 430,200, 600,'trophy',
    '3D Animator','Жизнь в каждом полигоне','✨')
task(b2,'Rigging персонажа',200,3)
task(b2,'Короткометражка 30с',400,3)
b2.prerequisites.add(b1)

# Hardcore branch — three starting nodes converge to one mega checkpoint
hc = Branch.objects.create(direction=td, title='HARDCORE: Creator', color_hex='#ff0000', order=3, is_hardcore=True)
td.branches.filter(title='Web Dev + AI').update()  # just ref
hc_web = cp(hc,'WEB',0, 130,320, 300,'code')
task(hc_web,'Адаптивный лэндинг',100,2)
task(hc_web,'Анимированные компоненты',100,2)
task(hc_web,'React приложение',100,2)

hc_ui = cp(hc,'DESIGN',1, 430,320, 300,'palette')
task(hc_ui,'UX-исследование',100,2)
task(hc_ui,'Полный прототип в Figma',100,3)
task(hc_ui,'Дизайн-система',100,3)

hc_3d = cp(hc,'3D',2, 730,320, 300,'globe')
task(hc_3d,'3D логотип',150,2)
task(hc_3d,'WebGL экспорт',150,3)

hc_mega = cp(hc,'WEB+DESIGN+3D',3, 430,160, 3000,'trophy',
    'HARDCORE Lv.I','Три ветки — одна точка. Только сильнейшие.','💀')
task(hc_mega,'Лэндинг с 3D Hero (Three.js)',500,3)
task(hc_mega,'Дизайн из Figma пиксель в пиксель',500,3)
task(hc_mega,'React + Three.js интеграция',500,3)
task(hc_mega,'Деплой + публичный кейс-стади',500,3)
task(hc_mega,'Code review от ментора',1000,3)
hc_mega.prerequisites.add(hc_web)
hc_mega.prerequisites.add(hc_ui)
hc_mega.prerequisites.add(hc_3d)

hc_elite = cp(hc,'ELITE',4, 430,30, 5000,'trophy',
    'HARDCORE ELITE','Ты создаёшь будущее','🔥')
task(hc_elite,'Продукт в продакшне',2000,3)
task(hc_elite,'500+ пользователей',2000,3)
task(hc_elite,'Публичный кейс',1000,3)
hc_elite.prerequisites.add(hc_mega)

# Link hardcore variant to Web Dev branch
web.hardcore_variant = hc
web.save()

# ── Mind & Knowledge ──────────────────────────────────────────────────────
mind = Direction.objects.create(name='Разум & Знания', slug='mind', icon_type='brain',
    description='Продуктивность, языки, мышление', color_hex='#7c3aed', order=1)
prod = Branch.objects.create(direction=mind, title='Продуктивность', color_hex='#7c3aed', order=0)
m0 = cp(prod,'GTD System',0, 430,400, 200,'target')
task(m0,'Настрой систему GTD',100,1)
task(m0,'30 дней без прокрастинации',100,3)
m1 = cp(prod,'Deep Work',1, 430,260, 400,'brain',
    'Focus Master','Ты контролируешь своё внимание','🧠')
task(m1,'Блоки глубокой работы 90мин',100,2)
task(m1,'Цифровой детокс 1 неделя',150,3)
m1.prerequisites.add(m0)

print("Seed OK")
