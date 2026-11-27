/**
 * Deterministic JSON serialization (RFC 8785 style).
 *
 * Two runs over the same data must produce the same bytes, or a hash of that
 * data proves nothing. `JSON.stringify` does not promise that: object key order
 * follows insertion order, which depends on how an object was built.
 *
 * Rules implemented here:
 *   - object keys sorted by UTF-16 code unit order (RFC 8785 s3.2.3)
 *   - no whitespace
 *   - numbers via the ECMAScript number-to-string algorithm (RFC 8785 s3.2.2.3)
 *   - strings escaped by JSON.stringify, control characters included
 *
 * Deliberately stricter than JSON.stringify in three places, so a mistake is
 * loud instead of silently changing a published hash:
 *   - `undefined` anywhere throws (the JSON data model has no undefined)
 *   - `NaN` and `Infinity` throw
 *   - non-JSON objects (Date, Map, Set, class instances) throw
 *
 * Pure module: no Node or browser APIs, safe on the server and in a script.
 */

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export class CanonicalJsonError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CanonicalJsonError"
  }
}

/** Serializes a value to canonical JSON text. Throws on anything JSON cannot represent. */
export function canonicalJson(value: unknown): string {
  return write(value, "$")
}

/** Canonical JSON text as UTF-8 bytes, ready to hash or sign. */
export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalJson(value))
}

function write(value: unknown, path: string): string {
  if (value === null) return "null"

  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false"
    case "string":
      return JSON.stringify(value)
    case "number":
      if (!Number.isFinite(value)) {
        throw new CanonicalJsonError(`${path}: non-finite number (${String(value)}) is not JSON data`)
      }
      // -0 serializes as "0", which is what RFC 8785 requires.
      return JSON.stringify(value)
    case "object":
      break
    case "undefined":
      throw new CanonicalJsonError(`${path}: undefined is not JSON data; write null instead`)
    default:
      throw new CanonicalJsonError(`${path}: ${typeof value} is not JSON data`)
  }

  if (Array.isArray(value)) {
    const parts: string[] = []
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index]
      if (item === undefined) {
        throw new CanonicalJsonError(`${path}[${index}]: undefined is not JSON data; write null instead`)
      }
      parts.push(write(item, `${path}[${index}]`))
    }
    return `[${parts.join(",")}]`
  }

  const prototype = Object.getPrototypeOf(value)
  // Cross-realm objects (a module loaded in a vm context, a worker) have their
  // own Object.prototype, so identity against this realm's prototype is not a
  // usable test. A plain object is one whose prototype has no prototype of its
  // own; every class instance, Date, Map and Set fails that test.
  const isPlain = prototype === null || Object.getPrototypeOf(prototype) === null
  if (!isPlain) {
    throw new CanonicalJsonError(
      `${path}: an instance of a class is not JSON data; convert it first (a Date must become an ISO string)`,
    )
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  const parts: string[] = []
  for (const key of keys) {
    const item = record[key]
    if (item === undefined) {
      throw new CanonicalJsonError(`${path}.${key}: undefined is not JSON data; write null instead`)
    }
    parts.push(`${JSON.stringify(key)}:${write(item, `${path}.${key}`)}`)
  }
  return `{${parts.join(",")}}`
}
