---
type: recovery
audience: owner
last-verified: 2026-05-17
related:
  - docs/recovery/secrets-map.md
  - docs/runbooks/server-bootstrap.md
  - docs/runbooks/publish-update-skill.md
  - docs/runbooks/local-postgres-setup.md
---

# Wiedereinstieg

Solo-Maintainer-Playbook für den Fall, dass du nach mehreren Monaten Lücke wieder ans Projekt willst. Ziel: produktiv in unter 2 Stunden statt 2 Tage Suche.

## TL;DR

| Was                           | Wo                                          | Kommando                                  |
| ----------------------------- | ------------------------------------------- | ----------------------------------------- |
| Repo                          | `mschmdb/navigator-berlin` (GitHub, privat) | `gh repo clone mschmdb/navigator-berlin`  |
| Production                    | https://navigator.berlin                    | —                                         |
| Coolify-Dashboard (App)       | https://coolify.navigator.berlin            | Basic-Auth `navigator` / `arndtstrasse34` |
| Coolify-Dashboard (Plausible) | https://coolify.fliege.dev                  | dein Login                                |
| Plausible-Dashboard           | https://plausible.navigator.berlin          | dein Login                                |
| SSH Production                | `ssh admin@88.198.115.174`                  | (Key-Auth, kein Passwort)                 |
| SSH CAX21 (Aux)               | `ssh root@168.119.98.228`                   | (Key-Auth)                                |

## Local-Dev-Setup

### Voraussetzungen

- Node 22 (`.nvmrc` sagt `20`, läuft auch auf 22 — siehe ADR-Notiz)
- pnpm 10.32+ (über corepack)
- Docker (für lokale Postgres)
- Git, GitHub-CLI

### Bootstrap

```bash
gh repo clone mschmdb/navigator-berlin
cd navigator-berlin
corepack enable && corepack prepare pnpm@10.32.0 --activate
pnpm install
```

### Lokale Postgres

```bash
# Container starten
docker run -d --name navigator-pg-local \
  -e POSTGRES_USER=navigator -e POSTGRES_PASSWORD=local \
  -e POSTGRES_DB=navigator -p 5432:5432 \
  postgres:17-alpine

# .env.local anlegen
cat > .env.local <<EOF
DATABASE_URL=postgres://navigator:local@localhost:5432/navigator
ORIGIN=http://localhost:5173
EOF

# Schema + Daten
pnpm db:migrate
pnpm data:aggregate
pnpm data:aggregate-scores
pnpm data:faq

# Dev-Server
pnpm dev
```

Site läuft auf http://localhost:5173.

### Vollständige Local-Doku

Siehe [docs/runbooks/local-postgres-setup.md](../runbooks/local-postgres-setup.md).

## Production-Access-Sequenz

### SSH zu Hauptserver (App + Postgres)

```bash
ssh admin@88.198.115.174
```

- User: `admin` mit NOPASSWD-sudo
- root-Login ist auf `prohibit-password` (nur Key-Auth, für Coolify-internen Container-Zugriff)
- fail2ban läuft, Docker-Subnets sind whitelisted

### Coolify-Dashboard (App)

Browser: https://coolify.navigator.berlin

- Basic-Auth-Lock (siehe TL;DR)
- API-Token gespeichert in `~/.config/navigator/coolify-token`
- App-UUID, Postgres-UUID etc. siehe runbooks/server-bootstrap.md

### Coolify-Dashboard (Plausible)

Browser: https://coolify.fliege.dev

- Eigener Login (Owner-Account)
- Plausible-Service-UUID: `j7u5zlb9p5gg1lgjzgmp10mh`
- API-Token: `~/.config/navigator/coolify-cax21-token`

### SSH zu CAX21 (Aux-Server, Plausible + ggf. Backups)

```bash
ssh root@168.119.98.228
```

- root-Login direkt erlaubt (Aux-Server-Convention)
- hostname `coolify-fliege-dev`

## Restart-Sequenz

### App neu deployen (typischer Use-Case)

```bash
export TOK=$(cat ~/.config/navigator/coolify-token | tr -d '\n\r ')
curl -sS -H "Authorization: Bearer $TOK" -X POST \
  "https://coolify.navigator.berlin/api/v1/deploy?uuid=v114bqfpzsdmkmd0c65473s7"
```

Oder via Coolify-UI → App → Deploy.

Build dauert 5-10 min (Dockerfile-multi-stage + prebuild-aggregate-Steps).

### Container manuell restart (falls App hängt)

```bash
ssh admin@88.198.115.174
sudo docker restart $(sudo docker ps -q --filter "name=v114bqfp")
```

### Postgres neu starten

```bash
ssh admin@88.198.115.174
sudo docker restart u83rd482pdebahel7a1bi80n
```

### Coolify selbst neu starten

```bash
ssh admin@88.198.115.174
cd /data/coolify/source
sudo bash -c "docker compose restart"
```

## Häufige Bricks

### „Build hängt nach `og:images done`"

Bekannt: `og:images`-Script schloss Postgres-Connection nicht → Node-Event-Loop hing. Fix war commit `9769bf0` (closeDb + explicit process.exit). Wenn das wieder auftritt → checke `scripts/generate-og-images.ts` Ende.

### „Coolify zeigt App als `exited:unhealthy`"

Container-Logs holen:

```bash
ssh admin@88.198.115.174
sudo docker logs $(sudo docker ps -aq --filter "name=v114bqfp") --tail 100
```

Häufigster Grund: Postgres-Verbindung schlägt fehl → check `DATABASE_URL`-Env in Coolify-Settings.

### „Cert abgelaufen / Let's Encrypt failt"

Traefik holt Cert via HTTP-01-Challenge. Wenn DNS nicht aufgelöst wird → Cert-Renewal failt. Check:

```bash
dig +short navigator.berlin
dig +short coolify.navigator.berlin
dig +short plausible.navigator.berlin
```

Sollten alle korrekt auflösen. Wenn nicht: DNS in INWX prüfen.

### „pnpm install schlägt fehl mit `packages field missing`"

`pnpm-workspace.yaml` muss `packages: ['.']` enthalten (pnpm 9+ Strict-Mode). Fix war commit `0bf422b`.

### „Build-Container Out-of-Memory"

CPX22 hat nur 4 GB RAM + 2 GB Swap. Wenn Docker-Build OOM-killed wird → Build-Argumente reduzieren oder größeren Server provisionieren.

### „Static-Files veraltet (z.B. kiez-scores.json zeigt alte Werte)"

Aggregator-Skripte lokal neu laufen lassen, dann commit + redeploy:

```bash
pnpm data:aggregate
pnpm data:aggregate-scores
pnpm data:faq
pnpm og:images
git add static/
git commit -m "chore: refresh aggregates"
git push
```

## Verifikations-Checks nach Restart

Manuelle 5-Min-Checkliste:

```bash
# 1. Homepage lädt
curl -sI https://navigator.berlin | head -1

# 2. Atlas funktioniert
curl -sI https://navigator.berlin/explore | head -1

# 3. Beispiel-Kiez prerendered
curl -sI https://navigator.berlin/kiez/charlottenburg-nord | head -1

# 4. Ranking-Page
curl -sI https://navigator.berlin/wo-lebt-es-sich-gut | head -1

# 5. Health-Endpoint
curl -s https://navigator.berlin/api/healthz

# 6. Sitemap erreichbar
curl -sI https://navigator.berlin/sitemap.xml | head -1

# 7. WebMCP-Manifest
curl -sI https://navigator.berlin/.well-known/webmcp.json | head -1

# 8. OG-PNG
curl -sI https://navigator.berlin/og/kiez/charlottenburg-nord.png | head -1
```

Alle sollten `HTTP/2 200` liefern. Plus visual-check im Browser auf Mobile (Search-Overlay, Hamburger-Menü, Inspector-Toolbar).

## Backup-Restore

Backup-Schema + Restore-Pfad: [docs/runbooks/server-bootstrap.md](../runbooks/server-bootstrap.md#10-recovery-pfade).

Drill verifiziert 2026-05-17: gunzip+psql Restore von `pg-YYYY-MM-DD.sql.gz` funktioniert, alle Tabellen-Counts identisch.

## Update publizieren

Manuell: [docs/runbooks/add-update-entry.md](../runbooks/add-update-entry.md).

Skill-getrieben: [docs/runbooks/publish-update-skill.md](../runbooks/publish-update-skill.md) (`/publish-update` Skill).

## Secrets-Inventar

Siehe [docs/recovery/secrets-map.md](./secrets-map.md).
