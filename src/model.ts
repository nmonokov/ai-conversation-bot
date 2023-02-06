export interface User {
  username: string;
  addEntry(prompt: string): void;
  conversation(): string;
}

export interface ConversationEntry {
  tokens: number;
  value: string;
}
