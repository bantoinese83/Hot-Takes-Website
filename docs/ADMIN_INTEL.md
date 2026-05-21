# Admin Intel Team

AI agents on **`/admin/intel`** analyze live Supabase ops data.

## Providers (automatic)

| Where | Provider | Model |
|-------|----------|--------|
| **Local** `npm run dev` + Ollama running | Ollama on your Mac | Per-agent (team brief uses `llama3.2:3b`) |
| **Production** `hottakdate.com/admin/intel` | Gemini via Edge Function | `gemini-3.5-flash` (default), `thinking: low` |

Priority: if Ollama is reachable in dev, use Ollama; otherwise use Gemini.

## Setup — local Ollama

```bash
cd hottakedate-website
npm run ollama:setup   # llama3.2:3b, llama3.1:8b, qwen2.5:14b
npm run dev
# http://localhost:5173/admin/intel
```

Vite proxies `/ollama` → `http://127.0.0.1:11434`.

## Setup — remote Gemini

1. [Google AI Studio](https://aistudio.google.com/apikey) → create API key (free tier eligible models).

2. Deploy edge function (from dating-app repo):

   ```bash
   cd hot-takes-dating-app
   supabase secrets set GEMINI_API_KEY=your_key_here
   # Optional cheaper model:
   # supabase secrets set GEMINI_INTEL_MODEL=gemini-2.5-flash-lite
   supabase functions deploy admin-intel
   ```

3. Open **`https://hottakdate.com/admin/intel`** — status should show **Active: Gemini (cloud)**.

Uses stable **`generateContent`** API (not Interactions beta). Secrets stay on Supabase; the browser never sees `GEMINI_API_KEY`.

## Agents

| Codename | Focus |
|----------|--------|
| ORCHESTRATOR | Executive summary |
| PULSE | Funnel, waits, dates |
| SHIELD | Moderation triage |
| ROCKET | Waitlists / growth |
| MAP | Geography |
| RADAR | Live queue |
| SPARK | Community prompts |

**Run team brief** — all agents sequentially; Ollama uses only `llama3.2:3b` + unload between steps to avoid RAM spikes on 24GB Macs.

## iOS matching

Production matching still uses OpenAI embeddings (`generate-embedding`). Intel does not change matching vectors.
