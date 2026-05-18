# 🚀 Портал ООО "Геоконтроль"

Корпоративная платформа для управления датчиками, задачами, чатами и AI-аналитикой.

## 📦 Стек технологий

### Backend
- **NestJS** (Node.js) - основной API сервер
- **FastAPI** (Python) - ML сервис
- **PostgreSQL 15** - база данных
- **Redis** - кеш и сессии
- **MinIO** - объектное хранилище
- **Socket.IO** - WebSocket для чата

### Frontend
- **React 18** + **TypeScript**
- **Vite** - сборка
- **Tailwind CSS** - стили
- **Zustand** - состояние
- **React Query** - кеш API
- **React DnD** - drag&drop для Kanban

### DevOps
- **Docker** + **Docker Compose**
- **Prometheus** + **Grafana** - мониторинг

## 🚀 Быстрый старт

### 1. Запуск инфраструктуры

```bash
docker-compose up -d
```

Это запустит:
- PostgreSQL (порт 5432)
- Redis (порт 6379)
- MinIO (порт 9000, консоль 9001)
- Backend API (порт 3001)
- Frontend (порт 3000)
- ML Service (порт 8000)

### 2. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# ML Service
cd ml-service
pip install -r requirements.txt
```

### 3. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и настройте:

```bash
cp .env.example .env
```

### 4. Запуск в режиме разработки

```bash
# Backend (из корня проекта)
npm run dev:backend

# Frontend (в другом терминале)
npm run dev:frontend

# ML Service (в третьем терминале)
npm run dev:ml
```

## 📁 Структура проекта

```
/workspace
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Аутентификация (JWT, 2FA, RBAC)
│   │   ├── users/          # Управление пользователями
│   │   ├── sensors/        # Учет датчиков (токены, QR, перемещения)
│   │   ├── chat/           # Чат (WebSocket, группы, файлы)
│   │   ├── tasks/          # Задачи (Kanban, чек-листы)
│   │   ├── minio/          # Работа с файлами
│   │   └── app.module.ts
│   └── package.json
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/      # Компоненты чата
│   │   │   └── tasks/     # Kanban доска
│   │   ├── hooks/         # Custom hooks (useChat, useTasks)
│   │   ├── services/      # API клиент
│   │   └── types/         # TypeScript типы
│   └── package.json
├── ml-service/            # FastAPI ML сервис
│   ├── main.py
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

## 🔐 Роли пользователей

| Роль | Описание |
|------|----------|
| `guest` | Только просмотр публичных данных |
| `user` | Базовый доступ к задачам и чату |
| `engineer` | Редактирование датчиков, создание заявок |
| `supervisor` | Управление командой, утверждение заявок |
| `admin` | Полный доступ ко всем модулям |
| `superadmin` | Системные настройки, управление ролями |

## 📡 API Endpoints

### Аутентификация
- `POST /auth/login` - Вход (логин + пароль + TOTP)
- `POST /auth/refresh` - Обновление токена
- `POST /auth/2fa/verify` - Проверка 2FA кода

### Датчики
- `GET /sensors` - Список датчиков с фильтрами
- `POST /sensors` - Создание датчика (авто-генерация токена)
- `GET /sensors/:id` - Карточка датчика
- `POST /sensors/:id/move` - Заявка на перемещение
- `GET /sensors/scan/:token` - Публичный скан (QR)

### Чат
- `GET /chat/groups/me` - Мои группы
- `POST /chat/groups` - Создать группу
- `GET /chat/groups/:id/messages` - Сообщения группы
- `POST /chat/messages` - Отправить сообщение
- `WS /chat` - WebSocket подключение

### Задачи
- `GET /tasks` - Список задач
- `GET /tasks/kanban` - Данные для Kanban доски
- `POST /tasks` - Создать задачу
- `POST /tasks/:id/move` - Переместить задачу
- `PUT /tasks/:id` - Обновить задачу

### AI
- `GET /ai/sensors/:id/risk` - Оценка риска датчика
- `POST /ai/feedback` - Обратная связь по предсказанию
- `PUT /ai/models/:name/config` - Настройка модели (admin)

## 🧪 Тесты

```bash
# Backend тесты
cd backend
npm run test          # Unit тесты
npm run test:e2e      # E2E тесты
npm run test:cov      # Покрытие кода

# Frontend тесты
cd frontend
npm run test
npm run test:e2e      # Playwright
```

## 📊 Мониторинг

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3003 (admin/admin)
- **MinIO Console**: http://localhost:9001

## 🔒 Безопасность

- Пароли хешируются через **Argon2id**
- TOTP секреты шифруются (**AES-256**)
- Rate limiting: 5 login/15min, 100 API-req/min
- RBAC проверка на уровне middleware
- Аудит всех мутаций в таблице `audit_log`
- Файлы доступны по подписанным URL с экспайром

## 🤖 AI Модуль

ML сервис предоставляет:
- Прогноз даты поверки датчиков (Prophet)
- Обнаружение аномалий перемещений
- Risk scoring датчиков
- Ежедневные алёрты (за 90 дней до поверки)

## 📝 Лицензия

© 2024 ООО "Геоконтроль". Все права защищены.
