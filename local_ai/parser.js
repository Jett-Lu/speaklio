const fs = require("node:fs")
const path = require("node:path")

function parseJson(value) {
  return JSON.parse(value.replace(/^\uFEFF/, "").trim())
}

const schema = parseJson(fs.readFileSync(path.join(__dirname, "schema.json"), "utf8"))
const scope = fs.readFileSync(path.join(__dirname, "docs", "scope.md"), "utf8")

async function parseCommand(text) {
  let response

  try {
    response = await fetch("http://localhost:11434/api/chat", {
      method: "post",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.LOCAL_MODEL || process.env.local_model || "speaklio-parser",
        stream: false,
        format: schema,
        messages: [
          {
            role: "system",
            content: scope
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    })
  } catch (error) {
    throw new Error(`could not reach Ollama at http://localhost:11434/api/chat: ${error.message}`)
  }

  if (!response.ok) {
    throw new Error(`model request failed ${response.status}`)
  }

  const data = await response.json()
  if (typeof data.message?.content !== "string") {
    throw new Error("model response did not include message.content")
  }

  return parseJson(data.message.content)
}

module.exports = {
  parseCommand
}

if (require.main === module) {
  const text = process.argv.slice(2).join(" ").trim()

  if (!text) {
    console.error('usage: node local_ai/parser.js "log leg curls 20 kg 3 sets"')
    process.exit(1)
  }

  parseCommand(text)
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message)
      process.exit(1)
    })
}
