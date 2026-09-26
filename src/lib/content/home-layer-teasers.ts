/**
 * Story 2.12 T2: Layer-Teaser-Content für die Home-Landing.
 *
 * Editorial-Auswahl 5 von 38 Daten-Schichten. Pro Eintrag eine knappe
 * Sub-Line die zeigt, worüber die Schicht spricht.
 *
 * `slug` MUSS zu einem Eintrag in `static/layers/MANIFEST.json` passen.
 * Test `home-layer-teasers.test.ts` validiert das beim Build.
 *
 * `iconKey` ist eine String-Konvention statt direkter Lucide-Komponenten-
 * Importe, damit das Modul ausserhalb Svelte-Land lesbar bleibt (z.B. in
 * Build-Scripts oder Manifest-Validierung).
 *
 * i18n Block B2: `label`/`summary` sind echter UI-Text und werden über
 * `homeLayerTeaserLabel()`/`homeLayerTeaserSummary()` locale-abhängig
 * aufgelöst (Auswertung beim Aufruf, keine Modul-Konstante). `slug` bleibt
 * Datenschlüssel.
 */
import { m } from '$lib/paraglide/messages.js';
import { toMessageOptions, assertUnreachable, type LocaleOptions } from '$lib/i18n/message-options.js';

export const LAYER_TEASER_ICON_KEYS = [
	'volume-2',
	'tree-pine',
	'thermometer',
	'train',
	'home',
	'landmark',
	'file-text'
] as const;
export type LayerTeaserIconKey = (typeof LAYER_TEASER_ICON_KEYS)[number];

export const HOME_LAYER_TEASER_SLUGS = [
	'laerm-2023',
	'gruenversorgung-2023',
	'klima-pet-2022',
	'kiez-score-mobilitaet',
	'wohnlagen-2024',
	'kiez-score-kultur',
	'kiez-score-kriminalitaet'
] as const;
export type HomeLayerTeaserSlug = (typeof HOME_LAYER_TEASER_SLUGS)[number];

export interface HomeLayerTeaser {
	readonly slug: HomeLayerTeaserSlug;
	readonly iconKey: LayerTeaserIconKey;
}

export const HOME_LAYER_TEASERS: readonly HomeLayerTeaser[] = [
	{ slug: 'laerm-2023', iconKey: 'volume-2' },
	{ slug: 'gruenversorgung-2023', iconKey: 'tree-pine' },
	{ slug: 'klima-pet-2022', iconKey: 'thermometer' },
	{ slug: 'kiez-score-mobilitaet', iconKey: 'train' },
	{ slug: 'wohnlagen-2024', iconKey: 'home' },
	{ slug: 'kiez-score-kultur', iconKey: 'landmark' },
	{ slug: 'kiez-score-kriminalitaet', iconKey: 'file-text' }
];

export function homeLayerTeaserLabel(slug: HomeLayerTeaserSlug, o?: LocaleOptions): string {
	const options = toMessageOptions(o);
	switch (slug) {
		case 'laerm-2023':
			return m.home_layer_teaser_laerm_2023_label(undefined, options);
		case 'gruenversorgung-2023':
			return m.home_layer_teaser_gruenversorgung_2023_label(undefined, options);
		case 'klima-pet-2022':
			return m.home_layer_teaser_klima_pet_2022_label(undefined, options);
		case 'kiez-score-mobilitaet':
			return m.home_layer_teaser_kiez_score_mobilitaet_label(undefined, options);
		case 'wohnlagen-2024':
			return m.home_layer_teaser_wohnlagen_2024_label(undefined, options);
		case 'kiez-score-kultur':
			return m.home_layer_teaser_kiez_score_kultur_label(undefined, options);
		case 'kiez-score-kriminalitaet':
			return m.home_layer_teaser_kiez_score_kriminalitaet_label(undefined, options);
		default:
			return assertUnreachable(slug);
	}
}

export function homeLayerTeaserSummary(slug: HomeLayerTeaserSlug, o?: LocaleOptions): string {
	const options = toMessageOptions(o);
	switch (slug) {
		case 'laerm-2023':
			return m.home_layer_teaser_laerm_2023_summary(undefined, options);
		case 'gruenversorgung-2023':
			return m.home_layer_teaser_gruenversorgung_2023_summary(undefined, options);
		case 'klima-pet-2022':
			return m.home_layer_teaser_klima_pet_2022_summary(undefined, options);
		case 'kiez-score-mobilitaet':
			return m.home_layer_teaser_kiez_score_mobilitaet_summary(undefined, options);
		case 'wohnlagen-2024':
			return m.home_layer_teaser_wohnlagen_2024_summary(undefined, options);
		case 'kiez-score-kultur':
			return m.home_layer_teaser_kiez_score_kultur_summary(undefined, options);
		case 'kiez-score-kriminalitaet':
			return m.home_layer_teaser_kiez_score_kriminalitaet_summary(undefined, options);
		default:
			return assertUnreachable(slug);
	}
}
