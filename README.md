# omikuji

> Draw a deterministic daily Japanese fortune (omikuji) in your terminal. Zero-dependency CLI.

[![CI](https://github.com/printemps-tokyo/omikuji/actions/workflows/ci.yml/badge.svg)](https://github.com/printemps-tokyo/omikuji/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

`omikuji` draws a Japanese fortune slip that is stable for the whole day:
running it again shows the same result, and it changes the next day.

```console
$ omikuji
=== おみくじ  2026-06-24 ===

  小吉

  願望   叶う。焦らず進め
  恋愛   素直さが実を結ぶ
  仕事   好機を逃すな
  健康   心身ともに快調
  金運   貸し借りは円満

  ラッキー   数字 42 / 色 青 / 方角 南東 / アイテム ペン
```

The day's fortune is derived deterministically from the date (and an optional
name), so it is the same every time you run it that day and refreshes tomorrow.
Fully offline, no dependencies.

## Requirements

- Node.js >= 20

## Install

Not published to npm yet — install from source:

```bash
git clone https://github.com/printemps-tokyo/omikuji
cd omikuji
npm install && npm run build
npm link   # optional: puts the `omikuji` command on your PATH
```

Then run `omikuji` (after `npm link`), or `node dist/cli.js` from the clone.

## Usage

```bash
omikuji                       # today's fortune (Japanese)
omikuji --lang en             # in English
omikuji --name alice          # personalized, still stable per day
omikuji --date 2026-01-01     # draw for a specific date
omikuji --json                # machine-readable
```

| Option | Description | Default |
| --- | --- | --- |
| `--name <name>` | Personalize the draw (still stable per day) | — |
| `--date <date>` | Draw for a specific date (`YYYY-MM-DD`) | today |
| `--lang <ja\|en>` | Language of the slip | `ja` |
| `--once` | Print only once per day; later same-day runs print nothing | off |
| `--json` | Output JSON instead of the slip | off |
| `--no-color` | Disable ANSI colors | colors on a TTY |

### Once a day in your shell

`--once` records the day it last printed (under `$XDG_STATE_HOME/omikuji`), so
later runs on the same day stay silent. Add it to your shell startup to greet
yourself with one fortune per day:

```bash
# ~/.zshrc
omikuji --once
```

## How it works

The fortune is a deterministic function of its seed (`YYYY-MM-DD`, plus the
optional name). The rank — one of the seven classic ones from 大吉 (Great
Blessing) down to 大凶 (Great Curse) — is chosen by weight, and each piece of
advice follows the rank's tone. Colors and `NO_COLOR` are respected.

## Programmatic API

```ts
import { drawOmikuji, dailySeed } from "@printemps-tokyo/omikuji";

const fortune = drawOmikuji(dailySeed("2026-06-24", "alice"), "en");
console.log(fortune.rank.en, fortune.lucky.number);
```

`drawOmikuji` and the seed/render helpers are pure functions.

## License

[MIT](./LICENSE) (c) printemps.tokyo
