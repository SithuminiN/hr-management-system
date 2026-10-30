import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import { addDays } from "../utils/dates";

export const STAGES = ["Applied", "Interview", "Selected", "Rejected"] as const;
export const DEFAULT_ONBOARDING_TASKS = [
  "Collect copy of national ID",
  "Collect signed employment contract",
  "Collect bank account details",
  "Collect passport-size photo",
  "Create company email and system access",
];
const PROBATION_DAYS = 90; // demo rule, confirm with supervisor

// ---------------- Vacancies ----------------
export function listVacancies(status?: string) {
  return prisma.vacancy.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { department: { select: { id: true, name: true } }, _count: { select: { applicants: true } } },
  });
}

export function createVacancy(data: { title: string; departmentId: number; description: string }) {
  return prisma.vacancy.create({ data: { ...data, status: "Open" } });
}

export async function updateVacancy(
  id: number,
  data: { title?: string; departmentId?: number; description?: string; status?: "Open" | "Closed" }
) {
  const found = await prisma.vacancy.findUnique({ where: { id } });
  if (!found) throw new HttpError(404, "Vacancy not found");
  return prisma.vacancy.update({ where: { id }, data });
}

// ---------------- Applicants ----------------
export function listApplicants(filter: { vacancyId?: number; stage?: string }) {
  return prisma.applicant.findMany({
    where: { ...(filter.vacancyId ? { vacancyId: filter.vacancyId } : {}), ...(filter.stage ? { stage: filter.stage } : {}) },
    orderBy: { createdAt: "desc" },
    include: { vacancy: { select: { id: true, title: true } }, interviews: { orderBy: { scheduledAt: "asc" } } },
  });
}

export async function createApplicant(data: { vacancyId: number; name: string; email: string; phone?: string }) {
  const vacancy = await prisma.vacancy.findUnique({ where: { id: data.vacancyId } });
  if (!vacancy) throw new HttpError(404, "Vacancy not found");
  if (vacancy.status === "Closed") throw new HttpError(409, "This vacancy is closed");
  return prisma.applicant.create({ data: { ...data, stage: "Applied" } });
}

export async function setApplicantStage(id: number, stage: (typeof STAGES)[number]) {
  const found = await prisma.applicant.findUnique({ where: { id } });
  if (!found) throw new HttpError(404, "Applicant not found");
  return prisma.applicant.update({ where: { id }, data: { stage } });
}

// ---------------- Interviews ----------------
export function listInterviews(applicantId?: number) {
  return prisma.interview.findMany({
    where: applicantId ? { applicantId } : {},
    orderBy: { scheduledAt: "asc" },
    include: { applicant: { select: { id: true, name: true, stage: true } } },
  });
}

export async function createInterview(data: { applicantId: number; scheduledAt: Date; interviewer: string; notes?: string }) {
  const applicant = await prisma.applicant.findUnique({ where: { id: data.applicantId } });
  if (!applicant) throw new HttpError(404, "Applicant not found");
  if (applicant.stage === "Rejected") throw new HttpError(409, "Cannot schedule an interview for a rejected applicant");

  const interview = await prisma.interview.create({ data });
  if (applicant.stage === "Applied") {
    await prisma.applicant.update({ where: { id: applicant.id }, data: { stage: "Interview" } });
  }
  return interview;
}

// ---------------- Onboarding (REC-5, REC-6) ----------------
export async function hireApplicant(
  applicantId: number,
  data: { departmentId: number; designationId: number; branchId: number; joiningDate: Date }
) {
  const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) throw new HttpError(404, "Applicant not found");
  if (applicant.stage !== "Selected") throw new HttpError(409, "Only a Selected applicant can be onboarded");

  const existing = await prisma.employee.findUnique({ where: { email: applicant.email } });
  if (existing) throw new HttpError(409, "An employee with this email already exists");

  return prisma.$transaction(async (tx) => {
    const last = await tx.employee.findFirst({ orderBy: { employeeCode: "desc" }, select: { employeeCode: true } });
    const next = last ? parseInt(last.employeeCode.slice(4), 10) + 1 : 1;
    const employeeCode = `EMP-${String(next).padStart(3, "0")}`;

    const employee = await tx.employee.create({
      data: {
        employeeCode,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        joiningDate: data.joiningDate,
        departmentId: data.departmentId,
        designationId: data.designationId,
        branchId: data.branchId,
        status: "Probation",
      },
    });
    const probation = await tx.probationRecord.create({
      data: {
        employeeId: employee.id,
        startDate: data.joiningDate,
        endDate: addDays(data.joiningDate, PROBATION_DAYS),
        status: "In Probation",
      },
    });
    await tx.onboardingTask.createMany({
      data: DEFAULT_ONBOARDING_TASKS.map((title) => ({ employeeId: employee.id, title })),
    });
    const tasks = await tx.onboardingTask.findMany({ where: { employeeId: employee.id } });
    return { employee, probation, tasks };
  });
}

export function listOnboardingTasks(employeeId?: number) {
  return prisma.onboardingTask.findMany({
    where: employeeId ? { employeeId } : {},
    orderBy: { id: "asc" },
    include: { employee: { select: { name: true, employeeCode: true } } },
  });
}

export async function updateOnboardingTask(id: number, data: { done?: boolean; documentName?: string }) {
  const found = await prisma.onboardingTask.findUnique({ where: { id } });
  if (!found) throw new HttpError(404, "Onboarding task not found");
  return prisma.onboardingTask.update({ where: { id }, data });
}

// ---------------- Probation (REC-7) ----------------
export function listProbation(employeeId?: number) {
  return prisma.probationRecord.findMany({
    where: employeeId ? { employeeId } : {},
    orderBy: { startDate: "desc" },
    include: { employee: { select: { name: true, employeeCode: true } } },
  });
}

export async function createProbation(data: { employeeId: number; startDate: Date; endDate: Date; status: string }) {
  if (data.endDate <= data.startDate) {
    throw new HttpError(400, "Invalid dates", [{ field: "endDate", message: "End date must be after start date" }]);
  }
  const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
  if (!employee) throw new HttpError(404, "Employee not found");
  return prisma.probationRecord.create({ data });
}
