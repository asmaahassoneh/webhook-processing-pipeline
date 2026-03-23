export type Subscriber = {
  id?: string;
  targetUrl: string;
};

export type Pipeline = {
  id: string;
  name: string;
  sourceKey: string;
  actionType: string;
  actionConfig: Record<string, unknown>;
  webhookSecret?: string | null;
  subscribers: Subscriber[];
  createdAt: string;
  updatedAt: string;
};

export type Job = {
  id: string;
  pipelineId: string;
  status: "pending" | "processing" | "completed" | "failed";
  inputPayload: Record<string, unknown>;
  processedPayload?: Record<string, unknown> | null;
  attemptsCount: number;
  maxAttempts: number;
  nextRunAt?: string | null;
  lockedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  failedAt?: string | null;
};

export type DeliveryAttempt = {
  id: string;
  jobId: string;
  subscriberId: string;
  attemptNumber: number;
  status: "success" | "failed";
  responseStatus?: number | null;
  responseBody?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

export type Metrics = {
  total_jobs: number;
  pending_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
};