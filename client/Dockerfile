# syntax=docker/dockerfile:1

# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine
# Copy the build output from the builder stage
# Note: your build output is in 'build' folder according to my previous check
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config if needed (optional but recommended for SPAs)
# For now, we'll use a basic config that handles routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
