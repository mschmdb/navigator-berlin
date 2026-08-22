import { describe, expect, it, beforeEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getKiezProfile } from './get-kiez-profile.js';
import { _resetDemografieCache } from './get-kiez-demografie.js';
import { _resetManifestCache } from './manifest.js';
import { _resetLayerCache } from './internal/layer-fetch.js';
import { _resetIndexCache } from './internal/spatial-index.js';

/**
 * Integration gegen echte static/layers-Daten: der Duplikat-Name "Heerstraße"
 * (Spandau + Charlottenburg-Wilmersdorf) muss über den Bezirk-suffixed Slug
 * auflösbar sein, der bare Slug darf nicht (8.2b-Mismatch-Fix).
 */
const fsFetch = (async (input: string) => {
	const path = typeof input === 'string' ? input : String(input);
	if (path.startsWith('/layers/') || path.startsWith('/data/')) {
		const file = resolve(process.cwd(), 'static', path.replace(/^\//, ''));
		const body = await readFile(file, 'utf-8');
		return new Response(body, { status: 200 });
	}
	return new Response('404', { status: 404 });
}) as unknown as typeof fetch;

beforeEach(() => {
	_resetDemografieCache();
	_resetManifestCache();
	_resetLayerCache();
	_resetIndexCache();
});

describe('getKiezProfile · Heerstraße-Disambiguierung', () => {
	it('löst heerstrasse-spandau auf den Bezirk Spandau auf', async () => {
		const profile = await getKiezProfile('de', 'heerstrasse-spandau', fsFetch);
		expect(profile.name).toBe('Heerstraße');
		expect(profile.bezirk).toBe('Spandau');
		expect(profile.slug).toBe('heerstrasse-spandau');
	});

	it('löst heerstrasse-charlottenburg-wilmersdorf auf den richtigen Bezirk auf', async () => {
		const profile = await getKiezProfile('de', 'heerstrasse-charlottenburg-wilmersdorf', fsFetch);
		expect(profile.name).toBe('Heerstraße');
		expect(profile.bezirk).toBe('Charlottenburg-Wilmersdorf');
		expect(profile.slug).toBe('heerstrasse-charlottenburg-wilmersdorf');
	});

	it('wirft 404 für den bare Slug des Duplikat-Namens', async () => {
		await expect(getKiezProfile('de', 'heerstrasse', fsFetch)).rejects.toMatchObject({
			status: 404
		});
	});

	it('löst einen eindeutigen Kiez weiterhin über den bare Slug auf', async () => {
		const profile = await getKiezProfile('de', 'buch', fsFetch);
		expect(profile.slug).toBe('buch');
	});
});

describe('getKiezProfile · Einwohner aus Demografie-Payload', () => {
	it('liefert echte Einwohnerzahlen statt 0 (Prod-GeoJSON führt keine EINWOHNER-Props)', async () => {
		const spandau = await getKiezProfile('de', 'heerstrasse-spandau', fsFetch);
		expect(spandau.einwohner).toBe(30971);
		const regierungsviertel = await getKiezProfile('de', 'regierungsviertel', fsFetch);
		expect(regierungsviertel.einwohner).toBe(13637);
	});
});
