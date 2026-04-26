import { supabase } from "@/lib/supabase";
import type { Plant, PlantSittingRequest, User } from "@/types";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const MOCK_REQUESTS: PlantSittingRequest[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    ownerId: "fe136c43-f425-4c0f-83f8-317bfd5abd11",
    ownerName: "Sarah Green",
    ownerAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    plantName: "Fiddle Leaf Fig",
    plantImage:
      "https://images.unsplash.com/photo-1597055181300-e30ba15247b5?w=400",
    description:
      "Going on vacation for 2 weeks. Need someone to water my fiddle leaf fig twice a week.",
    location: "Istanbul, Turkey",
    latitude: 41.0082,
    longitude: 28.9784,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    status: "open",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-234567890123",
    ownerId: "ee3f482a-c133-4c93-b316-627e5c112db1",
    ownerName: "Mike Johnson",
    ownerAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    plantName: "Peace Lily Collection",
    plantImage:
      "https://images.unsplash.com/photo-1593691509543-c55ce32e045c?w=400",
    description:
      "Three peace lilies that need daily misting. Willing to pay $50 for the week!",
    location: "Ankara, Turkey",
    latitude: 39.9334,
    longitude: 32.8597,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: "open",
  },
  {
    id: "d4e5f6a7-b8c9-0123-def0-345678901234",
    ownerId: "1b09e62d-75d6-41f6-8684-dc52c5b0a8c5",
    ownerName: "Kuzey",
    plantName: "Orchids",
    description: "Orchid branch needs light watering twice a week.",
    location: "Kadikoy, Istanbul",
    latitude: 40.9833,
    longitude: 29.0333,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    status: "open",
  },
];

interface UserContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  requests: PlantSittingRequest[];
  waterPlant: (plantId: string) => void;
  updatePlantWaterSchedule: (plantId: string, days: number) => void;
  deletePlant: (plantId: string) => void;
  acceptRequest: (requestId: string) => void;
  createRequest: (
    request: Omit<
      PlantSittingRequest,
      "id" | "ownerId" | "ownerName" | "ownerAvatar" | "status"
    >,
  ) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const [UserProvider, useUserContext] =
  createContextHook<UserContextValue>(() => {
    const [user, setUser] = useState<User | null>(null);
    const [requests, setRequests] =
      useState<PlantSittingRequest[]>(MOCK_REQUESTS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          await loadOrCreateUser(
            session.user.id,
            session.user.email ?? "",
            session.user.user_metadata?.name ?? "",
          );
        } else {
          const stored = await AsyncStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.plants =
              parsed.plants?.map((p: Plant) => ({
                ...p,
                lastWatered: new Date(p.lastWatered),
                nextWatering: new Date(p.nextWatering),
              })) ?? [];
            setUser(parsed);
          }
        }
        setIsLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await loadOrCreateUser(
            session.user.id,
            session.user.email ?? "",
            session.user.user_metadata?.name ?? "",
          );
        } else {
          setUser(null);
          await AsyncStorage.removeItem("user");
        }
      });

      return () => subscription.unsubscribe();
    }, []);

    const loadOrCreateUser = async (
      id: string,
      email: string,
      name: string,
    ) => {
      const stored = await AsyncStorage.getItem(`user_plants_${id}`);
      const plants: Plant[] = stored
        ? JSON.parse(stored).map((p: Plant) => ({
            ...p,
            lastWatered: new Date(p.lastWatered),
            nextWatering: new Date(p.nextWatering),
          }))
        : [];

      const newUser: User = {
        id,
        username: name || email.split("@")[0],
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=2d6a4f&color=fff`,
        location: "",
        bio: "",
        plants,
        theme: "system",
        pushNotificationsEnabled: true,
      };

      setUser(newUser);
    };

    useEffect(() => {
      if (user?.id) {
        AsyncStorage.setItem(
          `user_plants_${user.id}`,
          JSON.stringify(user.plants),
        );
      }
    }, [user?.plants]);

    const updateUser = (updates: Partial<User>) => {
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
    };

    const logout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      await AsyncStorage.removeItem("user");
    };

    const waterPlant = (plantId: string) => {
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          plants: prev.plants.map((plant) => {
            if (plant.id !== plantId) return plant;
            const now = new Date();
            return {
              ...plant,
              lastWatered: now,
              nextWatering: new Date(
                now.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000,
              ),
              health: Math.min(100, plant.health + 15),
              isWilted: false,
            };
          }),
        };
      });
    };

    const updatePlantWaterSchedule = (plantId: string, days: number) => {
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          plants: prev.plants.map((plant) => {
            if (plant.id !== plantId) return plant;
            return {
              ...plant,
              waterFrequencyDays: days,
              nextWatering: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
            };
          }),
        };
      });
    };

    const deletePlant = (plantId: string) => {
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          plants: prev.plants.filter((plant) => plant.id !== plantId),
        };
      });
    };

    const acceptRequest = (requestId: string) => {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: "accepted" as const,
                sitterId: user?.id,
                sitterName: user?.username,
              }
            : req,
        ),
      );
    };

    const createRequest = (
      request: Omit<
        PlantSittingRequest,
        "id" | "ownerId" | "ownerName" | "ownerAvatar" | "status"
      >,
    ) => {
      const newRequest: PlantSittingRequest = {
        ...request,
        id: Math.random().toString(36).substr(2, 9),
        ownerId: user?.id || "",
        ownerName: user?.username || "",
        ownerAvatar: user?.avatar,
        status: "open",
      };
      setRequests((prev) => [newRequest, ...prev]);
    };

    return {
      user,
      setUser,
      updateUser,
      requests,
      waterPlant,
      updatePlantWaterSchedule,
      deletePlant,
      acceptRequest,
      createRequest,
      logout,
      isLoading,
    };
  });
