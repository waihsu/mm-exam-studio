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
  quickActions: {
    title: "Quick Actions",
    continuePractice: {
      title: "Continue Practice",
      hint: "{{title}} • {{count}} questions",
    },
    startPractice: {
      title: "Start Practice",
      hint: "Open the catalog and start a fresh question session.",
    },
    buildPaper: {
      title: "Build Paper",
      hint: "Choose questions and prepare a paper draft.",
    },
    managePlan: {
      title: "Manage Plan",
      hint: "Review limits, request an upgrade, or check payment details.",
    },
    needHelp: {
      title: "Need Help",
      hint: "Open support, help, and important app guidance.",
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
    paperGenerationsLeft: "Paper generations left: {{count}}",
    paperSwapsLeft: "Paper swaps left: {{count}}",
    deviceLimit: "Device limit: {{count}}",
    latestRequest: "Latest request",
    latestRequestMeta: "{{plan}} • {{status}} • {{createdAt}}",
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
    paymentHelp: "Payment help: {{value}}",
    configuredInSettings: "Configured in Settings",
    howToUse: "How To Use",
    support: "Support",
    legal: "Legal",
    about: "About",
  },
} as const;

export default home;
