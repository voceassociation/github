# Education changes · 18 October 2026

## Scope

120 French module pages retain their identifiers, permanent URLs, competence identifiers, reference relationships and publication statuses. The revised pages preserve the original conceptual material and add a distinct professional case, transfer task, written deliverable, answer and formative rubric. Source files cover 60 AI, 30 art and 30 cognition modules.

The learning design allocates 35–45 minutes including active written work. This is not 30 minutes of continuous reading. Timing is an estimate and has not been measured with learners. The word counts in course-rewrite-audit.json include common instructions and bibliographic material; they must not be presented as the size of a wholly new lecture. The short conceptual expositions remain a limitation for readers seeking a comprehensive expert lecture; these are case-based learning sequences, not full professional qualifications.

Six new concept pages present Virtual Faculty and Education Systems in FR, EN and IT. They describe six proposed programmes, target architecture, human oversight, accessibility, recognition boundaries and a pilot process. No working virtual teacher, executed pilot, degree, accreditation or government partnership is claimed. The GRETA/AFPA individual-experience statement comes from the commissioning brief; staff biographies and supporting documentation should be assembled before external institutional due diligence.

The 120 historical modules remain French. The historic English/Italian course translations are not rewritten in this change. New institutional pages are translated; no Montenegrin translation is claimed. Montenegrin technical terminology requires specialist review.

## References

The existing standards registry is preserved. Its previous verification scopes and incomplete full-text reviews remain visible; a source's prior review date is not overwritten to imply a new full-text reading. No ESCO/e-CF/EQF equivalence is generated. A reference in a bibliography is not proof of full curricular alignment.

Primary sources consulted for the new institutional pages: JRC DigComp 3.0; CEN guidance on EN 16234-1:2019 curriculum alignment; ESCO official portal; Montenegro's National Qualifications Framework law and education legislation portal; ISO 21001:2025 public catalogue. Detailed programme-to-descriptor mappings and jurisdiction-specific approval analysis remain to be completed before qualification delivery.

Targeted source checks for course mechanisms: NIST AI RMF, MCP authorization version 2025-06-18, Stripe idempotent requests, DeepSeek-R1 primary paper, Cochrane chapter 10, Getty vocabularies, CIDOC CRM and Regulation (EU) 2026/1744. These checks are not an independent scientific validation of all 120 modules.

## Checks actually run

- scripts/check-education.py: 120 stable routes, IDs, competence links, reference lists and statuses; 120 distinct case prompts; structured data parsing; canonical and sitemap presence; removed stale duration text; six concept pages with real language alternates; local links; selected arithmetic.
- node --test tests/public-pages.test.mjs tests/post-saas.test.mjs: 15 passing tests.
- Browser attempt: Playwright Chromium unavailable (missing executable). No mobile screenshots, browser accessibility audit or visual verification claimed.
- No learner timings or outcomes exist. No attendance, satisfaction or qualification evidence was generated.

## Release

Submit as a draft pull request for review. No production deployment is performed by this change. Proposed production paths are recorded in the PR; they must not be reported as live before merge, deployment and HTTP/content verification.

No changes to Post-SaaS implementation, LÉGIS, the standards definitions or scheduled tasks are included in this branch. The daily automation was separately re-enabled at the user's explicit request with the 30-minute active-learning requirement.

## Concurrent SEO update preserved

Merged main 0e16baed212c5d740a7e36b763b822b8dd295a7b. Preserved the eligibility policy, noindex on development modules, historical-course metadata, sitemap exclusions and current discovery changes. Educational updates do not promote those modules to indexed/validated status. The six new concept pages have their own sitemap entries.
