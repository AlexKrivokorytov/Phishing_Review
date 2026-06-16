FROM cgr.dev/chainguard/node:latest-dev AS build

WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
RUN npm install

COPY --chown=node:node . .

# We need to set the API URL at build time for Vite
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Serve stage — Chainguard nginx has 0 known CVEs
FROM cgr.dev/chainguard/nginx:latest

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /home/node/app/dist /usr/share/nginx/html

# Chainguard nginx runs on port 8080 (non-root)
EXPOSE 8080
