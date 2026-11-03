# Use official lightweight Node.js 20 (Debian slim for maximum native compatibility)
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci --omit=dev

# Copy application source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Production runner stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy dependencies and application files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts

# Create uploads and local data directories with permissions
RUN mkdir -p uploads data && chown -R node:node /app

# Run as non-root user for security
USER node

EXPOSE 5001

# Healthcheck to monitor API container health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5001/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Express server
CMD ["node", "src/index.js"]

