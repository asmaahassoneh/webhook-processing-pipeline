export type ActionType =
  | "uppercase_text"
  | "reverse_text"
  | "add_metadata"
  | "append_suffix";

export type CreatePipelineInput = {
  name: string;
  actionType: ActionType;
  actionConfig?: Record<string, unknown>;
  subscribers: { targetUrl: string }[];
  webhookSecret?: string | null;
};

export type UpdatePipelineInput = {
  name?: string;
  actionType?: ActionType;
  actionConfig?: Record<string, unknown>;
  subscribers?: { targetUrl: string }[];
  webhookSecret?: string | null;
};