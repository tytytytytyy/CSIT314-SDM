// Boundary: IDPPerformanceDashboardPg
// Feature: IDP Performance Dashboard (Interior Designer)
// User story (ID17): As an interior designer, I want to view a performance dashboard for my IDPs,
// so that I know which projects attract the most customer interest.
//
// Route: /designer/dashboard   (app/designer/dashboard/page.jsx renders this)
//
// What goes here:
// - Date range picker, default the last 30 days, with a "View" button.
// - Totals: views, likes, like rate.
// - Daily charts of views and of likes (days with no activity shown as 0). Two charts, not one,
//   because views and likes have very different sizes.
// - Table ranking the designer's IDPs by likes (views break ties), with each IDP's like rate.
//
// Methods:
// - viewDashboard()                          opens the page with the default date range
// - submitDateRange(startDate, endDate)
//     -> IDPPerformanceDashboardController.validateDateRange(startDate, endDate)
//     -> IDPPerformanceDashboardController.getDashboard(designerID, startDate, endDate)
// - displayDashboard(dashboard)
// - displayInvalidDateRangeMsg()             "Invalid date range" (end date before start date)
// - displayNoIDPsMsg()                       "You have no projects yet"
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IDPPerformanceDashboardController } from "@/controller/IDPPerformanceDashboardController";
import { SessionController } from "@/controller/SessionController";
import StatusBadge from "@/boundary/StatusBadge";
import BackButton from "@/boundary/BackButton";
import { daysAgo } from "@/lib/dates";

const DEFAULT_DAYS = 30;

export default function IDPPerformanceDashboardPg() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [view, setView] = useState({ kind: "loading" });
  const [message, setMessage] = useState(null);
  const [chartIDP, setChartIDP] = useState("all");

  const displayDashboard = (dashboard) => {
    setMessage(null);
    setView({ kind: "dashboard", dashboard });
  };
  const displayInvalidDateRangeMsg = () => setMessage("Invalid date range");
  const displayNoIDPsMsg = () => setView({ kind: "noIDPs" });

  const submitDateRange = async (start, end) => {
    if (!IDPPerformanceDashboardController.validateDateRange(start, end)) {
      displayInvalidDateRangeMsg();
      return;
    }
    const dashboard = await IDPPerformanceDashboardController.getDashboard(
      SessionController.getLoggedInDesignerID(),
      start,
      end,
    );
    if (dashboard) displayDashboard(dashboard);
    else displayNoIDPsMsg();
  };

  // Designer clicks "Performance Dashboard" -> show the last 30 days.
  const viewDashboard = async () => {
    const start = daysAgo(DEFAULT_DAYS - 1);
    const end = daysAgo(0);
    setStartDate(start);
    setEndDate(end);
    await submitDateRange(start, end);
  };

  useEffect(() => {
    const load = async () => {
      await viewDashboard();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="viz-root mx-auto w-full max-w-4xl p-8">
      <BackButton fallbackHref="/designer/idp" />
      <h1 className="text-3xl font-semibold">Performance Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Which of your projects attract the most customer interest.</p>

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitDateRange(startDate, endDate);
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          From
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          To
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </label>
        <button type="submit" className="btn btn-primary">
          View
        </button>
      </form>

      {message && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {message}
        </p>
      )}

      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "noIDPs" && (
        <p className="mt-6">
          You have no projects yet.{" "}
          <Link href="/designer/idp/create" className="link">
            Create an IDP
          </Link>
        </p>
      )}
      {view.kind === "dashboard" && (
        <DashboardBody dashboard={view.dashboard} chartIDP={chartIDP} onChartIDPChange={setChartIDP} />
      )}
    </main>
  );
}

// ---------- Dashboard content (UI only) ----------

function DashboardBody({ dashboard, chartIDP, onChartIDPChange }) {
  const { idpStats, dailyTotals } = dashboard;
  const totalViews = idpStats.reduce((sum, s) => sum + s.totalViews, 0);
  const totalLikes = idpStats.reduce((sum, s) => sum + s.totalLikes, 0);
  const overallRate = IDPPerformanceDashboardController.calculateLikeRate(totalLikes, totalViews);

  const selected = idpStats.find((s) => String(s.idpID) === chartIDP);
  const days = selected ? selected.dailyCounts : dailyTotals;

  return (
    <>
      <section className="mt-8 grid grid-cols-3 gap-4">
        <StatTile label="Views" value={totalViews.toLocaleString()} />
        <StatTile label="Likes" value={totalLikes.toLocaleString()} />
        <StatTile label="Like rate" value={formatRate(overallRate)} />
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Daily activity</h2>
          <label className="text-sm">
            <span className="sr-only">Show chart for</span>
            <select id="chartIDP" value={chartIDP} onChange={(e) => onChartIDPChange(e.target.value)} className={inputClass}>
              <option value="all">All my projects</option>
              {idpStats.map((s) => (
                <option key={s.idpID} value={String(s.idpID)}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ColumnChart title="Views per day" days={days} field="views" colourVar="--series-views" />
        <ColumnChart title="Likes per day" days={days} field="likes" colourVar="--series-likes" />
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-zinc-600 dark:text-zinc-400">Show daily numbers as a table</summary>
          <table className="mt-2 w-full max-w-sm text-left">
            <thead>
              <tr className="border-b text-zinc-500">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 text-right font-medium">Views</th>
                <th className="py-1 text-right font-medium">Likes</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-1">{formatDate(d.date)}</td>
                  <td className="py-1 text-right tabular-nums">{d.views}</td>
                  <td className="py-1 text-right tabular-nums">{d.likes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">IDP ranking</h2>
        <p className="text-sm text-zinc-500">Most likes first. If likes are equal, most views first.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-500">
                <th className="py-2 pr-3 font-medium">Rank</th>
                <th className="py-2 pr-3 font-medium">IDP</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 text-right font-medium">Views</th>
                <th className="py-2 pr-3 text-right font-medium">Likes</th>
                <th className="py-2 text-right font-medium">Like rate</th>
              </tr>
            </thead>
            <tbody>
              {idpStats.map((s) => (
                <tr key={s.idpID} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-3 tabular-nums">{s.rank}</td>
                  <td className="py-2 pr-3">
                    <Link href={`/designer/idp/${s.idpID}`} className="underline-offset-2 hover:underline">
                      {s.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{s.totalViews.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{s.totalLikes.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">{formatRate(s.likeRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// A simple column chart drawn with SVG: one column per day, hover a column to see its number.
function ColumnChart({ title, days, field, colourVar }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 150, LEFT = 36, BOTTOM = 22, TOP = 8;
  const plotW = W - LEFT - 4;
  const plotH = H - BOTTOM - TOP;
  const max = niceMax(Math.max(0, ...days.map((d) => d[field])));
  const slot = plotW / Math.max(days.length, 1);
  const barW = Math.max(2, Math.min(24, slot - 2)); // thin columns with a gap between them
  const labelEvery = Math.ceil(days.length / 6);
  const y = (value) => TOP + plotH - (value / max) * plotH;

  return (
    <figure className="mt-4">
      <figcaption className="text-sm font-medium">{title}</figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full" role="img" aria-label={`${title}, ${days.length} days`}>
          {[0, max / 2, max].map((tick) => (
            <g key={tick}>
              <line x1={LEFT} x2={W} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" strokeWidth="1" />
              <text x={LEFT - 6} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
                {tick.toLocaleString()}
              </text>
            </g>
          ))}
          {days.map((d, i) => {
            const value = d[field];
            const x = LEFT + i * slot + (slot - barW) / 2;
            const top = y(value);
            return (
              <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* invisible full-height hit area, easier to hover than a thin column */}
                <rect x={LEFT + i * slot} y={TOP} width={slot} height={plotH} fill="transparent" />
                {value > 0 && <path d={roundedTop(x, top, barW, y(0) - top)} fill={`var(${colourVar})`} opacity={hover === null || hover === i ? 1 : 0.45} />}
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                    {formatDate(d.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 rounded border bg-white px-2 py-1 text-xs shadow-sm dark:bg-zinc-900"
            style={{ left: `${((LEFT + hover * slot + slot / 2) / W) * 100}%`, transform: "translateX(-50%)" }}
          >
            {formatDate(days[hover].date)}: <strong>{days[hover][field]}</strong> {field}
          </div>
        )}
      </div>
    </figure>
  );
}

// Column with a 4px rounded top and a square bottom on the baseline.
function roundedTop(x, top, width, height) {
  const r = Math.min(4, width / 2, height);
  return `M${x},${top + height} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${top + height} Z`;
}

// Rounds the top of the axis up to a tidy even number (e.g. 13 -> 16, 37 -> 40), never 0,
// so the middle gridline is a whole number too.
function niceMax(value) {
  if (value <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(value)) / 2;
  const rounded = Math.ceil(value / step) * step;
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

function formatRate(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

const inputClass = "input";
// Chart colours (.viz-root) live in app/globals.css, shared with the Platform Report.
