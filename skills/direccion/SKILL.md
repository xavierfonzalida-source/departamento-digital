---
name: direccion
description: Runs the direction stage up to approval 1 - SEO and GEO specs if missing, creative concept, real copy in every declared language, visual direction spec and stack, and the HTML prototype with its visual check; then presents it all to Xavier and stops for his approval.
disable-model-invocation: true
---

# /direccion

From research to **approval 1**, in the order of the workflow in `CLAUDE.md`: strategy, concept, copy, then the prototype built with that copy. Agents are this plugin's, called with the Agent tool as `departamento-digital:<name>`.

Plugin files to pass as absolute paths (as the delegation matrix says):
- taste: `${CLAUDE_PLUGIN_ROOT}/references/taste.md`
- English anti-AI list: `${CLAUDE_PLUGIN_ROOT}/skills/copywriting/references/ai-tells.md`
- Spanish anti-AI list: `${CLAUDE_PLUGIN_ROOT}/references/ai-tells-es.md`

## 0. Preconditions
- Languages (and Spanish variant) declared in `trabajo/decisiones.md`; otherwise ask Xavier first.
- `trabajo/research/` holds the `/investigar` findings; if it is empty, stop and suggest `/investigar`.
- If `decisiones.md` already records approval 1, this run is a change of direction: confirm with Xavier what changes, record it under "Cambios de rumbo", and redo only the affected steps.

Every call below: give the paths to read, the task, and "prose in rioplatense Spanish". Save each return verbatim to its `Suggested path:` ("Save deliverables verbatim" in `CLAUDE.md`). Handle `BLOCKED:` replies as `CLAUDE.md` says.

## 1. Strategy specs (only those missing in `trabajo/specs/`)
1. `seo-strategist`: the SEO spec, from `brief.md`, `decisiones.md` and `trabajo/research/` → `trabajo/specs/seo.md`.
2. `geo-strategist`: the GEO spec, from the same files plus the SEO spec → `trabajo/specs/geo.md`.
3. If the GEO spec flags a conflict with the SEO Schema plan or `@id` graph, give `seo-strategist` the GEO spec for an alignment pass and save its updated spec.

## 2. Concept
`creative-director`, task 1 (concept): `brief.md`, `decisiones.md`, `trabajo/brainstorming.md` if present, `trabajo/research/`, `trabajo/specs/`, the taste path. Tell it the exact path to put on its `Suggested path:` line: `trabajo/specs/concepto.md`.

## 3. Copy, before any design
`brand-copywriter`: the voice guide, then the copy for every page in the SEO spec's page list, in **every declared language**. Give it `brief.md`, `decisiones.md`, `trabajo/research/`, `trabajo/specs/` (SEO, GEO, concept) and both anti-AI paths. Ask for the voice guide in one call and the copy in one call per page or page group, so no return is cut off. Save under `trabajo/textos/`.
Check each return: the anti-AI self-check table has zero banned patterns for each language, and the placeholders are listed. Send back anything that fails.

## 4. Visual direction and stack
`creative-director`, tasks 2 and 3: the visual direction spec and the stack choice, from all of the above plus `trabajo/textos/` and the taste path. Tell it the exact path to put on its `Suggested path:` line: `trabajo/specs/direccion.md`. Every AI visual tell it uses must carry the brief's justification.

## 5. Prototype (two calls)
1. **Call 1.** `creative-director`, task 4: the HTML prototype (complete home plus one interior page per template type) with the real copy from `trabajo/textos/`. Give the same paths plus `trabajo/specs/direccion.md`.
   - Save each fenced file to the path written above it. Refuse any path outside `trabajo/prototipos/`.
   - If the Summary says `Part n of m`, save it and call again asking for part n+1 of m, until all parts are saved.
   - The Summary must say `Status: awaiting visual check`.
2. **Serve it.** Start a static server on `trabajo/prototipos/` in the background (for example `npx --yes http-server@14.1.1 "trabajo/prototipos" -p 4173 -c-1`) and open the URL once to check it loads.
3. **Call 2.** `creative-director` again, with the URL, the spec and the prototype paths: "visual check of the prototype". Save the changed files it returns in full over the old ones (or nothing, for `no changes`). Its Summary must say `Status: visual check done`; handle `Part n of m` the same way.
4. If it proposes a copy change, route it to `brand-copywriter`, save the new copy, and have `creative-director` update only the affected files (calls 1 and 2 again for those pages).

Keep the server running for Xavier.

## 6. Present and stop for approval 1
Before presenting, run `superpowers:verification-before-completion`, and list every `[PLACEHOLDER: …]` still visible in `trabajo/textos/` and `trabajo/prototipos/`.

Then tell Xavier, in rioplatense Spanish and briefly:
- the prototype URL and the pages it covers;
- the concept in two lines and the stack with its reason (and what the alternative would cost);
- the files to read: `trabajo/specs/concepto.md`, `trabajo/specs/direccion.md`, `trabajo/textos/`, `trabajo/specs/seo.md`, `trabajo/specs/geo.md`;
- the open placeholders and anything only he can decide;
- the question: whether he approves design, prototype and stack (approval 1), or what he wants changed.

**Stop here.** Do not plan or build anything until Xavier answers.

## 7. After his answer
- **Approved:** record approval 1 in `trabajo/decisiones.md` with today's date: "Dirección aprobada" with "Spec de dirección" = `trabajo/specs/direccion.md` (the source of truth `/build` and `/review-design` read), the concept path and the prototype path, and "Stack" (choice and reason). Stop the prototype server. Update `trabajo/estado.md`. Then invoke `superpowers:writing-plans` for the section-by-section build plan: save it to `trabajo/plan.md` (not `docs/superpowers/plans/`), do not commit it, and do not hand off to an execution skill, because each section is built with `/build <section>`. Tell Xavier the plan's sections and that the next step is `/build <first section>`.
- **Changes requested:** record each change that alters a decision under "Cambios de rumbo"; route copy changes to `brand-copywriter` and design changes to `creative-director`; update only what is affected (prototype calls 1 and 2 for changed pages); present again and stop again for approval 1.
