#!/usr/bin/env bash
# Quick check of Backend 3 endpoints. Start the server first (npm run dev) and seed the database.
BASE="${BASE:-http://localhost:5000/api}"
PASS=0; FAIL=0

login() {
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"Demo@1234\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}
check() { # name expected_status method path [token] [body]
  local name="$1" expected="$2" method="$3" path="$4" token="$5" body="$6"
  local args=(-s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path" -H "Content-Type: application/json")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$body" ] && args+=(-d "$body")
  local code; code=$(curl "${args[@]}")
  if [ "$code" = "$expected" ]; then echo "PASS  $name ($code)"; PASS=$((PASS+1)); else echo "FAIL  $name (expected $expected, got $code)"; FAIL=$((FAIL+1)); fi
}

ADMIN=$(login admin@example.com); MANAGER=$(login manager@example.com); EMP=$(login employee1@example.com)
[ -z "$ADMIN" ] && { echo "Login failed. Is the server running and the database seeded?"; exit 1; }

check "health"                         200 GET  /health
check "login wrong password"           401 POST /auth/login "" '{"email":"admin@example.com","password":"wrong"}'
check "dashboard no token"             401 GET  /dashboard/summary
check "dashboard bad token"            401 GET  /dashboard/summary "abc"
check "dashboard admin"                200 GET  /dashboard/summary "$ADMIN"
check "dashboard manager"              200 GET  /dashboard/summary "$MANAGER"
check "dashboard employee"             200 GET  /dashboard/summary "$EMP"
check "notifications employee"         200 GET  /notifications "$EMP"
check "announcement by employee"       403 POST /announcements "$EMP" '{"title":"x","body":"y"}'
check "announcement empty title"       400 POST /announcements "$ADMIN" '{"title":"","body":"y"}'
check "announcement ok"                201 POST /announcements "$ADMIN" '{"title":"Smoke test","body":"Hello team"}'
check "report attendance employee"     403 GET  /reports/attendance "$EMP"
check "report attendance manager"      200 GET  /reports/attendance "$MANAGER"
check "report attendance admin"        200 GET  /reports/attendance "$ADMIN"
check "report from after to"           400 GET  "/reports/attendance?from=2026-10-20&to=2026-10-01" "$ADMIN"
check "report leave admin"             200 GET  /reports/leave "$ADMIN"
check "report departments"             200 GET  /reports/departments "$ADMIN"
check "vacancy by manager"             403 POST /vacancies "$MANAGER" '{"title":"x","departmentId":1,"description":"d"}'
check "vacancy list manager"           200 GET  /vacancies "$MANAGER"
check "vacancy create admin"           201 POST /vacancies "$ADMIN" '{"title":"QA Engineer","departmentId":1,"description":"Demo"}'
check "applicant bad stage"            400 PATCH /applicants/1/stage "$ADMIN" '{"stage":"Hired"}'
check "hire not-selected applicant"    409 POST /onboarding/hire "$ADMIN" '{"applicantId":1,"departmentId":1,"designationId":1,"branchId":1,"joiningDate":"2026-11-01"}'
check "bad JSON"                       400 POST /auth/login "" '{bad'
check "unknown route"                  404 GET  /nothing-here

echo; echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ]
