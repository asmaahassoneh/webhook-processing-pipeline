import { Router } from "express";
import { requireApiKey } from "../middleware/auth.js";
import { getMetrics } from "../services/job-service.js";

const router = Router();

router.get("/", requireApiKey, async (_req, res) => {
  try {
    const metrics = await getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

export default router;