# bonpain-v2

Zuerst [memory/MEMORY.md](memory/MEMORY.md) lesen (Stand, Entscheidungen, Offenes), Details in [PROJECT.md](PROJECT.md).

<!-- cloud-local-sync -->
## Cloud ↔ Local: immer überall up to date

Der Betreiber arbeitet in diesem und anderen Projekten mal lokal, mal als Cloud-Session (Claude Code on the web). Beide Seiten sollen immer denselben Stand haben:

- Am Session-Start `git pull` — auf dem neuesten Stand beginnen.
- Am Ende jeder Arbeitsphase / vor Sessionende alles committen und pushen. Nichts Wichtiges nur uncommitted lokal liegen lassen.
- Cloud-Sessions sehen NUR den Git-Stand: keine uncommitteten Änderungen, NICHT das lokale Auto-Memory unter `~/.claude/`. Was die andere Seite wissen muss, gehört committet in versionierte Dateien (CLAUDE.md, ggf. `memory/`, Docs, Code).
