import { ParentCommand } from './parent';
import { logger } from '../utils/logger';
import { Message } from '../model';

/**
 * Imagine command /imagine is used to generate an image based on the text provided in the
 * chat message and send the generated image to the chat.
 */
export class ImagineCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    const prompt: string = message.text || '';
    const chatId = message.chat.id;
    const prohibited: boolean = await this._ai.isProhibited(prompt);
    if (prohibited) {
      await this._bot.sendMessage(chatId, 'Sorry, can\'t generate this');
      return;
    }
    try {
      const imageUrl = await this._ai.generateImage(prompt);
      await this._bot.sendPhoto(chatId, imageUrl);
    } catch (error) {
      logger.error(error);
      await this._bot.sendMessage(chatId, '[Failed to generate image]');
    }
  }
}
