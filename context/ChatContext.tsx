import {
  createChat as createChatInSupabase,
  fetchChats,
  fetchMessages,
  sendMessage as sendMessageToSupabase,
  subscribeToMessages,
  supabase,
} from "@/lib/supabase";
import type { Chat, ChatMessage } from "@/types";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useUserContext } from "./UserContext";

interface ChatContextValue {
  chats: Chat[];
  activeChat: Chat | null;
  messages: ChatMessage[];
  isLoading: boolean;
  hasSupabase: boolean;
  setActiveChat: (chat: Chat | null) => void;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  createChat: (
    requestId: string,
    plantName: string,
    ownerId: string,
    ownerName: string,
    ownerAvatar?: string,
  ) => Promise<Chat | null>;
  getOrCreateChat: (
    requestId: string,
    plantName: string,
    ownerId: string,
    ownerName: string,
    ownerAvatar?: string,
  ) => Promise<Chat | null>;
  refreshChats: () => Promise<void>;
}

const CHATS_STORAGE_KEY = "@plant_sitter_chats";
const MESSAGES_STORAGE_KEY = "@plant_sitter_messages";

export const [ChatProvider, useChatContext] =
  createContextHook<ChatContextValue>(() => {
    const { user } = useUserContext();
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [subscription, setSubscription] = useState<{
      unsubscribe: () => void;
    } | null>(null);

    const hasSupabase = !!supabase;

    // Load chats from storage on mount
    useEffect(() => {
      loadChatsFromStorage();
    }, []);

    // Refresh chats when user changes
    useEffect(() => {
      if (user?.id) {
        refreshChats();
      }
    }, [user?.id]);

    // Subscribe to messages when active chat changes
    useEffect(() => {
      if (subscription) {
        subscription.unsubscribe();
        setSubscription(null);
      }

      if (activeChat?.id && hasSupabase) {
        const sub = subscribeToMessages(activeChat.id, (newMessage) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        });
        setSubscription(sub);
      }

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }, [activeChat?.id, hasSupabase]);

    const loadChatsFromStorage = async () => {
      try {
        const storedChats = await AsyncStorage.getItem(CHATS_STORAGE_KEY);
        if (storedChats) {
          const parsed = JSON.parse(storedChats);
          setChats(
            parsed.map((c: Chat) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
              lastMessage: c.lastMessage
                ? {
                    ...c.lastMessage,
                    timestamp: new Date(c.lastMessage.timestamp),
                  }
                : undefined,
            })),
          );
        }
      } catch (error) {
        console.error("Error loading chats from storage:", error);
      }
    };

    const saveChatsToStorage = async (chatsToSave: Chat[]) => {
      try {
        await AsyncStorage.setItem(
          CHATS_STORAGE_KEY,
          JSON.stringify(chatsToSave),
        );
      } catch (error) {
        console.error("Error saving chats to storage:", error);
      }
    };

    const refreshChats = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        if (hasSupabase) {
          const supabaseChats = await fetchChats(user.id);
          setChats(supabaseChats);
          await saveChatsToStorage(supabaseChats);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const loadMessages = async (chatId: string) => {
      setIsLoading(true);
      try {
        if (hasSupabase) {
          const supabaseMessages = await fetchMessages(chatId);
          setMessages(supabaseMessages);
        } else {
          // Load from local storage fallback
          const stored = await AsyncStorage.getItem(
            `${MESSAGES_STORAGE_KEY}_${chatId}`,
          );
          if (stored) {
            const parsed = JSON.parse(stored);
            setMessages(
              parsed.map((m: ChatMessage) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            );
          } else {
            setMessages([]);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    const sendMessage = async (content: string) => {
      if (!activeChat || !user) return;

      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        chatId: activeChat.id,
        senderId: user.id,
        senderName: user.username,
        senderAvatar: user.avatar,
        content,
        timestamp: new Date(),
        isRead: false,
      };

      // Optimistic update
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        if (hasSupabase) {
          const sentMessage = await sendMessageToSupabase(
            activeChat.id,
            user.id,
            user.username,
            user.avatar,
            content,
          );

          if (sentMessage) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === optimisticMessage.id ? sentMessage : m,
              ),
            );
          }
        } else {
          // Local storage fallback
          const newMessage: ChatMessage = {
            ...optimisticMessage,
            id: `local-${Date.now()}`,
          };
          const updatedMessages = [...messages, newMessage];
          await AsyncStorage.setItem(
            `${MESSAGES_STORAGE_KEY}_${activeChat.id}`,
            JSON.stringify(updatedMessages),
          );
          setMessages(updatedMessages);

          // Update chat's last message
          const updatedChat = {
            ...activeChat,
            lastMessage: newMessage,
            updatedAt: new Date(),
          };
          const updatedChats = chats.map((c) =>
            c.id === updatedChat.id ? updatedChat : c,
          );
          setChats(updatedChats);
          await saveChatsToStorage(updatedChats);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id),
        );
      }
    };

    const createChat = async (
      requestId: string,
      plantName: string,
      ownerId: string,
      ownerName: string,
      ownerAvatar?: string,
    ): Promise<Chat | null> => {
      if (!user) return null;

      try {
        let newChat: Chat | null = null;

        if (hasSupabase) {
          newChat = await createChatInSupabase({
            requestId,
            plantName,
            ownerId,
            ownerName,
            ownerAvatar,
            sitterId: user.id,
            sitterName: user.username,
            sitterAvatar: user.avatar,
          });
        } else {
          // Local storage fallback
          newChat = {
            id: `local-${Date.now()}`,
            requestId,
            plantName,
            ownerId,
            ownerName,
            ownerAvatar,
            sitterId: user.id,
            sitterName: user.username,
            sitterAvatar: user.avatar,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        if (newChat) {
          const updatedChats = [newChat, ...chats];
          setChats(updatedChats);
          await saveChatsToStorage(updatedChats);
        }

        return newChat;
      } catch (error) {
        console.error("Error creating chat:", error);
        return null;
      }
    };

    const getOrCreateChat = async (
      requestId: string,
      plantName: string,
      ownerId: string,
      ownerName: string,
      ownerAvatar?: string,
    ): Promise<Chat | null> => {
      // Check if chat already exists
      const existingChat = chats.find((c) => c.requestId === requestId);
      if (existingChat) {
        return existingChat;
      }

      // Create new chat
      return createChat(requestId, plantName, ownerId, ownerName, ownerAvatar);
    };

    return {
      chats,
      activeChat,
      messages,
      isLoading,
      hasSupabase,
      setActiveChat,
      loadMessages,
      sendMessage,
      createChat,
      getOrCreateChat,
      refreshChats,
    };
  });
