// Control: GeneratePlatformReportController
// Feature: Generate Platform Report (Platform Management)
//
// What goes here:
// - Build five consecutive date ranges ending with the selected period.
// - Aggregate platform metrics for each range.
//
// Constants:
// - REPORT_PERIODS = daily | weekly | monthly
//
// Report metrics (for each of the five periods):
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
// - generateReport(period, referenceDate)           runs the above and returns the report
//
// Entities used: UserAccount, DesignerVerification, IDP, IDPView, IDPLike
//
// Attributes: none

import { UserAccount } from "@/entity/UserAccount";
import { DesignerVerification } from "@/entity/DesignerVerification";
import { IDP } from "@/entity/IDP";
import { IDPView } from "@/entity/IDPView";
import { IDPLike } from "@/entity/IDPLike";
import { toDateKey } from "@/lib/dates";

export class GeneratePlatformReportController {
    static REPORT_PERIODS = ["daily", "weekly", "monthly"];

    static validateReportRequest(period, referenceDate) {
        if (!this.REPORT_PERIODS.includes(period))
            return "Invalid report period";

        // Compare calendar days as "YYYY-MM-DD" text in local time. new Date("2026-11-10") would be
        // midnight UTC (8 am in Singapore), so today's date counted as "the future" before 8 am.
        if (String(referenceDate).slice(0, 10) > toDateKey(new Date()))
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
        return {
            status: "ok",
            periods: [...newestFirstPeriods]
                .reverse()
                .map(({ range, metrics }) => ({ range, ...metrics })),
        };
    }
}
