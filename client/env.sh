#!/bin/sh
set -e

# Inject environment variables into nginx config at runtime (Railway env vars available here)
# VITE_API_BASE_URL -> NGINX_API_UPSTREAM for proxy usage
export API_UPSTREAM="${NGINX_API_UPSTREAM:-http://localhost:5001}"

envsubst '$API_UPSTREAM' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
