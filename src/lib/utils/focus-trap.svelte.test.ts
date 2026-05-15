import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { getFocusableElements, createFocusTrap } from './focus-trap.js';

let host: HTMLDivElement;

beforeEach(() => {
	host = document.createElement('div');
	document.body.appendChild(host);
});

afterEach(() => {
	host.remove();
});

describe('getFocusableElements', () => {
	it('liefert sichtbare Buttons + Links + Inputs', () => {
		host.innerHTML = `
			<button>a</button>
			<a href="/x">b</a>
			<input type="text" />
			<button disabled>c</button>
			<input type="hidden" />
		`;
		const els = getFocusableElements(host);
		expect(els).toHaveLength(3);
	});

	it('ignoriert tabindex=-1', () => {
		host.innerHTML = `
			<button>a</button>
			<button tabindex="-1">b</button>
		`;
		const els = getFocusableElements(host);
		expect(els).toHaveLength(1);
	});

	it('leerer Container liefert leeres Array', () => {
		expect(getFocusableElements(host)).toEqual([]);
	});
});

describe('createFocusTrap', () => {
	it('Tab am letzten Element cycelt zum ersten', () => {
		host.innerHTML = `
			<button data-testid="a">a</button>
			<button data-testid="b">b</button>
			<button data-testid="c">c</button>
		`;
		const trap = createFocusTrap(host);
		const c = host.querySelector('[data-testid="c"]') as HTMLButtonElement;
		c.focus();
		const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		trap.handleKeydown(e);
		expect(e.defaultPrevented).toBe(true);
	});

	it('Shift+Tab am ersten Element cycelt zum letzten', () => {
		host.innerHTML = `
			<button data-testid="a">a</button>
			<button data-testid="b">b</button>
		`;
		const trap = createFocusTrap(host);
		const a = host.querySelector('[data-testid="a"]') as HTMLButtonElement;
		a.focus();
		const e = new KeyboardEvent('keydown', {
			key: 'Tab',
			shiftKey: true,
			bubbles: true,
			cancelable: true
		});
		trap.handleKeydown(e);
		expect(e.defaultPrevented).toBe(true);
	});

	it('non-Tab-Keys werden nicht abgefangen', () => {
		host.innerHTML = `<button>a</button>`;
		const trap = createFocusTrap(host);
		const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
		trap.handleKeydown(e);
		expect(e.defaultPrevented).toBe(false);
	});
});
