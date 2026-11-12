# omikuji

> Draw a deterministic daily Japanese fortune (omikuji) in your terminal. Zero-dependency CLI.

[![CI](https://github.com/printemps-tokyo/omikuji/actions/workflows/ci.yml/badge.svg)](https://github.com/printemps-tokyo/omikuji/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

`omikuji` draws a Japanese fortune slip that is stable for the whole day:
running it again shows the same result, and it changes the next day.

```console
$ omikuji --date 2026-07-07
=== おみくじ  2026-07-07 ===

  吉

  願望   信じて進めば届く
  恋愛   良い縁が近い
  仕事   好機を逃すな
  健康   心身ともに快調
  金運   投資はほどほどに吉
  季節   夏：遠出が吉
  行事   七夕：願いは短冊に書くと吉

  ラッキー   数字 41 / 色 金 / 方角 北東 / アイテム お守り / 季節の品 かき氷
```

The day's fortune is derived deterministically from the date (and an optional
name), so it is the same every time you run it that day and refreshes tomorrow.
Fully offline, no dependencies.

## Requirements

- Node.js >= 22

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
omikuji                       # today's fortune (language from your locale)
omikuji --lang en             # force English
omikuji --lang ja             # force Japanese
omikuji --name alice          # personalized, still stable per day
omikuji --date 2026-01-01     # draw for a specific date
omikuji --json                # machine-readable
omikuji --share slip.svg      # also save the slip as an image
```

| Option | Description | Default |
| --- | --- | --- |
| `--name <name>` | Personalize the draw (still stable per day) | — |
| `--date <date>` | Draw for a specific date (`YYYY-MM-DD`) | today |
| `--lang <ja\|en>` | Language of the slip | from locale (see below) |
| `--once` | Print only once per day; later same-day runs print nothing | off |
| `--json` | Output JSON instead of the slip | off |
| `--share <file>` | Also write the slip as an SVG image (`-` prints only the SVG) | off |
| `--force` | Let `--share` replace an existing file | off |
| `--no-color` | Disable ANSI colors | colors on a TTY |

### Default language

Without `--lang`, the language follows your locale: `LC_ALL`, then
`LC_MESSAGES`, then `LANG` is checked, and a value starting with `ja`
(e.g. `ja_JP.UTF-8`) selects Japanese; anything else selects English.
`--lang ja|en` always overrides the detected default.

### Once a day in your shell

`--once` records the day it last printed (under `$XDG_STATE_HOME/omikuji`), so
later runs on the same day stay silent. Add it to your shell startup to greet
yourself with one fortune per day:

```bash
# ~/.zshrc
omikuji --once
```

### Seasons and events

Every slip has a seasonal line and a seasonal lucky item. Seasons follow the
months the Japan Meteorological Agency uses in its forecast terms
([時に関する用語](https://www.jma.go.jp/jma/kishou/know/yougo_hp/toki.html)):
spring is March to May, summer June to August, autumn September to November,
winter December to February.
The advice follows the rank's tone, like the rest of the slip.

On a few fixed-date events the slip also names the event of the day:

| Date | Event |
| --- | --- |
| January 1-3 | 正月三が日 (New Year) |
| March 3 | ひな祭り (Hinamatsuri) |
| May 5 | こどもの日 (Children's Day) |
| July 7 | 七夕 (Tanabata) |
| November 15 | 七五三 (Shichi-Go-San) |
| December 31 | 大晦日 (New Year's Eve) |

Days whose date moves from year to year (setsubun and the equinox weeks
follow the solar terms) or differs by region (obon) are left out rather than
guessed. The seasonal draws come after all the others, so every date and name
keeps the rank, advice and lucky items it had before seasons were added.

### Sharing the slip

`--share slip.svg` writes the slip as a standalone SVG image (600 pixels wide,
as tall as its content) in addition to the usual output, so the terminal shows
the slip and the file holds the same fortune. `--share -` prints only the SVG,
for piping. An existing file is not replaced unless you add `--force`.

The image uses the fonts installed on the viewing machine (a Mincho face such
as Hiragino Mincho, Yu Mincho or Noto Serif JP, else any serif) and embeds
nothing, which keeps omikuji free of dependencies. Sites that do not accept
SVG need a PNG; any SVG renderer converts it, for example:

```bash
omikuji --share - | rsvg-convert -o slip.png
```

A name given with `--name` appears on the image (escaped, at most 40
characters), so leave it out if the image is going somewhere public.

## How it works

The fortune is a deterministic function of its seed (`YYYY-MM-DD`, plus the
optional name); the date also selects the season and the event. The rank — one of the seven classic ones from 大吉 (Great
Blessing) down to 大凶 (Great Curse) — is chosen by weight, and each piece of
advice follows the rank's tone. Colors and `NO_COLOR` are respected.

## Programmatic API

```ts
import { drawOmikuji, dailySeed } from "@printemps-tokyo/omikuji";

const fortune = drawOmikuji(dailySeed("2026-06-24", "alice"), "en");
console.log(fortune.rank.en, fortune.lucky.number, fortune.season?.text);
```

`drawOmikuji` and the seed/render helpers (`renderText`, `renderJson`,
`renderSvg`) are pure functions. `drawOmikuji(seed, lang, date?)` takes the
date for the season from its third argument, or from a seed that starts with
`YYYY-MM-DD` as `dailySeed` builds it; without either there is no seasonal
line.

## License

[MIT](./LICENSE) (c) printemps.tokyo
