import type { PageServerLoad } from './$types';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
	loadTemplatesFromRawMap,
	findTemplatesForScope,
	renderTemplate,
	type RenderedTemplate,
	type TemplateContext,
	type TemplateScope
} from '$lib/data/cross-layer-templates/index.js';

const TEMPLATE_ROOT = join(process.cwd(), 'src/lib/data/cross-layer-templates');

async function loadAllYaml(): Promise<Record<string, string>> {
	const out: Record<string, string> = {};
	async function walk(dir: string): Promise<void> {
		let entries: string[];
		try {
			entries = await readdir(dir);
		} catch {
			return;
		}
		for (const name of entries) {
			const abs = join(dir, name);
			const s = await stat(abs);
			if (s.isDirectory()) await walk(abs);
			else if (name.endsWith('.yaml') || name.endsWith('.yml')) {
				out[abs] = await readFile(abs, 'utf-8');
			}
		}
	}
	await walk(TEMPLATE_ROOT);
	return out;
}

const FIXTURE_KIEZ: TemplateContext = {
	kiez_name: 'Friedrichshain Nord',
	bezirk_name: 'Friedrichshain-Kreuzberg',
	wahl_typ_label: 'Bundestagswahl',
	wahl_jahr: 2025,
	top_partei_label: 'Bündnis 90/Die Grünen',
	top_anteil_pct: '24,7 %',
	zweite_partei_label: 'Die Linke',
	zweite_anteil_pct: '19,8 %',
	wohnlage_label: 'mittlere Wohnlage',
	laerm_label: 'hohe Lärm-Klasse',
	sparkline_jahre: '2013, 2017, 2021, 2025',
	sparkline_jahre_top_parteien:
		'Die Linke (2013), GRÜNE (2017), GRÜNE (2021), GRÜNE (2025)'
};

const FIXTURE_BEZIRK: TemplateContext = {
	bezirk_name: 'Pankow',
	wahl_typ_label: 'Abgeordnetenhauswahl',
	wahl_jahr: 2023,
	top_partei_label: 'CDU',
	top_anteil_pct: '23,1 %',
	zweite_partei_label: 'Bündnis 90/Die Grünen',
	zweite_anteil_pct: '21,4 %'
};

export interface PreviewEntry {
	readonly id: string;
	readonly scope: TemplateScope;
	readonly rendered: RenderedTemplate;
	readonly contextLabel: string;
	readonly contextJson: string;
	readonly requires: readonly string[];
	readonly editorialNote: string | null;
	readonly tags: readonly string[];
}

export const load: PageServerLoad = async () => {
	const raw = await loadAllYaml();
	const bundles = loadTemplatesFromRawMap(raw);
	const kiezTemplates = findTemplatesForScope(bundles, 'kiez');
	const bezirkTemplates = findTemplatesForScope(bundles, 'bezirk');

	const previews: PreviewEntry[] = [];
	for (const t of kiezTemplates) {
		const rendered = renderTemplate(t, FIXTURE_KIEZ);
		previews.push({
			id: t.id,
			scope: 'kiez',
			rendered,
			contextLabel: 'Kiez Friedrichshain Nord',
			contextJson: JSON.stringify(FIXTURE_KIEZ, null, 2),
			requires: t.requires,
			editorialNote: t.editorialNote ?? null,
			tags: t.tags ?? []
		});
	}
	for (const t of bezirkTemplates) {
		const rendered = renderTemplate(t, FIXTURE_BEZIRK);
		previews.push({
			id: t.id,
			scope: 'bezirk',
			rendered,
			contextLabel: 'Bezirk Pankow',
			contextJson: JSON.stringify(FIXTURE_BEZIRK, null, 2),
			requires: t.requires,
			editorialNote: t.editorialNote ?? null,
			tags: t.tags ?? []
		});
	}

	return {
		previews,
		totalTemplates: previews.length
	};
};
