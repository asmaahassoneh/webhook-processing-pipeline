export function addMetadata(
  payload: Record<string, unknown>,
  config: Record<string, unknown> = {},
) {
  const includeTimestamp =
    typeof config.includeTimestamp === "boolean"
      ? config.includeTimestamp
      : true;

  const includeKeyCount =
    typeof config.includeKeyCount === "boolean" ? config.includeKeyCount : true;

  return {
    original: payload,
    metadata: {
      ...(includeTimestamp ? { receivedAt: new Date().toISOString() } : {}),
      ...(includeKeyCount ? { keyCount: Object.keys(payload).length } : {}),
    },
  };
}
