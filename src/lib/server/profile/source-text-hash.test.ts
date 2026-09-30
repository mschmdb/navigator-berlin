import { describe, expect, it } from 'vitest';
import { hashProfileParagraphs, splitParagraphs } from './source-text-hash.js';

describe('hashProfileParagraphs', () => {
	it('liefert 16 Hex-Zeichen', () => {
		expect(hashProfileParagraphs(['a'])).toMatch(/^[0-9a-f]{16}$/);
	});
	it('ignoriert Whitespace-Unterschiede', () => {
		expect(hashProfileParagraphs(['a  b\n c'])).toBe(hashProfileParagraphs(['a b c']));
	});
	it('erkennt Textänderung und Absatz-Reihenfolge', () => {
		expect(hashProfileParagraphs(['a'])).not.toBe(hashProfileParagraphs(['b']));
		expect(hashProfileParagraphs(['a', 'b'])).not.toBe(hashProfileParagraphs(['b', 'a']));
	});
});

describe('splitParagraphs', () => {
	it('trennt an Leerzeilen und trimmt', () => {
		expect(splitParagraphs('\n a \n\n\n b\n')).toEqual(['a', 'b']);
	});
});
