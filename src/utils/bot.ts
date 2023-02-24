import axios from 'axios';
import { PhotoData } from '../model';
import { logger } from './logger';

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
    const url = `${this._url}/sendMessage?chat_id=${chatId.toString()}&text=${message}`;
    logger.debug({ message: 'before request', url });
    const response = await axios.get(url);
    logger.debug({ message: 'after request', status: response.status, data: response.data });
  }

  async sendPhoto(chatId: number, photoUrl: string): Promise<void> {
    const url = `${this._url}/sendPhoto?chat_id=${chatId.toString()}&photo=${photoUrl}`;
    logger.debug({ message: 'before request', url });
    const response = await axios.get(url);
    logger.debug({ message: 'after request', status: response.status, data: response.data });
  }

  async getFileLink(fileId: string): Promise<string> {
    const url = `${this._url}/getFile?file_id=${fileId}`;
    logger.debug({ message: 'before request', url });
    const response = await axios.get(url);
    const data: PhotoData = response.data;
    const fullFileUrl = `${this._fileUrl}/${data.file_path}`;
    logger.debug({ message: 'after request', status: response.status, fullFileUrl, data });
    return fullFileUrl;
  }
}
