# Speaklio Local AI

This directory contains the local Ollama parser setup for AI-assisted logging.

The backend calls this local parser through Ollama when using:

- `POST /ai/parse-command`
- `POST /ai/preview-entry` with raw text

The parser is local-development tooling. It should not write directly to Supabase.

## Setup

Install Ollama first if it is missing:

```powershell
irm https://ollama.com/install.ps1 | iex
```

Close PowerShell and open it again.

From the project folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\local_ai\setup.ps1
```

## Test It

```powershell
ollama run speaklio-parser
```

Try:

```text
log leg curls 20 kg 3 sets
```

Leave with:

```text
/bye
```

## Files

- `schema.json` - expected structured parser output shape.
- `docs/scope.md` - parser behavior and supported action scope.
- `modelfile` - Ollama model instructions.
- `setup.ps1` - local setup script.
- `parser.js` - standalone local parser helper.

The setup downloads/builds the model on each computer.

Do not add model files to GitHub.
