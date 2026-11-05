// Unit tests for GetDesignerRecommendationsController (Customer: Get Designer Recommendations).
// Uses the dummy data in entity/LocalStore.js:
// - D1 Nordic Nest Interiors: IDP 1 Scandinavian, IDP 2 Industrial; 1 like in total.
// - D2 Studio Linea: IDP 3 Minimalist; 2 likes.
// - D3 Habitat & Co: no IDPs; 0 likes.
// - D4 pending verification, D5 suspended: never recommended.
// - Customer C1 likes IDP 2 and the deleted IDP 4, so C1 has only 1 like that counts.
// Tests that need more IDPs or likes add them with the entity methods.
// localStorage is cleared before each test, so every test starts from that same data.

import { describe, it, expect, beforeEach } from "vitest";
import { GetDesignerRecommendationsController as C } from "@/controller/GetDesignerRecommendationsController";
import { IDP } from "@/entity/IDP";
import { IDPLike } from "@/entity/IDPLike";

beforeEach(() => {
  window.localStorage.clear();
});

const ids = (result) => result.recommendations.map((r) => r.designerID);

async function addIDP(designerID, style) {
  const idp = await IDP.createIDP({
    designerID,
    title: `${style} test project`,
    description: "Test",
    style,
    propertyType: "Condo",
    category: "Residential",
    budget: 10000,
    status: "completed",
  });
  return idp.idpID;
}

async function likeAll(customerID, idpIDs) {
  for (const idpID of idpIDs) await IDPLike.addLike(customerID, idpID);
}

describe("getRecommendations - cold start", () => {
  it("shows the most-liked verified designers when the customer has too few likes", async () => {
    const result = await C.getRecommendations("C1");
    expect(result.status).toBe("coldStart");
    expect(ids(result)).toEqual(["D2", "D1", "D3"]);
  });

  it("does not count likes on deleted IDPs", async () => {
    // C1 has 2 likes but IDP 4 was deleted, so only 1 counts.
    const result = await C.getRecommendations("C1");
    expect(result.likesNeeded).toBe(2);
  });

  it("asks a customer with no likes for 3 likes", async () => {
    const result = await C.getRecommendations("C_NEW");
    expect(result).toMatchObject({ status: "coldStart", likesNeeded: 3 });
  });

  it("gives cold start picks a popularity reason", async () => {
    const result = await C.getRecommendations("C1");
    expect(result.recommendations[0].reason).toBe(
      "Popular with customers: 2 likes",
    );
    expect(result.recommendations[2].reason).toBe("New on the platform");
  });
});

describe("getRecommendations - personalised", () => {
  it("recommends designers whose IDPs match the liked styles, best match first", async () => {
    await likeAll("C1", [1, 3]); // C1 now likes Industrial, Scandinavian, Minimalist
    const result = await C.getRecommendations("C1");
    expect(result.status).toBe("personalised");
    expect(ids(result)).toEqual(["D1", "D2"]); // D1 matches 2 styles, D2 matches 1
  });

  it("leaves out designers with no matching style", async () => {
    await likeAll("C1", [1, 3]);
    const result = await C.getRecommendations("C1");
    expect(ids(result)).not.toContain("D3");
  });

  it("explains each pick with the liked styles it matched", async () => {
    await likeAll("C1", [1, 3]);
    const result = await C.getRecommendations("C1");
    expect(result.recommendations[0].reason).toBe(
      "Because you liked Scandinavian and Industrial projects",
    );
    expect(result.recommendations[1].reason).toBe(
      "Because you liked Minimalist projects",
    );
  });

  it("ranks a designer with more IDPs in the customer's favourite style higher", async () => {
    const a = await addIDP("D3", "Minimalist");
    const b = await addIDP("D3", "Minimalist");
    await likeAll("C9", [3, a, b]); // all Minimalist
    const result = await C.getRecommendations("C9");
    expect(ids(result)).toEqual(["D3", "D2"]); // D3 has 2 Minimalist IDPs, D2 has 1
    expect(result.recommendations[0].score).toBe(2);
  });

  it("never recommends unverified or suspended designers", async () => {
    const pending = await addIDP("D4", "Minimalist");
    const suspended = await addIDP("D5", "Minimalist");
    await likeAll("C9", [3, pending, suspended]);
    const result = await C.getRecommendations("C9");
    expect(ids(result)).toEqual(["D2"]);
  });

  it("falls back to popular designers when no verified designer matches", async () => {
    const ids5 = [
      await addIDP("D5", "Tropical"),
      await addIDP("D5", "Tropical"),
      await addIDP("D5", "Tropical"),
    ];
    await likeAll("C9", ids5); // only likes a suspended designer's style
    const result = await C.getRecommendations("C9");
    expect(result).toMatchObject({ status: "coldStart", likesNeeded: 0 });
    expect(ids(result)).toEqual(["D2", "D1", "D3"]);
  });

  it("gives each pick its top styles and sample photos", async () => {
    await likeAll("C1", [1, 3]);
    const result = await C.getRecommendations("C1");
    const d1 = result.recommendations[0];
    expect(d1.topStyles).toEqual(["Industrial", "Scandinavian"]);
    expect(d1.samplePhotos.map((p) => p.idpID)).toEqual([1, 2]);
  });
});

describe("calculateStyleWeights", () => {
  it("weights each style by its share of the likes", () => {
    const weights = C.calculateStyleWeights([
      { style: "Scandinavian" },
      { style: "Scandinavian" },
      { style: "Minimalist" },
      { style: "Industrial" },
    ]);
    expect(weights).toEqual({
      Scandinavian: 0.5,
      Minimalist: 0.25,
      Industrial: 0.25,
    });
  });

  it("returns no weights for no likes", () => {
    expect(C.calculateStyleWeights([])).toEqual({});
  });
});

describe("calculateDesignerScore", () => {
  it("adds up the weight of every IDP's style", () => {
    const weights = { Scandinavian: 0.5, Minimalist: 0.25 };
    const score = C.calculateDesignerScore(weights, [
      { style: "Scandinavian" },
      { style: "Scandinavian" },
      { style: "Minimalist" },
      { style: "Tropical" },
    ]);
    expect(score).toBe(1.25);
  });
});

describe("rankDesigners", () => {
  const d = (designerID, score, totalLikes, companyName = designerID) => ({
    designerID,
    score,
    totalLikes,
    companyName,
  });

  it("sorts by score, then total likes, then name", () => {
    const ranked = C.rankDesigners([
      d("A", 0.5, 0, "Zebra Studio"),
      d("B", 1, 0),
      d("C", 0.5, 3),
      d("E", 0.5, 0, "Aardvark Design"),
    ]);
    expect(ranked.map((x) => x.designerID)).toEqual(["B", "C", "E", "A"]);
  });

  it("drops designers with score 0 and keeps at most 5", () => {
    const ranked = C.rankDesigners([
      d("Z", 0, 9),
      ...[1, 2, 3, 4, 5, 6, 7].map((n) => d(`D${n}`, n, 0)),
    ]);
    expect(ranked.map((x) => x.designerID)).toEqual([
      "D7",
      "D6",
      "D5",
      "D4",
      "D3",
    ]);
  });
});
