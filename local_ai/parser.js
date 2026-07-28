const fs = require("node:fs")
const path = require("node:path")

const schemaPath = path.join(__dirname, "schema.json")
const scopePath = path.join(__dirname, "docs", "scope.md")
let artifacts

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
  if (rule.enum !== undefined && !Array.isArray(rule.enum)) throw new Error(`${location}.enum must be an array`)
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

function loadArtifacts() {
  if (artifacts) return artifacts

  try {
    const schema = JSON.parse(stripBom(fs.readFileSync(schemaPath, "utf8")))
    const scope = stripBom(fs.readFileSync(scopePath, "utf8"))
    assertSchemaDefinition(schema)
    artifacts = { schema, scope }
    return artifacts
  } catch (error) {
    throw new Error(`unable to load local parser artifacts: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function validateAgainstSchema(value, rule, location = "$") {
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

function isValidIsoDateTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const offsetHour = match[9] === undefined ? 0 : Number(match[9])
  const offsetMinute = match[10] === undefined ? 0 : Number(match[10])
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59 || offsetHour > 14 || offsetMinute > 59) return false
  if (offsetHour === 14 && offsetMinute !== 0) return false
  return day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function validateSemantics(output) {
  const errors = []
  if (output.actions.length < 1 || output.actions.length > 20) {
    errors.push("$.actions must contain from 1 to 20 actions")
  }

  const positiveFields = new Set([
    "current_weight",
    "target_weight",
    "weight",
    "height",
    "age",
    "sets",
    "reps",
    "load",
    "duration_minutes",
    "calories",
    "amount",
    "sleep_minutes",
    "hydration_amount",
    "mindfulness_minutes",
  ])
  const integerFields = new Set(["age", "sets", "reps"])
  const nonNegativeFields = new Set(["protein", "carbs", "fats", "fiber"])

  output.actions.forEach((action, index) => {
    const location = `$.actions[${index}]`
    if (!Number.isFinite(action.confidence) || action.confidence < 0 || action.confidence > 1) {
      errors.push(`${location}.confidence must be between 0 and 1`)
    }
    if (typeof action.date === "string" && !isValidIsoDateTime(action.date)) {
      errors.push(`${location}.date must be an ISO 8601 datetime with an explicit offset`)
    }
    for (const [field, value] of Object.entries(action)) {
      if (value === null) continue
      if (positiveFields.has(field) && (typeof value !== "number" || value <= 0)) {
        errors.push(`${location}.${field} must be positive when supplied`)
      }
      if (integerFields.has(field) && !Number.isInteger(value)) {
        errors.push(`${location}.${field} must be an integer when supplied`)
      }
      if (nonNegativeFields.has(field) && (typeof value !== "number" || value < 0)) {
        errors.push(`${location}.${field} must be non-negative when supplied`)
      }
    }
    if (action.type === "log_weight" && typeof action.weight === "number" && !action.weight_unit) {
      errors.push(`${location}.weight_unit is required with weight`)
    }
    if (action.type === "set_weight_goal" && typeof action.target_weight === "number" && !action.weight_unit) {
      errors.push(`${location}.weight_unit is required with target_weight`)
    }
    if (action.type === "log_hydration" && typeof action.hydration_amount === "number" && !action.hydration_unit) {
      errors.push(`${location}.hydration_unit is required with hydration_amount`)
    }
    if (action.type === "log_expense" && typeof action.amount === "number" && !action.currency) {
      errors.push(`${location}.currency is required with amount`)
    }
    if (action.type === "log_food" && action.nutrition_estimated === true) {
      const macros = [action.protein, action.carbs, action.fats]
      if (typeof action.calories === "number" && macros.every((value) => typeof value === "number")) {
        const macroCalories = action.protein * 4 + action.carbs * 4 + action.fats * 9
        const tolerance = Math.max(50, action.calories * 0.35)
        if (Math.abs(action.calories - macroCalories) > tolerance) {
          errors.push(`${location} estimated calories and macros are internally inconsistent`)
        }
      }
    }
  })

  const mutatingTypes = new Set([
    "set_profile",
    "set_weight_goal",
    "log_weight",
    "log_workout",
    "log_calories",
    "log_food",
    "log_expense",
    "log_sleep",
    "log_hydration",
    "log_mindfulness",
    "request_macro_update",
    "update_last_entry",
    "delete_last_entry",
  ])
  const requiresConfirmation = output.actions.some((action) => mutatingTypes.has(action.type))
  if (output.needs_confirmation !== requiresConfirmation) {
    errors.push(`$.needs_confirmation must equal ${requiresConfirmation}`)
  }

  return errors
}

function normalizedConfig(options = {}) {
  const model = String(options.model ?? process.env.LOCAL_AI_MODEL ?? process.env.local_model ?? "speaklio-parser").trim()
  const rawUrl = String(options.url ?? process.env.LOCAL_AI_URL ?? "http://localhost:11434").trim()
  const timeoutMs = Number(options.timeoutMs ?? process.env.LOCAL_AI_TIMEOUT_MS ?? 120000)

  let baseUrl
  try {
    baseUrl = new URL(rawUrl)
  } catch (error) {
    throw new Error(`LOCAL_AI_URL must be a valid URL: ${error instanceof Error ? error.message : String(error)}`)
  }

  const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"])
  if (!["http:", "https:"].includes(baseUrl.protocol) || !loopbackHosts.has(baseUrl.hostname)) {
    throw new Error("LOCAL_AI_URL must use a loopback HTTP or HTTPS address")
  }
  if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash || baseUrl.pathname !== "/") {
    throw new Error("LOCAL_AI_URL must be an origin without credentials, path, query, or fragment")
  }
  if (!model) throw new Error("LOCAL_AI_MODEL must not be empty")
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600000) {
    throw new Error("LOCAL_AI_TIMEOUT_MS must be an integer from 1 to 600000")
  }

  return {
    endpoint: new URL("/api/chat", baseUrl).toString(),
    model,
    timeoutMs,
  }
}

async function parseCommand(text, options = {}) {
  if (typeof text !== "string") throw new Error("command text must be a string")
  const normalizedText = text.trim()
  if (!normalizedText) throw new Error("command text must not be empty")
  if (normalizedText.length > 1000) throw new Error("command text must not exceed 1000 characters")

  const { schema, scope } = loadArtifacts()
  const config = normalizedConfig(options)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

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
      if (controller.signal.aborted) throw new Error(`model request timed out after ${config.timeoutMs} ms`)
      throw new Error(`model request failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    if (!response.ok) {
      let detail = ""
      try {
        detail = (await response.text()).trim().slice(0, 500)
      } catch (error) {
        if (controller.signal.aborted) throw new Error(`model request timed out after ${config.timeoutMs} ms`)
      }
      throw new Error(`model request failed with status ${response.status}${detail ? `: ${detail}` : ""}`)
    }

    let data
    try {
      data = await response.json()
    } catch (error) {
      if (controller.signal.aborted) throw new Error(`model request timed out after ${config.timeoutMs} ms`)
      throw new Error(`model response was not valid JSON: ${error instanceof Error ? error.message : String(error)}`)
    }

    if (data?.done === false || data?.done_reason === "length") {
      throw new Error("model response was incomplete")
    }

    const content = data?.message?.content
    if (typeof content !== "string") throw new Error("model response did not include string message content")

    let output
    try {
      output = JSON.parse(content)
    } catch (error) {
      throw new Error(`model message content was not valid JSON: ${error instanceof Error ? error.message : String(error)}`)
    }

    const schemaErrors = validateAgainstSchema(output, schema)
    const errors = schemaErrors.length > 0 ? schemaErrors : validateSemantics(output)
    if (errors.length > 0) throw new Error(`model output failed validation: ${errors.join("; ")}`)

    return output
  } finally {
    clearTimeout(timeout)
  }
}

async function readStdin() {
  let value = ""
  for await (const chunk of process.stdin) value += chunk
  return value
}

async function main() {
  const argumentText = process.argv.slice(2).join(" ").trim()
  const text = argumentText || (process.stdin.isTTY ? "" : (await readStdin()).trim())
  if (!text) throw new Error("provide command text as arguments or stdin")
  const output = await parseCommand(text)
  process.stdout.write(`${JSON.stringify(output)}\n`)
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

module.exports = {
  parseCommand,
}
