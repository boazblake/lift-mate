This is the Lift-Mate project — a mobile fitness app with real-time pose estimation.

Available subagents:
- **designer** — UI/UX designer agent. Use "general" subagent type (not "designer" — model config issue). Load designer instructions from `.opencode/agent/designer.md` for full context.

Design mockups: `docs/design/` — contains interactive HTML mockups + specs for all 4 screens (Home, Exercise, Playback, Progress).

Task tracking: `TASKS.md` at repo root — I maintain this during sessions. Check it first for current state.

Key commands:
- `npm run goweb` — run web dev server with SSL
- `npm run goios` — run on iOS
- `npm run buildweb` — build for web
- `test:e2e` and `test:unit` scripts defined but no test framework installed yet
