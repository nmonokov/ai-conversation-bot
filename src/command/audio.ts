import { ParentCommand } from './parent';
import { Message } from '../model';
import { logger } from '../utils/logger';
import { Context } from '../user/context';
import { FileEditor } from '../utils/fileEditor';

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
      const audioData: Buffer = await this._bot.audioAsBuffer(voice);
      const textFromSpeech = await this.convertAudio(username, audioData);
      const context = await this._registry.getUserContext(username);
      const response = await this.respondToAudio(context, textFromSpeech);

      const formattedMessage = `_${username.replace('_', '')}: ${textFromSpeech}_\n${response}`;
      await Promise.all([
        this._bot.sendMessage(chatId, formattedMessage),
        this._registry.storeUserContext(context),
      ]);
    } catch (error: any) {
      logger.error({ message: 'Failed on reading and sending to ai', error, errorMessage: error.message });
      await this._bot.sendMessage(chatId, 'Sorry, can\'t fetch the voice data.');
    }
  }

  private async convertAudio(username: string, audioData: Buffer): Promise<string> {
    const tmpFolderPath = `/tmp/${username}`;
    const fileEditor = new FileEditor(tmpFolderPath);
    const mp3FileReadStream = await fileEditor.convertToMp3(audioData);
    const textFromSpeech = await this._ai.speechToText(mp3FileReadStream);
    fileEditor.removeTmpFiles();
    return textFromSpeech;
  }

  private async respondToAudio(context: Context, textFromSpeech: string): Promise<string> {
    context.addUserEntry(textFromSpeech);
    const response = await this.askAi(context);
    context.addBotEntry(response);
    return response;
  }
}