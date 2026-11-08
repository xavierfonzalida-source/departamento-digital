# Hechos de la plataforma Claude Code

Spike de la Task 2. Fecha: **2026-11-08**. Versión probada: **Claude Code CLI 2.1.302**, Windows 11, Git Bash, Node v24.

Las constantes que usan las tareas siguientes están en `tests/platform.mjs`. Este documento guarda la evidencia de cada una.

Cómo leer el estado de cada hecho:

- **VERIFICADO**: lo probé con un experimento real y vi el resultado.
- **CONFIRMADO POR DOCS**: lo dice la documentación oficial, pero no lo probé.
- **SIN VERIFICAR**: no se pudo determinar. Se usa el valor más seguro y queda anotado qué tenés que revisar.

## Cómo se probó

No se pueden manejar comandos interactivos como `/mcp` o `/agents`, así que todo se probó desde la terminal:

- `claude plugin ...` para marketplaces e instalación.
- `claude -p "<prompt>" --output-format stream-json --verbose`: una sesión sin interfaz. El primer evento (`system/init`) trae la lista real de plugins, servidores MCP, herramientas, agentes y skills cargados.
- `claude mcp list` y `claude plugin list --json`.
- Lectura de los archivos de settings que escribe Claude Code.

Las pruebas corrieron en `%TEMP%\dd-spike\` (carpetas `projA`, `projB`, `projC` y una copia del plugin en `plugin\`), fuera del repo. Ahí se agregaron, solo en la copia, un `.mcp.json` con `context7` y dos agentes de prueba (`probe-ns` y `probe-bare`). Al terminar se borró la carpeta entera.

## Hecho 1: prefijo de las herramientas MCP del plugin

**Estado: VERIFICADO.**

```js
MCP_TOOL_PREFIX = 'mcp__plugin_departamento-digital_'
```

Una herramienta queda como `mcp__plugin_departamento-digital_<servidor>__<herramienta>`. El servidor se registra como `plugin:departamento-digital:<servidor>`.

Evidencia:

1. La copia del plugin tenía un `.mcp.json` con el servidor `context7` (`npx -y @upstash/context7-mcp@4.5.1`). Se instaló en `projA` con `--scope project`.
2. `claude mcp list` en `projA` mostró `plugin:departamento-digital:context7: npx -y @upstash/context7-mcp@4.5.1 - ✔ Connected`.
3. En una sesión `claude -p` le pedí al modelo que buscara con `ToolSearch` las herramientas con "context7". Devolvió:
   - `mcp__plugin_departamento-digital_context7__query-docs`
   - `mcp__plugin_departamento-digital_context7__resolve-library-id`
   - además de `mcp__context7__query-docs` y `mcp__context7__resolve-library-id`, que son de tu `context7` de usuario.

La documentación oficial dice lo mismo (https://code.claude.com/docs/en/mcp, sección "Plugin MCP tool names"): la forma es `mcp__plugin_<plugin>_<servidor>__<herramienta>`, y cualquier carácter fuera de `A-Z a-z 0-9 _ -` se cambia por `_`.

### Dos cosas que hay que saber (importan para la Task del `.mcp.json`)

**a) Duplicados: tu servidor de usuario le gana al del plugin.** Tenés `context7` configurado a nivel usuario con el comando `npx -y @upstash/context7-mcp`. Con el plugin usando **exactamente el mismo comando**, el servidor del plugin ni siquiera apareció en la sesión. Para Claude Code era un duplicado. La documentación lo confirma: los servidores de plugin se comparan con los demás por URL o comando, y gana el de usuario. Recién al cambiar los argumentos (`@4.5.1`) aparecieron las dos versiones.

Es como tener dos llaves de la misma puerta: Claude Code se queda con la tuya y descarta la del plugin. El problema es que los agentes del plugin buscan herramientas con el nombre `mcp__plugin_departamento-digital_context7__*`, y esas no existen si gana tu servidor de usuario.

Qué hacer: en el `.mcp.json` del plugin, que cada servidor tenga un comando o una URL distintos de los que tengas a nivel usuario. Por ejemplo, fijar la versión del paquete. Otra opción es que los agentes acepten los dos nombres en `tools`.

**b) En `claude -p` los servidores lentos pueden llegar tarde.** Con `npx` sin caché, el servidor del plugin tardó más de 30 segundos y falló (`connection timed out after 30000ms`). Con el paquete ya descargado, conectó. En la sesión sin interfaz arrancó como `pending`, y sus herramientas aparecieron unos segundos después. Conviene que los servidores del plugin sean rápidos de arrancar o queden fijados a una versión ya descargada.

## Hecho 2: skills de otros plugins en el campo `skills` de un agente

**Estado: VERIFICADO.**

```js
EXTERNAL_SKILL_REF = (plugin, skill) => `${plugin}:${skill}`   // ej. 'superpowers:brainstorming'
```

Evidencia:

- Agente `probe-ns` con `skills: [superpowers:brainstorming]` y `tools: WebSearch`. Así no tiene ni `Skill` ni herramientas para leer archivos. Las instrucciones le pedían no usar herramientas y copiar textual la primera oración debajo de `# Brainstorming` que encontrara en su contexto.
- Lo invoqué desde `claude -p` con la herramienta `Agent` (`subagent_type: departamento-digital:probe-ns`). Respondió:
  `PRELOADED_SKILLS: superpowers:brainstorming` / `FIRST_SENTENCE: You are very good at building.`
- Esa oración es textual la primera del cuerpo de `superpowers/7.0.0/skills/brainstorming/SKILL.md`. En el registro de la sesión, el subagente no llamó a ninguna herramienta antes de responder (solo `SubagentHandback` para devolver el resultado). O sea, el contenido completo vino precargado.
- Control: `probe-bare` con `skills: [brainstorming]`, el nombre sin prefijo, también lo recibió. Igual se elige la forma con prefijo porque no es ambigua: hay otras skills con nombres parecidos, como `product-management:product-brainstorming`.

La documentación (https://code.claude.com/docs/en/sub-agents) confirma que se inyecta el contenido completo, hasta 32 skills. No muestra ejemplos con prefijo, así que este experimento es lo que lo confirma. Límites documentados: no se puede precargar una skill con `disable-model-invocation: true`. Si una skill falta o está deshabilitada, se saltea en silencio (solo queda una advertencia en el log de depuración).

Ojo: la skill tiene que estar instalada y habilitada en esa sesión. Por eso importan las dependencias del Hecho 3.

## Hecho 3: dependencias y alcance por proyecto

**Estado: VERIFICADO**, con un ajuste necesario y un punto sin verificar (ver abajo).

### Formato de `dependencies` (en `.claude-plugin/plugin.json`)

```json
"dependencies": [
  "superpowers@claude-plugins-official",
  "impeccable@impeccable",
  "ui-ux-pro-max@ui-ux-pro-max-skill",
  "claude-seo@agricidaniel-claude-seo"
]
```

Formato documentado: `"nombre@marketplace"` (https://code.claude.com/docs/en/plugins/dependencies.md). Va el **nombre del marketplace**, no el repo de GitHub. Los nombres los saqué del `marketplace.json` de cada repo:

| Plugin | Repo | Nombre del marketplace |
| :- | :- | :- |
| superpowers | anthropics/claude-plugins-official | `claude-plugins-official` |
| impeccable | pbakaus/impeccable | `impeccable` |
| ui-ux-pro-max | nextlevelbuilder/ui-ux-pro-max-skill | `ui-ux-pro-max-skill` |
| claude-seo | AgriciDaniel/claude-seo | `agricidaniel-claude-seo` |

### Ajuste necesario: `allowCrossMarketplaceDependenciesOn` en `marketplace.json`

Las cuatro dependencias vienen de otros marketplaces. Por defecto Claude Code **no instala** dependencias de un marketplace distinto al del plugin. Según la documentación, si están declaradas solo en `plugin.json`, la instalación termina sin ellas y el plugin después no carga. Por eso agregué a `.claude-plugin/marketplace.json`:

```json
"allowCrossMarketplaceDependenciesOn": [
  "claude-plugins-official", "impeccable", "ui-ux-pro-max-skill", "agricidaniel-claude-seo"
]
```

El brief solo pedía tocar `plugin.json`. Este cambio va más allá, pero sin él las dependencias no se instalan.

### Los marketplaces de las dependencias tienen que estar agregados

Con el marketplace del plugin agregado pero sin los otros tres, `claude plugin install` respondió: `1 dependency still unresolved: impeccable@impeccable. Is the "impeccable" marketplace added?`. Y `claude plugin list --json` mostró el error `dependency-unsatisfied`. Al agregar cada marketplace con `--scope project`, la dependencia que faltaba se instaló sola (`+ 1 dependency: impeccable`).

### Prueba de alcance

- **projC** (la secuencia limpia de `PROJECT_SCOPE_INSTALL`): agregué los 4 marketplaces con `--scope project` y después `claude plugin install departamento-digital@departamento-digital --scope project`. Respuesta: `Successfully installed plugin ... (scope: project) (+ 4 dependencies: superpowers, impeccable, ui-ux-pro-max, claude-seo)`. El `.claude/settings.json` del proyecto quedó con `enabledPlugins` para los 5 y `extraKnownMarketplaces` para los 4 marketplaces.
- **projA**: `claude -p` cargó `departamento-digital`, `impeccable`, `ui-ux-pro-max`, `claude-seo` y `superpowers`.
- **projB** (otra carpeta, sin instalar nada): `claude -p` cargó solo `superpowers`, que ya tenías instalado a nivel usuario antes del spike. `claude plugin list --json` desde projB muestra los cuatro plugins como `enabled=false`, con `projectPath` de projA.
- `~/.claude/settings.json` quedó **idéntico** después de instalar. Lo comparé con `diff` contra la copia tomada antes.

Conclusión: con `--scope project`, las dependencias quedan activas solo en ese proyecto. No hace falta la alternativa de escribir `enabledPlugins` a mano. Eso ya es lo que hace `--scope project`.

### Qué sí se escribe a nivel usuario aunque el alcance sea por proyecto

Aunque la activación es por proyecto, Claude Code guarda las descargas y el registro en tu carpeta de usuario:

- `~/.claude/plugins/known_marketplaces.json` y `~/.claude/plugins/marketplaces/<nombre>/`: copia de cada marketplace.
- `~/.claude/plugins/installed_plugins.json`: un registro por proyecto, con su `projectPath`.
- `~/.claude/plugins/cache/<marketplace>/...`: los archivos de cada plugin (claude-seo ~7,8 MB, impeccable ~2,4 MB, ui-ux-pro-max ~24 MB).
- **impeccable descargó su motor** `~/.impeccable/bin/0.1.19/impeccable.exe` (20 MB, con checksum verificado) durante la instalación o la primera sesión, **sin** que se editara ningún archivo. Se esperaba que lo hiciera recién en el primer Edit/Write. Tenelo en cuenta si querés controlar esa descarga.

### Sin verificar

- **Instalar desde GitHub.** Probé el marketplace del plugin como **carpeta local**. `PROJECT_SCOPE_INSTALL` usa `xavierfonzalida-source/departamento-digital`, que es la forma documentada para GitHub. Como el repo es **privado**, el clonado usa tus credenciales de git. Qué revisar: correr la primera línea de `PROJECT_SCOPE_INSTALL` en una carpeta de prueba y confirmar que clona sin pedir nada.
- **superpowers en una máquina sin él instalado.** Acá ya estaba a nivel usuario. Igual en projC se creó además una instalación por proyecto de superpowers, así que el mecanismo funciona. En una máquina nueva, `claude-plugins-official` suele venir de fábrica, pero no lo probé.
- En esta PC los tres marketplaces de terceros ya estaban descargados cuando corrí projC (`already on disk`). En una máquina nueva se clonan en ese paso.

## Hecho 4: configuración de atribución

**Estado: VERIFICADO.**

```js
ATTRIBUTION_SETTING = { attribution: { commit: '', pr: '', sessionUrl: false } }
```

Documentación (https://code.claude.com/docs/en/settings-reference, entrada `attribution`):

- `attribution` es un objeto con `commit` y `pr` (texto) y `sessionUrl` (sí/no). También acepta `false` para ocultar todo, pero eso pide v2.1.281 o más nueva. Las versiones anteriores lo rechazan y **descartan el archivo de settings entero**. Por eso elegí la forma con textos vacíos, que la documentación recomienda cuando versiones viejas también leen el archivo.
- `includeCoAuthoredBy` está **deprecado** desde v2.0.62.

Evidencia: en `projB` le pregunté a `claude -p` si su contexto le pedía agregar atribución a commits y PRs:

- Sin settings: respondió que sí y citó `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` y `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Con `--settings '{"attribution":{"commit":"","pr":"","sessionUrl":false}}'`: `NO_ATTRIBUTION_INSTRUCTIONS`.
- Con `--settings '{"attribution":false}'`: `NO_ATTRIBUTION_INSTRUCTIONS`.

## Cambios en tu configuración de usuario y cómo se revirtieron

Antes de tocar nada guardé copias de `~/.claude/settings.json`, `~/.claude/plugins/installed_plugins.json`, `~/.claude/plugins/known_marketplaces.json` y las salidas de `claude plugin list` y `claude plugin marketplace list`.

| Cambio | Cómo se revirtió |
| :- | :- |
| Se registraron 4 marketplaces (`departamento-digital`, `impeccable`, `ui-ux-pro-max-skill`, `agricidaniel-claude-seo`) en `known_marketplaces.json` y `~/.claude/plugins/marketplaces/` | `claude plugin marketplace remove <nombre>` para cada uno |
| Instalaciones por proyecto en projA y projC (departamento-digital, impeccable, ui-ux-pro-max, claude-seo, y superpowers solo en projC) en `installed_plugins.json` | `claude plugin uninstall <id> --scope project` en cada carpeta. La instalación de superpowers **de usuario** no se tocó |
| Caché `~/.claude/plugins/cache/{departamento-digital,impeccable,ui-ux-pro-max-skill,agricidaniel-claude-seo}` | Borrada |
| `~/.impeccable/bin/` (motor de impeccable descargado durante el spike) | Borrada. El resto de `~/.impeccable/` ya existía y no se tocó |
| Caché de npx con `@upstash/context7-mcp@4.5.1` | **No se borró.** Es caché de npm, no hace daño y npm la limpia sola |
| Carpeta `%TEMP%\dd-spike\` | Borrada |

Verificación final (con `diff` contra las copias): `~/.claude/settings.json`, `installed_plugins.json`, `known_marketplaces.json` y `claude plugin marketplace list` quedaron **idénticos** a como estaban antes.

**Algo que noté y no causé yo:** en `claude plugin list`, la sección "Synced from claude.ai" perdió `engineering@synced` y `product-management@synced`. Esos plugins vienen de tu cuenta de claude.ai. El archivo `~/.claude/plugins/synced/.../manifest.json` se actualizó desde el servidor y ahora lista solo `cowork-plugin-management`. Ningún comando del spike toca tu cuenta de claude.ai. Lo más probable es que se hayan desactivado en tu cuenta. Si los querés, revisalos en la configuración de plugins de claude.ai.
