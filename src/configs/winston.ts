import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WinstonModuleOptions,
  WinstonModuleOptionsFactory,
} from 'nest-winston';
import winston from 'winston';

const defaultLogFormat = (appName: string) =>
  winston.format.combine(
    winston.format.label({ label: appName }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.ms(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
  );
const consoleLogFormat = winston.format.printf((info) => {
  const { level, timestamp, label, message, metadata } = info;
  const ctx = metadata.context;
  const ms = metadata.ms;
  const stack = metadata.stack;
  const pid = metadata?.runtime?.pid || '';
  return `\x1B[32m[${label}] ${pid}  -\x1B[39m ${timestamp}     ${level} \x1B[33m[${ctx}]\x1B[39m ${message} \x1B[33m${ms}\x1B[39m${
    stack ? '\n\x1B[31m' + stack + '\x1B[39m' : ''
  } `;
});

@Injectable()
export class WinstonConfigService implements WinstonModuleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  async createWinstonModuleOptions(): Promise<WinstonModuleOptions> {
    const appName = this.configService.get<string>('app.name');
    const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
    const logDir = `/var/log/${appName.toLowerCase()}`;

    return {
      levels: winston.config.npm.levels,
      level,
      format: defaultLogFormat(appName),
      defaultMeta: {
        runtime: {
          pid: process.pid,
          platform: process.platform,
          versions: process.versions,
        },
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.timestamp({ format: 'MM/DD/YYYY, hh:mm:ss A' }),
            winston.format.metadata({
              fillExcept: ['label', 'timestamp', 'level', 'message'],
            }),
            consoleLogFormat,
          ),
          handleExceptions: true,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          handleRejections: true,
        }),
        new winston.transports.File({
          filename: `${logDir}/${level}-${Date.now()}.log`,
          format: winston.format.combine(winston.format.json()),
        }),
        new winston.transports.File({
          level: 'error',
          filename: `${logDir}/error-${Date.now()}.log`,
          format: winston.format.combine(winston.format.json()),
          handleExceptions: true,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          handleRejections: true,
        }),
      ],
      exitOnError: false,
    };
  }
}
