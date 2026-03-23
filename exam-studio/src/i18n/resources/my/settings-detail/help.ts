const help = {
  title: "အသုံးပြုပုံ",
  subtitle: "App ရဲ့အဓိကပိုင်းတွေကို မြန်မြန်နားလည်ဖို့ လမ်းညွှန်။",
  quickHelp: "အမြန်လမ်းညွှန်",
  heroTitle: "လုပ်ချင်တဲ့အလုပ်ကနေ စတင်ပါ။",
  heroBody:
    "Practice, Papers, သို့မဟုတ် Subscription ကို တန်းဝင်နိုင်ပါတယ်။ လိုတဲ့အချိန် ပြန်ကြည့်ဖို့ ဒီစာမျက်နှာကိုထားပါတယ်။",
  startHere: "ဒီကနေစပါ",
  startHereBody: "နောက်လုပ်ချင်တာနဲ့ကိုက်တဲ့ section ကိုရွေးပါ။",
  sections: [
    {
      title: "Practice",
      description: "Search, filter, question ရွေးပြီး session ထဲတန်းဝင်ပါ။",
      steps: [
        "အရင်ဆုံး quick filters သို့မဟုတ် search နဲ့ catalog ကိုကျဉ်းပါ။",
        "Custom session အတွက် questions ရွေးပါ၊ သို့မဟုတ် Quick Start နဲ့ချက်ချင်းလေ့ကျင့်ပါ။",
        "မပြီးသေးတဲ့အလုပ်တွေကို Recent Sessions ကနေပြန်ဆက်လုပ်နိုင်ပါတယ်။",
      ],
    },
    {
      title: "Papers",
      description: "Exam papers တည်ဆောက်၊ review လုပ်၊ finalize လုပ်ပြီး PDF export/share လုပ်ပါ။",
      steps: [
        "Filters ကစပြီး သင့်တော်တဲ့ questions တွေကို paper draft ထဲထည့်ပါ။",
        "Finalize မလုပ်ခင် metadata စစ်၊ order ပြန်စီ၊ weak questions တွေပြောင်းပါ။",
        "Draft အဆင်သင့်ဖြစ်မှ export လုပ်ပြီး unnecessary repeats မဖြစ်အောင်လုပ်ပါ။",
      ],
    },
    {
      title: "Subscription",
      description: "Plan usage စစ်၊ upgrade request တင်၊ approval history ကိုလိုက်ကြည့်ပါ။",
      steps: [
        "Subscription ကိုဖွင့်ပြီး plans တွေနှိုင်းယှဉ်ကာ current limits ကိုကြည့်ပါ။",
        "Manual upgrade လုပ်မယ်ဆို transaction ID နဲ့ payment proof ကိုတစ်ခါတည်းတင်ပါ။",
        "Latest request နဲ့ admin notes ကိုတူညီတဲ့ screen မှာပဲကြည့်နိုင်ပါတယ်။",
      ],
    },
  ],
  quickActions: [
    {
      title: "Practice ဖွင့်ရန်",
      hint: "မေးခွန်းတွေကိုချက်ချင်းဖြေချင်တဲ့အချိန်အတွက်ကောင်းပါတယ်။",
    },
    {
      title: "Papers ဖွင့်ရန်",
      hint: "ကျောင်းသားများအတွက် exam sheets ပြင်ဆင်ချင်တဲ့အချိန်အတွက်ကောင်းပါတယ်။",
    },
    {
      title: "Subscription ဖွင့်ရန်",
      hint: "Plan details, limits, သို့မဟုတ် upgrade လိုတဲ့အချိန်အတွက်ကောင်းပါတယ်။",
    },
  ],
} as const;

export default help;
