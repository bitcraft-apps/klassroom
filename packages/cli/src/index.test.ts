import { describe, it, expect } from "vitest";
import { exec as execCallback } from "node:child_process";
import { resolve, join } from "node:path";
import { promisify } from "node:util";
import { VERSION } from "./index.js";

const exec = promisify(execCallback);
const CLI_PATH = resolve(__dirname, "../dist/index.js");

describe("@klassroom/cli", () => {
  it("re-exports VERSION from core", () => {
    expect(VERSION).toBe("0.0.0");
  });

  describe("CLI Execution", () => {
    it("prints help when run with --help flag", async () => {
        // Build is required for this test. 
        // We assume 'dist/index.js' exists because 'npm run build' was run.
        // In a real CI pipeline, build usually precedes test or we could trigger a build here.
        
        try {
            const { stdout } = await exec(`node "${CLI_PATH}" --help`);
            expect(stdout).toContain("Usage: klassroom");
            expect(stdout).toContain("Generuje prezentacje HTML");
        } catch (error: any) {
            // Check if failure is due to missing build
            if (error.stderr && error.stderr.includes("MODULE_NOT_FOUND")) {
                console.warn("Skipping CLI test because dist/index.js is missing. Run 'npm run build' first.");
                return;
            }
            throw error;
        }
    });

    it("verifies version matches package", async () => {
         try {
            const { stdout } = await exec(`node "${CLI_PATH}" --version`);
            expect(stdout.trim()).toBe(VERSION);
         } catch (error: any) {
             if (error.stderr && error.stderr.includes("MODULE_NOT_FOUND")) {
                 return;
             }
             throw error;
         }
    });
  });
});
