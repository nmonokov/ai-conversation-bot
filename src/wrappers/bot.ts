import axios from 'axios';
import { PhotoData } from '../model';
import { logger } from '../utils/logger';

/**
 * Wrapper for Telegram Bot Api.
 */
export class TelegramBot {
  private readonly _url: string;
  private readonly _fileUrl: string;

  constructor(token: string) {
    this._url = `https://api.telegram.org/bot${token}`;
    this._fileUrl = `https://api.telegram.org/file/bot${token}`;
  }

  async sendMessage(chatId: number, message: string): Promise<void> {
    const url = `${this._url}/sendMessage?chat_id=${chatId.toString()}&text=${encodeURI(message)}`;
    await axios.get(url);
  }

  async sendPhoto(chatId: number, photoUrl: string): Promise<void> {
    const url = `${this._url}/sendPhoto`;
    const body = {
      chat_id: chatId,
      photo: photoUrl,
    }
    await axios.post(url, body);
  }

  async getFileLink(fileId: string): Promise<string> {
    const url = `${this._url}/getFile?file_id=${fileId}`;
    const response = await axios.get(url);
    if (!response.data.ok) {
      throw new Error('Failed to get image file data.');
    }
    const data: PhotoData = response.data.result;
    const fullFileUrl = `${this._fileUrl}/${data.file_path}`;
    logger.debug({ message: 'Response data', data, fullFileUrl });
    return fullFileUrl;
  }
}
