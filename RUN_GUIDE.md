# FamilyCal 실행/종료 가이드

## 1) 백엔드 실행/종료 (IDE 로컬 실행)

### 실행
- IntelliJ Run Configuration Program arguments:
  - `--spring.profiles.active=local`
- 중요: 메인 클래스의 초록 실행 버튼으로 임시 실행하지 말고, 저장된 Run Configuration(`Backend SpringBoot` 또는 `FamilyCalApplication`)으로 실행
- 또는 터미널에서:
  - `cd backend`
  - `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"`

### 종료
- IntelliJ에서 Stop 버튼
- 터미널 실행 시 `Ctrl + C`

---

## 빠른 모드 전환 (추천)

프로젝트 루트에서 아래 명령만 사용하면 됩니다.

- 로컬 모드 시작 (MySQL만 Docker):
  - `.\switch-mode.ps1 local-up`
- 로컬 모드 종료:
  - `.\switch-mode.ps1 local-down`
- 도커 전체 모드 시작 (MySQL+Backend+Frontend):
  - `.\switch-mode.ps1 docker-up`
- 도커 전체 모드 종료:
  - `.\switch-mode.ps1 docker-down`
- 현재 상태 확인:
  - `.\switch-mode.ps1 status`

---

## 2) 프론트 실행/종료 (로컬 실행)

### 실행
- `cd frontend`
- `npm install` (최초 1회)
- `npm run dev`

### 종료
- 터미널에서 `Ctrl + C`

---

## 3) 도커 전체 실행/종료 (local compose)

### 전체 실행 (MySQL + Backend + Frontend)
- `docker compose -f docker-compose.local.yml up -d --build`

### 전체 종료
- `docker compose -f docker-compose.local.yml down`

### 로그 확인
- `docker compose -f docker-compose.local.yml logs -f`

### 모드 충돌 방지 팁
- 로컬 모드와 도커 전체 모드를 동시에 띄우지 마세요 (포트 `3000`, `11115` 충돌)
- 전환 시에는 `.\switch-mode.ps1` 사용 권장

---

## 4) 도커 없이 실행 가능?

네, 가능합니다.

다만 백엔드는 DB(MySQL)가 필요합니다.

- 방법 A (권장): Docker로 MySQL만 실행
  - `docker compose -f docker-compose.local.yml up -d mysql`
  - 그 다음 백엔드/프론트는 IDE/터미널에서 로컬 실행

- 방법 B: PC에 MySQL을 직접 설치해서 사용
  - 이 경우 `application-local.yml`의 DB 접속 정보와 맞춰야 합니다.

현재 기본 로컬 프로필(`application-local.yml`)은
- host: `localhost`
- port: `3307`
- db: `familycal`
- user: `familycal`
- password: `1234`
기준입니다.
