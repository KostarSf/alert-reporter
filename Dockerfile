# syntax=docker/dockerfile:1

FROM oven/bun:alpine

WORKDIR /app

# Install curl and wget
RUN apk add --no-cache curl wget

# Copy manifests first for better caching
COPY package.json bun.lock tsconfig.json ./

# Install deps
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Create volume for SQLite database file
VOLUME ["/app/monitor-data"]
ENV DB_FILE_PATH=/app/monitor-data/monitor.db

# Use env to redirect DB path to the volume via BUN_DB_PATH if needed in future
ENV NODE_ENV=production

# Default command
CMD ["bun", "run", "index.ts"]
