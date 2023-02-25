import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { property } from './utils/property';
import { logger } from './utils/logger';
import { Message, User } from './model';
import { ImagineCommand } from './command/imagine';
import { ReimagineCommand } from './command/reimagine';
import { ConversationCommand } from './command/conversation';
import { TelegramBot } from './wrappers/bot';
import { handleExecution } from './wrappers/handlerWrapper';
import { BehaviourCommand } from './command/behave';
import { OpenAi } from './wrappers/openai';

/**
 * TODO: change /reimagine to a button
 */

const BOT_TOKEN: string = property('BOT_TOKEN');
const OPEN_AI_KEY: string = property('OPEN_AI_KEY');
const AI_TEXT_MODEL: string = property('AI_TEXT_MODEL');
const AI_TEMPERATURE: string = property('AI_TEMPERATURE');
const AI_MAX_TOKENS: string = property('AI_MAX_TOKENS');
const AI_FREQUENCY_PENALTY: string = property('AI_FREQUENCY_PENALTY');
const AI_PRESENCE_PENALTY: string = property('AI_PRESENCE_PENALTY');

const bot: TelegramBot = new TelegramBot(BOT_TOKEN);
const users: { [username: string]: User } = {};
const openai: OpenAi = OpenAi.Builder
  .apiKey(OPEN_AI_KEY)
  .temperature(AI_TEMPERATURE)
  .textModel(AI_TEXT_MODEL)
  .maxTokens(AI_MAX_TOKENS)
  .frequencyPenalty(AI_FREQUENCY_PENALTY)
  .presencePenalty(AI_PRESENCE_PENALTY)
  .build();

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
  await handleExecution(async () => {
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
    } else {
      await conversation.execute(message, users);
    }
    logger.debug('Finished response');
  });
