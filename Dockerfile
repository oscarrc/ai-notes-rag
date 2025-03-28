# Use Debian-based Node.js image instead of Alpine for better library compatibility
FROM node:18-slim AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application (normal build)
RUN npm run build

# Use a Debian-based image for the final stage
FROM node:18-slim AS runner

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Create the data directory with required subdirectories
RUN mkdir -p /data/vault /data/database /data/models

# Set environment variables for the application
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BASE_URL=/
ENV NEXT_PUBLIC_DB_PATH=/data/database
ENV NEXT_PUBLIC_DATA_PATH=/data
ENV NEXT_PUBLIC_MODEL_PATH=/data/models
ENV NEXT_PUBLIC_VAULT_PATH=/data/vault

# Expose the port the app will run on
EXPOSE 3000

# Define volume for data persistence
VOLUME ["/data"]

# Command to run the application
# Set host to listen on all interfaces
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
