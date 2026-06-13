const fs = require("node:fs")
const path = require("node:path")

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "schema.json"), "utf8"))
const scope = fs.readFileSync(path.join(__dirname, "docs", "scope.md"), "utf8")

async function parseCommand(text) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "post",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.local_model || "speaklio-parser",
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

  if (!response.ok) {
    throw new Error(`model request failed ${response.status}`)
  }

  const data = await response.json()
  return JSON.parse(data.message.content)
}

module.exports = {
  parseCommand
}
