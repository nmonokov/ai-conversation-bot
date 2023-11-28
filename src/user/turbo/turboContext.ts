import { Context } from '../context';
import { ConversationEntry } from '../../model';

/**
 * User context using a new open ai model.
 */
export class TurboContext extends Context {

  addUserEntry(prompt: string): void {
    this._addEntry({ role: 'user', content: prompt });
  }

  addBotEntry(prompt: string): void {
    this._addEntry({ role: 'assistant', content: prompt });
  }

  conversation(): any {
    return [
      { role: 'system', content: this._behaviour },
      ...this._conversationContext.map((entry: ConversationEntry) => entry.value),
    ];
  }

  getPromptLength(prompt:any): number {
    return prompt.content.length;
  }
}