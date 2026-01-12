#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { VERSION } from "@klassroom/core";
import { createProgram } from "./cli.js";

export { VERSION };
export * from "./cli.js";

function isMain(): boolean {
  if (!process.argv[1]) return false;
  try {
    const scriptPath = realpathSync(resolve(process.argv[1]));
    const modulePath = fileURLToPath(import.meta.url);
    return scriptPath === modulePath;
  } catch {
    return false;
  }
}

if (isMain()) {
  createProgram().parse();
}
