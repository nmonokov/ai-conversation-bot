import { ConversationEntry } from '../model';

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
  protected _totalTokens: number;
  protected _behaviour: any;

  constructor(
    username: string,
    conversationContext?: ConversationEntry[],
    tokensThreshold?: number,
    spliceThreshold?: number,
    totalTokens?: number,
    behaviour?: string,
  ) {
    this.username = username;
    this._conversationContext = conversationContext || [];
    this._tokensThreshold = tokensThreshold || 500;
    this._spliceThreshold = spliceThreshold || 250;
    this._totalTokens = totalTokens || 0;
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
  abstract addBotEntry(prompt: string, tokens?: number): void;

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
   * Adds an entry to the _conversationContext array
   * and trims it if the total number of tokens exceeds the _tokensThreshold
   * @param prompt to save
   */
  abstract addEntry(prompt: any): void;

  /**
   * Trim conversation. Unique for each implementation.
   */
  abstract trimConversationContext(): void;
}
