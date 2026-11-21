import { getLayerDisplayName } from './layer-palette-filter.js';
import { toAtlasMessageOptions, type LocaleOptions } from './atlas-label-options.js';
import { categoryLabel } from '#lib/components/kuehle-orte/category-label.js';
import { m } from '#lib/paraglide/messages.js';
import type { Locale } from '#lib/paraglide/runtime.js';

export interface PopoverSummary {
	readonly title: string;
	readonly subtitle?: string;
}

type Props = Record<string, unknown> | null | undefined;

function readString(props: Props, key: string): string | null {
	if (!props) return null;
	const v = props[key];
	if (typeof v !== 'string') return null;
	const trimmed = v.trim();
	return trimmed.length > 0 ? trimmed : null;
}

// Story 1.15 AC-4 + AC-8: Per-Slug Summary-Logic. Stolperstein-Special-Case = NIE
// "Unbekannte Person"-Fallback (Editorial-Würde, FR51).
type SummaryFn = (props: Props, layerName: string, locale: Locale) => PopoverSummary;

const STOLPERSTEIN_FALLBACK_TITLE = 'Stolperstein';

// Winter-Öffnung (#71): nur belegte Werte aus dem GeoJSON, alles andere ist „nicht geprüft“.
type MessageFn = (inputs: undefined, opts: { locale: Locale }) => string;
const WINTER_OPEN_LABEL: Readonly<Record<string, MessageFn>> = {
	yes: m.atlas_poi_waerme_winter_yes,
	limited: m.atlas_poi_waerme_winter_limited,
	no: m.atlas_poi_waerme_winter_no
};

const SUMMARY_BY_SLUG: Record<string, SummaryFn> = {
	stolpersteine: (props) => {
		const person = readString(props, 'person');
		return { title: person ?? STOLPERSTEIN_FALLBACK_TITLE };
	},
	trinkbrunnen: (props, layerName) => {
		const name = readString(props, 'name') ?? layerName;
		// Kompakte, für Durstige nützliche Angaben aus den OSM-Tags. Max zwei, damit der
		// Tooltip einzeilig bleibt (Priorität: kostenlos, Flaschen, Barrierefreiheit).
		const parts: string[] = [];
		if (readString(props, 'fee') === 'no') parts.push('kostenlos');
		if (readString(props, 'bottle') === 'yes') parts.push('Flaschen auffüllen');
		const wc = readString(props, 'wheelchair');
		if (wc === 'yes') parts.push('barrierefrei');
		else if (wc === 'limited') parts.push('teils barrierefrei');
		const subtitle = parts.slice(0, 2).join(', ');
		return subtitle ? { title: name, subtitle } : { title: name };
	},
	'kuehle-orte': (props, layerName) => {
		const name = readString(props, 'name') ?? layerName;
		const cat = readString(props, 'cat');
		const scoreRaw = props?.cool_score;
		const score = typeof scoreRaw === 'number' ? scoreRaw : null;
		const parts = [cat, score !== null ? `Kühle ${score}/5` : null].filter(
			(x): x is string => x !== null
		);
		return parts.length > 0 ? { title: name, subtitle: parts.join(', ') } : { title: name };
	},
	'waerme-orte': (props, layerName, locale) => {
		const opts = { locale };
		const name = readString(props, 'name') ?? layerName;
		const cat = readString(props, 'cat');
		const raw = readString(props, 'winter_open') ?? '';
		const winter = Object.hasOwn(WINTER_OPEN_LABEL, raw)
			? WINTER_OPEN_LABEL[raw](undefined, opts)
			: m.atlas_poi_waerme_winter_unknown(undefined, opts);
		const parts = [
			cat ? categoryLabel(cat, locale).text : null,
			winter,
			readString(props, 'stay_without_purchase') === 'yes'
				? m.atlas_poi_waerme_stay_yes(undefined, opts)
				: null,
			readString(props, 'is_free') === 'free' ? m.atlas_poi_waerme_free(undefined, opts) : null
		];
		return { title: name, subtitle: parts.filter((x) => x !== null).join(', ') };
	},
	'kitas-2024': (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	}),
	'schulen-2024': (props, layerName) => {
		const name = readString(props, 'name') ?? layerName;
		const schulart = readString(props, 'schulart');
		return schulart ? { title: name, subtitle: schulart } : { title: name };
	},
	'krankenhaeuser-plan': (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	}),
	'krankenhaeuser-weitere': (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	}),
	'sportanlagen-2024': (props, layerName) => ({
		title: readString(props, 'name') ?? readString(props, 'sport') ?? layerName
	}),
	schwimmbaeder: (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	}),
	'ubahn-stationen': (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	}),
	'sbahn-stationen': (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	}),
	'tram-haltestellen': (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	}),
	'bus-haltestellen': (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	})
};

/** Ohne `opts.locale` deutsch (Boundary i18n B3a, siehe `atlas-label-options.ts`). */
export function getPopoverSummary(
	slug: string,
	properties: Props,
	opts?: LocaleOptions
): PopoverSummary {
	const layerName = getLayerDisplayName(slug, opts);
	const fn = SUMMARY_BY_SLUG[slug];
	if (!fn) return { title: layerName };
	return fn(properties, layerName, toAtlasMessageOptions(opts).locale);
}
