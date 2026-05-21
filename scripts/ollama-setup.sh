#!/usr/bin/env bash
# Hot Take admin intel — Ollama models for 24GB Apple Silicon (M4 Mac mini).
# Run: ./scripts/ollama-setup.sh
set -euo pipefail

if ! command -v ollama >/dev/null 2>&1; then
  echo "Install Ollama: https://ollama.com/download"
  exit 1
fi

echo "==> Checking Ollama daemon..."
if ! curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "Start Ollama (app or: ollama serve) then re-run this script."
  exit 1
fi

# Scout (fast triage, ~2GB) | Workhorse (briefs, ~4.7GB) | Analyst (deep ops, ~9GB Q4)
MODELS=(
  "llama3.2:3b"
  "llama3.1:8b"
  "qwen2.5:14b"
)

for m in "${MODELS[@]}"; do
  echo ""
  echo "==> Pulling ${m}..."
  ollama pull "$m"
done

echo ""
echo "Done. Models installed:"
ollama list
echo ""
echo "Admin intel: npm run dev → http://localhost:5173/admin/intel"
