import { ParentCommand } from './parent';
import { logger } from '../utils/logger';
import { Message } from '../model';

/**
 * Imagine command /imagine is used to generate an image based on the text provided in the
 * chat message and send the generated image to the chat.
 */
export class ImagineCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    logger.debug('inside imagine class');
    const prompt: string = message.text || '';
    const chatId = message.chat.id;
    const prohibited: boolean = await this.isProhibited(prompt);
    if (prohibited) {
      await this._bot.sendMessage(chatId, 'Sorry, can\'t generate this');
      return;
    }
    logger.debug('after prohibited');
    try {
      const imageCreateResponse = await this._ai.createImage({ prompt, n: 1, size: '1024x1024' });
      const url: string = imageCreateResponse.data.data[0].url || 'Not generated';
      logger.debug('before send photo');
      await this._bot.sendPhoto(chatId, url);
    } catch (error) {
      logger.error(error);
      await this._bot.sendMessage(chatId, '[Failed to generate image]');
    }
  }
}
