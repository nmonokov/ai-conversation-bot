import { ParentCommand } from './parent';
import { Message, PhotoData } from '../model';
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
      const imageUrl: string = await this.requestImageUrl(photo);
      const context: Context = await this._registry.getUserContext(message.chat.username);
      context.addUserEntry(caption);
      const analyseResult: string = await this._ai.analyseImage(imageUrl, caption);
      context.addBotEntry(analyseResult);
      await Promise.all([
        this._bot.sendMessage(chatId, analyseResult),
        await this._registry.storeUserContext(context),
      ]);
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
}