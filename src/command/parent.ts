import { OpenAIApi } from 'openai';
import { CreateModerationResponseResultsInner } from 'openai/api';
import { Message, User } from '../model';
import { TelegramBot } from '../wrappers/bot';
import { UserContext } from '../user/user';

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

  protected getUser(message: Message, users: { [username: string]: User }) {
    const username = message.chat.username || '';
    let user: User = users[username];
    if (!user) {
      user = new UserContext(username);
      users[username] = user;
    }
    return user;
  }
}