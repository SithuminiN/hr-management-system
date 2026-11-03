import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { parseDateInput } from "../utils/dates";
import { idParam } from "../utils/params";
import { ok } from "../utils/response";
import * as recruitment from "../services/recruitment.service";

const id = z.coerce.number().int().positive();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD");

// ---- Vacancies ----
const vacancyCreate = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  departmentId: id,
  description: z.string().trim().min(1, "Description is required").max(5000),
});
const vacancyUpdate = vacancyCreate.partial().extend({ status: z.enum(["Open", "Closed"]).optional() });

export const listVacancies = asyncHandler(async (req, res) => {
  const status = z.enum(["Open", "Closed"]).optional().parse(req.query.status);
  ok(res, await recruitment.listVacancies(status));
});
export const createVacancy = asyncHandler(async (req, res) => {
  ok(res, await recruitment.createVacancy(vacancyCreate.parse(req.body)), 201);
});
export const updateVacancy = asyncHandler(async (req, res) => {
  ok(res, await recruitment.updateVacancy(idParam(req), vacancyUpdate.parse(req.body)));
});

// ---- Applicants ----
const applicantCreate = z.object({
  vacancyId: id,
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  phone: z.string().trim().max(20).optional(),
});

export const listApplicants = asyncHandler(async (req, res) => {
  const vacancyId = id.optional().parse(req.query.vacancyId);
  const stage = z.enum(recruitment.STAGES).optional().parse(req.query.stage);
  ok(res, await recruitment.listApplicants({ vacancyId, stage }));
});
export const createApplicant = asyncHandler(async (req, res) => {
  ok(res, await recruitment.createApplicant(applicantCreate.parse(req.body)), 201);
});
export const setStage = asyncHandler(async (req, res) => {
  const { stage } = z.object({ stage: z.enum(recruitment.STAGES) }).parse(req.body);
  ok(res, await recruitment.setApplicantStage(idParam(req), stage));
});

// ---- Interviews ----
const interviewCreate = z.object({
  applicantId: id,
  scheduledAt: z.coerce.date(),
  interviewer: z.string().trim().min(1, "Interviewer is required").max(100),
  notes: z.string().trim().max(2000).optional(),
});

export const listInterviews = asyncHandler(async (req, res) => {
  ok(res, await recruitment.listInterviews(id.optional().parse(req.query.applicantId)));
});
export const createInterview = asyncHandler(async (req, res) => {
  ok(res, await recruitment.createInterview(interviewCreate.parse(req.body)), 201);
});

// ---- Onboarding ----
const hireSchema = z.object({
  applicantId: id,
  departmentId: id,
  designationId: id,
  branchId: id,
  joiningDate: dateStr,
});
const taskUpdate = z.object({ done: z.boolean().optional(), documentName: z.string().trim().max(200).optional() });

export const hire = asyncHandler(async (req, res) => {
  const b = hireSchema.parse(req.body);
  ok(
    res,
    await recruitment.hireApplicant(b.applicantId, {
      departmentId: b.departmentId,
      designationId: b.designationId,
      branchId: b.branchId,
      joiningDate: parseDateInput(b.joiningDate, "joiningDate"),
    }),
    201
  );
});
export const listOnboarding = asyncHandler(async (req, res) => {
  ok(res, await recruitment.listOnboardingTasks(id.optional().parse(req.query.employeeId)));
});
export const updateOnboarding = asyncHandler(async (req, res) => {
  ok(res, await recruitment.updateOnboardingTask(idParam(req), taskUpdate.parse(req.body)));
});

// ---- Probation ----
const probationCreate = z.object({
  employeeId: id,
  startDate: dateStr,
  endDate: dateStr,
  status: z.enum(["In Probation", "Completed", "Extended"]).default("In Probation"),
});

export const listProbation = asyncHandler(async (req, res) => {
  ok(res, await recruitment.listProbation(id.optional().parse(req.query.employeeId)));
});
export const createProbation = asyncHandler(async (req, res) => {
  const b = probationCreate.parse(req.body);
  ok(
    res,
    await recruitment.createProbation({
      employeeId: b.employeeId,
      startDate: parseDateInput(b.startDate, "startDate"),
      endDate: parseDateInput(b.endDate, "endDate"),
      status: b.status,
    }),
    201
  );
});
