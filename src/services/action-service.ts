import { addMetadata } from "../actions/add-metadata.js";
import { appendSuffix } from "../actions/append-suffix.js";
import { reverseText } from "../actions/reverse-text.js";
import { uppercaseText } from "../actions/uppercase-text.js";
import { ActionType } from "../types/pipeline.js";

export function executeAction(
  actionType: ActionType,
  payload: Record<string, unknown>,
  actionConfig: Record<string, unknown> = {}
) {
  switch (actionType) {
    case "uppercase_text":
      return uppercaseText(payload, actionConfig);

    case "reverse_text":
      return reverseText(payload, actionConfig);

    case "add_metadata":
      return addMetadata(payload, actionConfig);

    case "append_suffix":
      return appendSuffix(payload, actionConfig);

    default:
      throw new Error(`Unsupported action type: ${actionType}`);
  }
}