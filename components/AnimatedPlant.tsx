import { useThemeContext } from "@/context/ThemeContext";
import type { Plant } from "@/types";
import { Droplets, Leaf } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

interface AnimatedPlantProps {
  plant: Plant;
  onWater: () => void;
}

export default function AnimatedPlant({ plant, onWater }: AnimatedPlantProps) {
  const { colors } = useThemeContext();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const leafBounceAnim = useRef(new Animated.Value(0)).current;
  const waterDropAnim = useRef(new Animated.Value(0)).current;

  const healthPercent = plant.health / 100;
  const isHealthy = healthPercent > 0.5;

  useEffect(() => {
    // Continuous gentle sway animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000 + (1 - healthPercent) * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 2000 + (1 - healthPercent) * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000 + (1 - healthPercent) * 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [healthPercent]);

  useEffect(() => {
    // Leaf bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(leafBounceAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(leafBounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleWater = () => {
    // Water drop animation
    waterDropAnim.setValue(0);
    Animated.sequence([
      Animated.timing(waterDropAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onWater();
    });
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-5deg", "0deg", "5deg"],
  });

  const leafScale = leafBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const waterDropY = waterDropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 80],
  });

  const waterDropOpacity = waterDropAnim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });

  const stemColor = isHealthy ? colors.leafDark : colors.leafMedium;
  const leafColor = isHealthy ? colors.leafMedium : colors.leafLight;

  return (
    <Pressable onPress={handleWater} style={styles.container}>
      <View style={styles.plantContainer}>
        {/* Water Drop Animation */}
        <Animated.View
          style={[
            styles.waterDrop,
            {
              transform: [{ translateY: waterDropY }],
              opacity: waterDropOpacity,
            },
          ]}
        >
          <Droplets size={32} color={colors.water} />
        </Animated.View>

        {/* Plant */}
        <Animated.View
          style={[
            styles.plant,
            {
              transform: [{ rotate }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Stem */}
          <View
            style={[
              styles.stem,
              {
                backgroundColor: stemColor,
                height: isHealthy ? 120 : 80,
                opacity: healthPercent * 0.5 + 0.5,
              },
            ]}
          />

          {/* Leaves */}
          <Animated.View
            style={[
              styles.leavesContainer,
              { transform: [{ scale: leafScale }] },
            ]}
          >
            {/* Top Leaf */}
            <View
              style={[
                styles.leaf,
                styles.topLeaf,
                {
                  backgroundColor: leafColor,
                  opacity: healthPercent * 0.6 + 0.4,
                },
              ]}
            >
              <Leaf size={40} color={colors.leafDark} />
            </View>

            {/* Left Leaf */}
            <View
              style={[
                styles.leaf,
                styles.leftLeaf,
                {
                  backgroundColor: leafColor,
                  opacity: healthPercent * 0.6 + 0.4,
                },
              ]}
            >
              <Leaf size={32} color={colors.leafDark} />
            </View>

            {/* Right Leaf */}
            <View
              style={[
                styles.leaf,
                styles.rightLeaf,
                {
                  backgroundColor: leafColor,
                  opacity: healthPercent * 0.6 + 0.4,
                },
              ]}
            >
              <Leaf size={32} color={colors.leafDark} />
            </View>
          </Animated.View>
        </Animated.View>

        {/* Pot */}
        <View style={[styles.pot, { backgroundColor: colors.soil }]}>
          <View style={[styles.potRim, { backgroundColor: colors.leafDark }]} />
        </View>

        {/* Tap hint */}
        <View style={styles.tapHint}>
          <Droplets size={16} color={colors.tint} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  plantContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 220,
    width: 150,
  },
  waterDrop: {
    position: "absolute",
    top: 20,
    zIndex: 10,
  },
  plant: {
    alignItems: "center",
    zIndex: 2,
  },
  stem: {
    width: 8,
    borderRadius: 4,
  },
  leavesContainer: {
    position: "absolute",
    top: -20,
    alignItems: "center",
  },
  leaf: {
    position: "absolute",
    borderRadius: 20,
    padding: 4,
  },
  topLeaf: {
    top: -30,
  },
  leftLeaf: {
    left: -35,
    top: 10,
    transform: [{ rotate: "-30deg" }],
  },
  rightLeaf: {
    right: -35,
    top: 10,
    transform: [{ rotate: "30deg" }],
  },
  pot: {
    width: 70,
    height: 60,
    borderRadius: 8,
    marginTop: -5,
    zIndex: 1,
    alignItems: "center",
  },
  potRim: {
    width: 80,
    height: 12,
    borderRadius: 4,
    marginTop: -6,
  },
  tapHint: {
    position: "absolute",
    bottom: 10,
    right: 10,
    opacity: 0.5,
  },
});
