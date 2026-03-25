/**
 * Safely parse a socket/API response.
 * Returns the parsed value or null if parsing fails.
 */
export function parseResponse<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  // Already an object (socket.io auto-parses JSON payloads)
  return raw as T;
}
