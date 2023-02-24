import { OpenAIApi } from 'openai';
import { CreateModerationResponseResultsInner } from 'openai/api';
import { Message, User } from '../model';
import { TelegramBot } from '../utils/bot';

export abstract class ParentCommand {
  protected readonly _bot: TelegramBot;
  protected readonly _ai: OpenAIApi;

  constructor(bot: TelegramBot, ai: OpenAIApi) {
    this._bot = bot;
    this._ai = ai;
  }

  abstract execute(message: Message, users?: { [username: string]: User }): void;

  protected async isProhibited(prompt: string) {
    const moderationResponse = await this._ai.createModeration({
      model: 'text-moderation-latest',
      input: prompt,
    });
    const found: CreateModerationResponseResultsInner | undefined = moderationResponse.data.results
      .find((result: CreateModerationResponseResultsInner) => result.flagged);
    return found !== undefined;
  }
}