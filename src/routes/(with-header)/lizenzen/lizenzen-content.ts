/**
 * Inhalte der Lizenzen-Seite (i18n C4c): Abschnitte, Lizenz-Infos, Software-Tabelle und
 * Gruppierung. Getrennt vom Markup, damit `+page.svelte` unter 500 Zeilen bleibt.
 * Texte sind Paraglide-Messages und folgen der Seiten-Locale. Kennungen, Software-Namen
 * und URLs bleiben unverändert.
 */
import type { LayerMetadata, License } from '$lib/data';
import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
import { m } from '$lib/paraglide/messages.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime';

export interface LizenzSection {
	readonly id: string;
	readonly label: string;
}

export function getSections(): readonly LizenzSection[] {
	return [
		{ id: 'daten-lizenzen', label: m.lizenzen_section_daten_lizenzen() },
		{ id: 'wahldaten', label: m.lizenzen_section_wahldaten() },
		{ id: 'demografie', label: m.lizenzen_section_demografie() },
		{ id: 'kriminalitaetsatlas', label: m.lizenzen_section_kriminalitaet() },
		{ id: 'klimadaten-dwd', label: m.lizenzen_section_klimadaten() },
		{ id: 'entitaets-verweise', label: m.lizenzen_section_entitaeten() },
		{ id: 'software', label: m.lizenzen_section_software() },
		{ id: 'schriften', label: m.lizenzen_section_schriften() },
		{ id: 'osm-namensnennung', label: m.lizenzen_section_osm() }
	];
}

export interface LicenseInfo {
	readonly key: License;
	readonly label: string;
	readonly summary: string;
	readonly url: string;
}

export function getLicenseInfo(license: License): LicenseInfo {
	switch (license) {
		case 'dl-de/zero-2-0':
			return {
				key: license,
				label: m.lizenzen_license_dl_zero_label(),
				summary: m.lizenzen_license_dl_zero_summary(),
				url: 'https://www.govdata.de/dl-de/zero-2-0'
			};
		case 'dl-de/by-2-0':
			return {
				key: license,
				label: m.lizenzen_license_dl_by_label(),
				summary: m.lizenzen_license_dl_by_summary(),
				url: 'https://www.govdata.de/dl-de/by-2-0'
			};
		case 'ODbL 1.0':
			return {
				key: license,
				label: 'Open Database License 1.0',
				summary: m.lizenzen_license_odbl_summary(),
				url: 'https://opendatacommons.org/licenses/odbl/1-0/'
			};
		case 'CC BY 4.0':
			return {
				key: license,
				label: 'Creative Commons Attribution 4.0',
				summary: m.lizenzen_license_cc_by_summary(),
				url: `https://creativecommons.org/licenses/by/4.0/deed.${getLocale() === 'de' ? 'de' : 'en'}`
			};
		case 'Geodatenzugangsgesetz':
			return {
				key: license,
				label: m.lizenzen_license_geozg_label(),
				summary: m.lizenzen_license_geozg_summary(),
				url: 'https://www.gesetze-im-internet.de/geozg/'
			};
		default:
			return {
				key: license,
				label: license,
				summary: m.lizenzen_license_fallback_summary(),
				url: '#'
			};
	}
}

/** Gruppiert Layer nach Lizenz, innerhalb der Gruppe nach Anzeigename der Seiten-Locale. */
export function groupByLicense(
	layers: readonly LayerMetadata[],
	locale: Locale
): Map<License, LayerMetadata[]> {
	const map = new Map<License, LayerMetadata[]>();
	for (const layer of layers) {
		const list = map.get(layer.license) ?? [];
		list.push(layer);
		map.set(layer.license, list);
	}
	for (const list of map.values()) {
		list.sort((a, b) =>
			getLayerDisplayName(a.slug, { locale }).localeCompare(
				getLayerDisplayName(b.slug, { locale }),
				locale
			)
		);
	}
	return map;
}

export interface SoftwareEntry {
	readonly name: string;
	readonly license: string;
	readonly url: string;
}

export function getRuntimeSoftware(): readonly SoftwareEntry[] {
	return [
		{ name: 'SvelteKit', license: 'MIT', url: 'https://kit.svelte.dev/' },
		{ name: 'Svelte', license: 'MIT', url: 'https://svelte.dev/' },
		{ name: 'MapLibre GL JS', license: 'BSD-3-Clause', url: 'https://maplibre.org/' },
		{ name: 'PMTiles', license: 'BSD-3-Clause', url: 'https://protomaps.com/' },
		{ name: '@lucide/svelte', license: 'ISC', url: 'https://lucide.dev/' },
		{ name: 'Turf.js (turf-bbox, turf-distance, …)', license: 'MIT', url: 'https://turfjs.org/' },
		{ name: 'd3-array, d3-scale, d3-interpolate', license: 'ISC', url: 'https://d3js.org/' },
		{ name: 'bits-ui', license: 'MIT', url: 'https://bits-ui.com/' },
		{ name: 'LayerChart', license: 'MIT', url: 'https://www.layerchart.com/' },
		{ name: 'valibot', license: 'MIT', url: 'https://valibot.dev/' },
		{ name: 'rbush', license: 'MIT', url: 'https://github.com/mourner/rbush' },
		{ name: 'lru-cache', license: 'ISC', url: 'https://github.com/isaacs/node-lru-cache' },
		{
			name: 'Paraglide JS (i18n)',
			license: 'Apache-2.0',
			url: 'https://inlang.com/m/gerre34r/library-inlang-paraglideJs'
		},
		{ name: 'Tailwind CSS', license: 'MIT', url: 'https://tailwindcss.com/' },
		{
			name: m.lizenzen_software_satori_name(),
			license: 'MPL-2.0',
			url: 'https://github.com/vercel/satori'
		}
	];
}
