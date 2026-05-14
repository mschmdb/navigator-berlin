import { describe, expect, it } from 'vitest';
import { hasBerlinBezirkHit } from './has-berlin-bezirk-hit.js';
import type { LayerHit } from './types.js';

function hit(layer: string, value: unknown = 'x', reason?: LayerHit['reason']): LayerHit {
	const h: LayerHit = {
		layer,
		value,
		source: 'Test',
		updatedAt: '2026-01-01T00:00:00Z',
		license: 'CC BY 4.0'
	};
	if (reason) h.reason = reason;
	return h;
}

describe('hasBerlinBezirkHit', () => {
	it('returns true when bezirke hit has non-null value', () => {
		expect(hasBerlinBezirkHit([hit('bezirke', 'Mitte')])).toBe(true);
	});

	it('returns true when bezirke hit mixed with others', () => {
		expect(hasBerlinBezirkHit([hit('milieuschutz'), hit('bezirke', 'Pankow')])).toBe(true);
	});

	it('returns false on empty hits (Brandenburg way-out, server BBOX-filtered)', () => {
		expect(hasBerlinBezirkHit([])).toBe(false);
	});

	it('returns false when only non-bezirke hits', () => {
		expect(hasBerlinBezirkHit([hit('milieuschutz'), hit('laerm-2023')])).toBe(false);
	});

	it('does not match by prefix or substring', () => {
		expect(hasBerlinBezirkHit([hit('bezirke-rand'), hit('lor-bezirke')])).toBe(false);
	});

	// Story Brandenburg-Click-Guard Fix: get-layers-at-point liefert für jeden Polygon-Layer
	// einen Hit mit `value: null, reason: 'no-coverage'` wenn kein Polygon trifft. Util muss
	// das erkennen, sonst rutscht Blankenfelde-Mahlow durch.
	it('returns false for bezirke hit with value=null (no-coverage = Brandenburg in BBOX)', () => {
		expect(hasBerlinBezirkHit([hit('bezirke', null, 'no-coverage')])).toBe(false);
	});

	it('returns false even without explicit reason if value is null', () => {
		expect(hasBerlinBezirkHit([hit('bezirke', null)])).toBe(false);
	});

	it('returns true for bezirke object-value (properties from polygon)', () => {
		expect(
			hasBerlinBezirkHit([hit('bezirke', { Gemeinde_name: 'Mitte', Gemeinde_schluessel: '01' })])
		).toBe(true);
	});
});
