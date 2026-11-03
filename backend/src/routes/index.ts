import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import notificationRoutes from "./notification.routes";
import announcementRoutes from "./announcement.routes";
import reportRoutes from "./report.routes";
import attendanceAlertRoutes from "./attendanceAlert.routes";
import { applicantRoutes, interviewRoutes, onboardingRoutes, probationRoutes, vacancyRoutes } from "./recruitment.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", time: new Date().toISOString() } });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);
router.use("/announcements", announcementRoutes);
router.use("/reports", reportRoutes);
router.use("/attendance-alerts", attendanceAlertRoutes);
router.use("/vacancies", vacancyRoutes);
router.use("/applicants", applicantRoutes);
router.use("/interviews", interviewRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/probation", probationRoutes);

// Other interns: add your route files here, for example
// router.use("/employees", employeeRoutes);   (Backend 1)
// router.use("/attendance", attendanceRoutes); (Backend 2)
// router.use("/leaves", leaveRoutes);          (Backend 2)

export default router;
