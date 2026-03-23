import { pool } from "../db/index.js";

const DEFAULT_MAX_ATTEMPTS = 5;

export async function insertJob(job: {
  id: string;
  pipelineId: string;
  status: string;
  inputPayload: Record<string, unknown>;
}) {
  const result = await pool.query(
    `
    INSERT INTO jobs (
      id,
      pipeline_id,
      status,
      input_payload,
      attempts_count,
      max_attempts,
      next_run_at
    )
    VALUES ($1, $2, $3, $4, 0, $5, NOW())
    RETURNING *
    `,
    [
      job.id,
      job.pipelineId,
      job.status,
      job.inputPayload,
      DEFAULT_MAX_ATTEMPTS,
    ],
  );

  return result.rows[0];
}

export async function getJobById(jobId: string) {
  const result = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
  return result.rows[0] ?? null;
}

export async function getAllJobs() {
  const result = await pool.query(
    `SELECT * FROM jobs ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function getJobsByPipelineId(pipelineId: string) {
  const result = await pool.query(
    `
    SELECT * FROM jobs
    WHERE pipeline_id = $1
    ORDER BY created_at DESC
    `,
    [pipelineId],
  );

  return result.rows;
}

export async function requeueStaleProcessingJobs() {
  await pool.query(
    `
    UPDATE jobs
    SET status = 'pending',
        locked_at = NULL,
        updated_at = NOW(),
        error_message = COALESCE(error_message, 'Recovered stale processing job')
    WHERE status = 'processing'
      AND locked_at IS NOT NULL
      AND locked_at < NOW() - INTERVAL '2 minutes'
    `,
  );
}

export async function claimNextPendingJob() {
  const result = await pool.query(
    `
    UPDATE jobs
    SET status = 'processing',
        locked_at = NOW(),
        attempts_count = attempts_count + 1,
        updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM jobs
      WHERE status = 'pending'
        AND next_run_at <= NOW()
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
    `,
  );

  return result.rows[0] ?? null;
}

export async function markJobCompleted(
  jobId: string,
  processedPayload: Record<string, unknown>,
) {
  const result = await pool.query(
    `
    UPDATE jobs
    SET status = 'completed',
        processed_payload = $2,
        error_message = NULL,
        locked_at = NULL,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [jobId, processedPayload],
  );

  return result.rows[0];
}

export async function markJobForRetry(jobId: string, errorMessage: string) {
  const result = await pool.query(
    `
    UPDATE jobs
    SET status = CASE
          WHEN attempts_count >= max_attempts THEN 'failed'
          ELSE 'pending'
        END,
        error_message = $2,
        locked_at = NULL,
        next_run_at = CASE
          WHEN attempts_count >= max_attempts THEN next_run_at
          ELSE NOW() + (attempts_count * INTERVAL '10 seconds')
        END,
        failed_at = CASE
          WHEN attempts_count >= max_attempts THEN NOW()
          ELSE failed_at
        END,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [jobId, errorMessage],
  );

  return result.rows[0];
}

export async function retryJobById(jobId: string) {
  const result = await pool.query(
    `
    UPDATE jobs
    SET status = 'pending',
        error_message = NULL,
        locked_at = NULL,
        next_run_at = NOW(),
        failed_at = NULL,
        updated_at = NOW()
    WHERE id = $1
      AND status = 'failed'
    RETURNING *
    `,
    [jobId],
  );

  return result.rows[0] ?? null;
}

export async function getJobMetrics() {
  const result = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total_jobs,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_jobs,
      COUNT(*) FILTER (WHERE status = 'processing')::int AS processing_jobs,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_jobs,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_jobs
    FROM jobs
    `,
  );

  return result.rows[0];
}
