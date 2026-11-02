// Entity: IDPCategory
// The style/category of an IDP (e.g. Scandinavian, Industrial, Minimalist).
// Used by: Create / Update IDP, Browse Interior Designers,
//          Get Designer Recommendations (style weighting)
//
// Database table: idp_category

import { getDb } from "@/lib/db";

export class IDPCategory {
  categoryID: number;
  name: string;
  isActive: boolean;

  constructor(data: Partial<IDPCategory> = {}) {
    this.categoryID = data.categoryID ?? 0;
    this.name = data.name ?? "";
    this.isActive = Boolean(data.isActive ?? true);
  }

  // All categories a designer can currently choose, sorted A-Z.
  getActiveCategories(): IDPCategory[] {
    const rows = getDb()
      .prepare("SELECT * FROM idp_category WHERE isActive = 1 ORDER BY name")
      .all() as IDPCategory[];
    return rows.map((row) => new IDPCategory(row));
  }

  // Returns the category, or null if it does not exist.
  getCategory(categoryID: number): IDPCategory | null {
    const row = getDb()
      .prepare("SELECT * FROM idp_category WHERE categoryID = ?")
      .get(categoryID) as IDPCategory | undefined;
    return row ? new IDPCategory(row) : null;
  }
}
