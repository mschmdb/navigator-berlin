---
type: runbook
audience: owner
last-verified: 2026-05-17
---

# Server-Bootstrap: navigator.berlin Production

Reproduzierbare Setup-Anleitung für Production-Host. Wer dieses Dokument in 12 Monaten von Null durchgeht, landet bei einem laufenden `https://navigator.berlin`.

**Setup-Datum:** 2026-05-17. **Stack-Snapshot:** Hetzner CPX22 (AMD Genoa, 4 GB / 2 vCPU / 80 GB SSD, Falkenstein) + Ubuntu 24.04 LTS + Coolify v4.0.0 + Traefik v3.6 + Postgres-17-alpine + SvelteKit Node-22-alpine.

---

## Voraussetzungen

- Hetzner-Cloud-Account, Projekt `fliege-dev`, Zahlungsmittel hinterlegt
- GitHub-Account mit Repo `mschmdb/navigator-berlin` (privat)
- INWX-Account mit Domain `navigator.berlin`
- macOS oder Linux-Workstation mit `ssh` + `brew` (oder Linux-Paketmanager)
- SSH-Keypair lokal (z.B. `~/.ssh/id_ed25519`)
- Bestehender CAX21-Aux-Server für Off-Server-Backup (siehe Memory `project_cax21_aux_server`)

---

## 1. Hetzner-CLI

```bash
brew install hcloud
```

In Hetzner-Console → Projekt `fliege-dev` → Security → API-Tokens → "Generate API Token" → Permissions **Read & Write** → Name `navigator-prod-claude-code` → Token kopieren.

```bash
hcloud context create fliege-dev
# Token im Prompt einfügen

hcloud context active   # sollte fliege-dev zeigen
hcloud ssh-key list     # Workstation-Key sollte da sein, sonst hcloud ssh-key create
```

---

## 2. Server provisionieren

### Firewall

```bash
hcloud firewall create --name navigator-prod-fw --rules-file /dev/stdin <<'EOF'
[
  {"direction":"in","protocol":"tcp","port":"22","source_ips":["0.0.0.0/0","::/0"],"description":"SSH"},
  {"direction":"in","protocol":"tcp","port":"80","source_ips":["0.0.0.0/0","::/0"],"description":"HTTP"},
  {"direction":"in","protocol":"tcp","port":"443","source_ips":["0.0.0.0/0","::/0"],"description":"HTTPS"},
  {"direction":"in","protocol":"icmp","source_ips":["0.0.0.0/0","::/0"],"description":"ICMP"}
]
EOF
```

### Server

```bash
hcloud server create \
  --name navigator-prod-01 \
  --type cpx22 \
  --image ubuntu-24.04 \
  --location fsn1 \
  --ssh-key "<dein-key-name>" \
  --firewall navigator-prod-fw \
  --label project=navigator-berlin \
  --label env=production
```

Output notieren: IPv4 + IPv6.

**Begründung CPX22 statt CX33:** Recherche 2026-05-17 — CX-Gen3 hat CPU-Lotterie (Intel-Skylake oder AMD-Rome je nach Hetzner-Slot), Single-Core-Geekbench 617-1488 vs CPX22 konstant 1974. Plus: CX→CPX-Rescale ist cross-arch-block (5-30 min Downtime), CPX22→CPX32→CPX42 ist clean. Memory: `project_server_purchase_sequencing`.

---

## 3. SSH-Hardening + Swap

```bash
ssh root@<IPv4>
```

Im Server (als root):

```bash
# Admin-User anlegen
adduser --disabled-password --gecos "" admin
usermod -aG sudo admin
passwd -l admin

# SSH-Key kopieren
mkdir -p /home/admin/.ssh
cp /root/.ssh/authorized_keys /home/admin/.ssh/
chmod 700 /home/admin/.ssh
chmod 600 /home/admin/.ssh/authorized_keys
chown -R admin:admin /home/admin/.ssh

# Sudo NOPASSWD
echo "admin ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/admin-nopasswd
chmod 440 /etc/sudoers.d/admin-nopasswd
visudo -c -f /etc/sudoers.d/admin-nopasswd

# Swap (4 GB RAM → 2 GB Swap-Puffer für pg_dump + Docker-Rebuild)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl -w vm.swappiness=10
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf

# System-Update + fail2ban + unattended-upgrades
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get -yq upgrade
DEBIAN_FRONTEND=noninteractive apt-get -yq install fail2ban unattended-upgrades curl ca-certificates gnupg
dpkg-reconfigure -f noninteractive unattended-upgrades
```

**Verify admin-SSH ausserhalb root-Session:**

```bash
ssh admin@<IPv4> 'sudo whoami'   # Erwartet: root
```

**Erst dann root locken:**

```bash
ssh admin@<IPv4> 'sudo bash -s' <<'EOF'
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'CFG'
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
CFG
sshd -t && systemctl reload ssh
EOF
```

`PermitRootLogin prohibit-password` statt `no` — Coolify-Install-Skript braucht root-via-key-only.

**fail2ban-Whitelist für Docker-Subnets** (sonst bannt fail2ban Coolify-Container nach failed-SSH-Versuchen):

```bash
ssh admin@<IPv4> 'sudo bash -s' <<'EOF'
mkdir -p /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/whitelist-docker.conf <<'CFG'
[DEFAULT]
ignoreip = 127.0.0.1/8 ::1 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 fd00::/8
CFG
systemctl reload fail2ban
EOF
```

---

## 4. Coolify-Install

```bash
ssh admin@<IPv4> 'sudo bash -c "curl -fsSL https://cdn.coollabs.io/coolify/install.sh -o /tmp/coolify-install.sh && bash /tmp/coolify-install.sh"'
```

Dauert ~3-5 min. Endet mit "Coolify is ready".

**Coolify-pubkey für root-Login anlegen** (sonst kann Coolify-Container nicht auf Host zugreifen):

```bash
ssh admin@<IPv4> 'sudo bash -s' <<'EOF'
COOLIFY_PUBKEY=$(ssh-keygen -y -f /data/coolify/ssh/keys/id.root@host.docker.internal)
mkdir -p /root/.ssh && chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys
grep -qF "$COOLIFY_PUBKEY" /root/.ssh/authorized_keys || echo "$COOLIFY_PUBKEY coolify-internal" >> /root/.ssh/authorized_keys
EOF
```

**.env lokal sichern** (Verschlüsselungs-Keys, irreparabel wenn verloren):

```bash
mkdir -p ~/Sites/navigator.berlin/_bmad-output/secrets
ssh admin@<IPv4> 'sudo cat /data/coolify/source/.env' > ~/Sites/navigator.berlin/_bmad-output/secrets/coolify-prod.env.backup
# Folder ist in .gitignore
```

---

## 5. Coolify-Wizard im Browser

SSH-Tunnel öffnen:

```bash
ssh -L 8000:localhost:8000 admin@<IPv4>
# Lassen offen
```

Browser: `http://localhost:8000`

- Setup-Wizard durchklicken: Admin-Email + Passwort
- Server-Type "This Machine" (NICHT "Remote Server" — Coolify deployed sich selbst)
- Falls "Server is not reachable" → siehe Schritt 4 (Coolify-pubkey + PermitRootLogin)

**Instance-FQDN setzen:**

- Settings → Configuration → Instance's Domain (FQDN) = `https://coolify.navigator.berlin`
- Save → Coolify generiert Traefik-Labels + ACME-Cert (10-30 s)

Vor Schritt 6 DNS für `coolify.navigator.berlin` setzen (via Wildcard automatisch).

**API-Token erstellen:**

- Keys & Tokens → API Tokens → Create → `claude-code-prod`, Permissions root → kopieren → lokal:
  ```bash
  mkdir -p ~/.config/navigator && chmod 700 ~/.config/navigator
  echo "TOKEN_HIER" > ~/.config/navigator/coolify-token && chmod 600 ~/.config/navigator/coolify-token
  ```

**Optional: HTTP-Basic-Auth-Schicht** (Memory `project_coolify_basic_auth`): in Coolify-Server-Settings Traefik-Middleware aktivieren.

---

## 6. DNS bei INWX

INWX-Console → navigator.berlin DNS-Records → "Nameserver" → Master-Mode:

| Name | Typ  | Wert     | TTL |
| ---- | ---- | -------- | --- |
| `@`  | A    | `<IPv4>` | 300 |
| `@`  | AAAA | `<IPv6>` | 300 |
| `*`  | A    | `<IPv4>` | 300 |
| `*`  | AAAA | `<IPv6>` | 300 |

TTL 300 für Phase-1-Iteration, nach Hard-Launch auf 3600.

Verify (kann 5-10 min dauern):

```bash
dig +short navigator.berlin A
dig +short test.navigator.berlin A
```

---

## 7. GitHub-App (Coolify-Source)

In Coolify-Dashboard → Sources → New → GitHub App → `navigator-berlin-prod` → Register Now.

GitHub-OAuth durchklicken → Install auf User `mschmdb` → Only `navigator-berlin` → Install & Authorize.

Source-Status grün in Coolify.

---

## 8. Postgres + App per Coolify-API

```bash
export COOLIFY_TOKEN=$(cat ~/.config/navigator/coolify-token | tr -d '\n\r ')
API() { curl -sS -H "Authorization: Bearer $COOLIFY_TOKEN" -H "Accept: application/json" -H "Content-Type: application/json" "https://coolify.navigator.berlin/api/v1$1" "${@:2}"; }

# IDs ermitteln
PROJECT_UUID=$(API "/projects" | jq -r '.[0].uuid')
SERVER_UUID=$(API "/servers" | jq -r '.[0].uuid')
GH_APP_UUID=$(API "/github-apps" | jq -r '.[] | select(.is_public==false) | .uuid')

# Default-Projekt rename
API "/projects/$PROJECT_UUID" -X PATCH -d '{"name":"navigator-berlin","description":"navigator.berlin production"}'

# Postgres-17
PG_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
echo "$PG_PASS" > ~/.config/navigator/postgres-pass && chmod 600 ~/.config/navigator/postgres-pass

PG_RESPONSE=$(API "/databases/postgresql" -X POST -d "$(jq -nc --arg pw "$PG_PASS" --arg srv "$SERVER_UUID" --arg prj "$PROJECT_UUID" '{
  server_uuid: $srv, project_uuid: $prj, environment_name: "production",
  name: "postgres-navigator", description: "Postgres-17 navigator",
  image: "postgres:17-alpine",
  postgres_user: "navigator", postgres_password: $pw, postgres_db: "navigator",
  is_public: false, instant_deploy: true
}')")
PG_UUID=$(echo "$PG_RESPONSE" | jq -r '.uuid')
DB_URL="postgres://navigator:${PG_PASS}@${PG_UUID}:5432/navigator"

# App
APP_RESPONSE=$(API "/applications/private-github-app" -X POST -d "$(jq -nc --arg srv "$SERVER_UUID" --arg prj "$PROJECT_UUID" --arg gh "$GH_APP_UUID" '{
  server_uuid: $srv, project_uuid: $prj, environment_name: "production",
  github_app_uuid: $gh,
  git_repository: "mschmdb/navigator-berlin", git_branch: "main",
  build_pack: "dockerfile", dockerfile_location: "/Dockerfile",
  ports_exposes: "3000",
  name: "navigator-berlin-app", description: "SvelteKit-Production",
  domains: "https://navigator.berlin",
  health_check_path: "/api/healthz", health_check_enabled: true,
  instant_deploy: false
}')")
APP_UUID=$(echo "$APP_RESPONSE" | jq -r '.uuid')

# Env-Vars
add_env() {
  API "/applications/$APP_UUID/envs" -X POST -d "$(jq -nc --arg k "$1" --arg v "$2" --argjson b $3 '{key:$k, value:$v, is_preview:false, is_buildtime:$b, is_runtime:true, is_literal:true}')"
}
add_env NODE_ENV production true
add_env DATABASE_URL "$DB_URL" true
add_env NAVIGATOR_PHASE production true
add_env ORIGIN "https://navigator.berlin" true
add_env PORT 3000 false
add_env HOST 0.0.0.0 false
add_env NOMINATIM_ENDPOINT "https://nominatim.openstreetmap.org" true

# Deploy
API "/deploy?uuid=$APP_UUID&force=true" -X POST
```

Build dauert 8-12 min (Docker-build + Nixpkgs-Pull + pnpm-install + data:aggregate + og:images + vite-build + prerender).

**Verify:**

```bash
curl -sI https://navigator.berlin -m 10
curl -s https://navigator.berlin/api/healthz -m 10   # "ok"
```

---

## 9. Backup-Cron

SSH-Key für CPX22 → CAX21 erzeugen + verteilen:

```bash
# Auf CPX22 als admin
ssh-keygen -t ed25519 -N "" -C "navigator-prod-backup-to-cax21" -f /tmp/sshkey
sudo mkdir -p /root/.ssh-backup
sudo mv /tmp/sshkey /root/.ssh-backup/cax21-id_ed25519
sudo mv /tmp/sshkey.pub /root/.ssh-backup/cax21-id_ed25519.pub
sudo chown root:root /root/.ssh-backup/cax21-id_ed25519 /root/.ssh-backup/cax21-id_ed25519.pub
sudo chmod 600 /root/.ssh-backup/cax21-id_ed25519
sudo chmod 644 /root/.ssh-backup/cax21-id_ed25519.pub

# Pubkey holen
sudo cat /root/.ssh-backup/cax21-id_ed25519.pub
```

Auf CAX21 als root:

```bash
mkdir -p /root/backups/navigator-prod
echo "<pubkey von oben>" >> /root/.ssh/authorized_keys
```

Backup-Skript + Cron auf CPX22 (siehe Memory `project_backup_pipeline` für aktuellen Stand):

```bash
# Script unter /usr/local/bin/navigator-backup.sh (700 root)
# Cron /etc/cron.d/navigator-backup → Sun 04:00 UTC
# Log /var/log/navigator-backup.log + logrotate weekly
```

Test:

```bash
ssh admin@<IPv4> 'sudo /usr/local/bin/navigator-backup.sh'
ls -lh /opt/backups/   # pg-YYYY-MM-DD.sql.gz + coolify-env-YYYY-MM-DD
ssh root@<aux-IPv4> 'ls -lh /root/backups/navigator-prod/'   # gleicher Inhalt
```

---

## 10. Recovery-Pfade

### Postgres komplett verloren

```bash
# Variante A: aus Backup
gunzip -c /opt/backups/pg-LATEST.sql.gz | docker exec -i <pg-container> psql -U navigator navigator

# Variante B: aus Repo (~5 min)
# App-Redeploy in Coolify triggert prebuild → db:migrate + data:aggregate + data:aggregate-scores + data:faq + og:images
```

### Coolify komplett zerstört

```bash
# 1. Server neu provisionieren (Schritt 2)
# 2. Coolify-Install (Schritt 4)
# 3. .env-Backup einspielen statt Wizard durchzulaufen:
ssh admin@<NEW_IPv4> 'sudo systemctl stop coolify'
scp ~/Sites/navigator.berlin/_bmad-output/secrets/coolify-prod.env.backup admin@<NEW_IPv4>:/tmp/
ssh admin@<NEW_IPv4> 'sudo cp /tmp/coolify-prod.env.backup /data/coolify/source/.env && sudo systemctl start coolify'
# 4. GitHub-App neu installieren, alle Services neu deployen
```

### DNS-Hijack / Cert-Compromise

- Hetzner-Cloud-Firewall-Rules verschärfen
- INWX-DNS auf alte IP zurückschalten
- Let's-Encrypt-Cert in Coolify revoken + neu issuen

---

## Anhang: Eingebaute Hilfen + Memory-Referenzen

- `project_server_purchase_sequencing` — CPX22 statt CX33 Begründung
- `project_cax21_aux_server` — Aux-ARM-Server für Off-Server-Backup
- `project_coolify_basic_auth` — Coolify-Dashboard-Schutz
- `project_backup_pipeline` — Aktuelle Backup-Implementation

ADR-015 (Hetzner-CPX22 statt CX32-ARM) wird in Story 4.4 nachdokumentiert.

Stand: 2026-05-17 (Initial Setup-Run).
