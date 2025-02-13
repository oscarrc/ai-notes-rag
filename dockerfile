# Use the official Node.js image as the base image
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Use a smaller base image for the final stage
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create the required directories
RUN mkdir -p /database /vault /models /data

# Set environment variables
ENV NEXT_PUBLIC_BASE_URL=http://192.168.0.242:3000/
ENV NEXT_PUBLIC_DB_PATH=/database
ENV NEXT_PUBLIC_DATA_PATH=/data
ENV NEXT_PUBLIC_MODELS_PATH=/models
ENV NEXT_PUBLIC_VAULT_PATH=/vault

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]