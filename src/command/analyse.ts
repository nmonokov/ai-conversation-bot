import { ParentCommand } from './parent';
import { Message } from '../model';
import { logger } from '../utils/logger';
import { Context } from '../user/context';

/**
 * Analyse command provides functionality for analyzing images, extracting relevant information,
 * and interacting with user context. Simply by posting image in the chat you will trigger the analyse command.
 * You can add caption to the image to clarify the analyse purpose.
 */
export class AnalyseCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    const chatId = message.chat.id;
    const photo = message.photo || [];
    const caption = message.caption || 'What’s in this image?';

    try {
      const imageUrl: string = await this._bot.imageUrl(photo);
      const context: Context = await this._registry.getUserContext(message.chat.username);
      context.addUserEntry(caption);
      const analyseResult: string = await this._ai.analyseImage(imageUrl, caption);
      context.addBotEntry(analyseResult);
      await Promise.all([
        this._bot.sendMessage(chatId, analyseResult),
        this._registry.storeUserContext(context),
      ]);
    } catch (error: any) {
      logger.error(error);
      if (error?.message.startsWith('Rate limit reached')) {
        await this._bot.sendMessage(chatId, '[You\'re sending too many requests. Please, wait a little bit.]');
      } else {
        await this._bot.sendMessage(chatId, error.message);
      }
    }
  }
}