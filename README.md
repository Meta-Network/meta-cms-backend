# Meta CMS Backend

## Requirements

- Node.js: >= 16 <17
- Nats: >= 2.7.0
- Redis: >= 6.0.0
- MySQL: >= 8.0.0
- Docker: latest
- Grafana + Loki: latest

## Installation

```shell
yarn install
```

Edit development config `config/config.development.yaml`

## Running the app

```shell
# development
yarn run start

# watch mode
yarn run start:dev

# debug mode
yarn run start:debug
```

## Test

```shell
# unit tests
yarn run test

# e2e tests
yarn run test:e2e

# test coverage
yarn run test:cov
```

## Production deployment

### Checkout production code

```
git checkout production
```

### Installation

```shell
yarn install
```

Edit `config.production.yaml`

### Migration database

```shell
yarn run typeorm migration:run
```

### Build and start

```shell
yarn run build
yarn run start:prod
```

## License

[MIT licensed](LICENSE).
