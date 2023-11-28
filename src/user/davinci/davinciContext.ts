import { Context } from '../context';
import { ConversationEntry } from '../../model';

/**
 * Legacy user context. Using text-davinci-003 model in conversation construction.
 */
export class DavinciContext extends Context {

  addUserEntry(prompt: string): void {
    this._addEntry(`You: ${prompt}\nAI: `);
  }

  addBotEntry(prompt: string): void {
    this._addEntry(prompt);
  }

  conversation(): string {
    const convo: string = this._conversationContext
      .map((entry: ConversationEntry) => entry.value)
      .join('\n');
    return `${this._behaviour}\n\n${convo}`;
  }

  getPromptLength(prompt:any): number {
    return prompt.length;
  }
}