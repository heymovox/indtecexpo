import { sanitizeObject } from "@/lib/protection";

export function sanitizeBody(raw: unknown): unknown {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return sanitizeObject(raw as Record<string, unknown>);
  }
  return raw;
}
