import { describe, it, expect } from 'vitest';
import { renderBezirkMarkdown, type BezirkRenderInput } from './bezirk-renderer.js';

const baseInput: BezirkRenderInput = {
	slug: 'mitte',
	name: 'Mitte',
	einwohner: 384172,
	flaecheHa: 3947,
	stats: {
		slug: 'mitte',
		computedAt: new Date('2026-05-16T00:00:00Z'),
		laerm: {
			dominantCategory: {
				value: 'hoch',
				layer: 'laerm-2023',
				sourceUpdatedAt: '2023-09-15'
			},
			categoryDistribution: null
		},
		luft: {
			dominantCategory: {
				value: 'mittel',
				layer: 'luft-2023',
				sourceUpdatedAt: '2023-12-01'
			},
			categoryDistribution: null
		},
		gruen: {
			dominantVersorgung: null,
			versorgungDistribution: null,
			gruenanlagenCount: {
				value: 42,
				layer: 'gruenanlagen',
				sourceUpdatedAt: '2024-06-01'
			},
			spielplaetzeCount: null
		},
		klima: {
			meanPet: {
				value: 32.5,
				layer: 'klima-pet-2022',
				sourceUpdatedAt: '2022-08-01'
			},
			shareSehrHeiss: null
		},
		wohnen: {
			dominantWohnlage: null,
			wohnlageDistribution: null,
			dominantMss: null,
			mssDistribution: null
		},
		oepnv: {
			stopsPerKm2: {
				value: 8.4,
				layer: 'ubahn-stationen',
				sourceUpdatedAt: '2025-01-01'
			},
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
			denkmalPerKm2: {
				value: 26.9,
				layer: 'denkmal-2024',
				sourceUpdatedAt: '2024-01-01'
			},
			stolpersteinePerKm2: null
		}
	},
	score: {
		slug: 'mitte',
		computedAt: new Date('2026-05-16T00:00:00Z'),
		composite: 62.3,
		ruheLuft: 48,
		gruenHitze: 70,
		mobilitaet: 92,
		versorgung: 45,
		wohnschutz: 58,
		kultur: 40,
		kriminalitaet: 42
	},
	faq: [
		{
			question: 'Wie laut ist Mitte?',
			answer: 'Die Lärmbelastung ist dominant hoch laut Umweltatlas 2023.'
		}
	]
};

describe('renderBezirkMarkdown', () => {
	it('starts with H2 "## Bezirk {Name}"', () => {
		const md = renderBezirkMarkdown(baseInput);
		expect(md.split('\n')[0]).toBe('## Bezirk Mitte');
	});

	it('includes population (Einwohner) and area (Fläche)', () => {
		const md = renderBezirkMarkdown(baseInput);
		expect(md).toContain('Einwohner');
		expect(md).toContain('384.172');
		expect(md).toContain('39,5 km²');
	});

	it('attributes Lärm-Wert with source layer + date + license format', () => {
		const md = renderBezirkMarkdown(baseInput);
		// FR40-Format: "(Quelle: {layer}, Stand {date})" — Lizenz optional, kommt aus Manifest
		expect(md).toMatch(/Quelle:\s+laerm-2023/);
		expect(md).toContain('Stand 2023-09-15');
	});

	it('includes Kiez-Score Composite + 5 Dimensionen', () => {
		const md = renderBezirkMarkdown(baseInput);
		expect(md).toContain('Bezirks-Score');
		expect(md).toContain('62'); // composite gerundet
		expect(md).toMatch(/Ruhe.*Luft/i);
		expect(md).toContain('Mobilität');
		expect(md).toContain('Versorgung');
	});

	it('appends FAQ-Section when faq entries vorhanden', () => {
		const md = renderBezirkMarkdown(baseInput);
		expect(md).toContain('### FAQ');
		expect(md).toContain('Wie laut ist Mitte?');
		expect(md).toContain('Lärmbelastung ist dominant hoch');
	});

	it('skips FAQ-Section when faq is empty', () => {
		const md = renderBezirkMarkdown({ ...baseInput, faq: [] });
		expect(md).not.toContain('### FAQ');
	});

	it('handles null stats (DB-Fallback) gracefully without throwing', () => {
		const md = renderBezirkMarkdown({ ...baseInput, stats: null, score: null });
		expect(md).toContain('## Bezirk Mitte');
		expect(md).toMatch(/keine.*Aggregat-Daten/i);
	});

	it('never contains banned word "lebenswert"', () => {
		const md = renderBezirkMarkdown(baseInput);
		expect(md.toLowerCase()).not.toContain('lebenswert');
	});

	it('never contains em-dashes (U+2014)', () => {
		const md = renderBezirkMarkdown(baseInput);
		expect(md).not.toContain('—');
	});

	it('is deterministic for same input', () => {
		expect(renderBezirkMarkdown(baseInput)).toBe(renderBezirkMarkdown(baseInput));
	});

	it('rejects input that contains banned word in name (Build-Safety)', () => {
		// Simuliere fehlerhaften Editor-Eintrag, FAQ-Answer enthält "lebenswert"
		const tainted: BezirkRenderInput = {
			...baseInput,
			faq: [{ question: 'Wie ist der Kiez?', answer: 'Sehr lebenswert.' }]
		};
		const md = renderBezirkMarkdown(tainted);
		expect(md.toLowerCase()).not.toContain('lebenswert');
		expect(md).toContain('[REDAKTIONSFEHLER]');
	});
});
