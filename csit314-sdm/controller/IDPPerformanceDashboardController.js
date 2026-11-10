import { IDP } from "@/entity/IDP";
import { IDPView } from "@/entity/IDPView";
import { IDPLike } from "@/entity/IDPLike";
import { toDateKey, isValidDateKey, daysBetween } from "@/lib/dates";

export class IDPPerformanceDashboardController {
  static validateDateRange(startDate, endDate) {
    if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) return false;
    return endDate >= startDate; // "YYYY-MM-DD" strings compare like dates
  }

  static async getDashboard(designerID, startDate, endDate) {
    // IDPs first, so an IDP with no views or likes still appears in the ranking.
    const idps = await IDP.getIDPsByDesigner(designerID);
    if (idps.length === 0) return null;

    const idpIDs = idps.map((idp) => idp.idpID);
    const views = await IDPView.getViewsByIDPs(idpIDs, startDate, endDate);
    const likes = await IDPLike.getLikesByIDPs(idpIDs, startDate, endDate);

    const C = IDPPerformanceDashboardController;
    const idpStats = idps.map((idp) => {
      const dailyCounts = C.fillMissingDays(
        C.groupEventsByDay(
          views.filter((v) => v.idpID === idp.idpID),
          likes.filter((l) => l.idpID === idp.idpID),
        ),
        startDate,
        endDate,
      );
      const totalViews = dailyCounts.reduce((sum, day) => sum + day.views, 0);
      const totalLikes = dailyCounts.reduce((sum, day) => sum + day.likes, 0);
      return {
        idpID: idp.idpID,
        title: idp.title,
        status: idp.status,
        dailyCounts,
        totalViews,
        totalLikes,
        likeRate: C.calculateLikeRate(totalLikes, totalViews),
      };
    });

    // All IDPs added together, one entry per day, for the chart.
    const dailyTotals = C.fillMissingDays(C.groupEventsByDay(views, likes), startDate, endDate);

    return { startDate, endDate, idpStats: C.rankIDPs(idpStats), dailyTotals };
  }

  // Counts views and likes per calendar day. Only days that have events are returned.
  static groupEventsByDay(views, likes) {
    const byDay = {};
    const dayOf = (date) => (byDay[date] ??= { date, views: 0, likes: 0 });
    for (const v of views) dayOf(toDateKey(v.viewedAt)).views += 1;
    for (const l of likes) dayOf(toDateKey(l.likedAt)).likes += 1;
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Returns one entry for every day from startDate to endDate, with 0s for quiet days.
  static fillMissingDays(dailyCounts, startDate, endDate) {
    const known = Object.fromEntries(dailyCounts.map((day) => [day.date, day]));
    return daysBetween(startDate, endDate).map((date) => known[date] ?? { date, views: 0, likes: 0 });
  }

  static calculateLikeRate(likes, views) {
    return views === 0 ? 0 : likes / views;
  }

  // Most likes first; if likes are equal, most views first. Adds rank 1, 2, 3...
  static rankIDPs(idpStats) {
    return [...idpStats]
      .sort((a, b) => b.totalLikes - a.totalLikes || b.totalViews - a.totalViews)
      .map((stats, index) => ({ ...stats, rank: index + 1 }));
  }
}
