export function logInfo(message: string, data?: unknown) {
  console.log(`[INFO] ${message}`, data ?? "");
}

export function logError(message: string, data?: unknown) {
  console.error(`[ERROR] ${message}`, data ?? "");
}