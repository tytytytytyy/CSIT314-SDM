const svg =
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'>` +
  `<rect width='160' height='100' fill='#c7c7c7'/>` +
  `<text x='80' y='54' font-size='11' text-anchor='middle' fill='white' font-family='Arial'>Photo coming soon</text></svg>`;

export const PHOTO_NOT_FOUND = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

// Swaps a broken image for the placeholder (once only, so the placeholder can't loop).
export function showPhotoFallback(e) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PHOTO_NOT_FOUND;
}
