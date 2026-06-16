FROM cgr.dev/chainguard/node:latest-dev AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM cgr.dev/chainguard/node:latest

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/database.db

CMD ["npm", "run", "start"]
