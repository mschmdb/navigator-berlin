/**
 * Adress-Hervorhebung: Zustand + Handler ausgelagert (Datei-Zeilenlimit
 * `winner-map.svelte`, Muster `WinnerMapController`/`StimmbezirkLoader` --
 * eigene Klasse statt Inline-State). Kapselt sowohl das Karten-Highlight
 * (`mapCtl.highlight`, inkl. Stimmbezirk-uwbId) als auch Gebiets-Slug/-Name
 * für das Ergebnis-Panel (Story 6: NUR kiez/bezirk, das Panel hat keinen
 * Stimmbezirks-Zweig -- Series-API kennt diese Ebene nicht).
 */
import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';
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
	/** Optional: explizite Locale statt `getLocale()`-Default (i18n Block B,
	 * TS-Builder ohne reaktiven Component-Kontext). */
	readonly getLocale?: () => Locale;
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
		const { getAnzeigeEbene, getJoinedFc, sbLoader, mapCtl, fetchFn, getLocale } = this.#deps;
		const anzeigeEbene = getAnzeigeEbene();
		const opts = { locale: getLocale?.() };

		if (anzeigeEbene === 'stimmbezirk') {
			if (sbLoader.geometryStatus !== 'loaded' || !sbLoader.geometry) {
				this.hint = m.wahl_portal_address_hint_karte_laedt(undefined, opts);
				return;
			}
			const uwbId = sbLoader.resolveAddress(s.lat, s.lng);
			if (!uwbId) {
				this.hint = m.wahl_portal_address_hint_kein_gebiet(undefined, opts);
				mapCtl.highlight(getJoinedFc(), null);
				return;
			}
			const gruppenName =
				sbLoader.resolveAddressLabel(s.lat, s.lng, opts.locale) ??
				m.wahl_portal_gruppe_fallback_label({ id: uwbId }, opts);
			this.hint = m.wahl_portal_address_hint_hervorgehoben({ name: gruppenName }, opts);
			mapCtl.highlight(getJoinedFc(), uwbId);
			return;
		}

		let ctx;
		try {
			ctx = await resolveSpatialLevel(s.lat, s.lng, fetchFn);
		} catch {
			this.hint = m.wahl_portal_address_hint_fehler(undefined, opts);
			return;
		}
		// Re-validieren nach dem await: ein Ebenen-Wechsel im Flug hat reset()
		// gerufen, das Ergebnis gehoert zur alten Geometrie.
		if (getAnzeigeEbene() !== anzeigeEbene) return;
		const slug = anzeigeEbene === 'bezirk' ? ctx.bezirkSlug : ctx.kiezSlug;
		const name = anzeigeEbene === 'bezirk' ? ctx.bezirkName : ctx.kiezName;
		if (!slug) {
			this.hint = m.wahl_portal_address_hint_kein_gebiet(undefined, opts);
			this.gebietSlug = null;
			this.gebietName = null;
			mapCtl.highlight(getJoinedFc(), null);
			return;
		}
		this.hint = name ? m.wahl_portal_address_hint_hervorgehoben({ name }, opts) : null;
		this.gebietSlug = slug;
		this.gebietName = name;
		mapCtl.highlight(getJoinedFc(), slug);
	}
}
