import TelegramBot from 'node-telegram-bot-api';
import express, { Express } from 'express';
import { logger } from './utils/logger';

/**
 * Express server to host the bot with web hooks.
 * POST /bot{token} - is a web hook which receives data from the telegram bot and reroutes it to the bot commands.
 *                    In order to secure public endpoint the bot token was added.
 * GET /health - is a simple health check
 */
export class WebHookServer {
  private readonly _url: string;
  private readonly _port: number;
  private readonly _token: string;
  private readonly _bot: TelegramBot;
  private readonly _app: Express;

  private constructor(url: string, port: number, token: string, bot: TelegramBot) {
    this._url = url;
    this._port = port;
    this._token = token;
    this._bot = bot;
    this._app = express();
    this._app.use(express.json());
  }

  start(): void {
    this.registerEndpoints();
    this.registerWebHook();
    this._app.listen(this._port, async () => {
      logger.info(`Express server is listening on ${this._port}`);
    });
  }

  private registerEndpoints(): void {
    this._app.post(`/bot${this._token}`, (request, response) => {
      this._bot.processUpdate(request.body);
      response.sendStatus(200);
    });
    this._app.get('/health', (request, response) => {
      response.sendStatus(200);
    });
  }

  private registerWebHook(): void {
    const telegramApiUrl = `https://api.telegram.org/bot${this._token}`;
    const webHookUrl = `${telegramApiUrl}/setWebhook?url=${this._url}/bot${this._token}&drop_pending_updates=false`;
    this._bot.setWebHook(webHookUrl);
  }

  static Builder = class {
    private static _url: string;
    private static _port: number;
    private static _token: string;
    private static _bot: TelegramBot;

    static url(url: string) {
      this._url = url;
      return this;
    }

    static port(port: string) {
      this._port = Number(port);
      return this;
    }

    static token(token: string) {
      this._token = token;
      return this;
    }

    static bot(bot: TelegramBot) {
      this._bot = bot;
      return this;
    }

    static build() {
      return new WebHookServer(this._url, this._port, this._token, this._bot);
    }
  };
}
