# Test Checklist - Backend Intern 3 modules

Run `npm run dev`, then `node scripts/smoke-test.js` for the quick automatic check.
Mark each row after testing. Demo password for all users: `Demo@1234`.

| # | Area | Test | Expected | Result |
| --- | --- | --- | --- | --- |
| 1 | Health | GET /api/health | 200, status ok | PASS |
| 2 | Auth | Login admin@example.com with correct password | 200 and token | PASS |
| 3 | Auth | Login with wrong password | 401, safe message | PASS |
| 4 | Auth | Call /dashboard/summary with no token | 401 | PASS |
| 5 | Auth | Call /dashboard/summary with a bad token | 401 | PASS |
| 6 | Dashboard | Admin summary | activeEmployees 6, numbers match seed | PASS |
| 7 | Dashboard | Manager summary | Team numbers only (2 employees) | PASS |
| 8 | Dashboard | Employee summary | Personal summary with leave balances | PASS |
| 9 | Dashboard | Add a leave request, call summary again | pendingLeaveRequests changes | Pending: needs Backend 2 leave API |
| 10 | Notifications | GET /notifications as employee1 | Own notifications only | PASS |
| 11 | Notifications | PATCH /notifications/:id/read on someone else's id | 404 | PASS |
| 12 | Announcements | Employee POSTs an announcement | 403 | PASS |
| 13 | Announcements | Admin POSTs with empty title | 400 with field error | PASS |
| 14 | Announcements | Admin posts a valid one | 201, others get a notification | PARTIAL |
| 15 | Reports | Employee calls /reports/attendance | 403 | PASS |
| 16 | Reports | Manager calls /reports/attendance | Only team rows | PASS |
| 17 | Reports | Admin /reports/attendance?from=2026-10-01&to=2026-10-26 | totals and rows | PARTIAL |
| 18 | Reports | from after to | 400 | PASS |
| 19 | Reports | /reports/departments | HR 1, IT 3, Finance 2 | PARTIAL |
| 20 | Recruitment | Manager POST /vacancies | 403 | PASS |
| 21 | Recruitment | Admin creates vacancy | 201 | PASS |
| 22 | Recruitment | Add applicant to a closed vacancy | 409 | PASS |
| 23 | Recruitment | Stage with invalid value | 400 | PASS |
| 24 | Recruitment | Schedule interview for Rejected applicant | 409 | PASS |
| 25 | Recruitment | Hire an applicant not in Selected stage | 409 | PASS |
| 26 | Recruitment | Hire Selected applicant (applicant2) | 201, EMP-007, probation + 5 tasks | PASS |
| 27 | Recruitment | Hire the same applicant again | 409 | PASS |
| 28 | Onboarding | PATCH task done=true | 200 | PASS |
| 29 | Probation | POST with end date before start date | 400 | PASS |
| 30 | General | Wrong JSON body | 400, no crash | PASS |
| 31 | General | Unknown URL | 404 | PASS |
| 32 | General | No secrets or .env committed | Confirmed | PASS |
| 33 | Alerts | Employee calls POST /attendance-alerts/run | 403 | PASS |
| 34 | Alerts | Admin runs it (first time today, weekday) | 200, late 1, absent 1, created 4 | PARTIAL |
| 35 | Alerts | Admin runs it again | 200, created 0 (no duplicates) | PASS |
| 36 | Alerts | Login as manager, GET /notifications | Late alert for Sanduni Jayasinghe | PASS |
| 37 | Alerts | Login as admin, GET /notifications | Late and Absent alerts | PASS |

## Test run record

| Item | Result |
| --- | --- |
| Date | 2026-10-30 |
| Environment | Local, Windows, PostgreSQL 18, demo seed data |
| scripts/smoke-test.js | 28 passed, 0 failed |
| scripts/flow-test.js | 26 passed, 0 failed (fresh seed data) |
| Tester | (M.M.Umar Munzif) |

Result key: PASS = verified by the scripts above. PARTIAL = status code verified but the exact numbers or side effect were not checked. `[ ]` = not tested yet.

Not yet tested:
- 9: needs the leave request API from Backend 2.

Test 32: confirmed on 2026-10-30. The pushed commit (53 files) contains `.env.example` but no `.env` and no `node_modules`.

Partial (status verified, exact numbers or side effects not checked): 14, 17, 19, 34.
