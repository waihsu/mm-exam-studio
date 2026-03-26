const help = {
  title: "အသုံးပြုပုံ",
  subtitle: "App ရဲ့အဓိကပိုင်းတွေကို မြန်မြန်နားလည်ဖို့ လမ်းညွှန်။",
  quickHelp: "အမြန်လမ်းညွှန်",
  heroTitle: "လုပ်ချင်တဲ့အလုပ်ကနေ စတင်ပါ။",
  heroBody:
    "အခု version မှာ flow က ပိုရှင်းသွားပါပြီ။ Practice က mini blueprint သုံးတယ်၊ Papers က quick generate သို့မဟုတ် templates သုံးတယ်၊ Subscription က plan access ကိုစီမံတယ်။",
  startHere: "ဒီကနေစပါ",
  startHereBody: "နောက်လုပ်ချင်တာနဲ့ကိုက်တဲ့ section ကိုရွေးပါ။",
  sections: [
    {
      title: "Practice",
      description: "Syllabus scope ကိုတစ်ခါရွေးပြီး mini blueprint mix သတ်မှတ်ကာ raw question bank မမြင်ဘဲ session စတင်ပါ။",
      steps: [
        "Grade, subject, chapter, lesson ကို scope picker ကနေရွေးပါ။",
        "Mini blueprint ထဲမှာ question type အလိုက် counts သတ်မှတ်ပါ၊ သို့မဟုတ် 0 ထားပြီး default quick mix ကိုသုံးပါ။",
        "Session စပြီးသွားရင် မပြီးသေးတဲ့အလုပ်ကို Recent Sessions ကနေပြန်ဆက်လုပ်နိုင်ပါတယ်။",
      ],
    },
    {
      title: "Papers",
      description: "Quick Generate သို့မဟုတ် published templates နဲ့ paper draft တည်ဆောက်ပြီး finalize လုပ်ကာ export မတိုင်ခင် preview ကြည့်ပါ။",
      steps: [
        "စနစ်က scope + mini blueprint နဲ့ paper ဆောက်ပေးစေချင်ရင် Quick Generate သုံးပါ။",
        "Admin က plan အလိုက် publish လုပ်ထားတဲ့ fixed structure ကိုသုံးချင်ရင် Templates ကိုဖွင့်ပါ။",
        "Draft ကို review လုပ်၊ finalize လုပ်ပြီးမှ PDF preview သို့မဟုတ် print ကိုဆက်လုပ်ပါ။",
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
      hint: "Mini blueprint scope နဲ့ mix ကိုသုံးပြီး မြန်မြန် practice session စချင်ရင်ကောင်းပါတယ်။",
    },
    {
      title: "Papers ဖွင့်ရန်",
      hint: "Quick generate သို့မဟုတ် admin template နဲ့ paper draft ပြင်ချင်တဲ့အချိန်အတွက်ကောင်းပါတယ်။",
    },
    {
      title: "Subscription ဖွင့်ရန်",
      hint: "Plan details, limits, သို့မဟုတ် upgrade လိုတဲ့အချိန်အတွက်ကောင်းပါတယ်။",
    },
  ],
} as const;

export default help;
