import fs from "fs";
import path from "path";
import { pool } from "./index.js";

async function run() {
  const migrationsDir = path.join(process.cwd(), "src", "db", "migrations");

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");

    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }

  console.log("Migrations completed");
  await pool.end();
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
