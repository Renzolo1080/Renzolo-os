# Testimonials

A slowly auto-scrolling row of founder testimonial cards that pauses on hover, focus or the Pause button, and becomes a swipeable, snap-scrolling row on phones and under reduced motion.

- **Consumer provides:** for each testimonial, a real photo, the founder's name, business, city and country, a one-to-two-sentence quote in their own words, and one concrete result (for example "Loan approved", "First corporate contract", "Investor-ready in 90 days").
- **Only real testimonials.** Every quote, name, photo and result must come from a real founder who has given written permission. Never use AI-generated faces, invented names or paraphrased quotes. Until there are at least four, replace this section with program results as stats.
- Cards: `surface-raised`, 1px `line` outline, `radius-md`, `space-6` padding, 300px wide; result badge in `gold` with `on-gold` text; quote in DM Sans 500 17px; name 700, business in `ink-muted`.
- Motion: one full loop every 40s, linear, edges faded with a mask. A visible Pause/Play button is required (auto-moving content must be pausable). Duplicate cards for the loop are `aria-hidden`.
- Under `prefers-reduced-motion`, and on touch devices, the row does not move by itself: it scrolls by swipe with `scroll-snap`.
- Optional: on desktop, a second row scrolling the opposite way at a different speed; short video testimonials open in a modal with captions, never autoplaying with sound.
