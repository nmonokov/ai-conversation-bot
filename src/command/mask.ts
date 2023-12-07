import { ParentCommand } from './parent';
import { Message } from '../model';
import { logger } from '../utils/logger';
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
    const caption = message.caption || 'Fill with something suitable';
    if (!sourcePhoto) {
      await this._bot.sendMessage(chatId, 'Reply to an image to reimagine.');
      return;
    }
    if (!maskedPhoto) {
      await this._bot.sendMessage(chatId, 'Add mask to your request.');
      return;
    }

    try {
      logger.debug({
        message,
        sourcePhoto,
        maskedPhoto,
        caption,
      });
      const [sourceImageBuffer, maskImageBuffer] = await Promise.all([
        this._bot.imageAsBuffer(sourcePhoto),
        this._bot.imageAsBuffer(maskedPhoto),
      ]);
      const inpaintedImageUrl = await this.inpaintedImage(username, caption, sourceImageBuffer, maskImageBuffer);
      await this._bot.sendPhoto(chatId, inpaintedImageUrl);
    } catch (error: any) {
      logger.error({
        errorMessage: error.message,
        error,
      });
      if (error?.message.startsWith('Rate limit reached')) {
        await this._bot.sendMessage(chatId, '[You\'re sending too many requests. Please, wait a little bit.]');
      } else {
        await this._bot.sendMessage(chatId, error.message);
      }
    }
  }

  private async inpaintedImage(
    username: string,
    prompt: string,
    sourceImageBuffer: Buffer,
    maskImageBuffer: Buffer,
  ): Promise<string> {
    const tmpFolderPath = `/tmp/${username}`;
    const fileEditor = new FileEditor(tmpFolderPath);
    const [sourcePngReadStream, maskReadStream] = await Promise.all([
      fileEditor.convertToPng(sourceImageBuffer),
      fileEditor.convertToMask(maskImageBuffer),
    ]);

    const resultUrl = await this._ai.inpaint(sourcePngReadStream, maskReadStream, prompt);
    fileEditor.removeTmpFiles();
    return resultUrl;
  }
}