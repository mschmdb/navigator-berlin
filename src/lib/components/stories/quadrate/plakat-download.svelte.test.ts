import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { trackEvent } from '$lib/utils/plausible.js';
import PlakatDownload from './plakat-download.svelte';

vi.mock('$lib/utils/plausible.js', () => ({ trackEvent: vi.fn() }));

const link = (): HTMLAnchorElement =>
	document.querySelector<HTMLAnchorElement>('[data-testid="bq-plakat-link"]')!;

describe('PlakatDownload', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('verlinkt das Plakat der Wahlart als PDF-Download', () => {
		overwriteGetLocale(() => 'de');
		render(PlakatDownload, { typ: 'agh' });
		expect(link().textContent?.trim()).toBe('Plakat als PDF: Abgeordnetenhaus');
		expect(link().getAttribute('href')).toBe(
			'/stories/berlin-in-quadraten/de/alle-bezirke-agh.pdf'
		);
		expect(link().getAttribute('download')).toBe('berlin-in-quadraten-alle-bezirke-agh-de.pdf');
		expect(link().className).toContain('min-h-6');
	});

	it('zählt den Klick als Plausible-Event, ohne den Download zu stoppen', () => {
		vi.mocked(trackEvent).mockClear();
		overwriteGetLocale(() => 'de');
		render(PlakatDownload, { typ: 'btw' });
		let prevented = false;
		const guard = (e: Event): void => {
			prevented = e.defaultPrevented;
			e.preventDefault();
		};
		document.addEventListener('click', guard);
		link().click();
		document.removeEventListener('click', guard);
		expect(prevented).toBe(false);
		expect(trackEvent).toHaveBeenCalledWith('Stories PDF Download', {
			serie: 'berlin-in-quadraten',
			bezirk: 'alle',
			wahl: 'btw',
			sprache: 'de'
		});
	});

	it('EN: englischer Text und en im Pfad', () => {
		overwriteGetLocale(() => 'en');
		render(PlakatDownload, { typ: 'btw' });
		expect(link().textContent?.trim()).toBe('Poster as PDF: Bundestag');
		expect(link().getAttribute('href')).toBe(
			'/stories/berlin-in-quadraten/en/alle-bezirke-btw.pdf'
		);
	});
});
