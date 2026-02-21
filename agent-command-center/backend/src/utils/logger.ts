export const logInfo = (message: string, meta?: unknown): void => {
  console.log(`[agent-api] ${message}`, meta ?? "");
};

export const logError = (message: string, error?: unknown): void => {
  console.error(`[agent-api] ${message}`, error ?? "");
};
