FROM node:20-alpine AS base
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

COPY --from=base /app/package.json ./
COPY --from=base /app/tsconfig.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma

EXPOSE 4000 5555

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx ts-node --compiler-options '{\"module\":\"commonjs\"}' prisma/seed.ts && node dist/main"]
