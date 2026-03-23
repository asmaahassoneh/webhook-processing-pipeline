import dotenv from "dotenv";
import { processNextJob } from "./services/job-service.js";

dotenv.config();

async function startWorker() {
  console.log("Worker started");

  while (true) {
    try {
      const job = await processNextJob();

      if (job) {
        console.log("Processed job:", job.id);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Worker error:", error);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

startWorker();
