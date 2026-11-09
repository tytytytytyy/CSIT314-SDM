// Control: PromoteIDPController
// Feature: Promote IDP (Platform Management)
//
// What goes here:
// - Date rules, the cap on active promotions, and creating the promotion.
// - Auto-expiry: a promotion counts as active only while today is between
//   startDate and endDate, so it expires on its own without a status update.
// - Active promotions are shown first to customers (used by IDP search / browse).
//
// Constants:
// - MAX_ACTIVE_PROMOTIONS = 10
//
// Rules:
// - The IDP must exist.
// - startDate must be today or later; endDate must be after startDate.
// - The IDP must not already have a promotion that overlaps the chosen dates.
// - Active promotions must be below MAX_ACTIVE_PROMOTIONS.
//
// Methods:
// - getIDPs()                            list IDPs for selection
// - getIDP(idpID)                        find the selected IDP
// - validatePromotion(idpID, startDate, endDate)
//     -> IDP.getIDP(idpID)
//     -> Promotion.getPromotions()
// - promoteIDP(idpID, startDate, endDate, createdBy)
//     -> validatePromotion(...)
//     -> Promotion.createPromotion(promotion)
//
// Entities used: Promotion, IDP
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { Promotion } from "@/entity/Promotion";
const MAX_ACTIVE_PROMOTIONS = 10;

export class PromoteIDPController {
    static async getIDPs() {
        return IDP.listIDPs(0, Number.MAX_SAFE_INTEGER);
    }

    static async getIDP(idpID) {
        return IDP.getIDP(idpID);
    }
    
    static async validatePromotion(idpID, startDate, endDate) {
        //checks if IDP exists
        const idp = await IDP.getIDP(idpID);
        if (!idp) return { status: "notFound" };
        //checks if promotion date is valid
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start= new Date(startDate);
        const end = new Date(endDate);
        if (start < today) return {status: "invalidStartDate"};
        if (end <= start) return {status: "invalidEndDate"};

        //checks promotion count isnt max -need check every day doesnt overlap promotions
        const promotions = await Promotion.getPromotions();
        let currentDay = new Date(start);
        while (currentDay <= end) {

            const activeOnDay = promotions.filter((p) => {
                const pStart = new Date(p.startDate);
                const pEnd = new Date(p.endDate);

                return pStart <= currentDay &&
                    pEnd >= currentDay;
            }).length;

            if (activeOnDay >= MAX_ACTIVE_PROMOTIONS)
                return { status: "maxPromotionsReached" };

            currentDay.setDate(currentDay.getDate() + 1);
        }

        //checks promotion date doesnt overlap with existing promotion dates for the same IDP
        const overlap = promotions.find(p => p.idpID === idpID && start <= new Date(p.endDate) && end >= new Date(p.startDate));
        if (overlap) return { status : "dateOverlap" };
        
        return {status: "ok"};
    }
    static async promoteIDP(idpID, startDate, endDate, createdBy) {
        //auto check validation of IDP Promotion(runs prev method)
        const validation = await this.validatePromotion(idpID, startDate, endDate);
        if (validation.status !== "ok") return validation;
        
        const promotion = { idpID, startDate, endDate, createdBy };

        await Promotion.createPromotion(promotion);

        return { status: "ok" };
    }
}
