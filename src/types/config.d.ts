import { BullModuleOptions } from '@nestjs/bull';
import { NatsOptions } from '@nestjs/microservices';

type DockerProcessor = {
  image: string;
  env: {
    logging: { level: string; debug: boolean };
    backend: { url: string };
    loki: { url: string };
    '7zip': { binName: string };
  };
  volumes: { tmp: string };
};
type MockProcessorProgress = {
  value: number;
  timeout: number;
};
type MockProcessor = {
  progress: MockProcessorProgress[];
  successRate: number;
  timeout: number;
};
type WorkerProcessor = {
  type: string;
  docker: { image: string; app: { name: string } };
};

type App = {
  app: { name: string; port: string; bodyParser: { limit: string } };
};
type Database = {
  db: {
    host: string;
    username: string;
    password: string;
    database: string;
    charset: string;
    timezone: string;
  };
};
type Redis = {
  redis: { host: string; port: number; user: string; pass: string };
};
type CORS = {
  cors: { origins: string[] };
};
type JWT = {
  jwt: {
    ucenter: {
      cookieName: string;
      verify: { issuer: string; audience: string };
    };
    cms: {
      symmetricKey: string;
      sign: { expiresIn: string; issuer: string; audience: string };
    };
  };
};
type Swagger = {
  swagger: { enable: boolean };
};
type Logger = {
  logger: { loki: { enable: boolean; url: string } };
};
type Microservice = {
  microservice: {
    server: NatsOptions;
    clients: { ucenter: NatsOptions; network: NatsOptions };
  };
};
type Provider = {
  provider: {
    dns: { type: string; cloudflare: { token: string; zoneId: string } };
    publisher: {
      github: {
        httpsEnforced: boolean;
        updateDomainName: { timeouts: number[] };
      };
    };
    metadataStorage: {
      ipfs: {
        fleek: { apiKey: string; apiSecret: string; folder: string };
        gateways: string[];
        blockchain: {
          rpc: string;
          chainId: number;
          privateKey: string;
          contractAddress: string;
        };
      };
      arweave: {
        walletKeyPath: string;
        host: string;
        port: number;
        protocol: string;
      };
    };
  };
};
type Task = {
  task: {
    processor: { docker: DockerProcessor; mock: MockProcessor };
    worker: {
      git: { queue: BullModuleOptions; processor: WorkerProcessor };
      hexo: { queue: BullModuleOptions; processor: WorkerProcessor };
    };
    workspace: { lock: { ttl: number } };
  };
};
type Post = {
  post: { preprocessor: { urlprefix: string }; matataki: { key: string } };
};
type MetaSpace = {
  metaSpace: {
    gateway: { ipfs: { baseUrl: string }; dataViewer: { baseUrl: string } };
    prefix: { reserve: string[]; disable: string[] };
    baseDomain: string;
  };
};
type MetaSignature = {
  metaSignature: {
    serverKeys: { private: string; public: string };
    serverDomain: string;
  };
};
type Pipeline = {
  pipeline: {
    queue: BullModuleOptions;
    dispatcher: {
      autoDispatchWorkerTask: boolean;
      wipLimit: number;
      number: number;
      requestNextTaskIntervalMs: number;
    };
    processor: {
      type: string;
      consumer: { process: { concurrency: number } };
      docker: DockerProcessor;
      mock: MockProcessor;
    };
  };
};
type Management = {
  management: {
    domain: {
      chainId: number;
      name: string;
      version: string;
      verifyingContract: string;
    };
    serverSign: {
      network: { name: string; chainId: number; url: string };
      privateKey: string;
    };
    authorization: { expiresInMinutes: number };
  };
};

// TODO: use nestjs ConfigService generics feature
// when `TS2589: Type instantiation is excessively deep and possibly infinite` fixed
export type Configuration = App &
  Database &
  Redis &
  CORS &
  JWT &
  Swagger &
  Logger &
  Microservice &
  Provider &
  Task &
  Post &
  MetaSpace &
  MetaSignature &
  Pipeline &
  Management;
