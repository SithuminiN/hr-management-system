import { Router } from "express";
import * as controller from "../controllers/report.controller";
import { ROLES } from "../config/roles";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER));
router.get("/attendance", controller.attendance);
router.get("/leave", controller.leave);
router.get("/departments", controller.departments);
export default router;
