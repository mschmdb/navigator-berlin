import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import StolpersteinDetail from './stolperstein-detail.svelte';
import type { StolpersteinFeature } from './internal/editorial-types.js';

function makeFeature(props: Partial<StolpersteinFeature['properties']>): StolpersteinFeature {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [13.4, 52.5] },
		properties: { ...props }
	};
}

describe('stolperstein-detail.svelte', () => {
	it('rendert Personen-Name in Plex-Serif h4', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa Beispiel' }),
			fetchedAt: '2026-04-01'
		});
		const h = (await page.getByTestId('stolperstein-person').element()) as HTMLElement;
		expect(h.tagName).toBe('H4');
		expect(h.textContent).toMatch(/Rosa Beispiel/);
		expect(h.className).toMatch(/font-serif/);
	});

	it('Fallback "Unbekannte Person" wenn person fehlt', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({}),
			fetchedAt: '2026-04-01'
		});
		const h = (await page.getByTestId('stolperstein-person').element()) as HTMLElement;
		expect(h.textContent).toMatch(/Unbekannte Person/);
	});

	it('Inschrift in <blockquote> mit Plex-Serif-Italic', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa', inscription: 'Hier wohnte Rosa Beispiel' }),
			fetchedAt: '2026-04-01'
		});
		const bq = (await page.getByTestId('stolperstein-inscription').element()) as HTMLElement;
		expect(bq.tagName).toBe('BLOCKQUOTE');
		expect(bq.textContent).toMatch(/Hier wohnte Rosa Beispiel/);
		expect(bq.className).toMatch(/font-serif/);
		expect(bq.className).toMatch(/italic/);
	});

	it('rendert IMMER Berliner-Koordinierungsstelle-Link', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa' }),
			fetchedAt: '2026-04-01'
		});
		const link = (await page.getByTestId('stolperstein-source-koordinierung').element()) as HTMLAnchorElement;
		expect(link.href).toMatch(/^https:\/\/www\.stolpersteine-berlin\.de/);
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toMatch(/noopener/);
	});

	it('Wikipedia-Link nur wenn wikipedia:de Property vorhanden', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa', 'wikipedia:de': 'de:Rosa_Beispiel' }),
			fetchedAt: '2026-04-01'
		});
		const link = (await page.getByTestId('stolperstein-source-wikipedia').element()) as HTMLAnchorElement;
		expect(link.href).toMatch(/de\.wikipedia\.org\/wiki\/Rosa_Beispiel/);
	});

	it('Wikipedia-Link fehlt wenn keine Wikipedia-Property', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa' }),
			fetchedAt: '2026-04-01'
		});
		await expect.element(page.getByTestId('stolperstein-source-wikipedia')).not.toBeInTheDocument();
	});

	it('Wikipedia-EN-Variant wenn wikipedia:en gesetzt', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa', 'wikipedia:en': 'en:Rosa_Example' }),
			fetchedAt: '2026-04-01'
		});
		const link = (await page.getByTestId('stolperstein-source-wikipedia').element()) as HTMLAnchorElement;
		expect(link.href).toMatch(/en\.wikipedia\.org\/wiki\/Rosa_Example/);
	});

	it('Plex-Mono-Footer mit Quelle + Datenstand', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa' }),
			fetchedAt: '2026-04-01'
		});
		const f = (await page.getByTestId('stolperstein-footer').element()) as HTMLElement;
		expect(f.className).toMatch(/font-mono/);
		expect(f.textContent).toMatch(/OpenStreetMap/);
		expect(f.textContent).toMatch(/2026-04-01/);
	});

	it('Fallback-Inschrift wenn inscription fehlt', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa' }),
			fetchedAt: '2026-04-01'
		});
		const bq = (await page.getByTestId('stolperstein-inscription').element()) as HTMLElement;
		expect(bq.textContent).toMatch(/Information nicht verfügbar/);
	});

	it('KEINE LLM-Marker-Properties — strict OSM-only', async () => {
		render(StolpersteinDetail, {
			feature: makeFeature({ person: 'Rosa', inscription: 'Hier wohnte Rosa' }),
			fetchedAt: '2026-04-01'
		});
		const container = (await page.getByTestId('stolperstein-detail').element()) as HTMLElement;
		expect(container.getAttribute('data-ai-generated')).toBeNull();
		expect(container.dataset.aiGenerated).toBeUndefined();
		expect(container.dataset.osmSourced).toBe('true');
	});
});
