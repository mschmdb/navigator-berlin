import { describe, it, expect } from 'vitest';
import { MESSAGE_FILE_PATTERNS } from './lint-wahl-editorial.js';
import {
	WAHL_FORBIDDEN_PATTERNS,
	WAHL_FORBIDDEN_PATTERNS_EN
} from './wahlen/lib/wahl-forbidden-tokens.js';

/**
 * Review-Fund (i18n Block B): die Datei-zu-Musterliste-Zuordnung war bisher
 * nur implizit über `main()` geprüft. Dieser Test belegt direkt, dass
 * `messages/de.json` die DE-Musterliste bekommt und `messages/en.json`
 * ausschließlich die EN-Musterliste (Boundary: "EN bekommt eigene
 * Forbidden-Tokens (nur auf en.json)").
 *
 * Der Import allein löst KEINEN `main()`-Lauf aus (Guard
 * `import.meta.url === file://${process.argv[1]}` in `lint-wahl-editorial.ts`
 * greift unter vitest nicht, `process.argv[1]` ist dort das Vitest-Binary,
 * nicht dieses Skript).
 */
describe('MESSAGE_FILE_PATTERNS', () => {
	it('ordnet messages/de.json der DE-Musterliste zu', () => {
		const entry = MESSAGE_FILE_PATTERNS.find((e) => e.path === 'messages/de.json');
		expect(entry).toBeDefined();
		expect(entry?.patterns).toBe(WAHL_FORBIDDEN_PATTERNS);
	});

	it('ordnet messages/en.json AUSSCHLIESSLICH der EN-Musterliste zu (nicht der DE-Liste)', () => {
		const entry = MESSAGE_FILE_PATTERNS.find((e) => e.path === 'messages/en.json');
		expect(entry).toBeDefined();
		expect(entry?.patterns).toBe(WAHL_FORBIDDEN_PATTERNS_EN);
		expect(entry?.patterns).not.toBe(WAHL_FORBIDDEN_PATTERNS);
	});

	it('deckt genau die beiden Message-Dateien ab, keine weiteren/fehlenden Eintraege', () => {
		expect(MESSAGE_FILE_PATTERNS.map((e) => e.path).sort()).toEqual([
			'messages/de.json',
			'messages/en.json'
		]);
	});
});
