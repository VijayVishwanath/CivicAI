## Build stage
FROM node:18 AS builder
WORKDIR /app

# Install dependencies and build
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . ./
RUN npm run build

## Production image (use debian-slim for compatibility)
FROM node:18-slim
WORKDIR /app

# Copy built frontend and mocks and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/mocks ./src/mocks
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install only production dependencies to keep image small and compatible
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm install --production --legacy-peer-deps

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.cjs"]
