import { Router } from "express";
import * as c from "../controllers/recruitment.controller";
import { ROLES } from "../config/roles";
import { authenticate, authorize } from "../middleware/auth";

const A = authorize(ROLES.ADMIN);
const AM = authorize(ROLES.ADMIN, ROLES.MANAGER);

export const vacancyRoutes = Router();
vacancyRoutes.use(authenticate);
vacancyRoutes.get("/", AM, c.listVacancies);
vacancyRoutes.post("/", A, c.createVacancy);
vacancyRoutes.patch("/:id", A, c.updateVacancy);

export const applicantRoutes = Router();
applicantRoutes.use(authenticate, A);
applicantRoutes.get("/", c.listApplicants);
applicantRoutes.post("/", c.createApplicant);
applicantRoutes.patch("/:id/stage", c.setStage);

export const interviewRoutes = Router();
interviewRoutes.use(authenticate, A);
interviewRoutes.get("/", c.listInterviews);
interviewRoutes.post("/", c.createInterview);

export const onboardingRoutes = Router();
onboardingRoutes.use(authenticate, A);
onboardingRoutes.get("/", c.listOnboarding);
onboardingRoutes.post("/hire", c.hire);
onboardingRoutes.patch("/:id", c.updateOnboarding);

export const probationRoutes = Router();
probationRoutes.use(authenticate, A);
probationRoutes.get("/", c.listProbation);
probationRoutes.post("/", c.createProbation);
