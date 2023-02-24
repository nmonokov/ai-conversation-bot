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
  private _behaviour: string;

  constructor(username: string, tokensThreshold?: number, spliceThreshold?: number) {
    this.username = username;
    this._conversationContext = [];
    this._tokensThreshold = tokensThreshold || 500;
    this._spliceThreshold = spliceThreshold || 250;
    this._behaviour = 'AI is a chatbot designed to assist users with their inquiries.' +
      ' Its purpose is to help users find the information they need and answer any questions they may have.' +
      ' Users are encouraged to describe their issue or question in as much detail as possible, and the chatbot' +
      ' will do its best to provide a helpful response.';
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
    return `${this._behaviour}\n\n${convo}`;
  }

  /**
   * Set new behaviour for the chatbot and resets the conversation context
   * so new behaviour applied.
   * @param newBehaviour a new behaviour rule to be applied
   */
  changeBehaviour(newBehaviour: string) {
    this._conversationContext = [];
    this._behaviour = newBehaviour;
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