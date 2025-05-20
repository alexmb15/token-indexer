import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production'
    ? undefined                        // pure JSON to stdout
    : { target: 'pino-pretty', options: { colorize: true } }
});
