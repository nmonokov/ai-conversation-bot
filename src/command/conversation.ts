import { ParentCommand } from './parent';
import { logger } from '../utils/logger';
import { Message } from '../model';
import { Context } from '../user/context';

/**
 * Conversation command class that handles the conversational interactions with the user.
 * The execute method first checks:
 *  - if the incoming message is a command
 *  - if it was received from a group chat
 *  - if the message is prohibited
 * If either of these are true, then this message will be skipped.
 *
 * The conversation between user and AI companion is handled in prompts. The structure is the following:
 * [AI behaviour description stored in the user object started with 'AI is a chatbot...']
 * You: {user's prompt}
 * AI: {generated response}
 *
 * This conversation will be stored fully and sent to the OpenAI /completion endpoint.
 * When the conversation reaches its threshold which is defined in the user object,
 * then it will be trimmed so to persist this fluent conversation and not to exceed the quota fast.
 */
export class ConversationCommand extends ParentCommand {

  async execute(message: Message): Promise<void> {
    const chatId = message.chat.id;
    const prompt = message.text || '';
    if (prompt.startsWith('/')
      || message.chat.type !== 'private'
      || message.photo
      || message.reply_to_message
    ) {
      logger.debug('Skipping conversation.');
      return;
    }

    try {
      const prohibited: boolean = await this._ai.isProhibited(prompt);
      if (prohibited) {
        await this._bot.sendMessage(chatId, 'Sorry, can\'t generate this');
        return;
      }
    } catch (error: any) {
      const { message: errorMessage }: { message: string} = error;
      logger.error(errorMessage);
      if (errorMessage === 'Request failed with status code 429') {
        await this._bot.sendMessage(chatId,
          '[Either rate limit has been reached or your openai token has expired]');
      }
      return;
    }

    try {
      const context: Context = await this._registry.getUserContext(message.chat.username);
      context.addUserEntry(prompt);
      const response = await this.askAi(context);
      context.addBotEntry(response);
      await Promise.all([
        this._bot.sendMessage(chatId, response),
        this._registry.storeUserContext(context),
      ]);
    } catch (error: any) {
      logger.error(error);
      if (error?.message.startsWith('Rate limit reached')) {
        await this._bot.sendMessage(chatId, '[You\'re sending too many requests. Please, wait a little bit.]');
      } else {
        await this._bot.sendMessage(chatId, error.message);
      }
    }
  }
}
