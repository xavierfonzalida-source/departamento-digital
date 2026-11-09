---
name: nuevo-cliente
description: Starts a new client project in the current folder - checks the plugin is enabled for this folder, scaffolds CLAUDE.md, trabajo/ and the web/ git repository from brief.md, confirms the site's languages and Spanish variant, and opens the brainstorming with Xavier.
disable-model-invocation: true
---

# /nuevo-cliente

Xavier runs this once, in a new client folder that already holds his `brief.md`. You end the command inside `superpowers:brainstorming` with him. Speak to Xavier in rioplatense Spanish.

The client folder is the current working directory. Whenever a step needs its absolute path, use the Windows form (`C:/Users/...`). In Git Bash get it with `pwd -W`; never pass a `/c/Users/...` path to Node, which misreads it on Windows.

## 1. Plugin enabled for this folder only
Read `.claude/settings.json` and `.claude/settings.local.json` in the client folder. The plugin is enabled for this folder when `enabledPlugins` has `"departamento-digital@departamento-digital": true`.

If it is not there, the plugin is loaded some other way (user scope or `--plugin-dir`), so its MCP servers, hooks and dependencies would run in Xavier's other projects too. Stop and tell him, in Spanish, that the studio is installed per client folder, and give him these commands to run in a terminal opened in this folder, in this order, before starting a new session here:

```
claude plugin marketplace add xavierfonzalida-source/departamento-digital --scope project
claude plugin marketplace add pbakaus/impeccable --scope project
claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill --scope project
claude plugin marketplace add AgriciDaniel/claude-seo --scope project
claude plugin install departamento-digital@departamento-digital --scope project
```

Continue only when he says he ran them (check the settings again) or explicitly tells you to go on without them; record that choice in step 4.

## 2. Scaffold
1. If `brief.md` does not exist, stop: ask Xavier for the brief. If he dictates it, you may write `brief.md` from his words (never invent offer, audience, prices or proof; missing facts become `[PLACEHOLDER: …]`), and read it back to him before going on.
2. Run, with the client folder's absolute path:
   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/nuevo-cliente.mjs" "<client folder>"
   ```
3. Exit 0: it prints the created files (`CLAUDE.md`, `trabajo/` with `decisiones.md`, `estado.md` and five folders, `web/` with its own git repository and `commit-msg` hook, `.gitignore`, `.claude/settings.json`). Check that they exist.
4. Exit 1 prints `Error: …` and changes nothing:
   - "A project already exists here": do not delete or overwrite anything. Tell Xavier the project already exists and offer to resume from `trabajo/estado.md`.
   - "brief.md not found": back to step 2.1.
   - "not valid JSON": show him the file and the parse error; fix it only with his OK.
5. Run `git -C web config user.name` and `git -C web config user.email`. If either is empty, ask Xavier for the identity his commits in `web/` must use and set it with `git -C web config`.

## 3. Load the studio manual
`CLAUDE.md` was created during this session, so it is not in your context yet. Read it in full now and follow it from here on: it is the manual for every later step and command. The new `.claude/settings.json` (no automatic AI attribution, impeccable's live copy agent) applies from the next session; until then the "Commits in web/" rules and the `commit-msg` hook cover attribution.

## 4. Languages
Read `brief.md`. It must declare the site's languages (Spanish, English or both) and, when Spanish is one of them, the variant (rioplatense or neutral).
- If either is missing or ambiguous, ask Xavier before anything else, with the options and your recommendation based on the brief's audience, so he answers in one line. Do not continue until he answers.
- Record the answer in `trabajo/decisiones.md`, section "Idiomas", with today's date and the source ("brief.md" or "Xavier, en esta sesión"). Record the step 1 choice there too if he went on without the project install.

## 5. Brainstorming
1. Update `trabajo/estado.md`: stage "Brainstorming", next step "/investigar".
2. Tell Xavier in two or three lines what was created and that you start the brainstorming on his brief.
3. Invoke `superpowers:brainstorming` with the Skill tool, on the brief. Explore with him the goals, audience, offer, page list and scope, references he likes, constraints and the conversion goal. Do not settle visual design, stack or final copy there: the specialists propose them at `/direccion`.
4. Two of that skill's steps change in this studio:
   - Save the resulting design document to `trabajo/brainstorming.md`, not to `docs/superpowers/specs/`, and do not commit it.
   - When it ends, do not invoke `writing-plans`: the plan comes after approval 1. The next step is `/investigar`.
5. Record every decision Xavier makes during the brainstorming in `trabajo/decisiones.md` as he makes it, and update `trabajo/estado.md` when it ends.
