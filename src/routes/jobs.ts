import { Router } from "express";
import { requireApiKey } from "../middleware/auth.js";
import {
  getJob,
  getJobAttempts,
  listJobs,
  retryJob,
} from "../services/job-service.js";

const router = Router();

router.use(requireApiKey);

router.get("/", async (_req, res) => {
  try {
    const jobs = await listJobs();
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const job = await getJob(req.params.id);

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

router.get("/:id/attempts", async (req, res) => {
  try {
    const attempts = await getJobAttempts(req.params.id);
    res.json(attempts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch delivery attempts" });
  }
});

router.post("/:id/retry", async (req, res) => {
  try {
    const job = await retryJob(req.params.id);

    if (!job) {
      res.status(404).json({ error: "Failed job not found or cannot retry" });
      return;
    }

    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retry job" });
  }
});

export default router;