# LEGIS: public access to rights

Authorised by the user on 15 October 2026. Operator: VOCE Association.

## Published scope

- French pathway `/fr/legis/aide`, English `/legis/help`, Italian `/it/legis/aiuto`. All three concern France. The English alias `/en/legis/help` redirects to the English canonical route.
- Eight selectable topics: housing, administration/benefits, employment, debt, consumer contracts, family, discrimination, other/unsure.
- Optional priority flags cover a deadline/hearing, housing at risk, violence and essential needs. A copied date is marked unverified and never used to calculate a deadline.
- Rule-based contacts, document preparation, questions for a qualified professional, a factual personal summary and an editable appointment request. Download as TXT or print/save as PDF. No submission or appointment booking.
- Foreign/cross-border cases receive a factual preparation sheet and the European e-Justice portal, with no assertion that French procedures apply. France-specific emergency contacts do not appear in that case's result.
- LEGIS is an information/orientation tool. It does not claim to be a law firm, provide a professional consultation, determine eligibility, file appeals or guarantee an outcome.

The professional beta remains at the existing `/legis`, `/fr/legis` and `/it/legis` routes, with a prominent link to this pathway. The home page's multilingual LEGIS link opens the public pathway. Academy and corpus content are preserved.

## Sources and review

`legis-help-content.js` holds the editorial text and primary-source URLs, checked 15 October 2026: Ministry of Justice Point-justice directory/victim support; Service Public information on free first consultations, legal aid, emergency contacts and Défenseur des droits procedures; ANIL ADIL directory; France services; Ministry of Labour digital code; Banque de France; DGCCRF SignalConso; CCAS official directory; Défenseur des droits; European e-Justice Portal.

Descriptions are concise editorial summaries, not law quotations or exhaustive eligibility rules. There is no external legal API or live verification. After 30 days, generated sheets explicitly request rechecking current conditions on the primary sites. Manual review is required to advance the date. In particular, referring a public-service dispute to the Défenseur des droits follows an initial approach to the service and does not suspend appeal deadlines. A free first legal consultation does not promise free subsequent representation.

## Case data

The help modules perform no fetch, AI call, analytics, URL parameter import, persistent storage or case upload. Free text is optional and limited. The form is disabled without JavaScript; the static official directory remains available. Changing inputs invalidates and clears the previous output, edited request and print area. Clearing the form discards the current in-memory case. No cases enter D1, R2 or the corpus. Downloads stay on the visitor's device and can contain their own text.

The Worker serves these pages without the shared analytics/audio injections, with `connect-src 'none'`, `form-action 'none'`, same-origin scripts and a no-referrer policy. Standard requests for site assets are still served by the hosting infrastructure; external services have their own privacy conditions. No privileged professional secrecy is claimed.

## Build and validation

Run `node scripts/build-legis-help.mjs` and `node scripts/build-legis.mjs` after copy updates. Generated HTML is committed because the existing automatic deployment serves the repository directly. Run Node tests in `tests/legis-help*.test.mjs` as well as the professional beta tests. DOM tests use jsdom, optionally via the `LEGIS_JSDOM_MODULE` environment variable. Perform a Wrangler deployment dry run and browser checks of all three published languages and mobile layout.

Deploy through the existing GitHub main / Cloudflare Worker pipeline. No new infrastructure, paid plan or AI usage is needed for this pathway. No LinkedIn announcement is created automatically by publishing the website; sharing requires a separately authorised action.
