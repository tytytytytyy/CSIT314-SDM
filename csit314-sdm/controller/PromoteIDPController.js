// Control: PromoteIDPController
// Feature: Promote IDP (Platform Manager)
// The platform manager features an IDP between two dates. While a promotion is running, the
// home feed shows that IDP first with a "Featured" badge (HomeController.getIDPFeed).
//
// Rules (validatePromotion):
// - the IDP must exist                                         -> "notFound"
// - its designer must be active and verified                   -> "designerNotVerified"
// - the start date must be a real date, not in the past        -> "invalidStartDate"
// - the end date must be a real date after the start date      -> "invalidEndDate"
// - at most 10 promotions running on any one day                -> "maxPromotionsReached"
// - the same IDP cannot have overlapping promotions             -> "dateOverlap"
//
// Methods:
// - getIDPs(), getIDP(idpID)                                   -> IDP.listIDPs, IDP.getIDP
// - validatePromotion(idpID, startDate, endDate)               -> IDP.getIDP, Promotion.getPromotions
// - promoteIDP(idpID, startDate, endDate, createdBy)           -> Promotion.createPromotion
//
// Entities used: IDP, Promotion
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
import { InteriorDesignerAccount } from "@/entity/InteriorDesignerAccount";
import { daysBetween, isValidDateKey, toDateKey } from "@/lib/dates";
const MAX_ACTIVE_PROMOTIONS = 10;

// Dates are "YYYY-MM-DD" text, compared as text in local time (they sort like dates).
// new Date("2026-11-10") would be midnight UTC, which is the day before in timezones behind UTC.
const dayOf = (date) => String(date).slice(0, 10);

export class PromoteIDPController {
    // IDPs that can be promoted: only those whose designer is active and verified.
    static async getIDPs() {
        const idps = await IDP.listIDPs(0, Number.MAX_SAFE_INTEGER);
        const allowed = new Set();
        for (const designerID of new Set(idps.map((idp) => idp.designerID))) {
            if (await InteriorDesignerAccount.isActiveAndVerified(designerID)) allowed.add(designerID);
        }
        return idps.filter((idp) => allowed.has(idp.designerID));
    }

    static async getIDP(idpID) {
        return IDP.getIDP(idpID);
    }

    static async validatePromotion(idpID, startDate, endDate) {
        //checks if IDP exists
        const idp = await IDP.getIDP(idpID);
        if (!idp) return { status: "notFound" };
        //customers cannot see IDPs of suspended or unverified designers, so they cannot be promoted
        if (!(await InteriorDesignerAccount.isActiveAndVerified(idp.designerID)))
            return { status: "designerNotVerified" };
        //checks if promotion date is valid
        const today = toDateKey(new Date());
        if (!isValidDateKey(startDate) || startDate < today) return { status: "invalidStartDate" };
        if (!isValidDateKey(endDate) || endDate <= startDate) return { status: "invalidEndDate" };

        //checks promotion count isnt max on any day of the new promotion
        const promotions = await Promotion.getPromotions();
        for (const day of daysBetween(startDate, endDate)) {
            const activeOnDay = promotions.filter(
                (p) => dayOf(p.startDate) <= day && day <= dayOf(p.endDate),
            ).length;
            if (activeOnDay >= MAX_ACTIVE_PROMOTIONS)
                return { status: "maxPromotionsReached" };
        }

        //checks promotion date doesnt overlap with existing promotion dates for the same IDP
        const overlap = promotions.find(
            (p) => p.idpID === idpID && startDate <= dayOf(p.endDate) && endDate >= dayOf(p.startDate),
        );
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
