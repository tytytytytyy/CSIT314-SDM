// Runs before every test file.
// The app fills its storage with a large generated set of dummy data (entity/DummyData.js).
// Unit tests switch that off, so they only use the small hand-made data in entity/LocalStore.js
// and the expected numbers stay exact. DummyData has its own test that checks the real thing.
import { vi } from "vitest";

vi.mock("@/entity/DummyData", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, generateDummyData: () => ({}) };
});
