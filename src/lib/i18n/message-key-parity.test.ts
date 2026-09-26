/**
 * Key-Paritaets-Test `messages/de.json` <-> `messages/en.json` (Spec i18n
 * Block B, I/O-Matrix "Fehlender EN-Key"). DE bleibt Master (ADR-005); ein
 * Key ohne EN-Gegenstueck faellt zur Laufzeit still auf den DE-Text zurueck
 * (Paraglide `baseLocale`-Fallback) -- dieser Test macht das sichtbar statt
 * es unbemerkt zu lassen.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadMessages(locale: 'de' | 'en'): Record<string, unknown> {
	const raw = readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8');
	return JSON.parse(raw) as Record<string, unknown>;
}

function keySet(messages: Record<string, unknown>): Set<string> {
	return new Set(Object.keys(messages).filter((k) => k !== '$schema'));
}

describe('messages/de.json <-> messages/en.json Key-Paritaet', () => {
	it('jeder DE-Key hat ein EN-Gegenstueck', () => {
		const de = keySet(loadMessages('de'));
		const en = keySet(loadMessages('en'));
		const missingInEn = [...de].filter((k) => !en.has(k)).sort();
		expect(missingInEn).toEqual([]);
	});

	it('en.json hat keine verwaisten Keys ohne DE-Quelle', () => {
		const de = keySet(loadMessages('de'));
		const en = keySet(loadMessages('en'));
		const missingInDe = [...en].filter((k) => !de.has(k)).sort();
		expect(missingInDe).toEqual([]);
	});
});
