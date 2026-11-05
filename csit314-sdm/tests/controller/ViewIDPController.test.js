// Unit tests for ViewIDPController (Customer: View IDP), focusing on view recording,
// which feeds the IDP Performance Dashboard.

import { describe, it, expect, beforeEach } from "vitest";
import { ViewIDPController } from "@/controller/ViewIDPController";
import { readTable } from "@/entity/LocalStore";

beforeEach(() => {
  window.localStorage.clear();
});

describe("viewIDP", () => {
  it("returns the IDP and its photos", async () => {
    const details = await ViewIDPController.viewIDP(1, "C1");
    expect(details.idp.title).toBe("Bright Scandinavian Living Room");
    expect(details.photos.map((p) => p.photoID)).toEqual(["P1", "P2"]);
  });

  it("records one view for the IDP, with the customer who opened it", async () => {
    await ViewIDPController.viewIDP(1, "C1");
    const views = readTable("idp_view");
    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({ idpID: 1, customerID: "C1" });
  });

  it("still records a view when nobody is logged in", async () => {
    await ViewIDPController.viewIDP(2, null);
    expect(readTable("idp_view")[0]).toMatchObject({ idpID: 2, customerID: null });
  });

  it("does not record a view for an IDP that does not exist", async () => {
    expect(await ViewIDPController.viewIDP(4, "C1")).toBeNull();
    expect(readTable("idp_view")).toHaveLength(0);
  });
});
