const help = {
  title: "How To Use",
  subtitle: "Quick guidance for the main parts of the app.",
  quickHelp: "Quick Help",
  heroTitle: "Start with the task you want to finish.",
  heroBody:
    "The app now follows a simpler flow: Practice uses a mini blueprint, Papers uses quick-generate or templates, and Subscription handles plan access.",
  startHere: "Start Here",
  startHereBody: "Choose the section that matches what you want to do next.",
  sections: [
    {
      title: "Practice",
      description: "Choose the syllabus scope once, set the mini blueprint mix, and start a session without exposing the raw question bank.",
      steps: [
        "Pick grade, subject, chapter, and lesson from the scope picker.",
        "Set exact counts by question type in the mini blueprint, or leave rows at 0 to use the quick default mix.",
        "Start the session and continue unfinished work later from Recent Sessions.",
      ],
    },
    {
      title: "Papers",
      description: "Create draft papers with Quick Generate or published templates, then finalize and preview for export.",
      steps: [
        "Use Quick Generate when you want the app to build from scope plus mini blueprint.",
        "Use Templates when admin has already published a fixed paper structure for your plan.",
        "Review the draft, finalize it, then preview or print the PDF only when it is ready.",
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
      hint: "Best when you want a fast practice session from mini blueprint scope and mix.",
    },
    {
      title: "Open Papers",
      hint: "Best when you want to quick-generate or use an admin template for a paper draft.",
    },
    {
      title: "Open Subscription",
      hint: "Best when you need plan details, limits, or an upgrade.",
    },
  ],
} as const;

export default help;
