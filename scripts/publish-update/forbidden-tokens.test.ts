import { describe, expect, it } from 'vitest';
import { lintBody } from './forbidden-tokens.js';

describe('lintBody', () => {
	it('clean body → ok true', () => {
		const r = lintBody('Alles in Ordnung. Keine verbotenen Token hier.');
		expect(r.ok).toBe(true);
		expect(r.violations).toEqual([]);
	});

	it('em-dash → violation', () => {
		const r = lintBody('Zwei Sätze — verbunden mit em-dash.');
		expect(r.ok).toBe(false);
		expect(r.violations[0]?.token).toBe('em-dash');
	});

	it('lebenswert → violation (case-insensitive)', () => {
		expect(lintBody('Sehr lebenswert hier.').ok).toBe(false);
		expect(lintBody('Lebenswertigkeit ist relativ.').ok).toBe(false);
		expect(lintBody('Wertschätzung ist okay.').ok).toBe(true);
	});

	it('env-var-uppercase → violation', () => {
		expect(lintBody('Konfiguration via API_KEY.').ok).toBe(false);
		expect(lintBody('Setze DATABASE_URL korrekt.').ok).toBe(false);
		// Lowercase im Fließtext darf nicht matchen
		expect(lintBody('Funktion ruft helper api auf.').ok).toBe(true);
	});

	it('hetzner / cpx / cax → violation', () => {
		expect(lintBody('Server bei Hetzner.').ok).toBe(false);
		expect(lintBody('Wir nutzen CPX22.').ok).toBe(false);
		expect(lintBody('Auf CAX21 läuft Plausible.').ok).toBe(false);
		expect(lintBody('Bei einem deutschen Anbieter.').ok).toBe(true);
	});

	it('coolify / traefik / crowdsec / lefthook → violation', () => {
		expect(lintBody('Coolify steuert den Deploy.').ok).toBe(false);
		expect(lintBody('Traefik routet die Requests.').ok).toBe(false);
		expect(lintBody('CrowdSec blockt Bots.').ok).toBe(false);
		expect(lintBody('Lefthook prüft pre-commit.').ok).toBe(false);
	});

	it('github-actions-pfad → violation', () => {
		expect(lintBody('Workflow in .github/workflows/deploy.yml.').ok).toBe(false);
	});

	it('commit-sha (7-40 hex) → violation', () => {
		expect(lintBody('Siehe Commit abc1234.').ok).toBe(false);
		expect(lintBody('Volle SHA: abcdef1234567890abcdef1234567890abcdef12.').ok).toBe(false);
		// Hex-Sequenz < 7 Zeichen darf nicht matchen
		expect(lintBody('Farbcode #abc123.').ok).toBe(true);
	});

	it('docker / docker.io → violation', () => {
		expect(lintBody('Via docker-compose deployed.').ok).toBe(false);
		expect(lintBody('Image von docker.io geholt.').ok).toBe(false);
	});

	it('absolute fs path → violation', () => {
		expect(lintBody('Im Pfad /Users/matze/Sites/ liegt der Code.').ok).toBe(false);
		expect(lintBody('Unter /home/admin/app verfügbar.').ok).toBe(false);
		expect(lintBody('Relativ-Pfad src/lib darf bleiben.').ok).toBe(true);
	});

	it('mietpreis €/m² → violation', () => {
		expect(lintBody('Bei 12,50 €/m² Miete.').ok).toBe(false);
		expect(lintBody('Im Bereich 8 €/m2.').ok).toBe(false);
		expect(lintBody('Mietspiegel-Klasse mittel.').ok).toBe(true);
	});

	it('mehrere Verstöße werden alle gesammelt + line-number korrekt', () => {
		const body = 'Zeile 1\nHetzner-Server — toll\nZeile 3\nDATABASE_URL=geheim';
		const r = lintBody(body);
		expect(r.ok).toBe(false);
		// Hetzner zeile 2 + em-dash zeile 2 + env-var zeile 4
		expect(r.violations.some((v) => v.token === 'hetzner' && v.line === 2)).toBe(true);
		expect(r.violations.some((v) => v.token === 'em-dash' && v.line === 2)).toBe(true);
		expect(r.violations.some((v) => v.line === 4)).toBe(true);
	});
});
