// Control: GeneratePlatformReportController
// Feature: Generate Platform Report (Platform Management)
//
// What goes here:
// - Date range calculation for the chosen period, plus the previous period of the same length.
// - Aggregation across entities for both periods.
// - Comparison with the previous period.
//
// Constants:
// - REPORT_PERIODS = daily | weekly | monthly
//
// Report metrics (each for the current and previous period):
// - new customer accounts, new interior designer accounts   -> UserAccount.countNewAccounts(...)
// - designers verified                                      -> DesignerVerification.countVerified(...)
// - new IDPs                                                -> IDP.countIDPs(...)
// - IDP views                                               -> IDPView.countViews(...)
// - IDP likes                                               -> IDPLike.countLikes(...)
// - promotions created                                      -> Promotion.countPromotions(...)
//
// Methods:
// - validateReportRequest(period, referenceDate)   valid period, date not in the future
// - calculateDateRange(period, referenceDate)       returns { startDate, endDate }
// - calculatePreviousRange(period, startDate)       the period just before
// - calculateChange(current, previous)              % change; handle previous = 0
// - generateReport(period, referenceDate)           runs the above and returns the report
//
// Entities used: UserAccount, DesignerVerification, IDP, IDPView, IDPLike, Promotion
//
// Attributes: none

//TODOOOOOOO need check if can add createdAt top IDPs

import { UserAccount } from "@/entity/UserAccount";
import { DesignerVerification } from "@/entity/DesignerVerification";
import { IDP } from "@/entity/IDP";
import { IDPView } from "@/entity/IDPView";
import { IDPLike } from "@/entity/IDPLike";
import { Promotion } from "@/entity/Promotion";

export class GeneratePlatformReportController {
    static REPORT_PERIODS = ["daily", "weekly", "monthly"];

    static validateReportRequest(period, referenceDate) {
        if (!this.REPORT_PERIODS.includes(period))
            return "Invalid report period";

        const date = new Date(referenceDate);
        const today = new Date();

        if (date > today)
            return "Reference date cannot be in the future";

        return null;
    }

    static calculateDateRange(period, referenceDate) {
        const date = new Date(referenceDate);

        if (period === "daily")
            return {
                startDate: new Date(date),
                endDate: new Date(date)
            };

        if (period === "weekly") {
            const startDate = new Date(date);
            const day = startDate.getDay();
            const diff = day === 0 ? 6 : day - 1;

            startDate.setDate(startDate.getDate() - diff);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);

            return { startDate, endDate };
        }

        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        return { startDate, endDate };
    }

    static calculatePreviousRange(period, startDate) {
        const start = new Date(startDate);

        if (period === "daily") {
            const previousDate = new Date(start);
            previousDate.setDate(previousDate.getDate() - 1);

            return {
                startDate: previousDate,
                endDate: previousDate
            };
        }

        if (period === "weekly") {
            const previousStart = new Date(start);
            previousStart.setDate(previousStart.getDate() - 7);

            const previousEnd = new Date(previousStart);
            previousEnd.setDate(previousEnd.getDate() + 6);

            return {
                startDate: previousStart,
                endDate: previousEnd
            };
        }

        const previousStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
        const previousEnd = new Date(start.getFullYear(), start.getMonth(), 0);

        return {
            startDate: previousStart,
            endDate: previousEnd
        };
    }

    static calculateChange(current, previous) {
        if (previous === 0)
            return current === 0 ? 0 : null;

        return ((current - previous) / previous) * 100;
    }

    static async generateReport(period, referenceDate) {
        const error = this.validateReportRequest(period, referenceDate);

        if (error)
            return {
                status: "invalid",
                message: error
            };

        const currentRange = this.calculateDateRange(period, referenceDate);
        const previousRange = this.calculatePreviousRange(period, currentRange.startDate);

        const customerAccountsCurrent = await UserAccount.countNewAccounts("customer", currentRange.startDate, currentRange.endDate);
        const customerAccountsPrevious = await UserAccount.countNewAccounts("customer", previousRange.startDate, previousRange.endDate);

        const designerAccountsCurrent = await UserAccount.countNewAccounts("designer", currentRange.startDate, currentRange.endDate);
        const designerAccountsPrevious = await UserAccount.countNewAccounts("designer", previousRange.startDate, previousRange.endDate);

        const verifiedCurrent = await DesignerVerification.countVerified(currentRange.startDate, currentRange.endDate);
        const verifiedPrevious = await DesignerVerification.countVerified(previousRange.startDate, previousRange.endDate);

        const idpsCurrent = await IDP.countIDPs(currentRange.startDate, currentRange.endDate);
        const idpsPrevious = await IDP.countIDPs(previousRange.startDate, previousRange.endDate);

        const viewsCurrent = await IDPView.countViews(null, currentRange.startDate, currentRange.endDate);
        const viewsPrevious = await IDPView.countViews(null, previousRange.startDate, previousRange.endDate);

        const likesCurrent = await IDPLike.countLikes(null, currentRange.startDate, currentRange.endDate);
        const likesPrevious = await IDPLike.countLikes(null, previousRange.startDate, previousRange.endDate);

        const promotionsCurrent = await Promotion.countPromotions(currentRange.startDate, currentRange.endDate);
        const promotionsPrevious = await Promotion.countPromotions(previousRange.startDate, previousRange.endDate);

        return {
            status: "ok",
            currentRange,
            previousRange,

            customerAccounts: {
                current: customerAccountsCurrent,
                previous: customerAccountsPrevious,
                change: this.calculateChange(customerAccountsCurrent, customerAccountsPrevious)
            },

            designerAccounts: {
                current: designerAccountsCurrent,
                previous: designerAccountsPrevious,
                change: this.calculateChange(designerAccountsCurrent, designerAccountsPrevious)
            },

            verifiedDesigners: {
                current: verifiedCurrent,
                previous: verifiedPrevious,
                change: this.calculateChange(verifiedCurrent, verifiedPrevious)
            },

            idps: {
                current: idpsCurrent,
                previous: idpsPrevious,
                change: this.calculateChange(idpsCurrent, idpsPrevious)
            },

            views: {
                current: viewsCurrent,
                previous: viewsPrevious,
                change: this.calculateChange(viewsCurrent, viewsPrevious)
            },

            likes: {
                current: likesCurrent,
                previous: likesPrevious,
                change: this.calculateChange(likesCurrent, likesPrevious)
            },

            promotions: {
                current: promotionsCurrent,
                previous: promotionsPrevious,
                change: this.calculateChange(promotionsCurrent, promotionsPrevious)
            }
        };
    }
}
