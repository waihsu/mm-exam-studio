const storage = {
  title: "Storage",
  subtitle: "Manage saved drafts and clear device-only study data.",
  localData: "Local Data",
  draftsSaved: "Saved practice drafts: {{count}}",
  clearFailed: "Failed to clear drafts.",
  clearing: "Clearing...",
  clearDrafts: "Clear Saved Drafts",
  app: "App",
  clearTitle: "Clear Drafts",
  clearMessage: "Remove all saved practice drafts from this device?",
  clearHint:
    "This only clears local drafts on this phone. It does not delete completed sessions.",
} as const;

export default storage;
