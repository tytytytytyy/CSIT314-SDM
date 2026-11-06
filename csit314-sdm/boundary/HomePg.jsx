// Boundary: HomePg  (TEMPORARY - replace with the real IDP list / search page)
// Route: /
// Carousel of IDP cards (main photo + title). Each card links to ViewIDPPg.
//
// Methods:
// - displayIDPCards(cards)
// - displayEmptyList()
//
// Attributes: none
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HomeController } from "@/controller/HomeController";

export default function HomePg() {
  const [cards, setCards] = useState(null);
  const track = useRef(null);

  const displayIDPCards = (idpCards) => setCards(idpCards);
  const displayEmptyList = () => setCards([]);

  useEffect(() => {
    const load = async () => {
      const idpCards = await HomeController.getFeaturedIDPs();
      if (idpCards.length === 0) displayEmptyList();
      else displayIDPCards(idpCards);
    };
    load();
  }, []);

  const scrollBy = (direction) => {
    const el = track.current;
    if (el)
      el.scrollBy({
        left: direction * el.clientWidth * 0.8,
        behavior: "smooth",
      });
  };

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-3xl font-semibold">IDPs</h1>
      {cards === null && <p className="mt-6">Loading...</p>}
      {cards?.length === 0 && <p className="mt-6">No IDPs available.</p>}
      {cards && cards.length > 0 && (
        <div className="relative mt-6">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-background px-3 py-1"
          >
            ‹
          </button>
          <ul
            ref={track}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
          >
            {cards.map((card) => (
              <li
                key={card.idpID}
                className="w-64 shrink-0 snap-start overflow-hidden rounded border"
              >
                <Link href={`/customer/idp/${card.idpID}`}>
                  {card.mainPhotoURL && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.mainPhotoURL}
                      alt={card.title}
                      className="aspect-[8/5] w-full object-cover"
                    />
                  )}
                  <p className="p-3 font-medium">{card.title}</p>
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 rounded-full border bg-background px-3 py-1"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
