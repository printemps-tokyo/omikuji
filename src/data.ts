/** The omikuji content: fortune ranks, per-category advice, and lucky items. */

export type Lang = "ja" | "en";
export type Tone = "good" | "bad";

/** A fortune rank with its weight (rarer ranks have smaller weights). */
export interface RankDef {
  ja: string;
  en: string;
  /** Whether the rank is auspicious; selects the advice tone. */
  tone: Tone;
  weight: number;
}

/** The seven classic omikuji ranks, from best to worst. */
export const RANKS: RankDef[] = [
  { ja: "大吉", en: "Great Blessing", tone: "good", weight: 8 },
  { ja: "中吉", en: "Middle Blessing", tone: "good", weight: 12 },
  { ja: "小吉", en: "Small Blessing", tone: "good", weight: 14 },
  { ja: "吉", en: "Blessing", tone: "good", weight: 20 },
  { ja: "末吉", en: "Future Blessing", tone: "good", weight: 18 },
  { ja: "凶", en: "Curse", tone: "bad", weight: 20 },
  { ja: "大凶", en: "Great Curse", tone: "bad", weight: 8 },
];

/** The advice categories shown on the slip. */
export const CATEGORIES = ["wish", "love", "work", "health", "money"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, Record<Lang, string>> = {
  wish: { ja: "願望", en: "Wish" },
  love: { ja: "恋愛", en: "Love" },
  work: { ja: "仕事", en: "Work" },
  health: { ja: "健康", en: "Health" },
  money: { ja: "金運", en: "Money" },
};

type Pools = Record<Category, Record<Tone, Record<Lang, string[]>>>;

/** Advice phrases per category and tone, in each language. */
export const ADVICE: Pools = {
  wish: {
    good: {
      ja: ["叶う。焦らず進め", "思い通りになる", "人の助けで成就する", "信じて進めば届く"],
      en: ["It comes true; don't rush.", "Things go your way.", "Help from others grants it.", "Believe and it arrives."],
    },
    bad: {
      ja: ["叶いにくい。時を待て", "欲を出すと遠のく", "今は控えめに", "焦りは禁物"],
      en: ["Hard to grant; bide your time.", "Greed pushes it away.", "Stay modest for now.", "Haste will spoil it."],
    },
  },
  love: {
    good: {
      ja: ["良い縁が近い", "素直さが実を結ぶ", "再会に喜びあり", "一言が距離を縮める"],
      en: ["A good match is near.", "Honesty pays off.", "Joy in a reunion.", "One word closes the gap."],
    },
    bad: {
      ja: ["待つより動け", "誤解に注意", "深追いは禁物", "今は友として接せよ"],
      en: ["Act rather than wait.", "Beware misunderstandings.", "Don't chase too hard.", "Be a friend for now."],
    },
  },
  work: {
    good: {
      ja: ["努力が認められる", "好機を逃すな", "協力者が現れる", "丁寧さが信用を生む"],
      en: ["Your effort is recognized.", "Seize the opportunity.", "An ally appears.", "Care builds trust."],
    },
    bad: {
      ja: ["焦ると失敗する", "確認を怠るな", "無理は控えよ", "守りを固める時"],
      en: ["Haste brings mistakes.", "Double-check everything.", "Avoid overreaching.", "A time to play defense."],
    },
  },
  health: {
    good: {
      ja: ["心身ともに快調", "早寝で運気上昇", "歩けば調子が出る", "笑顔が薬になる"],
      en: ["Body and mind are well.", "Early nights lift your luck.", "Walking sets you right.", "A smile is medicine."],
    },
    bad: {
      ja: ["無理は禁物", "冷えに注意", "休息を優先せよ", "暴飲暴食を避けよ"],
      en: ["Don't overdo it.", "Beware of the cold.", "Rest comes first.", "Avoid excess."],
    },
  },
  money: {
    good: {
      ja: ["臨時収入の兆し", "節約が実を結ぶ", "貸し借りは円満", "投資はほどほどに吉"],
      en: ["A windfall is hinted.", "Thrift bears fruit.", "Loans settle smoothly.", "Modest investment is lucky."],
    },
    bad: {
      ja: ["出費がかさむ", "うまい話に乗るな", "財布の紐を締めよ", "衝動買いを慎め"],
      en: ["Expenses pile up.", "Don't fall for easy money.", "Tighten your purse strings.", "Resist impulse buys."],
    },
  },
};

export const LUCKY = {
  colors: {
    ja: ["赤", "青", "黄", "緑", "紫", "白", "金", "桃"],
    en: ["red", "blue", "yellow", "green", "purple", "white", "gold", "pink"],
  },
  items: {
    ja: ["鍵", "本", "傘", "扇子", "鈴", "お守り", "ペン", "湯呑"],
    en: ["a key", "a book", "an umbrella", "a folding fan", "a bell", "a charm", "a pen", "a teacup"],
  },
  directions: {
    ja: ["北", "北東", "東", "南東", "南", "南西", "西", "北西"],
    en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  },
} satisfies Record<string, Record<Lang, string[]>>;

/**
 * Seasons by month, as the Japan Meteorological Agency counts them: spring is
 * March-May, summer June-August, autumn September-November, winter
 * December-February. The slip follows the Japanese calendar everywhere.
 */
export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_LABELS: Record<Season, Record<Lang, string>> = {
  spring: { ja: "春", en: "Spring" },
  summer: { ja: "夏", en: "Summer" },
  autumn: { ja: "秋", en: "Autumn" },
  winter: { ja: "冬", en: "Winter" },
};

/** Seasonal advice per tone, in each language. */
export const SEASON_ADVICE: Record<Season, Record<Tone, Record<Lang, string[]>>> = {
  spring: {
    good: {
      ja: ["新しい出会いに恵まれる", "始めたことが芽吹く", "花見の席に良い知らせ", "早起きが運を開く"],
      en: ["New faces bring luck.", "What you start takes root.", "Good news under the blossoms.", "Rise early to open your luck."],
    },
    bad: {
      ja: ["気の緩みに注意", "新生活の疲れを溜めるな", "寝不足に用心", "約束は控えめに"],
      en: ["Don't let your guard down.", "Don't let new-season fatigue pile up.", "Mind your sleep.", "Promise less for now."],
    },
  },
  summer: {
    good: {
      ja: ["遠出が吉", "水辺で運気上昇", "思い切りが実を結ぶ", "夕涼みに良縁あり"],
      en: ["A trip is lucky.", "Luck rises near water.", "Boldness pays off.", "A cool evening brings a good match."],
    },
    bad: {
      ja: ["暑さで判断が鈍る", "冷たい物の取りすぎに注意", "夜更かしを控えよ", "日差しと油断に用心"],
      en: ["The heat dulls judgment.", "Go easy on cold drinks.", "Avoid late nights.", "Beware the sun and carelessness."],
    },
  },
  autumn: {
    good: {
      ja: ["努力が実る季節", "読書が道を開く", "旬の味覚で運気上昇", "月を眺めて心を整えよ"],
      en: ["Effort bears fruit this season.", "Reading opens a path.", "Seasonal food lifts your luck.", "Calm your mind under the moon."],
    },
    bad: {
      ja: ["物思いが過ぎる", "食べ過ぎに注意", "朝晩の冷えに用心", "迷ったら先送りせよ"],
      en: ["Don't brood too long.", "Beware of overeating.", "Mind the chilly mornings.", "When in doubt, wait."],
    },
  },
  winter: {
    good: {
      ja: ["静かに力を蓄える時", "温かい縁に恵まれる", "計画を立てれば吉", "鍋を囲めば和が生まれる"],
      en: ["Quietly gather your strength.", "Warm ties come your way.", "Planning ahead is lucky.", "A shared hot pot brings harmony."],
    },
    bad: {
      ja: ["冷えと乾燥に注意", "出費は計画的に", "閉じこもりすぎるな", "予定を詰め込むな"],
      en: ["Beware of cold and dry air.", "Plan your spending.", "Don't shut yourself in.", "Don't overpack your schedule."],
    },
  },
};

/** A seasonal lucky item per season. */
export const SEASON_LUCKY: Record<Season, Record<Lang, string[]>> = {
  spring: {
    ja: ["桜餅", "新しいノート", "若草色のハンカチ", "菜の花"],
    en: ["sakura mochi", "a new notebook", "a light green handkerchief", "rapeseed blossoms"],
  },
  summer: {
    ja: ["風鈴", "うちわ", "麦茶", "かき氷"],
    en: ["a wind chime", "a paper fan", "barley tea", "shaved ice"],
  },
  autumn: {
    ja: ["栗", "紅葉", "月見団子", "文庫本"],
    en: ["chestnuts", "autumn leaves", "moon-viewing dumplings", "a paperback"],
  },
  winter: {
    ja: ["手袋", "みかん", "湯たんぽ", "柚子"],
    en: ["gloves", "a mandarin orange", "a hot-water bottle", "yuzu"],
  },
};

/** A seasonal event on a fixed date (month, first day, last day). */
export interface EventDef {
  month: number;
  from: number;
  to: number;
  label: Record<Lang, string>;
  text: Record<Lang, string>;
}

/**
 * Seasonal events whose date never moves. Days that depend on the solar
 * terms (setsubun, the equinox weeks) or on the region (obon) are left out
 * rather than guessed.
 */
export const EVENTS: EventDef[] = [
  {
    month: 1,
    from: 1,
    to: 3,
    label: { ja: "正月三が日", en: "New Year" },
    text: { ja: "一年の計は元旦にあり", en: "The year's plan is made on its first day." },
  },
  {
    month: 3,
    from: 3,
    to: 3,
    label: { ja: "ひな祭り", en: "Hinamatsuri" },
    text: { ja: "健やかな成長を願う日", en: "A day to wish for healthy growth." },
  },
  {
    month: 5,
    from: 5,
    to: 5,
    label: { ja: "こどもの日", en: "Children's Day" },
    text: { ja: "遊び心が運を呼ぶ", en: "A playful heart calls in luck." },
  },
  {
    month: 7,
    from: 7,
    to: 7,
    label: { ja: "七夕", en: "Tanabata" },
    text: { ja: "願いは短冊に書くと吉", en: "Write your wish on a paper strip." },
  },
  {
    month: 11,
    from: 15,
    to: 15,
    label: { ja: "七五三", en: "Shichi-Go-San" },
    text: { ja: "成長を祝えば福が来る", en: "Celebrating growth brings fortune." },
  },
  {
    month: 12,
    from: 31,
    to: 31,
    label: { ja: "大晦日", en: "New Year's Eve" },
    text: { ja: "一年の厄を払い新年を待て", en: "Shake off the year and await the new one." },
  },
];
