import { ParentCommand } from './parent';
import { Message } from '../model';
import { logger } from '../utils/logger';
import { Context } from '../user/context';

/**
 * /behave command changes the AI behaviour to a selected prompt.
 * The conversation context will be reset in the result to apply new behaviour.
 */
export class BehaviourCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    const chatId = message.chat.id;
    const prompt = message.text || '';
    const prohibited: boolean = await this._ai.isProhibited(prompt);
    if (prohibited) {
      await this._bot.sendMessage(chatId, 'Sorry, can\'t use this behavior');
      return;
    }
    const user: Context = await this._registry.getUserContext(message.chat.username);
    user.changeBehaviour(prompt);
    await this._registry.storeUserContext(user);
    logger.debug({
      message: 'Successfully changed behavior.',
      user: user.username,
      behaviour: prompt,
    });
  }
}
