import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HomeSaisonTeasers from './home-saison-teasers.svelte';

function order(): string[] {
	return [...document.querySelectorAll('[data-testid$="-teaser"]')].map((el) =>
		el.getAttribute('data-testid')!.replace('home-', '').replace('-teaser', '')
	);
}

function isCompact(name: 'hitze' | 'kaelte'): boolean {
	return document.querySelector(`[data-testid="home-${name}-teaser-lead"]`) === null;
}

describe('HomeSaisonTeasers', () => {
	it('stellt in der Kälte-Saison (17.10.) Kälte zuerst und groß, Hitze kompakt', () => {
		render(HomeSaisonTeasers, { now: new Date('2026-10-17T10:00:00Z') });
		expect(order()).toEqual(['kaelte', 'hitze']);
		expect(isCompact('kaelte')).toBe(false);
		expect(isCompact('hitze')).toBe(true);
	});

	it('stellt im Sommer (15.07.) Hitze zuerst und groß, Kälte kompakt', () => {
		render(HomeSaisonTeasers, { now: new Date('2026-07-15T10:00:00Z') });
		expect(order()).toEqual(['hitze', 'kaelte']);
		expect(isCompact('hitze')).toBe(false);
		expect(isCompact('kaelte')).toBe(true);
	});

	it('Saisongrenzen: 30.04. Kälte-Saison, 01.05. Sommer', () => {
		const a = render(HomeSaisonTeasers, { now: new Date('2026-04-30T10:00:00Z') });
		expect(order()[0]).toBe('kaelte');
		a.unmount();
		render(HomeSaisonTeasers, { now: new Date('2026-05-01T10:00:00Z') });
		expect(order()[0]).toBe('hitze');
	});

	it.each([
		['2026-09-30T10:00:00Z', 'hitze'],
		['2026-10-01T10:00:00Z', 'kaelte'],
		['2026-04-30T22:30:00Z', 'hitze']
	])('%s: %s zuerst (Berliner Datum zählt)', (iso, first) => {
		render(HomeSaisonTeasers, { now: new Date(iso) });
		expect(order()[0]).toBe(first);
	});
});
