# Build stage
FROM node:20 AS builder

# Install build dependencies for native modules (argon2)
RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20 AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (from Replit: 5000; confirm in server/index.ts)
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["node", "dist/index.cjs"]