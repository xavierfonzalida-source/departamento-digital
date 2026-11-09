---
name: review-seo
description: SEO audit of the built site - seo-strategist checks the production build output against the SEO spec page by page and language by language (metadata, headings, links, hreflang, sitemap, robots, JSON-LD); fixes go back to awwwards-frontend, within the 3-cycle limit.
disable-model-invocation: true
---

# /review-seo

`seo-strategist` (Agent tool, `departamento-digital:seo-strategist`) audits what a crawler receives. Never delegate this to claude-seo's own agents or audit orchestrators.

## 1. Prepare
- `web/` must contain the built site and `trabajo/specs/seo.md` must exist. Otherwise stop and tell Xavier what is missing.
- Run the production build in `web/` (`npm run build`) and confirm it succeeds. The output is `web/dist/` for Astro; for Next.js, the prerendered or exported HTML.
- Next.js routes rendered on the server are not in the build output. If the agent asks for them, start the server (`npm run start`), save each route's HTML to `trabajo/reportes/rendered/<route>.html`, and give it those paths.

## 2. Delegate
SEO audit. Give it: `brief.md`, `trabajo/decisiones.md`, `trabajo/specs/seo.md`, `trabajo/specs/geo.md`, `trabajo/textos/`, the `web/` path and its build output path, the latest `qa` report in `trabajo/reportes/` if there is one, the scope (the section just built plus regressions, or the whole site when Xavier ran this command on its own), the cycle number per finding on a re-audit, and "prose in rioplatense Spanish".

Tell it the exact `Suggested path:` to use, `trabajo/reportes/seo-<YYYY-MM-DD>-c<n>.md` with the cycle number (`c1` on a first audit), so a re-audit never overwrites the earlier report, and save the return verbatim there. Handle `BLOCKED:` as `CLAUDE.md` says.

## 3. Verdict and fixes
The audit passes when every spec section closes as pass and no critical or major finding remains. Xavier does not see a failing audit.
1. Send the fixes to `awwwards-frontend` as one list with the report's path. Copy changes (titles, descriptions, headings wording) go to `brand-copywriter` first. A fix that conflicts with the approved design goes to `creative-director`, or to Xavier when it changes the result.
2. Read the `awwwards-frontend` report; its Verification must show a passing build.
3. Rebuild and audit again with the same scope. Each round is one cycle; log it in `trabajo/estado.md` under "Ciclos de revisión". After cycle 3 with the same finding open, stop and escalate as "Retry limit" in `CLAUDE.md` says.

## 4. Close
Stop any server you started. When Xavier ran this command on its own and fixes were applied, record in `trabajo/estado.md` that `/review-design`, `/review-geo` and `/qa` must run again before the commit. Tell Xavier the result in two or three lines, in Spanish, pointing to the report.
