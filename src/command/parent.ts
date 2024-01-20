import { AnswerData, Message } from '../model';
import { TelegramBot } from '../wrappers/bot';
import { OpenAi } from '../wrappers/ai/openai';
import { UserRegistry } from '../user/registry';
import { Context } from '../user/context';
import { logger } from '../utils/logger';

export abstract class ParentCommand {
  protected readonly _bot: TelegramBot;
  protected readonly _ai: OpenAi;
  protected readonly _registry: UserRegistry;
  private readonly _maxAttempts = 3;

  constructor(bot: TelegramBot, ai: OpenAi, registry: UserRegistry) {
    this._bot = bot;
    this._ai = ai;
    this._registry = registry;
  }

  abstract execute(message: Message): void;

  protected async askAi(context: Context, currentAttempt?: number) {
    let attempt = currentAttempt || 1;
    const conversation = context.conversation();
    logger.debug({ message: 'Conversation', conversation });
    let answerData: AnswerData = await this._ai.generateAnswer(conversation, context.username);
    if (answerData.answer === '' && attempt <= this._maxAttempts) {
      logger.debug({
        attempt,
        username: context.username,
      });
      attempt++;
      answerData = await this.askAi(context, attempt);
    } else if (attempt > this._maxAttempts) {
      answerData.answer = '[Failed to generate message. Try once again.]';
    }
    return answerData;
  }
}
