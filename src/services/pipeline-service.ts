import { randomUUID } from "crypto";
import {
  deletePipelineById,
  getAllPipelines,
  getPipelineById,
  insertPipeline,
  updatePipelineById,
} from "../repositories/pipeline-repo.js";
import {
  deleteSubscribersByPipelineId,
  getSubscribersByPipelineId,
  insertSubscribers,
} from "../repositories/subscriber-repo.js";
import { CreatePipelineInput, UpdatePipelineInput } from "../types/pipeline.js";

function mapPipeline(pipeline: any, subscribers: any[]) {
  return {
    id: pipeline.id,
    name: pipeline.name,
    sourceKey: pipeline.source_key,
    actionType: pipeline.action_type,
    actionConfig: pipeline.action_config,
    webhookSecret: pipeline.webhook_secret,
    subscribers: subscribers.map((subscriber) => ({
      id: subscriber.id,
      targetUrl: subscriber.target_url,
    })),
    createdAt: pipeline.created_at,
    updatedAt: pipeline.updated_at,
  };
}

export async function createPipeline(input: CreatePipelineInput) {
  const pipelineId = randomUUID();
  const sourceKey = randomUUID();

  const pipeline = await insertPipeline({
    id: pipelineId,
    name: input.name,
    sourceKey,
    actionType: input.actionType,
    actionConfig: input.actionConfig ?? {},
    webhookSecret: input.webhookSecret ?? null,
  });

  const subscribers = input.subscribers.map((subscriber) => ({
    id: randomUUID(),
    pipelineId,
    targetUrl: subscriber.targetUrl,
  }));

  if (subscribers.length > 0) {
    await insertSubscribers(subscribers);
  }

  const savedSubscribers = await getSubscribersByPipelineId(pipelineId);
  return mapPipeline(pipeline, savedSubscribers);
}

export async function listPipelines() {
  const pipelines = await getAllPipelines();
  const result = [];

  for (const pipeline of pipelines) {
    const subscribers = await getSubscribersByPipelineId(pipeline.id);
    result.push(mapPipeline(pipeline, subscribers));
  }

  return result;
}

export async function getPipeline(pipelineId: string) {
  const pipeline = await getPipelineById(pipelineId);

  if (!pipeline) {
    return null;
  }

  const subscribers = await getSubscribersByPipelineId(pipelineId);
  return mapPipeline(pipeline, subscribers);
}

export async function updatePipeline(
  pipelineId: string,
  input: UpdatePipelineInput,
) {
  const existing = await getPipelineById(pipelineId);

  if (!existing) {
    return null;
  }

  const updatedPipeline = await updatePipelineById(pipelineId, {
    name: input.name ?? existing.name,
    actionType: input.actionType ?? existing.action_type,
    actionConfig: input.actionConfig ?? existing.action_config,
    webhookSecret:
      input.webhookSecret === undefined
        ? existing.webhook_secret
        : input.webhookSecret,
  });

  if (!updatedPipeline) {
    return null;
  }

  if (input.subscribers) {
    await deleteSubscribersByPipelineId(pipelineId);

    const subscribers = input.subscribers.map((subscriber) => ({
      id: randomUUID(),
      pipelineId,
      targetUrl: subscriber.targetUrl,
    }));

    if (subscribers.length > 0) {
      await insertSubscribers(subscribers);
    }
  }

  const savedSubscribers = await getSubscribersByPipelineId(pipelineId);
  return mapPipeline(updatedPipeline, savedSubscribers);
}

export async function deletePipeline(pipelineId: string) {
  return deletePipelineById(pipelineId);
}
