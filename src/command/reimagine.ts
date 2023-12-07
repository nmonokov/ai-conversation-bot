import { ParentCommand } from './parent';
import { logger } from '../utils/logger';
import { Message } from '../model';
import { FileEditor } from '../utils/fileEditor';

/**
 * Reply on image with /reimagine, and it'll create a variation of the image and send it back to a user.
 * In order to convert an image to PNG format, suitable for OpenAI to digest, the image will be uploaded,
 * the format will be changed to PNG and send to OpenAI image variation endpoint.
 */
export class ReimagineCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    const chatId = message.chat.id;
    const photo = message.reply_to_message?.photo
      || (message.reply_markup ? message.photo : undefined);
    if (!photo) {
      await this._bot.sendMessage(chatId, 'Reply to an image to reimagine.');
      return;
    }
    try {
      const imageData: Buffer = await this._bot.imageAsBuffer(photo);
      const fileEditor = new FileEditor(`/tmp/${message.chat.username}`);
      const pngReadStream = await fileEditor.convertToPng(imageData);
      const imageUrl: string = await this._ai.generateVariation(pngReadStream);
      fileEditor.removeTmpFiles();
      await this._bot.sendPhoto(chatId, imageUrl);
    } catch (error: any) {
      logger.error({
        errorMessage: error.message,
        error,
      });
      await this._bot.sendMessage(chatId, 'Failed to generate imageю');
    }
  }
}
