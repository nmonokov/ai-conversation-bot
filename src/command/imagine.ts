import { ParentCommand } from './parent';
import { Message } from 'node-telegram-bot-api';

/**
 * Imagine command /imagine is used to generate an image based on the text provided in the
 * chat message and send the generated image to the chat.
 */
export class ImagineCommand extends ParentCommand {

  async execute(message: Message, match: RegExpExecArray | null): Promise<void> {
    const prompt: string = message.text || '';
    const prohibited: boolean = await this.isProhibited(prompt);
    const chatId = message.chat.id;
    if (prohibited) {
      this._bot.sendMessage(chatId, 'Sorry, can\'t generate this');
      return;
    }
    const imageCreateResponse = await this._ai.createImage({
      prompt,
      n: 1,
      size: '1024x1024',
    });
    const url: string = imageCreateResponse.data.data[0].url || 'Not generated';
    this._bot.sendPhoto(chatId, url);
  }
}
