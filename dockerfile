# Use Debian-based Node.js image instead of Alpine for better library compatibility
FROM node:18-slim AS builder

# Set the working directory inside the container
WORKDIR /app

# Install dependencies required by ONNX Runtime
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Configure Next.js to bypass static optimization for AI components
RUN echo "module.exports = { ...require('./next.config.js'), output: 'standalone' }" > next.config.override.js && \
  mv next.config.override.js next.config.js

# Build the Next.js application
RUN npm run build

# Use a Debian-based image for the final stage
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create the data directory with required subdirectories
RUN mkdir -p /data/vault /data/database /data/models

# Set environment variables (matching your application code)
ENV NEXT_PUBLIC_BASE_URL=/
ENV NEXT_PUBLIC_DB_PATH=/database
ENV NEXT_PUBLIC_DATA_PATH=data
ENV NEXT_PUBLIC_MODEL_PATH=/models
ENV NEXT_PUBLIC_VAULT_PATH=/vault
ENV NODE_ENV=production

# Expose the port the app will run on
EXPOSE 3000

# Define volume for data persistence
VOLUME ["/data"]

# Command to run the application
CMD ["node", "server.js"]