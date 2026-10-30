// Quick check of Backend 3 endpoints (works on Windows, Mac and Linux).
// 1) Start the server in one terminal:  npm run dev
// 2) Run this in another terminal:      node scripts/smoke-test.js
const BASE = process.env.BASE || "http://localhost:5000/api";
let pass = 0;
let fail = 0;

async function call(method, path, token, body, rawBody) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: rawBody !== undefined ? rawBody : body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

async function login(email) {
  const r = await call("POST", "/auth/login", null, { email, password: "Demo@1234" });
  return r.json && r.json.data ? r.json.data.token : null;
}

async function check(name, expected, method, path, token, body, rawBody) {
  const r = await call(method, path, token, body, rawBody);
  if (r.status === expected) { console.log(`PASS  ${name} (${r.status})`); pass++; }
  else { console.log(`FAIL  ${name} (expected ${expected}, got ${r.status}) ${r.json ? r.json.message : ""}`); fail++; }
  return r;
}

(async () => {
  let admin, manager, emp;
  try {
    admin = await login("admin@example.com");
    manager = await login("manager@example.com");
    emp = await login("employee1@example.com");
  } catch (e) {
    console.log("Cannot reach the server. Is `npm run dev` running in another terminal?");
    process.exit(1);
  }
  if (!admin) { console.log("Login failed. Did you run `npx prisma db seed`?"); process.exit(1); }

  await check("health", 200, "GET", "/health");
  await check("login wrong password", 401, "POST", "/auth/login", null, { email: "admin@example.com", password: "wrong" });
  await check("dashboard no token", 401, "GET", "/dashboard/summary");
  await check("dashboard bad token", 401, "GET", "/dashboard/summary", "abc");
  const d = await check("dashboard admin", 200, "GET", "/dashboard/summary", admin);
  await check("dashboard manager", 200, "GET", "/dashboard/summary", manager);
  await check("dashboard employee", 200, "GET", "/dashboard/summary", emp);
  await check("notifications employee", 200, "GET", "/notifications", emp);
  await check("announcement by employee", 403, "POST", "/announcements", emp, { title: "x", body: "y" });
  await check("announcement empty title", 400, "POST", "/announcements", admin, { title: "", body: "y" });
  await check("announcement ok", 201, "POST", "/announcements", admin, { title: "Smoke test", body: "Hello team" });
  await check("report attendance employee", 403, "GET", "/reports/attendance", emp);
  await check("report attendance manager", 200, "GET", "/reports/attendance", manager);
  await check("report attendance admin", 200, "GET", "/reports/attendance", admin);
  await check("report from after to", 400, "GET", "/reports/attendance?from=2026-10-20&to=2026-10-01", admin);
  await check("report leave admin", 200, "GET", "/reports/leave", admin);
  await check("report departments", 200, "GET", "/reports/departments", admin);
  await check("vacancy create by manager", 403, "POST", "/vacancies", manager, { title: "x", departmentId: 1, description: "d" });
  await check("vacancy list manager", 200, "GET", "/vacancies", manager);
  await check("vacancy create admin", 201, "POST", "/vacancies", admin, { title: "QA Engineer", departmentId: 1, description: "Demo" });
  await check("applicant bad stage", 400, "PATCH", "/applicants/1/stage", admin, { stage: "Hired" });
  await check("hire non-selected applicant", 409, "POST", "/onboarding/hire", admin, { applicantId: 1, departmentId: 1, designationId: 1, branchId: 1, joiningDate: "2026-11-01" });
  await check("bad JSON", 400, "POST", "/auth/login", null, undefined, "{bad");
  await check("unknown route", 404, "GET", "/nothing-here");

  await check("alerts run by employee", 403, "POST", "/attendance-alerts/run", emp);
  const a1 = await check("alerts run (admin)", 200, "POST", "/attendance-alerts/run", admin);
  const a2 = await check("alerts run again", 200, "POST", "/attendance-alerts/run", admin);
  if (a1.json && a1.json.data) console.log("      first run:", JSON.stringify(a1.json.data));
  if (a2.json && a2.json.data && a2.json.data.created === 0) { console.log("PASS  alerts not duplicated"); pass++; }
  else { console.log("FAIL  alerts duplicated on second run"); fail++; }

  console.log("\nDashboard (admin) numbers:", JSON.stringify(d.json && d.json.data ? {
    activeEmployees: d.json.data.activeEmployees,
    checkedInToday: d.json.data.checkedInToday,
    lateToday: d.json.data.lateToday,
    absentToday: d.json.data.absentToday,
    pendingLeaveRequests: d.json.data.pendingLeaveRequests,
  } : null));
  console.log(`\nPassed: ${pass}  Failed: ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
