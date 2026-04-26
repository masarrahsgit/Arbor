import { useThemeContext } from "@/context/ThemeContext";
import type { LocationCoords, PlantSittingRequest } from "@/types";
import * as Location from "expo-location";
import { MapPin, Navigation, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

interface CommunityMapProps {
  requests: PlantSittingRequest[];
  onMarkerPress?: (request: PlantSittingRequest) => void;
  showProximityRadius?: boolean;
  userLocation?: LocationCoords;
}

const DEFAULT_LOCATION: LocationCoords = {
  latitude: 41.0082,
  longitude: 28.9784,
};

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface RequestWithDistance extends PlantSittingRequest {
  distance: number;
  coordinate: LocationCoords;
}

export default function CommunityMap({
  requests,
  onMarkerPress,
  showProximityRadius = true,
  userLocation,
}: CommunityMapProps) {
  const { colors } = useThemeContext();
  const mapRef = useRef<MapView>(null);
  const [realLocation, setRealLocation] =
    useState<LocationCoords>(DEFAULT_LOCATION);
  const [locationReady, setLocationReady] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<RequestWithDistance | null>(null);
  const [nearbyRequests, setNearbyRequests] = useState<RequestWithDistance[]>(
    [],
  );
  const [proximityRadius, setProximityRadius] = useState(500); // 500km default to show all

  // Get real GPS location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const newLocation = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setRealLocation(newLocation);
        setLocationReady(true);
        // Animate map to real location
        mapRef.current?.animateToRegion(
          {
            ...newLocation,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          },
          1000,
        );
      } else {
        setLocationReady(true);
      }
    })();
  }, []);

  const currentLocation = userLocation || realLocation;

  // Calculate distances using real lat/lng from request data
  useEffect(() => {
    const requestsWithDistance = requests.map((request) => {
      const coordinate: LocationCoords = {
        latitude: request.latitude ?? currentLocation.latitude,
        longitude: request.longitude ?? currentLocation.longitude,
      };
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        coordinate.latitude,
        coordinate.longitude,
      );
      return { ...request, distance, coordinate };
    });

    // Show all requests sorted by distance
    setNearbyRequests(
      requestsWithDistance.sort((a, b) => a.distance - b.distance),
    );
  }, [requests, currentLocation]);

  const formatDistance = (distance: number): string => {
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(0)}km`;
  };

  const handleMarkerPress = (request: RequestWithDistance) => {
    setSelectedRequest(request);
    onMarkerPress?.(request);
  };

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.webFallback,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Navigation size={48} color={colors.tint} style={styles.webIcon} />
        <Text style={[styles.webTitle, { color: colors.text }]}>
          Nearby Plant Sitters
        </Text>
        <Text style={[styles.webSubtitle, { color: colors.textSecondary }]}>
          {nearbyRequests.length} requests found
        </Text>
        <View style={styles.nearbyList}>
          {nearbyRequests.length === 0 ? (
            <Text style={[styles.noResults, { color: colors.textSecondary }]}>
              No plant sitting requests found
            </Text>
          ) : (
            nearbyRequests.slice(0, 5).map((request) => (
              <Pressable
                key={request.id}
                style={[
                  styles.nearbyItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleMarkerPress(request)}
              >
                <View style={styles.nearbyItemLeft}>
                  <View
                    style={[
                      styles.distanceBadge,
                      { backgroundColor: colors.tint + "20" },
                    ]}
                  >
                    <MapPin size={12} color={colors.tint} />
                    <Text style={[styles.distanceText, { color: colors.tint }]}>
                      {formatDistance(request.distance)}
                    </Text>
                  </View>
                  <View style={styles.nearbyItemInfo}>
                    <Text
                      style={[styles.nearbyItemTitle, { color: colors.text }]}
                    >
                      {request.plantName}
                    </Text>
                    <Text
                      style={[
                        styles.nearbyItemSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {request.ownerName} • {request.location}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* User location marker */}
        <Marker coordinate={currentLocation} title="You are here">
          <View style={[styles.userMarker, { backgroundColor: colors.tint }]}>
            <User size={16} color="#fff" />
          </View>
        </Marker>

        {/* Request markers — using real coordinates */}
        {nearbyRequests.map((request) => (
          <Marker
            key={request.id}
            coordinate={request.coordinate}
            title={request.plantName}
            description={`${request.ownerName} • ${request.location} • ${formatDistance(request.distance)}`}
            onPress={() => handleMarkerPress(request)}
          >
            <View
              style={[
                styles.markerContainer,
                {
                  backgroundColor:
                    selectedRequest?.id === request.id
                      ? colors.success
                      : colors.tint,
                },
              ]}
            >
              <MapPin size={18} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Bottom sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
        <View style={styles.bottomSheetHeader}>
          <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
            Plant Sitting Requests ({nearbyRequests.length})
          </Text>
        </View>

        <View style={styles.nearbyListCompact}>
          {nearbyRequests.length === 0 ? (
            <Text style={[styles.noResults, { color: colors.textSecondary }]}>
              No requests found
            </Text>
          ) : (
            nearbyRequests.slice(0, 3).map((request) => (
              <Pressable
                key={request.id}
                style={[
                  styles.nearbyItemCompact,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.tint,
                    borderWidth: selectedRequest?.id === request.id ? 2 : 0,
                  },
                ]}
                onPress={() => handleMarkerPress(request)}
              >
                <View style={styles.distanceBadge}>
                  <Text style={[styles.distanceText, { color: colors.tint }]}>
                    {formatDistance(request.distance)}
                  </Text>
                </View>
                <View style={styles.nearbyItemInfo}>
                  <Text
                    style={[styles.nearbyItemTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {request.plantName}
                  </Text>
                  <Text
                    style={[
                      styles.nearbyItemSubtitle,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {request.ownerName} • {request.location}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  userMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 5,
  },
  markerContainer: { padding: 8, borderRadius: 20, elevation: 5 },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 5,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bottomSheetTitle: { fontSize: 16, fontWeight: "600" },
  nearbyListCompact: { gap: 8 },
  nearbyItemCompact: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  distanceText: { fontSize: 12, fontWeight: "600" },
  nearbyItemInfo: { flex: 1 },
  nearbyItemTitle: { fontSize: 14, fontWeight: "600" },
  nearbyItemSubtitle: { fontSize: 12, marginTop: 2 },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 16,
  },
  webIcon: { marginBottom: 16 },
  webTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  webSubtitle: { fontSize: 14, marginBottom: 20 },
  nearbyList: { width: "100%", gap: 12, marginTop: 8 },
  nearbyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  nearbyItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  noResults: { textAlign: "center", fontSize: 14, marginTop: 20 },
});
