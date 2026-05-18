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
	wahlSection: true
});

export type FeatureFlag = keyof typeof featureFlags;
