#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { drawOmikuji, dailySeed, todayString, shouldShow, detectLang, isValidDate } from "./omikuji.js";
import { renderJson, renderSvg, renderText } from "./render.js";
import type { Lang } from "./data.js";

const HELP = `omikuji - draw a deterministic daily Japanese fortune

Usage:
  omikuji [options]

Draws a fortune that is stable for the whole day: running it again shows the
same result, and it changes tomorrow. The slip carries a seasonal line (seasons
by month as in Japan: spring is March-May) and, on fixed-date events such as
Tanabata, the event of the day. Fully offline.

Options:
  --name <name>     Personalize the draw (still stable per day)
  --date <date>     Draw for a specific date (YYYY-MM-DD) instead of today
  --lang <ja|en>    Language of the slip (default: from your locale; "ja" when
                    LC_ALL/LC_MESSAGES/LANG starts with "ja", otherwise "en")
  --once            Print only once per day; later same-day runs print nothing.
                    Handy in your shell startup file.
  --json            Output JSON instead of the slip
  --share <file>    Also write the slip as an SVG image to <file> ("-" writes
                    only the SVG to stdout). An existing file is not replaced
                    unless --force is given.
  --force           Let --share replace an existing file
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
        share: { type: "string" },
        force: { type: "boolean", default: false },
        "no-color": { type: "boolean", default: false },
      },
    }).values;
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    process.stderr.write("run 'omikuji --help' for usage.\n");
    return 1;
  }

  const date = values.date ?? todayString(new Date());
  if (!isValidDate(date)) {
    process.stderr.write(`error: --date must be a real calendar date in YYYY-MM-DD form (got "${date}")\n`);
    return 1;
  }
  const lang = (values.lang ?? detectLang(process.env)) as Lang;
  if (lang !== "ja" && lang !== "en") {
    process.stderr.write("error: --lang must be ja or en\n");
    return 1;
  }

  if (values.share !== undefined && values.share === "") {
    process.stderr.write("error: --share needs a file name (or - for stdout)\n");
    return 1;
  }

  // `--once` key combines the date and name so a new name re-draws. The day
  // is recorded only after the slip (and any --share file) went out, so a
  // failed --share can be retried the same day.
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
  }
  const recordOnce = async (): Promise<void> => {
    if (!values.once) return;
    try {
      await mkdir(dirname(statePath()), { recursive: true });
      await writeFile(statePath(), onceKey + "\n", "utf8");
    } catch {
      // If we cannot persist state, the fortune was still shown this time.
    }
  };

  const fortune = drawOmikuji(dailySeed(date, values.name), lang, date);
  if (values.share === "-") {
    process.stdout.write(renderSvg(fortune, date, lang, values.name));
    await recordOnce();
    return 0;
  }
  if (values.share !== undefined) {
    try {
      await writeFile(values.share, renderSvg(fortune, date, lang, values.name), {
        encoding: "utf8",
        flag: values.force ? "w" : "wx",
      });
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      const why = code === "EEXIST" ? "file exists (use --force to replace it)" : (err as Error).message;
      process.stderr.write(`error: cannot write ${values.share}: ${why}\n`);
      return 1;
    }
  }
  const color = !values["no-color"] && !process.env.NO_COLOR && process.stdout.isTTY === true;
  process.stdout.write(values.json ? renderJson(fortune, date) : renderText(fortune, date, lang, color));
  await recordOnce();
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
