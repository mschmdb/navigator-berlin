import { loadLorFeatures, findLorIdContaining } from './get-kiez-score.js';

const LAERM_DB_URL = '/data/laerm-db-lor.json';

interface LaermDbRecord {
	plrId: string;
	dbDenMean: number;
}
interface LaermDbPayload {
	records: LaermDbRecord[];
}

let cache: LaermDbPayload | null = null;
let inflight: Promise<LaermDbPayload | null> | null = null;

async function loadPayload(fetchFn: typeof fetch): Promise<LaermDbPayload | null> {
	if (cache) return cache;
	if (inflight) return inflight;
	inflight = (async () => {
		const res = await fetchFn(LAERM_DB_URL, { cache: 'no-cache' });
		if (!res.ok) {
			inflight = null;
			return null;
		}
		cache = (await res.json()) as LaermDbPayload;
		inflight = null;
		return cache;
	})();
	return inflight;
}

/**
 * Lärm-dB-Kiez-Mittel (L_DEN) für eine Adresse: löst den LOR-Planungsraum auf und
 * liefert dessen dB-Mittel (Story 10.6b). `null` wenn kein LOR-Treffer oder Daten fehlen.
 */
export async function getLaermDbAt(
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch
): Promise<number | null> {
	const [payload, lorFeatures] = await Promise.all([
		loadPayload(fetchFn),
		loadLorFeatures(fetchFn)
	]);
	if (!payload || lorFeatures.length === 0) return null;
	const plrId = findLorIdContaining(lat, lng, lorFeatures);
	if (!plrId) return null;
	return payload.records.find((r) => r.plrId === plrId)?.dbDenMean ?? null;
}
