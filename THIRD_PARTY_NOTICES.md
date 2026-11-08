# Third-party notices

This plugin vendors the third-party material below. Each vendored skill folder under `skills/` keeps the upstream `LICENSE` file (all four upstream licenses are MIT, and sit at the repository root upstream, so the root file was copied into each skill folder). Copied on 2026-11-08 from the exact commit listed.

## Summary

| Local path | Upstream repository | Commit SHA copied | License | Modified |
|---|---|---|---|---|
| `skills/emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `choreograph`, `animation-performance`, `animation-vocabulary`, `break-ui` | github.com/emilkowalski/skills (`skills/<name>/`) | 5206a950b715e0cabe7043ea0b2304332b91494e | MIT, (c) 2026 Emil Kowalski | No |
| `skills/geo-citability`, `geo-llmstxt` | github.com/zubair-trabzada/geo-seo-claude (`skills/<name>/`) | 989cae01e8ebbc42a9ec798eb9e7cb423f5ec89c | MIT, (c) 2026 Zubair Trabzada | No |
| `skills/geo-crawlers` (+ `scripts/fetch_page.py`, `requirements.txt`) | github.com/zubair-trabzada/geo-seo-claude (`skills/geo-crawlers/`, `scripts/fetch_page.py`, `requirements.txt`) | 989cae01e8ebbc42a9ec798eb9e7cb423f5ec89c | MIT, (c) 2026 Zubair Trabzada | Yes (see below) |
| `skills/copywriting`, `copy-editing`, `cro` | github.com/coreyhaines31/marketingskills (`skills/<name>/`) | 96798cf38736ecdba015a1d2b0521b0c8f8f41dd | MIT, (c) 2025 Corey Haines | No |
| `references/taste.md` | github.com/leonxlnx/taste-skill (`skills/taste-skill/SKILL.md`) | f6b76575f949707b4e3c37cd86cb44b0b98643e8 | MIT, (c) 2026 Leonxlnx | Yes (frontmatter and hook removed, header added) |

`references/ai-tells-es.md` is original work of this plugin (a Spanish counterpart of `skills/copywriting/references/ai-tells.md`) and is not third-party.

## Modifications to upstream files

- `skills/geo-crawlers/SKILL.md`: one line changed, `` `fetch_page.py robots` `` became `` `scripts/fetch_page.py robots` `` so the path matches where the script lives inside the skill folder.
- `skills/geo-crawlers/requirements.txt`: upstream `requirements.txt` trimmed to the three packages `fetch_page.py` imports (`beautifulsoup4`, `requests`, `lxml`, same version pins). Upstream also lists playwright, Pillow, urllib3, validators, flask and rich, which belong to other scripts that are not vendored.
- `skills/geo-crawlers/scripts/fetch_page.py`: copied byte for byte.
- `references/taste.md`: the YAML frontmatter (name, description and the `Stop` hook that runs `gate.mjs`) was removed and an HTML comment header added. The body is unmodified.

## Security review (done on the copied commits)

All markdown was read for risky patterns (external connections, command execution, credential use, hooks, telemetry); the three `geo-*` SKILL.md files and `fetch_page.py` were read in full, plus the `taste-skill` frontmatter and its command references. No hooks in any vendored `SKILL.md`. No credentials or telemetry anywhere.

| Skill | Findings |
|---|---|
| emil-design-eng, animate, review-animations, improve-animations, find-animation-opportunities, choreograph, animation-performance, animation-vocabulary, break-ui | Instructions only (markdown). No scripts, no hooks, no `allowed-tools`. Only external URLs are reference links (easing.dev, easings.co, sonner site). `review-animations` sets `disable-model-invocation: true` (the model cannot auto-invoke it; the user or an explicit load must). `improve-animations` writes only under `plans/` and may dispatch read-only subagents or an executor subagent when the user asks (`execute <plan>`); `animate`/`break-ui` edit project code only when asked. |
| geo-citability, geo-llmstxt | Instructions only. Frontmatter declares `allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write`, broader than needed (Bash is not used by the text; they fetch with WebFetch and write `GEO-*.md` reports). No hooks. |
| geo-crawlers | Same `allowed-tools`. Mentions `scripts/fetch_page.py robots` once. |
| `fetch_page.py` (geo-crawlers) | Read in full (506 lines). Only outbound calls are HTTP GETs via `requests` to the URL given by the user plus `/robots.txt`, `/llms.txt`, `/llms-full.txt`, `/sitemap.xml` and child sitemaps on that host. No command execution, no file writes, no credentials, no telemetry, no `eval`. Caveats: it follows redirects and child-sitemap `<loc>` URLs without SSRF protection (could be pointed at internal addresses by a hostile target site), and sends a desktop browser User-Agent. Use only on public sites being analysed. Prints JSON to stdout. |
| copywriting, copy-editing, cro | Text only (SKILL.md, references, `evals/evals.json`). `metadata.version` frontmatter only. They read an optional `.agents/product-marketing.md` / `.claude/product-marketing.md` from the user project. Reference links to GitHub and academic sources, no calls. |
| taste-skill (`references/taste.md`) | Upstream frontmatter declares a `Stop` hook that runs `node .../scripts/gate.mjs` (up to 600 s) after every response, plus a fallback that writes `.taste-skill/gate-hook-missing.txt`. **Removed on purpose**; nothing of it is installed. The body tells the reader to run `node <skill>/scripts/*.mjs` helpers and needs Node 22+ and Chrome; those scripts and the `assets/` folder are not vendored, so the text is consultation only. Upstream scripts were not reviewed and are not shipped. |
