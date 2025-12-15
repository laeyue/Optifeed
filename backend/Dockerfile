FROM node:20-alpine AS base

WORKDIR /app

# Install production dependencies first (better layer caching)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend sources
COPY backend ./backend

# Copy static assets served by Express from the repo root
COPY css ./css
COPY *.html ./
COPY *.js ./

ENV NODE_ENV=production
WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "server.js"]

