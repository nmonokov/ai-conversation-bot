import { ParentCommand } from './parent';
import { Message, PhotoSize } from 'node-telegram-bot-api';
import fs, { ReadStream } from 'fs';
import axios, { AxiosResponse } from 'axios';
import sharp from 'sharp';

/**
 * Reply on image with /reimagine, and it'll create a variation of the image and send it back to a user.
 * In order to convert an image to PNG format, suitable for OpenAI to digest, the image will be stored
 * on the local disk /images/file_{username}_{chatId}.png for further processing. So basically it will be
 * rewritten for the specific user in the specific chat.
 */
export class ReimagineCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    const chatId = message.chat.id;
    const photo = message.reply_to_message?.photo;
    if (!photo) {
      this._bot.sendMessage(chatId, 'Reply to an image to reimagine.');
      return;
    }
    const imageResponse: AxiosResponse<Buffer> = await this.requestImage(photo);
    const imageAsStream: ReadStream = await this.convertToPng(chatId, message.chat.username, imageResponse.data);
    const imageVariationResponse = await this._ai.createImageVariation(imageAsStream as any, 1, '1024x1024');
    this._bot.sendPhoto(chatId, imageVariationResponse.data.data[0].url || '');
  }

  private async requestImage(photo: PhotoSize[]) {
    const largePhoto: PhotoSize = photo.reduce((firstPhoto: any, secondPhoto: any) =>
      firstPhoto.file_size > secondPhoto.file_size ? firstPhoto : secondPhoto);
    const fileLink: string = await this._bot.getFileLink(largePhoto.file_id);
    return await axios.get(fileLink, { responseType: 'arraybuffer' });
  }

  private async convertToPng(chatId: number, username: string | undefined, data: Buffer): Promise<ReadStream> {
    const folderPath = `${process.cwd()}/images`;
    const imagePath = `${folderPath}/file_${username}_${chatId}.png`;
    const folderExists = fs.existsSync(folderPath);
    if (!folderExists) {
      fs.mkdirSync(folderPath);
    }
    await sharp(data)
      .resize(1024, 1024)
      .png()
      .toFile(imagePath);
    return fs.createReadStream(imagePath);
  }
}
