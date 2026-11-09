---
name: investigar
description: Runs the research stage - the researcher collects design references, competitors, keywords and SERP, entities, quotable data and the mcp-geo question set per declared language and market; then geo-strategist runs the AI-visibility diagnosis. Everything is saved in trabajo/research/.
disable-model-invocation: true
argument-hint: "[competidores, referentes o foco que Xavier quiera sumar]"
---

# /investigar

Research stage of the workflow in `CLAUDE.md`. Two agents of this plugin, called with the Agent tool as `departamento-digital:researcher` and `departamento-digital:geo-strategist`. Extra input from Xavier, if any: $ARGUMENTS

## 1. Check before spending
- **Credentials first.** The MCP servers show as connected even without their keys and only fail when an agent calls them, so check the required variables before anything else. Run exactly this; it prints only `set` or `unset`, never a value (never print, echo or log a credential's value in any other way):
  ```
  node -e "for (const k of ['DATAFORSEO_LOGIN','DATAFORSEO_PASSWORD','BRAVE_API_KEY']) console.log(k + ': ' + (process.env[k] ? 'set' : 'unset'))"
  ```
  If any of the three is `unset`, stop before calling any agent and tell Xavier, in Spanish, something like: "No puedo arrancar la investigación: falta definir `<VARIABLE>` (la usa `<dataforseo | brave-search>`). Definila como variable de entorno de Windows (ver 'Variables de entorno' en el README del plugin), cerrá y volvé a abrir Claude Code, y corré `/investigar` de nuevo." Name every missing variable. Continue only if he explicitly asks to research without that tool, and record that choice in `decisiones.md`.
- `trabajo/decisiones.md` must declare the languages and, for Spanish, the variant. If not, ask Xavier first (see "Client material" in `CLAUDE.md`).
- Each declared language needs a **market** (country) for keywords, SERP and mcp-geo, for example Spanish → Argentina, English → United States. Take it from the brief or the brainstorming; if it is not stated, ask Xavier with your recommendation, because it changes every result. Record markets in `decisiones.md`, section "Idiomas", with the date.
- If `trabajo/research/` already holds findings, ask the agent only for what is missing or what Xavier asked to refresh.

## 2. researcher: collect
Brief every call completely: the task, the paths `brief.md`, `trabajo/decisiones.md` and `trabajo/brainstorming.md` (if present), each language with its market, any list from $ARGUMENTS or the brainstorming, and "prose in rioplatense Spanish". Split the work so no return gets cut off:
1. **References and competitors** (one call): design references with external recognition in the client's sector, and the competitors with positioning, offer, public pricing, proof and languages.
2. **Market data** (one call per declared language and market, in parallel with call 1): keywords and SERP with AI Overview presence and cited domains, entities around the topic, and quotable data from primary sources.
3. **mcp-geo question set** (after call 2 is saved, one call): about 20 questions per declared language that buyers would ask an AI assistant, derived from the saved keyword and SERP files (give their paths). Say explicitly that you are asking for the question set.

Tell it the exact `Suggested path:` for each call, so per-language returns never overwrite each other: `trabajo/research/referencias-competencia.md` (call 1), `trabajo/research/mercado-<lang>-<market>.md` (call 2, for example `mercado-es-ar.md`), `trabajo/research/preguntas-geo.md` (call 3). Save each return verbatim there (rules in `CLAUDE.md`, "Save deliverables verbatim"). If a table row has no source, send it back once asking for the source or the row's removal.

## 3. geo-strategist: AI-visibility diagnosis
Call it once per declared language and market. Give it `brief.md`, `trabajo/decisiones.md`, every file in `trabajo/research/` (including the question set) and the task: "run the AI-visibility diagnosis with mcp-geo for <language/market>, within the budget in your instructions (about 20 questions × 4 engines × 3 rounds), prose in rioplatense Spanish". Tell it the exact `Suggested path:`, `trabajo/research/geo-diagnosis-<lang>-<market>.md` (for example `geo-diagnosis-es-ar.md`), and save each return verbatim there.

## 4. Close
- Handle any `BLOCKED:` reply as `CLAUDE.md` says. A missing API key is Xavier's to supply: tell him which variable and which agent needs it, and continue with whatever the other tools can collect.
- Update `trabajo/estado.md`: stage done, next step `/direccion` (strategy specs, concept, copy and prototype).
- Tell Xavier in a few lines, in Spanish: what was collected per language, what could not be found, and the usage the agents reported (Brave searches, DataForSEO calls, mcp-geo runs), so he sees the real cost. Point to the files in `trabajo/research/` instead of repeating them.
