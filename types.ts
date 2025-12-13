export enum UserTier {
  FREE = 'free',
  PRO = 'pro',
  ULTRA = 'ultra',
  GUEST = 'guest'
}

export enum ChatMode {
  SINGLE = 'single',
  MULTI = 'multi'
}

export enum ModelType {
  GEMINI = 'gemini',
  LLAMA = 'llama',
  MISTRAL = 'mistral'
}

export interface User {
  id: string;
  email: string;
  tier: UserTier;
  tokensUsed: number;
  imagesGenerated: number;
  themeColor: string;
}

export interface MultiResponse {
  model: string;
  content: string;
  isWinner?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'referee';
  content: string; // Summary or primary content
  model?: string; // which model generated this (for single mode)
  multiResponses?: MultiResponse[]; // For multi-agent mode
  timestamp: number;
  isImage?: boolean; // if true, content is a URL
  selectedWinner?: string; // Track which model won in this turn
}

export interface ChatSession {
  id: string;
  title: string;
  mode: ChatMode;
  messages: Message[];
  lastUpdated: number;
}

export interface AgentResponse {
  model: ModelType;
  text: string;
}