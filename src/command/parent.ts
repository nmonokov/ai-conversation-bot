import { Message } from '../model';
import { TelegramBot } from '../wrappers/bot';
import { OpenAi } from '../wrappers/openai';
import { UserRegistry } from '../user/registry';

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
}