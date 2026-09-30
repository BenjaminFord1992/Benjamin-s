export interface Citation {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  image?: string; // Base64 or local URL of uploaded file
  modeUsed?: "fun" | "regular";
  citations?: Citation[];
  deepSearchSteps?: string[]; // Log of search agent steps
  isGeneratingImage?: boolean; // Flag to render visual skeleton loaders
  generatedImageUrl?: string; // Captured generated graphic
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  hasWebGrounding?: boolean;
}

export interface UserProfile {
  email: string;
  name: string;
  avatarColor: string;
  role: string;
  subscription: string;
}

export interface QuickSuggestion {
  text: string;
  icon: string;
  category: "roast" | "research" | "creative" | "finance";
}
