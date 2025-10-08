# alert-reporter

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Configuration

Set environment variables (e.g., via `.env` loaded by Bun automatically when present):

Required:

- `TARGET_URL` — URL to monitor
- `MALFUNCTION_SUBSTRING` — substring that must NOT appear in HTML
- `TELEGRAM_BOT_TOKEN` — Telegram bot token
- `TELEGRAM_CHAT_ID` — target chat id

Optional (defaults in parentheses):

- `CHECK_INTERVAL_MS` (120000)
- `RETRY_COUNT` (3)
- `RETRY_BASE_DELAY_MS` (2000)
- `ALERT_COOLDOWN_MS` (600000)
- `LATENCY_THRESHOLD_MS` (2000)
- `LATENCY_PERSISTENCE_MS` (600000)
- `DATA_RETENTION_DAYS` (7)

Example `.env`:

```
TARGET_URL=https://example.com
MALFUNCTION_SUBSTRING=Something went wrong
TELEGRAM_BOT_TOKEN=123456:ABCDEF
TELEGRAM_CHAT_ID=123456789
```
