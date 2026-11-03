/**
 * HRMS demo seed data - FICTIONAL ONLY.
 * Run from backend/:  npx prisma db seed
 * Demo password for every user: Demo@1234  (demo only, also written in README)
 * Safe to run twice: if demo data exists it stops without changes.
 * Start fresh:  npx prisma migrate reset
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo@1234";

const today = new Date();
today.setHours(0, 0, 0, 0);

function dayOffset(days: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
}
function at(date: Date, hh: number, mm: number): Date {
  const d = new Date(date);
  d.setHours(hh, mm, 0, 0);
  return d;
}
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

async function main() {
  if (await prisma.user.findUnique({ where: { email: "admin@example.com" } })) {
    console.log("Demo data already exists. Nothing changed. (Use `npx prisma migrate reset` to start fresh.)");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Settings
  await prisma.attendanceSetting.create({ data: { id: 1 } });
  await prisma.payrollSetting.create({ data: { id: 1 } });

  // Roles
  const roleAdmin = await prisma.role.create({ data: { name: "Admin" } });
  const roleManager = await prisma.role.create({ data: { name: "Manager" } });
  const roleEmployee = await prisma.role.create({ data: { name: "Employee" } });

  // Organization
  const hr = await prisma.department.create({ data: { name: "HR" } });
  const it = await prisma.department.create({ data: { name: "IT" } });
  const finance = await prisma.department.create({ data: { name: "Finance" } });
  const hrManager = await prisma.designation.create({ data: { name: "HR Manager" } });
  const softwareEngineer = await prisma.designation.create({ data: { name: "Software Engineer" } });
  const accountant = await prisma.designation.create({ data: { name: "Accountant" } });
  const colombo = await prisma.branch.create({ data: { name: "Head Office", location: "Colombo" } });
  const kandy = await prisma.branch.create({ data: { name: "Kandy Branch", location: "Kandy" } });

  // Leave types
  const annual = await prisma.leaveType.create({ data: { name: "Annual", daysPerYear: 14 } });
  const sick = await prisma.leaveType.create({ data: { name: "Sick", daysPerYear: 7 } });
  const casual = await prisma.leaveType.create({ data: { name: "Casual", daysPerYear: 7 } });
  const leaveTypes = [annual, sick, casual];

  // Employees + users
  const joined = new Date(2025, 0, 15);
  const people = [
    { code: "EMP-001", name: "Ayesha Perera", email: "admin@example.com", dept: hr.id, desig: hrManager.id, branch: colombo.id, role: roleAdmin.id, status: "Active", salary: 150000 },
    { code: "EMP-002", name: "Nimal Fernando", email: "manager@example.com", dept: it.id, desig: softwareEngineer.id, branch: colombo.id, role: roleManager.id, status: "Active", salary: 180000 },
    { code: "EMP-003", name: "Kavindu Silva", email: "employee1@example.com", dept: it.id, desig: softwareEngineer.id, branch: colombo.id, role: roleEmployee.id, status: "Active", salary: 120000 },
    { code: "EMP-004", name: "Sanduni Jayasinghe", email: "employee2@example.com", dept: it.id, desig: softwareEngineer.id, branch: kandy.id, role: roleEmployee.id, status: "Probation", salary: 100000 },
    { code: "EMP-005", name: "Ruwan Bandara", email: "employee3@example.com", dept: finance.id, desig: accountant.id, branch: colombo.id, role: roleEmployee.id, status: "Active", salary: 110000 },
    { code: "EMP-006", name: "Tharushi Wickrama", email: "employee4@example.com", dept: finance.id, desig: accountant.id, branch: kandy.id, role: roleEmployee.id, status: "Active", salary: 105000 },
  ];

  const emp: Record<string, { id: number }> = {};
  const usr: Record<string, { id: number }> = {};
  for (const p of people) {
    emp[p.code] = await prisma.employee.create({
      data: {
        employeeCode: p.code,
        name: p.name,
        email: p.email,
        phone: "077123" + p.code.slice(-4),
        address: "Demo Address, Sri Lanka",
        joiningDate: joined,
        departmentId: p.dept,
        designationId: p.desig,
        branchId: p.branch,
        status: p.status,
      },
    });
    usr[p.code] = await prisma.user.create({
      data: { email: p.email, passwordHash, roleId: p.role, employeeId: emp[p.code].id, active: true },
    });
    await prisma.salaryStructure.create({ data: { employeeId: emp[p.code].id, basicSalary: p.salary } });
  }

  // Reporting managers: EMP-003, EMP-004 -> EMP-002 ; EMP-006 -> EMP-005
  for (const code of ["EMP-003", "EMP-004"]) {
    await prisma.employee.update({ where: { id: emp[code].id }, data: { managerId: emp["EMP-002"].id } });
  }
  await prisma.employee.update({ where: { id: emp["EMP-006"].id }, data: { managerId: emp["EMP-005"].id } });

  // Leave balances (current year)
  const year = today.getFullYear();
  for (const code of Object.keys(emp)) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: { employeeId: emp[code].id, leaveTypeId: lt.id, year, remainingDays: lt.daysPerYear },
      });
    }
  }

  // Attendance: last 7 days, weekends skipped.
  // Today: EMP-004 late, EMP-006 no record (absent), others checked in and still open.
  for (let back = 6; back >= 0; back--) {
    const date = dayOffset(-back);
    if (isWeekend(date)) continue;
    for (const code of Object.keys(emp)) {
      const isToday = back === 0;
      if (isToday && code === "EMP-006") continue;
      const late = (code === "EMP-004" && (isToday || back === 3)) || (code === "EMP-005" && back === 2);
      const checkIn = late ? at(date, 9, 5) : at(date, 8, 25);
      const open = isToday && code !== "EMP-001";
      const checkOut = open ? null : at(date, code === "EMP-003" && back === 1 ? 18 : 17, code === "EMP-003" && back === 1 ? 30 : 5);
      const worked = checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) : 0;
      await prisma.attendance.create({
        data: {
          employeeId: emp[code].id,
          date,
          checkIn,
          checkOut,
          status: late ? "Late" : "Present",
          workedMinutes: worked,
          overtimeMinutes: Math.max(0, worked - 480),
        },
      });
    }
  }

  // Leave requests: 3 Pending (to demo approval) + 1 Approved (balance already reduced)
  const pending = [
    { code: "EMP-003", type: annual.id, from: 5, to: 6, reason: "Family function" },
    { code: "EMP-004", type: sick.id, from: 3, to: 3, reason: "Medical appointment" },
    { code: "EMP-005", type: casual.id, from: 8, to: 9, reason: "Personal work" },
  ];
  for (const l of pending) {
    await prisma.leaveRequest.create({
      data: { employeeId: emp[l.code].id, leaveTypeId: l.type, startDate: dayOffset(l.from), endDate: dayOffset(l.to), reason: l.reason, status: "Pending" },
    });
  }
  await prisma.leaveRequest.create({
    data: {
      employeeId: emp["EMP-006"].id,
      leaveTypeId: annual.id,
      startDate: dayOffset(10),
      endDate: dayOffset(11),
      reason: "Holiday trip",
      status: "Approved",
      decidedById: usr["EMP-001"].id,
      decidedAt: new Date(),
    },
  });
  await prisma.leaveBalance.update({
    where: { employeeId_leaveTypeId_year: { employeeId: emp["EMP-006"].id, leaveTypeId: annual.id, year } },
    data: { remainingDays: 12 },
  });

  // Announcement + notifications
  await prisma.announcement.create({
    data: { title: "Welcome to the HRMS demo", body: "This is fictional demo data for the HRMS demonstration.", postedById: usr["EMP-001"].id },
  });
  await prisma.notification.create({
    data: { userId: usr["EMP-002"].id, message: "Kavindu Silva has requested Annual leave.", type: "LEAVE_REQUEST" },
  });
  await prisma.notification.create({
    data: { userId: usr["EMP-003"].id, message: "New announcement: Welcome to the HRMS demo", type: "ANNOUNCEMENT" },
  });

  // Goal
  await prisma.goal.create({
    data: { employeeId: emp["EMP-003"].id, title: "Complete API module documentation", dueDate: dayOffset(14), progress: 30, status: "In Progress" },
  });

  // Recruitment: one vacancy with an Interview-stage applicant and a Selected applicant (ready to onboard)
  const vacancy = await prisma.vacancy.create({
    data: { title: "Junior Software Engineer", departmentId: it.id, description: "Demo vacancy for the IT department.", status: "Open" },
  });
  const a1 = await prisma.applicant.create({
    data: { vacancyId: vacancy.id, name: "Dilshan Rajapaksa", email: "applicant1@example.com", phone: "0712345678", stage: "Interview" },
  });
  await prisma.applicant.create({
    data: { vacancyId: vacancy.id, name: "Nadeesha Gunawardena", email: "applicant2@example.com", phone: "0723456789", stage: "Selected" },
  });
  await prisma.interview.create({
    data: { applicantId: a1.id, scheduledAt: at(dayOffset(2), 10, 0), interviewer: "Nimal Fernando", notes: "Demo interview" },
  });

  console.log("Seed complete (fictional data only).");
  console.log("Logins: admin@example.com | manager@example.com | employee1..4@example.com");
  console.log(`Password for all: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
