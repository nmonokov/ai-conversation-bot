import { Context } from '../context';
import { ConversationEntry } from '../../model';

const CHARACTERS_IN_TOKEN: number = 4;

/**
 * Legacy user context. Using text-davinci-003 model in conversation construction.
 */
export class DavinciContext extends Context {

  addEntry(prompt: any): void {
    const characters: number = prompt.length;
    const textTokens: number = characters / CHARACTERS_IN_TOKEN;
    const tokens = this.tokens();
    if ((textTokens + tokens) > this._tokensThreshold) {
      this.trimConversationContext();
    }
    this._conversationContext.push({
      tokens: textTokens,
      value: prompt,
    });
  }

  addUserEntry(prompt: string): void {
    this.addEntry(`You: ${prompt}\nAI: `);
  }

  addBotEntry(prompt: string): void {
    this.addEntry(prompt);
  }

  conversation(): string {
    const convo: string = this._conversationContext
      .map((entry: ConversationEntry) => entry.value)
      .join('\n');
    return `${this._behaviour}\n\n${convo}`;
  }

  trimConversationContext(): void {
    let indexForSplice = 0;
    let tokensBeforeThreshold = 0;
    const conversation = this._conversationContext;
    for (let index = 0; index < conversation.length; index++) {
      tokensBeforeThreshold += conversation[index].tokens || 0;
      if (tokensBeforeThreshold >= this._spliceThreshold) {
        indexForSplice = index;
        break;
      }
    }
    this._conversationContext = conversation.splice(indexForSplice + 1);
  }

  private tokens() {
    return this._conversationContext
      .map((entry: ConversationEntry) => entry.tokens || 0)
      .reduce((accumulator, current) => accumulator + current, 0);
  }
}