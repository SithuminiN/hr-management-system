import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.post("/login", controller.login);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);
export default router;
