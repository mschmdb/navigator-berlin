/**
 * Textbereinigung (spec-textbereinigung-layer-texte.md, Entscheidung 6):
 * geteilter Helper für "ist das ein Kiez-Score-Layer?" -- genutzt von
 * `/layer/[slug]/+page.svelte` (Methodik-Aside) und `map-legend.svelte`
 * ("Eigene Berechnung"-Link), damit beide Stellen auf `/methodik/kiez-score`
 * statt der allgemeinen `/methodik`-Seite verlinken. Alle acht
 * `kiez-score-*`-Slugs sind die einzigen Layer mit `sourceUrl` unter
 * `navigator.berlin/derived/` (siehe `static/layers/MANIFEST.json`).
 */
export function isKiezScoreLayer(slug: string): boolean {
	return slug.startsWith('kiez-score-');
}
