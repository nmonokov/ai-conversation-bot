import axios from 'axios';
import { PhotoData } from '../model';

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

  async sendMessage(chatId: number, message: string) {
    const url = `${this._url}/sendMessage?chat_id=${chatId.toString()}&text=${message}`
    await axios.get(url);
  }

  async sendPhoto(chatId: number, photoUrl: string) {
    const url = `${this._url}/sendPhoto?chat_id=${chatId.toString()}&photo=${photoUrl}`
    await axios.get(url);
  }

  async getFileLink(fileId: string) {
    const url = `${this._url}/getFile?file_id=${fileId}`
    const response = await axios.get(url);
    const data: PhotoData = response.data;
    return `${this._fileUrl}/${data.file_path}`;
  }
}
