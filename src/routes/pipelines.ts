import { Router } from "express";
import { ZodError, z } from "zod";
import { requireApiKey } from "../middleware/auth.js";
import {
  createPipeline,
  deletePipeline,
  getPipeline,
  listPipelines,
  updatePipeline,
} from "../services/pipeline-service.js";
import { listJobsByPipeline } from "../services/job-service.js";

const router = Router();

const actionTypeEnum = z.enum([
  "uppercase_text",
  "reverse_text",
  "add_metadata",
  "append_suffix",
]);

const pipelineSchema = z.object({
  name: z.string().min(1),
  actionType: actionTypeEnum,
  actionConfig: z.record(z.string(), z.any()).optional().default({}),
  webhookSecret: z.string().min(1).nullable().optional(),
  subscribers: z
    .array(
      z.object({
        targetUrl: z.string().url(),
      })
    )
    .default([]),
});

const updatePipelineSchema = z.object({
  name: z.string().min(1).optional(),
  actionType: actionTypeEnum.optional(),
  actionConfig: z.record(z.string(), z.any()).optional(),
  webhookSecret: z.string().min(1).nullable().optional(),
  subscribers: z
    .array(
      z.object({
        targetUrl: z.string().url(),
      })
    )
    .optional(),
});

router.use(requireApiKey);

router.post("/", async (req, res) => {
  try {
    const input = pipelineSchema.parse(req.body);
    const pipeline = await createPipeline(input);
    res.status(201).json(pipeline);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid request body",
        details: error.flatten(),
      });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Failed to create pipeline" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const pipelines = await listPipelines();
    res.json(pipelines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch pipelines" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pipeline = await getPipeline(req.params.id);

    if (!pipeline) {
      res.status(404).json({ error: "Pipeline not found" });
      return;
    }

    res.json(pipeline);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});

router.get("/:id/jobs", async (req, res) => {
  try {
    const jobs = await listJobsByPipeline(req.params.id);
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch pipeline jobs" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const input = updatePipelineSchema.parse(req.body);
    const pipeline = await updatePipeline(req.params.id, input);

    if (!pipeline) {
      res.status(404).json({ error: "Pipeline not found" });
      return;
    }

    res.json(pipeline);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid request body",
        details: error.flatten(),
      });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Failed to update pipeline" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deletePipeline(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: "Pipeline not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete pipeline" });
  }
});

export default router;