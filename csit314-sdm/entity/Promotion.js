// Entity: Promotion
// A period during which an IDP is promoted (shown first to customers).
// Active = today is between startDate and endDate, so promotions expire automatically.
// Used by: Promote IDP, IDP search / browse ordering
//
// Database table: promotion
//
// Attributes:
// - promotionID, idpID, startDate, endDate, createdBy (platform manager accountID)
//
// Methods:
// - createPromotion(promotion)
// - getPromotions()

// Entity: Promotion
// One IDP promoted (featured) by a platform manager between two dates.
// Used by: Promote IDP (saving), Home feed (promoted IDPs shown first, marked "Featured")
//
// Database table: promotion
//
// Attributes:
// - promotionID, idpID, startDate ("YYYY-MM-DD"), endDate ("YYYY-MM-DD"), createdBy (platform manager ID)
//
// Methods:
// - createPromotion(promotion)        saves it with the next promotionID
// - getPromotions()                   every promotion
// - getActivePromotions(dateKey)      promotions running on that day (first and last day included)
import { readTable, writeTable } from "./LocalStore";
import { toDateKey } from "@/lib/dates";

export class Promotion {
    promotionID;
    idpID;
    startDate;
    endDate;
    createdBy;
    constructor(data) { 
        Object.assign(this, data);
    }

    static async createPromotion(promotion) {
        const rows = readTable("promotion");

        const nextID = Math.max(0, ...rows.map((r) => r.promotionID ?? 0)) + 1;

        const created = { promotionID: nextID, ...promotion };

        writeTable("promotion", [...rows, created]);

        return new Promotion(created);
    }

    static async getPromotions() {
        return readTable("promotion").map((r) => new Promotion(r));
    }

    // Promotions running on the given day ("YYYY-MM-DD", default today), oldest promotion first.
    static async getActivePromotions(dateKey = toDateKey(new Date())) {
        return readTable("promotion")
            .filter((p) => p.startDate.slice(0, 10) <= dateKey && dateKey <= p.endDate.slice(0, 10))
            .map((r) => new Promotion(r));
    }
}
