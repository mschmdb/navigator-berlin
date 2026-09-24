/**
 * Feature-Flags für stufenweise Rollouts. Hard-gated zur Build-Time, kein Network-Call.
 * Erweiterung pro Story: neue Flags hier ergänzen, dann Konsument via `featureFlags.<key>` gaten.
 */
export const featureFlags = Object.freeze({
	/** Story 1.27: Side-by-Side Adress-Vergleich (Compare-Modus). */
	compareMode: true,
	/** Story 1.28: Kiez-Score Cross-Layer-Index als Inspector-Section + Karten-Layer. */
	kiezScore: true,
	/** Story 6.3: Inspector-Section "Wahlverhalten hier" mit Multi-Level-Switch. */
	wahlSection: true,
	/** Story 6.7: Cross-Layer-Story-Block. Co-Design-Sign-off 2026-05-19 für wahl-trend-zeit-kiez. */
	crossLayerStoryBlock: true,
	/** Kiez-Finder: Live-Passungs-Suche über der Karte (Spec 2026-08-22). */
	kiezFinder: true,
	/**
	 * Story 3 (Portal-Skeleton /berlin-wahlen): Start-Zustand `false` bis
	 * UX-Review. Route rendert immer (kein 404 am Flag), aber `noindex` +
	 * kein Sitemap-/llms-Eintrag solange aus.
	 *
	 * Story 16 (Detailseiten-Umzug): Matze-Entscheidung 23.09. (1A) auf `true`
	 * gesetzt. Portal ist ab diesem Deploy indexierbar, in Sitemap und llms;
	 * die `/wahl`→`/berlin-wahlen`-Redirects greifen mit dem ersten Deploy
	 * dieses Stands (das Launch-Deploy folgt frühestens 29.09.).
	 */
	wahlPortal: true
});

export type FeatureFlag = keyof typeof featureFlags;
