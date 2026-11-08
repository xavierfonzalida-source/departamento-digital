# Plugin `departamento-digital` — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el plugin de Claude Code `departamento-digital`: un `CLAUDE.md` de plantilla, 7 agentes, 10 comandos, skills de terceros, 7 MCP y dos scripts (alta de cliente y entrega sin rastros de IA), según el spec aprobado.

**Architecture:** El plugin es mayormente texto: prompts de agentes y skills, más configuración en `plugin.json` y `.mcp.json`. La lógica determinista vive en dos scripts Node (`scripts/nuevo-cliente.mjs` y `scripts/entregar.mjs`) con tests `node:test`. Las reglas estructurales (qué agente tiene qué herramientas, que no haya secretos, licencias de terceros) se fijan con tests que leen los archivos del plugin.

**Tech Stack:** Node ≥ 22.13 (ESM, `node:test`, sin dependencias npm salvo `yaml` para leer frontmatter), Git, Claude Code plugins (manifest, skills, agents, `.mcp.json`).

**Spec:** `docs/superpowers/specs/2026-11-08-departamento-digital-design.md`. Leelo completo antes de empezar: este plan cita sus secciones con §.

## Global Constraints

- Nombre del plugin: `departamento-digital`. Repositorio: `github.com/xavierfonzalida-source/departamento-digital` (privado).
- Archivos del plugin (agentes, skills propias, plantillas, scripts, tests) **en inglés**. `README.md` y documentos de `docs/` en **español rioplatense**.
- Ningún agente especialista tiene la herramienta `Agent`. Solo `awwwards-frontend` tiene `Write` o `Edit`. Ninguno tiene `NotebookEdit`.
- Modelos: `opus` para creative-director, brand-copywriter, seo-strategist, geo-strategist y qa; `sonnet` para awwwards-frontend; `haiku` para researcher.
- Credenciales: **nunca** como literales en ningún archivo. Siempre `${VAR}` en `.mcp.json`.
- Todo lo copiado de terceros conserva su `LICENSE` y figura en `THIRD_PARTY_NOTICES.md`, con repositorio, commit SHA copiado y licencia.
- taste-skill entra solo como `references/taste.md`, **sin frontmatter ni hook**.
- impeccable: `IMPECCABLE_LIVE_COPY_AGENT=chat` en el `settings.json` que escribe `/nuevo-cliente`.
- Patrones de rastro de IA en la entrega (sin distinguir mayúsculas): `Claude`, `Anthropic`, `Co-Authored-By`, `Generated with`, `AI-generated`, `ChatGPT`, `copilot`.
- Archivos prohibidos en `web/` al entregar: `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.mcp.json`, `docs/superpowers/`, `trabajo/`.
- Umbrales de calidad (§5): LCP < 2,5 s; INP < 200 ms; CLS 0,00; Lighthouse ≥ 95 en las 4 categorías; WCAG 2.2 AA; 60 fps con CPU ×4; máximo 3 ciclos automáticos por umbral antes de escalar a Xavier.
- Los scripts funcionan en Windows (Git Bash y PowerShell) con rutas que contienen espacios y acentos.
- Commits del repositorio del plugin: mensajes en inglés, estilo convencional.

## Review Focus

1. **Rutas con espacios y acentos** (`C:\Users\xavie\Desktop\Departamento Digital\Cliente Ñandú`): los scripts tienen que funcionar igual. Lo cubren el Task 6 (`creates structure in a path with spaces and accents`) y el Task 7 (`scans a web repo in a path with spaces`).
2. **`/nuevo-cliente` sobre una carpeta ya inicializada** (ya tiene `CLAUDE.md` o `web/`): tiene que abortar sin sobrescribir nada. Lo cubre el Task 6 (`refuses to overwrite an existing project`).
3. **Falta una variable de entorno de un MCP:** el `README` tiene que documentar cada variable que usa `.mcp.json`, para que el error se entienda. Lo cubre el Task 3 (`README documents every env var used in .mcp.json`).
4. **Falsos positivos en la entrega:** un texto del cliente que dice "IA", o un producto llamado "Copilot", se muestran como advertencia con `ruta:línea`, sin borrar nada. Lo cubre el Task 7 (`reports comment mentions of AI as warnings, not failures`).
5. **Rastros en ramas distintas de `main` o en commits viejos:** el escaneo recorre todo el historial (`--all`). Lo cubre el Task 7 (`detects a trace in an older commit on another branch`).

---

## Estructura de archivos

```
departamento-digital/
├── .claude-plugin/plugin.json          Task 1 (deps en Task 2)
├── .claude-plugin/marketplace.json     Task 1
├── package.json                        Task 1  (scripts: test)
├── LICENSE                             Task 1  (MIT, © Xavier Fonzalida)
├── README.md                           Task 1, ampliado en Tasks 3 y 9
├── docs/platform-notes.md              Task 2  (hechos verificados de Claude Code)
├── tests/platform.mjs                  Task 2  (constantes verificadas)
├── tests/helpers/frontmatter.mjs       Task 1
├── tests/structure.test.mjs            Task 1
├── tests/mcp.test.mjs                  Task 3
├── tests/third-party.test.mjs          Task 4
├── tests/agents.test.mjs               Task 5
├── tests/nuevo-cliente.test.mjs        Task 6
├── tests/entregar.test.mjs             Task 7
├── tests/commands.test.mjs             Task 8
├── .mcp.json                           Task 3
├── skills/<vendored>/                  Task 4
├── references/taste.md                 Task 4
├── references/ai-tells-es.md           Task 4
├── THIRD_PARTY_NOTICES.md              Task 4
├── agents/*.md (7)                     Task 5
├── templates/CLAUDE.md                 Task 6
├── templates/trabajo/{decisiones,estado}.md   Task 6
├── templates/settings.json             Task 6
├── templates/commit-msg                Task 6
├── scripts/nuevo-cliente.mjs           Task 6
├── scripts/entregar.mjs                Task 7
├── skills/<comandos> (10)              Task 8
└── tests/fixtures/brief-prueba.md      Task 9
```

---

### Task 1: Esqueleto del plugin y arnés de tests

**Files:**
- Create: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json`, `LICENSE`, `README.md`, `.gitignore`, `tests/helpers/frontmatter.mjs`, `tests/structure.test.mjs`

**Interfaces:**
- Produces: `parseFrontmatter(filePath: string) -> { data: object, body: string }` en `tests/helpers/frontmatter.mjs` (usa el paquete `yaml`); `npm test` corre `node --test tests/`.

- [ ] **Step 1: Write the failing test** `tests/structure.test.mjs`

```js
test('plugin.json has required identity', () => {
  const p = JSON.parse(read('.claude-plugin/plugin.json'));
  assert.equal(p.name, 'departamento-digital');
  assert.match(p.version, /^\d+\.\d+\.\d+$/);
  assert.equal(p.license, 'MIT');
});
test('marketplace.json lists the plugin from this repo', () => {
  const m = JSON.parse(read('.claude-plugin/marketplace.json'));
  assert.ok(m.plugins.some(x => x.name === 'departamento-digital'));
});
test('no CLAUDE.md at plugin root (it would not load)', () => {
  assert.equal(existsSync('CLAUDE.md'), false);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL (archivos inexistentes).
- [ ] **Step 3: Create the files.** `plugin.json` con `name`, `version: "0.1.0"`, `description`, `author: {"name": "Xavier Fonzalida"}`, `license: "MIT"` y `repository`. `marketplace.json` según el formato de la documentación oficial, con `source: "./"`. `package.json` con `"type": "module"`, `engines.node ">=22.13"`, devDependency `yaml` y `"test": "node --test tests/"`. `README.md` con el título y una sección "Instalación" vacía. `.gitignore` con `node_modules/`.
- [ ] **Step 4: Run** `npm install && npm test`. Expected: PASS. Después correr `claude plugin validate .`. Expected: sin errores.
- [ ] **Step 5: Commit** `chore: scaffold plugin manifest, marketplace and test harness`.

---

### Task 2: Verificar hechos de la plataforma (spike con resultado escrito)

Spec §3 y §12.1. Antes de escribir agentes y configuración, hay que confirmar con pruebas reales cuatro hechos que el spec deja abiertos. **No se escribe código del plugin en esta tarea.** El resultado son `docs/platform-notes.md` y `tests/platform.mjs`.

**Files:**
- Create: `docs/platform-notes.md` (español), `tests/platform.mjs`
- Modify: `.claude-plugin/plugin.json` (agregar `dependencies`)

**Interfaces:**
- Produces: en `tests/platform.mjs`:
  - `MCP_TOOL_PREFIX: string`, por ejemplo `'mcp__plugin_departamento-digital_'`, de modo que las herramientas sean `${MCP_TOOL_PREFIX}<server>__*`
  - `EXTERNAL_SKILL_REF: (plugin: string, skill: string) => string | null`: el formato que acepta el campo `skills` para skills de otros plugins, o `null` si no se puede precargar
  - `ATTRIBUTION_SETTING: object`: el fragmento de `settings.json` que desactiva la atribución de commits y PRs
  - `PROJECT_SCOPE_INSTALL: string`: el comando verificado de instalación por proyecto

- [ ] **Step 1: Prefijo de herramientas MCP de plugin.** Agregar a `.mcp.json` un servidor de prueba sin credenciales (`context7`), instalar el plugin local (`/plugin marketplace add ./` + install con `--scope project` en una carpeta temporal) y leer en `/mcp` o `/agents` el nombre real de las herramientas. Anotarlo.
- [ ] **Step 2: Skills de otros plugins en el campo `skills`.** Crear un agente de prueba con `skills: [superpowers:brainstorming]`, invocarlo y verificar si recibió el contenido precargado. Si no funciona, `EXTERNAL_SKILL_REF` devuelve `null`, y los agentes listan esas skills en su cuerpo y las invocan con la herramienta `Skill`.
- [ ] **Step 3: Dependencias y alcance de proyecto.** Agregar a `plugin.json` las `dependencies`: superpowers (`claude-plugins-official`), impeccable (`pbakaus/impeccable`), ui-ux-pro-max (`nextlevelbuilder/ui-ux-pro-max-skill`) y claude-seo (`AgriciDaniel/claude-seo`), con el formato documentado. Instalar con `--scope project` en una carpeta temporal y verificar que las dependencias **no** queden activas en otra carpeta. Si quedan activas en todos lados, documentar la alternativa (`enabledPlugins` en `.claude/settings.json` del proyecto) y usarla en `PROJECT_SCOPE_INSTALL`.
- [ ] **Step 4: Configuración de atribución.** Confirmar en la documentación oficial de settings el nombre actual de la clave que desactiva `Co-Authored-By` y "Generated with" en commits y PRs, y anotarla en `ATTRIBUTION_SETTING`.
- [ ] **Step 5: Escribir** `docs/platform-notes.md` con cada hecho, la evidencia (comando + salida resumida) y la fecha, y `tests/platform.mjs` con las constantes. Borrar el agente y la carpeta de prueba.
- [ ] **Step 6: Commit** `docs: record verified Claude Code platform facts`.

---

### Task 3: Configuración de MCP (`.mcp.json`) y documentación de credenciales

Spec §7.2.

**Files:**
- Create/Modify: `.mcp.json`, `README.md` (sección "Variables de entorno"), `tests/mcp.test.mjs`

**Interfaces:**
- Consumes: `MCP_TOOL_PREFIX` (Task 2).
- Produces: nombres de servidor exactos, usados por los agentes del Task 5: `context7`, `chrome-devtools`, `playwright`, `dataforseo`, `brave-search`, `wikidata`, `mcp-geo`.

- [ ] **Step 1: Write the failing test** `tests/mcp.test.mjs`

```js
const SERVERS = ['context7','chrome-devtools','playwright','dataforseo','brave-search','wikidata','mcp-geo'];
test('declares exactly the seven servers', () => {
  assert.deepEqual(Object.keys(mcp().mcpServers).sort(), [...SERVERS].sort());
});
test('wikidata is remote at the WMDE endpoint', () => {
  assert.equal(mcp().mcpServers.wikidata.url, 'https://wd-mcp.wmcloud.org/mcp');
});
test('no literal secrets: every env value is a ${VAR} reference', () => {
  for (const s of Object.values(mcp().mcpServers))
    for (const v of Object.values(s.env ?? {})) assert.match(v, /^\$\{[A-Z0-9_]+\}$/);
});
test('README documents every env var used in .mcp.json', () => {
  for (const name of envVarsIn(mcp())) assert.ok(read('README.md').includes(name), name);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Write `.mcp.json`.** Usar el paquete y el transporte de la documentación oficial de cada servidor, verificados en el momento:
  - `chrome-devtools-mcp`
  - `@playwright/mcp`
  - el servidor oficial de DataForSEO
  - `brave/brave-search-mcp-server`
  - `@digestseo/mcp-geo`, con sus claves opcionales por motor
  - wikidata y context7 remotos por HTTP

  En `README.md`, una tabla con cada variable, para qué sirve, si es obligatoria y dónde se obtiene. Incluir el costo estimado de §7.3, citando la fuente.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Después, en una carpeta de prueba con el plugin instalado, `/mcp`. Expected: los 7 servidores aparecen; los que no tienen credenciales muestran un error de autenticación, no de sintaxis.
- [ ] **Step 5: Commit** `feat: declare MCP servers with env-based credentials`.

---

### Task 4: Skills de terceros, referencias y avisos de licencia

Spec §7.1 y §5.1. Copiar **solo** lo listado, en el commit actual de cada repositorio, y **revisar el diff** de cada archivo copiado antes de commitear: buscar conexiones externas, ejecución de comandos, uso de claves y hooks. Hallazgos nuevos se anotan en `THIRD_PARTY_NOTICES.md` y se avisan.

**Files:**
- Create:
  - `skills/` con:
    - `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `choreograph`, `animation-performance`, `animation-vocabulary`, `break-ui` (de `emilkowalski/skills`)
    - `geo-citability`, `geo-crawlers`, `geo-llmstxt` (de `zubair-trabzada/geo-seo-claude`), con los scripts que cada `SKILL.md` referencie y `requirements.txt` si lo necesitan
    - `copywriting`, `copy-editing`, `cro` (de `coreyhaines31/marketingskills`)
  - `references/taste.md`: cuerpo de `leonxlnx/taste-skill/skills/taste-skill/SKILL.md` sin frontmatter
  - `references/ai-tells-es.md`
  - `THIRD_PARTY_NOTICES.md`
  - `tests/third-party.test.mjs`

**Interfaces:**
- Produces: nombres de skills locales usados en los Tasks 5 y 8, iguales a los nombres de carpeta de arriba; las rutas `references/taste.md`, `references/ai-tells-es.md` y `skills/copywriting/references/ai-tells.md`.

- [ ] **Step 1: Write the failing test** `tests/third-party.test.mjs`

```js
test('every vendored skill ships its upstream LICENSE', () => {
  for (const s of VENDORED) assert.ok(existsSync(`skills/${s}/LICENSE`), s);
});
test('THIRD_PARTY_NOTICES lists repo, commit SHA and license per vendored skill', () => {
  for (const s of VENDORED) assert.match(notices(), new RegExp(`${s}[\\s\\S]*?[0-9a-f]{40}`));
});
test('taste reference has no frontmatter and no hooks', () => {
  const t = read('references/taste.md');
  assert.ok(!t.startsWith('---')); assert.ok(!/hooks:/.test(t));
});
test('no vendored SKILL.md declares hooks', () => {
  for (const s of VENDORED) assert.equal(parseFrontmatter(`skills/${s}/SKILL.md`).data.hooks, undefined, s);
});
test('Spanish ai-tells list has Ban and Cap sections with at least 30 entries', () => {
  const es = read('references/ai-tells-es.md');
  assert.match(es, /## .*Prohibid/i); assert.match(es, /## .*L[ií]mite/i);
  assert.ok((es.match(/^- /gm) ?? []).length >= 30);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Copiar con `gh api` o un clon en una carpeta temporal** fuera del repositorio, revisar el diff y copiar.
- [ ] **Step 4: Escribir `references/ai-tells-es.md`** en español, con el mismo formato que `ai-tells.md` (prohibidas siempre / con límite de uso) y ejemplos rioplatenses y neutros. Mínimos: "potenciá tu negocio", "llevá tu X al siguiente nivel", "soluciones integrales", "en el mundo actual", "en la era digital", "descubrí cómo", "sin lugar a dudas", "de manera eficiente y efectiva", tríadas de adjetivos y preguntas retóricas de apertura.
- [ ] **Step 5: Run** `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: vendor third-party skills with licenses and add Spanish ai-tells`.

---

### Task 5: Los 7 agentes

Spec §8. Un archivo por agente en `agents/`. El cuerpo de cada prompt se escribe con la calidad más alta posible y sigue la §8.3: rol; qué recibe; qué entrega y en qué formato; qué no puede hacer; los umbrales de §5 que le tocan; la regla de honestidad (nunca inventar métricas, testimonios, clientes ni precios: placeholder visible); y cuándo devolver "BLOCKED: <motivo>" en lugar de inventar. Las skills externas se precargan o se nombran en el cuerpo según `EXTERNAL_SKILL_REF` (Task 2).

**Files:**
- Create: `agents/creative-director.md`, `agents/brand-copywriter.md`, `agents/seo-strategist.md`, `agents/geo-strategist.md`, `agents/researcher.md`, `agents/awwwards-frontend.md`, `agents/qa.md`, `tests/agents.test.mjs`

**Interfaces:**
- Consumes: `MCP_TOOL_PREFIX` y `EXTERNAL_SKILL_REF` (Task 2), los nombres de servidor (Task 3) y los nombres de skills locales (Task 4).
- Produces: nombres de agente exactos, usados por el `CLAUDE.md` de plantilla (Task 6) y los comandos (Task 8). Formato de salida de los agentes sin escritura: un único bloque Markdown con encabezados `## Summary`, `## Deliverable` y `## Sources` (este último donde aplique), que el orquestador guarda tal cual.

- [ ] **Step 1: Write the failing test** `tests/agents.test.mjs`

```js
const EXPECT = {
  'creative-director': { model: 'opus',   write: false, mcp: ['playwright','chrome-devtools'] },
  'brand-copywriter':  { model: 'opus',   write: false, mcp: [] },
  'seo-strategist':    { model: 'opus',   write: false, mcp: ['dataforseo','context7'] },
  'geo-strategist':    { model: 'opus',   write: false, mcp: ['wikidata','mcp-geo'] },
  'researcher':        { model: 'haiku',  write: false, mcp: ['brave-search','dataforseo'] },
  'awwwards-frontend': { model: 'sonnet', write: true,  mcp: ['context7'] },
  'qa':                { model: 'opus',   write: false, mcp: ['chrome-devtools','playwright'] },
};
test('exactly the seven agents exist', () => { assert.deepEqual(agentNames().sort(), Object.keys(EXPECT).sort()); });
for (const [name, e] of Object.entries(EXPECT)) {
  test(`${name}: model, no Agent tool, write access, MCP scope`, () => {
    const { data } = parseFrontmatter(`agents/${name}.md`);
    const tools = toolList(data.tools);
    assert.equal(data.model, e.model);
    assert.ok(!tools.includes('Agent') && !tools.includes('NotebookEdit'));
    assert.equal(tools.includes('Write') || tools.includes('Edit'), e.write);
    assert.deepEqual(mcpServersIn(tools, MCP_TOOL_PREFIX).sort(), [...e.mcp].sort());
    assert.ok(tools.includes('Skill'));
    assert.ok(data.description.length >= 80);
  });
}
test('no agent uses fields ignored for plugin agents', () => {
  for (const n of agentNames()) for (const f of ['hooks','mcpServers','permissionMode'])
    assert.equal(parseFrontmatter(`agents/${n}.md`).data[f], undefined, `${n}.${f}`);
});
test('every agent body states the honesty rule and the BLOCKED convention', () => {
  for (const n of agentNames()) { const b = parseFrontmatter(`agents/${n}.md`).body;
    assert.match(b, /never invent/i); assert.match(b, /BLOCKED:/); }
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Escribir los 4 agentes de razonamiento** (creative-director, brand-copywriter, seo-strategist, geo-strategist), con las herramientas, skills y entregas de la tabla §8.2. creative-director: el prototipo cubre lo que dice la §9.2, juzga el sitio renderizado en la URL que le pasa el orquestador y consulta `references/taste.md`. brand-copywriter: escribe solo en los idiomas declarados en `trabajo/decisiones.md` (§5.1), por transcreación, y verifica contra `ai-tells.md` y `ai-tells-es.md`. seo-strategist: no delega en los agentes de claude-seo.
- [ ] **Step 4: Escribir researcher, awwwards-frontend y qa.**
  - **researcher:** cada dato con fuente; no concluye; dispara el diagnóstico de mcp-geo solo cuando el orquestador lo pide.
  - **awwwards-frontend:** escribe **solo** dentro de `web/`; no commitea; stack según `decisiones.md`; i18n solo si el sitio es bilingüe.
  - **qa:** mide cada umbral de §5 en cada idioma y devuelve una tabla `umbral | medido | pasa`. No modifica archivos: su `Bash` es solo para el servidor local y el build.
- [ ] **Step 5: Run** `npm test`. Expected: PASS. Después, en la carpeta de prueba, `/agents`. Expected: los 7 aparecen con su modelo.
- [ ] **Step 6: Commit** `feat: add seven specialist agents`.

---

### Task 6: Plantillas y script de alta de cliente (`scripts/nuevo-cliente.mjs`)

Spec §6, §10.2, §11 y §5.1.

**Files:**
- Create: `templates/CLAUDE.md`, `templates/trabajo/decisiones.md`, `templates/trabajo/estado.md`, `templates/settings.json`, `templates/commit-msg`, `scripts/nuevo-cliente.mjs`, `tests/nuevo-cliente.test.mjs`

**Interfaces:**
- Consumes: nombres de agentes (Task 5) y `ATTRIBUTION_SETTING` (Task 2).
- Produces:
  - `createProject(projectDir: string, { gitUserName?: string, gitUserEmail?: string } = {}) -> { created: string[] }`, que lanza `ProjectExistsError` si ya hay `CLAUDE.md`, `trabajo/` o `web/`, y `MissingBriefError` si falta `brief.md`
  - CLI: `node scripts/nuevo-cliente.mjs <projectDir>`, que imprime la lista creada o el error y sale con código 1

- [ ] **Step 1: Write the failing test** `tests/nuevo-cliente.test.mjs` (cada test en una carpeta temporal con `brief.md`)

```js
test('creates the §10.2 structure', () => {
  createProject(dir);
  for (const p of ['CLAUDE.md','trabajo/decisiones.md','trabajo/estado.md','trabajo/research','trabajo/specs',
    'trabajo/textos','trabajo/prototipos','trabajo/reportes','web/.git','.claude/settings.json'])
    assert.ok(existsSync(join(dir, p)), p);
});
test('web/ is its own git repo and is ignored by the client folder', () => {
  createProject(dir); assert.match(read(join(dir, '.gitignore')), /^web\/$/m);
});
test('commit-msg hook rejects AI attribution', () => {
  createProject(dir);
  const r = commitIn(join(dir,'web'), 'feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>');
  assert.notEqual(r.status, 0);
  assert.equal(commitIn(join(dir,'web'), 'feat: clean').status, 0);
});
test('settings.json disables attribution and sets impeccable live agent', () => {
  createProject(dir); const s = JSON.parse(read(join(dir,'.claude/settings.json')));
  assert.equal(s.env.IMPECCABLE_LIVE_COPY_AGENT, 'chat');
  assert.deepEqual(pick(s, Object.keys(ATTRIBUTION_SETTING)), ATTRIBUTION_SETTING);
});
test('refuses to overwrite an existing project', () => {
  createProject(dir); writeFileSync(join(dir,'CLAUDE.md'), 'mine');
  assert.throws(() => createProject(dir), ProjectExistsError);
  assert.equal(read(join(dir,'CLAUDE.md')), 'mine');
});
test('fails clearly without brief.md', () => { rmSync(join(dir,'brief.md')); assert.throws(() => createProject(dir), MissingBriefError); });
test('creates structure in a path with spaces and accents', () => {
  const d = tmpSub('Cliente Ñandú y Asociados'); createProject(d); assert.ok(existsSync(join(d,'web/.git')));
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Escribir las plantillas.**
  - `templates/CLAUDE.md`, en inglés, con las secciones de la tabla §6, en este orden y con estos encabezados `##`: Role, Client material, Workflow, Quality standards, Delegation matrix, Two zones, Commands, When to ask Xavier, Honesty, Communication, Commits in web/. La matriz de delegación sigue la §8.2. Incluye:
    - los umbrales de la tabla §5, la lista de señales visuales de "hecho con IA" de §5 y la regla de CRO B2B
    - el límite de 3 ciclos (§5)
    - la regla de no delegar en los agentes de claude-seo (§12.2)
    - que el orquestador levanta el servidor local y pasa la URL (§9.2)
    - que commitea en `web/` solo cuando una sección pasa las revisiones (§10.2)
    - comunicarse con Xavier en español rioplatense
  - `decisiones.md`: campos Idiomas, Español (rioplatense/neutro), Stack, Dirección aprobada (fecha) y Cambios de rumbo.
  - `estado.md`: Etapa actual, Próximo paso y Bloqueos.
  - `commit-msg`: script `sh` que rechaza (exit 1) mensajes que contengan, sin distinguir mayúsculas, `Co-Authored-By`, `Generated with`, `Claude` o `Anthropic`.
- [ ] **Step 4: Implementar `createProject`.**
  - Crea las carpetas y copia las plantillas.
  - `git init -b main` en `web/`, con `user.name` y `user.email` locales si se pasan.
  - Instala el hook en `web/.git/hooks/commit-msg`, con permisos de ejecución.
  - Escribe `.gitignore` con `web/` y `.claude/settings.json` (plantilla + `ATTRIBUTION_SETTING`).
  - Rutas con `node:path`. `git` con `execFileSync` y argumentos en array, nunca un string de shell.
- [ ] **Step 5: Run** `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: add project template and client scaffold script`.

---

### Task 7: Script de entrega (`scripts/entregar.mjs`)

Spec §10.3.

**Files:**
- Create: `scripts/entregar.mjs`, `tests/entregar.test.mjs`

**Interfaces:**
- Produces:
  - `scanWeb(webDir: string) -> { failures: Finding[], warnings: Finding[] }`, con `Finding = { kind: 'forbidden-file'|'content'|'history'|'image-metadata'|'comment', path: string, line?: number, commit?: string, match: string }`
  - `buildPackage(projectDir: string, { date?: string }) -> string`: corre `scanWeb`, lanza `TracesFoundError` si hay `failures` y, si está limpio, crea el tag `entrega-YYYY-MM-DD` en `web/` y `entrega/<nombre-carpeta>-YYYY-MM-DD.zip` con `git archive`. Devuelve la ruta del zip.
  - `cleanHistory(webDir: string, { confirm: boolean }) -> string`: crea la rama huérfana `clean-<fecha>` con un único commit del árbol actual; sin `confirm: true`, lanza `ConfirmationRequiredError`.
  - CLI: `node scripts/entregar.mjs <projectDir> [--clean-history --confirm]`, que imprime los hallazgos como `ruta:línea  patrón` y sale con 1 si hay `failures`.

- [ ] **Step 1: Write the failing test** `tests/entregar.test.mjs` (cada test crea un repositorio `web/` temporal limpio con un commit)

```js
test('clean repo passes and produces tag + zip', () => {
  const zip = buildPackage(project, { date: '2026-12-01' });
  assert.ok(existsSync(zip)); assert.equal(git(web, ['tag','-l','entrega-2026-12-01']).trim(), 'entrega-2026-12-01');
});
test('planted CLAUDE.md fails', () => { add(web,'CLAUDE.md','x'); assert.equal(scanWeb(web).failures[0].kind,'forbidden-file'); });
test('Co-Authored-By in a commit message fails', () => {
  commitRaw(web,'feat: y\n\nCo-Authored-By: Claude <x@y>'); // bypasses hook with --no-verify in the fixture
  assert.ok(scanWeb(web).failures.some(f => f.kind==='history'));
});
test('detects a trace in an older commit on another branch', () => {
  branchWithFileThenRevert(web,'other','src/a.js','// Generated with Claude');
  assert.ok(scanWeb(web).failures.some(f => f.kind==='history'));
});
test('"Anthropic" in a source file fails with path and line', () => {
  add(web,'src/x.js','\n\nconst a = "Anthropic";'); const f = scanWeb(web).failures[0];
  assert.equal(f.path,'src/x.js'); assert.equal(f.line,3);
});
test('reports comment mentions of AI as warnings, not failures', () => {
  add(web,'src/c.js','// IA para clientes: texto del cliente'); const r = scanWeb(web);
  assert.equal(r.failures.length,0); assert.equal(r.warnings[0].kind,'comment');
});
test('AI generator marker in image metadata fails', () => {
  addBytes(web,'img/h.png', pngWithText('Software','DALL-E')); assert.ok(scanWeb(web).failures.some(f=>f.kind==='image-metadata'));
});
test('buildPackage refuses when traces exist', () => { add(web,'.mcp.json','{}'); assert.throws(() => buildPackage(project,{}), TracesFoundError); });
test('cleanHistory requires confirmation', () => { assert.throws(() => cleanHistory(web,{confirm:false}), ConfirmationRequiredError); });
test('scans a web repo in a path with spaces', () => { /* same as clean test under "Cliente Ñandú/web" */ });
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implementar `scanWeb`.**
  - **Archivos prohibidos:** los de Global Constraints, recorriendo el árbol de trabajo y `git ls-files`.
  - **Contenido:** patrones de Global Constraints, buscados línea por línea en archivos de texto rastreados. Se saltean los binarios, salvo imágenes.
  - **Historial:** `git log --all --format=%H%x00%B` para los mensajes, más `git log --all -p` para los diffs.
  - **Comentarios:** `\b(AI|IA)\b` dentro de comentarios `//`, `/* */`, `<!-- -->` o `#` → `warnings`.
  - **Imágenes** (`.png`, `.jpg`, `.jpeg`, `.webp`): buscar en los bytes `c2pa`, `DALL-E`, `Midjourney`, `Stable Diffusion`, `Firefly`, `OpenAI` → `failures`.
- [ ] **Step 4: Implementar `buildPackage`, `cleanHistory` y la CLI.** `git` con `execFileSync` y argumentos en array. `buildPackage` nunca borra ni modifica archivos de `web/`.
- [ ] **Step 5: Run** `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: add delivery script that blocks AI traces`.

---

### Task 8: Los 10 comandos (skills)

Spec §9 y §4. Cada comando es `skills/<nombre>/SKILL.md`, en inglés, con `name` y `description`. Usan `disable-model-invocation: true` para que solo los dispare Xavier, salvo que el Task 2 haya encontrado que eso impide algo necesario.

**Files:**
- Create: `skills/{nuevo-cliente,investigar,direccion,build,review-design,review-seo,review-geo,qa,ronda,entregar}/SKILL.md`, `tests/commands.test.mjs`

**Interfaces:**
- Consumes: agentes (Task 5), `createProject` y su CLI (Task 6), `buildPackage`, `cleanHistory` y su CLI (Task 7), `PROJECT_SCOPE_INSTALL` (Task 2).

- [ ] **Step 1: Write the failing test** `tests/commands.test.mjs`

```js
const CMDS = ['nuevo-cliente','investigar','direccion','build','review-design','review-seo','review-geo','qa','ronda','entregar'];
test('all ten commands exist with name and description', () => {
  for (const c of CMDS) { const { data } = parseFrontmatter(`skills/${c}/SKILL.md`);
    assert.equal(data.name, c); assert.ok(data.description.length >= 40, c); }
});
test('nuevo-cliente and entregar call their scripts via ${CLAUDE_PLUGIN_ROOT}', () => {
  assert.match(body('nuevo-cliente'), /\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/nuevo-cliente\.mjs/);
  assert.match(body('entregar'), /\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/entregar\.mjs/);
});
test('entregar requires Xavier certification before running', () => { assert.match(body('entregar'), /certif/i); });
test('direccion stops for approval 1', () => { assert.match(body('direccion'), /approval/i); });
test('each delegating command names the agent it delegates to', () => {
  const map = { investigar:'researcher', build:'awwwards-frontend', 'review-design':'creative-director',
    'review-seo':'seo-strategist', 'review-geo':'geo-strategist', qa:'qa' };
  for (const [c,a] of Object.entries(map)) assert.ok(body(c).includes(a), `${c} -> ${a}`);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Escribir los comandos** con el comportamiento de la tabla §9:
  - **`nuevo-cliente`:** corre el script; si el brief no declara idiomas o variante de español, pregunta antes de seguir (§5.1); anota en `decisiones.md`; inicia `superpowers:brainstorming`.
  - **`direccion`:** coordina creative-director y brand-copywriter en el orden de §4 (textos antes del prototipo) y termina pidiendo la aprobación 1.
  - **`build`:** recibe `$ARGUMENTS` como sección.
  - **`ronda`:** reparte los comentarios por agente.
  - **`entregar`:** confirma la certificación, corre el script, muestra los hallazgos y, si hay rastros en el historial, ofrece `--clean-history --confirm` solo con el OK explícito de Xavier.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. `claude plugin validate .`. Expected: sin errores.
- [ ] **Step 5: Commit** `feat: add workflow commands`.

---

### Task 9: README, brief de prueba y piloto de aceptación

Spec §13. Esta tarea verifica el plugin entero de punta a punta. Lo que falle vuelve a la tarea que corresponde.

**Files:**
- Modify: `README.md` (instalación con `PROJECT_SCOPE_INSTALL`, recorrido, comandos, costos, requisitos: Node ≥ 22.13, Chrome estable, Git)
- Create: `tests/fixtures/brief-prueba.md` (un cliente ficticio B2B, bilingüe ES/EN, marcado como ficticio), `docs/piloto-2026-11.md` (resultados en español)

- [ ] **Step 1: Escribir el README completo y el brief de prueba.**
- [ ] **Step 2: Correr** `npm test` y `claude plugin validate .`. Expected: todo PASS, sin errores.
- [ ] **Step 3: Instalar en una PC o carpeta limpia** con `/plugin marketplace add xavierfonzalida-source/departamento-digital` y `PROJECT_SCOPE_INSTALL`. Expected: el plugin, sus dependencias y los 7 MCP aparecen solo en esa carpeta (criterios 2 y 4 de §13, verificados con `/agents` y `/mcp`).
- [ ] **Step 4: Piloto con el brief de prueba.** Correr `/nuevo-cliente`, `/investigar`, `/direccion` (se detiene en la aprobación), `/build hero` (escribe solo en `web/`) y `/qa` (tabla de umbrales con mediciones). Después, `/entregar` con un `Co-Authored-By` plantado (Expected: falla) y limpio (Expected: pasa). Anotar en `docs/piloto-2026-11.md` el resultado de cada paso y **los tokens y costos de API reales**, para corregir los estimados de §7.3.
- [ ] **Step 5: Verificar que no hay secretos:** `git grep -nE "(sk-|api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9])"`. Expected: sin resultados.
- [ ] **Step 6: Commit** `docs: complete README and record acceptance pilot`, y `git push`.
