import * as v from 'valibot';
import raw from '../../../../static/data/stories-kennzahlen.json';
import { HOME_BEZIRKE } from '../../content/home-bezirke.js';
import type { BezirkItem, KennzahlenQuelle } from './types';

const share = v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(1)));
const nonNegative = v.nullable(v.pipe(v.number(), v.minValue(0)));
const BezirkSchema = v.object({
	slug: v.string(),
	gruen: share,
	altbauAnteil: share,
	laermDb: v.nullable(v.pipe(v.number(), v.minValue(20), v.maxValue(100))),
	bewohnerProKm2: nonNegative,
	haltestelle400mAnteil: share,
	clubs: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)))
});
const DatenSchema = v.object({
	sources: v.array(
		v.object({
			name: v.string(),
			stand: v.optional(v.string()),
			url: v.optional(v.string()),
			file: v.optional(v.string())
		})
	),
	bezirke: v.array(BezirkSchema)
});

export interface BezirkeDaten {
	readonly sources: readonly KennzahlenQuelle[];
	readonly bezirke: readonly BezirkItem[];
}

export function parseBezirkeDaten(input: unknown): BezirkeDaten {
	const parsed = v.parse(DatenSchema, input);
	const bezirke = HOME_BEZIRKE.map((b) => {
		const kennzahlen = parsed.bezirke.find((k) => k.slug === b.slug);
		if (!kennzahlen) throw new Error(`stories-kennzahlen.json: Bezirk ${b.slug} fehlt`);
		return { slug: b.slug, name: b.name, kennzahlen };
	});
	return { sources: parsed.sources, bezirke };
}

let cache: BezirkeDaten | undefined;

/**
 * Liest nur Bezirke und Quellen, damit die Nutzlast klein bleibt. Die JSON-Datei mit den Kiezen
 * liegt öffentlich unter /data/. Werte kommen nur aus dieser Datei. Der Aufruf parst einmal pro Prozess.
 */
export function loadBezirkeDaten(): BezirkeDaten {
	cache ??= parseBezirkeDaten(raw);
	return cache;
}

/** Die ersten vier Bezirke alphabetisch: stabile Auswahl ohne Wertung. */
export function teaserBezirke(): readonly BezirkItem[] {
	return loadBezirkeDaten().bezirke.slice(0, 4);
}
