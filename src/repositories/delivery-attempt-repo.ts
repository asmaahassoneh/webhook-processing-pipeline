import { pool } from "../db/index.js";

export async function insertDeliveryAttempt(attempt: {
  id: string;
  jobId: string;
  subscriberId: string;
  attemptNumber: number;
  status: "success" | "failed";
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
}) {
  const result = await pool.query(
    `
    INSERT INTO delivery_attempts (
      id,
      job_id,
      subscriber_id,
      attempt_number,
      status,
      response_status,
      response_body,
      error_message
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      attempt.id,
      attempt.jobId,
      attempt.subscriberId,
      attempt.attemptNumber,
      attempt.status,
      attempt.responseStatus,
      attempt.responseBody,
      attempt.errorMessage,
    ],
  );

  return result.rows[0];
}

export async function getDeliveryAttemptsByJobId(jobId: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM delivery_attempts
    WHERE job_id = $1
    ORDER BY created_at ASC
    `,
    [jobId],
  );

  return result.rows;
}
