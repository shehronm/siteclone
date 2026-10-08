# History navigation and secondary-page motion

## Entry behavior

`navigation-boot.js` is inlined at the start of the head so history detection runs before the first paint. Back/forward navigation and BFCache restoration mark the document. The homepage suppresses the server-rendered entrance cover with inline CSS; its React intro provider completes synchronously in a layout effect without starting a loader timer. Full reloads and fresh visits retain the original intro.

The existing `service-navigation.js` continues to restore the main scroller and the service preview's inner scroll. The early bootstrap also applies a valid saved position while the document parses. Versioned `*-mirwink-history2.js` chunks suppress repeated text and modal entrances on restored homepage entries. Old immutable chunks remain for already-open clients.

## Secondary pages

The six service pages and six portfolio demo pages share `scroll-reveal.js` and `scroll-reveal.css`. The values match homepage AnimatedText: 1 second, cubic-bezier(.23,1,.32,1), 100 ms line stagger, 100% line offset or the 8 px block fallback, and a -10% bottom viewport margin. Existing explicit line breaks are wrapped before scrolling; no measurements or DOM restructuring run on scroll. Only opacity and transform animate.

Each observed element is unobserved once shown. Initially visible content, form fields, live results, dialogs and disclosure answers remain visible. Reduced motion, history returns, unsupported IntersectionObserver and disabled JavaScript keep content readable. Enabling reduced motion while browsing releases all pending content. The old independent demo reveal observer is removed.

Service HTML remains reproducible with `npm run build:services`. Keep the inline bootstrap in both homepages and six demo documents synchronized with `navigation-boot.js` if editing it.

## Verification

`npm test`: 55 passing tests, including history/fresh/reload distinction, BFCache notification, early restoration, once-only reveals, reduced motion, keyboard focus and existing service navigation.

Browser checks: fresh/reload intro present; cold browser Back and Forward show zero entrance-cover frames; main and preview scroll offsets restored; service reveals trigger on scroll. Checked 390 px layout and an English portfolio page. Browser layout-shift totals during local sampled loads stayed below 0.004; transform/opacity reveals do not move layout boxes. Local diagnostics are outside the published project.
