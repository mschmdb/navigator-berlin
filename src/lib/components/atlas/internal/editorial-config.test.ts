import { describe, expect, it } from 'vitest';
import {
	EDITORIAL_CONFIG,
	getEditorialConfig,
	ALL_LAYERS_GET_FEEDBACK_MAILTO
} from './editorial-config.js';
import type { DisclaimerVariant } from './editorial-types.js';

const ALLOWED_VARIANTS: DisclaimerVariant[] = [
	'legal',
	'historic',
	'seasonal',
	'source',
	'mss-aggregat'
];

describe('EDITORIAL_CONFIG', () => {
	it('mietspiegel-wohnlage hat legal-Variant + Source-URL', () => {
		const c = EDITORIAL_CONFIG['mietspiegel-wohnlage'];
		expect(c.disclaimerVariants).toContain('legal');
		expect(c.primarySourceUrl).toMatch(/^https:\/\//);
		expect(c.feedbackMailto).toBe(true);
	});

	it('bodenrichtwerte hat legal-Variant', () => {
		expect(EDITORIAL_CONFIG.bodenrichtwerte.disclaimerVariants).toContain('legal');
	});

	it('trinkbrunnen hat seasonal-Variant', () => {
		expect(EDITORIAL_CONFIG.trinkbrunnen.disclaimerVariants).toContain('seasonal');
	});

	it('kuehle-orte hat source-Variant + OSM-Quelle + feedbackMailto (FR13)', () => {
		const c = EDITORIAL_CONFIG['kuehle-orte'];
		expect(c.slug).toBe('kuehle-orte');
		expect(c.disclaimerVariants).toContain('source');
		expect(c.primarySourceUrl).toMatch(/^https:\/\//);
		expect(c.feedbackMailto).toBe(true);
	});

	it('mauer-sektoren hat historic-Variant + MauerSektorenDetail + neverMachineTranslate', () => {
		const c = EDITORIAL_CONFIG['mauer-sektoren'];
		expect(c.disclaimerVariants).toContain('historic');
		expect(c.customComponent).toBe('MauerSektorenDetail');
		expect(c.neverMachineTranslate).toBe(true);
	});

	it('alle Slugs haben mind. eine gültige DisclaimerVariant', () => {
		for (const cfg of Object.values(EDITORIAL_CONFIG)) {
			expect(cfg.disclaimerVariants.length).toBeGreaterThanOrEqual(1);
			for (const v of cfg.disclaimerVariants) expect(ALLOWED_VARIANTS).toContain(v);
		}
	});

	it('slug-Key matched slug-Property', () => {
		for (const [key, cfg] of Object.entries(EDITORIAL_CONFIG)) {
			expect(cfg.slug).toBe(key);
		}
	});

	it('alle sensible Layer haben feedbackMailto: true', () => {
		for (const cfg of Object.values(EDITORIAL_CONFIG)) {
			expect(cfg.feedbackMailto).toBe(true);
		}
	});
});

describe('getEditorialConfig', () => {
	it('liefert Config für bekannten Slug', () => {
		const c = getEditorialConfig('mauer-sektoren');
		expect(c?.slug).toBe('mauer-sektoren');
	});

	it('liefert undefined für unbekannten Slug', () => {
		expect(getEditorialConfig('unbekannter-layer')).toBeUndefined();
	});
});

describe('ALL_LAYERS_GET_FEEDBACK_MAILTO', () => {
	it('ist true (FR53)', () => {
		expect(ALL_LAYERS_GET_FEEDBACK_MAILTO).toBe(true);
	});
});
