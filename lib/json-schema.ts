import { canonicalJson } from "./canonical-json"

/**
 * A small, strict JSON Schema validator.
 *
 * Why hand-written: the registry ships a published JSON Schema so that a
 * consumer in any language can validate a record, and that file is worthless if
 * the site validates with a different, private set of rules. This module makes
 * the published schema the only rulebook. It is also the reason no schema
 * library is installed: one dependency for one schema is weight without value,
 * and the site's build must stay free of native code.
 *
 * Supported keywords (the subset the published schema uses):
 *   $ref (local `#/$defs/...`), type, const, enum, allOf, anyOf, oneOf,
 *   required, properties, additionalProperties (boolean), items,
 *   minItems, maxItems, uniqueItems, minimum, maximum, minLength, maxLength,
 *   pattern, format (date, date-time, uri)
 *
 * Unknown keywords are ignored on purpose: a schema may carry annotations
 * (`title`, `description`, `$comment`, `$id`, `$schema`) that are not rules.
 *
 * Returns every issue instead of throwing, so a validator script can print a
 * full list and a test can assert the list is empty.
 */

export interface SchemaIssue {
  /** JSON path in the validated document, e.g. `$[3].pricing.input`. */
  path: string
  message: string
}

type JsonSchemaNode = Record<string, unknown>

const DATE = /^\d{4}-\d{2}-\d{2}$/
const patternCache = new Map<string, RegExp>()

export function validateSchema(schema: unknown, data: unknown): SchemaIssue[] {
  if (!isObject(schema)) throw new Error("validateSchema: the schema must be a JSON object")
  const issues: SchemaIssue[] = []
  check(schema, schema, data, "$", issues)
  return issues
}

/** True when the data has no issue at all. */
export function conforms(schema: unknown, data: unknown): boolean {
  return validateSchema(schema, data).length === 0
}

function check(root: JsonSchemaNode, node: JsonSchemaNode, value: unknown, path: string, issues: SchemaIssue[]): void {
  if (typeof node.$ref === "string") {
    check(root, resolveRef(root, node.$ref), value, path, issues)
  }

  if (Array.isArray(node.allOf)) {
    for (const sub of node.allOf) check(root, asNode(sub, "allOf"), value, path, issues)
  }

  if (Array.isArray(node.anyOf)) {
    const matched = node.anyOf.some((sub) => conformsNode(root, sub, value))
    if (!matched) {
      issues.push({ path, message: "matches none of the anyOf alternatives" })
    }
  }

  if (Array.isArray(node.oneOf)) {
    const matched = node.oneOf.filter((sub) => conformsNode(root, sub, value)).length
    if (matched !== 1) {
      issues.push({ path, message: `matches ${matched} of the oneOf alternatives (exactly 1 required)` })
    }
  }

  if (node.const !== undefined && !jsonEqual(node.const, value)) {
    issues.push({ path, message: `must equal ${canonicalJson(node.const)}` })
  }

  if (Array.isArray(node.enum) && !node.enum.some((option) => jsonEqual(option, value))) {
    issues.push({ path, message: `must be one of ${node.enum.map((option) => canonicalJson(option)).join(", ")}` })
  }

  if (node.type !== undefined) {
    const expected = Array.isArray(node.type) ? node.type : [node.type]
    if (!expected.some((type) => matchesType(type, value))) {
      issues.push({ path, message: `must be ${expected.map(String).join(" or ")} (got ${describe(value)})` })
      // A wrong type makes every other keyword meaningless noise.
      return
    }
  }

  if (typeof value === "string") {
    if (typeof node.minLength === "number" && value.length < node.minLength) {
      issues.push({ path, message: `must be at least ${node.minLength} characters (got ${value.length})` })
    }
    if (typeof node.maxLength === "number" && value.length > node.maxLength) {
      issues.push({ path, message: `must be at most ${node.maxLength} characters (got ${value.length})` })
    }
    if (typeof node.pattern === "string") {
      let pattern = patternCache.get(node.pattern)
      if (!pattern) {
        pattern = new RegExp(node.pattern)
        patternCache.set(node.pattern, pattern)
      }
      if (!pattern.test(value)) {
        issues.push({ path, message: `must match ${node.pattern} (got ${JSON.stringify(value)})` })
      }
    }
    if (typeof node.format === "string" && !matchesFormat(node.format, value)) {
      issues.push({ path, message: `must be a valid ${node.format} (got ${JSON.stringify(value)})` })
    }
  }

  if (typeof value === "number") {
    if (typeof node.minimum === "number" && value < node.minimum) {
      issues.push({ path, message: `must be >= ${node.minimum} (got ${value})` })
    }
    if (typeof node.maximum === "number" && value > node.maximum) {
      issues.push({ path, message: `must be <= ${node.maximum} (got ${value})` })
    }
  }

  if (Array.isArray(value)) {
    if (typeof node.minItems === "number" && value.length < node.minItems) {
      issues.push({ path, message: `must have at least ${node.minItems} items (got ${value.length})` })
    }
    if (typeof node.maxItems === "number" && value.length > node.maxItems) {
      issues.push({ path, message: `must have at most ${node.maxItems} items (got ${value.length})` })
    }
    if (node.uniqueItems === true) {
      const seen = new Set<string>()
      value.forEach((item, index) => {
        const key = canonicalJson(item)
        if (seen.has(key)) issues.push({ path: `${path}[${index}]`, message: "duplicates an earlier item" })
        else seen.add(key)
      })
    }
    if (node.items !== undefined) {
      const items = asNode(node.items, "items")
      value.forEach((item, index) => check(root, items, item, `${path}[${index}]`, issues))
    }
  }

  if (isObject(value)) {
    if (Array.isArray(node.required)) {
      for (const key of node.required) {
        if (typeof key !== "string") continue
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          issues.push({ path, message: `is missing required property "${key}"` })
        }
      }
    }

    const properties = isObject(node.properties) ? node.properties : {}
    for (const [key, sub] of Object.entries(properties)) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue
      check(root, asNode(sub, `properties.${key}`), value[key], `${path}.${key}`, issues)
    }

    if (node.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) continue
        issues.push({ path, message: `has unknown property "${key}"` })
      }
    } else if (isObject(node.additionalProperties)) {
      for (const key of Object.keys(value)) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) continue
        check(root, node.additionalProperties, value[key], `${path}.${key}`, issues)
      }
    }
  }
}

function conformsNode(root: JsonSchemaNode, node: unknown, value: unknown): boolean {
  const issues: SchemaIssue[] = []
  check(root, asNode(node, "subschema"), value, "$", issues)
  return issues.length === 0
}

function resolveRef(root: JsonSchemaNode, ref: string): JsonSchemaNode {
  if (ref === "#") return root
  if (!ref.startsWith("#/")) throw new Error(`validateSchema: only local refs are supported (got ${ref})`)
  let cursor: unknown = root
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~")
    cursor = isObject(cursor) ? cursor[key] : undefined
    if (cursor === undefined) throw new Error(`validateSchema: unresolvable $ref ${ref}`)
  }
  return asNode(cursor, ref)
}

function asNode(value: unknown, where: string): JsonSchemaNode {
  if (!isObject(value)) throw new Error(`validateSchema: ${where} must be a JSON Schema object`)
  return value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function matchesType(type: unknown, value: unknown): boolean {
  switch (type) {
    case "object":
      return isObject(value)
    case "array":
      return Array.isArray(value)
    case "string":
      return typeof value === "string"
    case "number":
      return typeof value === "number" && Number.isFinite(value)
    case "integer":
      return typeof value === "number" && Number.isInteger(value)
    case "boolean":
      return typeof value === "boolean"
    case "null":
      return value === null
    default:
      throw new Error(`validateSchema: unknown type ${JSON.stringify(type)}`)
  }
}

function matchesFormat(format: string, value: string): boolean {
  switch (format) {
    case "date":
      return DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    case "date-time":
      return !Number.isNaN(Date.parse(value))
    case "uri":
      try {
        const parsed = new URL(value)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
      } catch {
        return false
      }
    default:
      // An unsupported format is an annotation, not a rule.
      return true
  }
}

/** Exact JSON value equality: key order and object identity do not matter. */
export function jsonEqual(a: unknown, b: unknown): boolean {
  try {
    return canonicalJson(a) === canonicalJson(b)
  } catch {
    return false
  }
}

function describe(value: unknown): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}
