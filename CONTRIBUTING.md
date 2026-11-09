# Cómo colaborar

Gracias por querer mejorar el plugin. Cualquier aporte suma: un error detectado, una idea o un pull request.

## Reportar un error o proponer una mejora

Abrí un [issue](https://github.com/xavierfonzalida-source/departamento-digital/issues/new/choose) con la plantilla que corresponda. Para errores, incluí la versión del plugin (`.claude-plugin/plugin.json`), la de Claude Code (`claude --version`), tu sistema operativo y los pasos para reproducirlo.

**Nunca pegues claves de API, tokens ni datos de clientes** en issues, commits ni pull requests.

## Mandar un cambio

1. Hacé un fork y una rama desde `main`.
2. Instalá dependencias y corré los tests:

   ```
   npm install
   npm test
   claude plugin validate --strict .
   ```

3. Probá el plugin en una sesión sin instalarlo: `claude --plugin-dir <ruta-al-repo>` en una carpeta de prueba.
4. Abrí el pull request contra `main` y completá la plantilla.

## Convenciones

- **Idioma:** los archivos del plugin (agentes, comandos, plantillas, scripts y tests) se escriben en inglés. La documentación (`README.md`, `docs/`, este archivo) va en español.
- **Commits:** mensajes en inglés con [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) (`feat:`, `fix:`, `docs:`, `chore:`).
- **Tests:** todo cambio de lógica en `scripts/` lleva su test en `tests/` (`node:test`, sin dependencias nuevas salvo que sea imprescindible).
- **Credenciales:** solo como `${VAR}` en `.mcp.json`, nunca escritas en un archivo.
- **Skills de terceros:** se copian con su `LICENSE` y se registran en `THIRD_PARTY_NOTICES.md` con repositorio, commit y licencia. Antes de copiar, revisá el código (conexiones externas, comandos, hooks).
- **Versiones:** quien publica sube `version` en `.claude-plugin/plugin.json` y agrega la entrada en `CHANGELOG.md`. Sin subir la versión, los usuarios no reciben la actualización.

## Licencia

Al contribuir aceptás que tu aporte se publique bajo la licencia MIT del proyecto.
