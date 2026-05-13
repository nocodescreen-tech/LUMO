# syntax=docker/dockerfile:1

# Stage 1: Build dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Stage 2: Production runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create directory for logs and backups
RUN mkdir -p logs backups && chown -R node:node /app

USER node
EXPOSE 5001

CMD ["node", "server.js"]
