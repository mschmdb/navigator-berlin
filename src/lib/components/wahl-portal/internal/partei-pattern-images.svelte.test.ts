import { describe, expect, it } from 'vitest';
import {
	buildPatternImageData,
	toImageData,
	registerPartyPatterns,
	patternImageId
} from './partei-pattern-images.js';

describe('toImageData (browser)', () => {
	it('liefert ein echtes ImageData mit passenden Maßen', () => {
		const spec = buildPatternImageData('dots', '#0f6e2c');
		const img = toImageData(spec);
		expect(img).toBeInstanceOf(ImageData);
		expect(img.width).toBe(spec.width);
		expect(img.height).toBe(spec.height);
	});
});

describe('registerPartyPatterns', () => {
	function createFakeMap() {
		const added: Record<string, unknown> = {};
		return {
			added,
			hasImage: (id: string) => id in added,
			addImage: (id: string, image: unknown) => {
				added[id] = image;
			}
		};
	}

	it('registriert ein ImageData-Pattern pro Partei mit patternImageId-Key', () => {
		const map = createFakeMap();
		registerPartyPatterns(map, ['SPD', 'GRÜNE']);
		expect(map.added[patternImageId('SPD')]).toBeInstanceOf(ImageData);
		expect(map.added[patternImageId('GRÜNE')]).toBeInstanceOf(ImageData);
	});

	it('skipt bereits registrierte IDs (Idempotenz)', () => {
		const map = createFakeMap();
		registerPartyPatterns(map, ['SPD']);
		const before = map.added[patternImageId('SPD')];
		registerPartyPatterns(map, ['SPD']);
		expect(map.added[patternImageId('SPD')]).toBe(before);
	});

	it('registriert unbekannte Labels unter eigener ID mit dem Sonstige-Pattern', () => {
		const map = createFakeMap();
		registerPartyPatterns(map, ['Piraten', 'Volt']);
		// Beide unbekannten Labels normalisieren NICHT auf denselben Slug (der
		// echte Kurzname bleibt Teil der ID), aber beide registrieren erfolgreich.
		expect(map.added[patternImageId('Piraten')]).toBeInstanceOf(ImageData);
		expect(map.added[patternImageId('Volt')]).toBeInstanceOf(ImageData);
	});
});
