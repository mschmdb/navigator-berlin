---
type: recovery
audience: owner
last-verified: 2026-05-17
related:
  - docs/recovery/wiedereinstieg.md
  - docs/runbooks/server-bootstrap.md
---

# Secrets-Map

Inventar aller Secrets im Production-Setup. **Keine Plaintext-Werte** in diesem File. Verweise auf Storage-Locations + Restore-Pfade.

## Storage-Locations

| Location | Inhalt |
|---|---|
| **Bitwarden** (persönlicher Vault) | langfristige Secrets (SSH-Keys, GitHub-Tokens, Coolify-Login) |
| **Lokal `~/.config/navigator/`** | Working-Secrets (Coolify-API-Tokens, Plausible-Postgres-Pass) — gitignored, nicht im Repo |
| **`_bmad-output/secrets/`** (lokal, gitignored) | Backup von Coolify .env (Verschlüsselungs-Keys) |
| **Hetzner Cloud Console** | API-Token-Generation (für hcloud-CLI) |
| **INWX-Account** | Domain-Auth, DNS-API-Credentials (falls genutzt) |
| **GitHub-Repo-Secrets** (Settings → Secrets) | CI/CD-Secrets (aktuell keine, da kein CI deployed) |

## Per-Service-Inventar

### navigator.berlin (Production-App, CPX22)

| Secret-Name | Wo verwendet | Storage | Rotations-Cadence | Restore-bei-Verlust |
|---|---|---|---|---|
| SSH-Key Workstation→CPX22 | `~/.ssh/id_ed25519` lokal | Bitwarden-Backup | bei Workstation-Wechsel | hcloud-CLI: neuen Key uploaden, Pubkey via Coolify-UI an Server pushen |
| Coolify-Admin-Login (E-Mail+Passwort) | https://coolify.navigator.berlin | Bitwarden | jährlich | Coolify-CLI: `php artisan user:create`-Reset auf Container-Ebene |
| Coolify-Basic-Auth (App-Layer) | https://navigator.berlin, https://coolify.navigator.berlin | Memory `project_coolify_basic_auth` (low-criticality) | Hard-Launch entfernen | siehe Memory |
| Coolify-API-Token (CPX22) | `~/.config/navigator/coolify-token` | lokal + Bitwarden-Backup | nach Token-Leak rotieren | Coolify-UI → Keys & Tokens → Create New + altes Revoken |
| Postgres-App-User-Passwort | `~/.config/navigator/postgres-pass` | lokal + Coolify-Env | bei Compromise | Coolify-UI → Postgres-Service → Env editieren + App-Env DATABASE_URL anpassen |
| Coolify .env (Verschlüsselungs-Keys) | Server `/data/coolify/source/.env` | `_bmad-output/secrets/coolify-prod.env.backup` (lokal) | wöchentlich auto-backup | siehe server-bootstrap.md „Coolify komplett zerstört" |
| GitHub-App Private-Key (Coolify-Source) | Coolify-DB (gespeichert via App-Install) | GitHub-App-Settings (neu generierbar) | bei Compromise | GitHub-Org → App → „Generate a private key" + Coolify-Source neu-connecten |
| Backup-SSH-Key CPX22→CAX21 | `/root/.ssh-backup/cax21-id_ed25519` auf CPX22 | regenerierbar | bei Server-Re-Provisioning | `ssh-keygen` neu, Pubkey zu CAX21 `~/.ssh/authorized_keys` ergänzen |

### Plausible (CAX21)

| Secret-Name | Wo verwendet | Storage | Rotations-Cadence | Restore-bei-Verlust |
|---|---|---|---|---|
| Plausible-Admin-Login (E-Mail+Passwort) | https://plausible.navigator.berlin | Bitwarden | jährlich | Plausible-Container-Exec: User-Reset via mix-Task |
| Plausible-SECRET_KEY_BASE | `~/.config/navigator/plausible-secret-key-base` | lokal | bei Compromise (invalidates Sessions) | neu generieren via `openssl rand -base64 64`, in Coolify-Env updaten, Plausible neu starten |
| Plausible-TOTP_VAULT_KEY | `~/.config/navigator/plausible-totp-key` | lokal | bei Compromise | analog SECRET_KEY_BASE |
| Plausible-Postgres-Passwort | `~/.config/navigator/plausible-pg-password` | lokal | bei Compromise | Coolify-Env updaten + Plausible neu starten |
| Plausible-ClickHouse-Passwort | `~/.config/navigator/plausible-ch-password` | lokal | bei Compromise | analog Postgres-Pass |
| Coolify-API-Token (CAX21) | `~/.config/navigator/coolify-cax21-token` | lokal | nach Leak rotieren | analog CPX22-Token |

### MongoDB-Roots auf CAX21 (Pre-Cleanup, siehe `_user-input/cax21-projekt-cleanup-plan.md`)

| Container | Username | Storage |
|---|---|---|
| tagesmau MongoDB (`ascokkw8...`) | `root` | nur in Container-ENV (siehe Cleanup-Plan, vor Shutdown via mongodump sichern) |
| fliege.dev payloadMongo (`q44448kwg...`) | `matze` (Coolify-Env-Override, NICHT die Default-ENV) | über Coolify-UI nachschlagen |

### External Services

| Service | Wo Credential gespeichert | Restore-Pfad |
|---|---|---|
| Hetzner Cloud API-Token (`fliege-dev`-Projekt) | Bitwarden + lokal `~/.config/hcloud/cli.toml` | Hetzner-Console → Security → API-Tokens → Generate New |
| INWX-Account (Domain-Owner) | Bitwarden | INWX-Login → Account-Settings |
| GitHub Personal-Access-Token (für gh-CLI) | Bitwarden + lokal `gh auth login` | github.com → Settings → Developer Settings → Tokens |
| GitHub-App `navigator-berlin-prod` (Coolify-Source) | GitHub-Org → App-Settings | re-install bei Vault-Verlust |

## Rotations-Schema

**Wann rotieren:**

- SSH-Keys: bei Workstation-Wechsel oder Disk-Verlust
- API-Tokens (Coolify, Hetzner, GitHub): bei Leak-Verdacht ODER 1×/Jahr Hygiene
- Postgres-/ClickHouse-Passwörter: bei DB-Container-Re-Provisioning ODER Compromise
- Coolify .env-Keys: NIE rotieren (würde alle gespeicherten Secrets entwerten). Backup ist Pflicht.

**Wie rotieren:**

1. Neuen Secret generieren (`openssl rand -base64 …`)
2. In Coolify-UI (Service-Env-Vars) updaten
3. Container neu starten (Coolify-Restart-Knopf)
4. Lokale Kopie in `~/.config/navigator/...` aktualisieren
5. Alten Token revoken (Coolify-UI / GitHub-Settings / Hetzner-Console)

## Anti-Patterns

- **NIE** Plaintext-Werte in `docs/` committen
- **NIE** `~/.config/navigator/*` ins Repo
- **NIE** `_bmad-output/secrets/` ins Repo (in `.gitignore`)
- **NIE** Coolify-API-Token in `.env.example` exemplifizieren
