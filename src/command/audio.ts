import { ParentCommand } from './parent';
import { Message, VoiceData } from '../model';
import { logger } from '../utils/logger';
import axios from 'axios';
import * as fs from 'fs';
import { spawnSync } from 'child_process';
import { Context } from '../user/context';

/**
 * Command to handle conversation with Open AI API through audio:
 *  - Fetches audio from telegram in .oga format.
 *  - Converts file from .oga to .mp3 format.
 *  - Sends .mp3 file to /audio/transcriptions endpoint to convert audio to text.
 *  - Sends text to AI to hold the conversation.
 */
export class SpeechToTextCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    const chatId = message.chat.id;
    const voice = message.voice;
    const username = message.chat.username;

    if (!voice) {
      logger.error({ message: 'Can\'t find voice data'});
      return;
    }
    try {
      const audioUrl: string = await this.requestAudioUrl(voice);
      const textFromSpeech = await this.convertAudio(username, audioUrl);
      const context = await this._registry.getUserContext(username);
      const response = await this.respondToAudio(context, textFromSpeech);

      await Promise.all([
        this._bot.sendMessage(chatId, `_${username}: ${textFromSpeech}_\n${response}`),
        this._registry.storeUserContext(context),
      ]);
    } catch (error: any) {
      logger.error({ message: 'Failed on reading and sending to ai', error, errorMessage: error.message });
      return;
    }
  }

  private async requestAudioUrl(voice: VoiceData): Promise<string> {
    const fileUrl: string = await this._bot.getFileLink(voice.file_id);
    logger.debug({ fileUrl });
    return fileUrl;
  }

  private async convertAudio(username: string, audioUrl: string): Promise<string> {
    const axiosResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const tmpFolderPath = `/tmp/${username}`;
    const sourceFilePath = `${tmpFolderPath}/source.oga`;
    const outputFilePath = `${tmpFolderPath}/output.mp3`;
    if (!fs.existsSync(tmpFolderPath)) {
      fs.mkdirSync(tmpFolderPath, { recursive: true });
    }
    fs.writeFileSync(sourceFilePath, axiosResponse.data);
    spawnSync('/opt/ffmpeg/ffmpeg',
      [
        '-i',
        `${sourceFilePath}`,
        '-f',
        'mp3',
        `${outputFilePath}`
      ],
      { stdio: 'inherit' });
    const readStream = fs.createReadStream(outputFilePath);

    const textFromSpeech = await this._ai.speechToText(readStream);
    fs.unlinkSync(sourceFilePath);
    fs.unlinkSync(outputFilePath);
    return textFromSpeech;
  }

  private async respondToAudio(context: Context, textFromSpeech: string): Promise<string> {
    context.addUserEntry(textFromSpeech);
    const response = await this.askAi(context);
    context.addBotEntry(response);
    return response;
  }
}