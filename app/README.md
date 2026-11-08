# Mathematical Reading Agent — application foundation

This is the **real-app scaffold**, deliberately separate from `prototypes/s02-dashboard/index.html`.

## Run locally
```sh
cd app
npm install
npm run typecheck
npm run build
npm run dev
```

## Scope of this initial increment
- React + TypeScript + Vite, dark project dashboard and S02 two-panel workspace.
- New Session dialog with printed-page-range validation, browser-local session storage, resume on page reload, session deletion, and a page-position tracker.
- Collapsible reading plan container only; **no generated plan**.
- **No real PDF, LLM, backend, accounts, or cross-device sync**.

The original scripted S02/S07/S23–S25 prototype remains unmodified.
