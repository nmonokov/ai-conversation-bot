import { Message, User } from '../model';
import { TelegramBot } from '../wrappers/bot';
import { UserContext } from '../user/user';
import { OpenAi } from '../wrappers/openai';

export abstract class ParentCommand {
  protected readonly _bot: TelegramBot;
  protected readonly _ai: OpenAi;

  constructor(bot: TelegramBot, ai: OpenAi) {
    this._bot = bot;
    this._ai = ai;
  }

  abstract execute(message: Message, users?: { [username: string]: User }): void;

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