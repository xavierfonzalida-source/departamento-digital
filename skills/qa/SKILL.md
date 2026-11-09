---
name: qa
description: Full quality measurement - the qa agent measures every threshold in the studio manual (Core Web Vitals, Lighthouse, WCAG 2.2 AA, 60 fps, anti-AI design and copy, semantics) on each declared language version of the running site; failures go back to build, within the 3-cycle limit.
disable-model-invocation: true
---

# /qa

`qa` (Agent tool, `departamento-digital:qa`) measures; it never fixes. It runs before every review by Xavier, and nothing that fails reaches him.

Anti-AI copy lists to pass as absolute paths:
- English: `${CLAUDE_PLUGIN_ROOT}/skills/copywriting/references/ai-tells.md`
- Spanish: `${CLAUDE_PLUGIN_ROOT}/references/ai-tells-es.md`

## 1. Prepare
- `trabajo/decisiones.md` must declare the languages and the stack, and `web/` must contain the built site. Otherwise stop and tell Xavier what is missing.
- Start the production build and preview server of `web/` in the background (Astro: `npm run build`, then `npm run preview`; Next.js: `npm run build`, then `npm run start`) and read the URL from its output. For a bilingual site, note the URL of each language version.
- Read "Ciclos de revisión" in `trabajo/estado.md` for thresholds that failed before.

## 2. Delegate
Give it: `trabajo/decisiones.md`, the URL of each language version, `trabajo/specs/`, `trabajo/textos/`, both anti-AI paths, the scope (every page, or the home plus one page per template type when the run follows a single section; say which), the cycle number of each threshold that failed before ("LCP: cycle 2 of 3"), and "prose in rioplatense Spanish". It may run builds itself within its own rules.

Save the return verbatim to its `Suggested path:` (`trabajo/reportes/qa-<YYYY-MM-DD>.md`). Handle `BLOCKED:` as `CLAUDE.md` says.

## 3. Verdict and fixes
Only `Verdict: PASS` passes. A row marked "not measured" is not a pass: fix the cause (server, tool, missing path) and measure it again. Never round a value into a pass.

On FAIL:
1. Route each failing threshold per "Route fixes" in `CLAUDE.md`, using the cause and file the report names: performance, accessibility, semantics, Schema and detector findings to `awwwards-frontend` as one fix list with the report's path; banned copy patterns to `brand-copywriter`, then the new copy to `awwwards-frontend`; a fix that would change an approved design decision to `creative-director`.
2. Read the `awwwards-frontend` report; its Verification must show a passing build.
3. Measure again. Each round is one cycle per threshold; log threshold, cycle, measurement and probable cause in `trabajo/estado.md` under "Ciclos de revisión".
4. If a threshold still fails after cycle 3, stop retrying and escalate to Xavier as "Retry limit" in `CLAUDE.md` says: the measurement, the probable cause and the options, with your recommendation.

## 4. Close
Stop the server unless the next step needs it. Tell Xavier in two or three lines, in Spanish: the verdict per language, the open placeholders the report lists, and the report path.
