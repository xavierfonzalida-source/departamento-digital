# Plugin `departamento-digital` — Documento de diseño

- **Fecha:** 2026-11-08
- **Autor de las decisiones:** Xavier (fundador). Redactado por Claude a partir de la sesión de brainstorming.
- **Estado:** borrador para aprobación.

Convención de este documento:
- Lo que Xavier decidió figura como decisión, sin marca.
- **[Decisión de Claude]** marca lo que decidió Claude y Xavier todavía tiene que revisar.
- **[Constructor]** marca lo que queda a criterio de quien lo construya.

---

## 1. Intención y por qué

Xavier arma sitios web para sus clientes con Claude Code. Hasta ahora improvisaba una estructura de trabajo distinta en cada proyecto. Quiere **una base reutilizable y estable**: un plugin de Claude Code que, al abrir una carpeta nueva con el brief de un cliente, le dé toda la arquitectura de trabajo lista. La base va a mejorar con el uso, pero su estructura se mantiene.

La base está formada por **un `CLAUDE.md` de proyecto y un equipo de agentes**, cada uno con rol, tareas, skills y MCP. Lo que cambia de un cliente a otro entra por el brief y no por la base.

El estándar de calidad es **"nivel Awwwards"**:
- estética de Site of the Day (SOTD)
- rendimiento técnico impecable
- SEO y GEO (Generative Engine Optimization) avanzados
- CRO orientado a B2B y SaaS

"Awwwards" se usa solo como referencia de calidad. El plugin no lleva esa marca en su nombre.

### Cómo trabaja Xavier

1. Escribe el brief del sitio por su cuenta, antes de abrir la sesión.
2. Crea una carpeta nueva, pone el brief y abre Claude Code.
3. Invoca el plugin (`/nuevo-cliente`) y obtiene la arquitectura de trabajo.
4. Hace brainstorming y diseño **antes de escribir código**, para no hacer el trabajo dos veces ni gastar tokens de más.
5. Habla **solo con la sesión principal**, que orquesta a los agentes. Nunca habla con los subagentes.
6. Itera con rondas de cambios hasta llegar al resultado que quiere.
7. **Certifica** el resultado. Recién entonces se arma el paquete final.
8. El resultado final es la web empaquetada en una carpeta del proyecto, en un repositorio Git **sin rastros del trabajo con IA**.

## 2. Objetivos, no-objetivos y anti-objetivos

### Objetivos
- Una estructura base reutilizable entre clientes: un `CLAUDE.md` para todos los proyectos que trabaja con el material de cada cliente.
- Diseño y contenido aprobados antes del código: el prototipo HTML se arma con los textos reales.
- Separación estricta de roles: los que razonan no escriben código, el que construye no cambia decisiones de diseño, el que verifica no corrige.
- Estándares de calidad **medibles**, verificados con herramientas antes de cada revisión de Xavier.
- Entrega limpia: el repositorio de la web no contiene ningún rastro de IA.
- El plugin vive en un repositorio privado de GitHub y se puede compartir de forma privada para recibir mejoras.

### No-objetivos (fuera de esta versión)
- Publicar el sitio en producción o en un hosting. La entrega es la carpeta y el repositorio limpios.
- Herramientas de diseño en lienzo, como Figma o Penpot. Se descartaron: el diseño previo se hace como prototipo HTML (ver §9.1).
- Monitoreo de visibilidad en IA después del lanzamiento como servicio recurrente. mcp-geo lo permite, pero en esta versión se usa para el diagnóstico previo (ver §7.3).
- La skill `anatomy-asset`: queda para probarla aparte, fuera de la base.
- Gestión de clientes, facturación o propuestas comerciales.

### Anti-objetivos (fracasos aunque el sitio "funcione")
1. **Que no pase las auditorías** de la §5.
2. **Que parezca hecho con IA**, tanto en el diseño como en los textos.

## 3. Restricciones técnicas de Claude Code

Están verificadas en la documentación oficial: https://code.claude.com/docs/en/sub-agents.md y las páginas de plugins (`/docs/en/plugins/components.md` y `/docs/en/plugins/dependencies.md`). Condicionan el diseño:

1. **Un `CLAUDE.md` en la raíz del plugin no se carga como contexto.** Por eso `/nuevo-cliente` escribe el `CLAUDE.md` en la carpeta de cada proyecto.
2. **Los agentes de un plugin ignoran los campos `hooks`, `mcpServers` y `permissionMode`.** Los MCP se declaran una sola vez a nivel plugin (`.mcp.json`) y los hooks en `hooks/hooks.json`. A cada agente se le limitan las herramientas con `tools` / `disallowedTools`, por ejemplo `mcp__<servidor>__*`.
3. **`tools` no puede limitar rutas de escritura.** Por eso los agentes que no deben escribir código directamente **no tienen** `Write`, `Edit` ni `NotebookEdit`.
4. **Los subagentes pueden lanzar subagentes** (hasta 3 niveles). Se bloquea: ningún agente especialista tiene la herramienta `Agent`. Solo la sesión principal delega.
5. **El campo `skills` precarga el contenido completo** de cada skill en el agente, hasta 32. No está confirmado que acepte nombres de skills de otros plugins con prefijo, como `superpowers:brainstorming`. Ver §12, primer riesgo.
6. **Un plugin puede declarar dependencias** de otros plugins en su manifiesto (`dependencies`). Se instalan y habilitan automáticamente.
7. **El campo `model`** acepta los alias `opus`, `sonnet`, `haiku` e `inherit`, o IDs completos.
8. El nombre de las herramientas de un MCP que trae un plugin probablemente tenga la forma `mcp__plugin_<plugin>_<servidor>__<herramienta>`. **[Constructor]** debe confirmarlo con `/agents` o con una prueba antes de escribir las listas `tools`.

## 4. El recorrido de trabajo

```
/nuevo-cliente
   └─ Arma la estructura y lee el brief
Brainstorming con el orquestador (superpowers:brainstorming)
/investigar
   └─ researcher: referentes, competencia, keywords, entidades y diagnóstico de visibilidad en IA
Estrategia
   └─ seo-strategist y geo-strategist: arquitectura de contenidos, keywords, Schema, entidades y citabilidad
Concepto y textos
   └─ creative-director (concepto) + brand-copywriter (voz y textos reales)
/direccion
   └─ creative-director: dirección visual, stack y prototipo HTML con los textos reales
   ══ APROBACIÓN 1 DE XAVIER ══
Plan de implementación (superpowers:writing-plans)
/build <sección>
   └─ awwwards-frontend construye según la spec aprobada
/review-design · /review-seo · /review-geo · /qa
   └─ Si algo no llega al umbral, vuelve a construcción. Xavier no lo ve
Revisión de Xavier → /ronda (cambios) → construcción y revisiones otra vez
   ══ CERTIFICACIÓN DE XAVIER ══
/entregar
   └─ Script: paquete limpio en el repositorio de la web
```

Reglas del recorrido:
- **Dos aprobaciones obligatorias:** el diseño, antes de escribir código, y la certificación final. En el resto, los agentes avanzan solos y consultan a Xavier solo ante decisiones que cambien el resultado.
- **Las rondas de cambios son normales.** Los controles de calidad corren en cada ronda, pero no reemplazan la certificación.
- **El stack se decide por proyecto,** a partir del brief, en la etapa de dirección, y se aprueba con el diseño. Por defecto es Astro, para sitios de contenido. Next.js se usa cuando hay partes de aplicación: login, paneles o datos en vivo. `awwwards-frontend` maneja los dos.

## 5. Estándares de calidad (umbrales medibles)

`qa` los mide con herramientas antes de cada revisión de Xavier. Si uno no se cumple, el resultado no se presenta: vuelve a construcción.

**Límite de reintentos** **[Decisión de Claude]:** si un umbral sigue sin cumplirse después de **3 ciclos automáticos** de construcción y revisión, el orquestador deja de reintentar y consulta a Xavier. Le lleva la medición, la causa probable y las opciones, por ejemplo simplificar una animación o aceptar el valor con justificación. Así un objetivo difícil, como CLS 0,00 con GSAP y Three.js, no consume tokens sin fin.

| Estándar | Umbral | Cómo se mide | Fuente del umbral |
|---|---|---|---|
| LCP | < 2,5 s | Traza de Chrome DevTools MCP, en celular y con red limitada | web.dev, rango "bueno" |
| INP | < 200 ms | ídem | web.dev |
| CLS | 0,00 medido (Google considera "bueno" < 0,1) | ídem | web.dev; el objetivo 0,00 es pedido de Xavier ("cero CLS") |
| Lighthouse | ≥ 95 en Performance, Accessibility, Best Practices y SEO | Lighthouse vía Chrome DevTools MCP | **[Decisión de Claude]** |
| Accesibilidad | WCAG 2.2 AA | Lighthouse, la auditoría de impeccable y revisión del teclado con Playwright | **[Decisión de Claude]** |
| Schema.org | JSON-LD válido y sin tipos obsoletos | Hook de claude-seo y validación de `seo-strategist` | — |
| Animación | 60 fps estables en celular de gama media | Profiler de Chrome DevTools con CPU limitada ×4 | Pedido de Xavier. **[Decisión de Claude]**: la simulación con CPU ×4 |
| Anti-IA (diseño) | Ningún hallazgo crítico del detector de impeccable | `impeccable` (detector de 62 reglas) | — |
| Anti-IA (textos) | Ninguna frase prohibida de `ai-tells.md` | Skill `copywriting` y revisión de `qa` | — |
| Semántica | HTML5 semántico, un solo `h1`, jerarquía de encabezados válida | `qa` y `seo-strategist` | — |

**Lista de señales visuales de "hecho con IA"** **[Decisión de Claude]**. Xavier no la confirmó. Cada elemento solo se puede usar si el brief lo justifica:
- degradados violetas o azul-violeta
- tipografía Inter (o la del sistema) usada por defecto
- hero centrado con un badge arriba del título
- grillas de tres tarjetas con ícono
- glassmorphism decorativo
- blobs 3D genéricos
- emojis como íconos

impeccable y la referencia de taste-skill la amplían.

**CRO B2B/SaaS:** un objetivo de conversión por página, CTAs claros, prueba social **real** (nunca inventada) y fricción mínima en los formularios. Lo guía la skill `cro` (§7.1).

### 5.1 Idiomas: español, inglés o los dos, según el cliente
Decisión de Xavier: cada sitio puede estar **en español, en inglés o en los dos**, según el cliente. **Un sitio de un solo idioma no paga el costo bilingüe.** El brief declara los idiomas y qué español usar (rioplatense o neutro). Si no lo dice, `/nuevo-cliente` se lo pregunta a Xavier antes de seguir **[Decisión de Claude]**. Los idiomas quedan anotados en `trabajo/decisiones.md`.

Todo lo que sigue se aplica **solo a los idiomas declarados**:
- **Textos:** `brand-copywriter` escribe cada idioma con voz propia (*transcreación*, no traducción literal) y guía de voz para los dos.
- **Anti-IA en textos:** además de `ai-tells.md` (inglés), el plugin incluye **`ai-tells-es.md`**, una lista equivalente de frases que delatan IA en español, como "potenciá tu negocio", "llevá tu X al siguiente nivel", "soluciones integrales" o "en el mundo actual". **[Constructor]** la redacta con el mismo formato de prohibidas y con límite de uso.
- **Construcción:** un sitio de un idioma no lleva i18n. Uno bilingüe usa el ruteo por idioma del stack elegido (i18n de Astro o de Next.js), con `hreflang`, Schema y metadatos por idioma, y un selector de idioma accesible. En todos los casos, `lang` correcto.
- **SEO y GEO:** la investigación de keywords, SERP, Brave y mcp-geo se hace por cada mercado e idioma declarado. Un sitio de un idioma cuesta lo de la §7.3. Uno bilingüe, aproximadamente el doble: unos USD 10 en DataForSEO y USD 3 en mcp-geo.
- **QA:** los umbrales se miden en cada versión de idioma.

## 6. El `CLAUDE.md` del proyecto

Es uno solo para todos los clientes: el "manual del estudio". `/nuevo-cliente` lo copia a cada proyecto. No se personaliza por cliente: lo propio de cada cliente vive en archivos aparte que el `CLAUDE.md` manda leer.

| Sección | Contenido |
|---|---|
| Rol | La sesión principal es Lead Project Manager y Lead Architect: orquesta, decide el reparto del trabajo y es el único interlocutor de Xavier |
| Material del cliente | Antes de cualquier tarea, leer `brief.md`, `trabajo/decisiones.md` y `trabajo/estado.md` |
| Recorrido | El de la §4, con las dos aprobaciones |
| Estándares | Los umbrales de la §5, la lista anti-IA y CRO B2B |
| Matriz de delegación | Qué agente atiende cada tipo de tarea, qué recibe y qué entrega (§8) |
| Reglas de las dos zonas | La zona de trabajo y el repositorio de la web nunca se mezclan (§10) |
| Comandos | Los 9 comandos de la §9 |
| Cuándo consultar a Xavier | Solo ante decisiones que cambien el resultado, y en las dos aprobaciones |
| Honestidad | Nunca inventar métricas, testimonios, clientes ni precios. Si falta un dato, se deja un placeholder visible. Cada número lleva su fuente |
| Comunicación | Con Xavier: español rioplatense, corto y claro |
| Commits en la web | Sin líneas de atribución de IA (`Co-Authored-By`, "Generated with…"). Esta regla del usuario tiene prioridad sobre cualquier atribución automática (§10) |

## 7. Equipamiento: skills y MCP

### 7.1 Skills

| Skill | Origen y licencia | Cómo entra al plugin | Revisión | Usada por |
|---|---|---|---|---|
| superpowers (brainstorming, writing-plans, verification-before-completion) | claude-plugins-official | Dependencia del plugin | Plugin oficial ya en uso | Orquestador |
| **impeccable** (skill anti-IA principal) | github.com/pbakaus/impeccable, Apache-2.0, 105k ★ | Dependencia (marketplace `pbakaus/impeccable`) | README revisado. Ver advertencia abajo | creative-director, awwwards-frontend (`polish`, `animate`), qa (`audit`, `critique`) |
| ui-ux-pro-max | github.com/nextlevelbuilder/ui-ux-pro-max-skill, MIT, 146k ★, tiene marketplace propio | Dependencia **[Decisión de Claude]**; ya está instalada como skill de usuario en la PC de Xavier | Ya en uso | creative-director |
| taste-skill (**solo consulta**) | github.com/leonxlnx/taste-skill, MIT, 111k ★ | Se copia **solo el contenido de `SKILL.md`** como archivo de referencia (`references/taste.md`), **sin** su frontmatter ni su hook `Stop`, conservando la licencia | Código revisado: solo se conecta a 127.0.0.1, Overpass y Wikimedia. Su hook `Stop` corre un chequeo de hasta 10 minutos al final de cada respuesta: **por eso no se instala como skill** | creative-director (consulta) |
| Skills de animación de Emil Kowalski | github.com/emilkowalski/skills, MIT, 54k ★ | Se copian al plugin con su atribución: `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `choreograph`, `animation-performance`, `animation-vocabulary`, `break-ui` | README revisado; son instrucciones | awwwards-frontend; `break-ui` y `review-animations` también para qa |
| claude-seo (solo sus skills) | github.com/AgriciDaniel/claude-seo, MIT, 27k ★ | Dependencia (tiene marketplace propio) | Código revisado por patrones: solo se conecta al sitio auditado y a APIs oficiales (Google, Bing, Moz), con protección SSRF. Su hook `PostToolUse` valida el JSON-LD en cada `Edit`/`Write`: **se conserva** | seo-strategist |
| `geo-citability`, `geo-crawlers`, `geo-llmstxt` | github.com/zubair-trabzada/geo-seo-claude, MIT, 11.5k ★ | Se copian solo esas tres, con sus scripts y su atribución. El resto (CRM, propuestas, PDF) no entra | Código revisado: solo se conecta al sitio analizado | geo-strategist |
| `copywriting`, `copy-editing`, `cro` | github.com/coreyhaines31/marketingskills, MIT, 59k ★ | Se copian solo esas tres, con su atribución | Solo texto, sin scripts ni hooks. `copywriting` incluye `references/ai-tells.md`, la lista negra de patrones de IA | brand-copywriter; `cro` también para creative-director |

**Advertencia de impeccable** (según su README):
- Su modo `live` puede ejecutar `claude` con `--permission-mode bypassPermissions` si ningún chat lo consultó en el último minuto. **Configuración obligatoria:** `IMPECCABLE_LIVE_COPY_AGENT=chat` (o `off`).
- Su hook de diseño puede descargar el motor en la primera edición, aunque se rechacen los comandos del modelo.
- Al iniciar un diseño nuevo consulta impeccable.style, aunque se desactive la telemetría.
- Usar `live` solo sobre copias locales, nunca sobre sitios desplegados.

**Licencias:** todo lo que se copia dentro del plugin conserva su archivo de licencia y se acredita en `THIRD_PARTY_NOTICES.md`.

**Revisión de código:** fue por búsqueda de patrones de riesgo (conexiones externas, ejecución de comandos, uso de claves, hooks), **no línea por línea**. **[Constructor]** vuelve a revisar el diff de cada skill que copie, en la versión exacta que copie.

### 7.2 MCP (declarados a nivel plugin en `.mcp.json`)

| MCP | Origen | Para qué | Costo | Agentes |
|---|---|---|---|---|
| Context7 | Ya en uso por Xavier | Documentación actualizada de Astro, Next.js, GSAP, Tailwind, Three.js | Gratis | awwwards-frontend, seo-strategist |
| Chrome DevTools MCP | `chrome-devtools-mcp` (Google). Requiere Chrome estable y Node ≥ 20.19 | Trazas de rendimiento (LCP, CLS, INP), Lighthouse y profiler de animación | Gratis; gasta bastantes tokens | qa |
| Playwright MCP | `@playwright/mcp` (Microsoft) | Recorrer formularios y CTAs, varios tamaños de pantalla, navegación con teclado | Gratis | qa |
| DataForSEO MCP | Oficial (dataforseo.com/seo-mcp-server), gratis y open source | Keywords, volúmenes, SERP con AI Overview, competencia y crawl de competidores | Pago por uso. ≈ USD 5 por sitio estándar (§7.3). Recarga mínima de USD 50 sin vencimiento | researcher (datos), seo-strategist |
| Brave Search MCP | `brave/brave-search-mcp-server` (oficial) | Búsqueda web por país e idioma: referentes, competencia, fuentes de datos | USD 5 de créditos por mes (≈ 1.000 búsquedas), pide tarjeta. ≈ 150 a 250 búsquedas por sitio | researcher |
| Wikidata MCP | `wmde/WikidataMCP` (Wikimedia Deutschland), BSD-3. **Remoto:** `https://wd-mcp.wmcloud.org/mcp` | Entidades, `sameAs` y grafo de entidades para GEO y Schema | Gratis | geo-strategist |
| mcp-geo | `AKzar1el/mcp-geo` (DigestSEO), MIT. **Corre local** con `npx -y @digestseo/mcp-geo`, datos en `~/.digestseo/digestseo.sqlite`, Node ≥ 22.13 | Diagnóstico previo: qué responden ChatGPT, Perplexity, Gemini y AI Overviews sobre el rubro del cliente y qué fuentes citan | Claves propias. ≈ USD 1,50 por diagnóstico (§7.3) | geo-strategist (lo dispara el researcher en `/investigar`) |

Notas:
- **Credenciales:** nunca se escriben en archivos del plugin ni de proyectos. `.mcp.json` las toma de variables de entorno (por ejemplo `DATAFORSEO_USERNAME`, `DATAFORSEO_PASSWORD`, `BRAVE_API_KEY`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY`, `SERPAPI_API_KEY`). `README.md` del plugin documenta cuáles hacen falta y dónde se obtiene cada una. **[Constructor]** confirma el nombre exacto de las variables y del paquete de cada servidor en su documentación oficial antes de escribir `.mcp.json`.
- **Wikidata remoto:** el servidor alojado registra las consultas, con un sistema para ocultar datos sensibles. Las consultas son sobre entidades públicas. Si un cliente lo exige, se puede correr en la VPS de Xavier con Docker.
- **mcp-geo:** Claude y Gemini responden sin búsqueda web (miden lo que el modelo "sabe"). ChatGPT y Perplexity sí buscan. Sus resultados son indicios, no mediciones exactas, y el reporte tiene que decirlo.
- **MCP del orquestador:** todos los anteriores, más los que Xavier ya tenga en su sesión.

### 7.3 Costos estimados por sitio (estimaciones, no mediciones)

Tarifas oficiales de DataForSEO leídas el 2026-11-08 en dataforseo.com/pricing. Los precios de las APIs de IA vienen de sitios de terceros, salvo donde se indica. Todo esto se mide en el primer proyecto real y se corrige.

| Servicio | Sitio estándar (5 a 10 páginas B2B) | Supuestos |
|---|---|---|
| DataForSEO | ≈ USD 5 (USD 2,30 de uso con margen ×2 por repeticiones) | 5 temas, 5 competidores, 50 SERP con AI Overview y 250 páginas de competidores rastreadas |
| Brave Search | USD 0 dentro de los créditos mensuales (4 a 6 sitios por mes). Después, ≈ USD 1 por sitio | 150 a 250 búsquedas |
| mcp-geo | ≈ USD 1,50 | 20 preguntas × 4 motores × 3 rondas. AI Overviews dentro de las 250 consultas gratis de SerpApi |
| Wikidata, Context7, Chrome DevTools, Playwright | USD 0 | — |
| Tokens de Claude | n/d | Sin medir. Se mide en el primer proyecto |

## 8. Los agentes

Hay 7 agentes especialistas y el orquestador, que es la sesión principal. Ningún especialista tiene la herramienta `Agent`.

### 8.1 Orquestador (sesión principal, definido en el `CLAUDE.md` del proyecto)
- **Modelo:** el que elija Xavier para la sesión. Recomendado: Opus.
- **Rol:** Lead Project Manager y Lead Architect. Único interlocutor de Xavier.
- **Tareas:** conducir el recorrido, delegar, **guardar en la zona de trabajo** lo que devuelven los especialistas que no escriben, mantener `decisiones.md` y `estado.md`, y consultar a Xavier.
- **Skills:** superpowers (brainstorming, writing-plans, verification-before-completion).
- **Escribe archivos:** sí, solo en la zona de trabajo y en `brief.md`. No escribe el código del sitio: lo delega en `awwwards-frontend`.

### 8.2 Especialistas

| Agente | Modelo | Tareas | Skills | Herramientas y MCP | Escritura | Entrega |
|---|---|---|---|---|---|---|
| `creative-director` | opus | Concepto central (lo visual y el mensaje), dirección visual, elección de stack y prototipo HTML con los textos reales. En `/review-design` juzga el sitio **renderizado**, no el código | impeccable, ui-ux-pro-max, `cro`, taste (consulta) | Read, Glob, Grep, WebFetch, Playwright y Chrome DevTools (para ver referentes, el prototipo y el sitio en la URL que le pasa el orquestador). **Sin Bash** | **No** | Spec de dirección visual y el HTML del prototipo como texto. El orquestador lo guarda en `trabajo/prototipos/` |
| `brand-copywriter` | opus | Guía de voz y textos por sección: titulares, cuerpo, CTAs y metadatos | `copywriting`, `copy-editing`, `cro` | Read, Glob, Grep | **No** | Guía de voz y textos. Nunca inventa datos: placeholders visibles |
| `seo-strategist` | opus | Arquitectura de contenidos, keywords, metadatos y plan de Schema; después audita | skills de claude-seo | Read, Glob, Grep, DataForSEO, Context7 | **No** | Spec SEO y después un reporte de auditoría con correcciones para `awwwards-frontend` |
| `geo-strategist` | opus | Entidades, citabilidad, estructura citable por IA, `llms.txt` y crawlers de IA; después audita | `geo-citability`, `geo-crawlers`, `geo-llmstxt` | Read, Glob, Grep, Wikidata, mcp-geo | **No** | Spec GEO, diagnóstico de visibilidad y reporte de auditoría |
| `researcher` | haiku | Juntar referentes, competencia, keywords y datos **con fuente**. No saca conclusiones ni decide | — | Read, WebFetch, Brave, DataForSEO (consultas de datos) | **No** | Informe de hallazgos con la fuente de cada dato |
| `awwwards-frontend` | sonnet | Construir según la spec aprobada (Astro o Next.js, Tailwind v4, GSAP con ScrollTrigger y Flip, Three.js sutil) y aplicar las correcciones de las auditorías | skills de animación de Emil Kowalski, impeccable (`polish`, `animate`) | Read, Write, Edit, Glob, Grep, Bash, Context7 | **Sí. El único que escribe código, solo en `web/`** | Código en `web/` y un resumen de lo hecho |
| `qa` | opus | Medir los umbrales de la §5, recorrer flujos, aplicar el detector anti-IA y la lista `ai-tells`. No corrige nada | impeccable (`audit`, `critique`), `break-ui`, `review-animations` | Read, Glob, Grep, Bash (servidor local y builds), Chrome DevTools, Playwright | **No** | Reporte de aprobado o fallido por umbral, con evidencia |

**`Bash` en `qa`:** lo necesita para levantar el servidor local y correr el build. Como `tools` no limita rutas, su prompt prohíbe modificar archivos. Es un riesgo aceptado (§12).

### 8.3 Contenido de cada archivo de agente
Cada archivo `agents/<nombre>.md` tiene:
- **Frontmatter:** `name`; `description`, escrita para que el orquestador sepa cuándo delegar; `model`; `tools` o `disallowedTools`, siempre sin `Agent`; `skills`; `color`.
- **Cuerpo:** rol, qué recibe, qué entrega y en qué formato, qué no puede hacer, los umbrales de la §5 que le tocan, la regla de honestidad con los datos y los criterios para devolver el trabajo como "bloqueado" en lugar de inventar.

**[Constructor]** redacta el contenido completo de cada agente y busca la calidad de prompt más alta posible. Es parte de la implementación, no de este documento.

**[Decisión de Claude]:** los archivos del plugin (agentes, comandos, `CLAUDE.md` de plantilla, scripts) se escriben **en inglés**, siguiendo la convención de código de Xavier y de las skills de terceros. Los documentos internos (este documento y `README` en español) y la comunicación con Xavier van en español rioplatense.

## 9. Comandos

| Comando | Qué hace |
|---|---|
| `/nuevo-cliente` | Crea la estructura del proyecto (§10), copia el `CLAUDE.md` de plantilla, crea el repositorio Git de `web/`, lee el brief e inicia el brainstorming |
| `/investigar` | Delega en `researcher` (y dispara el diagnóstico de mcp-geo). Guarda los hallazgos en `trabajo/research/` |
| `/direccion` | Concepto, textos y prototipo HTML. Cierra con la **aprobación 1** |
| `/build <sección>` | Por ejemplo `/build hero`: `awwwards-frontend` construye esa sección según la spec. Reemplaza al `/build-hero` original, para no tener un comando por sección |
| `/review-design` | `creative-director` + impeccable `critique` sobre lo construido |
| `/review-seo` | Auditoría de `seo-strategist` |
| `/review-geo` | Auditoría de `geo-strategist` |
| `/qa` | Mide todos los umbrales de la §5 |
| `/ronda` | Toma los comentarios de Xavier y los reparte entre los agentes que corresponde |
| `/entregar` | Solo después de la certificación. Corre el script de entrega (§10) |

En el plugin se implementan como **skills** (`skills/<nombre>/SKILL.md`), que es el formato recomendado hoy para comandos nuevos. El brainstorming no tiene comando propio: arranca después de `/nuevo-cliente`.

### 9.1 Por qué no hay herramienta de diseño
- Claude diseña mejor escribiendo HTML que dibujando con llamadas sueltas a un lienzo.
- Un prototipo HTML aprobado ya es la primera versión del sitio, sin traducir de Figma a código.
- Las animaciones (GSAP, scroll, microinteracciones) solo se pueden juzgar en el navegador.

Figma Starter tiene 6 llamadas al MCP por mes según la documentación oficial, así que no sirve. Penpot se evaluó y quedó afuera. El modo `live` de impeccable sirve para iterar variantes sobre el prototipo.

### 9.2 Alcance del prototipo y paso a construcción **[Decisión de Claude]**
- **Alcance:** la home completa y una página interior representativa por cada tipo de plantilla distinto (por ejemplo, servicio o caso). Incluye los textos reales, la paleta, la tipografía y las animaciones clave. La aprobación 1 cubre esas pantallas y el sistema visual que se desprende de ellas.
- **Paso a construcción:** el prototipo es **referencia visual y de comportamiento, no código a portar**. `awwwards-frontend` reconstruye en el stack elegido (Astro o Next.js) a partir de la spec y del prototipo. El prototipo se queda en `trabajo/prototipos/` y nunca entra a `web/`.
- Para ver el prototipo y el sitio, el orquestador levanta el servidor local y pasa la URL a los agentes que miran en el navegador.

## 10. Estructura de archivos

### 10.1 El plugin (este repositorio)

```
departamento-digital/
├── .claude-plugin/plugin.json      # nombre, versión, dependencias
├── .mcp.json                       # los 7 MCP, con credenciales por variables de entorno
├── hooks/hooks.json                # (vacío o mínimo en v1; claude-seo trae el suyo)
├── agents/                         # 7 agentes (§8)
├── skills/
│   ├── nuevo-cliente/ investigar/ direccion/ build/ review-design/
│   ├── review-seo/ review-geo/ qa/ ronda/ entregar/   # comandos (§9)
│   ├── <skills copiadas de terceros>/                # §7.1, con su LICENSE
├── templates/
│   ├── CLAUDE.md                   # el manual del estudio (§6)
│   └── trabajo/                    # plantillas de decisiones.md, estado.md, etc.
├── references/taste.md             # consulta, sin hook
├── scripts/entregar.(sh|mjs)       # script de entrega (§10.3)
├── docs/superpowers/specs/         # este documento
├── THIRD_PARTY_NOTICES.md
├── README.md                       # en español: instalación, variables de entorno, uso
└── LICENSE                         # [Decisión de Claude] MIT; el repositorio es privado, se puede cambiar
```

### 10.2 Un proyecto de cliente (lo crea `/nuevo-cliente`)

```
<carpeta-del-cliente>/
├── brief.md            # el brief de Xavier
├── CLAUDE.md           # copia de templates/CLAUDE.md
├── trabajo/            # ZONA DE TRABAJO (con rastros de IA, nunca se entrega)
│   ├── decisiones.md   # stack, dirección aprobada, cambios de rumbo
│   ├── estado.md       # en qué etapa está, qué falta
│   ├── research/  specs/  textos/  prototipos/  reportes/
└── web/                # REPOSITORIO GIT PROPIO, el sitio. Sin rastros de IA
```

**[Decisión de Claude]:**
- `web/` tiene su propio repositorio Git desde el inicio. Si la carpeta del cliente también es un repositorio, `web/` queda en su `.gitignore`. Así el historial del sitio nunca contiene archivos de la zona de trabajo.
- Durante la construcción, los commits en `web/` usan la identidad Git de Xavier y **no** llevan líneas de atribución de IA. Mensajes en inglés, estilo convencional.
- **Quién commitea:** el orquestador, cuando una sección pasa las revisiones. `awwwards-frontend` escribe archivos pero no commitea.
- **Prevención desde el día uno:** `/nuevo-cliente` deja en `web/` un hook Git `commit-msg` que **rechaza** commits con `Co-Authored-By`, `Generated with`, `Claude` o `Anthropic`. También escribe en `.claude/settings.json` de la carpeta del cliente la configuración que desactiva la atribución automática de Claude Code. **[Constructor]** confirma el nombre actual de esa configuración en la documentación oficial.

### 10.3 Entrega sin rastros de IA (`/entregar`)

Es un script fijo, no un agente. Solo corre después de la certificación de Xavier.

1. Verifica que `web/` no tenga `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.mcp.json`, `docs/superpowers/` ni archivos de la zona de trabajo.
2. Busca en archivos **y en el historial Git** de `web/` las cadenas `Claude`, `Anthropic`, `Co-Authored-By`, `Generated with`, `AI-generated`, `ChatGPT` y `copilot` (sin distinguir mayúsculas), además de comentarios que mencionen IA.
3. Revisa los metadatos de las imágenes generadas, si las hubiera.
4. Si encuentra algo, **no empaqueta**: reporta el hallazgo y la ruta. Si el rastro está en el **historial** de Git, propone como solución crear una rama nueva sin historial previo (*orphan*) con un único commit del estado limpio. **Solo lo hace con el OK explícito de Xavier**, porque reescribe el historial. **[Decisión de Claude]**
5. Si todo está limpio, arma el paquete: build final y carpeta `entrega/`, o tag en el repositorio de `web/`. **[Constructor]** elige el formato exacto y lo documenta.

**[Constructor]** no debe borrar los falsos positivos sin mostrarlos: por ejemplo, un texto del cliente que diga "IA" a propósito.

## 11. Repositorio y distribución
- **GitHub privado:** `departamento-digital`, en la cuenta de Xavier. Si lo comparte, lo hace de forma privada.
- **Activación solo en carpetas de clientes** (decisión de Xavier). El plugin no se activa para todo el usuario: así sus hooks, sus MCP y los de sus dependencias (claude-seo, impeccable) no corren en los otros proyectos de Xavier. En cada carpeta de cliente nueva, antes de abrir la sesión, se corre `claude plugin install departamento-digital --scope project`, y recién después `/nuevo-cliente`. **[Constructor]** verifica que ese comando active también las dependencias solo en esa carpeta. Si no lo hace, busca la alternativa equivalente (por ejemplo `enabledPlugins` en el `.claude/settings.json` del proyecto) y la documenta en el `README`. `/nuevo-cliente` también escribe en ese `settings.json` `IMPECCABLE_LIVE_COPY_AGENT=chat` y la configuración que desactiva la atribución automática.
- **Instalación:** como marketplace propio. El repositorio incluye `.claude-plugin/marketplace.json` para poder hacer `/plugin marketplace add <repo>` en otra PC. **[Constructor]** lo verifica con `claude plugin validate`.
- **Versionado:** semántico en `plugin.json`. Cada cambio de la base es una versión nueva, y los proyectos de clientes no se rompen porque copian el `CLAUDE.md` al crearse.

## 12. Riesgos y puntos abiertos
1. **Skills de otros plugins en el campo `skills`:** no está confirmado que se puedan precargar por nombre con prefijo. Si no se puede, los agentes las invocan con la herramienta `Skill` (que no necesita precarga), y su prompt indica cuáles usar. **[Constructor]** lo prueba primero.
2. **Dependencias con hooks propios:** al instalar claude-seo e impeccable como dependencias, también se activan sus agentes y hooks. Los agentes de claude-seo (19) quedan disponibles, pero el `CLAUDE.md` indica no delegarles. El hook de diseño de impeccable se revisa en la instalación.
3. **`Bash` en `qa`:** puede modificar archivos aunque su prompt lo prohíba. Riesgo aceptado en v1. Se puede endurecer con un hook a nivel plugin más adelante.
4. **Costos de tokens:** sin medir. El primer proyecto real los mide.
5. **Señales anti-IA del diseño:** la lista de la §5 es propuesta de Claude y Xavier puede ajustarla.

## 13. Criterios de aceptación (cómo se verifica que está hecho)
1. `claude plugin validate` pasa sin errores.
2. En una PC limpia: `/plugin marketplace add` + instalación → el plugin, sus dependencias y los 7 MCP aparecen. Los MCP con credenciales fallan con un mensaje claro si falta la variable de entorno.
3. Con un **brief de prueba** en una carpeta nueva:
   - `/nuevo-cliente` crea exactamente la estructura de la §10.2, y `web/` es un repositorio aparte.
   - `/investigar` produce un informe con fuente por dato.
   - `/direccion` produce un prototipo HTML con textos reales y se detiene para la aprobación.
   - `/build hero` escribe solo dentro de `web/`.
   - `/qa` reporta cada umbral con su medición.
   - `/entregar` **falla** si se planta a propósito un `Co-Authored-By` o un `CLAUDE.md` en `web/`, y **pasa** cuando está limpio.
4. Ningún agente especialista puede lanzar subagentes, y ninguno salvo `awwwards-frontend` puede escribir archivos. Se verifica con `/agents`.
5. No hay ninguna credencial en el repositorio.

## 14. Lo que queda a criterio del constructor
- La redacción completa de los prompts de cada agente y de cada comando.
- El nombre exacto de los paquetes MCP y sus variables de entorno, verificados en la documentación oficial.
- El formato del paquete de entrega.
- El orden de implementación, que va en el plan.
- Los detalles de las plantillas de `trabajo/`.
