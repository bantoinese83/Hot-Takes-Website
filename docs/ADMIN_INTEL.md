# Admin Intel Team (Ollama)

Local AI agents in **`/admin/intel`** that analyze live Supabase ops data on your Mac. Data never leaves your machine except to Ollama on `localhost`.

## Setup (24GB M4 Mac mini)

1. Install [Ollama](https://ollama.com) and keep it running.
2. Pull models:

   ```bash
   cd hottakedate-website
   npm run ollama:setup
   ```

   | Model | Role | ~VRAM |
   |-------|------|-------|
   | `llama3.2:3b` | Fast triage (moderation, queue) | ~2 GB |
   | `llama3.1:8b` | Daily briefs, growth, geo, community | ~5 GB |
   | `qwen2.5:14b` | Deep ops analysis | ~9 GB Q4 |

3. Configure admin Supabase env in `.env.local` (same as dashboard).
4. Run the site:

   ```bash
   npm run dev
   ```

5. Open **http://localhost:5173/admin/intel**

Vite proxies `/ollama` → `http://127.0.0.1:11434`.

## Agents

| Codename | Focus | Data loaded |
|----------|-------|-------------|
| **ORCHESTRATOR** | Executive summary | Full snapshot |
| **PULSE** | Funnel, waits, dates | Analytics hub |
| **SHIELD** | Report triage | Open moderation |
| **ROCKET** | Waitlists, growth | Analytics + growth |
| **MAP** | Geo density | Geography snapshot |
| **RADAR** | Live queue | Queue snapshot |
| **SPARK** | Community Takes | Prompts list |

**Run all agents** chains specialists, then stores a combined brief (also in `localStorage` key `ht_intel_last_brief`).

## Production note

Deployed static admin on Vercel **cannot** reach your Mac’s Ollama. Use Intel only locally, or add a private tunnel/API later.

## iOS matching embeddings

Production matching still uses OpenAI `text-embedding-3-small` via `generate-embedding`. Ollama is **not** wired into matching unless you deliberately migrate dimensions.
