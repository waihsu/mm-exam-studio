const notifications = {
  title: "Notifications",
  subtitle: "Manage reminder permissions and how often the app reminds you to practice.",
  practiceReminder: "Practice Reminder",
  permissionNotGranted: "Notification permission was not granted.",
  permissionBlocked: "Notifications are blocked in device settings.",
  updateFailed: "Failed to update notifications.",
  reminderToggle: "In-app Practice Reminder",
  on: "On",
  off: "Off",
  permission: "Permission: {{state}}",
  granted: "Granted",
  notGranted: "Not granted",
  reminderInterval: "Reminder Interval",
} as const;

export default notifications;
