# Development Dockerfile for React application
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install development tools
RUN apk add --no-cache bash curl

# Copy package files
COPY package*.json ./

# Configure npm for better reliability
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Install all dependencies (including devDependencies for development)
RUN npm install

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactuser -u 1001 && \
    chown -R reactuser:nodejs /app

# Switch to non-root user
USER reactuser

# Expose port for React development server
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Health check for development server
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start React development server with hot reloading
CMD ["npm", "start"]