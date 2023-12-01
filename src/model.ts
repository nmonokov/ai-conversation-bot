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
  reply_markup?: any;
  caption?: string;
  voice?: VoiceData;
}

export interface Chat {
  id: number;
  first_name?: string;
  last_name?: string;
  username: string;
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

export interface VoiceData {
  duration?: number;
  mime_type?: string;
  file_id: string;
  file_unique_id: string;
  file_size: number;
}

export interface ContextConfiguration {
  tokensThreshold?: number;
  spliceThreshold?: number;
}

export enum TextModel {
  TURBO_3_5 = 'gpt-3.5-turbo',
  DAVINCI = 'text-davinci-003',
}