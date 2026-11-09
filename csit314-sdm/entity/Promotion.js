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

import { readTable, writeTable } from "./LocalStore";

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

}