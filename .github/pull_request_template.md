## Qué cambia y por qué

<!-- Una o dos líneas. Si cierra un issue: "Closes #N". -->

## Cómo se verificó

- [ ] `npm test` pasa
- [ ] `claude plugin validate --strict .` pasa
- [ ] Probado con `claude --plugin-dir` (si cambia agentes, comandos o plantillas)

## Checklist

- [ ] Sin claves, tokens ni datos de clientes en el diff
- [ ] Skills de terceros nuevas: con `LICENSE` y registradas en `THIRD_PARTY_NOTICES.md`
- [ ] Si es para publicar: `version` subida en `.claude-plugin/plugin.json` y entrada en `CHANGELOG.md`
