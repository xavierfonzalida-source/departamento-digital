# Departamento Digital

Plugin de Claude Code: un estudio multi-agente para construir sitios web a medida.

## Instalación

```
/plugin install departamento-digital --marketplace xavierfonzalida-source/departamento-digital
```

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

Si falta una variable obligatoria, Claude Code avisa en `claude mcp list` y el servidor falla con error de autenticación. Eso es esperable hasta que cargues la clave.

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

Requisitos: Node 22.13 o superior (lo pide `mcp-geo`) y Chrome estable (lo pide `chrome-devtools`).

### Costos estimados por sitio

Son **estimaciones, no mediciones**. Se miden en el primer proyecto real y se corrigen. Sitio estándar de 5 a 10 páginas B2B:

| Servicio | Costo estimado | Fuente y supuestos |
|---|---|---|
| DataForSEO | ≈ USD 5 (USD 2,30 de uso con margen ×2). Recarga mínima de USD 50 sin vencimiento | Tarifas oficiales leídas el 2026-11-08 en dataforseo.com/pricing. Supone 5 temas, 5 competidores, 50 SERP con AI Overview y 250 páginas de competidores rastreadas |
| Brave Search | USD 0 dentro de los USD 5 de créditos mensuales (4 a 6 sitios por mes); después ≈ USD 1 por sitio | Supone 150 a 250 búsquedas por sitio. Fuente: spec §7.2 y §7.3 |
| mcp-geo | ≈ USD 1,50 por diagnóstico | Supone 20 preguntas × 4 motores × 3 rondas; AI Overviews dentro de las 250 consultas gratis de SerpApi. Precios de las APIs de IA tomados de sitios de terceros |
| Wikidata, Context7, Chrome DevTools, Playwright | USD 0 | — |
| Tokens de Claude | n/d | Sin medir |

Fuente de todas las filas: `docs/superpowers/specs/2026-11-08-departamento-digital-design.md` §7.3.
