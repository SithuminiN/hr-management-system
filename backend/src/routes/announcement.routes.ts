import { Router } from "express";
import * as controller from "../controllers/announcement.controller";
import { ROLES } from "../config/roles";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", controller.list);
router.post("/", authorize(ROLES.ADMIN), controller.create);
export default router;
