import { Router } from "express";
import * as controller from "../controllers/attendanceAlert.controller";
import { ROLES } from "../config/roles";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.post("/run", authenticate, authorize(ROLES.ADMIN), controller.run);
export default router;
