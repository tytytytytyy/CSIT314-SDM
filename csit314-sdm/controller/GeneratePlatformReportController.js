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

import { UserAccount } from "@/entity/UserAccount";
import { DesignerVerification } from "@/entity/DesignerVerification";
import { IDP } from "@/entity/IDP";
import { IDPView } from "@/entity/IDPView";
import { IDPLike } from "@/entity/IDPLike";

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

    static async getPeriodMetrics(range) {
        const [customerAccounts, designerAccounts, verifiedDesigners, idps, views, likes] =
            await Promise.all([
                UserAccount.countNewAccounts("customer", range.startDate, range.endDate),
                UserAccount.countNewAccounts("designer", range.startDate, range.endDate),
                DesignerVerification.countVerified(range.startDate, range.endDate),
                IDP.countIDPs(range.startDate, range.endDate),
                IDPView.countViews(null, range.startDate, range.endDate),
                IDPLike.countLikes(null, range.startDate, range.endDate)
            ]);

        return {
            customerAccounts,
            designerAccounts,
            verifiedDesigners,
            idps,
            views,
            likes
        };
    }

    static async generateReport(period, referenceDate) {
        const error = this.validateReportRequest(period, referenceDate);

        if (error)
            return {
                status: "invalid",
                message: error
            };

        const newestFirstRanges = [this.calculateDateRange(period, referenceDate)];
        while (newestFirstRanges.length < 5) {
            const previousRange = this.calculatePreviousRange(
                period,
                newestFirstRanges[newestFirstRanges.length - 1].startDate,
            );
            newestFirstRanges.push(previousRange);
        }

        const newestFirstPeriods = await Promise.all(
            newestFirstRanges.map(async (range) => ({
                range,
                metrics: await this.getPeriodMetrics(range)
            })),
        );
        const [currentPeriod, previousPeriod] = newestFirstPeriods;
        const currentRange = currentPeriod.range;
        const previousRange = previousPeriod.range;
        const currentMetrics = currentPeriod.metrics;
        const previousMetrics = previousPeriod.metrics;

        return {
            status: "ok",
            currentRange,
            previousRange,
            periods: [...newestFirstPeriods]
                .reverse()
                .map(({ range, metrics }) => ({ range, ...metrics })),

            customerAccounts: {
                current: currentMetrics.customerAccounts,
                previous: previousMetrics.customerAccounts,
                change: this.calculateChange(currentMetrics.customerAccounts, previousMetrics.customerAccounts)
            },

            designerAccounts: {
                current: currentMetrics.designerAccounts,
                previous: previousMetrics.designerAccounts,
                change: this.calculateChange(currentMetrics.designerAccounts, previousMetrics.designerAccounts)
            },

            verifiedDesigners: {
                current: currentMetrics.verifiedDesigners,
                previous: previousMetrics.verifiedDesigners,
                change: this.calculateChange(currentMetrics.verifiedDesigners, previousMetrics.verifiedDesigners)
            },

            idps: {
                current: currentMetrics.idps,
                previous: previousMetrics.idps,
                change: this.calculateChange(currentMetrics.idps, previousMetrics.idps)
            },

            views: {
                current: currentMetrics.views,
                previous: previousMetrics.views,
                change: this.calculateChange(currentMetrics.views, previousMetrics.views)
            },

            likes: {
                current: currentMetrics.likes,
                previous: previousMetrics.likes,
                change: this.calculateChange(currentMetrics.likes, previousMetrics.likes)
            }
        };
    }
}
