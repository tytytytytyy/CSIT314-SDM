import { IDP } from "@/entity/IDP";
import { Promotion } from "@/entity/Promotion";
import { InteriorDesignerAccount } from "@/entity/InteriorDesignerAccount";
import { IDPPhoto } from "@/entity/IDPPhoto";
import { CompanyInformation } from "@/entity/CompanyInformation";
import { daysBetween, isValidDateKey, toDateKey } from "@/lib/dates";
const MAX_ACTIVE_PROMOTIONS = 10;

// Dates are "YYYY-MM-DD" text, compared as text in local time (they sort like dates).
// new Date("2026-11-10") would be midnight UTC, which is the day before in timezones behind UTC.
const dayOf = (date) => String(date).slice(0, 10);

export class PromoteIDPController {
    // IDPs that can be promoted: only those whose designer is active and verified.
    // Each comes with its main photo and company name, for the cards.
    static async getIDPs() {
        const idps = await IDP.listIDPs(0, Number.MAX_SAFE_INTEGER);
        const companyNames = new Map();
        for (const designerID of new Set(idps.map((idp) => idp.designerID))) {
            if (!(await InteriorDesignerAccount.isActiveAndVerified(designerID))) continue;
            const company = await CompanyInformation.getCompanyInfo(designerID);
            companyNames.set(designerID, company?.companyName ?? null);
        }
        const allowed = idps.filter((idp) => companyNames.has(idp.designerID));
        const photos = await IDPPhoto.getMainPhotos(allowed.map((idp) => idp.idpID));
        return allowed.map((idp) => ({
            ...idp,
            mainPhotoURL: photos.get(idp.idpID) ?? null,
            companyName: companyNames.get(idp.designerID),
        }));
    }

    // The selected IDP with its main photo and company name; null if there is no such IDP.
    static async getIDP(idpID) {
        const idp = await IDP.getIDP(idpID);
        if (!idp) return null;
        const photos = await IDPPhoto.getPhotos(idpID);
        const company = await CompanyInformation.getCompanyInfo(idp.designerID);
        return { ...idp, mainPhotoURL: photos[0]?.photoURL ?? null, companyName: company?.companyName ?? null };
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
