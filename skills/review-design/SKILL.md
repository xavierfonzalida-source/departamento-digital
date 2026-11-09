---
name: review-design
description: Design review of the built site - creative-director judges the rendered pages in a browser against the approved direction spec and prototype, with impeccable's critique; failing findings go back to frontend-engineer as a fix list, within the 3-cycle limit.
disable-model-invocation: true
---

# /review-design

`creative-director` (Agent tool, `departamento-digital:creative-director`) judges what is **rendered**, never the code. Taste reference to pass: `${CLAUDE_PLUGIN_ROOT}/references/taste.md`.

## 1. Prepare
- `trabajo/decisiones.md` must record approval 1, and `web/` must contain the built site. Otherwise stop and tell Xavier what is missing.
- Start the production build and preview server of `web/` in the background (Astro: `npm run build`, then `npm run preview`; Next.js: `npm run build`, then `npm run start`) and read the URL from its output. For a bilingual site, note the URL of each language version.
- Serve `trabajo/prototipos/` on another port (for example `npx --yes http-server@14.1.1 "trabajo/prototipos" -p 4173 -c-1`) so the prototype can be compared in the browser too.

## 2. Delegate
Task 5 (design review). Give it:
- the site URL(s) and the prototype URL;
- `brief.md`, `trabajo/decisiones.md`, the direction spec recorded as "Spec de dirección" in `decisiones.md` (normally `trabajo/specs/direccion.md`), the concept recorded there (normally `trabajo/specs/concepto.md`), `trabajo/textos/`, the prototype folder and the taste path;
- the scope: the pages or section just built (from `/build` or `/ronda`) plus a pass over the rest for regressions, or the whole site when Xavier ran this command on its own;
- the cycle number per finding when this is a re-review ("cycle 2 of 3");
- "run impeccable's `critique` as your instructions say; prose in rioplatense Spanish".

Tell it the exact `Suggested path:` to use, `trabajo/reportes/design-<section>-<YYYY-MM-DD>-c<n>.md`, where `<section>` is the slug of the scope: the section just built (for example `hero`), `ronda-r<n>` for the reviews of a round, or `sitio` when the scope is the whole site, with the cycle number (`c1` on a first review), so neither a re-review nor another section's review overwrites an earlier report, and save the return verbatim there. Handle `BLOCKED:` as `CLAUDE.md` says.

## 3. Verdict and fixes
The review passes when no critical or major finding remains. Xavier does not see a failing review.
1. Route each finding per "Route fixes" in `CLAUDE.md`: implementation defects to `frontend-engineer` as one fix list with the report's path; copy problems to `brand-copywriter` (then the new copy to `frontend-engineer`); a finding that would change an approved design decision to `creative-director`, or to Xavier when it changes the result. Minor findings go in the same fix list unless they would change a design decision.
2. Read the `frontend-engineer` report; its Verification must show a passing build.
3. Rebuild (`npm run build` in `web/`), restart the preview server, read the URL again, then review again with the same scope. Each build-and-review round is one cycle; log it in `trabajo/estado.md` under "Ciclos de revisión". After cycle 3 with the same finding still open, stop and escalate to Xavier as "Retry limit" in `CLAUDE.md` says.

## 4. Close
Stop both servers unless the next step needs them. When Xavier ran this command on its own and fixes were applied, record in `trabajo/estado.md` that `/review-seo`, `/review-geo` and `/qa` must run again before the commit. Tell Xavier the result in two or three lines, in Spanish, pointing to the report.
