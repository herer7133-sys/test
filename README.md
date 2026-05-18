# Портал ООО "Геоконтроль"

Корпоративная платформа для управления датчиками, задачами, чатами и AI-аналитикой.

## 🏗️ Архитектура

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend    │────▶│  ML Service │
│ React+Vite  │◀────│   NestJS     │◀────│   FastAPI   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │PostgreSQL│     │  Redis   │     │  MinIO   │
   │  Database│     │  Cache   │     │ Storage  │
   └──────────┘     └──────────┘     └──────────┘
```

## 📦 Модули

### ✅ Реализовано
- **Auth** - JWT аутентификация, TOTP 2FA, RBAC
- **Users** - Управление пользователями и ролями
- **Sensors** - Учет датчиков, токенизация, QR-коды, схемы
- **Chat** - Личные/групповые чаты, WebSocket, файлы
- **Tasks** - Kanban-доска, задачи, чек-листы
- **CRM** - Контрагенты, проекты, активности
- **Documents** - Папки, версионирование, права доступа
- **Training** - Учебные материалы, прогресс
- **Schedules** - Графики смен, учет времени
- **ML Service** - Прогнозы поверки, аномалии, риск-скоринг

### 🔜 В разработке
- Frontend компоненты
- Интеграция AI с основным бэкендом
- E2E тесты
- CI/CD пайплайны

## 🚀 Быстрый старт

### Требования
- Docker & Docker Compose
- Node.js 18+ (для локальной разработки)
- Python 3.11+ (для ML сервиса)

### Запуск через Docker

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить логи
docker-compose logs -f
```

Сервисы будут доступны:
- **Backend API**: http://localhost:3000
- **ML Service**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001

### Локальная разработка

#### Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```

#### ML Service (FastAPI)
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📡 API Документация

- **Backend Swagger**: http://localhost:3000/api/docs
- **ML Service Swagger**: http://localhost:8000/docs

### Основные эндпоинты

#### Auth
```
POST /auth/login          - Вход (email + password + TOTP)
POST /auth/refresh        - Обновление токена
POST /auth/logout         - Выход
```

#### Sensors
```
GET  /sensors             - Список датчиков
POST /sensors             - Создать датчик
GET  /sensors/:id         - Детали датчика
POST /sensors/:id/move    - Заявка на перемещение
```

#### AI/ML
```
POST /predict/calibration/:id  - Прогноз поверки
POST /detect/anomaly/:id       - Обнаружение аномалий
GET  /sensors/:id/risk         - Оценка риска
```

## 🔐 Роли

| Роль | Описание |
|------|----------|
| `guest` | Гость |
| `user` | Пользователь |
| `engineer` | Инженер |
| `supervisor` | Руководитель |
| `admin` | Администратор |
| `superadmin` | Суперадмин |

## 🧪 Тестирование

```bash
# Backend тесты
cd backend && npm run test

# ML Service тесты
cd ml-service && pytest tests/ -v
```

## 📁 Структура

```
geocontrol/
├── backend/           # NestJS API
├── frontend/          # React приложение  
├── ml-service/        # FastAPI ML сервис
├── infra/             # Инфраструктура (БД)
├── docker-compose.yml
└── README.md
```

---
**Версия**: 1.0.0 | **Статус**: Активная разработка
