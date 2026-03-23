import { Router } from "express";
import { ingestWebhook } from "../services/webhook-service.js";

const router = Router();

router.post("/:sourceKey", async (req, res) => {
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};

    const rawBody =
      (req as typeof req & { rawBody?: string }).rawBody ??
      JSON.stringify(payload);

    const signature = req.header("x-webhook-signature") ?? undefined;

    const result = await ingestWebhook({
      sourceKey: req.params.sourceKey,
      payload,
      rawBody,
      signature,
    });

    if (result.type === "not_found") {
      res.status(404).json({ error: "Pipeline not found" });
      return;
    }

    if (result.type === "invalid_signature") {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    res.status(202).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to ingest webhook" });
  }
});

export default router;
