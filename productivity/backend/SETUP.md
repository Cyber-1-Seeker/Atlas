# True Productivity — Инструкция по запуску

## Структура проекта
```
project/
├── backend/     ← Django REST API
└── frontend/    ← React (Vite)
```

---

## 1. Backend

### Требования
- Python 3.11+
- PostgreSQL (опционально — без него используется SQLite)

### Установка
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Настройка
```bash
cp .env.example .env
# Заполните .env (SECRET_KEY, DB_* если используете PostgreSQL)
```

### Запуск (SQLite — для разработки без PostgreSQL)
```bash
python manage.py migrate
python manage.py createsuperuser  # опционально
python manage.py runserver
```
API будет доступен: http://localhost:8000/api/

---

## 2. Frontend

### Требования
- Node.js 18+

### Установка
```bash
cd frontend
npm install
```

### Настройка
```bash
cp .env.example .env
# VITE_API_URL=http://localhost:8000/api  (по умолчанию)
```

### Запуск
```bash
npm run dev
```
Сайт: http://localhost:5173

---

## 3. Что сохраняется где

| Данные                  | Хранилище          |
|-------------------------|--------------------|
| Цели, задачи 12 недель  | Сервер (PostgreSQL) |
| Трекеры прогресса       | Сервер             |
| Жизненный круг          | Сервер             |
| Активная вкладка        | localStorage       |
| Состояние графиков      | localStorage       |
| JWT токены              | localStorage       |

---

## 4. Файлы которые нужно УДАЛИТЬ из frontend/src/

Эти файлы заменены новыми версиями:
- `components/Navbar.tsx` — заменён на `components/Sidebar.tsx`
- `pages/GeneralGoals.tsx` — заменён на `pages/Profile.tsx`
- `components/progress/ProgressChart.tsx` — удалён (заменён ChartEngine)
- `components/progress/StrengthChart.tsx` — удалён (заменён ChartEngine)

---

## 5. Переменные окружения

### backend/.env
```
SECRET_KEY=сгенерируйте-через-python-secrets
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=             # пусто = SQLite
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### frontend/.env
```
VITE_API_URL=http://localhost:8000/api
```
