import { describe, it, expect } from 'vitest';
import { renderKiezMarkdown, type KiezRenderInput } from './kiez-renderer.js';

const baseInput: KiezRenderInput = {
	slug: 'boxhagener-kiez',
	name: 'Boxhagener Kiez',
	bezirkName: 'Friedrichshain-Kreuzberg',
	bezirkSlug: 'friedrichshain-kreuzberg',
	einwohner: 9234,
	flaecheHa: 78.3,
	stats: {
		slug: 'boxhagener-kiez',
		bezirkSlug: 'friedrichshain-kreuzberg',
		computedAt: new Date('2026-05-16T00:00:00Z'),
		laerm: {
			dominantCategory: {
				value: 'sehr hoch',
				layer: 'laerm-2023',
				sourceUpdatedAt: '2023-09-15'
			},
			categoryDistribution: null
		},
		luft: {
			dominantCategory: null,
			categoryDistribution: null
		},
		gruen: {
			dominantVersorgung: {
				value: 'unterversorgt',
				layer: 'gruenversorgung-2023',
				sourceUpdatedAt: '2023-09-15'
			},
			versorgungDistribution: null,
			gruenanlagenCount: null,
			spielplaetzeCount: null
		},
		klima: {
			meanPet: null,
			shareSehrHeiss: null
		},
		wohnen: {
			dominantWohnlage: null,
			wohnlageDistribution: null,
			dominantMss: {
				value: 'mittel',
				layer: 'mss-gesamtindex-2025',
				sourceUpdatedAt: '2025-01-01'
			},
			mssDistribution: null
		},
		oepnv: {
			stopsPerKm2: null,
			uBahnCount: null,
			sBahnCount: null,
			tramCount: null,
			busCount: null
		},
		bildung: {
			kitasPerKm2: null,
			schulenPerKm2: null
		},
		heritage: {
			denkmalPerKm2: null,
			stolpersteinePerKm2: null
		}
	},
	score: {
		slug: 'boxhagener-kiez',
		bezirkSlug: 'friedrichshain-kreuzberg',
		computedAt: new Date('2026-05-16T00:00:00Z'),
		composite: 58.2,
		ruheLuft: 30,
		gruenHitze: 22,
		mobilitaet: 85,
		versorgung: 70,
		wohnschutz: 60
	},
	faq: []
};

describe('renderKiezMarkdown', () => {
	it('starts with H2 "## Kiez {Name}"', () => {
		const md = renderKiezMarkdown(baseInput);
		expect(md.split('\n')[0]).toBe('## Kiez Boxhagener Kiez');
	});

	it('includes Bezirk-Zuordnung in Steckbrief', () => {
		const md = renderKiezMarkdown(baseInput);
		expect(md).toContain('Friedrichshain-Kreuzberg');
	});

	it('includes MSS soziale-Lage with category-neutral wording + disclaimer', () => {
		const md = renderKiezMarkdown(baseInput);
		expect(md).toContain('MSS');
		expect(md).toContain('mittel');
		// Stigma-Disclaimer pflicht
		expect(md.toLowerCase()).toContain('strukturell');
	});

	it('renders Kiez-Score with Composite + 5 Dimensionen', () => {
		const md = renderKiezMarkdown(baseInput);
		expect(md).toContain('Kiez-Score');
		expect(md).toContain('58'); // composite gerundet
	});

	it('handles missing stats + score gracefully', () => {
		const md = renderKiezMarkdown({ ...baseInput, stats: null, score: null });
		expect(md).toContain('## Kiez Boxhagener Kiez');
		expect(md).toMatch(/keine.*Aggregat-Daten/i);
	});

	it('never contains banned word "lebenswert"', () => {
		const md = renderKiezMarkdown(baseInput);
		expect(md.toLowerCase()).not.toContain('lebenswert');
	});

	it('never contains em-dashes (U+2014)', () => {
		const md = renderKiezMarkdown(baseInput);
		expect(md).not.toContain('—');
	});

	it('strips banned word from FAQ-Answer with [REDAKTIONSFEHLER] replacement', () => {
		const tainted: KiezRenderInput = {
			...baseInput,
			faq: [{ question: 'Wie wohnt sich Boxi?', answer: 'Boxi ist lebenswert.' }]
		};
		const md = renderKiezMarkdown(tainted);
		expect(md.toLowerCase()).not.toContain('lebenswert');
		expect(md).toContain('[REDAKTIONSFEHLER]');
	});

	it('is deterministic for same input', () => {
		expect(renderKiezMarkdown(baseInput)).toBe(renderKiezMarkdown(baseInput));
	});
});
