type LogLevel = "debug" | "info" | "warn" | "error";

const REDACT_KEYS = new Set([
  "secret",
  "secretkey",
  "signature",
  "authorization",
  "apikey",
  "api_key",
  "token",
  "tokenhash",
  "password",
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        REDACT_KEYS.has(k.toLowerCase()) ? "[REDACTED]" : redact(v),
      ])
    );
  }
  return value;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta ? { meta: redact(meta) } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
