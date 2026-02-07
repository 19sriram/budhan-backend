import { Router } from "express";
import { getUserController } from "./user.controller.js";

const router = Router();

router.get("/:id", getUserController);

export default router;
