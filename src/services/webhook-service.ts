import { randomUUID } from "crypto";
import { insertJob } from "../repositories/job-repo.js";
import { getPipelineBySourceKey } from "../repositories/pipeline-repo.js";
import { verifyHmacSignature } from "../utils/signature.js";

export async function ingestWebhook(params: {
  sourceKey: string;
  payload: Record<string, unknown>;
  rawBody: string;
  signature?: string;
}) {
  const pipeline = await getPipelineBySourceKey(params.sourceKey);

  if (!pipeline) {
    return { type: "not_found" as const };
  }

  if (pipeline.webhook_secret) {
    if (!params.signature) {
      return { type: "invalid_signature" as const };
    }

    const isValid = verifyHmacSignature({
      secret: pipeline.webhook_secret,
      rawBody: params.rawBody,
      signature: params.signature,
    });

    if (!isValid) {
      return { type: "invalid_signature" as const };
    }
  }

  const job = await insertJob({
    id: randomUUID(),
    pipelineId: pipeline.id,
    status: "pending",
    inputPayload: params.payload,
  });

  return {
    type: "accepted" as const,
    message: "Webhook accepted",
    jobId: job.id,
    pipelineId: pipeline.id,
    status: job.status,
    createdAt: job.created_at,
  };
}