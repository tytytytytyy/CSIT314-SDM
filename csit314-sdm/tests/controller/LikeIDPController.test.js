// Unit tests for LikeIDPController (Customer: Like IDP / Unlike IDP).

import { describe, it, expect, beforeEach } from "vitest";
import { LikeIDPController } from "@/controller/LikeIDPController";
import { ViewFavouritesListController } from "@/controller/ViewFavouritesListController";

beforeEach(() => {
  window.localStorage.clear();
});

const favouriteIDs = async (customerID) =>
  (await ViewFavouritesListController.getFavourites(customerID)).map((f) => f.idpID);

describe("likeIDP / unlikeIDP", () => {
  it("adds an IDP to favourites once only", async () => {
    await LikeIDPController.unlikeIDP("C1", 2); // start from a known state
    expect(await LikeIDPController.likeIDP("C1", 2)).toBe(true);
    expect(await LikeIDPController.likeIDP("C1", 2)).toBe(false);
    expect(await LikeIDPController.isLiked("C1", 2)).toBe(true);
  });

  it("removes an IDP from the favourites list", async () => {
    await LikeIDPController.likeIDP("C1", 2);
    expect(await favouriteIDs("C1")).toContain(2);

    expect(await LikeIDPController.unlikeIDP("C1", 2)).toBe(true);
    expect(await LikeIDPController.isLiked("C1", 2)).toBe(false);
    expect(await favouriteIDs("C1")).not.toContain(2);
  });

  it("returns false when unliking an IDP that was not liked", async () => {
    await LikeIDPController.unlikeIDP("C1", 2);
    expect(await LikeIDPController.unlikeIDP("C1", 2)).toBe(false);
  });

  it("only removes the given customer's like", async () => {
    await LikeIDPController.likeIDP("C1", 2);
    await LikeIDPController.likeIDP("C2", 2);
    await LikeIDPController.unlikeIDP("C1", 2);
    expect(await LikeIDPController.isLiked("C2", 2)).toBe(true);
  });

  it("is never liked when nobody is logged in", async () => {
    expect(await LikeIDPController.isLiked(null, 2)).toBe(false);
  });
});
