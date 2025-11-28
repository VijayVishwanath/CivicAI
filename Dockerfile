## Build stage
FROM node:18 AS builder
WORKDIR /app

# Install dependencies and build
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . ./
RUN npm run build

## Production image
FROM node:18-alpine
WORKDIR /app

# Copy built frontend and mocks
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/mocks ./src/mocks
COPY --from=builder /app/server ./server

# Install a minimal runtime dependency
RUN apk add --no-cache curl
RUN npm install express

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.cjs"]
