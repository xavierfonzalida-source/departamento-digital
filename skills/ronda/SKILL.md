---
name: ronda
description: Runs a round of Xavier's changes - splits his comments into items, routes each one to the agent that owns it (copy, design, SEO, GEO or code), applies them through awwwards-frontend, reruns the reviews and QA, and presents the result for his next comments or his certification.
disable-model-invocation: true
argument-hint: "<comentarios de Xavier>"
---

# /ronda

Xavier's comments: $ARGUMENTS

If that is empty, take the comments from his latest messages. Agents are this plugin's, called with the Agent tool as `departamento-digital:<name>`.

Plugin files to pass as absolute paths:
- taste: `${CLAUDE_PLUGIN_ROOT}/references/taste.md`
- English anti-AI list: `${CLAUDE_PLUGIN_ROOT}/skills/copywriting/references/ai-tells.md`
- Spanish anti-AI list: `${CLAUDE_PLUGIN_ROOT}/references/ai-tells-es.md`

## 1. Understand
1. Split the comments into single items: page and section, language, what he wants.
2. If an item is ambiguous (which page, which text, what result), ask him once, all doubts together, with your reading of each so he can answer in one line.
3. If an item conflicts with the approved direction, a spec or a quality threshold (for example an animation that cannot hold 60 fps), tell him the trade-off with the options and your recommendation before acting on it.
4. Record in `trabajo/decisiones.md`, with today's date, every item that changes a decision (under "Cambios de rumbo") and every fact he supplies (a real testimonial, a price, a client logo).
5. Save the round to `trabajo/reportes/ronda-<YYYY-MM-DD>-r<n>.md`, where `<n>` is the number of round files already in `trabajo/reportes/` plus one, so a second round never overwrites the first: each item, its owner and its status. Use `ronda-r<n>` as the section slug in the review report names of step 3.

## 2. Route
Owner per the delegation matrix in `CLAUDE.md`:

| Item | Goes to | Then |
|---|---|---|
| Wording, tone, a real fact replacing a placeholder | `brand-copywriter` (current copy, the comment, both anti-AI paths) | new copy saved to `trabajo/textos/` |
| Look, layout, motion, imagery | `creative-director` (spec, taste path, the comment) | spec update saved to `trabajo/specs/` |
| Pages, URLs, metadata rules, Schema | `seo-strategist` | spec update saved |
| Entities, citable passages, `llms.txt`, AI crawlers | `geo-strategist` | spec update saved |
| A bug or a change that needs no spec decision | `awwwards-frontend` directly | |

Order: spec updates first, then copy, then code. When specs and copy are saved, give `awwwards-frontend` one fix list with every item and the paths of the updated files. Brief every call completely and save every return verbatim, as `CLAUDE.md` says.

## 3. Reviews
Run the reviews exactly as step 2 of `/build` describes, from its command file `${CLAUDE_PLUGIN_ROOT}/skills/build/SKILL.md` (read raw with `Read`, never through the Skill tool; wherever it shows the plugin-root variable, the plugin root is `${CLAUDE_PLUGIN_ROOT}`), with this round's changes as the scope, the same 3-cycle limit and `/qa` last. Then commit as its step 3 says, with a message such as `fix: apply review round changes`.

## 4. Present
Only after `qa` passes. Tell Xavier, in Spanish and briefly:
- per comment, what changed and where to see it (the preview URL, kept running);
- anything you did not do and why;
- the open placeholders;
- the question: more changes, or does he **certify** the result for delivery?

If he certifies, record the certification in `trabajo/decisiones.md` with today's date and the `web/` commit it covers (`git -C web rev-parse --short HEAD`), update `trabajo/estado.md`, and tell him the next step is `/entregar`. If he sends more comments, start a new round.
