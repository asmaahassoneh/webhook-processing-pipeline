import express from "express";
import jobsRouter from "./routes/jobs.js";
import metricsRouter from "./routes/metrics.js";
import pipelinesRouter from "./routes/pipelines.js";
import webhooksRouter from "./routes/webhooks.js";

export const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: string }).rawBody = buf.toString();
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/pipelines", pipelinesRouter);
app.use("/webhooks", webhooksRouter);
app.use("/jobs", jobsRouter);
app.use("/metrics", metricsRouter);