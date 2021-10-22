FROM node:14-alpine3.14 AS builder
WORKDIR /opt/MetaNetwork/CMSBackend
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn run build
RUN npm prune --production

FROM node:14-alpine3.14
WORKDIR /opt/MetaNetwork/CMSBackend
ENV NODE_ENV=production
COPY --from=builder /opt/MetaNetwork/CMSBackend/dist ./dist
COPY --from=builder /opt/MetaNetwork/CMSBackend/node_modules ./node_modules
CMD ["--enable-source-maps","dist/main.js"]
