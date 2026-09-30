import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime.js';
import { load, type PreviewEntry } from './+page.server';

interface LoadData {
	readonly previews: readonly PreviewEntry[];
	readonly totalTemplates: number;
}
const runLoad = () => (load as unknown as () => Promise<LoadData>)();

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('cross-layer-templates +page.server load', () => {
	it('DE: rendert body_de mit deutschen Fixture-Labels', async () => {
		overwriteGetLocale(() => 'de');
		const data = await runLoad();
		const kiez = data.previews.find((p) => p.scope === 'kiez');
		expect(kiez?.contextLabel).toBe('Kiez Friedrichshain Nord');
		expect(kiez?.rendered.body).toContain(
			'Im Kiez Friedrichshain Nord verteilten sich die Zweitstimmen'
		);
		expect(kiez?.rendered.missingVars).toEqual([]);
	});

	it('EN: rendert body_en mit englischen Fixture-Labels', async () => {
		overwriteGetLocale(() => 'en');
		const data = await runLoad();
		const kiez = data.previews.find((p) => p.scope === 'kiez');
		expect(kiez?.rendered.body).toBe(
			'In the Kiez Friedrichshain Nord, the party votes were distributed as follows in the most recent Bundestag elections: 2013, 2017, 2021, 2025, with the strongest party in each case being Die Linke (2013), GRÜNE (2017), GRÜNE (2021), GRÜNE (2025).'
		);
		expect(kiez?.rendered.missingVars).toEqual([]);
		expect(JSON.parse(kiez?.contextJson ?? '{}').stimmtyp_label).toBe('party votes');
	});

	it('zählt totalTemplates passend zu den Vorschauen', async () => {
		const data = await runLoad();
		expect(data.totalTemplates).toBe(data.previews.length);
	});
});
