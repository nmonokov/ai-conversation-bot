import dotenv from 'dotenv';
import TelegramBot, { Message } from 'node-telegram-bot-api';
import { property } from './utils/property';
import { WebHookServer } from './express';
import { Configuration, OpenAIApi } from 'openai';
import { ImagineCommand } from './command/imagine';
import { ConversationCommand } from './command/conversation';
import { ReimagineCommand } from './command/reimagine';
import { User } from './model';

dotenv.config();
const BOT_TOKEN: string = property('BOT_TOKEN');
const APPLICATION_URL: string = property('APPLICATION_URL');
const EXPRESS_PORT: string = property('EXPRESS_PORT');
const OPEN_AI_API_KEY: string = property('OPEN_AI_API_KEY');
/**
 * TODO: add OpenAI config
 * TODO: add AI behavior change
 * TODO: change /reimagine to a button
 */

const bot = new TelegramBot(BOT_TOKEN);
WebHookServer.Builder
  .url(APPLICATION_URL)
  .port(EXPRESS_PORT)
  .token(BOT_TOKEN)
  .bot(bot)
  .build()
.start();
const configuration: Configuration = new Configuration({ apiKey: OPEN_AI_API_KEY });
const openai: OpenAIApi = new OpenAIApi(configuration);
const users: { [username: string]: User } = {};

/** Handling bot commands */
const imagine: ImagineCommand = new ImagineCommand(bot, openai);
const reimagine: ReimagineCommand = new ReimagineCommand(bot, openai);
const conversation: ConversationCommand = new ConversationCommand(bot, openai);

bot.onText(/\/imagine(.*)/, async (message: Message, match: RegExpExecArray | null) => {
  await imagine.execute(message, match);
});

bot.onText(/\/reimagine/, async (message: Message) => {
  await reimagine.execute(message);
});

bot.on('message', async (message: Message) => {
  await conversation.execute(message, null, users);
});
