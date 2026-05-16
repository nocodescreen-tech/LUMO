# syntax=docker/dockerfile:1

# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY . .

RUN npm run build \
 && test -f build/index.html || (echo "ERROR: build/index.html not found!" && exit 1)

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=builder /app/build /usr/share/nginx/html

ENV PORT=80
ENV NGINX_API_UPSTREAM=http://localhost:5001

CMD ["nginx", "-g", "daemon off;"]