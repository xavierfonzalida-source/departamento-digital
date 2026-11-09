---
name: entregar
description: Delivers the site, only after Xavier's certification - runs the delivery script, which blocks on any AI trace in web/ files or git history and otherwise tags the commit and writes a zip in entrega/; shows every finding as reported and offers a clean-history branch only with Xavier's explicit OK.
disable-model-invocation: true
---

# /entregar

The delivery gate is a fixed script, not an agent. You run it, show its output and handle its results. Never delete, rename or edit a file yourself to make the scan pass.

The client folder is the current working directory; pass its absolute path in Windows form (`C:/Users/...`; in Git Bash, `pwd -W`), never a `/c/Users/...` path.

## 1. Certification first
- Read `trabajo/decisiones.md`. Delivery needs Xavier's certification recorded there, covering the current `web/` commit (`git -C web rev-parse --short HEAD`).
- If it is not recorded, or `web/` has commits after the certified one, ask him in this conversation, in Spanish, whether he certifies the result as it is now (name the commit and the latest `qa` report). Only an explicit yes counts. Record it with today's date and the commit. Without it, stop: do not run the script.

## 2. Run the script
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<client folder>"
```
Show Xavier the whole output verbatim in a code block, warnings included, before you interpret it. Line formats: `path:line  pattern` is a file finding; a trailing `[commit abc1234]` marks a finding in the git history; `warning  …` is a comment that mentions AI and does not block, but Xavier must see it.

## 3. Results
- **Exit 0.** It printed the zip path (`entrega/<folder>-<date>.zip`) and created the tag `entrega-<date>` in `web/`. Check the zip exists, record the delivery in `decisiones.md` and `estado.md`, and tell Xavier the zip path and the tag. Push nothing.
- **File findings** (`AI trace(s) found. Nothing was packaged.`). For each one, judge with Xavier whether it is a real trace or a false positive (a client word such as "Copilot" in a product name):
  - A real trace, or a file forbidden in `web/`: fix list to `awwwards-frontend`, then `/qa` on the change, commit as "Commits in web/" in `CLAUDE.md` says, and run the script again.
  - `[PLACEHOLDER:`: content is not finished. List those placeholders; only Xavier can supply the facts. Route them to `brand-copywriter` and `awwwards-frontend` once he does.
  - A false positive: the scan has no allowlist, so it keeps blocking while the string is there. Give Xavier the options (reword it through `brand-copywriter`, or leave delivery blocked) and let him decide.
- **`DirtyTreeError`** (uncommitted changes in tracked files of `web/`): show him the list. If those changes passed their reviews, you may commit them per "Commits in web/"; discarding them is irreversible, so only with his explicit OK. Then run the script again.
- **`TagExistsError`**: a delivery with today's tag already exists. Tell him; never delete a tag or a zip yourself.

## 4. Traces in the git history
Explain it to Xavier in plain Spanish: the files are clean today, but old commits, which travel with the repository, still contain the string; whoever receives the repository could read them.

The fix is a new branch with one commit holding the current state, and no past. Offer it, and run it **only after his explicit OK in this conversation**, once the file findings above are fixed and committed (the new branch copies the current commit):
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<client folder>" --clean-history --confirm
```
It creates `clean-<date>` and does not touch the existing branches. The scan reads every branch and tag, so the old ones still block the delivery: tell him that, and that replacing them (switch `web/` to the clean branch, delete the old branches and tags that hold traces, rename the clean branch to `main`) destroys the old history for good. Do it only with a second explicit OK for exactly those commands, show what you ran, and then run the delivery script again.
