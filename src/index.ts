import express, { type ErrorRequestHandler, type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import userRouter from "./routes/users/v1/users/user.route.js";
import loginRouter from "./routes/login/login.route.js";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { authMiddleware } from "./middleware/auth.js";
import { logger } from "./utils/logger.js";
import { generateOpenAPIDocument } from "./openapi/registry.js";

const app = express();
const PORT = 3000;

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err, path: req.path, method: req.method }, "Request error");

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues.map((i) => i.message).join(", "),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({ message: `DB error: ${err.code}` });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};

// Request logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: Request) =>
        req.url === "/health" ||
        req.url === "/openapi.json" ||
        req.url?.startsWith("/docs"),
    },
  })
);

app.use(helmet());
app.use(cors());
app.use(express.json());

// API Documentation
const openApiDocument = generateOpenAPIDocument();
app.get("/openapi.json", (_req, res) => res.json(openApiDocument));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Public routes
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/login", loginRouter);

// Protected routes
app.use("/api/v1/users", authMiddleware, userRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});
