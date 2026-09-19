/**
 * Adress-Hervorhebung: Zustand + Handler ausgelagert (Datei-Zeilenlimit
 * `winner-map.svelte`, Muster `WinnerMapController`/`StimmbezirkLoader` --
 * eigene Klasse statt Inline-State). Kapselt sowohl das Karten-Highlight
 * (`mapCtl.highlight`, inkl. Stimmbezirk-uwbId) als auch Gebiets-Slug/-Name
 * für das Ergebnis-Panel (Story 6: NUR kiez/bezirk, das Panel hat keinen
 * Stimmbezirks-Zweig -- Series-API kennt diese Ebene nicht).
 */
import { resolveSpatialLevel } from '$lib/data/resolve-spatial-level.js';
import type { GeocodeSuggestion } from '$lib/data';
import type { GebietFeatureCollection } from './winner-map-data.js';
import type { WinnerMapController } from './winner-map-maplibre.svelte.js';
import type { StimmbezirkLoader } from './winner-map-stimmbezirk.svelte.js';
import type { WahlPortalEbene } from '$lib/utils/wahl-portal-url-state.js';

export interface AddressHighlightDeps {
	readonly getAnzeigeEbene: () => WahlPortalEbene;
	readonly getJoinedFc: () => GebietFeatureCollection | null;
	readonly sbLoader: StimmbezirkLoader;
	readonly mapCtl: WinnerMapController;
	readonly fetchFn: typeof fetch;
}

export class AddressHighlight {
	hint = $state<string | null>(null);
	/** Kiez-/Bezirk-Slug + Name für das Ergebnis-Panel; bleibt `null` auf Stimmbezirk. */
	gebietSlug = $state<string | null>(null);
	gebietName = $state<string | null>(null);

	#deps: AddressHighlightDeps;

	constructor(deps: AddressHighlightDeps) {
		this.#deps = deps;
	}

	/** Anzeige-Ebenen-Wechsel invalidiert eine evtl. aktive Hervorhebung
	 * (das Feature gehört zur alten Geometrie/Ebene). */
	reset(): void {
		this.hint = null;
		this.gebietSlug = null;
		this.gebietName = null;
		this.#deps.mapCtl.highlight(this.#deps.getJoinedFc(), null);
	}

	async select(s: GeocodeSuggestion): Promise<void> {
		const { getAnzeigeEbene, getJoinedFc, sbLoader, mapCtl, fetchFn } = this.#deps;
		const anzeigeEbene = getAnzeigeEbene();

		if (anzeigeEbene === 'stimmbezirk') {
			if (sbLoader.geometryStatus !== 'loaded' || !sbLoader.geometry) {
				this.hint = 'Karte lädt noch, bitte gleich erneut versuchen.';
				return;
			}
			const uwbId = sbLoader.resolveAddress(s.lat, s.lng);
			if (!uwbId) {
				this.hint = 'Für diese Adresse liegt kein Gebiet in Berlin vor.';
				mapCtl.highlight(getJoinedFc(), null);
				return;
			}
			this.hint = `Stimmbezirk ${uwbId} hervorgehoben.`;
			mapCtl.highlight(getJoinedFc(), uwbId);
			return;
		}

		let ctx;
		try {
			ctx = await resolveSpatialLevel(s.lat, s.lng, fetchFn);
		} catch {
			this.hint = 'Adresse konnte nicht aufgelöst werden.';
			return;
		}
		// Re-validieren nach dem await: ein Ebenen-Wechsel im Flug hat reset()
		// gerufen, das Ergebnis gehoert zur alten Geometrie.
		if (getAnzeigeEbene() !== anzeigeEbene) return;
		const slug = anzeigeEbene === 'bezirk' ? ctx.bezirkSlug : ctx.kiezSlug;
		const name = anzeigeEbene === 'bezirk' ? ctx.bezirkName : ctx.kiezName;
		if (!slug) {
			this.hint = 'Für diese Adresse liegt kein Gebiet in Berlin vor.';
			this.gebietSlug = null;
			this.gebietName = null;
			mapCtl.highlight(getJoinedFc(), null);
			return;
		}
		this.hint = name ? `${name} hervorgehoben.` : null;
		this.gebietSlug = slug;
		this.gebietName = name;
		mapCtl.highlight(getJoinedFc(), slug);
	}
}
