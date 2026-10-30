# HRMS Backend

Node.js + Express + TypeScript + Prisma + PostgreSQL.
This package contains the complete setup plus the Backend Intern 3 modules: dashboard, notifications, announcements, reports, recruitment and onboarding, seed data and documentation.

## Requirements
- Node.js 20 or newer
- PostgreSQL 14 or newer, with an empty database named `hrms_db`

## Setup
```bash
cd backend
npm install
cp .env.example .env        # then edit .env with your own values
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
Check: open http://localhost:5000/api/health. It should return `"status": "ok"`.

## Environment variables (names only; real values go in your own .env)
| Name | Purpose |
| --- | --- |
| PORT | Port the backend runs on |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret used to sign login tokens |
| FRONTEND_URL | Allowed frontend address (CORS) |
| JWT_EXPIRES_IN | Optional, token lifetime (default 8h) |
| ALERT_CHECK_TIME | Optional, HH:MM after which late/absent alerts are sent (default 10:00, empty = off) |
| ATTENDANCE_ALERTS_AUTO | Optional, set to false to stop the automatic 15-minute attendance alert run |

## Demo accounts (fictional, demo only)
Password for every account: `Demo@1234`

| Role | Email |
| --- | --- |
| Admin | admin@example.com |
| Manager | manager@example.com |
| Employee | employee1@example.com, employee2@example.com, employee3@example.com, employee4@example.com |

## Scripts
| Command | What it does |
| --- | --- |
| npm run dev | Start with auto-reload |
| npm run build / npm start | Compile and run |
| npx prisma db seed | Load demo data (safe to run twice) |
| npx prisma migrate reset | Wipe the database, re-apply migrations and re-seed |
| npx prisma studio | Browse the database |
| node scripts/smoke-test.js | Quick automatic endpoint check |

## Folder structure
```
src/routes        route files, one per module (registered in routes/index.ts)
src/controllers   request handling and input validation
src/services      business rules and database calls
src/middleware    authentication, role check, error handling
prisma/           schema.prisma, migrations, seed.ts
docs/             API_CONTRACT.md, TEST_CHECKLIST.md
```

## Merging with the other backend interns
- Backend 1 owns auth, employees and organization. `middleware/auth.ts` and `auth.service.ts` here are a working minimal version so the dashboard can be tested. If Backend 1's version is merged, keep theirs, as long as it sets `req.user = { id, email, role, employeeId }`.
- `schema.prisma` already contains every table from the plan. If Backend 1 or 2 changed a model, keep their changes and only add the models that are missing.
- Backend 2 can send notifications from the leave flow with `createNotification(userId, message, type)` or `notifyRoles(["Admin", "Manager"], message, type)` from `services/notification.service.ts`.
- Backend 2 can also call `notifyLateCheckIn(employeeId, checkIn)` from `services/attendanceAlert.service.ts` right after saving a Late check-in.
- Register new route files in `src/routes/index.ts`.

## Known limitations
- Report exports (Excel/PDF) are not part of this package (Backend 1 and 2 in the plan).
- Onboarding creates the employee record but not a login account.
- Dates use the server's local timezone.
