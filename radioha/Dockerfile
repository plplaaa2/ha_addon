FROM node:20-alpine

# Install ffmpeg and ca-certificates
RUN apk add --no-cache ffmpeg ca-certificates

WORKDIR /app

# Copy package files (package-lock.json will be copied if present)
COPY package*.json ./

# Install dependencies: use npm ci when lockfile present, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi \
    && npm cache clean --force

# Copy application files
COPY index.js radio-list.json run.sh ./
COPY public ./public
RUN chmod +x run.sh

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005', (r) => { if (r.statusCode !== 404) throw new Error(r.statusCode) })" || exit 1

CMD ["node", "index.js"]
