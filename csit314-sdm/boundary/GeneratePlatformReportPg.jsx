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
// - Report display: each metric with its current value, previous period value,
//   and the change (up / down %).
//
// Methods:
// - displayReportForm()
// - submitReportRequest(period, referenceDate)
// - displayReport(report)
// - displayErrorPg(message)          e.g. "Date cannot be in the future"
//
// Attributes: none

"use client";

import { useState } from "react";

import { GeneratePlatformReportController } from "@/controller/GeneratePlatformReportController";

export default function GeneratePlatformReportPg() {
    const [period, setPeriod] = useState("daily");
    const [referenceDate, setReferenceDate] = useState("");
    const [report, setReport] = useState(null);
    const [message, setMessage] = useState("");

    const displayReportForm = () => {
        setReport(null);
        setMessage("");
    };

    const displayReport = (report) => {
        setReport(report);
        setMessage("");
    };

    const displayErrorPg = (message) => {
        setReport(null);
        setMessage(message);
    };

    const submitReportRequest = async () => {

        const result =
            await GeneratePlatformReportController.generateReport(
                period,
                referenceDate
            );

        if (result.status === "ok")
            displayReport(result);
        else
            displayErrorPg(result.message);
    };

    return (
        <main className="mx-auto w-full max-w-5xl p-8">
            <h1 className="text-3xl font-semibold">
                Platform Report
            </h1>

            <form
                className="mt-6 flex gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    submitReportRequest();
                }}
            >
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="rounded border px-3 py-2"
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>

                <input
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className="rounded border px-3 py-2"
                />

                <button
                    type="submit"
                    className="rounded bg-zinc-900 px-5 py-2 text-white"
                >
                    Generate
                </button>
            </form>

            {message && (
                <p className="mt-4 text-red-600">
                    {message}
                </p>
            )}

            {report && (
                <div className="mt-8">
                    {/* TODO:
                        Replace with actual report rendering.
                    */}

                    <pre>
                        {JSON.stringify(report, null, 2)}
                    </pre>
                </div>
            )}
        </main>
    );
}