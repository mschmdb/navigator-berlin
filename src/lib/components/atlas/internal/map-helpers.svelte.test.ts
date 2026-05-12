import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { announceMapStatus, clearMapStatus, MAP_STATUS_ID } from './map-helpers.js';

describe('announceMapStatus', () => {
	beforeEach(() => {
		document.body.innerHTML = `<div id="${MAP_STATUS_ID}" aria-live="polite"></div>`;
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = '';
	});

	it('setzt textContent der Live-Region', () => {
		announceMapStatus('Adresse ausgewählt: Boxhagener Straße 12');
		const el = document.getElementById(MAP_STATUS_ID);
		expect(el?.textContent).toBe('Adresse ausgewählt: Boxhagener Straße 12');
	});

	it('no-op wenn Element fehlt', () => {
		document.body.innerHTML = '';
		expect(() => announceMapStatus('test')).not.toThrow();
	});

	it('clear-timeout leert Text nach 5s default', () => {
		announceMapStatus('Karte gezoomt');
		vi.advanceTimersByTime(5000);
		const el = document.getElementById(MAP_STATUS_ID);
		expect(el?.textContent).toBe('');
	});

	it('Re-Announce ersetzt vorherigen Text und resettet Timer', () => {
		announceMapStatus('Erster Text');
		vi.advanceTimersByTime(2000);
		announceMapStatus('Zweiter Text');
		const el = document.getElementById(MAP_STATUS_ID);
		expect(el?.textContent).toBe('Zweiter Text');
		vi.advanceTimersByTime(3000);
		expect(el?.textContent).toBe('Zweiter Text');
		vi.advanceTimersByTime(2000);
		expect(el?.textContent).toBe('');
	});

	it('clearMapStatus leert sofort', () => {
		announceMapStatus('Etwas');
		clearMapStatus();
		const el = document.getElementById(MAP_STATUS_ID);
		expect(el?.textContent).toBe('');
	});

	it('custom timeout via Option', () => {
		announceMapStatus('Test', { clearAfterMs: 1000 });
		vi.advanceTimersByTime(999);
		expect(document.getElementById(MAP_STATUS_ID)?.textContent).toBe('Test');
		vi.advanceTimersByTime(1);
		expect(document.getElementById(MAP_STATUS_ID)?.textContent).toBe('');
	});

	it('timeout=0 deaktiviert Auto-Clear', () => {
		announceMapStatus('Persistent', { clearAfterMs: 0 });
		vi.advanceTimersByTime(60_000);
		expect(document.getElementById(MAP_STATUS_ID)?.textContent).toBe('Persistent');
	});
});
