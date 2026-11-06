// Boundary: IDPViewPg
// Features: View IDP and Like IDP (Customer). The Like button lives on the IDP page.
//
// Route: /idp/[idpID]   (app/idp/[idpID]/page.jsx renders this)
//
// What goes here:
// - View IDP: title, photos, style, property type, category, budget, description. No login needed.
// - Like IDP: a Like button. Clicking it calls LikeIDPController, then shows a success message and
//   the liked state, or the "already in favourites" message.
//
// Methods:
// - displayIDP(idpDetails)
// - displayErrorPg(message)          e.g. "IDP not found"
// - likeIDP(customerID, idpID)       customer clicks the Like button
// - displaySuccessMsg()              "added to favourites"
// - displayAlreadyLikedMsg()         "already in favourites"
// - displayLikedState()              the Like button changes to "Liked"
//
// Attributes: none
"use client";

import { useEffect, useRef, useState } from "react";
import { ViewIDPController } from "@/controller/ViewIDPController";
import { LikeIDPController } from "@/controller/LikeIDPController";
import { SessionController } from "@/controller/SessionController";
import { PHOTO_NOT_FOUND } from "@/entity/DummyData";

export default function IDPViewPg({ idpID }) {
  const [view, setView] = useState({ kind: "loading" });
  const [isLiked, setIsLiked] = useState(false);
  const [likeMessage, setLikeMessage] = useState(null);
  // Remembers which IDP was already loaded, so one visit records one view
  // (React runs effects twice in development mode).
  const loadedIDP = useRef(null);

  const displayIDP = (idpDetails) =>
    setView({ kind: "idp", details: idpDetails });
  const displayErrorPg = (message) => setView({ kind: "error", message });
  const displaySuccessMsg = () =>
    setLikeMessage({
      text: "This IDP has been added to your favourites.",
      isError: false,
    });
  const displayAlreadyLikedMsg = () =>
    setLikeMessage({
      text: "This IDP is already in your favourites.",
      isError: false,
    });
  const displayLikedState = () => setIsLiked(true);

  const likeIDP = async (customerID, id) => {
    const added = await LikeIDPController.likeIDP(customerID, id);
    if (added) {
      displaySuccessMsg();
      displayLikedState();
    } else {
      displayAlreadyLikedMsg();
    }
  };

  // Like needs a logged-in customer (pre-condition), so the click handler checks the session first.
  const onLikeClick = () => {
    const customerID = SessionController.getLoggedInCustomerID();
    if (!customerID) {
      setLikeMessage({ text: "Please log in as a customer", isError: true });
      return;
    }
    likeIDP(customerID, idpID);
  };

  useEffect(() => {
    if (loadedIDP.current === idpID) return;
    loadedIDP.current = idpID;
    // Customer clicks an IDP -> the page asks the controller for its details (this records a view).
    const load = async () => {
      const idpDetails = await ViewIDPController.viewIDP(
        idpID,
        SessionController.getLoggedInCustomerID(),
      );
      if (idpDetails) displayIDP(idpDetails);
      else displayErrorPg("IDP not found");
    };
    load();
  }, [idpID]);

  if (view.kind === "loading") return <p className="p-8">Loading...</p>;
  if (view.kind === "error")
    return <p className="p-8 text-red-600">{view.message}</p>;

  const { idp, photos } = view.details;
  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-3xl font-semibold">{idp.title}</h1>
      <div className="mt-4">
        <button
          type="button"
          onClick={onLikeClick}
          className={`rounded border px-4 py-2 ${isLiked ? "bg-red-500 text-white" : "bg-white text-black"}`}
        >
          {isLiked ? "♥ Liked" : "♡ Like"}
        </button>
        {likeMessage && (
          <p
            className={`mt-2 text-sm ${likeMessage.isError ? "text-red-600" : "text-green-700"}`}
          >
            {likeMessage.text}
          </p>
        )}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {photos.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.photoID}
            src={photo.photoURL}
            alt={photo.caption}
            className="rounded"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PHOTO_NOT_FOUND;
            }}
          />
        ))}
      </div>
      <dl className="mt-6 grid grid-cols-[8rem_1fr] gap-y-2">
        <dt className="font-medium">Style</dt>
        <dd>{idp.style}</dd>
        <dt className="font-medium">Property type</dt>
        <dd>{idp.propertyType}</dd>
        <dt className="font-medium">Category</dt>
        <dd>{idp.category}</dd>
        <dt className="font-medium">Budget</dt>
        <dd>${idp.budget.toLocaleString()}</dd>
        <dt className="font-medium">Description</dt>
        <dd>{idp.description}</dd>
      </dl>
    </main>
  );
}
