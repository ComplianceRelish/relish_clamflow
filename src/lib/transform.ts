// src/lib/transform.ts
// Deep key transformation utilities for snake_case ↔ camelCase conversion
// The backend (FastAPI/Python) returns snake_case JSON, but frontend TypeScript types use camelCase.

/**
 * Convert a snake_case string to camelCase.
 * Examples:
 *   "station_name"       → "stationName"
 *   "avg_wait_time"      → "avgWaitTime"
 *   "queued_lots"        → "queuedLots"
 *   "current_station"    → "currentStation"
 *   "already_camel"      → "already_camel" (no underscores → unchanged)
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
}

/**
 * Convert a camelCase string to snake_case.
 * Examples:
 *   "stationName"   → "station_name"
 *   "avgWaitTime"   → "avg_wait_time"
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

/**
 * Recursively transform all object keys from snake_case to camelCase.
 * - Handles nested objects, arrays, and mixed structures
 * - Preserves null, undefined, primitives, and Date objects
 * - Returns new objects (does NOT mutate input)
 */
export function transformKeysToCamel<T = unknown>(data: unknown): T {
  if (data === null || data === undefined) {
    return data as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => transformKeysToCamel(item)) as T;
  }

  if (data instanceof Date) {
    return data as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const camelKey = snakeToCamel(key);
      result[camelKey] = transformKeysToCamel(value);
    }
    return result as T;
  }

  // Primitives (string, number, boolean)
  return data as T;
}

/**
 * Recursively transform all object keys from camelCase to snake_case.
 * Useful when sending data TO the backend.
 */
export function transformKeysToSnake<T = unknown>(data: unknown): T {
  if (data === null || data === undefined) {
    return data as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => transformKeysToSnake(item)) as T;
  }

  if (data instanceof Date) {
    return data as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = transformKeysToSnake(value);
    }
    return result as T;
  }

  return data as T;
}
