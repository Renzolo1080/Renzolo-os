# Button

Pill-shaped buttons with a playful offset shadow that lift on hover and press down on click.

- **Consumer provides:** a label (sentence case, verb first: "Start your assessment"), a variant (`primary`, `secondary` or `link`) and an `href` or click handler.
- **Primary:** `brand` fill, `on-brand` text, 2px `ink` border, `shadow-pop`. Use one per screen, for the main action.
- **Secondary:** `surface-raised` fill, `ink` text and border, `shadow-pop`. Pair beside a primary.
- **Link:** `teal-text`, underlined, no fill. For tertiary actions inside copy or cards.
- Padding `space-3` by `space-6`, `radius-pill`, DM Sans 600 16px.
- Hover: `translateY(-2px)` with `shadow-pop-hover`, 150ms ease-out. Active: `translateY(2px)`, no shadow. Focus: 3px `focus` ring, 2px offset. Disabled: 45% opacity, no shadow.
- Do not put white text on `brand`; do not use two primary buttons side by side.
