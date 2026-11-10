// Unit tests for the simulated ACRA business registry (entity/ACRARegistry.js).
import { beforeEach, describe, it, expect } from "vitest";
import { ACRARegistry } from "@/entity/ACRARegistry";

beforeEach(() => localStorage.clear());

describe("ACRARegistry.findByUEN", () => {
  it("finds a registered company by its UEN", async () => {
    expect(await ACRARegistry.findByUEN("202610001D")).toMatchObject({
      uen: "202610001D", entityName: "FRESH START DESIGN PTE. LTD.", status: "live",
    });
  });
  it("ignores spaces and letter case in the UEN", async () => {
    expect((await ACRARegistry.findByUEN(" 202610001d "))?.uen).toBe("202610001D");
  });
  it("returns null for a UEN that is not registered", async () => {
    expect(await ACRARegistry.findByUEN("202610203G")).toBeNull();
    expect(await ACRARegistry.findByUEN("")).toBeNull();
    expect(await ACRARegistry.findByUEN(null)).toBeNull();
  });
});
