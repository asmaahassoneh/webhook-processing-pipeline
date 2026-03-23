export function appendSuffix(
  payload: Record<string, unknown>,
  config: Record<string, unknown> = {}
) {
  const field =
    typeof config.field === "string" && config.field.trim()
      ? config.field
      : "text";

  const suffix =
    typeof config.suffix === "string"
      ? config.suffix
      : " - processed";

  const value = typeof payload[field] === "string" ? payload[field] : "";

  return {
    ...payload,
    [field]: `${value}${suffix}`,
  };
}