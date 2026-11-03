# HR Management System – Frontend (Intern 4)

**Scope (Frontend Intern 4 – Access, Dashboard & Recruitment UX):**
Module 4 Authentication & RBAC · Module 7 Dashboard & Reports · Module 8 Notifications · Module 10 Recruitment & Onboarding.

Built with React 18 + Vite + React Router. All data is **sample/mock data** in `src/data.js` – no backend yet.
Any policy-like values (roles, permissions, password rules, session timeout, lockout, payroll figures) are placeholders and **need stakeholder confirmation**.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Demo logins (from `src/data.js`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@hr.test | Admin@123 |
| HR Manager | manager.hr@hr.test | Pass@1234 |
| HR Officer | officer@hr.test | Pass@1234 |
| Manager | lead@hr.test | Pass@1234 |
| Employee | staff@hr.test | Pass@1234 |
Password-reset demo code: `123456`.

## What's included
- **Auth/RBAC:** login (error + lockout state), forgot/reset password, route guards by permission, role–permission matrix, user role assignment, idle-session logout.
- **Dashboard/Reports:** KPIs, weekly attendance, headcount, pending leave; headcount/attendance/payroll reports with filters; Export Excel (CSV) and PDF (browser print). Payroll report hidden without `reports.payroll`.
- **Notifications:** filters, read/unread, mark all read, HR announcements, email preferences, header badge.
- **Recruitment:** vacancies, applicant pipeline, interview scheduling, onboarding document checklist, probation tracking. View-only mode without `recruitment.manage`.

## Connecting the backend later
Replace the mock state in `src/store.jsx` and the imports from `src/data.js` with API calls. Move auth tokens to secure, server-controlled storage.
