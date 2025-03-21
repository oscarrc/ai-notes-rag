FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /data/vault /data/database /data/models

ENV NEXT_PUBLIC_BASE_URL=/
ENV NEXT_PUBLIC_DB_PATH=/database
ENV NEXT_PUBLIC_DATA_PATH=data
ENV NEXT_PUBLIC_MODEL_PATH=/models
ENV NEXT_PUBLIC_VAULT_PATH=/vault

EXPOSE 3000

VOLUME ["/data"]

CMD ["npm", "start"]