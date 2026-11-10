"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HomeController } from "@/controller/HomeController";
import { PHOTO_NOT_FOUND } from "@/boundary/PhotoFallback";

export default function HomePg() {
  const [cards, setCards] = useState([]);
  const [featuredCards, setFeaturedCards] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | more | end | empty
  const bottomMarker = useRef(null);

  const displayIDPCards = (pageCards) => setCards((shown) => [...shown, ...pageCards]);
  const displayFeaturedCards = (shown) => setFeaturedCards(shown);
  const displayEndOfList = () => setStatus("end");
  const displayEmptyList = () => setStatus("empty");

  useEffect(() => {
    const marker = bottomMarker.current;
    let nextOffset = 0;
    let busy = false;
    let finished = false;
    let cancelled = false; // the page was left (or React re-ran this effect)

    const loadNextPage = async () => {
      if (busy || finished) return;
      busy = true;
      const page = await HomeController.getIDPFeed(nextOffset);
      if (cancelled) return;
      nextOffset += page.cards.length;
      displayIDPCards(page.cards);
      busy = false;
      if (!page.hasMore) {
        finished = true;
        if (nextOffset === 0) displayEmptyList();
        else displayEndOfList();
        return;
      }
      setStatus("more");
      // Watch the bottom again once the new cards are on screen: if it is still in view
      // (a tall screen), the observer reports it and the next page loads.
      requestAnimationFrame(() => {
        if (cancelled) return;
        observer.unobserve(marker);
        observer.observe(marker);
      });
    };

    const loadFeatured = async () => {
      const featured = await HomeController.getFeaturedIDPs();
      if (!cancelled) displayFeaturedCards(featured);
    };
    loadFeatured();

    // Start loading a little before the customer reaches the bottom.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(marker);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      {featuredCards.length > 0 && (
        <section className="mb-10">
          <h1 className="text-3xl font-semibold">Featured projects</h1>
          <CardGrid cards={featuredCards} />
        </section>
      )}

      <h2 className="text-3xl font-semibold">All projects</h2>

      {cards.length > 0 && <CardGrid cards={cards} />}

      <div ref={bottomMarker} aria-hidden="true" />
      {(status === "loading" || status === "more") && (
        <p className="mt-6 text-center text-zinc-500">Loading more projects...</p>
      )}
      {status === "end" && (
        <p className="mt-6 text-center text-zinc-500">
          That&apos;s all {cards.length + featuredCards.length} projects.
        </p>
      )}
      {status === "empty" && <p className="mt-6">No other projects available.</p>}
    </main>
  );
}

// One grid of IDP cards; used by both sections.
function CardGrid({ cards }) {
  return (
    <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <li key={card.idpID} className="card card-hover overflow-hidden">
          <Link href={`/customer/idp/${card.idpID}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.mainPhotoURL ?? PHOTO_NOT_FOUND}
              alt={card.title}
              loading="lazy"
              className="photo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PHOTO_NOT_FOUND;
              }}
            />
            <p className="px-4 pt-3 font-medium">{card.title}</p>
          </Link>
          <p className="px-4 pb-4 pt-1 text-sm text-zinc-500">
            {card.style} · by{" "}
            <Link
              href={`/customer/designers?designer=${encodeURIComponent(card.designerID)}`}
              className="link"
            >
              {card.companyName ?? card.designerID}
            </Link>
          </p>
        </li>
      ))}
    </ul>
  );
}
