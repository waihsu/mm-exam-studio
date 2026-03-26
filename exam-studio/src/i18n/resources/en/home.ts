const home = {
  noCap: "No cap",
  defaultUserName: "Teacher",
  appName: "MM Exam Studio",
  welcomeBack: "Welcome back, {{name}}",
  heroSubtitle:
    "Keep practice, papers, plan usage, and support in one place so the next task is always easy to reach.",
  planBadge: "Plan: {{name}}",
  sessionReady: "Session ready to continue",
  newWorkReady: "Ready for new work",
  notificationsBadge: "{{count}} new alerts",
  pendingUpgradeBadge: "Upgrade request pending",
  quickActions: {
    title: "Quick Actions",
    continuePractice: {
      title: "Continue Practice",
      hint: "{{title}} • {{count}} questions",
    },
    startPractice: {
      title: "Start Practice",
      hint: "Open the builder and start a fresh mini-blueprint session.",
    },
    buildPaper: {
      title: "Build Paper",
      hint: "Open the paper builder and prepare a new draft.",
    },
    managePlan: {
      title: "Manage Plan",
      hint: "Review limits, request an upgrade, or check payment details.",
    },
    needHelp: {
      title: "Need Help",
      hint: "Open support, help, and important app guidance.",
      unreadHint: "{{count}} new support replies waiting.",
    },
  },
  snapshot: {
    title: "Workspace Snapshot",
    publishedQuestions: "Published Questions",
    practiceSessions: "Practice Sessions",
    draftPapers: "Draft Papers",
    pdfExports: "PDF Exports",
  },
  usage: {
    title: "Plan & Usage",
    planName: "{{name}} plan",
    pdfExportsLeft: "PDF exports left: {{count}}",
    pdfExportsLeftLabel: "PDF exports left",
    paperGenerationsLeft: "Paper generations left: {{count}}",
    paperGenerationsLeftLabel: "Paper generations left",
    paperSwapsLeft: "Paper swaps left: {{count}}",
    paperSwapsLeftLabel: "Paper swaps left",
    deviceLimit: "Device limit: {{count}}",
    deviceLimitLabel: "Device limit",
    latestRequest: "Latest request",
    latestRequestMeta: "{{plan}} • {{status}} • {{createdAt}}",
  },
  homeSectionHints: {
    actions: "Jump into the next task without hunting through settings.",
    practice: "Resume open work or review the latest completed sessions.",
    papers: "Return to drafts and exported papers from one place.",
  },
  recentActivity: {
    title: "Recent Activity",
    continueLabel: "Continue: {{title}}",
    startedMeta: "Started {{startedAt}} • {{count}} questions",
    scoreMeta: "Score {{score}} • {{date}}",
    noneTitle: "No practice activity yet",
    noneBody:
      "Start with Practice to create the first session. Your recent work will appear here after that.",
  },
  papers: {
    title: "Paper Pipeline",
    draftMeta: "{{count}} questions • {{marks}} marks • updated {{updatedAt}}",
    exportedTitle: "Exported: {{title}}",
    exportedMeta: "{{when}} • {{count}} questions",
    ready: "Ready",
    noneTitle: "No paper activity yet",
    noneBody:
      "Open Papers to choose questions, create a draft, and come back here for quick access.",
  },
  support: {
    title: "Support & Trust",
    cardTitle: "Help is easy to reach",
    newReplyTitle: "New support reply",
    newReplyBody: "{{count}} unread reply • {{preview}}",
    pendingRequestTitle: "Plan request in review",
    pendingRequestBody: "Your latest upgrade request is still pending. Open Subscription to review it.",
    paymentHelp: "Payment help: {{value}}",
    configuredInSettings: "Configured in Settings",
    howToUse: "How To Use",
    support: "Support",
    legal: "Legal",
    about: "About",
  },
} as const;

export default home;
