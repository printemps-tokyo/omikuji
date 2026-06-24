/**
 * Public API for omikuji.
 *
 * `omikuji` draws a Japanese fortune that is deterministic per day: the same
 * date (optionally per name) always yields the same slip, and it changes the
 * next day. The draw, seed, and renderers are pure functions, so the behavior
 * is fully reproducible and unit-tested. There is no network access.
 */

export type { Lang, Tone, RankDef, Category } from "./data.js";
export { RANKS, CATEGORIES } from "./data.js";

export { makeRng, pick, pickWeighted } from "./rng.js";
export type { Rng } from "./rng.js";

export { drawOmikuji, dailySeed, todayString, shouldShow } from "./omikuji.js";
export type { Fortune, AdviceLine } from "./omikuji.js";

export { renderText, renderJson } from "./render.js";
