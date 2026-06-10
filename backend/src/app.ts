import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_request, response) => {
    response.json({
      name: "Speaklio API",
      status: "ok",
    });
  });

  app.use("/health", healthRouter);
  app.use("/me", meRouter);

  app.use((_request, response) => {
    response.status(404).json({
      error: "Not found",
    });
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error(error);
    response.status(500).json({
      error: "Internal server error",
    });
  });

  return app;
}
