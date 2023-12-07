import { ParentCommand } from './parent';
import { Message, PhotoData } from '../model';
import { logger } from '../utils/logger';
import axios from 'axios';
import { FileEditor } from '../utils/fileEditor';

/**
 * /mask command handles the execution of a command related to image inpainting.
 * How it happens in Lambda:
 *   - Source image from the reply message gets downloaded from the Telegram API and stored
 *   in the /tmp folder of the Lambda as jpg file.
 *   - Converts to PNG and store to /tmp folder.
 *   - Mask image downloaded, stored and converted to PNG with deletion of the selected area.
 *   - Request for the inpaint is sent to the OpenAI API.
 *   - Get URL of the inpainted pic and send to Telegram.
 */
export class MaskCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    const chatId = message.chat.id;
    const username = message.chat.username;
    const sourcePhoto = message.reply_to_message?.photo || [];
    const maskedPhoto = message.photo || [];
    const caption = message.text || 'Fill with something suitable';
    try {
      logger.debug({
        message,
        sourcePhoto,
        maskedPhoto,
        caption,
      });
      const [sourceUrl, maskUrl] = await Promise.all([
        this.requestImageUrl(sourcePhoto),
        this.requestImageUrl(maskedPhoto),
      ]);
      const inpaintedImageUrl = await this.inpaintedImage(username, caption, sourceUrl, maskUrl);
      await this._bot.sendPhoto(chatId, inpaintedImageUrl);
    } catch (error: any) {
      logger.error(error);
      if (error?.message.startsWith('Rate limit reached')) {
        await this._bot.sendMessage(chatId, '[You\'re sending too many requests. Please, wait a little bit.]');
      }
    }
  }

  private async requestImageUrl(photo: PhotoData[]): Promise<string> {
    const largePhoto: PhotoData = photo.reduce((firstPhoto: any, secondPhoto: any) =>
      firstPhoto.file_size > secondPhoto.file_size ? firstPhoto : secondPhoto);
    const fileUrl: string = await this._bot.getFileLink(largePhoto.file_id);
    logger.debug({ fileUrl });
    return fileUrl;
  }

  private async inpaintedImage(username: string, prompt: string, sourceUrl: string, maskUrl: string): Promise<string> {
    const [sourceResponse, maskResponse] = await Promise.all([
      axios.get(sourceUrl, { responseType: 'arraybuffer' }),
      axios.get(maskUrl, { responseType: 'arraybuffer' }),
    ]);
    const tmpFolderPath = `/tmp/${username}`;
    const fileEditor = new FileEditor(tmpFolderPath);
    const [sourcePngReadStream, maskReadStream] = await Promise.all([
      fileEditor.convertToPng(sourceResponse.data),
      fileEditor.convertToMask(maskResponse.data),
    ]);

    const resultUrl = await this._ai.inpaint(sourcePngReadStream, maskReadStream, prompt);
    fileEditor.removeTmpFiles();
    return resultUrl;
  }
}