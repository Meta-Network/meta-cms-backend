FROM node:14-alpine3.14 AS builder
WORKDIR /opt/MetaNetwork/CMSBackend
COPY . .
RUN yarn install --frozen-lockfile && yarn run build

FROM node:14-alpine3.14
WORKDIR /opt/MetaNetwork/CMSBackend
ENV NODE_ENV=production
COPY --from=builder /opt/MetaNetwork/CMSBackend/package.json /opt/MetaNetwork/CMSBackend/yarn.lock ./
COPY --from=builder /opt/MetaNetwork/CMSBackend/dist dist
RUN yarn install --production --frozen-lockfile
CMD ["--enable-source-maps","dist/main.js"]
