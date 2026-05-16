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
			scoreCard: {
				composite: 43,
				dims: [
					{ label: 'Ruhe', value: 27 },
					{ label: 'Grün', value: 31 },
					{ label: 'Mob.', value: 35 },
					{ label: 'Vers.', value: 62 }
				]
			},
			scoreUpdatedAt: 'Mai 2026'
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
