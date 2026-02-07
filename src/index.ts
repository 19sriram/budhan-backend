import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import userRouter from "./users/user.route.js"; // ESM requires .js
import { ZodError } from "zod";

const app = express();
const PORT = 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/users", userRouter);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues.map((i) => i.message).join(", "),
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
