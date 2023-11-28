import { ConversationEntry } from '../model';

const CHARACTERS_IN_TOKEN: number = 4;

/**
 * UserContext is used to keep track of a user's conversation context with the chatbot.
 * Text is represented as 'tokens' which is an OpenAI specific way of measuring data.
 * 1 token approx 4 characters.
 */
export abstract class Context {
  readonly username: string;
  protected _conversationContext: ConversationEntry[];
  protected readonly _tokensThreshold: number;
  protected readonly _spliceThreshold: number;
  protected _behaviour: any;

  constructor(
    username: string,
    conversationContext?: ConversationEntry[],
    tokensThreshold?: number,
    spliceThreshold?: number,
    behaviour?: string,
  ) {
    this.username = username;
    this._conversationContext = conversationContext || [];
    this._tokensThreshold = tokensThreshold || 500;
    this._spliceThreshold = spliceThreshold || 250;
    this._behaviour = behaviour || 'AI is a chatbot designed to assist users with their inquiries.' +
      ' Its purpose is to help users find the information they need and answer any questions they may have.' +
      ' Users are encouraged to describe their issue or question in as much detail as possible, and the chatbot' +
      ' will do its best to provide a helpful response.';
  }

  /**
   * Saves user entry. Append with 'You' and 'AI' for better text generation.
   */
  abstract addUserEntry(prompt: string): void;

  /**
   * Saves bot response. Cleans empty lines.
   */
  abstract addBotEntry(prompt: string): void;

  /**
   * Returns a string that represents the user's entire conversation history with the chatbot.
   */
  abstract conversation(): any;

  /**
   * Set new behaviour for the chatbot and resets the conversation context
   * so new behaviour applied.
   * @param newBehaviour a new behaviour rule to be applied
   */
  changeBehaviour(newBehaviour: string): void {
    this._conversationContext = [];
    this._behaviour = newBehaviour;
  }

  /**
   * Calculating prompt length based on the model version.
   * @param prompt could be as a string or as a map.
   */
  abstract getPromptLength(prompt: any): number;

  /**
   * Adds an entry to the _conversationContext array
   * and trims it if the total number of tokens exceeds the _tokensThreshold
   * @param prompt to save
   */
  protected _addEntry(prompt: any): void {
    const characters: number = this.getPromptLength(prompt);
    const textTokens: number = characters / CHARACTERS_IN_TOKEN;
    const tokens = this._tokens();
    if ((textTokens + tokens) > this._tokensThreshold) {
      this._trimConversationContext();
    }
    this._conversationContext.push({
      tokens: textTokens,
      value: prompt,
    });
  }

  private _trimConversationContext() {
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
