# Hero design QA

## Target

- `references/approved-desktop-hero.png`
- `references/approved-mobile-hero.png`

## Implemented correction

- The reference is now rendered as one full-frame image for each breakpoint through `picture`.
- The desktop image spans the entire desktop hero and the mobile image spans the entire mobile hero.
- The right-side crop, independent left dark layer and `.hero__shade` were removed.

## Evidence

- Desktop runtime at 1280 x 720: desktop reference loaded, `object-fit: fill`, hero fills the viewport, no horizontal overflow, no console errors.
- Mobile runtime at 390 x 844: mobile reference loaded at its natural 941 x 1672, hero fills the viewport, hidden menu is `display: none`, no horizontal overflow.

## Result

The implementation change matches the requested full-frame source treatment. In-app browser screenshot capture was inconsistent after the change and then timed out, so it is not accepted as final image-to-code evidence.

Final result: blocked
