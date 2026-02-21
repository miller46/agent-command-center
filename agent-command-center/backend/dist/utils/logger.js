export const logInfo = (message, meta) => {
    console.log(`[agent-api] ${message}`, meta ?? "");
};
export const logError = (message, error) => {
    console.error(`[agent-api] ${message}`, error ?? "");
};
