import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import HomeSearchHero from './home-search-hero.svelte';

afterEach(() => overwriteGetLocale(() => 'de'));

const geocode = vi.fn(async () => []);

describe('HomeSearchHero', () => {
	it('zeigt den Fragetitel als h1 und ein Suchfeld', () => {
		render(HomeSearchHero, { geocode });
		expect(document.querySelector('h1')?.textContent).toBe('Wie lebt es sich an deiner Adresse?');
		expect(document.querySelector('input[role="combobox"]')).not.toBeNull();
	});

	it('EN: englischer Titel', () => {
		overwriteGetLocale(() => 'en');
		render(HomeSearchHero, { geocode });
		expect(document.querySelector('h1')?.textContent).toBe(
			'How is life at your address?'
		);
	});

	it('hat drei Beispiel-Links auf /explore mit address und q', () => {
		render(HomeSearchHero, { geocode });
		const links = [...document.querySelectorAll('[data-testid="home-search-examples"] a')];
		expect(links).toHaveLength(3);
		expect(links.map((a) => a.textContent?.trim())).toEqual([
			'Hermannplatz',
			'Kollwitzplatz',
			'Frohnau'
		]);
		for (const a of links) {
			expect(a.getAttribute('href')).toMatch(/^\/explore\?address=[\d.]+%2C[\d.]+&q=/);
		}
	});

	it('EN: Beispiel-Links mit /en-Präfix', () => {
		overwriteGetLocale(() => 'en');
		render(HomeSearchHero, { geocode });
		const first = document.querySelector('[data-testid="home-search-examples"] a');
		expect(first?.getAttribute('href')).toMatch(/^\/en\/explore\?address=/);
	});

	it('Beispiel-Links tragen die Mindest-Klickziel-Klasse', () => {
		render(HomeSearchHero, { geocode });
		for (const a of document.querySelectorAll('[data-testid="home-search-examples"] a')) {
			expect(a.className).toContain('min-h-(--target-min)');
		}
	});

	it('Kein Treffer: keine Navigation', async () => {
		const navigate = vi.fn();
		render(HomeSearchHero, { geocode: vi.fn(async () => []), navigate });
		await page.getByRole('combobox').fill('xyzxyz');
		await new Promise((r) => setTimeout(r, 400));
		expect(navigate).not.toHaveBeenCalled();
	});

	it.each([
		['de', '/explore?address=13.4243%2C52.4869&q=Hermannplatz%2C+Berlin'],
		['en', '/en/explore?address=13.4243%2C52.4869&q=Hermannplatz%2C+Berlin']
	] as const)('Treffer (%s): navigiert zur Karte an diesem Punkt', async (locale, expected) => {
		overwriteGetLocale(() => locale);
		const navigate = vi.fn();
		const suggestion = {
			id: '1',
			displayName: 'Hermannplatz, Berlin',
			lat: 52.4869,
			lng: 13.4243,
			type: 'square',
			addresstype: 'square'
		};
		render(HomeSearchHero, { geocode: vi.fn(async () => [suggestion]), navigate });
		const input = page.getByRole('combobox');
		await input.fill('Hermannplatz');
		await vi.waitFor(() =>
			expect(document.querySelector('[aria-live="polite"]')?.textContent).toMatch(/1/)
		);
		await userEvent.keyboard('{ArrowDown}');
		await userEvent.keyboard('{ArrowDown}');
		await userEvent.keyboard('{Enter}');
		await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(expected));
	});

	it('zeigt das Kiez-Score-Bild als Link, nur ab md', () => {
		render(HomeSearchHero, { geocode });
		const a = document.querySelector('[data-testid="home-preview-kiez-score"]')!;
		expect(a.getAttribute('href')).toMatch(/^\/explore\?layers=kiez-score-ruhe-luft/);
		expect(a.classList.contains('hidden')).toBe(true);
		expect(a.classList.contains('md:block')).toBe(true);
		const img = a.querySelector('img')!;
		expect(img.getAttribute('loading')).toBe('lazy');
		expect(img.alt).toContain('Kiez-Score');
	});

	it('EN: Bild-Link mit /en-Präfix und englischem Alt-Text', () => {
		overwriteGetLocale(() => 'en');
		render(HomeSearchHero, { geocode });
		const a = document.querySelector('[data-testid="home-preview-kiez-score"]')!;
		expect(a.getAttribute('href')).toMatch(/^\/en\/explore\?layers=/);
		expect(a.querySelector('img')?.getAttribute('src')).toBe('/home/en/kiez-score.webp');
		expect(a.querySelector('img')!.alt).toMatch(/^Map of Berlin/);
	});

	it('Hero-Bild-Link bleibt fokussierbar', () => {
		render(HomeSearchHero, { geocode });
		const a = document.querySelector('[data-testid="home-preview-kiez-score"]')!;
		expect(a.hasAttribute('tabindex')).toBe(false);
		expect(a.hasAttribute('aria-hidden')).toBe(false);
	});

	it('Vorschaubild hat Rahmen und Radius', () => {
		render(HomeSearchHero, { geocode });
		const cls = document.querySelector('[data-testid="home-preview-kiez-score"]')!.classList;
		expect(cls).toContain('rounded');
		expect(cls).toContain('border');
		expect(cls).toContain('border-rule');
	});
});
