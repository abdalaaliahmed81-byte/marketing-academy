FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS api
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 ACADEMY_DATA_DIR=/data
RUN mkdir -p /data && chown node:node /data
COPY --from=build --chown=node:node --chmod=0444 /app/build/server.mjs /app/build/server.mjs
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s CMD ["node","-e","fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node","build/server.mjs"]

FROM nginxinc/nginx-unprivileged:stable-alpine AS web
COPY --chown=101:101 --chmod=0444 infrastructure/nginx-api.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s CMD wget -Y off -q -O /dev/null http://127.0.0.1:8080/ || exit 1
