import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type LoadLocalEnvOptions = {
  override?: boolean;
  overrideKeys?: readonly string[];
};

export function loadLocalEnv(
  filePath = resolve(process.cwd(), ".env"),
  { override = false, overrideKeys = [] }: LoadLocalEnvOptions = {}
) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator < 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key) {
      if (override || overrideKeys.includes(key) || process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
