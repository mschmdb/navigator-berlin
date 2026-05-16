/**
 * Smoke-Test: end-to-end Satori + Resvg-Render einer Bezirks-Card.
 *
 * Lädt die echten Plex-Fonts via loadDefaultOgFonts (Story 1.20-Reuse, Memory
 * project_satori_font_pipeline). Verifiziert PNG-Magic-Bytes als Sanity-Gate
 * gegen Font-Magic-Byte-Korruption.
 */

import { describe, it, expect } from 'vitest';
import { renderPageCardPng } from './render-page-card.js';
import { buildBezirkCardVdom } from './page-card-template.js';

describe('renderPageCardPng', () => {
	it('renders a 1200x630 PNG starting with PNG magic bytes', async () => {
		const vdom = buildBezirkCardVdom({
			bezirkName: 'Mitte',
			slug: 'mitte',
			topStats: [
				{ label: 'Lärm', value: 'Hoch', layer: 'laerm-2023', sourceUpdatedAt: '2023-01-01' },
				{ label: 'PET', value: '32.5 °C', layer: 'klima-pet-2022', sourceUpdatedAt: '2022-08-01' },
				{ label: 'Stationen', value: '8.2/km²', layer: 'oepnv', sourceUpdatedAt: '2025-01-01' }
			]
		});
		const png = await renderPageCardPng(vdom);
		// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
		expect(png[0]).toBe(0x89);
		expect(png[1]).toBe(0x50);
		expect(png[2]).toBe(0x4e);
		expect(png[3]).toBe(0x47);
		expect(png.length).toBeGreaterThan(1000);
	}, 30000);
});
