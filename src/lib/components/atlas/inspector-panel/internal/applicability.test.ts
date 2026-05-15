import { describe, expect, it } from 'vitest';
import type { LayerHit } from '$lib/data';
import { applyApplicabilityReasons, isLayerApplicable } from './applicability.js';

const sourceUrl = 'https://example.com/wfs';
const license = 'dl-de/zero-2-0';
const updatedAt = '2025-01-01T00:00:00Z';

function noCoverageHit(layer: string): LayerHit {
	return { layer, value: null, source: sourceUrl, updatedAt, license, reason: 'no-coverage' };
}

function brwHit(nutzung: string): LayerHit {
	return {
		layer: 'bodenrichtwerte',
		value: { brw: 5000, nutzung },
		source: sourceUrl,
		updatedAt,
		license
	};
}

describe('isLayerApplicable', () => {
	it('milieuschutz-erhaltungsmiete: anwendbar bei bewohnter Lage (W)', () => {
		const hits = [brwHit('W - Wohngebiet')];
		expect(isLayerApplicable('milieuschutz-erhaltungsmiete', hits)).toBe(true);
	});

	it('milieuschutz-erhaltungsmiete: NICHT anwendbar bei Gewerbe-Lage (G)', () => {
		const hits = [brwHit('G - Gewerbegebiet')];
		expect(isLayerApplicable('milieuschutz-erhaltungsmiete', hits)).toBe(false);
	});

	it('milieuschutz-staedtebau: NICHT anwendbar bei Industrie-Lage (I)', () => {
		const hits = [brwHit('I - Industriegebiet')];
		expect(isLayerApplicable('milieuschutz-staedtebau', hits)).toBe(false);
	});

	it('wohnlagen-2024: NICHT anwendbar im Kleingarten (K)', () => {
		const hits = [brwHit('K - Kleingarten')];
		expect(isLayerApplicable('wohnlagen-2024', hits)).toBe(false);
	});

	it('mietspiegel-wohnlage: NICHT anwendbar im Wald (F)', () => {
		const hits = [brwHit('F - Forstwirtschaft')];
		expect(isLayerApplicable('mietspiegel-wohnlage', hits)).toBe(false);
	});

	it('schulen-2024: universal anwendbar (kein Applicability-Gate)', () => {
		const hits = [brwHit('G - Gewerbegebiet')];
		expect(isLayerApplicable('schulen-2024', hits)).toBe(true);
	});

	it('milieuschutz-* ohne BRW-Hit: konservativ anwendbar (kein false-negative)', () => {
		expect(isLayerApplicable('milieuschutz-staedtebau', [])).toBe(true);
	});

	it('Mixed-Nutzung MI: gilt als bewohnt', () => {
		const hits = [brwHit('MI - Mischgebiet')];
		expect(isLayerApplicable('milieuschutz-erhaltungsmiete', hits)).toBe(true);
	});
});

describe('applyApplicabilityReasons', () => {
	it('no-coverage + nicht-anwendbar → out-of-concept', () => {
		const hits: LayerHit[] = [brwHit('G - Gewerbegebiet'), noCoverageHit('milieuschutz-erhaltungsmiete')];
		const result = applyApplicabilityReasons(hits);
		const milieu = result.find((h) => h.layer === 'milieuschutz-erhaltungsmiete');
		expect(milieu?.reason).toBe('out-of-concept');
	});

	it('no-coverage + anwendbar → bleibt no-coverage (echte Lücke)', () => {
		const hits: LayerHit[] = [brwHit('W - Wohngebiet'), noCoverageHit('milieuschutz-erhaltungsmiete')];
		const result = applyApplicabilityReasons(hits);
		const milieu = result.find((h) => h.layer === 'milieuschutz-erhaltungsmiete');
		expect(milieu?.reason).toBe('no-coverage');
	});

	it('Layer mit Wert: Reason wird nicht verändert', () => {
		const hits: LayerHit[] = [
			brwHit('G - Gewerbegebiet'),
			{
				layer: 'milieuschutz-erhaltungsmiete',
				value: { name: 'X' },
				source: sourceUrl,
				updatedAt,
				license
			}
		];
		const result = applyApplicabilityReasons(hits);
		const milieu = result.find((h) => h.layer === 'milieuschutz-erhaltungsmiete');
		expect(milieu?.reason).toBeUndefined();
	});

	it('coverage-out-of-scope: bleibt unverändert (höhere Priorität als out-of-concept)', () => {
		const cov: LayerHit = {
			layer: 'milieuschutz-erhaltungsmiete',
			value: null,
			source: sourceUrl,
			updatedAt,
			license,
			reason: 'coverage-out-of-scope'
		};
		const result = applyApplicabilityReasons([brwHit('G - Gewerbegebiet'), cov]);
		const milieu = result.find((h) => h.layer === 'milieuschutz-erhaltungsmiete');
		expect(milieu?.reason).toBe('coverage-out-of-scope');
	});

	it('seasonal: bleibt unverändert', () => {
		const seasonal: LayerHit = {
			layer: 'trinkbrunnen',
			value: null,
			source: sourceUrl,
			updatedAt,
			license,
			reason: 'seasonal'
		};
		const result = applyApplicabilityReasons([seasonal]);
		expect(result[0].reason).toBe('seasonal');
	});

	it('Cross-Layer: BRW = Gewerbe ⇒ ALLE Wohn-Layer (no-coverage) → out-of-concept', () => {
		const hits: LayerHit[] = [
			brwHit('G - Gewerbegebiet'),
			noCoverageHit('milieuschutz-erhaltungsmiete'),
			noCoverageHit('milieuschutz-staedtebau'),
			noCoverageHit('wohnlagen-2024')
		];
		const result = applyApplicabilityReasons(hits);
		for (const slug of [
			'milieuschutz-erhaltungsmiete',
			'milieuschutz-staedtebau',
			'wohnlagen-2024'
		]) {
			expect(result.find((h) => h.layer === slug)?.reason).toBe('out-of-concept');
		}
	});

	it('schulen-2024 no-coverage bleibt no-coverage (universal applicable)', () => {
		const hits: LayerHit[] = [brwHit('G - Gewerbegebiet'), noCoverageHit('schulen-2024')];
		const result = applyApplicabilityReasons(hits);
		expect(result.find((h) => h.layer === 'schulen-2024')?.reason).toBe('no-coverage');
	});

	// Story 1.30: MSS intrinsic check — kom != 'gültig' → out-of-concept (kein Cross-Layer-Pattern,
	// sondern Property im Hit-Value selbst).
	it('MSS kom=ungültig (EW unter 300) → out-of-concept', () => {
		const hit: LayerHit = {
			layer: 'mss-gesamtindex-2025',
			value: { plr_name: 'X', si_v: 'Planungsraum ohne Zuordnung', kom: 'ungültig (EW unter 300)' },
			source: sourceUrl,
			updatedAt,
			license
		};
		const result = applyApplicabilityReasons([hit]);
		expect(result[0].reason).toBe('out-of-concept');
	});

	it('MSS kom=ungültig (Ausreißer) → out-of-concept', () => {
		const hit: LayerHit = {
			layer: 'mss-gesamtindex-2025',
			value: { plr_name: 'X', kom: 'ungültig (Ausreißer)' },
			source: sourceUrl,
			updatedAt,
			license
		};
		const result = applyApplicabilityReasons([hit]);
		expect(result[0].reason).toBe('out-of-concept');
	});

	it('MSS kom=gültig → reason bleibt undefined', () => {
		const hit: LayerHit = {
			layer: 'mss-gesamtindex-2025',
			value: { plr_name: 'X', si_v: 'mittel', di_v: 'stabil', kom: 'gültig' },
			source: sourceUrl,
			updatedAt,
			license
		};
		const result = applyApplicabilityReasons([hit]);
		expect(result[0].reason).toBeUndefined();
	});
});
