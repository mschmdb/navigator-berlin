import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import HomeSeasonNote from './home-season-note.svelte';

afterEach(() => overwriteGetLocale(() => 'de'));

function href(): string | null {
	return document.querySelector('[data-testid="home-season-note"] a')?.getAttribute('href') ?? null;
}

describe('HomeSeasonNote', () => {
	it.each([
		['2026-10-17T10:00:00Z', '/kaelte'],
		['2026-04-30T10:00:00Z', '/kaelte'],
		['2026-05-01T10:00:00Z', '/hitze'],
		['2026-07-15T10:00:00Z', '/hitze'],
		['2026-09-30T10:00:00Z', '/hitze'],
		['2026-10-01T10:00:00Z', '/kaelte'],
		['2026-04-30T22:30:00Z', '/hitze'],
		['2026-09-30T22:30:00Z', '/kaelte']
	])('%s verlinkt %s', (iso, expected) => {
		render(HomeSeasonNote, { now: new Date(iso) });
		expect(href()).toBe(expected);
	});

	it('rendert genau einen Link', () => {
		render(HomeSeasonNote, { now: new Date('2026-07-15T10:00:00Z') });
		expect(document.querySelectorAll('[data-testid="home-season-note"] a')).toHaveLength(1);
	});

	it('EN: Link mit /en-Präfix', () => {
		overwriteGetLocale(() => 'en');
		render(HomeSeasonNote, { now: new Date('2026-07-15T10:00:00Z') });
		expect(href()).toBe('/en/hitze');
	});
});
