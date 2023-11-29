import { ParentCommand } from './parent';
import { Message, PhotoData } from '../model';
import { logger } from '../utils/logger';

export class AnalyseCommand extends ParentCommand {
  async execute(message: Message): Promise<void> {
    const chatId = message.chat.id;
    const photo = message.photo || [];
    const caption = message.caption || 'What’s in this image?';

    try {
      const imageUrl: string = await this.requestImageUrl(photo);
      const analyseResult: string = await this._ai.analyseImage(imageUrl, caption);
      await Promise.all([
        this._bot.sendMessage(chatId, analyseResult),
        this.captureConversation(message, caption, analyseResult),
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