import { Router } from "express";
import { loginController } from "./login.controller.js";

const router = Router();
router.post("/", loginController);
export default router;
