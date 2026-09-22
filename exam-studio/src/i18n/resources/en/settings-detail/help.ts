const help = {
  title: "How To Use",
  subtitle: "Quick guidance for the main parts of the app.",
  quickHelp: "Quick Help",
  heroTitle: "Start with the task you want to finish.",
  heroBody:
    "The app follows a simple flow: choose a grade, start or create your work, and open extra options only when you need them.",
  startHere: "Start Here",
  startHereBody: "Choose the section that matches what you want to do next.",
  sections: [
    {
      title: "Practice",
      description: "Choose your grade, start a session, and use customization only when you need a focused practice set.",
      steps: [
        "Choose your grade first so questions stay relevant to your curriculum.",
        "Start right away, or open Customize to focus by subject, chapter, question type, and count.",
        "Start the session and continue unfinished work later from Recent Sessions.",
      ],
    },
    {
      title: "Papers",
      description: "Name the paper, choose its grade, and create a draft. Customize only when the paper needs a precise scope or mix.",
      steps: [
        "Enter a clear paper title and choose the grade before creating the draft.",
        "Open Customize only when you need a specific subject, chapter, or question mix.",
        "Review the draft, finalize it, then preview or print the PDF only when it is ready.",
      ],
    },
    {
      title: "Support",
      description: "Get help with your account, a study flow, or a problem in the app.",
      steps: [
        "Check this guide first for the common study flows.",
        "Open Support when you need help with your account, content, or the app.",
        "Include what you were trying to do and any message you saw so the issue can be fixed faster.",
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
      title: "Open Support",
      hint: "Get help with an account, content, or app issue.",
    },
  ],
} as const;

export default help;
