import { ParentCommand } from './parent';
import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { Message, PhotoData } from '../model';

/**
 * Reply on image with /reimagine, and it'll create a variation of the image and send it back to a user.
 * In order to convert an image to PNG format, suitable for OpenAI to digest, the image will be uploaded
 * as a buffer, the format will be changed to PNG(with sharp) and name added(so OpenAI accepts it)
 * on the flight and send to OpenAI image variation endpoint.
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
      const imageResponse: AxiosResponse<Buffer> = await this.requestImage(photo);
      const imageUrl: string = await this._ai.generateVariation(imageResponse.data);
      await this._bot.sendPhoto(chatId, imageUrl);
    } catch (error) {
      logger.error(error);
      await this._bot.sendMessage(chatId, '[Failed to generate image]');
    }
  }

  private async requestImage(photo: PhotoData[]) {
    const largePhoto: PhotoData = photo.reduce((firstPhoto: any, secondPhoto: any) =>
      firstPhoto.file_size > secondPhoto.file_size ? firstPhoto : secondPhoto);
    const fileLink: string = await this._bot.getFileLink(largePhoto.file_id);
    logger.debug(fileLink);
    return await axios.get(fileLink, { responseType: 'arraybuffer' });
  }


}
