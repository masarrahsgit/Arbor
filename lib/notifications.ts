import * as Notifications from "expo-notifications";

export async function scheduleWateringReminder(
  plantName: string,
  waterFrequencyDays: number,
  plantId: string,
) {
  await cancelWateringReminder(plantId);

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") return;
  }

  // Calculate the exact date when watering is needed
  const nextWateringDate = new Date();
  nextWateringDate.setDate(nextWateringDate.getDate() + waterFrequencyDays);
  nextWateringDate.setHours(9, 0, 0, 0); // 9am on the watering day

  await Notifications.scheduleNotificationAsync({
    identifier: `water-${plantId}`,
    content: {
      title: `💧 Time to water your ${plantName}!`,
      body: `Your ${plantName} needs water today. Give it some love!`,
      data: { plantId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
      repeats: true,
    } as Notifications.DailyTriggerInput,
  });

  console.log(
    `Scheduled watering reminder for ${plantName} — next: ${nextWateringDate.toDateString()}`,
  );
}

export async function cancelWateringReminder(plantId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`water-${plantId}`);
  } catch {
    // Ignore if notification doesn't exist
  }
}

export async function cancelAllWateringReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
