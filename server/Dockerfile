FROM cgr.dev/chainguard/node:latest-dev AS build
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .
RUN npx tsc && npm prune --omit=dev

FROM cgr.dev/chainguard/node:latest
WORKDIR /home/node/app
COPY --from=build --chown=node:node /home/node/app/node_modules ./node_modules
COPY --from=build --chown=node:node /home/node/app/dist ./dist
COPY --from=build --chown=node:node /home/node/app/package.json ./package.json

EXPOSE 3001

ENV NODE_ENV=production \
    PORT=3001 \
    DB_PATH=/home/node/app/data/database.db

CMD ["dist/index.js"]
