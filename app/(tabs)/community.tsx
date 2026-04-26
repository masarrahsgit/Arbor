import CommunityMap from "@/components/CommunityMap";
import { useChatContext } from "@/context/ChatContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useUserContext } from "@/context/UserContext";
import type { PlantSittingRequest } from "@/types";
import { useRouter } from "expo-router";
import {
  Calendar,
  Check,
  List,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Plus,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function RequestCard({ request }: { request: PlantSittingRequest }) {
  const { colors } = useThemeContext();
  const { acceptRequest, user } = useUserContext();
  const { getOrCreateChat, setActiveChat } = useChatContext();
  const router = useRouter();
  const isOwner = request.ownerId === user?.id;
  const isSitter = request.sitterId === user?.id;

  const handleChatPress = async () => {
    const chat = await getOrCreateChat(
      request.id,
      request.plantName,
      request.ownerId,
      request.ownerName,
      request.ownerAvatar,
    );
    if (chat) {
      setActiveChat(chat);
      router.push({
        pathname: "/chat/[id]",
        params: { id: chat.id },
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.ownerInfo}>
          {request.ownerAvatar && (
            <Image
              source={{ uri: request.ownerAvatar }}
              style={styles.ownerAvatar}
            />
          )}
          <View>
            <Text style={[styles.ownerName, { color: colors.text }]}>
              {request.ownerName}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {request.location}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                request.status === "open"
                  ? colors.tint + "20"
                  : request.status === "accepted"
                    ? colors.success + "20"
                    : colors.textSecondary + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  request.status === "open"
                    ? colors.tint
                    : request.status === "accepted"
                      ? colors.success
                      : colors.textSecondary,
              },
            ]}
          >
            {request.status === "open"
              ? "Open"
              : request.status === "accepted"
                ? "Accepted"
                : "Completed"}
          </Text>
        </View>
      </View>

      {request.plantImage && (
        <Image source={{ uri: request.plantImage }} style={styles.plantImage} />
      )}

      <View style={styles.cardContent}>
        <Text style={[styles.plantName, { color: colors.text }]}>
          {request.plantName}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {request.description}
        </Text>

        <View style={styles.dateRow}>
          <Calendar size={16} color={colors.tint} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDate(request.startDate)} - {formatDate(request.endDate)}
          </Text>
        </View>

        {request.status === "open" && !isOwner && (
          <View style={styles.actionButtons}>
            <Pressable
              onPress={() => acceptRequest(request.id)}
              style={[
                styles.actionButton,
                { backgroundColor: colors.tint, flex: 1 },
              ]}
            >
              <User size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Offer to Plant Sit</Text>
            </Pressable>
            <Pressable
              onPress={handleChatPress}
              style={[
                styles.chatButton,
                { backgroundColor: colors.tint + "20" },
              ]}
            >
              <MessageCircle size={20} color={colors.tint} />
            </Pressable>
          </View>
        )}

        {(isSitter || isOwner) && request.status === "accepted" && (
          <View style={styles.actionButtons}>
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.success + "20", flex: 1 },
              ]}
            >
              <Check size={16} color={colors.success} />
              <Text style={[styles.badgeText, { color: colors.success }]}>
                {isSitter
                  ? "You are sitting this plant"
                  : "Plant sitter assigned"}
              </Text>
            </View>
            <Pressable
              onPress={handleChatPress}
              style={[
                styles.chatButton,
                { backgroundColor: colors.tint + "20" },
              ]}
            >
              <MessageCircle size={20} color={colors.tint} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const { colors } = useThemeContext();
  const { requests, createRequest, user } = useUserContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [newRequest, setNewRequest] = useState({
    plantName: "",
    description: "",
    location: "",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  const openRequests = requests.filter((r) => r.status === "open");
  const myRequests = requests.filter(
    (r) => r.ownerId === user?.id || r.sitterId === user?.id,
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Plant Sitting Community
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
            style={[
              styles.viewModeButton,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            {viewMode === "list" ? (
              <MapIcon size={20} color={colors.tint} />
            ) : (
              <List size={20} color={colors.tint} />
            )}
          </Pressable>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={[styles.createButton, { backgroundColor: colors.tint }]}
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {viewMode === "map" ? (
        <View style={styles.mapContainer}>
          <CommunityMap
            requests={requests.filter((r) => r.status === "open")}
            onMarkerPress={(request) => {
              // Could navigate to request detail or show modal
              console.log("Selected request:", request);
            }}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {myRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Requests
              </Text>
              {myRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Open Requests
            </Text>
            {openRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create Plant Sitting Request
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Plant name"
              placeholderTextColor={colors.textSecondary}
              value={newRequest.plantName}
              onChangeText={(text) =>
                setNewRequest({ ...newRequest, plantName: text })
              }
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={newRequest.description}
              onChangeText={(text) =>
                setNewRequest({ ...newRequest, description: text })
              }
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Location"
              placeholderTextColor={colors.textSecondary}
              value={newRequest.location}
              onChangeText={(text) =>
                setNewRequest({ ...newRequest, location: text })
              }
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (
                    newRequest.plantName &&
                    newRequest.description &&
                    newRequest.location
                  ) {
                    createRequest(newRequest);
                    setShowCreateModal(false);
                    setNewRequest({
                      plantName: "",
                      description: "",
                      location: "",
                      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    });
                  }
                }}
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
              >
                <Text style={{ color: "#fff" }}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  viewModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  plantImage: {
    width: "100%",
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  plantName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
