# Z-Gram

Мессенджер на React + Node.js + Socket.io + PostgreSQL

## Запуск через Docker

**Требования:** [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)

`ash
git clone https://github.com/fFoxer/z-gram.git
cd z-gram
docker-compose up --build
```

После запуска:
- Клиент: http://localhost:3000
- Сервер API: http://localhost:5000

Данные БД сохраняются в Docker volume — при перезапуске не сбрасываются.
