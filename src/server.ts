import dotenv from "dotenv";
import { app } from "./app.js";
import { testDbConnection } from "./db/index.js";

dotenv.config();

const port = Number(process.env.PORT) || 3000;

async function start() {
  try {
    const db = await testDbConnection();
    console.log("Database connected at:", db.now);

    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
