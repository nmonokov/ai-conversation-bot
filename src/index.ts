import dotenv from 'dotenv';
import TelegramBot, { Message } from 'node-telegram-bot-api';
import { property } from './utils/property';
import { WebHookServer } from './express';

dotenv.config();
const BOT_TOKEN: string = property('BOT_TOKEN');
const APPLICATION_URL: string = property('APPLICATION_URL');
const EXPRESS_PORT: string = property('EXPRESS_PORT');

const bot = new TelegramBot(BOT_TOKEN);
WebHookServer.Builder
  .url(APPLICATION_URL)
  .port(EXPRESS_PORT)
  .token(BOT_TOKEN)
  .bot(bot)
  .build()
.start();

/** Handling bot commands */

bot.onText(/\/imagine/, async (message: Message) => {
  console.log(message);
});

bot.on('message', async (message: Message) => {
  console.log(message);
});
