import { ThemeMode, useThemeContext } from "@/context/ThemeContext";
import { useUserContext } from "@/context/UserContext";
import {
  Bell,
  Camera,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Moon,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { colors, theme, setTheme } = useThemeContext();
  const { user, updateUser, logout } = useUserContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: user?.username || "",
    email: user?.email || "",
    location: user?.location || "",
    bio: user?.bio || "",
  });

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.text }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    updateUser(editedUser);
    setIsEditing(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const getThemeLabel = (t: ThemeMode) => {
    switch (t) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <Pressable
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          style={[styles.editButton, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? "Save" : "Edit"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.tint },
                ]}
              >
                <User size={40} color="#fff" />
              </View>
            )}
            <Pressable
              style={[styles.cameraButton, { backgroundColor: colors.tint }]}
              onPress={() =>
                Alert.alert("Coming Soon", "Change avatar feature coming soon!")
              }
            >
              <Camera size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Profile Info */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.inputGroup}>
            <User size={20} color={colors.tint} />
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border },
                ]}
                value={editedUser.username}
                onChangeText={(text) =>
                  setEditedUser({ ...editedUser, username: text })
                }
                placeholder="Username"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <View style={styles.valueContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Username
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {user.username}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.inputGroup}>
            <Mail size={20} color={colors.tint} />
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border },
                ]}
                value={editedUser.email}
                onChangeText={(text) =>
                  setEditedUser({ ...editedUser, email: text })
                }
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
              />
            ) : (
              <View style={styles.valueContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Email
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {user.email}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.inputGroup}>
            <MapPin size={20} color={colors.tint} />
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border },
                ]}
                value={editedUser.location}
                onChangeText={(text) =>
                  setEditedUser({ ...editedUser, location: text })
                }
                placeholder="Location"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <View style={styles.valueContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Location
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {user.location || "Not set"}
                </Text>
              </View>
            )}
          </View>

          {isEditing && (
            <>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Bio
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundSecondary,
                    },
                  ]}
                  value={editedUser.bio}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, bio: text })
                  }
                  placeholder="Tell us about yourself"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}
        </View>

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Settings
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Pressable
            style={styles.settingRow}
            onPress={() => {
              const themes: ThemeMode[] = ["light", "dark", "system"];
              const currentIndex = themes.indexOf(theme);
              setTheme(themes[(currentIndex + 1) % themes.length]);
            }}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.tint + "20" },
                ]}
              >
                <Moon size={20} color={colors.tint} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Theme
                </Text>
                <Text
                  style={[styles.settingValue, { color: colors.textSecondary }]}
                >
                  {getThemeLabel(theme)}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.tint + "20" },
                ]}
              >
                <Bell size={20} color={colors.tint} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Push Notifications
                </Text>
                <Text
                  style={[styles.settingValue, { color: colors.textSecondary }]}
                >
                  Watering reminders
                </Text>
              </View>
            </View>
            <Switch
              value={user.pushNotificationsEnabled}
              onValueChange={(value) =>
                updateUser({ pushNotificationsEnabled: value })
              }
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Plants Summary */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          My Plants
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Plants
            </Text>
            <Text style={[styles.statValue, { color: colors.tint }]}>
              {user.plants.length}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Need Watering
            </Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {
                user.plants.filter(
                  (p) => new Date(p.nextWatering) <= new Date(),
                ).length
              }
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "700" },
  editButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarContainer: { position: "relative" },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  valueContainer: { flex: 1 },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 16, fontWeight: "500" },
  input: { flex: 1, fontSize: 16, padding: 8, borderWidth: 1, borderRadius: 8 },
  textArea: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    height: 80,
    textAlignVertical: "top",
  },
  divider: { height: 1, marginVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  settingValue: { fontSize: 13, marginTop: 2 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statLabel: { fontSize: 16 },
  statValue: { fontSize: 18, fontWeight: "600" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600" },
});
