import { getDeliveryAttemptsByJobId } from "../repositories/delivery-attempt-repo.js";
import {
  claimNextPendingJob,
  getAllJobs,
  getJobById,
  getJobMetrics,
  getJobsByPipelineId,
  markJobCompleted,
  markJobForRetry,
  requeueStaleProcessingJobs,
  retryJobById,
} from "../repositories/job-repo.js";
import { getPipelineById } from "../repositories/pipeline-repo.js";
import { getSubscribersByPipelineId } from "../repositories/subscriber-repo.js";
import { executeAction } from "./action-service.js";
import { deliverToSubscriber } from "./delivery-service.js";

function mapJob(job: any) {
  return {
    id: job.id,
    pipelineId: job.pipeline_id,
    status: job.status,
    inputPayload: job.input_payload,
    processedPayload: job.processed_payload,
    attemptsCount: job.attempts_count,
    maxAttempts: job.max_attempts,
    nextRunAt: job.next_run_at,
    lockedAt: job.locked_at,
    errorMessage: job.error_message,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    completedAt: job.completed_at,
    failedAt: job.failed_at,
  };
}

export async function listJobs() {
  const jobs = await getAllJobs();
  return jobs.map(mapJob);
}

export async function listJobsByPipeline(pipelineId: string) {
  const jobs = await getJobsByPipelineId(pipelineId);
  return jobs.map(mapJob);
}

export async function getJob(jobId: string) {
  const job = await getJobById(jobId);

  if (!job) {
    return null;
  }

  return mapJob(job);
}

export async function getJobAttempts(jobId: string) {
  const attempts = await getDeliveryAttemptsByJobId(jobId);

  return attempts.map((attempt) => ({
    id: attempt.id,
    jobId: attempt.job_id,
    subscriberId: attempt.subscriber_id,
    attemptNumber: attempt.attempt_number,
    status: attempt.status,
    responseStatus: attempt.response_status,
    responseBody: attempt.response_body,
    errorMessage: attempt.error_message,
    createdAt: attempt.created_at,
  }));
}

export async function retryJob(jobId: string) {
  const retried = await retryJobById(jobId);

  if (!retried) {
    return null;
  }

  return mapJob(retried);
}

export async function getMetrics() {
  return getJobMetrics();
}

export async function processNextJob() {
  await requeueStaleProcessingJobs();

  const job = await claimNextPendingJob();

  if (!job) {
    return null;
  }

  try {
    const pipeline = await getPipelineById(job.pipeline_id);

    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    const subscribers = await getSubscribersByPipelineId(job.pipeline_id);

    const processedPayload = executeAction(
      pipeline.action_type,
      job.input_payload,
      pipeline.action_config ?? {}
    );

    for (const subscriber of subscribers) {
      await deliverToSubscriber({
        jobId: job.id,
        subscriber,
        payload: processedPayload,
      });
    }

    const completed = await markJobCompleted(job.id, processedPayload);
    return completed;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown processing error";

    await markJobForRetry(job.id, message);
    return null;
  }
}