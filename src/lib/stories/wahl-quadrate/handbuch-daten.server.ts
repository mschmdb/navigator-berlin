import raw from '../../../../static/data/stories-wahl.json';
import { toHandbuchDaten, type HandbuchDaten } from './handbuch-daten';
import type { StoriesWahlData } from './types';

let cached: HandbuchDaten | null = null;

/** Daten für das Handbuch, beim Prerender einmal aus `static/data/stories-wahl.json` gelesen. */
export function loadHandbuchDaten(): HandbuchDaten {
	cached ??= toHandbuchDaten(raw as StoriesWahlData);
	return cached;
}
