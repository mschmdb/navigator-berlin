import type { PageServerLoad } from './$types';
import { loadCrossLayerTemplates } from '$lib/server/cross-layer-templates-loader.js';
import {
	findTemplatesForScope,
	renderTemplate,
	type RenderedTemplate,
	type TemplateScope
} from '$lib/data/cross-layer-templates/index.js';
import { getLocale } from '$lib/paraglide/runtime.js';
import { buildBezirkFixture, buildKiezFixture } from './preview-fixtures.js';

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
	const locale = getLocale();
	const kiezFixture = buildKiezFixture(locale);
	const bezirkFixture = buildBezirkFixture(locale);
	const bundles = await loadCrossLayerTemplates();
	const kiezTemplates = findTemplatesForScope(bundles, 'kiez');
	const bezirkTemplates = findTemplatesForScope(bundles, 'bezirk');

	const previews: PreviewEntry[] = [];
	for (const t of kiezTemplates) {
		const rendered = renderTemplate(t, kiezFixture.context, { locale });
		previews.push({
			id: t.id,
			scope: 'kiez',
			rendered,
			contextLabel: kiezFixture.contextLabel,
			contextJson: JSON.stringify(kiezFixture.context, null, 2),
			requires: t.requires,
			editorialNote: t.editorialNote ?? null,
			tags: t.tags ?? []
		});
	}
	for (const t of bezirkTemplates) {
		const rendered = renderTemplate(t, bezirkFixture.context, { locale });
		previews.push({
			id: t.id,
			scope: 'bezirk',
			rendered,
			contextLabel: bezirkFixture.contextLabel,
			contextJson: JSON.stringify(bezirkFixture.context, null, 2),
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
