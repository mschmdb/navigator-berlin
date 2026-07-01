import { getLayerDisplayName } from './layer-palette-filter.js';

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
type SummaryFn = (props: Props, layerName: string) => PopoverSummary;

const STOLPERSTEIN_FALLBACK_TITLE = 'Stolperstein';

const SUMMARY_BY_SLUG: Record<string, SummaryFn> = {
	stolpersteine: (props) => {
		const person = readString(props, 'person');
		return { title: person ?? STOLPERSTEIN_FALLBACK_TITLE };
	},
	trinkbrunnen: (props, layerName) => ({
		title: readString(props, 'name') ?? layerName
	}),
	'kuehle-orte': (props, layerName) => {
		const name = readString(props, 'name') ?? layerName;
		const cat = readString(props, 'cat');
		const scoreRaw = props?.cool_score;
		const score = typeof scoreRaw === 'number' ? scoreRaw : null;
		const parts = [cat, score !== null ? `Kühle ${score}/5` : null].filter(
			(x): x is string => x !== null
		);
		return parts.length > 0 ? { title: name, subtitle: parts.join(' · ') } : { title: name };
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

export function getPopoverSummary(slug: string, properties: Props): PopoverSummary {
	const layerName = getLayerDisplayName(slug);
	const fn = SUMMARY_BY_SLUG[slug];
	if (!fn) return { title: layerName };
	return fn(properties, layerName);
}
