export function reverseText(
  payload: Record<string, unknown>,
  config: Record<string, unknown> = {},
) {
  const field =
    typeof config.field === "string" && config.field.trim()
      ? config.field
      : "text";

  const value = typeof payload[field] === "string" ? payload[field] : "";

  return {
    ...payload,
    [field]: Array.from(value).reverse().join(""),
  };
}
