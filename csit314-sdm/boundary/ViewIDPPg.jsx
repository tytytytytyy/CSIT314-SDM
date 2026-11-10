// Boundary: ViewIDPPg
// Features: View IDP and Like IDP (Customer). The Like button lives on the IDP page.
//
// Route: /customer/idp/[idpID]   (app/customer/idp/[idpID]/page.jsx renders this)
//
// What goes here:
// - View IDP: title, photos, style, property type, category, budget, description. No login needed.
// - "By <company> (D1)" links to Browse Interior Designers showing just that designer.
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
// - unlikeIDP(customerID, idpID)     customer clicks "Liked" again to remove it from favourites
// - displayRemovedMsg()              "removed from favourites"
// - displayUnlikedState()            the button changes back to "Like"
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ViewIDPController } from "@/controller/ViewIDPController";
import { LikeIDPController } from "@/controller/LikeIDPController";
import { SessionController } from "@/controller/SessionController";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";
import BackButton from "@/boundary/BackButton";

export default function ViewIDPPg({ idpID }) {
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
  const displayUnlikedState = () => setIsLiked(false);
  const displayRemovedMsg = () =>
    setLikeMessage({
      text: "This IDP has been removed from your favourites.",
      isError: false,
    });

  const likeIDP = async (customerID, id) => {
    const added = await LikeIDPController.likeIDP(customerID, id);
    if (added) {
      displaySuccessMsg();
      displayLikedState();
    } else {
      displayAlreadyLikedMsg();
      displayLikedState();
    }
  };

  const unlikeIDP = async (customerID, id) => {
    await LikeIDPController.unlikeIDP(customerID, id);
    displayRemovedMsg();
    displayUnlikedState();
  };

  // Like needs a logged-in customer (pre-condition), so the click handler checks the session first.
  // Clicking "Liked" again unlikes the IDP.
  const onLikeClick = () => {
    const customerID = SessionController.getLoggedInCustomerID();
    if (!customerID) {
      setLikeMessage({ text: "Please log in as a customer", isError: true });
      return;
    }
    if (isLiked) unlikeIDP(customerID, idpID);
    else likeIDP(customerID, idpID);
  };

  useEffect(() => {
    if (loadedIDP.current === idpID) return;
    loadedIDP.current = idpID;
    // Customer clicks an IDP -> the page asks the controller for its details (this records a view).
    const load = async () => {
      const customerID = SessionController.getLoggedInCustomerID();
      const idpDetails = await ViewIDPController.viewIDP(idpID, customerID);
      if (idpDetails) {
        // Show "Liked" straight away if this IDP is already in the customer's favourites.
        setIsLiked(await LikeIDPController.isLiked(customerID, idpID));
        displayIDP(idpDetails);
      } else displayErrorPg("IDP not found");
    };
    load();
  }, [idpID]);

  if (view.kind === "loading") return <p className="p-8">Loading...</p>;
  if (view.kind === "error")
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <BackButton fallbackHref="/" />
        <p className="text-red-600">{view.message}</p>
      </main>
    );

  const { idp, photos, designer } = view.details;
  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <BackButton fallbackHref="/" />
      <h1 className="text-3xl font-semibold">{idp.title}</h1>
      <p className="mt-1 text-zinc-500">
        By{" "}
        <Link
          href={`/customer/designers?designer=${encodeURIComponent(designer.designerID)}`}
          className="link"
        >
          {designer.companyName ?? "Interior designer"} ({designer.designerID})
        </Link>
      </p>
      <div className="mt-4">
        <button
          type="button"
          onClick={onLikeClick}
          aria-pressed={isLiked}
          title={isLiked ? "Click to remove from your favourites" : "Add to your favourites"}
          className={`btn ${isLiked ? "btn-liked" : ""}`}
        >
          {isLiked ? "♥ Liked · Unlike" : "♡ Like"}
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
            className="photo rounded-lg border"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PHOTO_NOT_FOUND;
            }}
          />
        ))}
      </div>
      <dl className="card mt-6 grid grid-cols-[8rem_1fr] gap-y-3 p-5 text-sm">
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
