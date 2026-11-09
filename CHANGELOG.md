# Changelog

Todos los cambios relevantes del plugin se anotan acá. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones siguen [SemVer](https://semver.org/lang/es/): cada publicación sube `version` en `.claude-plugin/plugin.json`.

## [0.3.0] - 2026-11-09

### Cambiado
- El agente `awwwards-frontend` pasa a llamarse **`frontend-engineer`**, para no usar una marca de terceros en su nombre. Su rol, herramientas y reglas no cambian.

### Migración
- Proyectos creados con 0.1.0 o 0.2.0: en el `CLAUDE.md` de la carpeta del cliente, reemplazá `departamento-digital:awwwards-frontend` por `departamento-digital:frontend-engineer` (o volvé a copiar la plantilla). Los proyectos nuevos ya salen con el nombre correcto.

## [0.2.0] - 2026-11-09

### Agregado
- README: secciones para actualizar, desinstalar y qué ejecuta el plugin (hooks, MCP, scripts), y la regla de versiones para quien lo mantiene.
- `CHANGELOG.md`, `CONTRIBUTING.md` y plantillas de GitHub para reportar errores, proponer mejoras y abrir pull requests.
- CI en GitHub Actions: tests y `claude plugin validate --strict` en cada push y pull request.
- `homepage` y `keywords` en el manifiesto del plugin.

### Cambiado
- El repositorio pasa a ser público: la instalación ya no requiere credenciales de GitHub.

## [0.1.0] - 2026-11-09

### Agregado
- Primera versión: `CLAUDE.md` de plantilla para el orquestador, 7 agentes especialistas (`creative-director`, `brand-copywriter`, `seo-strategist`, `geo-strategist`, `researcher`, `awwwards-frontend`, `qa`), 10 comandos (`/nuevo-cliente`, `/investigar`, `/direccion`, `/build`, `/review-design`, `/review-seo`, `/review-geo`, `/qa`, `/ronda`, `/entregar`), 7 servidores MCP, skills de terceros con sus licencias y los scripts de alta de cliente y de entrega sin rastros de IA.

[0.3.0]: https://github.com/xavierfonzalida-source/departamento-digital/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/xavierfonzalida-source/departamento-digital/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/xavierfonzalida-source/departamento-digital/releases/tag/v0.1.0
