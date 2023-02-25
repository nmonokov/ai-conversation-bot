import { property } from './property';

const SELECTED_LEVEL: string = property('LOG_LEVEL', 'info');

interface Level {
  position: number;
  value: string;
}

const LOG_LEVELS: any = {
  debug: {
    position: 0,
    value: 'debug',
  },
  info: {
    position: 1,
    value: 'info',
  },
  warn: {
    position: 2,
    value: 'warn',
  },
  error: {
    position: 3,
    value: 'error',
  },
};

class Logger {
  private _level: string
  constructor(level: string) {
    this._level = level;
  }

  private log(level: Level, message: any) {
    if (level.position >= LOG_LEVELS[SELECTED_LEVEL.toLowerCase()].position) {
      const formattedMessage = typeof message === 'string' ? { message } : message;
      try {
        // @ts-ignore
        console[level.value](JSON.stringify(formattedMessage, null, 2));
      } catch (error) {
        console.error({ message: 'Failed to write a log.', error });
      }
    }
  }

  public debug(message: any) {
    this.log(LOG_LEVELS.debug, message);
  }

  public info(message: any) {
    this.log(LOG_LEVELS.info, message);
  }

  public warn(message: any) {
    this.log(LOG_LEVELS.warn, message);
  }

  public error(message: any) {
    this.log(LOG_LEVELS.error, message);
  }
}

export const logger = new Logger(SELECTED_LEVEL);
