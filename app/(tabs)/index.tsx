import AnimatedPlant from "@/components/AnimatedPlant";
import { useThemeContext } from "@/context/ThemeContext";
import { useUserContext } from "@/context/UserContext";
import type { Plant } from "@/types";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Clock,
  Droplets,
  Plus,
  Trash2,
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

function PlantCard({
  plant,
  onDelete,
}: {
  plant: Plant;
  onDelete: (id: string) => void;
}) {
  const { colors } = useThemeContext();
  const { waterPlant, updatePlantWaterSchedule } = useUserContext();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newSchedule, setNewSchedule] = useState(
    plant.waterFrequencyDays.toString(),
  );

  const daysUntilWater = Math.ceil(
    (plant.nextWatering.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const needsWater = daysUntilWater <= 0;

  const handleUpdateSchedule = () => {
    const days = parseInt(newSchedule, 10);
    if (days > 0) {
      updatePlantWaterSchedule(plant.id, days);
      setShowScheduleModal(false);
    }
  };

  return (
    <>
      <View
        style={[
          styles.plantCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.plantHeader}>
          <View style={styles.plantInfo}>
            <Text style={[styles.plantName, { color: colors.text }]}>
              {plant.name}
            </Text>
            <Text
              style={[styles.plantSpecies, { color: colors.textSecondary }]}
            >
              {plant.species}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {plant.imageUrl && (
              <Image
                source={{ uri: plant.imageUrl }}
                style={styles.plantThumbnail}
              />
            )}
            <Pressable
              onPress={() => setShowDeleteConfirm(true)}
              style={[
                styles.deleteButton,
                { backgroundColor: colors.error + "15" },
              ]}
            >
              <Trash2 size={18} color={colors.error} />
            </Pressable>
          </View>
        </View>

        <View style={styles.plantVisual}>
          <AnimatedPlant plant={plant} onWater={() => waterPlant(plant.id)} />
        </View>

        <View style={styles.waterInfo}>
          <View style={styles.waterStatus}>
            <Droplets
              size={20}
              color={needsWater ? colors.error : colors.tint}
            />
            <Text
              style={[
                styles.waterText,
                { color: needsWater ? colors.error : colors.text },
              ]}
            >
              {needsWater
                ? "Needs water now!"
                : `${daysUntilWater} day${daysUntilWater !== 1 ? "s" : ""} until water`}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowScheduleModal(true)}
            style={[
              styles.scheduleButton,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Clock size={16} color={colors.tint} />
            <Text style={[styles.scheduleText, { color: colors.tint }]}>
              Every {plant.waterFrequencyDays} days
            </Text>
            <ChevronRight size={16} color={colors.tint} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Watering Schedule
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: colors.textSecondary }]}
            >
              How often should {plant.name} be watered?
            </Text>
            <TextInput
              style={[
                styles.scheduleInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={newSchedule}
              onChangeText={setNewSchedule}
              keyboardType="number-pad"
              placeholder="Days"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowScheduleModal(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUpdateSchedule}
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
              >
                <Text style={{ color: "#fff" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Delete Plant
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: colors.textSecondary }]}
            >
              Are you sure you want to delete {plant.name}? This cannot be
              undone.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowDeleteConfirm(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onDelete(plant.id);
                  setShowDeleteConfirm(false);
                }}
                style={[styles.modalButton, { backgroundColor: colors.error }]}
              >
                <Text style={{ color: "#fff" }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function HomeScreen() {
  const { colors } = useThemeContext();
  const { user, isLoading, deletePlant } = useUserContext();
  const router = useRouter();

  // Modal for adding plant manually
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [newPlantSpecies, setNewPlantSpecies] = useState("");
  const [newPlantWaterDays, setNewPlantWaterDays] = useState("7");
  const { updateUser } = useUserContext();

  const handleAddPlant = () => {
    if (!newPlantName.trim() || !user) return;
    const days = parseInt(newPlantWaterDays) || 7;
    const newPlant: Plant = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlantName.trim(),
      species: newPlantSpecies.trim() || newPlantName.trim(),
      waterFrequencyDays: days,
      lastWatered: new Date(),
      nextWatering: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      health: 100,
      isWilted: false,
    };
    updateUser({ plants: [...user.plants, newPlant] });
    setNewPlantName("");
    setNewPlantSpecies("");
    setNewPlantWaterDays("7");
    setShowAddModal(false);
  };

  if (isLoading || !user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.text }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Good morning,
          </Text>
          <Text style={[styles.username, { color: colors.text }]}>
            {user.username}
          </Text>
        </View>
        {user.avatar && (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Plants
          </Text>
          {user.plants.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No plants yet. Add one below or scan a plant!
            </Text>
          )}
          {user.plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} onDelete={deletePlant} />
          ))}
        </View>

        <View style={styles.addButtonRow}>
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Plant Manually</Text>
          </Pressable>
          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: colors.leafDark ?? "#1a4731" },
            ]}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <Plus size={24} color="#fff" />
            <Text style={styles.addButtonText}>Scan a Plant</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Add Plant Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add New Plant
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Plant Name *
            </Text>
            <TextInput
              style={[
                styles.scheduleInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={newPlantName}
              onChangeText={setNewPlantName}
              placeholder="e.g. My Monstera"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Species (optional)
            </Text>
            <TextInput
              style={[
                styles.scheduleInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={newPlantSpecies}
              onChangeText={setNewPlantSpecies}
              placeholder="e.g. Monstera deliciosa"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Water every (days)
            </Text>
            <TextInput
              style={[
                styles.scheduleInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={newPlantWaterDays}
              onChangeText={setNewPlantWaterDays}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddPlant}
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
              >
                <Text style={{ color: "#fff" }}>Add Plant</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  greeting: { fontSize: 14 },
  username: { fontSize: 24, fontWeight: "700" },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    paddingVertical: 20,
  },
  plantCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  plantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  plantInfo: { flex: 1 },
  plantName: { fontSize: 18, fontWeight: "600" },
  plantSpecies: { fontSize: 14, marginTop: 2 },
  plantThumbnail: { width: 50, height: 50, borderRadius: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  plantVisual: { alignItems: "center", marginVertical: 20 },
  waterInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  waterStatus: { flexDirection: "row", alignItems: "center", gap: 8 },
  waterText: { fontSize: 14, fontWeight: "500" },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scheduleText: { fontSize: 12, fontWeight: "500" },
  addButtonRow: { gap: 12, marginTop: 8 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 4,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, marginBottom: 24 },
  scheduleInput: {
    fontSize: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
