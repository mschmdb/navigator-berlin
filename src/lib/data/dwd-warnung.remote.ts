import { query } from '$app/server';
import { fetchBerlinHeatWarning } from '$lib/server/dwd-warnings.js';
import type { HeatWarning } from './dwd-warnung.types.js';

// Story 16.2: ADR-009-Boundary. Keine Eingabe-Args. Fehler degradieren serverseitig zu null.
export const getBerlinHeatWarning = query(
	async (): Promise<HeatWarning | null> => fetchBerlinHeatWarning()
);
