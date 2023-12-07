import axios from 'axios';
import { PhotoData, VoiceData } from '../model';
import { logger } from '../utils/logger';

/**
 * Wrapper class for interacting with the Telegram Bot API.
 * Provides methods for sending messages, photos, and fetching URLs and buffers of media files.
 */
export class TelegramBot {
  private readonly _url: string;
  private readonly _fileUrl: string;

  constructor(token: string) {
    this._url = `https://api.telegram.org/bot${token}`;
    this._fileUrl = `https://api.telegram.org/file/bot${token}`;
  }

  /**
   * Sends a text message to a chat.
   * @param chatId - The ID of the chat to send the message to.
   * @param message - The text message to be sent.
   * @returns A Promise resolving when the message is successfully sent.
   */
  async sendMessage(chatId: number, message: string): Promise<void> {
    const url = `${this._url}/sendMessage?chat_id=${chatId.toString()}&parse_mode=Markdown&text=${encodeURIComponent(message)}`;
    await axios.get(url);
  }

  /**
   * Sends a photo to a chat with an optional caption.
   * @param chatId - The ID of the chat to send the photo to.
   * @param photoUrl - The URL of the photo to be sent.
   * @param caption - An optional caption for the photo.
   * @returns A Promise resolving when the photo is successfully sent.
   */
  async sendPhoto(chatId: number, photoUrl: string, caption?: string): Promise<void> {
    const url = `${this._url}/sendPhoto`;
    const body = {
      chat_id: chatId,
      photo: photoUrl,
      caption,
    };
    await axios.post(url, body);
  }

  /**
   * Retrieves the URL of the largest photo in an array of PhotoData objects.
   * @param photo - An array of PhotoData objects.
   * @returns A Promise resolving to the URL of the largest photo.
   */
  async imageUrl(photo: PhotoData[]): Promise<string> {
    const largePhoto: PhotoData = photo.reduce((firstPhoto: any, secondPhoto: any) =>
      firstPhoto.file_size > secondPhoto.file_size ? firstPhoto : secondPhoto);
    const fileLink: string = await this.getFileLink(largePhoto.file_id);
    logger.debug(fileLink);
    return fileLink;
  }

  /**
   * Retrieves the image data as a buffer for the largest photo in an array of PhotoData objects.
   * @param photo - An array of PhotoData objects.
   * @returns A Promise resolving to a Buffer containing the image data.
   */
  async imageAsBuffer(photo: PhotoData[]): Promise<Buffer> {
    const fileLink = await this.imageUrl(photo);
    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
    if (response.status === 200) {
      return response.data;
    } else {
      logger.error({
        message: 'Failed to fetch the image.',
        error: response.data,
      });
      throw new Error('Failed to fetch the image.');
    }
  }

  /**
   * Retrieves the audio data as a buffer for a specified VoiceData object.
   * @param voice - The VoiceData object containing information about the audio file.
   * @returns A Promise resolving to a Buffer containing the audio data.
   */
  async audioAsBuffer(voice: VoiceData): Promise<Buffer> {
    const fileLink: string = await this.getFileLink(voice.file_id);
    logger.debug({ fileLink });
    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
    if (response.status === 200) {
      return response.data;
    } else {
      logger.error({
        message: 'Failed to fetch the audio.',
        error: response.data,
      });
      throw new Error('Failed to fetch the audio.');
    }
  }

  private async getFileLink(fileId: string): Promise<string> {
    const url = `${this._url}/getFile?file_id=${fileId}`;
    const response = await axios.get(url);
    if (response.status !== 200) {
      throw new Error('Failed to get image file data.');
    }
    const data: PhotoData = response.data.result;
    const fullFileUrl = `${this._fileUrl}/${data.file_path}`;
    logger.debug({ message: 'Response data', data, fullFileUrl });
    return fullFileUrl;
  }
}
