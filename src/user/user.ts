import { ConversationEntry, User } from '../model';

const CHARACTERS_IN_TOKEN: number = 4;

/**
 * UserContext is used to keep track of a user's conversation context with the chatbot.
 * Text is represented as 'tokens' which is an OpenAI specific way of measuring data.
 * 1 token approx 4 characters.
 */
export class UserContext implements User {
  readonly username: string;
  private _conversationContext: ConversationEntry[];
  private readonly _tokensThreshold: number;
  private readonly _spliceThreshold: number;

  constructor(username: string, tokensThreshold?: number, spliceThreshold?: number) {
    this.username = username;
    this._conversationContext = [];
    this._tokensThreshold = tokensThreshold || 500;
    this._spliceThreshold = spliceThreshold || 250;
  }

  /**
   * Adds an entry to the _conversationContext array
   * and trims it if the total number of tokens exceeds the _tokensThreshold
   * @param prompt to save
   */
  addEntry(prompt: string): void {
    const characters: number = prompt.length;
    const textTokens: number = characters / CHARACTERS_IN_TOKEN;
    const tokens = this._tokens();
    if ((textTokens + tokens) > this._tokensThreshold) {
      this._trimContext();
    }
    this._conversationContext.push({
      tokens: textTokens,
      value: prompt,
    });
  }

  /**
   * Returns a string that represents the user's entire conversation history with the chatbot.
   */
  conversation(): string {
    const convo: string = this._conversationContext
      .map((entry: ConversationEntry) => entry.value)
      .join('\n');
    return 'AI is a chatbot designed to bring humor and fun to casual conversations.' +
      ' Its unmatched comedic skills make it a virtual friend for those seeking a good laugh.' +
      ' The goal is to bring joy to interactions and be the go-to AI for casual chats.\n\n' + convo;
  }

  private _trimContext() {
    let indexForSplice = 0;
    let tokensBeforeThreshold = 0;
    for (let index = 0; index < this._conversationContext.length; index++) {
      tokensBeforeThreshold += this._conversationContext[index].tokens;
      if (tokensBeforeThreshold >= this._spliceThreshold) {
        indexForSplice = index;
        break;
      }
    }
    this._conversationContext.splice(0, indexForSplice + 1);
  }

  private _tokens() {
    return this._conversationContext
      .map((entry: ConversationEntry) => entry.tokens)
      .reduce((accumulator, current) => accumulator + current, 0);
  }
}