import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import HeroMapCard from './hero-map-card.svelte';

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe('hero-map-card.svelte', () => {
	it('rendert figure mit figcaption, Titel, Inhalt und Aktion', () => {
		render(HeroMapCard, {
			title: 'Lage im Bezirk Mitte',
			children: snip('<div data-testid="inhalt"></div>'),
			action: snip('<a href="/x" data-testid="aktion">Karte</a>')
		});
		const figure = document.querySelector('figure[data-testid="hero-map-card"]');
		expect(figure).not.toBeNull();
		expect(figure?.querySelector('figcaption')?.textContent).toContain('Lage im Bezirk Mitte');
		expect(figure?.querySelector('[data-testid="inhalt"]')).not.toBeNull();
		expect(figure?.querySelector('[data-testid="aktion"]')).not.toBeNull();
	});

	it('zeigt die Beschreibung in der figcaption', () => {
		render(HeroMapCard, {
			title: 'Titel',
			description: snip('<span>Erklärung</span>'),
			children: snip('<div></div>')
		});
		expect(document.querySelector('figcaption')?.textContent).toContain('Erklärung');
	});

	it('lässt Beschreibung und Aktion weg, wenn nicht gesetzt', () => {
		render(HeroMapCard, { title: 'Titel', children: snip('<div></div>') });
		expect(document.querySelector('[data-testid="hero-map-card-description"]')).toBeNull();
		expect(document.querySelector('a')).toBeNull();
	});

	it('setzt die Aktion nach der Erklärung (Tab-Reihenfolge)', () => {
		render(HeroMapCard, {
			title: 'T',
			description: snip('<a href="/e" data-testid="erklaerung">E</a>'),
			children: snip('<div></div>'),
			action: snip('<a href="/x" data-testid="aktion">K</a>')
		});
		const links = [...document.querySelectorAll('a')].map((a) => a.dataset.testid);
		expect(links).toEqual(['erklaerung', 'aktion']);
	});
});
