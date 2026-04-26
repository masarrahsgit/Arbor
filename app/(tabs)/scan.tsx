import { useThemeContext } from "@/context/ThemeContext";
import { useUserContext } from "@/context/UserContext";
import { scheduleWateringReminder } from "@/lib/notifications";
import type { IdentifiedPlant } from "@/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Camera, Check, Edit2, Plus, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_IDENTIFIED_PLANTS: IdentifiedPlant[] = [
  {
    id: "1",
    name: "Monstera Deliciosa",
    scientificName: "Monstera deliciosa",
    confidence: 0.94,
    description:
      "Popular tropical houseplant known for its unique split leaves.",
    careInstructions: {
      waterFrequency: 7,
      light: "Bright indirect light",
      temperature: "65-85°F (18-29°C)",
    },
  },
  {
    id: "2",
    name: "Snake Plant",
    scientificName: "Sansevieria trifasciata",
    confidence: 0.89,
    description:
      "Hardy succulent with tall, stiff leaves. Excellent air purifier.",
    careInstructions: {
      waterFrequency: 14,
      light: "Low to bright indirect light",
      temperature: "55-85°F (13-29°C)",
    },
  },
];

export default function ScanScreen() {
  const { colors } = useThemeContext();
  const { updateUser, user } = useUserContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Analyzing plant...");
  const [identifiedPlant, setIdentifiedPlant] =
    useState<IdentifiedPlant | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editScientificName, setEditScientificName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWaterFrequency, setEditWaterFrequency] = useState("");
  const [editLight, setEditLight] = useState("");
  const [editTemperature, setEditTemperature] = useState("");

  const startEditing = () => {
    if (!identifiedPlant) return;
    setEditName(identifiedPlant.name);
    setEditScientificName(identifiedPlant.scientificName);
    setEditDescription(identifiedPlant.description);
    setEditWaterFrequency(
      String(identifiedPlant.careInstructions.waterFrequency),
    );
    setEditLight(identifiedPlant.careInstructions.light);
    setEditTemperature(identifiedPlant.careInstructions.temperature);
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (!identifiedPlant) return;
    setIdentifiedPlant({
      ...identifiedPlant,
      name: editName,
      scientificName: editScientificName,
      description: editDescription,
      careInstructions: {
        waterFrequency:
          parseInt(editWaterFrequency) ||
          identifiedPlant.careInstructions.waterFrequency,
        light: editLight,
        temperature: editTemperature,
      },
    });
    setIsEditing(false);
  };

  const resetScan = () => {
    setCapturedImage(null);
    setIdentifiedPlant(null);
    setIsEditing(false);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setCapturedImage(photo.uri);
        await identifyPlant(photo.uri);
      }
    }
  };

  const getCareDefaults = (scientificName: string) => {
    const name = scientificName.toLowerCase();
    if (
      name.includes("cactus") ||
      name.includes("succulent") ||
      name.includes("aloe") ||
      name.includes("echeveria")
    ) {
      return {
        waterFrequency: 21,
        light: "Bright direct light",
        temperature: "60-90°F (15-32°C)",
      };
    }
    if (
      name.includes("monstera") ||
      name.includes("pothos") ||
      name.includes("philodendron")
    ) {
      return {
        waterFrequency: 7,
        light: "Bright indirect light",
        temperature: "65-85°F (18-29°C)",
      };
    }
    if (name.includes("orchid")) {
      return {
        waterFrequency: 10,
        light: "Bright indirect light",
        temperature: "60-80°F (15-27°C)",
      };
    }
    if (
      name.includes("fern") ||
      name.includes("calathea") ||
      name.includes("prayer")
    ) {
      return {
        waterFrequency: 3,
        light: "Low to medium indirect light",
        temperature: "60-75°F (15-24°C)",
      };
    }
    if (
      name.includes("snake") ||
      name.includes("sansevieria") ||
      name.includes("dracaena")
    ) {
      return {
        waterFrequency: 14,
        light: "Low to bright indirect light",
        temperature: "55-85°F (13-29°C)",
      };
    }
    if (
      name.includes("rose") ||
      name.includes("lavender") ||
      name.includes("basil")
    ) {
      return {
        waterFrequency: 2,
        light: "Full sun",
        temperature: "60-80°F (15-27°C)",
      };
    }
    return {
      waterFrequency: 7,
      light: "Bright indirect light",
      temperature: "65-80°F (18-27°C)",
    };
  };

  const identifyPlant = async (imageUri: string) => {
    setIsIdentifying(true);
    setLoadingMessage("📸 Capturing image...");

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      setLoadingMessage("🔍 Analyzing plant features...");

      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const base64Only = base64data.split(",")[1];

          setLoadingMessage("🌿 Identifying species...");

          const apiResponse = await fetch("/api/identify-plant", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imagesBase64: base64data,
            }),
          });

          const data = await apiResponse.json();
          setLoadingMessage("✅ Almost done...");

          if (data.success && data.plant) {
            const topMatch = data.result.classification.suggestions[0];
            const scientificName = topMatch.name ?? "Unknown Plant";
            const confidence = topMatch.probability ?? 0.5;
            const commonName =
              topMatch.details?.common_names?.[0] ?? scientificName;
            const description =
              topMatch.details?.description?.value ??
              `${commonName} is a beautiful plant.`;
            const careDefaults = getCareDefaults(scientificName);

            setIdentifiedPlant({
              id: Math.random().toString(36).substr(2, 9),
              name: data.plant.name,
              scientificName: data.plant.scientificName,
              confidence: data.plant.confidence,
              description: data.plant.description,
              careInstructions: data.plant.careInstructions,
            });
          } else {
            throw new Error(data.error || "API failed");
          }
        } catch (error) {
          console.error("Plant.id error:", error);
          const randomPlant =
            MOCK_IDENTIFIED_PLANTS[
              Math.floor(Math.random() * MOCK_IDENTIFIED_PLANTS.length)
            ];
          setIdentifiedPlant(randomPlant);
          Alert.alert("Note", "Could not identify plant. Using demo data.");
        } finally {
          setIsIdentifying(false);
        }
      };

      reader.onerror = () => {
        const randomPlant =
          MOCK_IDENTIFIED_PLANTS[
            Math.floor(Math.random() * MOCK_IDENTIFIED_PLANTS.length)
          ];
        setIdentifiedPlant(randomPlant);
        setIsIdentifying(false);
      };
    } catch (error) {
      console.error("Image error:", error);
      const randomPlant =
        MOCK_IDENTIFIED_PLANTS[
          Math.floor(Math.random() * MOCK_IDENTIFIED_PLANTS.length)
        ];
      setIdentifiedPlant(randomPlant);
      setIsIdentifying(false);
    }
  };

  const addToMyPlants = async () => {
    if (identifiedPlant && user) {
      const plantId = Math.random().toString(36).substr(2, 9);
      const newPlant = {
        id: plantId,
        name: identifiedPlant.name,
        species: identifiedPlant.scientificName,
        waterFrequencyDays: identifiedPlant.careInstructions.waterFrequency,
        lastWatered: new Date(),
        nextWatering: new Date(
          Date.now() +
            identifiedPlant.careInstructions.waterFrequency *
              24 *
              60 *
              60 *
              1000,
        ),
        health: 100,
        isWilted: false,
        imageUrl: capturedImage || undefined,
      };
      updateUser({ plants: [...user.plants, newPlant] });

      try {
        await scheduleWateringReminder(
          identifiedPlant.name,
          identifiedPlant.careInstructions.waterFrequency,
          plantId,
        );
      } catch (error) {
        console.warn("Could not schedule watering reminder:", error);
      }

      Alert.alert(
        "Success",
        `${identifiedPlant.name} added! You'll be reminded to water it every ${identifiedPlant.careInstructions.waterFrequency} days.`,
      );
      resetScan();
    }
  };

  if (!permission) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Camera size={64} color={colors.tint} style={styles.permissionIcon} />
        <Text style={[styles.permissionTitle, { color: colors.text }]}>
          Camera Access Needed
        </Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          We need camera access to identify your plants
        </Text>
        <Pressable
          onPress={requestPermission}
          style={[styles.permissionButton, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (isIdentifying) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.identifyingContainer}>
          {capturedImage && (
            <Image
              source={{ uri: capturedImage }}
              style={styles.identifyingImage}
            />
          )}
          <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator
              size="large"
              color={colors.tint}
              style={styles.identifyingSpinner}
            />
            <Text style={[styles.identifyingText, { color: colors.text }]}>
              {loadingMessage}
            </Text>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.dot, { backgroundColor: colors.tint }]}
                />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (identifiedPlant) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Pressable onPress={resetScan} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Plant Identified!
          </Text>
          <Pressable
            onPress={isEditing ? saveEdits : startEditing}
            style={styles.editButton}
          >
            {isEditing ? (
              <Check size={22} color={colors.tint} />
            ) : (
              <Edit2 size={22} color={colors.tint} />
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.resultContent}>
          {capturedImage && (
            <Image
              source={{ uri: capturedImage }}
              style={styles.capturedImage}
            />
          )}

          <View
            style={[
              styles.resultCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.confidenceBadge}>
              <Text style={[styles.confidenceText, { color: colors.success }]}>
                {Math.round(identifiedPlant.confidence * 100)}% match
              </Text>
            </View>

            {isEditing ? (
              <View style={styles.editSection}>
                <Text
                  style={[styles.editLabel, { color: colors.textSecondary }]}
                >
                  Plant Name
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholderTextColor={colors.textSecondary}
                />
                <Text
                  style={[styles.editLabel, { color: colors.textSecondary }]}
                >
                  Scientific Name
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={editScientificName}
                  onChangeText={setEditScientificName}
                  placeholderTextColor={colors.textSecondary}
                />
                <Text
                  style={[styles.editLabel, { color: colors.textSecondary }]}
                >
                  Description
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    styles.editInputMultiline,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  placeholderTextColor={colors.textSecondary}
                />
                <Text
                  style={[styles.editLabel, { color: colors.textSecondary }]}
                >
                  Water every (days)
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={editWaterFrequency}
                  onChangeText={setEditWaterFrequency}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text
                  style={[styles.editLabel, { color: colors.textSecondary }]}
                >
                  Light requirements
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={editLight}
                  onChangeText={setEditLight}
                  placeholderTextColor={colors.textSecondary}
                />
                <Text
                  style={[styles.editLabel, { color: colors.textSecondary }]}
                >
                  Temperature range
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={editTemperature}
                  onChangeText={setEditTemperature}
                  placeholderTextColor={colors.textSecondary}
                />
                <Pressable
                  onPress={saveEdits}
                  style={[styles.saveButton, { backgroundColor: colors.tint }]}
                >
                  <Check size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={[styles.plantName, { color: colors.text }]}>
                  {identifiedPlant.name}
                </Text>
                <Text
                  style={[
                    styles.scientificName,
                    { color: colors.textSecondary },
                  ]}
                >
                  {identifiedPlant.scientificName}
                </Text>
                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                >
                  {identifiedPlant.description}
                </Text>
                <View
                  style={[
                    styles.careSection,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.careTitle, { color: colors.text }]}>
                    Care Instructions
                  </Text>
                  <View style={styles.careItem}>
                    <Text style={[styles.careLabel, { color: colors.tint }]}>
                      Water
                    </Text>
                    <Text style={[styles.careValue, { color: colors.text }]}>
                      Every {identifiedPlant.careInstructions.waterFrequency}{" "}
                      days
                    </Text>
                  </View>
                  <View style={styles.careItem}>
                    <Text style={[styles.careLabel, { color: colors.tint }]}>
                      Light
                    </Text>
                    <Text style={[styles.careValue, { color: colors.text }]}>
                      {identifiedPlant.careInstructions.light}
                    </Text>
                  </View>
                  <View style={styles.careItem}>
                    <Text style={[styles.careLabel, { color: colors.tint }]}>
                      Temperature
                    </Text>
                    <Text style={[styles.careValue, { color: colors.text }]}>
                      {identifiedPlant.careInstructions.temperature}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {!isEditing && (
              <Pressable
                onPress={addToMyPlants}
                style={[styles.addButton, { backgroundColor: colors.tint }]}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add to My Plants</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Scan Plant
        </Text>
      </View>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.overlay}>
          <View style={[styles.scanFrame, { borderColor: colors.tint }]}>
            <View
              style={[
                styles.corner,
                styles.cornerTL,
                { borderColor: colors.tint },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerTR,
                { borderColor: colors.tint },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerBL,
                { borderColor: colors.tint },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerBR,
                { borderColor: colors.tint },
              ]}
            />
          </View>
          <Text style={[styles.scanHint, { color: "#fff" }]}>
            Center your plant in the frame
          </Text>
        </View>
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={takePicture}
          style={[styles.captureButton, { borderColor: colors.tint }]}
        >
          <View
            style={[styles.captureInner, { backgroundColor: colors.tint }]}
          />
        </Pressable>
      </View>
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
  headerTitle: { fontSize: 20, fontWeight: "600" },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionIcon: { marginBottom: 20 },
  permissionTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  permissionText: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderRadius: 20 },
  corner: { position: "absolute", width: 30, height: 30, borderWidth: 4 },
  cornerTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  scanHint: { marginTop: 20, fontSize: 16, fontWeight: "500" },
  controls: { paddingVertical: 24, alignItems: "center" },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: { width: 60, height: 60, borderRadius: 30 },
  identifyingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  identifyingImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  loadingCard: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  identifyingSpinner: { marginBottom: 16 },
  identifyingText: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 12,
    textAlign: "center",
  },
  loadingDots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, opacity: 0.6 },
  resultContent: { padding: 20 },
  capturedImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  resultCard: { borderRadius: 20, padding: 24, borderWidth: 1 },
  confidenceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  confidenceText: { fontSize: 14, fontWeight: "600" },
  plantName: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  scientificName: { fontSize: 16, fontStyle: "italic", marginBottom: 16 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  careSection: { borderTopWidth: 1, paddingTop: 20, marginBottom: 20 },
  careTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  careItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  careLabel: { fontSize: 14, fontWeight: "500" },
  careValue: { fontSize: 14 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  editSection: { gap: 4 },
  editLabel: { fontSize: 12, fontWeight: "500", marginTop: 8, marginBottom: 2 },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 4,
  },
  editInputMultiline: { minHeight: 80, textAlignVertical: "top" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
