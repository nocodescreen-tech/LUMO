# syntax=docker/dockerfile:1

# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first so dependency layer is cached independently of source
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

# Run the build and stream output so any tsc/vite errors are visible in Railway logs
RUN echo "==> Starting npm run build..." \
 && npm run build \
 && echo "==> Build finished. Verifying output..." \
 && ls -lh build/ \
 && test -f build/index.html || (echo "ERROR: build/index.html not found — build output is missing!" && exit 1) \
 && echo "==> build/index.html confirmed. Artifact count: $(find build -type f | wc -l) files."

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:stable-alpine

# Remove the default Nginx config and copy our SPA-aware template
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

# Copy only the verified build artefacts from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Healthcheck: verify Nginx is serving index.html within 30 s of startup
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:80/ | grep -q "<html" || exit 1

EXPOSE 80
CMD ["/docker-entrypoint.d/env.sh"]
