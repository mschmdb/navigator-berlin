import type {
	DemografieByScope,
	KiezDemografieData
} from '../components/atlas/inspector-panel/internal/demografie-types.js';
import { loadLorFeatures, findLorIdContaining } from './get-kiez-score.js';

const DEMOGRAFIE_URL = '/data/einwohner-lor.json';
const QUELLE = 'Amt für Statistik Berlin-Brandenburg';
const LIZENZ = 'CC BY 4.0';

interface EinwohnerRecord {
	plrId: string;
	gesamt: number;
	kinder0bis6: number;
	kinder6bis12: number;
	senioren65plus: number;
	dichtePro_km2: number | null;
	jugendquotient: number | null;
	altenquotient: number | null;
	erwerbsanteil: number | null;
}

/** Aggregat-Record (Kiez/Bezirk): wie PLR-Record, ohne plrId. */
type AggregatRecord = Omit<EinwohnerRecord, 'plrId'>;

interface EinwohnerPayload {
	stichtag: string;
	records: EinwohnerRecord[];
	/** Slug-gekeyte Kiez-Aggregate (schemaVersion ≥ 2). */
	kiez?: Record<string, AggregatRecord>;
	/** Slug-gekeyte Bezirk-Aggregate (schemaVersion ≥ 2). */
	bezirk?: Record<string, AggregatRecord>;
}

let payloadCache: EinwohnerPayload | null = null;
let payloadInflight: Promise<EinwohnerPayload | null> | null = null;

export function _resetDemografieCache(): void {
	payloadCache = null;
	payloadInflight = null;
}

async function loadPayload(fetchFn: typeof fetch): Promise<EinwohnerPayload | null> {
	if (payloadCache) return payloadCache;
	if (payloadInflight) return payloadInflight;
	payloadInflight = (async () => {
		const res = await fetchFn(DEMOGRAFIE_URL, { cache: 'no-cache' });
		if (!res.ok) {
			payloadInflight = null;
			return null;
		}
		const data = (await res.json()) as EinwohnerPayload;
		payloadCache = data;
		payloadInflight = null;
		return data;
	})();
	return payloadInflight;
}

function share(count: number, total: number): number {
	return total > 0 ? count / total : 0;
}

function toData(record: AggregatRecord, stichtag: string): KiezDemografieData {
	return {
		einwohner: record.gesamt,
		dichteEwKm2: record.dichtePro_km2,
		anteilKinder0bis6: share(record.kinder0bis6, record.gesamt),
		anteilKinder6bis12: share(record.kinder6bis12, record.gesamt),
		anteilSenioren65plus: share(record.senioren65plus, record.gesamt),
		jugendquotient: record.jugendquotient,
		altenquotient: record.altenquotient,
		erwerbsanteil: record.erwerbsanteil,
		datenstand: stichtag,
		quelle: QUELLE,
		lizenz: LIZENZ
	};
}

/**
 * Demografie-Kontext für eine Adresse: löst den LOR-Planungsraum auf und liefert
 * dessen Einwohner-Datensatz (Story 10.5). `null` wenn kein LOR-Treffer oder Daten fehlen.
 */
export async function getKiezDemografieAt(
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch
): Promise<KiezDemografieData | null> {
	const [payload, lorFeatures] = await Promise.all([
		loadPayload(fetchFn),
		loadLorFeatures(fetchFn)
	]);
	if (!payload || lorFeatures.length === 0) return null;
	const plrId = findLorIdContaining(lat, lng, lorFeatures);
	if (!plrId) return null;
	const record = payload.records.find((r) => r.plrId === plrId);
	return record ? toData(record, payload.stichtag) : null;
}

/**
 * Demografie für alle drei Scopes an einer Adresse (Story 10.5 Scope-Umschaltung):
 * Standort = enthaltender PLR, Kiez/Bezirk = Slug-Lookup in den Aggregaten.
 * Jeder Scope ist unabhängig `null`-fähig (kein Treffer / fehlende Daten).
 */
export async function getDemografieByScopeAt(
	lat: number,
	lng: number,
	kiezSlug: string | null,
	bezirkSlug: string | null,
	fetchFn: typeof fetch = fetch
): Promise<DemografieByScope> {
	const empty: DemografieByScope = { standort: null, kiez: null, bezirk: null };
	const [payload, lorFeatures] = await Promise.all([
		loadPayload(fetchFn),
		loadLorFeatures(fetchFn)
	]);
	if (!payload) return empty;

	const plrId = lorFeatures.length > 0 ? findLorIdContaining(lat, lng, lorFeatures) : null;
	const plrRecord = plrId ? payload.records.find((r) => r.plrId === plrId) : undefined;
	const kiezRecord = kiezSlug ? payload.kiez?.[kiezSlug] : undefined;
	const bezirkRecord = bezirkSlug ? payload.bezirk?.[bezirkSlug] : undefined;

	return {
		standort: plrRecord ? toData(plrRecord, payload.stichtag) : null,
		kiez: kiezRecord ? toData(kiezRecord, payload.stichtag) : null,
		bezirk: bezirkRecord ? toData(bezirkRecord, payload.stichtag) : null
	};
}
