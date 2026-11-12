/**
 * End-to-end check of the argument-parsing error path.
 *
 * When parseArgs rejects an unknown/invalid option, the CLI should print a
 * clean `error:` line and a hint pointing at `--help`, then exit 1 - rather
 * than surfacing a bare parser stack trace.
 *
 * Runs the built CLI (dist/cli.js); the test self-builds if dist is missing.
 */
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const pexecFile = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const cliPath = join(root, "dist", "cli.js");

beforeAll(async () => {
  if (!existsSync(cliPath)) {
    await pexecFile("npm", ["run", "build"], { cwd: root });
  }
});

describe("cli argument parsing", () => {
  it("rejects an unknown flag with an error and a --help hint, exit 1", async () => {
    const err = (await pexecFile("node", [cliPath, "--definitely-not-a-real-flag"]).catch(
      (e: unknown) => e,
    )) as { code?: number; stderr?: string };
    expect(err.code).toBe(1);
    expect(err.stderr ?? "").toContain("error:");
    expect(err.stderr ?? "").toContain("--help");
  });
});

describe("--share", () => {
  it("writes an SVG next to the usual output and refuses to overwrite", async () => {
    const dir = mkdtempSync(join(tmpdir(), "omikuji-share-"));
    try {
      const file = join(dir, "slip.svg");
      const { stdout } = await pexecFile("node", [cliPath, "--date", "2026-07-07", "--lang", "ja", "--share", file]);
      expect(stdout).toContain("七夕");
      expect(readFileSync(file, "utf8")).toContain("<svg");

      writeFileSync(file, "keep");
      const err = (await pexecFile("node", [cliPath, "--date", "2026-07-07", "--share", file]).catch(
        (e: unknown) => e,
      )) as { code?: number; stderr?: string };
      expect(err.code).toBe(1);
      expect(err.stderr ?? "").toContain("--force");
      expect(readFileSync(file, "utf8")).toBe("keep");

      await pexecFile("node", [cliPath, "--date", "2026-07-07", "--share", file, "--force"]);
      expect(readFileSync(file, "utf8")).toContain("<svg");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prints only the SVG with --share -", async () => {
    const { stdout } = await pexecFile("node", [cliPath, "--date", "2026-03-03", "--lang", "en", "--share", "-"]);
    expect(stdout.startsWith("<?xml")).toBe(true);
    expect(stdout).toContain("Hinamatsuri");
    expect(stdout).not.toContain("=== omikuji");
  });
});

describe("--once with --share", () => {
  it("does not mark the day as shown when the image could not be written", async () => {
    const state = mkdtempSync(join(tmpdir(), "omikuji-state-"));
    const dir = mkdtempSync(join(tmpdir(), "omikuji-once-"));
    try {
      const file = join(dir, "taken.svg");
      writeFileSync(file, "keep");
      const env = { ...process.env, XDG_STATE_HOME: state };
      const args = [cliPath, "--once", "--date", "2026-07-07", "--share", file];
      const err = (await pexecFile("node", args, { env }).catch((e: unknown) => e)) as { code?: number };
      expect(err.code).toBe(1);
      const retry = await pexecFile("node", [...args, "--force"], { env });
      expect(retry.stdout).toContain("2026-07-07");
      expect(readFileSync(file, "utf8")).toContain("<svg");
      const again = await pexecFile("node", [...args, "--force"], { env });
      expect(again.stdout).toBe("");
    } finally {
      rmSync(state, { recursive: true, force: true });
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
