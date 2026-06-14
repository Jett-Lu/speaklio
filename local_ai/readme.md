local ai setup

install ollama first if it is missing

irm https://ollama.com/install.ps1 | iex

close powershell and open it again

from the project folder run

powershell -ExecutionPolicy Bypass -File .\local_ai\setup.ps1

test the raw model

ollama run speaklio-parser

try this

log leg curls 20 kg 3 sets

leave with

/bye

test the app parser path

node .\local_ai\parser.js "log leg curls 20 kg 3 sets"

the app parser reads local_ai/docs/scope.md and local_ai/schema.json

the parser calls ollama at http://localhost:11434/api/chat

the model name defaults to speaklio-parser

you can override it with LOCAL_MODEL

the setup downloads the model on each computer

do not add model files to github
