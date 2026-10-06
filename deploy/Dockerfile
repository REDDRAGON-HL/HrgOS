FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY src/data/loginAccounts.ts ./src/data/loginAccounts.ts
ENV NODE_ENV=production PORT=4000
USER node
CMD ["node", "server/start.mjs"]
