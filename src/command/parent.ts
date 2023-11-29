import { Message } from '../model';
import { TelegramBot } from '../wrappers/bot';
import { OpenAi } from '../wrappers/ai/openai';
import { UserRegistry } from '../user/registry';
import { Context } from '../user/context';

export abstract class ParentCommand {
  protected readonly _bot: TelegramBot;
  protected readonly _ai: OpenAi;
  protected readonly _registry: UserRegistry;

  constructor(bot: TelegramBot, ai: OpenAi, registry: UserRegistry) {
    this._bot = bot;
    this._ai = ai;
    this._registry = registry;
  }

  abstract execute(message: Message): void;

  protected async captureConversation(message: Message, input: string, answer: string): Promise<void> {
    const context: Context = await this._registry.getUserContext(message.chat.username);
    context.addUserEntry(input);
    context.addBotEntry(answer);
    await this._registry.storeUserContext(context);
  }
}