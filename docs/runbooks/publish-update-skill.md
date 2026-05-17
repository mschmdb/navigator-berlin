# Runbook · publish-update-Skill

Story 5.8 · Skill-getriebener Workflow für `/updates`-Einträge aus Commit-Ranges.

## Voraussetzung

Lokales Git-Checkout, `pnpm install` einmalig gelaufen, Story 2.13 deployt. Working-Tree clean.

## Trigger

```bash
claude /publish-update HEAD~7..HEAD
# oder
claude /publish-update --since=2026-05-09
# oder
claude /publish-update --commit=abc1234
# oder ohne Argument (default: letzte 24h)
claude /publish-update
```

Alternativ direkt ohne Skill:

```bash
pnpm publish-update HEAD~7..HEAD
```

## Review-Schritte (Editorial-Gate)

1. Drafts in `_content/updates/_drafts/` öffnen.
2. **`_FAIL_*.md`-Drafts:** entweder Lint-Verstöße im Body korrigieren (em-dashes, internal-Tokens, Mietpreis-Werte) oder Draft verwerfen.
3. Verbleibende Drafts inhaltlich prüfen: Brand-Tone, Faktentreue, keine versteckten Leaks, kein „lebenswert", keine Hostnames.
4. Promote via:
   ```bash
   git mv _content/updates/_drafts/2026-05-20-foo.md _content/updates/2026-05-20-foo.md
   ```
5. `pnpm dev` lokal: `/updates` rendert den Entry korrekt.
6. Commit + Push wie in [add-update-entry.md](./add-update-entry.md) Schritt 5-6.

## Bei Lint-Verstoß

`_FAIL_`-Datei NICHT promoten. Optionen:

- **Edit:** Body bereinigen, `_FAIL_`-Header + `_FAIL_`-Präfix entfernen, dann `git mv` ohne Präfix.
- **Verwerfen:** `rm _content/updates/_drafts/_FAIL_*.md`, ggf. Skill nochmal mit `--commit=<sha>` laufen lassen.

## Anti-Patterns

- Drafts NIE direkt nach `_content/updates/` committen ohne Review.
- `_FAIL_`-Header NIE im Final-File belassen (Public-Sichtbar).
- Skill NIE automatisch via post-commit-hook oder cron triggern (Phase-2-Goal, nicht Phase-1).

## Wartung

Bei häufigen `_FAIL_`-Drafts auf gleiche Tokens → Allowlist/Denylist oder Forbidden-Token-Liste prüfen:

- Allowlist: `scripts/publish-update/filter-commit.ts`
- Forbidden-Tokens: `scripts/publish-update/forbidden-tokens.ts`
- System-Prompt: `scripts/publish-update/system-prompt.txt`

Nach Änderung an System-Prompt: 1 manueller Real-Commit-Test, bevor du dem Subagent wieder vertraust.

## Bezug zu add-update-entry

Manueller Workflow nach [add-update-entry.md](./add-update-entry.md) bleibt gültig — Skill ist Hebel, nicht Pflicht. Bei kleinen Hand-Tweaks (1 Update, klar formulierbar in 5 Min) ist Manual schneller als Skill.
