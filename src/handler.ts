import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { property } from './utils/property';
import { logger } from './utils/logger';
import { Configuration, OpenAIApi } from 'openai';
import { Message, User } from './model';
import { ImagineCommand } from './command/imagine';
import { ReimagineCommand } from './command/reimagine';
import { ConversationCommand } from './command/conversation';
import { TelegramBot } from './wrappers/bot';
import { handleExecution } from './wrappers/handlerWrapper';
import { BehaviourCommand } from './command/behave';

/**
 * TODO: add OpenAI config
 * TODO: change /reimagine to a button
 * TODO: Revamp user and bot entries
 * TODO: Retry if empty AI response
 */

const BOT_TOKEN: string = property('BOT_TOKEN');
const OPEN_AI_KEY: string = property('OPEN_AI_KEY');

const bot: TelegramBot = new TelegramBot(BOT_TOKEN);
const configuration: Configuration = new Configuration({ apiKey: OPEN_AI_KEY });
const openai: OpenAIApi = new OpenAIApi(configuration);
const users: { [username: string]: User } = {};

/** Handling bot commands */
const imagine: ImagineCommand = new ImagineCommand(bot, openai);
const reimagine: ReimagineCommand = new ReimagineCommand(bot, openai);
const conversation: ConversationCommand = new ConversationCommand(bot, openai);
const behave: BehaviourCommand = new BehaviourCommand(bot, openai);

const IMAGINE_PREFIX = '/imagine ';
const REIMAGINE_PREFIX = '/reimagine';
const BEHAVE_PREFIX = '/behave';

/**
 * Lambda handler to process message to the Telegram Bot.
 */
export const botWebhook = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> =>
  await handleExecution(async () =>{
    const body: any = JSON.parse(event.body || '{}');
    logger.debug({
      message: 'Capturing message.',
      body,
    });

    const message: Message = body?.message
    const text: string | undefined = message?.text;
    if (!text) {
      logger.warn('Invoked with empty message or text');
      return;
    }

    if (text.startsWith(IMAGINE_PREFIX)) {
      message.text = text.replace(IMAGINE_PREFIX, '');
      await imagine.execute(message);
    } else if (text.startsWith(REIMAGINE_PREFIX)) {
      await reimagine.execute(message);
    } else if (text.startsWith(BEHAVE_PREFIX)) {
      message.text = text.replace(BEHAVE_PREFIX, '');
      await behave.execute(message, users);
    }
    else {
      await conversation.execute(message, users);
    }

    logger.debug('Finished response');
  });

