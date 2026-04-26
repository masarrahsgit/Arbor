import { useChatContext } from "@/context/ChatContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useUserContext } from "@/context/UserContext";
import type { ChatMessage } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MoreVertical, Phone, Send } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function MessageBubble({
  message,
  isMe,
}: {
  message: ChatMessage;
  isMe: boolean;
}) {
  const { colors, isDark } = useThemeContext();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View
      style={[
        styles.messageBubble,
        isMe
          ? [styles.myMessage, { backgroundColor: colors.tint }]
          : [
              styles.theirMessage,
              { backgroundColor: isDark ? "#2C2C2E" : "#E9E9EB" },
            ],
      ]}
    >
      <Text
        style={[styles.messageText, { color: isMe ? "#fff" : colors.text }]}
      >
        {message.content}
      </Text>
      <View style={styles.messageFooter}>
        <Text
          style={[
            styles.messageTime,
            { color: isMe ? "rgba(255,255,255,0.7)" : colors.textSecondary },
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
        {isMe && (
          <Text style={[styles.readStatus, { color: "rgba(255,255,255,0.7)" }]}>
            {message.isRead ? "✓✓" : "✓"}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useThemeContext();
  const { user } = useUserContext();
  const {
    activeChat,
    messages,
    isLoading,
    loadMessages,
    sendMessage,
    setActiveChat,
    chats,
  } = useChatContext();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messageText, setMessageText] = useState("");

  // Find and set active chat if not already set
  useEffect(() => {
    if (!activeChat || activeChat.id !== id) {
      const chat = chats.find((c) => c.id === id);
      if (chat) {
        setActiveChat(chat);
      }
    }
  }, [id, chats, activeChat]);

  // Load messages when chat is set
  useEffect(() => {
    if (activeChat?.id === id) {
      loadMessages(id);
    }
  }, [activeChat?.id, id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim()) return;

    const text = messageText.trim();
    setMessageText("");
    await sendMessage(text);
  };

  const isOwner = activeChat?.ownerId === user?.id;
  const otherPerson = isOwner
    ? { name: activeChat?.sitterName, avatar: activeChat?.sitterAvatar }
    : { name: activeChat?.ownerName, avatar: activeChat?.ownerAvatar };

  if (!activeChat) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          {otherPerson.avatar ? (
            <Image
              source={{ uri: otherPerson.avatar }}
              style={styles.headerAvatar}
            />
          ) : (
            <View
              style={[
                styles.headerAvatarPlaceholder,
                { backgroundColor: colors.tint },
              ]}
            >
              <Text style={styles.headerAvatarText}>
                {otherPerson.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text
              style={[styles.headerName, { color: colors.text }]}
              numberOfLines={1}
            >
              {otherPerson.name}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {activeChat.plantName}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton}>
            <Phone size={22} color={colors.tint} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <MoreVertical size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Text
                style={[styles.emptyChatText, { color: colors.textSecondary }]}
              >
                Start a conversation about plant sitting
              </Text>
            </View>
          ) : (
            <View style={styles.messagesList}>
              {messages.map((message, index) => {
                const isMe = message.senderId === user?.id;
                const showAvatar =
                  !isMe &&
                  (index === messages.length - 1 ||
                    messages[index + 1]?.senderId !== message.senderId);

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      isMe ? styles.myMessageRow : styles.theirMessageRow,
                    ]}
                  >
                    {!isMe && showAvatar && otherPerson.avatar ? (
                      <Image
                        source={{ uri: otherPerson.avatar }}
                        style={styles.messageAvatar}
                      />
                    ) : !isMe ? (
                      <View style={styles.messageAvatarPlaceholder} />
                    ) : null}

                    <MessageBubble message={message} isMe={isMe} />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!messageText.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: messageText.trim()
                  ? colors.tint
                  : colors.textSecondary + "40",
              },
            ]}
          >
            <Send size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyChatText: {
    fontSize: 14,
  },
  messagesList: {
    paddingHorizontal: 12,
    gap: 4,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  theirMessageRow: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageAvatarPlaceholder: {
    width: 28,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  readStatus: {
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
