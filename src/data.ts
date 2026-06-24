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
