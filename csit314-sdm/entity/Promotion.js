// Entity: Promotion
// A period during which an IDP is promoted (shown first to customers).
// Active = today is between startDate and endDate, so promotions expire automatically.
// Used by: Promote IDP, IDP search / browse ordering, Generate Platform Report
//
// Database table: promotion
//
// Attributes:
// - promotionID, idpID, startDate, endDate, createdBy (platform manager accountID)
//
// Methods:
// - createPromotion(promotion)
// - countActivePromotions() - not needed anymore since need check active per day
// - getActivePromotions() - change to getPromotions();(since active promotions changes per day)
// - countPromotions(startDate, endDate)                 platform report

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

        const created = { promotionID: nextID, ...promotion, };

        writeTable("promotion", [...rows, created]);

        return new Promotion(created);
    }

    static async getPromotions() {
        return readTable("promotion").map((r) => new Promotion(r));
    }

    static async countPromotions(startDate, endDate) {
        return readTable("promotion").filter((r) => {
            return (
                r.startDate >= startDate &&
                r.endDate <= endDate
            );
        }).length;
    }
    
}