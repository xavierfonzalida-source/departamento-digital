---
name: entregar
description: Delivers the site, only after Xavier's certification - runs the delivery script, which blocks on AI traces in web/ files or git history and on unfilled placeholders, and otherwise tags the commit and writes a zip in entrega/; shows every finding as reported and offers a clean-history branch only with Xavier's explicit OK.
disable-model-invocation: true
---

# /entregar

The delivery gate is a fixed script, not an agent. You run it, show its output and handle its results. Never delete, rename or edit a file yourself to make the scan pass, and never delete a branch, tag or zip.

The client folder is the current working directory; pass its absolute path in Windows form (`C:/Users/...`; in Git Bash, `pwd -W`), never a `/c/Users/...` path.

## 1. Certification first
- Read `trabajo/decisiones.md`. Delivery needs Xavier's certification recorded there, covering the current `web/` commit (`git -C web rev-parse --short HEAD`).
- If it is not recorded, or `web/` has commits after the certified one, ask him in this conversation, in Spanish, whether he certifies the result as it is now (name the commit and the latest `qa` report). Only an explicit yes counts. Record it with today's date and the commit. Without it, stop: do not run the script.

## 2. Run the script
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<client folder>"
```
Show Xavier the whole output verbatim in a code block, warnings included, before you interpret it. Line formats:
- `path:line  pattern` is a finding in a current file;
- a trailing `[commit abc1234]` marks an AI trace in the git history;
- `warning  …` is a code comment that mentions AI: it does not block, but Xavier must see it.

## 3. Results
- **Exit 0.** It printed the zip path (`entrega/<folder>-<date>.zip`) and created the tag `entrega-<date>` in `web/`. Check the zip exists, record the delivery in `decisiones.md` and `estado.md`, and tell Xavier the zip path and the tag. Push nothing.
- **`… blocking finding(s) (AI traces or placeholders). Nothing was packaged.`** Sort the lines:
  - `[PLACEHOLDER:` in a file: not an AI trace, but content Xavier still has to supply (a testimonial, a price, a logo). List each one with its page; once he gives the facts, route them to `brand-copywriter` and `awwwards-frontend`. Placeholders are checked only in current files, never in the history.
  - Any other file finding: judge it with Xavier, real trace or false positive (a client word such as "Copilot" in a product name).
    - Real trace, or a file forbidden in `web/`: fix list to `awwwards-frontend`, `/qa` on the change, commit as "Commits in web/" in `CLAUDE.md` says, and run the script again.
    - False positive: the scan has no allowlist, so it keeps blocking while the string is there. Give him the options (reword it through `brand-copywriter`, or leave delivery blocked) and let him decide.
  - Lines with `[commit …]`: see step 4, after the file findings are fixed.
- **`Error: web/ has uncommitted changes to tracked files…`**: show him the listed files. If those changes passed their reviews, you may commit them per "Commits in web/"; discarding them is irreversible, so only with his explicit OK. Then run the script again.
- **`Error: Tag entrega-<date> already exists (or its zip does)…`**: a delivery with today's date already exists. Tell him; he decides what to do with it.

## 4. Traces in the git history
Explain it to Xavier in plain Spanish: the files are clean today, but old commits, which travel with the repository, still contain the string; whoever receives the repository could read them.

The fix is a new branch with one commit holding the current files and no past; the existing branches stay as they are, so nothing is lost. The delivery then tags and zips that branch only, and the history scan checks only that branch. Before asking, make sure the file findings are fixed and committed (the new branch copies the current commit), then show him the exact commands you will run and ask for his explicit OK in this conversation:
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<client folder>" --clean-history --confirm
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<client folder>" --ref clean-<YYYY-MM-DD>
```
Run them only after his yes, the second with the branch name the first one prints (`Created orphan branch clean-<date> …`). Show both outputs verbatim and handle the second like step 3.
- **`Error: Branch clean-<date> already exists…`**: a clean branch from today exists. If it holds the current files, deliver it with the second command; otherwise tell Xavier and let him decide.
- **`Error: Ref … does not hold the same files as the checked-out commit…`**: `web/` changed after the clean branch was made. Tell Xavier; a new clean branch is needed (tomorrow's date, or he decides what to do with today's).
