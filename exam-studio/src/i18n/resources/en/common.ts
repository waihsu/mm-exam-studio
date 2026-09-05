const common = {
  actions: {
    apply: "Apply",
    back: "Back",
    cancel: "Cancel",
    clear: "Clear",
    close: "Close",
    done: "Done",
    next: "Next",
    open: "Open",
    previous: "Previous",
    reset: "Reset",
    show: "Show",
    hide: "Hide",
    viewAll: "View all",
  },
  states: {
    on: "On",
    off: "Off",
  },
  app: {
    mobileName: "Exam Studio Mobile",
    launchTagline: "Practice, Build, Print",
    launchingWorkspace: "Launching your protected workspace...",
  },
  navigation: {
    home: "Home",
    practice: "Practice",
    papers: "Papers",
    settings: "Settings",
  },
} as const;

export default common;
