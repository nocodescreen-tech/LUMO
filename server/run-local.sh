#!/bin/bash
# Lanceur backend LUMO local — utilise DB_* (127.0.0.1:5433, pas de SSL)
cd "$HOME/Desktop/hubcommerce-project/server" || exit 1
unset DATABASE_URL
export NODE_ENV=development
exec node server.js
