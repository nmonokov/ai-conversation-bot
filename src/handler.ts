import { SNSEvent, SNSEventRecord } from 'aws-lambda';
import { property } from './utils/property';
import { logger } from './utils/logger';
import { ContextConfiguration, TextModel } from './model';
import { ImagineCommand } from './command/imagine';
import { ConversationCommand } from './command/conversation';
import { TelegramBot } from './wrappers/bot';
import { handleSnsExecution } from './wrappers/handlerWrapper';
import { BehaviourCommand } from './command/behave';
import { OpenAi } from './wrappers/ai/openai';
import { UserRegistry } from './user/registry';
import { TurboRegistry } from './user/turbo/turboRegistry';
import { DavinciRegistry } from './user/davinci/davinciRegistry';
import { TurboOpenAi } from './wrappers/ai/turbo/turboOpenAi';
import { DavinciOpenAi } from './wrappers/ai/davinci/davinciOpenAi';
import { AnalyseCommand } from './command/analyse';
import { SpeechToTextCommand } from './command/audio';
import { MaskCommand } from './command/mask';
import { ReimagineCommand } from './command/reimagine';

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
const analyse: AnalyseCommand = new AnalyseCommand(bot, openai, registry);
const speechToText: SpeechToTextCommand = new SpeechToTextCommand(bot, openai, registry);
const conversation: ConversationCommand = new ConversationCommand(bot, openai, registry);
const behave: BehaviourCommand = new BehaviourCommand(bot, openai, registry);
const mask: MaskCommand = new MaskCommand(bot, openai, registry);

const IMAGINE_PREFIX = '/imagine';
const REIMAGINE_PREFIX = '/reimagine';
const BEHAVE_PREFIX = '/behave';
const MASK_PREFIX = '/mask';

/**
 * Lambda handler to process message from the Telegram Bot.
 * Supported Commands:
 * - /imagine: image generation
 * - /reimagine: create image variation
 * - /behave: AI behavior change
 * - Photo: photo analysis
 * - Voice: audio-to-text conversion and conversation
 * - Other: general conversation handling
 * @param {SNSEvent} event - The SNS event triggered by incoming messages from Telegram.
 */
export const processMessage = async (event: SNSEvent): Promise<void> =>
  await handleSnsExecution(async () => {
    await Promise.all(event.Records.map(async (record: SNSEventRecord) => {
      const snsMessage = JSON.parse(record.Sns.Message);
      const { message, text } = snsMessage;
      logger.debug({ text });
      if (text?.startsWith(IMAGINE_PREFIX)) {
        logger.debug({ message: 'inside /imagine command ' });
        message.text = text.replace(`${IMAGINE_PREFIX} `, '');
        await imagine.execute(message);

      } else if (text.startsWith(REIMAGINE_PREFIX)) {
        await reimagine.execute(message);

      } else if (text?.startsWith(BEHAVE_PREFIX)) {
        logger.debug({ message: 'inside /behave command '});
        message.text = text?.replace(`${BEHAVE_PREFIX} `, '');
        await behave.execute(message);

      } else if (text?.startsWith(MASK_PREFIX)) {
        logger.debug({ message: 'inside /mask command '});
        message.text = text?.replace(`${MASK_PREFIX} `, '');
        await mask.execute(message);

      } else if (message.photo && message.photo.length > 0) {
        logger.debug({ message: 'inside analyse command '});
        await analyse.execute(message);

      } else if (message.voice) {
        logger.debug({ message: 'inside voice command '});
        await speechToText.execute(message);

      } else {
        logger.debug({ message: 'inside convo command '});
        await conversation.execute(message);
      }
    }));
    logger.debug('Finished response');
  });
