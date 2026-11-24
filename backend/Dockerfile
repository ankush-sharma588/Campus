FROM node:22.23.5-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Install the exact dependency tree recorded in package-lock.json.
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# Use the unprivileged user provided by the official Node image.
COPY --chown=node:node . .
USER node

EXPOSE 4518
HEALTHCHECK --interval=30s --timeout=5s --start-period=35s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4518/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]
