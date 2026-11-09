---
name: review-geo
description: GEO audit of the built site - geo-strategist checks the production build output against the GEO spec (entity markup and sameAs, citable passages, llms.txt, AI-crawler rules, content without JavaScript) per declared language; fixes go back to awwwards-frontend, within the 3-cycle limit.
disable-model-invocation: true
---

# /review-geo

`geo-strategist` (Agent tool, `departamento-digital:geo-strategist`) audits what AI crawlers receive.

## 1. Prepare
- `web/` must contain the built site and `trabajo/specs/geo.md` must exist. Otherwise stop and tell Xavier what is missing.
- Run the production build in `web/` (`npm run build`) and confirm it succeeds. The output is `web/dist/` for Astro; for Next.js, the prerendered or exported HTML.
- Next.js routes rendered on the server are not in the build output. If the agent asks for them, start the server (`npm run start`), save each route's HTML to `trabajo/reportes/rendered/<route>.html`, and give it those paths.

## 2. Delegate
GEO audit, task 3. Give it: `brief.md`, `trabajo/decisiones.md`, `trabajo/specs/geo.md`, `trabajo/specs/seo.md`, `trabajo/textos/`, the `web/` path and its build output path, the scope (the section just built plus regressions, or the whole site when Xavier ran this command on its own), the cycle number per finding on a re-audit, and: "this is an audit, do not run mcp-geo; prose in rioplatense Spanish".

Save the return verbatim to its `Suggested path:` (`trabajo/reportes/geo-<YYYY-MM-DD>.md`). Handle `BLOCKED:` as `CLAUDE.md` says.

## 3. Verdict and fixes
The audit passes when every GEO spec section passes in every declared language and no critical or major finding remains. Xavier does not see a failing audit.
1. Send the fixes to `awwwards-frontend` as one list with the report's path. Changes to citable passages go to `brand-copywriter` first. A fix that conflicts with the SEO spec goes back to both strategists' specs; one that changes the result goes to Xavier.
2. Read the `awwwards-frontend` report; its Verification must show a passing build.
3. Rebuild and audit again with the same scope. Each round is one cycle; log it in `trabajo/estado.md` under "Ciclos de revisión". After cycle 3 with the same finding open, stop and escalate as "Retry limit" in `CLAUDE.md` says.

## 4. Close
Stop any server you started. When Xavier ran this command on its own and fixes were applied, record in `trabajo/estado.md` that `/review-design`, `/review-seo` and `/qa` must run again before the commit. Tell Xavier the result in two or three lines, in Spanish, pointing to the report.
