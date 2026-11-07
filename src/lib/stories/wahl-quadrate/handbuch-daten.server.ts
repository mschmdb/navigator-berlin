import raw from '../../../../static/data/stories-wahl.json';
import type { StoriesWahlData } from './types';

/**
 * Wahldaten für den Beitrag „Berlin in Quadraten“, beim Prerender aus
 * `static/data/stories-wahl.json` gelesen. Kapitel 1 bis 5 verkleinern sie mit
 * `toHandbuchDaten`, „Alle Bezirke, alle Wahlen“ (#191) braucht sie ganz.
 */
export function loadStoriesWahl(): StoriesWahlData {
	return raw as StoriesWahlData;
}
