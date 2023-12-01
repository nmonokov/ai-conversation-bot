import { Message } from '../model';
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
    logger.debug({ message: 'Conversation', conversation: context.conversation()});
    let aiResponse: string = await this._ai.generateAnswer(context.conversation(), context.username);
    if (aiResponse === '' && attempt <= this._maxAttempts) {
      logger.debug({
        attempt,
        username: context.username,
      });
      attempt++;
      aiResponse = await this.askAi(context, attempt);
    }
    return aiResponse || '[Failed to generate message. Try once again.]';
  }
}
