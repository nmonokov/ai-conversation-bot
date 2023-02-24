import { ParentCommand } from './parent';
import { Message, User } from '../model';
import { logger } from '../utils/logger';

/**
 * /behave command changes the AI behaviour to a selected prompt.
 * The conversation context will be reseted in the result to apply new behaviour.
 */
export class BehaviourCommand extends ParentCommand {

  async execute(message: Message, users: { [username: string]: User }): Promise<void> {
    const chatId = message.chat.id;
    const prompt = message.text || '';
    const prohibited: boolean = await this._ai.isProhibited(prompt);
    if (prohibited) {
      await this._bot.sendMessage(chatId, 'Sorry, can\'t generate this');
      return;
    }
    const user = this.getUser(message, users);
    user.changeBehaviour(prompt);
    logger.debug({
      message: 'Successfully changed behavior.',
      user: user.username,
      behaviour: prompt,
    });
  }
}
