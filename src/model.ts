export interface User {
  username: string;
  addEntry(prompt: string): void;
  conversation(): string;
  changeBehaviour(newBehaviour: string): void;
}

export interface ConversationEntry {
  tokens: number;
  value: string;
}

export interface Message {
  message_id: number;
  chat: Chat;
  text?: string;
  reply_to_message?: ReplyTo;
  photo?: PhotoData[];
}

export interface Chat {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  type?: string;
}

export interface ReplyTo {
  message_id: number;
  photo?: PhotoData[];
}

export interface PhotoData {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  width?: number;
  height?: number;
  file_path?: string;
}