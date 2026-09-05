const help = {
  title: "အသုံးပြုပုံ",
  subtitle: "App ရဲ့အဓိကပိုင်းတွေကို မြန်မြန်နားလည်ဖို့ လမ်းညွှန်။",
  quickHelp: "အမြန်လမ်းညွှန်",
  heroTitle: "လုပ်ချင်တဲ့အလုပ်ကနေ စတင်ပါ။",
  heroBody:
    "App flow ကိုလွယ်အောင် အတန်းရွေးပြီး စတင်နိုင်အောင်ထားပါတယ်။ လိုအပ်လာမှသာ အပိုရွေးချယ်စရာတွေကိုဖွင့်သုံးပါ။",
  startHere: "ဒီကနေစပါ",
  startHereBody: "နောက်လုပ်ချင်တာနဲ့ကိုက်တဲ့ section ကိုရွေးပါ။",
  sections: [
    {
      title: "Practice",
      description: "အတန်းရွေးပြီး session စတင်ပါ။ Focused practice လိုမှသာ customization ကိုဖွင့်သုံးပါ။",
      steps: [
        "သင့် syllabus နဲ့ကိုက်ညီစေရန် အရင်ဆုံး Grade ကိုရွေးပါ။",
        "ချက်ချင်းစတင်နိုင်သလို subject၊ chapter၊ question type နဲ့ count ကိုသတ်မှတ်ချင်လျှင် Customize ကိုဖွင့်ပါ။",
        "Session စပြီးသွားရင် မပြီးသေးတဲ့အလုပ်ကို Recent Sessions ကနေပြန်ဆက်လုပ်နိုင်ပါတယ်။",
      ],
    },
    {
      title: "Papers",
      description: "Paper title ရေး၊ အတန်းရွေးပြီး draft ဖန်တီးပါ။ Scope သို့မဟုတ် mix တိတိကျကျလိုမှ Customize ကိုဖွင့်ပါ။",
      steps: [
        "Draft မဖန်တီးခင် ရှင်းလင်းတဲ့ paper title ရေးပြီး Grade ကိုရွေးပါ။",
        "Subject၊ chapter သို့မဟုတ် question mix တိတိကျကျလိုမှ Customize ကိုဖွင့်ပါ။",
        "Draft ကို review လုပ်၊ finalize လုပ်ပြီးမှ PDF preview သို့မဟုတ် print ကိုဆက်လုပ်ပါ။",
      ],
    },
    {
      title: "အကူအညီ",
      description: "Account၊ study flow သို့မဟုတ် app ပြဿနာအတွက်အကူအညီရယူပါ။",
      steps: [
        "အများဆုံးအသုံးပြုတဲ့ flow တွေအတွက် ဒီ guide ကိုအရင်ကြည့်ပါ။",
        "Account, content သို့မဟုတ် app အကူအညီလိုရင် Support ကိုဖွင့်ပါ။",
        "မြန်မြန်ဖြေရှင်းနိုင်ရန် သင်လုပ်နေတဲ့အလုပ်နဲ့မြင်ရတဲ့ error message ကိုထည့်ပြောပါ။",
      ],
    },
  ],
  quickActions: [
    {
      title: "Practice ဖွင့်ရန်",
      hint: "Mini blueprint scope နဲ့ mix ကိုသုံးပြီး မြန်မြန် practice session စချင်ရင်ကောင်းပါတယ်။",
    },
    {
      title: "Papers ဖွင့်ရန်",
      hint: "Quick generate သို့မဟုတ် admin template နဲ့ paper draft ပြင်ချင်တဲ့အချိန်အတွက်ကောင်းပါတယ်။",
    },
    {
      title: "Support ဖွင့်ရန်",
      hint: "Account၊ content သို့မဟုတ် app ပြဿနာအတွက်အကူအညီတောင်းပါ။",
    },
  ],
} as const;

export default help;
