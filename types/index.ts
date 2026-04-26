export interface Plant {
  id: string;
  name: string;
  species: string;
  imageUrl?: string;
  waterFrequencyDays: number;
  lastWatered: Date;
  nextWatering: Date;
  health: number;
  isWilted: boolean;
}

export interface PlantSittingRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  plantName: string;
  plantImage?: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startDate: Date;
  endDate: Date;
  status: "open" | "accepted" | "completed";
  sitterId?: string;
  sitterName?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  location?: string;
  bio?: string;
  plants: Plant[];
  theme: "light" | "dark" | "system";
  pushNotificationsEnabled: boolean;
}

export interface IdentifiedPlant {
  id: string;
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  careInstructions: {
    waterFrequency: number;
    light: string;
    temperature: string;
  };
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Chat {
  id: string;
  requestId: string;
  plantName: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  sitterId?: string;
  sitterName?: string;
  sitterAvatar?: string;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}
