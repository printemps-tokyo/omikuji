/**
 * A small deterministic PRNG seeded by a string.
 *
 * Each draw hashes `seed#counter` with SHA-256 and reads six bytes, so the same
 * seed always yields the same sequence. This is what makes a day's fortune
 * stable: re-running on the same date reproduces it exactly.
 */

import { createHash } from "node:crypto";

export type Rng = () => number;

/** Create a deterministic random function from a seed string. */
export function makeRng(seed: string): Rng {
  let counter = 0;
  return () => {
    const digest = createHash("sha256").update(`${seed}#${counter++}`).digest();
    return digest.readUIntBE(0, 6) / 0x1000000000000; // 48-bit value -> [0, 1)
  };
}

/** Pick one element from a non-empty array. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

/** Pick one element by weight (higher weight = more likely). */
export function pickWeighted<T>(rng: Rng, items: readonly { item: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = rng() * total;
  for (const { item, weight } of items) {
    r -= weight;
    if (r < 0) {
      return item;
    }
  }
  return items[items.length - 1]!.item;
}
