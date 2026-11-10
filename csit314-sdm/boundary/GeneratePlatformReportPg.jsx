// Boundary: GeneratePlatformReportPg
// Feature: Generate Platform Report (Platform Management)
// User story: As a platform manager, I want to generate a platform report for a chosen
// period (e.g. daily, weekly, monthly), so that I can track how the platform is performing.
//
// Route: /platform-manager/report   (app/platform-manager/report/page.jsx renders this)
//
// What goes here (same look as the designer's Performance Dashboard):
// - Period selector (daily / weekly / monthly) with a "Generate report" button. Daily: pick a day.
//   Weekly: pick any day, and the chosen Monday-Sunday week is shown. Monthly: pick a month and year.
// - Opens with this week's report already shown.
// - Summary tiles: each metric for the current period, and how it changed from the period before.
// - Table of six metrics for five consecutive periods, and a small chart per metric.
//
// Methods:
// - submitReportRequest(period, referenceDate)   calls GeneratePlatformReportController.generateReport(...)
// - displayReport(report)
// - displayErrorMsg(message)
//
// Attributes: none

"use client";

import { useEffect, useState } from "react";
import { GeneratePlatformReportController } from "@/controller/GeneratePlatformReportController";
import { daysAgo } from "@/lib/dates";

const REPORT_METRICS = [
  ["customerAccounts", "New customer accounts"],
  ["designerAccounts", "New designer accounts"],
  ["verifiedDesigners", "Designers verified"],
  ["idps", "New IDPs"],
  ["views", "IDP views"],
  ["likes", "IDP likes"],
];

const PERIOD_UNITS = { daily: "day", weekly: "week", monthly: "month" };

export default function GeneratePlatformReportPg() {
  const [period, setPeriod] = useState("weekly");
  const [referenceDate, setReferenceDate] = useState("");
  const [view, setView] = useState({ kind: "loading" });
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const displayReport = (report) => {
    setMessage(null);
    setView({ kind: "report", report });
  };
  const displayErrorMsg = (text) => setMessage(text);

  const submitReportRequest = async (chosenPeriod, chosenDate) => {
    setBusy(true);
    try {
      const report = await GeneratePlatformReportController.generateReport(chosenPeriod, chosenDate);
      if (report.status === "ok") displayReport(report);
      else displayErrorMsg(report.message);
    } catch {
      displayErrorMsg("Unable to generate the report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Platform manager opens "Generate Report" -> show this week's report straight away.
  useEffect(() => {
    const load = async () => {
      const today = daysAgo(0);
      setReferenceDate(today);
      await submitReportRequest("weekly", today);
      setView((current) => (current.kind === "loading" ? { kind: "empty" } : current));
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="viz-root mx-auto w-full max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">Generate Platform Report</h1>
      <p className="mt-1 text-sm text-zinc-500">
        How the platform is doing, compared with the four periods before.
      </p>

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitReportRequest(period, referenceDate);
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          Period
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input">
            {GeneratePlatformReportController.REPORT_PERIODS.map((option) => (
              <option key={option} value={option}>
                {option[0].toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        {period === "monthly" ? (
          <MonthPicker value={referenceDate} onChange={setReferenceDate} />
        ) : (
          <label className="flex flex-col gap-1 text-sm font-medium">
            {period === "weekly" ? "Any day in the week" : "Day"}
            <input
              type="date"
              required
              max={daysAgo(0)}
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="input"
            />
          </label>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Generating..." : "Generate report"}
        </button>
      </form>
      {period === "weekly" && referenceDate && (
        <p className="mt-2 text-sm text-zinc-500">
          Week:{" "}
          {periodLabel(GeneratePlatformReportController.calculateDateRange("weekly", referenceDate), "weekly", true)}
        </p>
      )}

      {message && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {message}
        </p>
      )}

      {view.kind === "loading" && <p className="mt-6">Loading...</p>}
      {view.kind === "report" && <ReportBody report={view.report} />}
    </main>
  );
}

// ---------- Month picker (UI only) ----------

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS_SHOWN = 3; // this year and the two before

// Month + year dropdowns for the monthly report. Any day in a month gives the same report, so
// the page sends the 1st of the chosen month ("YYYY-MM-01"). Months after this one are disabled.
function MonthPicker({ value, onChange }) {
  const [thisYear, thisMonth] = daysAgo(0).split("-").map(Number);
  const [year, month] = (value || daysAgo(0)).split("-").map(Number);
  const choose = (y, m) => {
    const safeMonth = y === thisYear ? Math.min(m, thisMonth) : m; // never a future month
    onChange(`${y}-${String(safeMonth).padStart(2, "0")}-01`);
  };

  return (
    <>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Month
        <select value={month} onChange={(e) => choose(year, Number(e.target.value))} className="input">
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index + 1} disabled={year === thisYear && index + 1 > thisMonth}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Year
        <select value={year} onChange={(e) => choose(Number(e.target.value), month)} className="input">
          {Array.from({ length: YEARS_SHOWN }, (_, i) => thisYear - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

// ---------- Report content (UI only) ----------

function ReportBody({ report }) {
  const { periods, period } = report;
  const current = periods.at(-1);
  const previous = periods.at(-2);
  const unit = PERIOD_UNITS[period];

  return (
    <>
      <p className="mt-8 text-sm text-zinc-500">
        This {unit}:{" "}
        <span className="font-medium text-[var(--foreground)]">{periodLabel(current.range, period, true)}</span>
      </p>
      <section className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {REPORT_METRICS.map(([key, label]) => (
          <StatTile
            key={key}
            label={label}
            value={current[key]}
            change={GeneratePlatformReportController.calculateChange(current[key], previous[key])}
            unit={unit}
          />
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Last five {unit}s</h2>
        <p className="text-sm text-zinc-500">Oldest on the left. The current {unit} is in bold.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-500">
                <th className="py-2 pr-3 font-medium">Metric</th>
                {periods.map((p, index) => (
                  <th
                    key={index}
                    className={`whitespace-nowrap py-2 pr-3 text-right font-medium ${index === periods.length - 1 ? "text-[var(--foreground)]" : ""}`}
                  >
                    {periodLabel(p.range, period)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REPORT_METRICS.map(([key, label]) => (
                <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-3">{label}</td>
                  {periods.map((p, index) => (
                    <td
                      key={index}
                      className={`py-2 pr-3 text-right tabular-nums ${index === periods.length - 1 ? "font-semibold" : ""}`}
                    >
                      {p[key].toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Trends</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {REPORT_METRICS.map(([key, label]) => (
            <PeriodChart key={key} title={label} periods={periods} field={key} period={period} />
          ))}
        </div>
      </section>
    </>
  );
}

function StatTile({ label, value, change, unit }) {
  const arrow = change.direction === "up" ? "▲" : change.direction === "down" ? "▼" : "";
  const colour =
    change.direction === "up"
      ? "text-emerald-700 dark:text-emerald-400"
      : change.direction === "down"
        ? "text-red-700 dark:text-red-400"
        : "text-zinc-500";
  const text =
    change.direction === "same"
      ? `Same as last ${unit}`
      : change.percent === null
        ? `Up from 0 last ${unit}`
        : `${change.percent}% vs last ${unit}`;

  return (
    <div className="card p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className={`mt-1 text-xs ${colour}`}>
        {arrow && <span aria-hidden="true">{arrow} </span>}
        {text}
      </p>
    </div>
  );
}

// One small column chart: five periods, the current one in full colour.
function PeriodChart({ title, periods, field, period }) {
  const W = 360, H = 170, LEFT = 32, BOTTOM = 24, TOP = 18;
  const plotW = W - LEFT - 4;
  const plotH = H - BOTTOM - TOP;
  const max = niceMax(Math.max(0, ...periods.map((p) => p[field])));
  const slot = plotW / periods.length;
  const barW = Math.min(36, slot - 12);
  const y = (value) => TOP + plotH - (value / max) * plotH;
  const description = `${title}: ${periods.map((p) => `${periodLabel(p.range, period)} ${p[field]}`).join(", ")}`;

  return (
    <figure className="card p-4">
      <figcaption className="text-sm font-medium">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={description}>
        {[0, max / 2, max].map((tick) => (
          <g key={tick}>
            <line x1={LEFT} x2={W} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" strokeWidth="1" />
            <text x={LEFT - 6} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
              {tick.toLocaleString()}
            </text>
          </g>
        ))}
        {periods.map((p, i) => {
          const value = p[field];
          const x = LEFT + i * slot + (slot - barW) / 2;
          const top = y(value);
          const isCurrent = i === periods.length - 1;
          return (
            <g key={i}>
              {value > 0 && (
                <path
                  d={roundedTop(x, top, barW, y(0) - top)}
                  fill="var(--series-views)"
                  opacity={isCurrent ? 1 : 0.35}
                />
              )}
              <text
                x={x + barW / 2}
                y={top - 5}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isCurrent ? 600 : 400}
                fill="var(--text-muted)"
              >
                {value.toLocaleString()}
              </text>
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                {axisLabel(p.range, period)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

// ---------- Formatting helpers ----------

const dayMonth = (date) => new Date(date).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
const monthYear = (date) => new Date(date).toLocaleDateString("en-SG", { month: "short", year: "numeric" });

// "10 Nov", "3 Nov – 9 Nov" or "Nov 2026"; withYear adds the year to day and week labels.
function periodLabel(range, period, withYear = false) {
  const year = withYear ? ` ${new Date(range.endDate).getFullYear()}` : "";
  if (period === "monthly") return monthYear(range.startDate);
  if (period === "daily") return `${dayMonth(range.startDate)}${year}`;
  return `${dayMonth(range.startDate)} – ${dayMonth(range.endDate)}${year}`;
}

// Shorter labels under the chart columns: the day, the week's first day, or the month.
function axisLabel(range, period) {
  if (period === "monthly") return new Date(range.startDate).toLocaleDateString("en-SG", { month: "short" });
  return dayMonth(range.startDate);
}

// Column with a 4px rounded top and a square bottom on the baseline (same as the dashboard).
function roundedTop(x, top, width, height) {
  const r = Math.min(4, width / 2, height);
  return `M${x},${top + height} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${top + height} Z`;
}

// Rounds the top of the axis up to a tidy even number, never 0 (same as the dashboard).
function niceMax(value) {
  if (value <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(value)) / 2;
  const rounded = Math.ceil(value / step) * step;
  return rounded % 2 === 0 ? rounded : rounded + 1;
}
