# VOCE visual guides

Sixteen editorial guides explain the existing public site in English, French and Italian. A small link near a page introduction opens a native HTML dialog. The diagram uses the existing Cormorant Garamond and Inter families and the site's colour variables. On narrow screens the stages stack vertically. Closing the dialog returns focus to the initiating link.

The complete explanations also appear as HTML in `/visual-guides`, `/fr/visual-guides` and `/it/visual-guides`. Each article has a permanent fragment, for example `/fr/visual-guides#permissions`. The home footer and sitemap link to these pages. Ordinary links provide a fallback when dialog support or JavaScript is unavailable.

## Editorial updates

The three language editions, scope notes and destination links are authored in `visual-guides.js`. Keep their stage counts and meaning aligned. Conformance control identifiers and the underlying normative frameworks are unchanged. ARGOS describes a process to implement; the visual feature does not run monitoring. A4 describes criticality, not self-improvement.

After changing guide content or labels, regenerate the HTML collections with:

```sh
node scripts/build-visual-guides.cjs
```

The generator uses only Node built-ins. Review the resulting HTML, reference links, dates and three language editions together. Update the editorial date and asset version when publishing a revision.

## Sharing

`visual-guide-export.js` is loaded only when a visitor requests an export. Canvas produces a 1200 × 1500 PNG summary and a detailed PDF with one page per stage, evidence states where relevant, and a scope page. Longer translations receive a labelled overview rather than clipped text. PDF pages link back to the guide's language-specific permanent fragment.

Exports are created locally in the visitor's browser using the site fonts. The exporter calls no AI model or rendering service. It waits for font loading, measures the layout, checks that text stays above the footer and reports a failure if it cannot generate the file. A visible download link remains available when automatic downloading is blocked.

## Verification for the initial publication

All 48 guide/language combinations were generated as PNG and PDF using Canvas with the Cormorant Garamond and Inter families. The PDFs were reopened to check page counts, page dimensions and source links; representative pages were rendered with Poppler and visually inspected. HTML checks covered translated content, duplicate IDs, fallback anchors, script inclusion, structured data and sitemap entries.

These checks do not replace an interactive browser review of the dialog, keyboard navigation and downloads. The managed workspace did not provide the required browser-control capability for that review.
