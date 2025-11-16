# Multi-stage build for Cloudflare Workers backend
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on package manager
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Type check and build
RUN npx tsc --noEmit

# Stage 3: Runner (for local development with wrangler)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=development

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install wrangler globally
RUN npm install -g wrangler

# Expose wrangler dev port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8787/health || exit 1

# Start wrangler dev server
CMD ["wrangler", "dev", "--ip", "0.0.0.0"]
