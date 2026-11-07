import { describe, expect, it } from 'vitest';
import { mixHex, textOn } from './kontrast';
import { STORY_INK, STORY_PAPER } from '../tokens';

describe('textOn', () => {
	it('wählt Papier auf dunklen Blöcken', () => {
		expect(textOn('#3b3936')).toBe(STORY_PAPER);
		expect(textOn('#E3000F')).toBe(STORY_PAPER);
	});

	it('wählt Tinte auf hellen Blöcken', () => {
		expect(textOn('#FFEF00')).toBe(STORY_INK);
		expect(textOn('#8d887d')).toBe(STORY_INK);
	});

	it('setzt Tinte auf Papier und Papier auf Tinte', () => {
		expect(textOn(STORY_PAPER)).toBe(STORY_INK);
		expect(textOn(STORY_INK)).toBe(STORY_PAPER);
	});
});

describe('mixHex', () => {
	it('mischt linear je Kanal und rundet', () => {
		expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
		expect(mixHex('#E3000F', '#efe6d2', 0)).toBe('#e3000f');
		expect(mixHex('#E3000F', '#efe6d2', 1)).toBe('#efe6d2');
	});

	it('lehnt ungültige Farben ab', () => {
		expect(() => mixHex('red', '#ffffff', 0.5)).toThrow(RangeError);
	});
});
