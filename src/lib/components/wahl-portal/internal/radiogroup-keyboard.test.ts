import { describe, expect, it } from 'vitest';
import { nextRadioIndex } from './radiogroup-keyboard.js';

describe('nextRadioIndex', () => {
	it('ArrowRight/ArrowDown rückt einen Index vor, mit Wrap-Around', () => {
		expect(nextRadioIndex('ArrowRight', 0, 3)).toBe(1);
		expect(nextRadioIndex('ArrowDown', 2, 3)).toBe(0);
	});

	it('ArrowLeft/ArrowUp geht einen Index zurück, mit Wrap-Around', () => {
		expect(nextRadioIndex('ArrowLeft', 1, 3)).toBe(0);
		expect(nextRadioIndex('ArrowUp', 0, 3)).toBe(2);
	});

	it('Home springt auf 0, End auf den letzten Index', () => {
		expect(nextRadioIndex('Home', 2, 5)).toBe(0);
		expect(nextRadioIndex('End', 0, 5)).toBe(4);
	});

	it('unbekannte Keys liefern null', () => {
		expect(nextRadioIndex('Tab', 0, 3)).toBeNull();
		expect(nextRadioIndex('a', 0, 3)).toBeNull();
	});

	it('leere Gruppe liefert immer null', () => {
		expect(nextRadioIndex('ArrowRight', 0, 0)).toBeNull();
	});
});
