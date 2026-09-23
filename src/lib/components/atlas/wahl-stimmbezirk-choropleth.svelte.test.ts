import { describe, expect, it, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import WahlStimmbezirkChoropleth from './wahl-stimmbezirk-choropleth.svelte';

// Läuft gegen die echten static/layers-Dateien (vom Dev-Server unter /layers/
// ausgeliefert, kein Mock) -- Review-Fund: die Detailseiten-Choropleth hatte
// keinen eigenen Test.
describe('WahlStimmbezirkChoropleth', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('rendert die zugänglichen Struktur-Elemente (figure/figcaption/aria-label)', async () => {
		render(WahlStimmbezirkChoropleth, {
			geoSlug: 'ah21',
			wahlSlug: 'agh21',
			winnersByUwb: [],
			title: 'AGH 2021'
		});
		await expect.element(page.getByTestId('wahl-stimmbezirk-choropleth')).toBeInTheDocument();
		const figure = page.getByTestId('wahl-stimmbezirk-choropleth');
		await expect.element(figure).toHaveAttribute('aria-label', 'Choropleth-Karte: AGH 2021');
		await expect
			.element(figure.getByText('Briefwahl-Gruppe', { exact: false }))
			.toBeInTheDocument();
	});

	it('lädt die dissolvierte wahlgruppen-<geoSlug>-Fläche, NICHT die einzelne wahlbezirke-<geoSlug>-Urnenfläche (Review-Fund: Never-Boundary "kein Urnen-only-Umschalter")', async () => {
		const requestedUrls: string[] = [];
		const realFetch = globalThis.fetch.bind(globalThis);
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
			const url = typeof input === 'string' ? input : input.toString();
			requestedUrls.push(url);
			return realFetch(input, init);
		});

		render(WahlStimmbezirkChoropleth, {
			geoSlug: 'ah21',
			wahlSlug: 'agh21',
			// '01B1A' ist eine echte Gruppen-ID aus der ah21-Geometrie
			// (BEZ=01, BWB3=1A).
			winnersByUwb: [{ uwbId: '01B1A', parteiKurzname: 'CDU', farbeHex: '#000000', anteil: 0.3 }]
		});

		await expect.poll(() => requestedUrls.some((u) => u.includes('wahlgruppen-ah21'))).toBe(true);
		expect(requestedUrls.some((u) => u.includes('wahlbezirke-ah21'))).toBe(false);
	});
});
