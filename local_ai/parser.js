const fs = require("node:fs")
const path = require("node:path")

const schemaPath = path.join(__dirname, "schema.json")
const scopePath = path.join(__dirname, "docs", "scope.md")
const schema = JSON.parse(stripBom(fs.readFileSync(schemaPath, "utf8")))
const scope = stripBom(fs.readFileSync(scopePath, "utf8"))

class ParserError extends Error {
  constructor(code, message, cause) {
    super(message)
    this.name = "ParserError"
    this.code = code
    if (cause !== undefined) this.cause = cause
  }
}

function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function valueType(value) {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  if (typeof value === "number") return Number.isFinite(value) ? "number" : "invalid-number"
  return typeof value
}

function assertSchemaDefinition(rule, location = "$schema") {
  if (!isPlainObject(rule)) throw new Error(`${location} must be an object`)

  const supportedKeywords = new Set([
    "type",
    "properties",
    "required",
    "additionalProperties",
    "items",
    "enum",
  ])

  for (const key of Object.keys(rule)) {
    if (!supportedKeywords.has(key)) throw new Error(`${location} uses unsupported keyword ${key}`)
  }

  const types = Array.isArray(rule.type) ? rule.type : [rule.type]
  if (types.some((type) => typeof type !== "string")) throw new Error(`${location}.type is invalid`)

  if (rule.enum !== undefined && !Array.isArray(rule.enum)) {
    throw new Error(`${location}.enum must be an array`)
  }

  if (rule.required !== undefined && (!Array.isArray(rule.required) || rule.required.some((key) => typeof key !== "string"))) {
    throw new Error(`${location}.required must be an array of strings`)
  }

  if (rule.additionalProperties !== undefined && typeof rule.additionalProperties !== "boolean") {
    throw new Error(`${location}.additionalProperties must be boolean`)
  }

  if (rule.properties !== undefined) {
    if (!isPlainObject(rule.properties)) throw new Error(`${location}.properties must be an object`)
    for (const [key, child] of Object.entries(rule.properties)) {
      assertSchemaDefinition(child, `${location}.properties.${key}`)
    }
  }

  if (rule.items !== undefined) assertSchemaDefinition(rule.items, `${location}.items`)
}

function validateAgainstSchema(value, rule = schema, location = "$") {
  const errors = []
  const actualType = valueType(value)
  const allowedTypes = Array.isArray(rule.type) ? rule.type : [rule.type]

  if (!allowedTypes.includes(actualType)) {
    errors.push(`${location} must be ${allowedTypes.join(" or ")}, received ${actualType}`)
    return errors
  }

  if (rule.enum !== undefined && !rule.enum.some((item) => Object.is(item, value))) {
    errors.push(`${location} must be one of ${JSON.stringify(rule.enum)}`)
    return errors
  }

  if (actualType === "object") {
    const required = rule.required || []
    const properties = rule.properties || {}

    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(`${location}.${key} is required`)
    }

    if (rule.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) errors.push(`${location}.${key} is not allowed`)
      }
    }

    for (const [key, child] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateAgainstSchema(value[key], child, `${location}.${key}`))
      }
    }
  }

  if (actualType === "array" && rule.items) {
    value.forEach((item, index) => {
      errors.push(...validateAgainstSchema(item, rule.items, `${location}[${index}]`))
    })
  }

  return errors
}

function normalizedConfig(options = {}) {
  const url = String(options.url ?? process.env.LOCAL_AI_URL ?? "http://localhost:11434").trim()
  const model = String(options.model ?? process.env.LOCAL_AI_MODEL ?? "speaklio-parser").trim()
  const timeoutMs = Number(options.timeoutMs ?? process.env.LOCAL_AI_TIMEOUT_MS ?? 120000)

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch (error) {
    throw new ParserError("CONFIG", "LOCAL_AI_URL must be a valid URL", error)
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new ParserError("CONFIG", "LOCAL_AI_URL must use http or https")
  }
  if (parsedUrl.username || parsedUrl.password) {
    throw new ParserError("CONFIG", "LOCAL_AI_URL must not include credentials")
  }
  if (parsedUrl.search || parsedUrl.hash) {
    throw new ParserError("CONFIG", "LOCAL_AI_URL must not include a query or fragment")
  }
  if (parsedUrl.pathname !== "/") {
    throw new ParserError("CONFIG", "LOCAL_AI_URL must not include a path")
  }

  if (!model) throw new ParserError("CONFIG", "LOCAL_AI_MODEL must not be empty")
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new ParserError("CONFIG", "LOCAL_AI_TIMEOUT_MS must be a positive integer")
  }

  return {
    endpoint: new URL("/api/chat", parsedUrl).toString(),
    model,
    timeoutMs,
  }
}

function telemetryFromResponse(data) {
  const numberOrNull = (value) => typeof value === "number" && Number.isFinite(value) ? value : null
  return {
    done: typeof data.done === "boolean" ? data.done : null,
    doneReason: typeof data.done_reason === "string" ? data.done_reason : null,
    totalDuration: numberOrNull(data.total_duration),
    loadDuration: numberOrNull(data.load_duration),
    promptEvalCount: numberOrNull(data.prompt_eval_count),
    promptEvalDuration: numberOrNull(data.prompt_eval_duration),
    evalCount: numberOrNull(data.eval_count),
    evalDuration: numberOrNull(data.eval_duration),
  }
}

async function parseCommandDetailed(text, options = {}) {
  if (typeof text !== "string") throw new ParserError("INPUT", "command text must be a string")

  const normalizedText = text.trim()
  if (!normalizedText) throw new ParserError("INPUT", "command text must not be empty")
  if (normalizedText.length > 1000) throw new ParserError("INPUT", "command text must not exceed 1000 characters")

  const config = normalizedConfig(options)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)
  const started = process.hrtime.bigint()

  try {
    let response
    try {
      response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: config.model,
          stream: false,
          format: schema,
          messages: [
            {
              role: "system",
              content: scope,
            },
            {
              role: "user",
              content: normalizedText,
            },
          ],
        }),
      })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ParserError("TIMEOUT", `model request timed out after ${config.timeoutMs} ms`, error)
      }
      throw new ParserError("NETWORK", `model request failed: ${error instanceof Error ? error.message : String(error)}`, error)
    }

    if (!response.ok) {
      let detail = ""
      try {
        detail = (await response.text()).trim().slice(0, 500)
      } catch (error) {
        if (controller.signal.aborted) {
          throw new ParserError("TIMEOUT", `model request timed out after ${config.timeoutMs} ms`, error)
        }
        detail = ""
      }
      throw new ParserError("HTTP", `model request failed with status ${response.status}${detail ? `: ${detail}` : ""}`)
    }

    let data
    try {
      data = await response.json()
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ParserError("TIMEOUT", `model request timed out after ${config.timeoutMs} ms`, error)
      }
      throw new ParserError("ENVELOPE", "model response was not valid JSON", error)
    }

    if (data?.done === false || data?.done_reason === "length") {
      throw new ParserError("MODEL_TRUNCATED", "model response was incomplete")
    }

    const content = data?.message?.content
    if (typeof content !== "string") {
      throw new ParserError("ENVELOPE", "model response did not include string message content")
    }

    let output
    try {
      output = JSON.parse(content)
    } catch (error) {
      throw new ParserError("MODEL_JSON", "model message content was not valid JSON", error)
    }

    const schemaErrors = validateAgainstSchema(output)
    if (schemaErrors.length > 0) {
      throw new ParserError("MODEL_SCHEMA", `model output failed schema validation: ${schemaErrors.join("; ")}`)
    }

    const latencyMs = Number(process.hrtime.bigint() - started) / 1e6
    return {
      output,
      rawContent: content,
      latencyMs,
      model: config.model,
      endpoint: config.endpoint,
      telemetry: telemetryFromResponse(data),
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function parseCommand(text, options = {}) {
  const result = await parseCommandDetailed(text, options)
  return result.output
}

async function readStdin() {
  let value = ""
  for await (const chunk of process.stdin) value += chunk
  return value
}

async function main() {
  const argumentText = process.argv.slice(2).join(" ").trim()
  const text = argumentText || (process.stdin.isTTY ? "" : (await readStdin()).trim())
  if (!text) throw new ParserError("INPUT", "provide command text as arguments or stdin")
  const output = await parseCommand(text)
  process.stdout.write(`${JSON.stringify(output)}\n`)
}

assertSchemaDefinition(schema)

if (require.main === module) {
  main().catch((error) => {
    const code = error instanceof ParserError ? error.code : "UNEXPECTED"
    process.stderr.write(`${code}: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

module.exports = {
  ParserError,
  parseCommand,
  parseCommandDetailed,
  schema,
  validateAgainstSchema,
}
