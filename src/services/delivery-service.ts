import { randomUUID } from "crypto";
import { insertDeliveryAttempt } from "../repositories/delivery-attempt-repo.js";
import { sleep } from "../utils/sleep.js";

export async function deliverToSubscriber(params: {
  jobId: string;
  subscriber: { id: string; target_url: string };
  payload: Record<string, unknown>;
}) {
  const maxAttempts = 3;

  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber += 1) {
    try {
      const response = await fetch(params.subscriber.target_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: params.jobId,
          deliveredAt: new Date().toISOString(),
          data: params.payload,
        }),
      });

      const responseBody = await response.text();

      if (response.ok) {
        await insertDeliveryAttempt({
          id: randomUUID(),
          jobId: params.jobId,
          subscriberId: params.subscriber.id,
          attemptNumber,
          status: "success",
          responseStatus: response.status,
          responseBody,
          errorMessage: null,
        });

        return;
      }

      await insertDeliveryAttempt({
        id: randomUUID(),
        jobId: params.jobId,
        subscriberId: params.subscriber.id,
        attemptNumber,
        status: "failed",
        responseStatus: response.status,
        responseBody,
        errorMessage: `HTTP ${response.status}`,
      });
    } catch (error) {
      await insertDeliveryAttempt({
        id: randomUUID(),
        jobId: params.jobId,
        subscriberId: params.subscriber.id,
        attemptNumber,
        status: "failed",
        responseStatus: null,
        responseBody: null,
        errorMessage:
          error instanceof Error ? error.message : "Unknown delivery error",
      });
    }

    if (attemptNumber < maxAttempts) {
      await sleep(1000 * 2 ** (attemptNumber - 1));
    }
  }

  throw new Error(
    `Delivery failed for subscriber ${params.subscriber.target_url}`
  );
}