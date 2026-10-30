// End-to-end flow checks for Backend 3 (hire flow, interviews, reports scope, alerts, notification privacy).
// Start the server first (npm run dev), then:  node scripts/flow-test.js
// Works best on freshly seeded data:  npx prisma migrate reset
const BASE = process.env.BASE || "http://localhost:5000/api";
let pass = 0;
let fail = 0;
let skipped = 0;

async function call(method, path, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, data: json && json.data, message: json && json.message };
}
function report(name, ok, detail = "") {
  if (ok) { console.log(`PASS  ${name}`); pass++; } else { console.log(`FAIL  ${name} ${detail}`); fail++; }
}
async function expect(name, expectedStatus, method, path, token, body, extra) {
  const r = await call(method, path, token, body);
  const ok = r.status === expectedStatus && (!extra || extra(r.data));
  report(name, ok, ok ? "" : `(status ${r.status}${r.message ? ", " + r.message : ""})`);
  return r;
}
async function login(email) {
  const r = await call("POST", "/auth/login", null, { email, password: "Demo@1234" });
  return r.data && r.data.token;
}

(async () => {
  let admin, manager, emp;
  try {
    admin = await login("admin@example.com");
    manager = await login("manager@example.com");
    emp = await login("employee1@example.com");
  } catch { console.log("Cannot reach the server. Is `npm run dev` running?"); process.exit(1); }
  if (!admin) { console.log("Login failed. Did you run `npx prisma db seed`?"); process.exit(1); }

  console.log("--- Hire flow ---");
  const before = (await call("GET", "/dashboard/summary", admin)).data.activeEmployees;
  const deptBefore = (await call("GET", "/reports/departments", admin)).data;
  const itBefore = (deptBefore.byDepartment.find((d) => d.name === "IT") || { employees: 0 }).employees;

  const selected = (await call("GET", "/applicants?stage=Selected", admin)).data || [];
  const candidate = selected.find((a) => a.email === "applicant2@example.com");
  const hireBody = candidate && { applicantId: candidate.id, departmentId: 2, designationId: 2, branchId: 1, joiningDate: "2026-11-02" };
  const firstTry = candidate ? await call("POST", "/onboarding/hire", admin, hireBody) : null;

  if (!candidate || (firstTry.status === 409 && /already exists/i.test(firstTry.message || ""))) {
    console.log("SKIP  applicant2 was already hired in an earlier run. Run `npx prisma migrate reset` (then npm run dev) to test the hire flow again.");
    skipped++;
  } else {
    const d = firstTry.data;
    report("hire selected applicant",
      firstTry.status === 201 && d.employee.status === "Probation" && /^EMP-\d{3}$/.test(d.employee.employeeCode) && d.tasks.length === 5 && d.probation.status === "In Probation",
      `(status ${firstTry.status}${firstTry.message ? ", " + firstTry.message : ""})`);
    await expect("hire same applicant again is blocked", 409, "POST", "/onboarding/hire", admin, hireBody);
    if (d) {
      const empId = d.employee.id;
      const tasks = await expect("onboarding checklist has 5 tasks", 200, "GET", `/onboarding?employeeId=${empId}`, admin, null, (x) => x.length === 5);
      if (tasks.data && tasks.data[0]) {
        await expect("mark task done", 200, "PATCH", `/onboarding/${tasks.data[0].id}`, admin, { done: true, documentName: "nic-copy.pdf" }, (x) => x.done === true);
      }
      await expect("probation end before start is rejected", 400, "POST", "/probation", admin,
        { employeeId: empId, startDate: "2026-11-10", endDate: "2026-11-01" });
      await expect("probation list for employee", 200, "GET", `/probation?employeeId=${empId}`, admin, null, (x) => x.length >= 1);
    }
    const after = (await call("GET", "/dashboard/summary", admin)).data.activeEmployees;
    report("dashboard active employees +1 after hire", after === before + 1, `(before ${before}, after ${after})`);
    const deptAfter = (await call("GET", "/reports/departments", admin)).data;
    const itAfter = (deptAfter.byDepartment.find((x) => x.name === "IT") || { employees: 0 }).employees;
    report("department report IT +1 after hire", itAfter === itBefore + 1, `(before ${itBefore}, after ${itAfter})`);
  }

  console.log("--- Vacancy, applicant, interview rules ---");
  const stamp = Date.now();
  const vac = await expect("create vacancy", 201, "POST", "/vacancies", admin, { title: `Flow Test ${stamp}`, departmentId: 2, description: "Flow test" });
  if (vac.data) {
    const app = await expect("add applicant", 201, "POST", "/applicants", admin, { vacancyId: vac.data.id, name: "Flow Tester", email: `flow${stamp}@example.com` });
    if (app.data) {
      await expect("schedule interview", 201, "POST", "/interviews", admin, { applicantId: app.data.id, scheduledAt: "2026-11-05T10:00:00.000Z", interviewer: "Nimal Fernando" });
      await expect("applicant moved to Interview stage", 200, "GET", `/applicants?vacancyId=${vac.data.id}`, admin, null, (d) => d[0].stage === "Interview");
      await expect("reject applicant", 200, "PATCH", `/applicants/${app.data.id}/stage`, admin, { stage: "Rejected" });
      await expect("interview for rejected applicant is blocked", 409, "POST", "/interviews", admin, { applicantId: app.data.id, scheduledAt: "2026-11-06T10:00:00.000Z", interviewer: "Nimal Fernando" });
    }
    await expect("close vacancy", 200, "PATCH", `/vacancies/${vac.data.id}`, admin, { status: "Closed" });
    await expect("applicant for closed vacancy is blocked", 409, "POST", "/applicants", admin, { vacancyId: vac.data.id, name: "Late Applicant", email: `late${stamp}@example.com` });
  }

  console.log("--- Reports scope ---");
  await expect("manager attendance report shows team only (2 people)", 200, "GET", "/reports/attendance", manager, null, (d) => d.rows.length === 2);
  await expect("manager department report is team only", 200, "GET", "/reports/departments", manager, null, (d) => d.totalActiveEmployees === 2);
  await expect("manager cannot see someone outside the team", 200, "GET", "/reports/attendance?employeeId=1", manager, null, (d) => d.rows.length === 0);

  console.log("--- Alerts and notification privacy ---");
  await call("POST", "/attendance-alerts/run", admin);
  const mgrNotes = await expect("manager has a late alert", 200, "GET", "/notifications", manager, null,
    (d) => d.some((n) => n.type === "ATTENDANCE_ALERT" && n.message.includes("Late check-in")));
  if (mgrNotes.data && mgrNotes.data[0]) {
    await expect("employee cannot read manager's notification", 404, "PATCH", `/notifications/${mgrNotes.data[0].id}/read`, emp);
    await expect("manager can mark own notification read", 200, "PATCH", `/notifications/${mgrNotes.data[0].id}/read`, manager);
  }

  console.log("--- Dashboard views and notification lists ---");
  await expect("manager dashboard shows team only (2 people)", 200, "GET", "/dashboard/summary", manager, null,
    (d) => d.scope === "team" && d.activeEmployees === 2);
  await expect("employee dashboard is personal with 3 leave balances", 200, "GET", "/dashboard/summary", emp, null,
    (d) => d.scope === "personal" && d.leaveBalances.length === 3);
  const me = await call("GET", "/auth/me", emp);
  await expect("employee sees only own notifications", 200, "GET", "/notifications", emp, null,
    (d) => me.data && d.every((n) => n.userId === me.data.id));
  await expect("admin has both Late and Absent alerts", 200, "GET", "/notifications", admin, null,
    (d) => d.some((n) => n.message.startsWith("Late check-in")) && d.some((n) => n.message.startsWith("Absent:")));

  console.log(`\nPassed: ${pass}  Failed: ${fail}  Skipped: ${skipped}`);
  process.exit(fail === 0 ? 0 : 1);
})();
