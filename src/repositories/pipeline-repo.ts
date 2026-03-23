import { pool } from "../db/index.js";

export async function insertPipeline(pipeline: {
  id: string;
  name: string;
  sourceKey: string;
  actionType: string;
  actionConfig: Record<string, unknown>;
  webhookSecret: string | null;
}) {
  const result = await pool.query(
    `
    INSERT INTO pipelines (
      id,
      name,
      source_key,
      action_type,
      action_config,
      webhook_secret
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      pipeline.id,
      pipeline.name,
      pipeline.sourceKey,
      pipeline.actionType,
      pipeline.actionConfig,
      pipeline.webhookSecret,
    ],
  );

  return result.rows[0];
}

export async function getAllPipelines() {
  const result = await pool.query(
    `SELECT * FROM pipelines ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function getPipelineById(id: string) {
  const result = await pool.query(`SELECT * FROM pipelines WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function getPipelineBySourceKey(sourceKey: string) {
  const result = await pool.query(
    `SELECT * FROM pipelines WHERE source_key = $1`,
    [sourceKey],
  );
  return result.rows[0] ?? null;
}

export async function updatePipelineById(
  id: string,
  updates: {
    name: string;
    actionType: string;
    actionConfig: Record<string, unknown>;
    webhookSecret: string | null;
  },
) {
  const result = await pool.query(
    `
    UPDATE pipelines
    SET name = $2,
        action_type = $3,
        action_config = $4,
        webhook_secret = $5,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      updates.name,
      updates.actionType,
      updates.actionConfig,
      updates.webhookSecret,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deletePipelineById(id: string) {
  const result = await pool.query(
    `DELETE FROM pipelines WHERE id = $1 RETURNING *`,
    [id],
  );

  return result.rows[0] ?? null;
}
