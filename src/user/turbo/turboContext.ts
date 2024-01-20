import { Context } from '../context';
import { ConversationEntry } from '../../model';
import { logger } from '../../utils/logger';

/**
 * User context using a new OpenAI model.
 * Conversation trimming happens only on bot entry add instead of each entry add since
 * OpenAI API returns the total tokens used in completion response.
 * Trimage is simplified as well. Just cutting the conversation array in two when the threshold is met.
 */
export class TurboContext extends Context {

  addEntry(prompt: any): void {
    this._conversationContext.push({ value: prompt });
  }

  addUserEntry(prompt: string): void {
    this.addEntry({ role: 'user', content: prompt });
  }

  addBotEntry(prompt: string, tokens?: number): void {
    logger.debug({ message: 'Adding bot entry', prompt, tokens });
    if (tokens) {
      this._totalTokens = tokens;
    }
    if (tokens && tokens > this._tokensThreshold) {
      this.trimConversationContext();
    }
    this.addEntry({ role: 'assistant', content: prompt });
  }

  conversation(): any {
    return [
      { role: 'system', content: this._behaviour },
      ...this._conversationContext.map((entry: ConversationEntry) => entry.value),
    ];
  }

  trimConversationContext(): void {
    const conversation = this._conversationContext;
    const middleIndex = Math.floor(conversation.length / 2);
    this._conversationContext = conversation.slice(middleIndex);
  }
}