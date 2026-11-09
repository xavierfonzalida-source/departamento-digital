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
- **Exit 0.** It printed the zip path (`entrega/<folder>-<date>.zip`) and `Created tag entrega-<date> in web/.`. A second delivery on the same day gets a suffix on both (`entrega-<date>-2`, then `-3`…) and the earlier tag and zip stay as they were. Use the names exactly as printed: check the zip exists, record the delivery in `decisiones.md` and `estado.md`, and tell Xavier the zip path and the tag. Push nothing.
- **`… blocking finding(s) (AI traces or placeholders). Nothing was packaged.`** Sort the lines:
  - `[PLACEHOLDER:` in a file: not an AI trace, but content Xavier still has to supply (a testimonial, a price, a logo). List each one with its page; once he gives the facts, route them to `brand-copywriter` and `awwwards-frontend`. Placeholders are checked only in current files, never in the history.
  - Any other file finding: judge it with Xavier, real trace or false positive (a client word such as "Copilot" in a product name).
    - Real trace, or a file forbidden in `web/`: fix list to `awwwards-frontend`, `/qa` on the change, commit as "Commits in web/" in `CLAUDE.md` says, and run the script again.
    - False positive: the scan has no allowlist, so it keeps blocking while the string is there. Give him the options (reword it through `brand-copywriter`, or leave delivery blocked) and let him decide. Crawler names in the `User-agent:` lines of a `robots.txt` (`ClaudeBot`, `anthropic-ai`, `ChatGPT-User`…) are already exempt and never appear as findings; never suggest rewording or removing them, because the GEO spec requires them. A finding on any other line of `robots.txt` (a comment, for example) is handled like any file finding.
  - `image-metadata` with `c2pa`: Content Credentials, which real cameras, phones and editing tools also write, so it does not prove the image is AI-made. The fix is the same either way: `awwwards-frontend` re-exports the image without metadata, or strips the metadata from the file, keeping the same image and path. Never delete the image. Other image markers (`DALL-E`, `Midjourney`…) follow the same fix after Xavier judges them.
  - Lines with `[commit …]`: see step 4, after the file findings are fixed.
- **`Error: web/ has uncommitted changes to tracked files…`**: show him the listed files. If those changes passed their reviews, you may commit them per "Commits in web/"; discarding them is irreversible, so only with his explicit OK. Then run the script again.

## 4. Traces in the git history
Explain it to Xavier in plain Spanish: the files are clean today, but old commits, which travel with the repository, still contain the string; whoever receives the repository could read them.

The fix is a new branch with one commit holding the current files and no past; the existing branches stay as they are, so nothing is lost. The delivery then tags and zips that branch only, and the history scan checks only that branch. Before asking, make sure the file findings are fixed and committed (the new branch copies the current commit), then show him the exact commands you will run and ask for his explicit OK in this conversation:
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<client folder>" --clean-history --confirm
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<client folder>" --ref <branch printed by the first command>
```
Run them only after his yes, the second with the exact branch name the first one prints (`Created orphan branch clean-<date> …`, or `clean-<date>-2`, `-3`… when a clean branch from today already exists; the earlier ones stay untouched). Show both outputs verbatim and handle the second like step 3.
- **`Error: Ref … does not hold the same files as the checked-out commit…`**: `web/` changed after the clean branch was made. Tell Xavier and, with his OK, run the first command again: it creates a new clean branch with the next suffix from the current files; deliver that one.
