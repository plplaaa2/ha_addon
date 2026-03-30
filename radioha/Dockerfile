FROM node:20-alpine

# Install ffmpeg and ca-certificates
RUN apk add --no-cache ffmpeg ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY index.js radio-list.json run.sh ./
COPY public ./public
RUN chmod +x run.sh

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3005', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})" || exit 1

# Start application
CMD ["node", "index.js"]
