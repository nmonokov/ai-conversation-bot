import winston, { format } from 'winston';
import dotenv from 'dotenv';
import { property } from './property';

dotenv.config();
const LOG_LEVEL: string = property('LOG_LEVEL', 'info');

/**
 * Instantiating logging with level selected from the env variables.
 * Log format example:
 * [2023-01-30 02:56:43] [debug]: {
 *   "message": "Enriched text value for an address search.",
 *   "enrichedText": "City name and some address"
 * }
 */
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf((info) => `[${info.timestamp}] [${info.level}]: ${getLogMessage(info)}`),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/all.log' }),
  ],
});

const getLogMessage = (info: any): string => {
  const filteredMessageObject: object = Object.keys(info)
    .filter((key: string) => (key !== 'timestamp' && key !== 'level'))
    .reduce((result: any, key: string) => {
      result[key] = info[key];
      return result;
    }, {});
  return JSON.stringify(filteredMessageObject, null, 2);
};
