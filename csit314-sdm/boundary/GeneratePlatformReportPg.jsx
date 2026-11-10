// Boundary: GeneratePlatformReportPg
// Feature: Generate Platform Report (Platform Management)
// User story: As a platform manager, I want to generate a platform report for a chosen
// period (e.g. daily, weekly, monthly), so that I can track how the platform is performing.
//
// Route: /platform-manager/report   (app/platform-manager/report/page.jsx renders this)
//
// What goes here:
// - Period selector (daily / weekly / monthly) and a reference date.
// - "Generate" button that calls GeneratePlatformReportController.
// - Report display: six metrics for five consecutive periods in a table and charts.
//
// Methods:
// - submitReportRequest(event)        calls GeneratePlatformReportController.generateReport(...)
//
// Attributes: none

"use client";

import { useState } from "react";
import { GeneratePlatformReportController } from "@/controller/GeneratePlatformReportController";

const REPORT_METRICS = [
  ["customerAccounts", "New customer accounts"],
  ["designerAccounts", "New interior designer accounts"],
  ["verifiedDesigners", "Verified designers"],
  ["idps", "New IDPs"],
  ["views", "IDP views"],
  ["likes", "IDP likes"],
];
const PERIOD_COLORS = ["#d4d4d8", "#a1a1aa", "#71717a", "#3f3f46", "#2563eb"];

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  const value = new Date(date);
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTableDateRange(range, period) {
  if (period === "daily") return formatDate(range.startDate);
  if (period === "monthly") return formatDate(range.startDate).slice(3);
  const start = formatDate(range.startDate);
  const end = formatDate(range.endDate);
  return start === end ? start : `${start} – ${end}`;
}

function formatChartDateRange(range, period) {
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const dayMonth = (date) =>
    `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (period === "daily") return dayMonth(start);
  if (period === "monthly") {
    return `${String(start.getMonth() + 1).padStart(2, "0")}/${start.getFullYear()}`;
  }
  return `${dayMonth(start)}–${dayMonth(end)}`;
}

function getChartScale(values) {
  const maxValue = Math.max(0, ...values);
  const rawStep = Math.max(1, maxValue / 4);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalizedStep = rawStep / magnitude;
  const stepFactor =
    normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  const step = stepFactor * magnitude;
  const max = maxValue === 0 ? step * 4 : Math.ceil(maxValue / step) * step;
  return { max, step };
}

export default function GeneratePlatformReportPg() {
  const [period, setPeriod] = useState("weekly");
  const [referenceDate, setReferenceDate] = useState(() => getLocalDateValue());
  const [view, setView] = useState({ kind: "empty" });

  const submitReportRequest = async (event) => {
    event.preventDefault();
    setView({ kind: "loading" });

    try {
      const report = await GeneratePlatformReportController.generateReport(
        period,
        referenceDate,
      );
      if (report.status === "ok") {
        setView({ kind: "report", report });
      } else {
        setView({ kind: "error", message: report.message });
      }
    } catch (error) {
      setView({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate the report. Please try again.",
      });
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">Generate Platform Report</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Compare platform activity with the previous four periods of the same length.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={submitReportRequest}
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          Period
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="input"
          >
            {GeneratePlatformReportController.REPORT_PERIODS.map((option) => (
              <option key={option} value={option}>
                {option[0].toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Reference date
          <input
            type="date"
            required
            value={referenceDate}
            onChange={(event) => setReferenceDate(event.target.value)}
            className="input"
          />
        </label>
        <button
          type="submit"
          disabled={view.kind === "loading"}
          className="btn btn-primary"
        >
          {view.kind === "loading" ? "Generating..." : "Generate report"}
        </button>
      </form>

      {view.kind === "error" && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {view.message}
        </p>
      )}
      {view.kind === "loading" && (
        <p role="status" className="text-sm text-zinc-500">
          Generating report...
        </p>
      )}
      {view.kind === "report" && (
        <section aria-label="Platform report" className="space-y-4">
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="divide-x divide-zinc-200 border-b bg-zinc-50 text-zinc-600">
                  <th scope="col" className="p-3 text-left font-medium">Metric</th>
                  {view.report.periods.map((reportPeriod, index) => (
                    <th
                      key={String(reportPeriod.range.startDate)}
                      scope="col"
                      className={`min-w-28 p-3 text-center font-medium ${index === view.report.periods.length - 1 ? "text-blue-700" : ""}`}
                    >
                      {formatTableDateRange(reportPeriod.range, view.report.period)}
                      {index === view.report.periods.length - 1 && (
                        <span className="block text-xs">(current)</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REPORT_METRICS.map(([key, label]) => {
                  return (
                    <tr key={key} className="divide-x divide-zinc-200 border-b last:border-0">
                      <th scope="row" className="p-3 text-left font-medium">{label}</th>
                      {view.report.periods.map((reportPeriod, index) => (
                        <td
                          key={String(reportPeriod.range.startDate)}
                          className={`p-3 text-center tabular-nums ${index === view.report.periods.length - 1 ? "font-semibold text-blue-700" : ""}`}
                        >
                          {reportPeriod[key].toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <section aria-label="Five-period metric charts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {REPORT_METRICS.map(([key, label]) => {
                const values = view.report.periods.map(
                  (reportPeriod) => reportPeriod[key],
                );
                const { max, step } = getChartScale(values);
                const plot = { left: 52, right: 12, top: 24, bottom: 188 };
                const plotWidth = 440 - plot.left - plot.right;
                const plotHeight = plot.bottom - plot.top;
                const ticks = Array.from(
                  { length: Math.round(max / step) + 1 },
                  (_, index) => index * step,
                );
                const chartDescription = `${label} over five periods: ${view.report.periods
                  .map(
                    (reportPeriod) =>
                      `${formatDate(reportPeriod.range.startDate)}: ${reportPeriod[key].toLocaleString()}`,
                  )
                  .join("; ")}`;

                return (
                  <figure key={key} className="card min-w-0 p-4">
                    <figcaption className="font-semibold">{label}</figcaption>
                    <svg
                      role="img"
                      aria-label={chartDescription}
                      viewBox="0 0 440 250"
                      className="mt-3 w-full"
                    >
                      {ticks.map((tick) => {
                        const y =
                          plot.bottom - (tick / max) * plotHeight;
                        return (
                          <g key={tick}>
                            <line
                              x1={plot.left}
                              x2={440 - plot.right}
                              y1={y}
                              y2={y}
                              stroke="#e4e4e7"
                              strokeWidth="1"
                            />
                            <text
                              x={plot.left - 7}
                              y={y + 3}
                              textAnchor="end"
                              fontSize="10"
                              fill="#71717a"
                            >
                              {tick.toLocaleString()}
                            </text>
                          </g>
                        );
                      })}
                      <line
                        x1={plot.left}
                        x2={plot.left}
                        y1={plot.top}
                        y2={plot.bottom}
                        stroke="#a1a1aa"
                      />
                      <line
                        x1={plot.left}
                        x2={440 - plot.right}
                        y1={plot.bottom}
                        y2={plot.bottom}
                        stroke="#a1a1aa"
                      />
                      {view.report.periods.map((reportPeriod, index) => {
                        const value = reportPeriod[key];
                        const x =
                          plot.left +
                          ((index + 0.5) * plotWidth) /
                            view.report.periods.length;
                        const y =
                          plot.bottom - (value / max) * plotHeight;

                        return (
                          <g key={String(reportPeriod.range.startDate)}>
                            <rect
                              x={x - 17}
                              y={y}
                              width="34"
                              height={Math.max(0, plot.bottom - y)}
                              fill={PERIOD_COLORS[index]}
                              rx="2"
                            />
                            <text
                              x={x}
                              y={Math.max(plot.top - 2, y - 5)}
                              textAnchor="middle"
                              fontSize="9"
                              fill="#3f3f46"
                            >
                              {value.toLocaleString()}
                            </text>
                            <text
                              x={x}
                              y={plot.bottom + 15}
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight={
                                index === view.report.periods.length - 1
                                  ? "600"
                                  : "400"
                              }
                              fill="#52525b"
                            >
                              <title>{formatDate(reportPeriod.range.startDate)}</title>
                              {formatChartDateRange(reportPeriod.range, view.report.period)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </figure>
                );
              })}
            </div>
          </section>
        </section>
      )}

    </main>
  );
}
