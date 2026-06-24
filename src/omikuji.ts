import { makeRng, pick, pickWeighted } from "./rng.js";
import {
  ADVICE,
  CATEGORIES,
  CATEGORY_LABELS,
  LUCKY,
  RANKS,
  type Category,
  type Lang,
  type RankDef,
} from "./data.js";

/** One line of advice on the slip. */
export interface AdviceLine {
  category: Category;
  label: string;
  text: string;
}

/** A drawn fortune. */
export interface Fortune {
  rank: RankDef;
  advice: AdviceLine[];
  lucky: { number: number; color: string; item: string; direction: string };
}

/**
 * Draw a fortune deterministically from a seed. The same seed always yields the
 * same fortune; the rank is chosen by weight and the advice tone follows it.
 */
export function drawOmikuji(seed: string, lang: Lang): Fortune {
  const rng = makeRng(seed);
  const rank = pickWeighted(
    rng,
    RANKS.map((r) => ({ item: r, weight: r.weight })),
  );
  const advice: AdviceLine[] = CATEGORIES.map((category: Category) => ({
    category,
    label: CATEGORY_LABELS[category][lang],
    text: pick(rng, ADVICE[category][rank.tone][lang]),
  }));
  const lucky = {
    number: 1 + Math.floor(rng() * 49),
    color: pick(rng, LUCKY.colors[lang]),
    item: pick(rng, LUCKY.items[lang]),
    direction: pick(rng, LUCKY.directions[lang]),
  };
  return { rank, advice, lucky };
}

/** The seed for a given local date (`YYYY-MM-DD`), optionally per name. */
export function dailySeed(date: string, name?: string): string {
  return name ? `${date}|${name}` : date;
}

/** Today's local date as `YYYY-MM-DD`. */
export function todayString(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whether `--once` should show the slip: only when the day (or name) changed. */
export function shouldShow(lastShown: string | undefined, todayKey: string): boolean {
  return lastShown !== todayKey;
}
