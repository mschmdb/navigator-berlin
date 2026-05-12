import {
	announceGlobal,
	clearGlobalLive,
	GLOBAL_LIVE_ID_POLITE
} from '$lib/utils/aria-live.js';

// Compat-Alias: vor Story 1.9 zeigte MapLibreCanvas eine lokale Live-Region mit
// id="map-status". Story 1.9 zentralisiert die Live-Region in +layout.svelte
// (siehe UX-DR50). Wir re-exportieren die ID für Tests die noch danach greifen.
export const MAP_STATUS_ID = GLOBAL_LIVE_ID_POLITE;

export interface AnnounceOptions {
	clearAfterMs?: number;
}

export function announceMapStatus(text: string, options: AnnounceOptions = {}): void {
	announceGlobal(text, 'polite', options);
}

export function clearMapStatus(): void {
	clearGlobalLive('polite');
}
