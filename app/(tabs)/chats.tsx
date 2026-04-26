import { useChatContext } from "@/context/ChatContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useUserContext } from "@/context/UserContext";
import type { Chat } from "@/types";
import { useRouter } from "expo-router";
import { Clock, MessageCircle } from "lucide-react-native";
import { useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ChatListItem({ chat, onPress }: { chat: Chat; onPress: () => void }) {
  const { colors } = useThemeContext();
  const { user } = useUserContext();

  const isOwner = chat.ownerId === user?.id;
  const otherPerson = isOwner
    ? { name: chat.sitterName, avatar: chat.sitterAvatar }
    : { name: chat.ownerName, avatar: chat.ownerAvatar };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chatItem, { backgroundColor: colors.card }]}
    >
      <View style={styles.avatarContainer}>
        {otherPerson.avatar ? (
          <Image source={{ uri: otherPerson.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}
          >
            <Text style={styles.avatarText}>
              {otherPerson.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text
            style={[styles.chatName, { color: colors.text }]}
            numberOfLines={1}
          >
            {otherPerson.name}
          </Text>
          {chat.lastMessage && (
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formatTime(chat.lastMessage.timestamp)}
            </Text>
          )}
        </View>

        <View style={styles.chatInfo}>
          <Text
            style={[styles.plantName, { color: colors.tint }]}
            numberOfLines={1}
          >
            {chat.plantName}
          </Text>
        </View>

        {chat.lastMessage ? (
          <Text
            style={[
              styles.lastMessage,
              {
                color: chat.lastMessage.isRead
                  ? colors.textSecondary
                  : colors.text,
              },
              !chat.lastMessage.isRead && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage.senderId === user?.id ? "You: " : ""}
            {chat.lastMessage.content}
          </Text>
        ) : (
          <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
            Tap to start chatting
          </Text>
        )}
      </View>

      {!chat.lastMessage?.isRead && chat.lastMessage?.senderId !== user?.id && (
        <View style={[styles.unreadBadge, { backgroundColor: colors.tint }]}>
          <Text style={styles.unreadBadgeText}>1</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function ChatsScreen() {
  const { colors } = useThemeContext();
  const { user } = useUserContext();
  const { chats, isLoading, refreshChats, setActiveChat, hasSupabase } =
    useChatContext();
  const router = useRouter();

  useEffect(() => {
    refreshChats();
  }, []);

  const handleChatPress = (chat: Chat) => {
    setActiveChat(chat);
    router.push({
      pathname: "/chat/[id]",
      params: { id: chat.id },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Your conversations
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
        </View>
      </View>

      {!hasSupabase && (
        <View
          style={[styles.noticeBanner, { backgroundColor: colors.tint + "20" }]}
        >
          <Clock size={16} color={colors.tint} />
          <Text style={[styles.noticeText, { color: colors.tint }]}>
            Using local storage. Connect Supabase for real-time chat.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.tint + "15" },
              ]}
            >
              <MessageCircle size={48} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No conversations yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              Start chatting with plant sitters or owners from the Community tab
            </Text>
          </View>
        ) : (
          <View style={styles.chatList}>
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                onPress={() => handleChatPress(chat)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 10,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  chatList: {
    gap: 8,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatContent: {
    flex: 1,
    marginLeft: 14,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  timeText: {
    fontSize: 12,
  },
  chatInfo: {
    marginBottom: 2,
  },
  plantName: {
    fontSize: 12,
    fontWeight: "500",
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadMessage: {
    fontWeight: "600",
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
