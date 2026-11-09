# AI chat backend (Implementation 2, Stage A)

A minimal Node 20+ HTTP server. It sends only the selected conversation's last 30 user/assistant messages to OpenAI. No PDF content, files, citations, or other sessions are sent. The browser still stores messages in localStorage.

## Start
Set `OPENAI_API_KEY` securely in the backend environment (never in the React frontend or GitHub Pages).
Set `ALLOWED_ORIGINS` to the exact web origin(s), comma-separated. For GitHub Pages, use `https://minhpham2003.github.io` (origin only; no path).
Optionally set `OPENAI_MODEL` and `PORT` (defaults to `gpt-4.1-mini` and `8787`).
Run `node server/index.mjs` from the repo root.

Locally, run the Vite app with `VITE_AI_API_URL=http://localhost:8787` in the **frontend build environment**. For a public deployment, use a deployed HTTPS backend URL and rebuild the frontend with that variable.

The backend must be deployed separately; GitHub Pages cannot execute Node services. Do not put API keys in Vite variables. The backend intentionally has no user authentication or durable storage yet; configure a private environment and add authentication, abuse controls, and rate limits before publicly exposing it.

## Check
`curl http://localhost:8787/health` confirms the service is running and whether a server-side API key is configured. It does not test a model response.
