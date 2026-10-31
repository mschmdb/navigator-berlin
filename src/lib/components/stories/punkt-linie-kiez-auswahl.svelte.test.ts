import { flushSync } from 'svelte';
import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackEvent } from '$lib/utils/plausible.js';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { BezirkItem, KennzahlenQuelle } from '$lib/stories/punkt-linie-kiez/types';
import Auswahl from './punkt-linie-kiez-auswahl.svelte';

vi.mock('$lib/utils/plausible.js', () => ({ trackEvent: vi.fn() }));

const NAMES = [
	'Charlottenburg-Wilmersdorf',
	'Friedrichshain-Kreuzberg',
	'Lichtenberg',
	'Marzahn-Hellersdorf',
	'Mitte',
	'Neukölln',
	'Pankow',
	'Reinickendorf',
	'Spandau',
	'Steglitz-Zehlendorf',
	'Tempelhof-Schöneberg',
	'Treptow-Köpenick'
];
const bezirke: BezirkItem[] = NAMES.map((name, i) => ({
	slug: name.toLowerCase().replace('ö', 'oe').replace('ü', 'ue'),
	name,
	kennzahlen: {
		slug: name.toLowerCase(),
		gruen: 0.5,
		altbauAnteil: 0.4,
		laermDb: 50,
		bewohnerProKm2: 3000 + i * 100,
		haltestelle400mAnteil: 0.95,
		clubs: i
	}
}));
const sources: KennzahlenQuelle[] = [
	{ name: 'Einwohner pro Planungsraum', stand: '2024-12-31' },
	{ name: 'Clubs (OpenStreetMap)' }
];

afterEach(() => overwriteGetLocale(() => 'de'));

const buttons = (): HTMLButtonElement[] => [
	...document.querySelectorAll<HTMLButtonElement>('[data-testid="plk-auswahl-liste"] button')
];
const big = (): HTMLElement => document.querySelector('[data-testid="plk-auswahl-gross"]')!;

describe('punkt-linie-kiez-auswahl.svelte', () => {
	it('zeigt einen Bezirk groß mit Legende und die Auswahl der Bezirke als Buttons', () => {
		render(Auswahl, { bezirke, sources });
		expect(big().querySelector('figcaption')?.textContent).toBe('charlottenburg-wilmersdorf');
		expect(big().querySelector('[data-testid="plk-legend"]')).not.toBeNull();
		expect(buttons()).toHaveLength(12);
		expect(buttons().filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
		expect(buttons()[0]!.getAttribute('aria-pressed')).toBe('true');
		expect(buttons()[1]!.getAttribute('aria-pressed')).toBe('false');
	});

	it('wechselt den großen Bezirk per Klick und setzt aria-pressed um', async () => {
		render(Auswahl, { bezirke, sources });
		await userEvent.click(buttons()[4]!);
		flushSync();
		expect(big().querySelector('figcaption')?.textContent).toBe('mitte');
		expect(buttons()[4]!.getAttribute('aria-pressed')).toBe('true');
		expect(buttons()[0]!.getAttribute('aria-pressed')).toBe('false');
		expect(document.querySelector('[role="status"]')?.textContent).toContain('Mitte');
	});

	it('wechselt per Tastatur mit Enter und behält den Fokus auf dem Button', async () => {
		render(Auswahl, { bezirke, sources });
		buttons()[2]!.focus();
		await userEvent.keyboard('{Enter}');
		flushSync();
		expect(big().querySelector('figcaption')?.textContent).toBe('lichtenberg');
		expect(document.activeElement).toBe(buttons()[2]);
	});

	it('fällt bei unbekanntem initialSlug auf den ersten Bezirk zurück, mit genau einem aria-pressed', () => {
		render(Auswahl, { bezirke, sources, initialSlug: 'gibt-es-nicht' });
		expect(big().querySelector('figcaption')?.textContent).toBe('charlottenburg-wilmersdorf');
		expect(buttons().filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
	});

	it('startet mit initialSlug und ruft onselect bei einer Wahl', async () => {
		const picked: string[] = [];
		render(Auswahl, {
			bezirke,
			sources,
			initialSlug: 'pankow',
			onselect: (s: string) => picked.push(s)
		});
		expect(big().querySelector('figcaption')?.textContent).toBe('pankow');
		await userEvent.click(buttons()[0]!);
		flushSync();
		expect(picked).toEqual(['charlottenburg-wilmersdorf']);
		expect(big().querySelector('figcaption')?.textContent).toBe('charlottenburg-wilmersdorf');
	});

	it('legt keine figure in Buttons und überschreibt den Fokusring nicht', () => {
		render(Auswahl, { bezirke, sources });
		for (const b of buttons()) {
			expect(b.querySelector('figure')).toBeNull();
			expect(b.style.outline).toBe('');
		}
		expect(buttons()[0]!.style.borderColor).not.toBe('transparent');
	});

	it('bietet das PDF unter der großen Komposition an und folgt der Wahl', async () => {
		render(Auswahl, { bezirke, sources });
		const link = (): HTMLAnchorElement =>
			big().querySelector<HTMLAnchorElement>('[data-testid="plk-pdf-link"]')!;
		expect(link().textContent?.trim()).toBe('PDF herunterladen');
		expect(link().getAttribute('href')).toBe(
			'/stories/punkt-linie-kiez/de/charlottenburg-wilmersdorf.pdf'
		);
		expect(link().getAttribute('download')).toBe(
			'punkt-linie-kiez-charlottenburg-wilmersdorf-de.pdf'
		);
		expect(link().className).toContain('min-h-6');
		expect(
			big().querySelector('figure')!.compareDocumentPosition(link()) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		await userEvent.click(buttons()[4]!);
		flushSync();
		expect(link().getAttribute('href')).toBe('/stories/punkt-linie-kiez/de/mitte.pdf');
		expect(link().getAttribute('download')).toBe('punkt-linie-kiez-mitte-de.pdf');
	});

	it('zählt den Klick auf den PDF-Link als Plausible-Event, ohne den Download zu stoppen', () => {
		vi.mocked(trackEvent).mockClear();
		render(Auswahl, { bezirke, sources, initialSlug: 'mitte' });
		const a = big().querySelector<HTMLAnchorElement>('[data-testid="plk-pdf-link"]')!;
		let prevented = false;
		const guard = (e: Event): void => {
			// Verhindert die Navigation im Test. Prüft, dass der Handler selbst nicht abbricht.
			prevented = e.defaultPrevented;
			e.preventDefault();
		};
		document.addEventListener('click', guard);
		a.click();
		document.removeEventListener('click', guard);
		expect(prevented).toBe(false);
		expect(trackEvent).toHaveBeenCalledTimes(1);
		expect(trackEvent).toHaveBeenCalledWith('Stories PDF Download', {
			serie: 'punkt-linie-kiez',
			bezirk: 'mitte',
			sprache: 'de'
		});
	});

	it('bietet unter der Auswahl das Gesamtplakat an und zählt es mit bezirk alle', () => {
		vi.mocked(trackEvent).mockClear();
		render(Auswahl, { bezirke, sources });
		const a = document.querySelector<HTMLAnchorElement>('[data-testid="plk-pdf-all-link"]')!;
		expect(a.textContent?.trim()).toBe('Alle 12 Bezirke als PDF');
		expect(a.getAttribute('href')).toBe('/stories/punkt-linie-kiez/de/alle-bezirke.pdf');
		expect(a.getAttribute('download')).toBe('punkt-linie-kiez-alle-bezirke-de.pdf');
		expect(a.className).toContain('min-h-6');
		const list = document.querySelector('[data-testid="plk-auswahl-liste"]')!;
		expect(list.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		const guard = (e: Event): void => e.preventDefault();
		document.addEventListener('click', guard);
		a.click();
		document.removeEventListener('click', guard);
		expect(trackEvent).toHaveBeenCalledWith('Stories PDF Download', {
			serie: 'punkt-linie-kiez',
			bezirk: 'alle',
			sprache: 'de'
		});
	});

	it('EN: englischer Linktext und en im Dateinamen', () => {
		overwriteGetLocale(() => 'en');
		render(Auswahl, { bezirke, sources });
		const a = big().querySelector('[data-testid="plk-pdf-link"]')!;
		expect(a.textContent?.trim()).toBe('Download PDF');
		expect(a.getAttribute('download')).toBe('punkt-linie-kiez-charlottenburg-wilmersdorf-en.pdf');
	});

	it('gibt den Buttons einen Namen und mindestens 24 px Klickziel', () => {
		render(Auswahl, { bezirke, sources });
		for (const [i, b] of buttons().entries()) {
			expect(b.textContent?.toLowerCase()).toContain(NAMES[i]!.toLowerCase());
			const box = b.getBoundingClientRect();
			expect(box.width).toBeGreaterThanOrEqual(24);
			expect(box.height).toBeGreaterThanOrEqual(24);
		}
	});

	it('hält die kleinen Zeichen aus der Tab-Reihenfolge, nur die Buttons zählen', () => {
		render(Auswahl, { bezirke, sources });
		const list = document.querySelector('[data-testid="plk-auswahl-liste"]')!;
		const stops = list.querySelectorAll('[tabindex]');
		expect(stops).toHaveLength(0);
	});

	it('nennt die Quellen aus der JSON-Datei inklusive OSM-Hinweis (DE)', () => {
		render(Auswahl, { bezirke, sources });
		const footer = document.querySelector('[data-testid="plk-auswahl-fuss"]')!;
		expect(footer.textContent).toContain('navigator.berlin');
		expect(footer.textContent).toContain('Einwohner pro Planungsraum');
		expect(footer.textContent).toContain('Clubs (OpenStreetMap)');
		expect(footer.textContent).toContain('Stand 2024-12-31');
		expect(footer.textContent).toContain('© OpenStreetMap-Mitwirkende');
		const hrefs = [...footer.querySelectorAll('a')].map((a) => a.getAttribute('href'));
		expect(hrefs).toEqual(['/lizenzen', 'https://www.openstreetmap.org/copyright']);
	});

	it('nennt den OSM-Hinweis auf Englisch', () => {
		overwriteGetLocale(() => 'en');
		render(Auswahl, { bezirke, sources });
		const footer = document.querySelector('[data-testid="plk-auswahl-fuss"]')!;
		expect(footer.textContent).toContain('© OpenStreetMap contributors');
		expect(footer.querySelector('a')!.getAttribute('href')).toBe('/en/lizenzen');
		expect(document.querySelector('[aria-label="Choose a district"]')).not.toBeNull();
	});
});
