const home = {
  noCap: "ကန့်သတ်ချက်မရှိ",
  defaultUserName: "ဆရာ",
  appName: "MM Exam Studio",
  welcomeBack: "ပြန်လည်ကြိုဆိုပါတယ်၊ {{name}}",
  heroSubtitle:
    "Practice, papers, plan usage နဲ့ support ကို တစ်နေရာတည်းကနေမြန်မြန်ရောက်နိုင်အောင် စုထားပါတယ်။",
  planBadge: "Plan: {{name}}",
  sessionReady: "ဆက်လုပ်ရန် session အဆင်သင့်ရှိသည်",
  newWorkReady: "အလုပ်အသစ်စရန်အသင့်",
  quickActions: {
    title: "အမြန်လုပ်ဆောင်ရန်",
    continuePractice: {
      title: "Practice ဆက်လုပ်ရန်",
      hint: "{{title}} • {{count}} ခု",
    },
    startPractice: {
      title: "Practice စရန်",
      hint: "Catalog ကိုဖွင့်ပြီး session အသစ်စတင်ပါ။",
    },
    buildPaper: {
      title: "Paper ပြုလုပ်ရန်",
      hint: "မေးခွန်းရွေးပြီး paper draft ပြင်ဆင်ပါ။",
    },
    managePlan: {
      title: "Plan စီမံရန်",
      hint: "Limit, upgrade request နဲ့ payment details ကိုစစ်ပါ။",
    },
    needHelp: {
      title: "အကူအညီလိုပါသလား",
      hint: "Support, help နဲ့ app guidance ကိုဖွင့်ပါ။",
    },
  },
  snapshot: {
    title: "Workspace အကျဉ်းချုပ်",
    publishedQuestions: "Published Questions",
    practiceSessions: "Practice Sessions",
    draftPapers: "Draft Papers",
    pdfExports: "PDF Exports",
  },
  usage: {
    title: "Plan & Usage",
    planName: "{{name}} plan",
    pdfExportsLeft: "ကျန်ရှိသော PDF exports: {{count}}",
    paperGenerationsLeft: "ကျန်ရှိသော paper generations: {{count}}",
    paperSwapsLeft: "ကျန်ရှိသော paper swaps: {{count}}",
    deviceLimit: "Device limit: {{count}}",
    latestRequest: "နောက်ဆုံး request",
    latestRequestMeta: "{{plan}} • {{status}} • {{createdAt}}",
  },
  recentActivity: {
    title: "လတ်တလောလုပ်ဆောင်မှု",
    continueLabel: "ဆက်လုပ်ရန်: {{title}}",
    startedMeta: "{{startedAt}} တွင်စတင် • မေးခွန်း {{count}} ခု",
    scoreMeta: "ရမှတ် {{score}} • {{date}}",
    noneTitle: "Practice လုပ်ထားတာမရှိသေးပါ",
    noneBody:
      "Practice ကနေ ပထမဆုံး session စတင်ပါ။ ပြီးရင် မကြာသေးခင်လုပ်ထားတာတွေ ဒီနေရာမှာပေါ်လာပါမယ်။",
  },
  papers: {
    title: "Paper လုပ်ငန်းစဉ်",
    draftMeta: "မေးခွန်း {{count}} ခု • {{marks}} မှတ် • {{updatedAt}} တွင်ပြင်ထားသည်",
    exportedTitle: "Exported: {{title}}",
    exportedMeta: "{{when}} • မေးခွန်း {{count}} ခု",
    ready: "အဆင်သင့်",
    noneTitle: "Paper လုပ်ထားတာမရှိသေးပါ",
    noneBody:
      "Papers ကိုဖွင့်ပြီး မေးခွန်းရွေး၊ draft လုပ်၊ ပြီးရင် ဒီနေရာကနေ မြန်မြန်ပြန်ဝင်နိုင်ပါတယ်။",
  },
  support: {
    title: "Support & Trust",
    cardTitle: "အကူအညီရဖို့လွယ်ကူပါတယ်",
    paymentHelp: "Payment help: {{value}}",
    configuredInSettings: "Settings ထဲမှာသတ်မှတ်ထားသည်",
    howToUse: "အသုံးပြုပုံ",
    support: "Support",
    legal: "Legal",
    about: "About",
  },
} as const;

export default home;
