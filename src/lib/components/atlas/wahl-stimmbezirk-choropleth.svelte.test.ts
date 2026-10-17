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

	it('#107: zeigt eine Partei-Legende mit Namen, häufigste Partei zuerst', async () => {
		render(WahlStimmbezirkChoropleth, {
			geoSlug: 'ah21',
			wahlSlug: 'agh21',
			winnersByUwb: [
				{ uwbId: '01B1A', parteiKurzname: 'AfD', farbeHex: '#000000', anteil: 0.3 },
				{ uwbId: '01B1B', parteiKurzname: 'CDU', farbeHex: '#000000', anteil: 0.4 },
				{ uwbId: '01B1C', parteiKurzname: 'CDU', farbeHex: '#000000', anteil: 0.35 }
			]
		});
		const liste = page.getByTestId('winner-map-legende-list');
		await expect.element(liste).toBeInTheDocument();
		const items = liste.getByRole('listitem').all();
		expect(items).toHaveLength(2);
		await expect.element(items[0]).toHaveTextContent('CDU');
		await expect.element(items[1]).toHaveTextContent('AfD');
		await expect.element(page.getByTestId('winner-map-muster-toggle')).toBeInTheDocument();
	});

	it('#107: bietet die Karte als Tabelle an (Gebiet, stärkste Partei, Anteil)', async () => {
		render(WahlStimmbezirkChoropleth, {
			geoSlug: 'ah21',
			wahlSlug: 'agh21',
			winnersByUwb: [{ uwbId: '01B1A', parteiKurzname: 'CDU', farbeHex: '#000000', anteil: 0.3 }]
		});
		await page.getByRole('button', { name: 'Als Tabelle ansehen' }).click();
		const tabelle = page.getByRole('table');
		await expect.element(tabelle).toBeInTheDocument();
		await expect.element(tabelle).toHaveTextContent('CDU');
		await expect.element(tabelle).toHaveTextContent('30,0');
	});
});
