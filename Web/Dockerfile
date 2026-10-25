FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/mmrates.db
WORKDIR /app
COPY --from=builder /app /app
RUN mkdir -p /data /app/backups && chown -R node:node /data /app/backups /app
USER node
VOLUME ["/data", "/app/backups"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/v1/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
