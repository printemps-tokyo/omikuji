#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { drawOmikuji, dailySeed, todayString, shouldShow } from "./omikuji.js";
import { renderJson, renderText } from "./render.js";
import type { Lang } from "./data.js";

const HELP = `omikuji - draw a deterministic daily Japanese fortune

Usage:
  omikuji [options]

Draws a fortune that is stable for the whole day: running it again shows the
same result, and it changes tomorrow. Fully offline.

Options:
  --name <name>     Personalize the draw (still stable per day)
  --date <date>     Draw for a specific date (YYYY-MM-DD) instead of today
  --lang <ja|en>    Language of the slip (default: ja)
  --once            Print only once per day; later same-day runs print nothing.
                    Handy in your shell startup file.
  --json            Output JSON instead of the slip
  --no-color        Disable ANSI colors
  -h, --help        Show this help
  -v, --version     Show version

Tip: add \`omikuji --once\` to your ~/.zshrc to see today's fortune once a day.
`;

async function readVersion(): Promise<string> {
  const { fileURLToPath } = await import("node:url");
  const here = dirname(fileURLToPath(import.meta.url));
  try {
    const raw = await readFile(join(here, "..", "package.json"), "utf8");
    return (JSON.parse(raw) as { version: string }).version;
  } catch {
    return "0.0.0";
  }
}

/** The state file that records when `--once` last showed a fortune. */
function statePath(): string {
  const base = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  return join(base, "omikuji", "last");
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    process.stdout.write(HELP);
    return 0;
  }
  if (argv.includes("-v") || argv.includes("--version")) {
    process.stdout.write((await readVersion()) + "\n");
    return 0;
  }

  let values;
  try {
    values = parseArgs({
      args: argv,
      allowPositionals: false,
      options: {
        name: { type: "string" },
        date: { type: "string" },
        lang: { type: "string" },
        once: { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        "no-color": { type: "boolean", default: false },
      },
    }).values;
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    return 1;
  }

  const date = values.date ?? todayString(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    process.stderr.write(`error: --date must be YYYY-MM-DD (got "${date}")\n`);
    return 1;
  }
  const lang = (values.lang ?? "ja") as Lang;
  if (lang !== "ja" && lang !== "en") {
    process.stderr.write("error: --lang must be ja or en\n");
    return 1;
  }

  // `--once` key combines the date and name so a new name re-draws.
  const onceKey = values.name ? `${date}|${values.name}` : date;
  if (values.once) {
    let last: string | undefined;
    try {
      last = (await readFile(statePath(), "utf8")).trim();
    } catch {
      last = undefined;
    }
    if (!shouldShow(last, onceKey)) {
      return 0;
    }
    try {
      await mkdir(dirname(statePath()), { recursive: true });
      await writeFile(statePath(), onceKey + "\n", "utf8");
    } catch {
      // If we cannot persist state, still show the fortune this time.
    }
  }

  const fortune = drawOmikuji(dailySeed(date, values.name), lang);
  const color = !values["no-color"] && !process.env.NO_COLOR && process.stdout.isTTY === true;
  process.stdout.write(values.json ? renderJson(fortune, date) : renderText(fortune, date, lang, color));
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    process.exitCode = 1;
  });
