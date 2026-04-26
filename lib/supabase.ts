import type { Chat, ChatMessage } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://gjyawmnlaclutneozxnz.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeWF3bW5sYWNsdXRuZW96eG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTAxNzYsImV4cCI6MjA5MjUyNjE3Nn0.fmMOWRCs7pPVxGdLXrXXXl5fPXDRjVD4y3a5OHgGu1o";

if (
  supabaseUrl === "https://gjyawmnlaclutneozxnz.supabase.co" ||
  supabaseAnonKey ===
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeWF3bW5sYWNsdXRuZW96eG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTAxNzYsImV4cCI6MjA5MjUyNjE3Nn0.fmMOWRCs7pPVxGdLXrXXXl5fPXDRjVD4y3a5OHgGu1o"
) {
  console.warn("Supabase credentials not found. Using local storage fallback.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types for Supabase
type Database = {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string;
          request_id: string;
          plant_name: string;
          owner_id: string;
          owner_name: string;
          owner_avatar?: string;
          sitter_id?: string;
          sitter_name?: string;
          sitter_avatar?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          plant_name: string;
          owner_id: string;
          owner_name: string;
          owner_avatar?: string;
          sitter_id?: string;
          sitter_name?: string;
          sitter_avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          plant_name?: string;
          owner_id?: string;
          owner_name?: string;
          owner_avatar?: string;
          sitter_id?: string;
          sitter_name?: string;
          sitter_avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          sender_name: string;
          sender_avatar?: string;
          content: string;
          timestamp: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          sender_name: string;
          sender_avatar?: string;
          content: string;
          timestamp?: string;
          is_read?: boolean;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          sender_name?: string;
          sender_avatar?: string;
          content?: string;
          timestamp?: string;
          is_read?: boolean;
        };
      };
      requests: {
        Row: {
          id: string;
          owner_id: string;
          owner_name: string;
          owner_avatar?: string;
          plant_name: string;
          plant_image?: string;
          description: string;
          location: string;
          latitude?: number;
          longitude?: number;
          start_date: string;
          end_date: string;
          status: "open" | "accepted" | "completed";
          sitter_id?: string;
          sitter_name?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          owner_name: string;
          owner_avatar?: string;
          plant_name: string;
          plant_image?: string;
          description: string;
          location: string;
          latitude?: number;
          longitude?: number;
          start_date: string;
          end_date: string;
          status?: "open" | "accepted" | "completed";
          sitter_id?: string;
          sitter_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          owner_name?: string;
          owner_avatar?: string;
          plant_name?: string;
          plant_image?: string;
          description?: string;
          location?: string;
          latitude?: number;
          longitude?: number;
          start_date?: string;
          end_date?: string;
          status?: "open" | "accepted" | "completed";
          sitter_id?: string;
          sitter_name?: string;
          created_at?: string;
        };
      };
    };
  };
};

// Helper functions for chat operations
export async function fetchChats(userId: string): Promise<Chat[]> {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId)) {
    console.log("Invalid userId format, skipping chat fetch");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .or(`owner_id.eq.${userId},sitter_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    if (!data) return [];

    // Fetch last message for each chat
    const chatsWithMessages = await Promise.all(
      data.map(async (chat) => {
        const { data: messages } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chat.id)
          .order("timestamp", { ascending: false })
          .limit(1);

        return {
          id: chat.id,
          requestId: chat.request_id,
          plantName: chat.plant_name,
          ownerId: chat.owner_id,
          ownerName: chat.owner_name,
          ownerAvatar: chat.owner_avatar,
          sitterId: chat.sitter_id,
          sitterName: chat.sitter_name,
          sitterAvatar: chat.sitter_avatar,
          messages: [],
          lastMessage: messages?.[0]
            ? {
                id: messages[0].id,
                chatId: messages[0].chat_id,
                senderId: messages[0].sender_id,
                senderName: messages[0].sender_name,
                senderAvatar: messages[0].sender_avatar,
                content: messages[0].content,
                timestamp: new Date(messages[0].timestamp),
                isRead: messages[0].is_read,
              }
            : undefined,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at),
        };
      }),
    );

    return chatsWithMessages;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
}

export async function fetchMessages(chatId: string): Promise<ChatMessage[]> {
  if (!supabase) {
    console.log("Supabase not configured, returning empty messages");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("timestamp", { ascending: true });

    if (error) throw error;

    return (data || []).map((msg) => ({
      id: msg.id,
      chatId: msg.chat_id,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      senderAvatar: msg.sender_avatar,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      isRead: msg.is_read,
    }));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | undefined,
  content: string,
): Promise<ChatMessage | null> {
  if (!supabase) {
    console.log("Supabase not configured, cannot send message");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        content,
        timestamp: new Date().toISOString(),
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Update chat's updated_at
    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    return {
      id: data.id,
      chatId: data.chat_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      senderAvatar: data.sender_avatar,
      content: data.content,
      timestamp: new Date(data.timestamp),
      isRead: data.is_read,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}

export async function createChat(chatData: {
  requestId: string;
  plantName: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  sitterId?: string;
  sitterName?: string;
  sitterAvatar?: string;
}): Promise<Chat | null> {
  if (!supabase) {
    console.log("Supabase not configured, cannot create chat");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("chats")
      .insert({
        request_id: chatData.requestId,
        plant_name: chatData.plantName,
        owner_id: chatData.ownerId,
        owner_name: chatData.ownerName,
        owner_avatar: chatData.ownerAvatar,
        sitter_id: chatData.sitterId,
        sitter_name: chatData.sitterName,
        sitter_avatar: chatData.sitterAvatar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      requestId: data.request_id,
      plantName: data.plant_name,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      ownerAvatar: data.owner_avatar,
      sitterId: data.sitter_id,
      sitterName: data.sitter_name,
      sitterAvatar: data.sitter_avatar,
      messages: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error creating chat:", error);
    return null;
  }
}

export function subscribeToMessages(
  chatId: string,
  callback: (message: ChatMessage) => void,
) {
  if (!supabase) {
    console.log("Supabase not configured, cannot subscribe to messages");
    return { unsubscribe: () => {} };
  }

  return supabase
    .channel(`chat:${chatId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        const newMessage =
          payload.new as Database["public"]["Tables"]["messages"]["Row"];
        callback({
          id: newMessage.id,
          chatId: newMessage.chat_id,
          senderId: newMessage.sender_id,
          senderName: newMessage.sender_name,
          senderAvatar: newMessage.sender_avatar,
          content: newMessage.content,
          timestamp: new Date(newMessage.timestamp),
          isRead: newMessage.is_read,
        });
      },
    )
    .subscribe();
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function fetchNearbyRequests(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
): Promise<
  Array<{
    id: string;
    ownerId: string;
    ownerName: string;
    ownerAvatar?: string;
    plantName: string;
    plantImage?: string;
    description: string;
    location: string;
    latitude: number;
    longitude: number;
    startDate: Date;
    endDate: Date;
    status: "open" | "accepted" | "completed";
    sitterId?: string;
    sitterName?: string;
    distance: number;
  }>
> {
  if (!supabase) {
    console.log("Supabase not configured, returning empty requests");
    return [];
  }

  try {
    // Fetch open requests within approximate bounding box first
    // This is a simplified approach - for production, use PostGIS
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("status", "open");

    if (error) throw error;

    if (!data) return [];

    // Calculate exact distances and filter
    return data
      .map((request) => ({
        id: request.id,
        ownerId: request.owner_id,
        ownerName: request.owner_name,
        ownerAvatar: request.owner_avatar,
        plantName: request.plant_name,
        plantImage: request.plant_image,
        description: request.description,
        location: request.location,
        latitude: request.latitude || 0,
        longitude: request.longitude || 0,
        startDate: new Date(request.start_date),
        endDate: new Date(request.end_date),
        status: request.status,
        sitterId: request.sitter_id,
        sitterName: request.sitter_name,
        distance:
          request.latitude && request.longitude
            ? calculateDistance(
                latitude,
                longitude,
                request.latitude,
                request.longitude,
              )
            : Infinity,
      }))
      .filter((req) => req.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("Error fetching nearby requests:", error);
    return [];
  }
}
