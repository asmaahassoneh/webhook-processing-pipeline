import { pool } from "../db/index.js";

export async function insertSubscribers(
  subscribers: {
    id: string;
    pipelineId: string;
    targetUrl: string;
  }[]
) {
  if (subscribers.length === 0) {
    return;
  }

  const values: unknown[] = [];
  const placeholders: string[] = [];

  subscribers.forEach((subscriber, index) => {
    const base = index * 3;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
    values.push(subscriber.id, subscriber.pipelineId, subscriber.targetUrl);
  });

  await pool.query(
    `
    INSERT INTO subscribers (id, pipeline_id, target_url)
    VALUES ${placeholders.join(", ")}
    `,
    values
  );
}

export async function getSubscribersByPipelineId(pipelineId: string) {
  const result = await pool.query(
    `
    SELECT * FROM subscribers
    WHERE pipeline_id = $1
    ORDER BY created_at ASC
    `,
    [pipelineId]
  );

  return result.rows;
}

export async function deleteSubscribersByPipelineId(pipelineId: string) {
  await pool.query(`DELETE FROM subscribers WHERE pipeline_id = $1`, [pipelineId]);
}