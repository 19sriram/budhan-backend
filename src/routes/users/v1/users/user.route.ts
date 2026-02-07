import { Router } from "express";
import { createUserController, getUserController } from "./user.controller.js";

const router = Router();

router.get("/:id", getUserController);
router.post("/", createUserController);
export default router;
