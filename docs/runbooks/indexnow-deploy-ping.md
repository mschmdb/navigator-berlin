---
title: IndexNow-Deploy-Ping (Bing)
audience: maintainer
status: living
---

# IndexNow-Deploy-Ping (Bing)

Story 5.9 AC-10. Nach jedem Production-Deploy kann ein manueller IndexNow-Push an Bing geschickt werden, damit Bing + alle Bing-basierten Suchen (DuckDuckGo, ChatGPT-Search) neue/geaenderte URLs innerhalb von Sekunden statt Tagen erfasst.

Yandex bewusst ausgelassen (User-Decision).

## Setup (einmalig)

1. **Key generieren**: `openssl rand -hex 16` (32 hex chars, ist die Mindestlaenge).
2. **In Bitwarden ablegen** unter `navigator.berlin / IndexNow Key`.
3. **In Coolify** unter `App > Environment > Production` setzen:
   - `INDEXNOW_KEY=<der 32-hex-Key>`
4. **Deploy triggern** damit der `/{key}.txt`-Endpoint live ist (Route `src/routes/[key].txt/+server.ts`).
5. **Verify Key-File**: `curl https://navigator.berlin/<INDEXNOW_KEY>.txt` muss den Key als Body zurueckgeben. Wenn 404 → INDEXNOW_KEY in Coolify nicht gesetzt oder Deploy noch nicht durch.

## Manuell pingen

Lokal mit `.env` enthaltend `INDEXNOW_KEY`:

```bash
pnpm indexnow:ping --dry   # zeigt was geschickt wird, kein POST
pnpm indexnow:ping         # POST an api.indexnow.org/IndexNow
pnpm indexnow:ping --limit=5  # nur erste 5 URLs (Test)
```

Erfolg = HTTP 200/202 (Bing antwortet 200 bei akzeptiert, 202 bei queued).

## Optional: Coolify-Post-Deploy-Hook

Coolify v4 unterstuetzt Custom-Container-Commands via `compose-override`. Aktuell NICHT verdrahtet, weil:

- Skill `/publish-update` (Story 5.8) erzeugt Update-Entries manuell.
- Solo-Maintainer-Cadence: maximal 1-2 Deploys pro Woche, manueller Ping zumutbar.

Wenn Auto-Trigger spaeter gewuenscht: in Coolify `Pre/Post-Deployment-Commands` setzen:

```
post-deploy: docker exec navigator pnpm indexnow:ping
```

Voraussetzung: `tsx` + Source-Code im Production-Container, was bei aktuellem Dockerfile NICHT der Fall ist (nur kompiliertes Output). Dann statt dessen separater CI-Job in GitHub-Actions oder kleines Shell-Wrapper-Skript ausserhalb Container.

## Falls Bing 403 zurueckgibt

- Key-File-URL nicht erreichbar (Coolify env nicht aktiv).
- Host-Mismatch: `INDEXNOW_HOST` muss `navigator.berlin` matchen.
- Key-Format ungueltig (muss 8-128 hex chars sein).

## Bezug zu sonstigen SEO-Stories

- Story 2.1: sitemap.xml-Foundation. IndexNow konsumiert dasselbe Sitemap.
- Story 5.7: Google Search Console + Bing Webmaster Tools manuell verifiziert.
- Memory `project_seo_bot_policy`: AI-Bot-Allowlist in robots.txt.
- Memory `project_indexnow_setup`: dieser Runbook + Key-Location.
