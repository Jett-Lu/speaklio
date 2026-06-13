local ai setup

install ollama first if it is missing

irm https://ollama.com/install.ps1 | iex

close powershell and open it again

from the project folder run

powershell -ExecutionPolicy Bypass -File .\local_ai\setup.ps1

test it

ollama run speaklio-parser

try this

log leg curls 20 kg 3 sets

leave with

/bye

the app uses local_ai/parser.js

the setup downloads the model on each computer

do not add model files to github
