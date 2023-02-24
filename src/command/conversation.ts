import { ParentCommand } from './parent';
import { logger } from '../utils/logger';
import { CreateCompletionResponse, CreateCompletionResponseChoicesInner } from 'openai/api';
import { AxiosResponse } from 'axios';
import { Message, User } from '../model';
import { UserContext } from '../user/user';

/**
 * Conversation command class and handles the conversational interactions with the user.
 * The execute method first checks
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

  async execute(message: Message, users: { [username: string]: User }): Promise<void> {
    logger.debug('inside convo class');
    const chatId = message.chat.id;
    const prompt = message.text || '';
    if (prompt.startsWith('/')
      || message.chat.type !== 'private'
      || message.photo
      || message.reply_to_message
    ) {
      logger.debug('skipping convo');
      return;
    }
    const prohibited: boolean = await this.isProhibited(prompt);
    if (prohibited) {
      await this._bot.sendMessage(chatId, 'Sorry, can\'t generate this');
      return;
    }

    try {
      logger.debug('before convo generation');
      const aiMessage = await this.getAiMessage(message, users, prompt);
      await this._bot.sendMessage(chatId, aiMessage);
      logger.debug('after send message');
    } catch (error: any) {
      logger.error(error);
      if (error?.message.startsWith('Rate limit reached')) {
        await this._bot.sendMessage(chatId, '[You\'re sending too many requests. Please, wait a little bit.]');
      }
    }
  }

  private async getAiMessage(
    message: Message,
    users: { [username: string]: User },
    prompt: string
  ): Promise<string> {
    const user = this.getUser(message, users);
    user.addEntry(`You: ${prompt}\nAI: `);
    const completionResponse: AxiosResponse<CreateCompletionResponse> = await this.askAi(user, message);
    const aiResponse: string = this.pickChoice(completionResponse.data.choices);
    user.addEntry(aiResponse);
    return aiResponse || '[Failed to generate message. Try once again.]';
  }

  private getUser(message: Message, users: { [username: string]: User }) {
    const username = message.chat.username || '';
    let user: User = users[username];
    if (!user) {
      user = new UserContext(username);
      users[username] = user;
    }
    return user;
  }

  private async askAi(user: User, message: Message) {
    return await this._ai.createCompletion({
      model: 'text-davinci-003',
      // model: 'text-curie-001',
      prompt: user.conversation(),
      max_tokens: 256,
      temperature: 1,
      user: message.chat.username,
      frequency_penalty: 1,
      presence_penalty: 0,
    });
  }

  private pickChoice(choices: CreateCompletionResponseChoicesInner[]): string {
    choices.sort((
      firstChoice: CreateCompletionResponseChoicesInner,
      secondChoice: CreateCompletionResponseChoicesInner
    ) => {
      if (firstChoice.finish_reason === 'stop') {
        return -1;
      } else if (secondChoice.finish_reason === 'stop') {
        return 1;
      }
      return 0;
    });
    const choice = choices[0];
    if (choice.finish_reason !== 'stop') {
      logger.warn({
        message: 'Failed to fully generate the message',
        reason: choice.finish_reason,
      });
    }
    return choice.text || '';
  }
}
