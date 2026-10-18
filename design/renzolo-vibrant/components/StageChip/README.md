# StageChip

The Founder Trajectory™ method as a row of numbered pills, showing which stage is done, active or ahead.

- **Consumer provides:** the four stages in order (Evaluate, Evolve, Execute, Elevate), the current stage, and optionally a progress percentage and caption.
- **Done:** `teal` fill, `on-teal` text. **Active:** `brand` fill, `on-brand` text, `shadow-pop`, `aria-current="step"`. **Ahead:** `surface-raised` fill, `ink` text and 2px border.
- The number disc uses the display family at 800; the label uses DM Sans 600.
- Chips wrap on narrow screens; arrows between them are decorative (`aria-hidden`).
- Pair with a `teal` progress bar on `surface-tint` that fills over 600ms.
- Use on the home page method section, the pricing page and the app dashboard; always show all four stages in order.
