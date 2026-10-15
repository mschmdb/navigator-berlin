import { describe, expect, it } from 'vitest';
import de from '../../../../messages/de.json';
import en from '../../../../messages/en.json';
import { isUeberLinkName, UEBER_LINKS, UEBER_LINK_NAMES } from './ueber-links.js';

const catalogs = { de, en } as const;

const ueberEntries = (messages: Record<string, unknown>): [string, string][] =>
	Object.entries(messages)
		.filter(([key]) => key.startsWith('ueber_'))
		.map(([key, value]) => [key, String(value)]);

describe.each(Object.entries(catalogs))('ueber_* Messages (%s)', (_locale, messages) => {
	const entries = ueberEntries(messages);

	it('enthält Messages', () => {
		expect(entries.length).toBeGreaterThan(20);
	});

	it('jeder {name_start}-Platzhalter hat einen Eintrag in UEBER_LINKS und ein {name_end}', () => {
		for (const [key, text] of entries) {
			for (const [, name] of text.matchAll(/\{(\w+?)_start\}/g)) {
				expect(isUeberLinkName(name ?? ''), `${key}: ${name}`).toBe(true);
				expect(text, `${key}: ${name}_end`).toContain(`{${name}_end}`);
			}
		}
	});
});

describe('UEBER_LINKS', () => {
	it('deckt jeden Namen ab, und jeder Name kommt in beiden Sprachen vor', () => {
		expect(Object.keys(UEBER_LINKS).sort()).toEqual([...UEBER_LINK_NAMES].sort());
		for (const [locale, messages] of Object.entries(catalogs)) {
			const joined = ueberEntries(messages)
				.map(([, text]) => text)
				.join('\n');
			for (const name of UEBER_LINK_NAMES) {
				expect(joined, `${locale}: ${name}`).toContain(`{${name}_start}`);
			}
		}
	});
});
