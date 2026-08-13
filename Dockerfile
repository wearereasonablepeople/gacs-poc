FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN npm install
COPY shared ./shared
COPY server ./server
COPY web ./web
RUN npm run build -w web

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PATH=/data/submissions.sqlite
COPY package.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN npm install --omit=dev && npm install -w server tsx
COPY shared ./shared
COPY server ./server
COPY --from=build /app/web/dist ./web/dist
RUN mkdir -p /data
EXPOSE 4000
CMD ["npx", "tsx", "server/src/index.ts"]
