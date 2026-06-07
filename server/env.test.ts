import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadLocalEnv } from "./env";

const originalEnv = new Map<string, string | undefined>();
const touchedKeys = ["OPENAI_API_KEY", "AI_TIMEOUT_MS"];

afterEach(() => {
  for (const key of touchedKeys) {
    const original = originalEnv.get(key);
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
  originalEnv.clear();
});

describe("loadLocalEnv", () => {
  it("loads key-value pairs from a .env file without overwriting existing variables", () => {
    const dir = mkdtempSync(join(tmpdir(), "cocktail-env-"));
    const file = join(dir, ".env");
    writeFileSync(file, "OPENAI_API_KEY=test-key\nAI_TIMEOUT_MS=9000\n");
    for (const key of touchedKeys) {
      originalEnv.set(key, process.env[key]);
      delete process.env[key];
    }
    process.env.AI_TIMEOUT_MS = "1000";

    loadLocalEnv(file);

    expect(process.env.OPENAI_API_KEY).toBe("test-key");
    expect(process.env.AI_TIMEOUT_MS).toBe("1000");

    rmSync(dir, { recursive: true, force: true });
  });
});
