import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime.js';
import type { TemplateContext } from '$lib/data/cross-layer-templates/index.js';

export interface PreviewFixture {
	readonly contextLabel: string;
	readonly context: TemplateContext;
}

export interface PreviewSource {
	readonly label: string;
	readonly license: string;
}

const SOURCE_LICENSE = 'dl-de/by-2-0';

/** Fixture-Kiez der Vorschau. Die Werte sind Beispieldaten, kein Live-Wiring. */
export function buildKiezFixture(locale: Locale): PreviewFixture {
	const o = { locale };
	return {
		contextLabel: m.methodik_clt_fixture_kiez_context_label(undefined, o),
		context: {
			kiez_name: m.methodik_clt_fixture_kiez_name(undefined, o),
			wahl_typ_label: m.methodik_clt_fixture_kiez_wahl_typ_label(undefined, o),
			stimmtyp_label: m.methodik_clt_fixture_kiez_stimmtyp_label(undefined, o),
			sparkline_jahre: m.methodik_clt_fixture_kiez_sparkline_jahre(undefined, o),
			sparkline_jahre_top_parteien: m.methodik_clt_fixture_kiez_sparkline_top_parteien(undefined, o)
		}
	};
}

export function buildBezirkFixture(locale: Locale): PreviewFixture {
	const o = { locale };
	return {
		contextLabel: m.methodik_clt_fixture_bezirk_context_label(undefined, o),
		context: {
			bezirk_name: m.methodik_clt_fixture_bezirk_name(undefined, o),
			wahl_typ_label: m.methodik_clt_fixture_bezirk_wahl_typ_label(undefined, o),
			wahl_jahr: 2023,
			top_partei_label: m.methodik_clt_fixture_bezirk_top_partei_label(undefined, o),
			top_anteil_pct: m.methodik_clt_fixture_bezirk_top_anteil_pct(undefined, o),
			zweite_partei_label: m.methodik_clt_fixture_bezirk_zweite_partei_label(undefined, o),
			zweite_anteil_pct: m.methodik_clt_fixture_bezirk_zweite_anteil_pct(undefined, o)
		}
	};
}

const TAG_MESSAGE: Readonly<Record<string, (p: undefined, o: { locale: Locale }) => string>> = {
	wahl: m.methodik_clt_tag_wahl,
	trend: m.methodik_clt_tag_trend,
	zeitreihe: m.methodik_clt_tag_zeitreihe
};

/** Chip-Label für ein Template-Tag. Unbekannte Tags bleiben als Bezeichner stehen. */
export function previewTagLabel(tag: string, locale: Locale): string {
	const message = Object.hasOwn(TAG_MESSAGE, tag) ? TAG_MESSAGE[tag] : undefined;
	return message ? message(undefined, { locale }) : tag;
}

export function previewSources(locale: Locale): PreviewSource[] {
	const o = { locale };
	return [
		{ label: m.methodik_clt_source_label_wahl(undefined, o), license: SOURCE_LICENSE },
		{ label: m.methodik_clt_source_label_mietspiegel(undefined, o), license: SOURCE_LICENSE },
		{ label: m.methodik_clt_source_label_laerm(undefined, o), license: SOURCE_LICENSE }
	];
}
