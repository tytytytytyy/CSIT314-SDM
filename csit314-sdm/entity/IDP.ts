// Entity: IDP (Interior Design Project)
// A project posted by an interior designer.
// Used by: Create / Update / View IDP, Promote IDP, IDP Performance Dashboard, Like IDP,
//          View Favourites List, Browse Interior Designers, Get Designer Recommendations,
//          Generate Platform Report
//
// Database table: idp
//
// Still to implement (by the features that need them):
// - updateIDP(idp)
// - searchIDPs(criteria)                                active promotions listed first
// - getIDPsByDesigner(designerID)
// - countIDPs(startDate, endDate)                       platform report

import { getDb, nowISO } from "@/lib/db";

export class IDP {
  idpID: number;
  designerID: number;
  title: string;
  description: string;
  categoryID: number;
  budget: number | null;
  createdAt: string;
  updatedAt: string;

  constructor(data: Partial<IDP> = {}) {
    this.idpID = data.idpID ?? 0;
    this.designerID = data.designerID ?? 0;
    this.title = data.title ?? "";
    this.description = data.description ?? "";
    this.categoryID = data.categoryID ?? 0;
    this.budget = data.budget ?? null;
    this.createdAt = data.createdAt ?? "";
    this.updatedAt = data.updatedAt ?? "";
  }

  // Returns the IDP, or null if it does not exist.
  getIDP(idpID: number): IDP | null {
    const row = getDb().prepare("SELECT * FROM idp WHERE idpID = ?").get(idpID) as IDP | undefined;
    return row ? new IDP(row) : null;
  }

  // Saves a new IDP and returns it with its new idpID and timestamps filled in.
  createIDP(idp: IDP): IDP {
    const now = nowISO();
    const result = getDb()
      .prepare(
        `INSERT INTO idp (designerID, title, description, categoryID, budget, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(idp.designerID, idp.title, idp.description, idp.categoryID, idp.budget, now, now);
    return new IDP({ ...idp, idpID: Number(result.lastInsertRowid), createdAt: now, updatedAt: now });
  }
}
