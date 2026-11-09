---
name: build
description: Builds one section of the site after approval 1 - frontend-engineer builds it in web/ from the approved specs, copy and prototype; then the design, SEO, GEO and QA reviews run with their fix loops (3-cycle limit), and the section is committed once everything passes.
disable-model-invocation: true
argument-hint: "<sección, por ejemplo hero>"
---

# /build

Section to build: **$ARGUMENTS**

`frontend-engineer` (Agent tool, `departamento-digital:frontend-engineer`) writes all code in `web/`; you brief it, verify, run the reviews and commit.

## 0. Preconditions
- No section name above: ask Xavier which one, listing the next sections of `trabajo/plan.md`.
- `trabajo/decisiones.md` must record approval 1 and the stack. If not, stop: there is no `/build` before approval 1 (point him to `/direccion`).
- The section must have its approved spec in the direction spec recorded as "Spec de dirección" in `decisiones.md` (normally `trabajo/specs/direccion.md`; this command calls it "the direction spec"), its copy in `trabajo/textos/` and, when it appears in the prototype, its reference in `trabajo/prototipos/`. If something is missing, get it from its owner (matrix in `CLAUDE.md`) before building.

## 1. Build
Brief `frontend-engineer` completely: "build the section <name>", the matching part of `trabajo/plan.md`, and the paths of `trabajo/decisiones.md`, the direction spec, `trabajo/specs/seo.md`, `trabajo/specs/geo.md`, the copy files for this section in every declared language, the prototype pages where it appears (reference to rebuild, not to port), any earlier report in `trabajo/reportes/` that touches this section, and "report prose in rioplatense Spanish".

Its report is not saved; act on it:
- `BLOCKED:` → resolve as `CLAUDE.md` says and call again.
- Verification must show a production build that passes. Items under "Not verified" or "Notes for review" go into the briefs of the reviews below.
- Run `git -C web status --short`: every changed path is inside `web/`, and none is a file forbidden in `web/` ("Two zones" in `CLAUDE.md`).

## 2. Reviews
Run the four reviews in this order, following their command files: `${CLAUDE_PLUGIN_ROOT}/skills/review-design/SKILL.md`, `${CLAUDE_PLUGIN_ROOT}/skills/review-seo/SKILL.md`, `${CLAUDE_PLUGIN_ROOT}/skills/review-geo/SKILL.md`, then `${CLAUDE_PLUGIN_ROOT}/skills/qa/SKILL.md`. Read each one with `Read` and do its steps 1 to 3 with this section as the scope. Do not call them with the Skill tool: they are reserved for Xavier's direct use, and running their steps is part of this command, which he invoked. Those files are read raw: wherever they show the plugin-root variable, the plugin root is `${CLAUDE_PLUGIN_ROOT}`. Taste and anti-AI paths for those briefs:
- taste: `${CLAUDE_PLUGIN_ROOT}/references/taste.md`
- English anti-AI list: `${CLAUDE_PLUGIN_ROOT}/skills/copywriting/references/ai-tells.md`
- Spanish anti-AI list: `${CLAUDE_PLUGIN_ROOT}/references/ai-tells-es.md`

Use one production build and one preview server for all four: start it once, pass the same URL to every review, and after each round of fixes rebuild and restart that same server instead of starting another (two servers on one port clash). Each review runs its own fix loop. Count cycles per threshold or finding in `trabajo/estado.md` ("cycle n of 3"); after cycle 3 still failing, stop and escalate to Xavier as "Retry limit" in `CLAUDE.md` says. If a fix from a later review touched what an earlier review approved, run that earlier review again; `/qa` always runs last, on the final code.

## 3. Commit
When all four pass on the same code:
1. Run `git -C web status --short` and check that every change belongs to this section or to the review fixes that just passed; anything unrelated, stop and find out where it came from before committing. Then stage all of those changes in `web/` and commit as "Commits in web/" in `CLAUDE.md` says (Xavier's identity, conventional English message such as `feat(hero): build hero section`, no attribution). If the hook rejects the message, fix the message.
2. Stop the servers you started.
3. Update `trabajo/estado.md`: section done, the reports that passed, the next section of the plan.
4. Tell Xavier in two or three lines, in Spanish: the section is built and passed design, SEO, GEO and QA (with the report paths), the open placeholders, and the next section. Never present a section that has not passed.
