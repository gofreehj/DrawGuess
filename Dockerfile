# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with optimizations
RUN npm ci --only=production --no-audit --no-fund \
    && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BUILD_STANDALONE=true

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Create necessary directories with proper permissions
RUN mkdir -p ./data/backups ./logs ./.next \
    && chown -R nextjs:nodejs ./data ./logs ./.next

# Copy the public folder
COPY --from=builder /app/public ./public

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy database initialization script
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/init-database.ts ./src/lib/

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Add labels for better container management
LABEL maintainer="Drawing Guessing Game Team"
LABEL version="1.0.0"
LABEL description="Drawing Guessing Game - AI-powered drawing recognition"

# Health check with improved configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]