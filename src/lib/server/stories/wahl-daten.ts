import raw from '../../../../static/data/stories-wahl.json';
import { JAHRE, WAHL_TYPEN, wahlSlug } from '$lib/stories/wahl-quadrate/parteien';
import type { StoriesWahlData, WahlSlug } from '$lib/stories/wahl-quadrate/types';

const SLUGS: WahlSlug[] = WAHL_TYPEN.flatMap((t) => JAHRE[t].map((j) => wahlSlug(t, j)!));

/**
 * Prüft die Form von `stories-wahl.json` grob, bevor Plakat und Bilder daraus entstehen:
 * Schema-Version, 12 Bezirke, jede Wahl in jedem Bezirk und berlinweit.
 */
export function parseStoriesWahl(input: unknown): StoriesWahlData {
	const d = input as Partial<StoriesWahlData>;
	if (d?.schemaVersion !== 1) throw new Error('stories-wahl.json: schemaVersion 1 erwartet');
	if (!Array.isArray(d.bezirke) || d.bezirke.length !== 12)
		throw new Error('stories-wahl.json: 12 Bezirke erwartet');
	for (const slug of SLUGS) {
		if (!d.berlin?.[slug]?.parteien) throw new Error(`stories-wahl.json: Berlin ohne ${slug}`);
		for (const b of d.bezirke)
			if (!b.wahlen?.[slug]?.parteien) throw new Error(`stories-wahl.json: ${b.name} ohne ${slug}`);
	}
	return d as StoriesWahlData;
}

let cached: StoriesWahlData | null = null;

export function loadStoriesWahl(): StoriesWahlData {
	cached ??= parseStoriesWahl(raw);
	return cached;
}
