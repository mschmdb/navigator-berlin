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
	crossLayerStoryBlock: true
});

export type FeatureFlag = keyof typeof featureFlags;
