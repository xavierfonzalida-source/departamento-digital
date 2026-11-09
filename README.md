# Departamento Digital

Plugin de Claude Code: un estudio multi-agente para construir sitios web a medida. Vos dirigís y aprobás; los agentes investigan, diseñan, escriben, construyen y miden.

## Requisitos

- **Node 22.13 o superior** (lo pide `mcp-geo`; los scripts del plugin también).
- **Chrome estable** (lo pide `chrome-devtools`).
- **Git 2.28 o superior** (el repositorio `web/` se crea con la rama `main` desde el inicio).
- **Claude Code** reciente (probado con 2.1.302, ver `docs/platform-notes.md`).

## Instalación

El plugin se activa **solo en la carpeta de cada cliente**, nunca para todo tu usuario: así sus hooks, sus MCP y los de sus dependencias (superpowers, impeccable, ui-ux-pro-max, claude-seo) no corren en tus otros proyectos.

Abrí una terminal **dentro de la carpeta del cliente** y corré estos cinco comandos, en este orden. Primero se agregan el marketplace del plugin y los **tres marketplaces de terceros**; sin ellos el plugin no carga, porque sus dependencias salen de ahí.

```
claude plugin marketplace add xavierfonzalida-source/departamento-digital --scope project
claude plugin marketplace add pbakaus/impeccable --scope project
claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill --scope project
claude plugin marketplace add AgriciDaniel/claude-seo --scope project
claude plugin install departamento-digital@departamento-digital --scope project
```

La fuente de estas líneas es `PROJECT_SCOPE_INSTALL` en `tests/platform.mjs`. Al terminar, el plugin y sus cuatro dependencias quedan habilitados solo en esa carpeta (se anotan en `.claude/settings.json` de la carpeta).

Dentro de una sesión de Claude Code, el último paso equivale a `/plugin install departamento-digital@departamento-digital`.

**Acceso.** El repositorio es público: no hace falta cuenta ni credenciales de GitHub para instalarlo. Claude Code clona con `git` sin pedir contraseñas; si en tu PC no tenés clave SSH configurada para GitHub y el clonado falla, definí `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` para que use HTTPS directo.

**Primera sesión.** `impeccable` descarga su motor (unos 20 MB) la primera vez que abrís una sesión con el plugin. Esperá a que termine.

Las variables de entorno y el primer arranque de los MCP están más abajo.

### Actualizar

En marketplaces que no son oficiales, como este, **la actualización automática viene apagada**. Para traer la última versión, en la carpeta del cliente:

```
claude plugin marketplace update departamento-digital
claude plugin update departamento-digital@departamento-digital --scope project
```

Después reiniciá Claude Code (o usá `/reload-plugins`). Si preferís que se actualice solo, activalo en `/plugin` > pestaña Marketplaces > Enable auto-update. Qué cambió en cada versión está en [`CHANGELOG.md`](CHANGELOG.md).

Los proyectos ya creados no se rompen al actualizar: `/nuevo-cliente` copia el `CLAUDE.md` en el momento de crear cada proyecto.

### Desinstalar

En la carpeta del cliente:

```
claude plugin uninstall departamento-digital@departamento-digital --scope project --prune
```

`--prune` quita también las dependencias que se instalaron solas (superpowers, impeccable, ui-ux-pro-max, claude-seo) si ya nada las usa. Los marketplaces agregados se quitan con `claude plugin marketplace remove <nombre>`.

### Qué ejecuta este plugin

Antes de instalar conviene saber qué corre en tu máquina:

- **Hooks.** El plugin no trae hooks propios. Sus dependencias sí: `claude-seo` valida el JSON-LD después de cada edición de archivo, e `impeccable` trae un hook de diseño y descarga su motor la primera vez.
- **Servidores MCP (7).** `context7` y `wikidata` son remotos (HTTPS); `chrome-devtools`, `playwright`, `dataforseo`, `brave-search` y `mcp-geo` corren local con `npx`, en versiones fijas. Detalle y credenciales en [Variables de entorno](#variables-de-entorno).
- **Scripts.** `scripts/nuevo-cliente.mjs` (crea la estructura del proyecto) y `scripts/entregar.mjs` (revisa y empaqueta la entrega). Solo usan Node y Git, y no se conectan a internet.
- **Skills de terceros** copiadas dentro del plugin, con su licencia: ver [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Cómo se trabaja

1. Creá la carpeta del cliente y poné tu `brief.md` adentro.
2. Corré los cinco comandos de instalación en esa carpeta y abrí `claude` ahí.
3. `/nuevo-cliente` arma la estructura y abre la charla de brainstorming con vos.
4. Los agentes hacen el resto. Vos decidís en **dos aprobaciones**:
   - **Aprobación 1**, al final de `/direccion`: concepto, textos, dirección visual y prototipo HTML. Sin tu OK no se construye nada.
   - **Aprobación 2 (certificación)**, después de las rondas de cambios: vos certificás que el sitio está listo. Sin eso no se entrega.

Orden típico: `/nuevo-cliente` → `/investigar` → `/direccion` → (aprobación 1) → `/build hero`, `/build ...` → `/ronda` las veces que haga falta → (certificación) → `/entregar`.

| Comando | Qué hace |
|---|---|
| `/nuevo-cliente` | Verifica que el plugin esté activo en esta carpeta, crea `CLAUDE.md`, `trabajo/` y el repositorio aparte `web/` a partir de `brief.md`, confirma los idiomas y abre el brainstorming. |
| `/investigar` | Reúne referencias, competidores, palabras clave, SERP, entidades y datos citables, y diagnostica la visibilidad en motores de IA. Todo queda en `trabajo/research/`. |
| `/direccion` | Especificaciones SEO y GEO, concepto, textos reales por idioma, dirección visual y prototipo HTML. **Se detiene en tu aprobación 1.** |
| `/build <sección>` | Construye una sección (por ejemplo `hero`) solo dentro de `web/`, corre las revisiones y la commitea cuando todo pasa. |
| `/review-design` | Revisión de diseño contra la dirección aprobada. |
| `/review-seo` | Auditoría SEO del sitio construido. |
| `/review-geo` | Auditoría GEO: citabilidad por IA, `llms.txt`, crawlers. |
| `/qa` | Mide todos los umbrales: LCP < 2,5 s, INP < 200 ms, CLS 0,00, Lighthouse ≥ 95 en las 4 categorías, WCAG 2.2 AA, 60 fps con CPU ×4. Máximo 3 ciclos automáticos por umbral antes de escalártelo a vos. |
| `/ronda <comentarios>` | Aplica una ronda de tus cambios: los reparte al agente dueño de cada uno, reconstruye, revisa y te presenta el resultado. |
| `/entregar` | Solo después de tu certificación. Bloquea si hay rastros de IA en `web/` (archivos o historial de Git) o marcadores `[PLACEHOLDER: ...]` sin completar; si pasa, etiqueta el commit y arma un zip en `entrega/`. |

`/build` y `/ronda` corren solos las revisiones y `/qa`; igual los podés llamar a mano cuando quieras.

### Entrega y rastros de IA

El comando `/entregar` corre este script desde el plugin (no desde la carpeta del cliente, donde no existe):

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<carpeta del cliente>"
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<carpeta del cliente>" --clean-history --confirm
node "${CLAUDE_PLUGIN_ROOT}/scripts/entregar.mjs" "<carpeta del cliente>" --ref clean-<fecha>
```

`--clean-history --confirm` y `--ref clean-<fecha>` son las opciones que `/entregar` te ofrece cuando hay rastros en el historial. Si querés correrlo a mano en una terminal, usá la ruta absoluta al `scripts/entregar.mjs` del plugin (dentro de la caché de plugins de Claude Code) y la carpeta del cliente como argumento.

Si el historial de `web/` tiene un `Co-Authored-By` u otro rastro, `--clean-history --confirm` crea una rama nueva con un solo commit (no toca las ramas existentes) y `--ref` entrega esa rama. Nada se pisa nunca: si ese día ya hubo una entrega, la etiqueta y el zip salen con sufijo (`entrega-<fecha>-2`, `-3`, …), y lo mismo la rama limpia (`clean-<fecha>-2`); el script imprime el nombre que eligió. Los nombres de crawlers de IA en las líneas `User-agent:` de un `robots.txt` (`ClaudeBot`, `ChatGPT-User`, …) no cuentan como rastro, porque la especificación GEO los pide; cualquier otra línea de ese archivo se revisa igual. Cada hallazgo se muestra con archivo, línea y commit, para que decidas si es un falso positivo (por ejemplo, un cliente que se llame "Copilot"). Los archivos prohibidos en `web/` son `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.mcp.json`, `docs/superpowers/` y `trabajo/`.

La tabla de licencias de lo copiado de terceros (repositorio, commit y licencia) está en `THIRD_PARTY_NOTICES.md`.

El resultado del piloto de aceptación y el checklist que te toca correr a vos están en `docs/piloto-2026-11.md`.

## Variables de entorno

`.mcp.json` declara 7 servidores MCP. Las credenciales **nunca** van escritas en archivos: `.mcp.json` las toma de variables de entorno de tu sistema. Definilas antes de abrir Claude Code (en Windows: Panel de control > Variables de entorno, o `setx NOMBRE "valor"` y reabrir la terminal).

| Variable | Servidor | Para qué sirve | Obligatoria | Dónde se obtiene |
|---|---|---|---|---|
| `DATAFORSEO_LOGIN` | `dataforseo` | Usuario de la API (keywords, SERP, competencia) | Sí, para usar DataForSEO | App.dataforseo.com > API Access (el "API login", distinto del mail) |
| `DATAFORSEO_PASSWORD` | `dataforseo` | Contraseña de la API | Sí, para usar DataForSEO | Misma pantalla (es la contraseña de API, no la de la cuenta) |
| `BRAVE_API_KEY` | `brave-search` | Búsqueda web por país e idioma | Sí, para usar Brave Search | api-dashboard.search.brave.com/app/keys (pide tarjeta) |
| `CONTEXT7_API_KEY` | `context7` | Límites de uso más altos en la documentación | No (sin clave anda, con menos cupo) | context7.com/dashboard (gratis) |
| `MCP_GEO_OPENAI_API_KEY` | `mcp-geo` | Motor ChatGPT | No (el motor sin clave se saltea) | platform.openai.com |
| `MCP_GEO_ANTHROPIC_API_KEY` | `mcp-geo` | Motor Claude | No | console.anthropic.com |
| `MCP_GEO_GEMINI_API_KEY` | `mcp-geo` | Motor Gemini | No | aistudio.google.com |
| `MCP_GEO_PERPLEXITY_API_KEY` | `mcp-geo` | Motor Perplexity | No | perplexity.ai/settings/api |
| `MCP_GEO_XAI_API_KEY` | `mcp-geo` | Motor Grok | No | console.x.ai |
| `MCP_GEO_SERPAPI_API_KEY` | `mcp-geo` | Google AI Overviews | No | serpapi.com |

**Las claves de `mcp-geo` llevan el prefijo `MCP_GEO_`.** `.mcp.json` se las pasa al servidor con el nombre que él espera (por ejemplo, `MCP_GEO_ANTHROPIC_API_KEY` llega como `ANTHROPIC_API_KEY`), pero solo a ese servidor. **Nunca definas `ANTHROPIC_API_KEY` como variable global de tu sistema** (ni con `setx` ni en el Panel de control): si existe, Claude Code la usa en vez de tu suscripción y te cobra cada mensaje por API, aparte. Lo mismo vale, por prolijidad, para `OPENAI_API_KEY` y las demás: definí solo las versiones con `MCP_GEO_`.

`context7`, `chrome-devtools`, `playwright` y `wikidata` no necesitan clave. Las claves opcionales de `mcp-geo` y `CONTEXT7_API_KEY` se declaran con valor por defecto vacío (`${VAR:-}`): así, si no las definís, el servidor las ve vacías en vez de recibir el texto literal `${VAR}`.

**Ojo con las claves que faltan:** `claude mcp list` no te las marca. Los servidores aparecen como Connected igual, y recién fallan con un error de autenticación cuando un agente llama a una de sus herramientas. Por eso `/investigar` arranca comprobando que `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` y `BRAVE_API_KEY` estén definidas (solo mira si existen, nunca muestra su valor) y, si falta alguna, se detiene y te dice cuál.

### Primer arranque: `MCP_TIMEOUT` y pre-calentado de `npx`

Los servidores locales corren con `npx`. La primera vez, `npx` baja el paquete y puede tardar más que los 30 segundos que Claude Code espera por defecto (así pasó en las pruebas, ver `docs/platform-notes.md`). Dos medidas:

1. **Subir el tiempo de espera** con la variable `MCP_TIMEOUT` (en milisegundos), antes de abrir Claude Code:

   ```
   setx MCP_TIMEOUT 60000
   ```

   (en Git Bash: `export MCP_TIMEOUT=60000`). La documentación oficial solo da un ejemplo (`MCP_TIMEOUT=10000` = 10 s), por eso se asume milisegundos.

2. **Pre-calentar una sola vez** para que los paquetes queden en la caché de `npx`:

   ```
   npx -y chrome-devtools-mcp@1.12.0 --help
   npx -y @playwright/mcp@0.0.84 --help
   npx -y dataforseo-mcp-server@3.1.3 --help
   npx -y @brave/brave-search-mcp-server@2.1.4 --help
   npx -y @digestseo/mcp-geo@0.3.30 --help
   ```

   Son las mismas versiones fijas de `.mcp.json` (las publicadas al 2026-11-09, según `npm view`). Fijarlas evita que una versión nueva de un paquete cambie el comportamiento sin aviso; para actualizar, se cambian en los dos lugares a la vez.

   Los comandos con `--help` no están probados uno por uno: si alguno se queda esperando, cortalo con Ctrl+C; el paquete ya quedó descargado.

### Costos estimados por sitio

Son **estimaciones, no mediciones**. Se miden en el primer proyecto real y se corrigen (el piloto de `docs/piloto-2026-11.md` deja los campos para anotarlos). Sitio estándar de 5 a 10 páginas B2B:

| Servicio | Costo estimado | Fuente y supuestos |
|---|---|---|
| DataForSEO | ≈ USD 5 (USD 2,30 de uso con margen ×2). Recarga mínima de USD 50 sin vencimiento | Tarifas oficiales leídas el 2026-11-08 en dataforseo.com/pricing. Supone 5 temas, 5 competidores, 50 SERP con AI Overview y 250 páginas de competidores rastreadas |
| Brave Search | USD 0 dentro de los USD 5 de créditos mensuales (4 a 6 sitios por mes); después ≈ USD 1 por sitio | Supone 150 a 250 búsquedas por sitio. Fuente: spec §7.2 y §7.3 |
| mcp-geo | ≈ USD 1,50 por diagnóstico | Supone 20 preguntas × 4 motores × 3 rondas; AI Overviews dentro de las 250 consultas gratis de SerpApi. Precios de las APIs de IA tomados de sitios de terceros |
| Wikidata, Context7, Chrome DevTools, Playwright | USD 0 | — |
| Tokens de Claude | n/d | Sin medir |

Fuente de todas las filas: `docs/superpowers/specs/2026-11-08-departamento-digital-design.md` §7.3.

## Colaborar y publicar versiones

¿Encontraste un error o tenés una idea? Abrí un issue o mandá un pull request: la guía está en [`CONTRIBUTING.md`](CONTRIBUTING.md).

**Regla de versiones para quien mantiene el plugin.** Cada publicación sube el número de `version` en `.claude-plugin/plugin.json` (por ejemplo 0.2.0 → 0.3.0) y agrega su entrada en `CHANGELOG.md`. Si se publica un cambio sin subir la versión, Claude Code responde "ya está en la última versión" y los usuarios se quedan con la copia vieja. Antes de publicar:

```
npm test
claude plugin validate --strict .
```

GitHub corre lo mismo en cada push y pull request (`.github/workflows/ci.yml`).

## Licencia

MIT, ver [`LICENSE`](LICENSE). Las skills de terceros conservan sus licencias originales (todas MIT), detalladas en `THIRD_PARTY_NOTICES.md`.
