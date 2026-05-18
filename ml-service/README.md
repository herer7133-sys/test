# GeoControl ML Service

AI/ML сервис для прогнозирования поверки датчиков, обнаружения аномалий и оценки рисков.

## 🚀 Быстрый старт

### Локальный запуск

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker запуск

```bash
docker-compose up ml-service
```

## 📡 API Endpoints

### Health & Info
- `GET /` - Информация о сервисе
- `GET /health` - Проверка здоровья

### Predictions
- `POST /predict/calibration/{sensor_id}` - Прогноз даты поверки
- `POST /detect/anomaly/{sensor_id}` - Обнаружение аномалий в перемещениях
- `GET /sensors/{sensor_id}/risk` - Оценка риска датчика

### Model Management
- `GET /ai/models/{model_name}/config` - Получить конфигурацию модели
- `PUT /ai/models/{model_name}/config` - Обновить конфигурацию (admin)

### Feedback
- `POST /ai/feedback` - Отправить фидбек на предсказание

### Alerts
- `GET /ai/alerts/pending` - Получить список алертов

## 🧪 Тесты

```bash
# Установка тестовых зависимостей
pip install pytest httpx

# Запуск тестов
pytest tests/ -v
```

## 📊 Примеры запросов

### Прогноз поверки
```bash
curl -X POST http://localhost:8000/predict/calibration/123
```

### Обнаружение аномалий
```bash
curl -X POST http://localhost:8000/detect/anomaly/456 \
  -H "Content-Type: application/json" \
  -d '{"movements": [{"timestamp": "2024-01-01T10:00:00", "location_id": 1}]}'
```

### Оценка риска
```bash
curl http://localhost:8000/sensors/789/risk
```

### Обновление конфигурации модели
```bash
curl -X PUT http://localhost:8000/ai/models/risk_scorer/config \
  -H "Content-Type: application/json" \
  -d '{"feature_weights": {"new_feature": 0.5}}'
```

## 🔧 Конфигурация

Переменные окружения (`.env`):

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `REDIS_HOST` | Redis хост | `redis` |
| `REDIS_PORT` | Redis порт | `6379` |
| `ANOMALY_THRESHOLD` | Порог аномалий | `0.7` |
| `RISK_ALERT_THRESHOLD` | Порог риска | `75` |
| `CALIBRATION_WARNING_DAYS` | Дней до предупреждения | `90` |

## 🏗️ Архитектура

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── config.py      # Настройки
│   ├── models.py      # Pydantic схемы
│   └── predictors.py  # ML логика
├── tests/
│   └── test_api.py    # API тесты
├── main.py            # FastAPI приложение
├── requirements.txt   # Зависимости
├── Dockerfile
└── README.md
```

## 🧠 ML Модели

### Calibration Forecast
Прогнозирует следующую дату поверки на основе:
- Дней с последней поверки
- Часов использования
- Вариаций температуры
- Количества перемещений

### Anomaly Detector
Обнаруживает аномалии в паттернах перемещения:
- Неожиданная локация
- Необычное время
- Частые перемещения
- Дрейф позиции

### Risk Scorer
Комплексная оценка риска (0-100):
- Days since calibration (30%)
- Anomaly history (25%)
- Movement frequency (20%)
- Environment severity (25%)

Уровни риска:
- **Low**: 0-25
- **Medium**: 25-50
- **High**: 50-75
- **Critical**: 75-100

## 📈 Мониторинг

- Prometheus метрики (в разработке)
- Health check endpoint
- Логирование в JSON формате

## 🔐 Безопасность

- В продакшене требуется JWT аутентификация для `/ai/models/*` endpoints
- Rate limiting (настраивается через reverse proxy)
- Валидация всех входных данных через Pydantic

---
**Версия**: 1.0.0  
**Статус**: Разработка
