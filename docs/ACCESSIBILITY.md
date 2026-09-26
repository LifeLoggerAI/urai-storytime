# Storytime Accessibility Authority

## Status

Storytime accessibility is a launch requirement, not a post-launch enhancement.

The source currently contains accessibility foundations, but **real browser/device/assistive-technology certification is not yet complete**. Source markers, static tests, CSS media queries, and semantic HTML do not substitute for Playwright/browser, axe, screen-reader, keyboard-only, zoom/reflow, mobile, reduced-motion, forced-colors, and performance evidence tied to an exact release SHA.

## Experience contract

Storytime must remain usable for:

- blind and low-vision users;
- Deaf and hard-of-hearing users;
- keyboard-only and motor-impaired users;
- cognitive-accessibility needs;
- ADHD / neurodivergent users;
- PTSD/TBI-sensitive users;
- reduced-motion and reduced-stimulation preferences.

## Current source-level requirements

### Navigation and focus

- A visible-on-focus skip link moves directly to the Storytime main content.
- Main content is a programmatic focus target for skip navigation.
- Native buttons, inputs, selects, textareas, checkboxes, and links remain keyboard-operable.
- Interactive Storytime controls must have a visible `:focus-visible` state.
- Focus indicators must survive forced-colors mode.
- No workflow may rely on hover alone.

### Forms and status

- Inputs use visible labels.
- Cloud-unavailable, validation, submission, and error states are conveyed as text, not color alone.
- Errors use an assertive accessible status such as `role="alert"`.
- Non-critical status changes use `role="status"` where appropriate.
- The story creation form exposes `aria-busy` during submission.
- Disabled controls must remain visually distinguishable.

### Motion and sensory load

- `prefers-reduced-motion: reduce` disables or effectively collapses animation/transition duration.
- Storytime V1 must not require animation to understand state or navigation.
- Future audio/spatial experiences require pause/stop controls and non-audio/non-motion alternatives before activation.

### Reading and playback

Text Storytime remains the authoritative launch fallback.

Narration/media activation requires, before launch of that capability:

- transcript/caption equivalence;
- keyboard-operable playback controls;
- pause/stop;
- playback-rate control where technically supported;
- state announcements that do not become noisy;
- no autoplay that traps or surprises the user;
- deletion/provenance parity with the text story.

### Visual accessibility

- Responsive content reflows to a single-column layout at the existing narrow breakpoint.
- Text and controls must remain usable at browser zoom and text enlargement.
- Forced-colors mode retains structural borders and visible focus.
- Color is never the only signal for errors, warnings, or readiness.

## Required browser certification matrix

Before Storytime can claim launch accessibility certification, retain exact-SHA evidence for at least:

1. Keyboard-only create/sign-in/session/settings/share/revoke/privacy-request flows.
2. Automated accessibility scan with no critical violations on every launch route.
3. Screen-reader smoke for headings, landmarks, form labels, status/error messages, story reading order, and share controls.
4. 200% text zoom and narrow/mobile reflow.
5. Reduced-motion mode.
6. Forced-colors/high-contrast behavior where supported.
7. Touch target usability on mobile.
8. Focus restoration after asynchronous errors and route changes.
9. Story reader readability with long titles/body text.
10. Synthetic-data-only test fixtures.

## Truth boundary

Passing source tests means **accessibility foundations are present**.

It does not mean:
- WCAG certification;
- screen-reader certification;
- browser/device certification;
- accessibility legal compliance;
- narration accessibility certification;
- XR accessibility certification.

Those claims require retained runtime evidence and qualified human review.
