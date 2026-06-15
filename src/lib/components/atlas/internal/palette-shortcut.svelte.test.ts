import { describe, expect, it } from 'vitest';
import { shouldHandleSlash, isFocusInTextInput } from './palette-shortcut.js';

function ev(
	key: string,
	target: HTMLElement | null = null,
	opts: KeyboardEventInit = {}
): KeyboardEvent {
	const e = new KeyboardEvent('keydown', { key, ...opts });
	if (target) Object.defineProperty(e, 'target', { value: target });
	return e;
}

describe('isFocusInTextInput', () => {
	it('true für input', () => {
		const el = document.createElement('input');
		expect(isFocusInTextInput(el)).toBe(true);
	});

	it('true für textarea', () => {
		const el = document.createElement('textarea');
		expect(isFocusInTextInput(el)).toBe(true);
	});

	it('true für contenteditable', () => {
		const el = document.createElement('div');
		el.setAttribute('contenteditable', 'true');
		expect(isFocusInTextInput(el)).toBe(true);
	});

	it('false für button', () => {
		const el = document.createElement('button');
		expect(isFocusInTextInput(el)).toBe(false);
	});

	it('false für null', () => {
		expect(isFocusInTextInput(null)).toBe(false);
	});
});

describe('shouldHandleSlash', () => {
	it('true für plain "/" mit Body-Target', () => {
		expect(shouldHandleSlash(ev('/', document.body))).toBe(true);
	});

	it('false für andere Keys', () => {
		expect(shouldHandleSlash(ev('a', document.body))).toBe(false);
	});

	it('false wenn Modifier gedrückt', () => {
		expect(shouldHandleSlash(ev('/', document.body, { ctrlKey: true }))).toBe(false);
		expect(shouldHandleSlash(ev('/', document.body, { metaKey: true }))).toBe(false);
		expect(shouldHandleSlash(ev('/', document.body, { altKey: true }))).toBe(false);
	});

	it('false wenn Focus in Input', () => {
		const input = document.createElement('input');
		expect(shouldHandleSlash(ev('/', input))).toBe(false);
	});

	it('false wenn isComposing', () => {
		expect(shouldHandleSlash(ev('/', document.body, { isComposing: true }))).toBe(false);
	});
});
