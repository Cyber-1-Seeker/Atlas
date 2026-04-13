# Сборка и пуш образов в Docker Hub

## Структура папок
```
productivityMax/
├── backend/
│   ├── Dockerfile.backend      ← скопируйте сюда
│   ├── .dockerignore           ← скопируйте .dockerignore.backend сюда как .dockerignore
│   ├── manage.py
│   └── ...
├── frontend/
│   ├── Dockerfile.frontend     ← скопируйте сюда
│   ├── nginx.conf              ← скопируйте сюда
│   ├── .dockerignore           ← скопируйте .dockerignore.frontend сюда как .dockerignore
│   ├── package.json
│   └── ...
└── docker-compose.build.yml    ← в корень проекта
```

## Шаги для пуша

### 1. Войдите в Docker Hub
```bash
docker login
# введите логин sensh1 и пароль
```

### 2. Добавьте gunicorn в requirements.txt backend
```
gunicorn==21.2.0
```

### 3. Соберите и запушьте оба образа
```bash
# Из корня проекта (там где docker-compose.build.yml)
docker compose -f docker-compose.build.yml build
docker compose -f docker-compose.build.yml push
```

Или по отдельности:
```bash
# Backend
cd backend
docker build -f Dockerfile.backend -t sensh1/realty-app:backend-latest .
docker push sensh1/realty-app:backend-latest

# Frontend (замените URL на адрес вашего сервера)
cd ../frontend
docker build -f Dockerfile.frontend \
  --build-arg VITE_API_URL=https://ВАШ_ДОМЕН/api \
  -t sensh1/realty-app:frontend-latest .
docker push sensh1/realty-app:frontend-latest
```

### 4. Проверка
После пуша образы появятся на:
https://hub.docker.com/u/sensh1

---

## Важно: .env для backend в Docker
При деплое на сервер нужно передать переменные окружения.
Они НЕ попадают в образ (безопасность) — передаются при запуске контейнера.
Пример для сервера будет в следующем docker-compose для деплоя.
