const help = {
  title: "How To Use",
  subtitle: "Quick guidance for the main parts of the app.",
  quickHelp: "Quick Help",
  heroTitle: "Start with the task you want to finish.",
  heroBody:
    "You can jump into Practice, Papers, or Subscription directly. This page is here when you need a quick reminder.",
  startHere: "Start Here",
  startHereBody: "Choose the section that matches what you want to do next.",
  sections: [
    {
      title: "Practice",
      description: "Search, filter, pick questions, and jump straight into a session.",
      steps: [
        "Use quick filters or search to narrow the catalog first.",
        "Select questions for a custom session, or use Quick Start for instant practice.",
        "Continue unfinished work from Recent Sessions whenever you come back.",
      ],
    },
    {
      title: "Papers",
      description: "Build exam papers, review items, finalize, then export or share PDF.",
      steps: [
        "Start with filters, then add suitable questions into a paper draft.",
        "Review metadata, reorder items, and replace weak questions before finalizing.",
        "Generate the export only when the draft is ready to avoid unnecessary repeats.",
      ],
    },
    {
      title: "Subscription",
      description: "Check plan usage, request an upgrade, and track approval history.",
      steps: [
        "Open Subscription to compare plans and review your current limits.",
        "If you upgrade manually, submit transaction ID and payment proof in one request.",
        "Track the latest request and admin notes directly from the same screen.",
      ],
    },
  ],
  quickActions: [
    {
      title: "Open Practice",
      hint: "Best when you want to answer questions right away.",
    },
    {
      title: "Open Papers",
      hint: "Best when you are preparing exam sheets for students.",
    },
    {
      title: "Open Subscription",
      hint: "Best when you need plan details, limits, or an upgrade.",
    },
  ],
} as const;

export default help;
