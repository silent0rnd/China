# Hero design QA

## Visual controls

- Desktop reference: `references/approved-desktop-hero.png`.
- Mobile reference: `references/approved-mobile-hero.png`.
- Tested implementation: real HTML header, CTA, menu, contacts and dialog over clean scene assets derived from the approved references.
- Typography: locally hosted Golos Text for interface copy and IBM Plex Mono for technical labels, routes and numbers.

## Captured states

| Viewport | Result |
|---|---|
| 1440 x 900 | Passed: header, left text zone, right China-Russia scene and CTA remain in the first screen. |
| 1294 x 920 | Passed: Golos Text keeps the H1 to four lines and desktop navigation to one line. |
| 390 x 844 | Passed: mobile header, shortened approved copy, primary CTA and mobile scene are visible without horizontal scrolling. |
| 320, 768, 1024, 1280 px | Passed: no horizontal scrolling; the header switches to call plus menu where the full desktop navigation would not fit. |

## Interaction checks

- Primary hero CTA opens the accessible contact dialog.
- Dialog closes by its visible close button and backdrop click.
- Mobile menu opens, closes with Escape and restores scroll state.
- Telephone controls use real `tel:` links.
- The form never reports success: until the server phase it clearly states that no request has been sent.

## Web interface checks

- Decorative scene images have empty `alt`; controls have accessible names.
- Header, navigation, main, heading hierarchy, labels, visible focus, skip link and `aria-live` status are present.
- Motion uses only opacity and transforms. `prefers-reduced-motion` disables it.
- Mobile menu and dialog contain overscroll; touch feedback and safe-area padding are defined.

## Known phase boundaries

- Navigation links lead to sections that will be created in the next static-site phase.
- Server delivery, file upload, analytics, cookie consent and legal pages are intentionally not implemented at the hero checkpoint.

## Final result

**passed - hero checkpoint only**
