import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	announceGlobal,
	clearGlobalLive,
	GLOBAL_LIVE_ID_ASSERTIVE,
	GLOBAL_LIVE_ID_POLITE
} from './aria-live.js';

describe('aria-live', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<div id="${GLOBAL_LIVE_ID_POLITE}" aria-live="polite"></div>
			<div id="${GLOBAL_LIVE_ID_ASSERTIVE}" aria-live="assertive"></div>
		`;
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = '';
	});

	it('setzt textContent in polite-Channel default', () => {
		announceGlobal('Adresse ausgewählt');
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('Adresse ausgewählt');
		expect(document.getElementById(GLOBAL_LIVE_ID_ASSERTIVE)?.textContent).toBe('');
	});

	it('Level assertive zielt auf assertive-Channel', () => {
		announceGlobal('Fehler', 'assertive');
		expect(document.getElementById(GLOBAL_LIVE_ID_ASSERTIVE)?.textContent).toBe('Fehler');
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('');
	});

	it('Clear-Timeout leert Text nach 5s', () => {
		announceGlobal('Test');
		vi.advanceTimersByTime(5000);
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('');
	});

	it('Re-Announce resettet Timer und ersetzt Text', () => {
		announceGlobal('A');
		vi.advanceTimersByTime(2000);
		announceGlobal('B');
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('B');
		vi.advanceTimersByTime(3000);
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('B');
		vi.advanceTimersByTime(2000);
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('');
	});

	it('no-op wenn Element fehlt', () => {
		document.body.innerHTML = '';
		expect(() => announceGlobal('test')).not.toThrow();
	});

	it('custom clearAfterMs', () => {
		announceGlobal('X', 'polite', { clearAfterMs: 1000 });
		vi.advanceTimersByTime(999);
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('X');
		vi.advanceTimersByTime(1);
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('');
	});

	it('clearAfterMs=0 deaktiviert Auto-Clear', () => {
		announceGlobal('Persistent', 'polite', { clearAfterMs: 0 });
		vi.advanceTimersByTime(60_000);
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('Persistent');
	});

	it('clearGlobalLive räumt sofort + canceled Timer', () => {
		announceGlobal('Etwas');
		clearGlobalLive();
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('');
	});

	it('Polite und Assertive haben unabhängige Timer', () => {
		announceGlobal('P', 'polite', { clearAfterMs: 1000 });
		announceGlobal('A', 'assertive', { clearAfterMs: 3000 });
		vi.advanceTimersByTime(1000);
		expect(document.getElementById(GLOBAL_LIVE_ID_POLITE)?.textContent).toBe('');
		expect(document.getElementById(GLOBAL_LIVE_ID_ASSERTIVE)?.textContent).toBe('A');
		vi.advanceTimersByTime(2000);
		expect(document.getElementById(GLOBAL_LIVE_ID_ASSERTIVE)?.textContent).toBe('');
	});
});
