import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bundleDisplayName } from './bundle-display-name.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const de = JSON.parse(readFileSync(join(ROOT, 'messages', 'de.json'), 'utf8')) as Record<
	string,
	string
>;

describe('bundleDisplayName (GH-93)', () => {
	it('zeigt den Kategorie-Namen ohne Buchstaben-Präfix', () => {
		expect(bundleDisplayName('C: Umwelt')).toBe('Umwelt');
		expect(bundleDisplayName('B: Wohn-Daten')).toBe('Wohnen');
		expect(bundleDisplayName('H: Wahldaten')).toBe('Wahlen');
	});

	it('stimmt mit den DE-Labels der Layer-Palette überein', () => {
		const pairs: Array<[string, string]> = [
			['A: Boundaries', 'atlas_bundle_label_a'],
			['B: Wohn-Daten', 'atlas_bundle_label_b'],
			['C: Umwelt', 'atlas_bundle_label_c'],
			['D: Memorial', 'atlas_bundle_label_d'],
			['E: Soziale Infrastruktur', 'atlas_bundle_label_e'],
			['F: Mobilität', 'atlas_bundle_label_f'],
			['G: Kiez-Score', 'atlas_bundle_label_g'],
			['H: Wahldaten', 'atlas_bundle_label_h'],
			['I: Demografie', 'atlas_bundle_label_i'],
			['J: Kultur', 'atlas_bundle_label_j']
		];
		for (const [bundle, key] of pairs) {
			expect(bundleDisplayName(bundle)).toBe(de[key]);
		}
	});

	it('streicht bei unbekannten Bundles nur das Buchstaben-Präfix', () => {
		expect(bundleDisplayName('K: Neues Bundle')).toBe('Neues Bundle');
		expect(bundleDisplayName('Ohne Präfix')).toBe('Ohne Präfix');
	});
});
