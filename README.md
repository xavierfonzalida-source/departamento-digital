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

**Estado de verificación.** La secuencia se probó con el marketplace del plugin agregado desde una **carpeta local**. La primera línea, con la fuente de GitHub del repo privado, todavía no se pudo verificar: `marketplace add` baja la rama por defecto, que antes de integrar esta rama solo tiene documentos. Queda en el checklist de `docs/piloto-2026-11.md` como "verificar después del merge". Como el repo es privado, esa PC necesita Git o `gh` con acceso a tu cuenta.

**Primera sesión.** `impeccable` descarga su motor (unos 20 MB) la primera vez que abrís una sesión con el plugin. Esperá a que termine.

Las variables de entorno y el primer arranque de los MCP están más abajo.

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

Si el historial de `web/` tiene un `Co-Authored-By` u otro rastro, `--clean-history --confirm` crea una rama nueva con un solo commit (no toca las ramas existentes) y `--ref` entrega esa rama. Cada hallazgo se muestra con archivo, línea y commit, para que decidas si es un falso positivo (por ejemplo, un cliente que se llame "Copilot"). Los archivos prohibidos en `web/` son `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.mcp.json`, `docs/superpowers/` y `trabajo/`.

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
| `OPENAI_API_KEY` | `mcp-geo` | Motor ChatGPT | No (el motor sin clave se saltea) | platform.openai.com |
| `ANTHROPIC_API_KEY` | `mcp-geo` | Motor Claude | No | console.anthropic.com |
| `GEMINI_API_KEY` | `mcp-geo` | Motor Gemini | No | aistudio.google.com |
| `PERPLEXITY_API_KEY` | `mcp-geo` | Motor Perplexity | No | perplexity.ai/settings/api |
| `XAI_API_KEY` | `mcp-geo` | Motor Grok | No | console.x.ai |
| `SERPAPI_API_KEY` | `mcp-geo` | Google AI Overviews | No | serpapi.com |

`context7`, `chrome-devtools`, `playwright` y `wikidata` no necesitan clave. Las claves opcionales de `mcp-geo` y `CONTEXT7_API_KEY` se declaran con valor por defecto vacío (`${VAR:-}`): así, si no las definís, el servidor las ve vacías en vez de recibir el texto literal `${VAR}`.

**Ojo con las claves que faltan:** `claude mcp list` no te las marca. Los servidores aparecen como Connected igual, y recién fallan con un error de autenticación cuando un agente llama a una de sus herramientas. Por eso, antes de `/investigar`, confirmá a mano que `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` y `BRAVE_API_KEY` estén definidas.

### Primer arranque: `MCP_TIMEOUT` y pre-calentado de `npx`

Los servidores locales corren con `npx`. La primera vez, `npx` baja el paquete y puede tardar más que los 30 segundos que Claude Code espera por defecto (así pasó en las pruebas, ver `docs/platform-notes.md`). Dos medidas:

1. **Subir el tiempo de espera** con la variable `MCP_TIMEOUT` (en milisegundos), antes de abrir Claude Code:

   ```
   setx MCP_TIMEOUT 60000
   ```

   (en Git Bash: `export MCP_TIMEOUT=60000`). La documentación oficial solo da un ejemplo (`MCP_TIMEOUT=10000` = 10 s), por eso se asume milisegundos.

2. **Pre-calentar una sola vez** para que los paquetes queden en la caché de `npx`:

   ```
   npx -y chrome-devtools-mcp@latest --help
   npx -y @playwright/mcp@latest --help
   npx -y dataforseo-mcp-server --help
   npx -y @brave/brave-search-mcp-server --help
   npx -y @digestseo/mcp-geo --help
   ```

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
