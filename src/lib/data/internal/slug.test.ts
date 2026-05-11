import { describe, expect, it } from 'vitest';
import { normalizeSlug } from './slug.js';

describe('normalizeSlug', () => {
	it('lower-case + replace spaces', () => {
		expect(normalizeSlug('Boxhagener Kiez')).toBe('boxhagener-kiez');
	});

	it('Bezirk-Name mit Bindestrich', () => {
		expect(normalizeSlug('Friedrichshain-Kreuzberg')).toBe('friedrichshain-kreuzberg');
	});

	it('Umlaute zu ASCII (Mueggelheim)', () => {
		expect(normalizeSlug('Müggelheim')).toBe('mueggelheim');
		expect(normalizeSlug('Köpenick')).toBe('koepenick');
	});

	it('Eszett zu ss', () => {
		expect(normalizeSlug('Großbeerenstraße')).toBe('grossbeerenstrasse');
	});

	it('Mehrfach-Spaces + Sonderzeichen zu single dash', () => {
		expect(normalizeSlug('Foo   Bar !! Baz')).toBe('foo-bar-baz');
	});

	it('Leading/Trailing dashes entfernt', () => {
		expect(normalizeSlug('  -Foo-  ')).toBe('foo');
	});

	it('Empty input liefert empty string', () => {
		expect(normalizeSlug('')).toBe('');
		expect(normalizeSlug('   ')).toBe('');
	});

	it('Idempotent bei bereits-slug-Input', () => {
		expect(normalizeSlug('friedrichshain-kreuzberg')).toBe('friedrichshain-kreuzberg');
	});
});
