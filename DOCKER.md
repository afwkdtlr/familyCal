# FamilyCal Docker Guide

## 1) Prerequisites

- Docker Desktop installed and running
- `docker` and `docker compose` commands available

## 2) Local start (MySQL)

From project root:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:11115`
- MySQL DB: `localhost:3307`

## 3) Stop services

```bash
docker compose -f docker-compose.local.yml down
```

To also remove DB data volume:

```bash
docker compose -f docker-compose.local.yml down -v
```

## 4) Production start

```bash
cp .env.prod.example .env.prod
# edit .env.prod values first
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

## 5) Check logs

```bash
docker compose -f docker-compose.local.yml logs -f mysql
docker compose -f docker-compose.local.yml logs -f backend
docker compose -f docker-compose.local.yml logs -f frontend
```

## 6) Notes

- MySQL first startup can take a few minutes.
- Backend may restart automatically until MySQL is ready.
- Default admin bootstrap account is controlled by:
  - `FAMILYCAL_BOOTSTRAP_ADMIN_USERNAME`
  - `FAMILYCAL_BOOTSTRAP_ADMIN_PASSWORD`
