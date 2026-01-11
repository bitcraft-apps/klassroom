import { describe, it, expect } from "vitest";
import { VERSION } from "./index.js";

describe("@klassroom/cli", () => {
  it("re-exports VERSION from core", () => {
    expect(VERSION).toBe("0.0.0");
  });
});
