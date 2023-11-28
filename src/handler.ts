import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { property } from './utils/property';
import { logger } from './utils/logger';
import { ContextConfiguration, Message, TextModel } from './model';
import { ImagineCommand } from './command/imagine';
import { ReimagineCommand } from './command/reimagine';
import { ConversationCommand } from './command/conversation';
import { TelegramBot } from './wrappers/bot';
import { handleExecution } from './wrappers/handlerWrapper';
import { BehaviourCommand } from './command/behave';
import { OpenAi } from './wrappers/ai/openai';
import { UserRegistry } from './user/registry';
import { TurboRegistry } from './user/turbo/turboRegistry';
import { DavinciRegistry } from './user/davinci/davinciRegistry';
import { TurboOpenAi } from './wrappers/ai/turbo/turboOpenAi';
import { DavinciOpenAi } from './wrappers/ai/davinci/davinciOpenAi';

/** Fetching env variables */
const BOT_TOKEN: string = property('BOT_TOKEN');
const OPEN_AI_KEY: string = property('OPEN_AI_KEY');
const AI_TEXT_MODEL: string = property('AI_TEXT_MODEL');
const AI_TEMPERATURE: string = property('AI_TEMPERATURE');
const AI_MAX_TOKENS: string = property('AI_MAX_TOKENS');
const AI_FREQUENCY_PENALTY: string = property('AI_FREQUENCY_PENALTY');
const AI_PRESENCE_PENALTY: string = property('AI_PRESENCE_PENALTY');
const CONTEXT_TOKENS_THRESHOLD: number = +property('CONTEXT_TOKENS_THRESHOLD');
const CONTEXT_SPLICE_THRESHOLD: number = +property('CONTEXT_SPLICE_THRESHOLD');
const BUCKET_NAME: string = property('BUCKET_NAME');

/** Instantiating and configuring mandatory objects */
const bot: TelegramBot = new TelegramBot(BOT_TOKEN);
const contextConfig: ContextConfiguration = {
  tokensThreshold: CONTEXT_TOKENS_THRESHOLD,
  spliceThreshold: CONTEXT_SPLICE_THRESHOLD,
}
let registry: UserRegistry;
let openai: OpenAi;
if (AI_TEXT_MODEL === TextModel.TURBO_3_5) {
  registry = new TurboRegistry(BUCKET_NAME, contextConfig);
  openai = TurboOpenAi.Builder
    .apiKey(OPEN_AI_KEY)
    .temperature(AI_TEMPERATURE)
    .textModel(AI_TEXT_MODEL)
    .maxTokens(AI_MAX_TOKENS)
    .frequencyPenalty(AI_FREQUENCY_PENALTY)
    .presencePenalty(AI_PRESENCE_PENALTY)
    .build();
} else if (AI_TEXT_MODEL === TextModel.DAVINCI) {
  registry = new DavinciRegistry(BUCKET_NAME, contextConfig)
  openai = DavinciOpenAi.Builder
    .apiKey(OPEN_AI_KEY)
    .temperature(AI_TEMPERATURE)
    .textModel(AI_TEXT_MODEL)
    .maxTokens(AI_MAX_TOKENS)
    .frequencyPenalty(AI_FREQUENCY_PENALTY)
    .presencePenalty(AI_PRESENCE_PENALTY)
    .build();
} else {
  throw new Error(`Unsupported text model: ${AI_TEXT_MODEL}`);
}

/** Handling bot commands */
const imagine: ImagineCommand = new ImagineCommand(bot, openai, registry);
const reimagine: ReimagineCommand = new ReimagineCommand(bot, openai, registry);
const conversation: ConversationCommand = new ConversationCommand(bot, openai, registry);
const behave: BehaviourCommand = new BehaviourCommand(bot, openai, registry);

const IMAGINE_PREFIX = '/imagine';
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

    const message: Message = body?.message || body?.callback_query.message
    const text: string | undefined = message?.text || body?.callback_query.data;
    if (!text) {
      logger.warn('Invoked with empty message or text');
      return;
    }

    if (text.startsWith(IMAGINE_PREFIX)) {
      message.text = text.replace(`${IMAGINE_PREFIX} `, '');
      await imagine.execute(message);

    } else if (text.startsWith(REIMAGINE_PREFIX)) {
      await reimagine.execute(message);

    } else if (text.startsWith(BEHAVE_PREFIX)) {
      message.text = text.replace(`${BEHAVE_PREFIX} `, '');
      await behave.execute(message);

    } else {
      await conversation.execute(message);
    }

    logger.debug('Finished response');
  });
