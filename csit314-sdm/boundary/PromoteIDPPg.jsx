// Boundary: PromoteIDPPg
// Feature: Promote IDP (Platform Management)
// User story: As a platform manager, I want to promote an IDP for a set period,
// so that high-quality projects get more visibility.
//
// Route: /platform-manager/promote-idp/[idpID]   (app/platform-manager/promote-idp/[idpID]/page.jsx renders this)
//
// What goes here:
// - Form showing the selected IDP with a start date and end date picker.
// - "Promote" button that submits to PromoteIDPController.
// - Success / error messages (e.g. promotion limit reached, invalid dates).
//
// Methods:
// - displayPromoteForm(idp)
// - submitPromotion(idpID, startDate, endDate)
// - displaySuccessPg()
// - displayErrorPg(message)
//
// Attributes: none

"use client";

import { useEffect, useState } from "react";
import { PromoteIDPController } from "@/controller/PromoteIDPController";

export default function PromoteIDPPg({ params }) {
    const [idp, setIdp] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    const idpID = Number(params.idpID);

    const displayPromoteForm = (idp) => {
        setIdp(idp);
    };

    const displaySuccessPg = () => {
        setSuccess(true);
        setMessage("Promotion created successfully.");
    };

    const displayErrorPg = (message) => {
        setSuccess(false);
        setMessage(message);
    };

    const submitPromotion = async () => {
        const result = await PromoteIDPController.promoteIDP(
            idpID,
            startDate,
            endDate,
            "PM1"
        );

        switch (result.status) {

            case "ok":
                displaySuccessPg();
                break;

            case "notFound":
                displayErrorPg("IDP not found.");
                break;

            case "invalidStartDate":
                displayErrorPg(
                    "Start date must be today or later."
                );
                break;

            case "invalidEndDate":
                displayErrorPg(
                    "End date must be after the start date."
                );
                break;

            case "maxPromotionsReached":
                displayErrorPg(
                    "Maximum active promotions reached."
                );
                break;

            case "dateOverlap":
                displayErrorPg(
                    "This IDP already has a promotion in the selected period."
                );
                break;

            default:
                displayErrorPg(
                    "Unable to create promotion."
                );
        }
    };

    useEffect(() => {
        const load = async () => {
            const idp =
                await PromoteIDPController.getIDP(idpID);

            if (!idp)
                displayErrorPg("IDP not found.");
            else
                displayPromoteForm(idp);
        };

        load();
    }, [idpID]);

    if (!idp) {
        return <p>Loading...</p>;
    }

    return (
        <main>
            <h1>Promote IDP</h1>

            <p>{idp.title}</p>

            {message && (
                <p>
                    {message}
                </p>
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    submitPromotion();
                }}
            >
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                        setStartDate(e.target.value)
                    }
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                        setEndDate(e.target.value)
                    }
                />

                <button type="submit">
                    Promote
                </button>
            </form>
        </main>
    );
}