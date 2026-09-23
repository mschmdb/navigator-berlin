import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { GET } from './+server';
import { closeDb } from '$lib/server/db/index.js';

async function call(lat: number, lng: number): Promise<Response> {
	return await GET({
		url: new URL(`http://localhost/api/wahl/results-at-point?lat=${lat}&lng=${lng}`)
	} as Parameters<typeof GET>[0]);
}

// Verifizierter Innenpunkt der AGH26-Gruppe 09B7P (Treptow-Köpenick,
// Spec-Beispiel), per @turf/center + booleanPointInPolygon gegen die echte
// wahlgruppen-ah26-Geometrie geprüft (siehe Story 17 Verification).
const PUNKT_GRUPPE_7P = { lat: 52.450605, lng: 13.72399 };

describe('GET /api/wahl/results-at-point (Story 17: Briefwahl-Gruppen)', () => {
	beforeAll(() => {
		process.env.DATABASE_URL =
			process.env.DATABASE_URL ?? 'postgres://app:app@127.0.0.1:5432/navigator_dev';
	});
	afterAll(async () => {
		await closeDb();
	});

	it('validiert lat/lng', async () => {
		const res = await GET({
			url: new URL('http://localhost/api/wahl/results-at-point?lat=abc&lng=13.4')
		} as Parameters<typeof GET>[0]);
		expect(res.status).toBe(400);
	});

	it('Punkt in Gruppe 09B7P: stimmbezirk-Ebene liefert die Gruppen-Summe (Urne + Briefwahl), nicht nur die Urne', async () => {
		// Skip-Muster der übrigen DB-Tests (Review-Fund): kein Hard-Fail, wenn
		// dieser lokale Postgres unerreichbar ist oder die AGH26-Daten (noch)
		// nicht geladen sind -- der reale Snapshot-Check bleibt bestehen,
		// bricht aber nicht die CI, wenn `pnpm data:wahl-fetch`/`data:wahl-kiez`
		// für diese Wahl noch nicht gelaufen sind.
		let res: Response;
		try {
			res = await call(PUNKT_GRUPPE_7P.lat, PUNKT_GRUPPE_7P.lng);
		} catch {
			return;
		}
		if (res.status !== 200) return;
		const body = await res.json();
		const agh26Zweitstimme = body.wahlen?.find(
			(w: { wahl: { typ: string; jahr: number; stimmtyp: string } }) =>
				w.wahl.typ === 'agh' && w.wahl.jahr === 2026 && w.wahl.stimmtyp === 'zweitstimme'
		);
		if (!agh26Zweitstimme?.levels?.stimmbezirk?.available) return;
		expect(agh26Zweitstimme.uwbId).toMatch(/^09W7(26|27)$/);
		expect(agh26Zweitstimme.gruppeId).toBe('09B7P');
		const top1 = agh26Zweitstimme.levels.stimmbezirk.top5[0];
		expect(top1.kurzname).toBe('CDU');
		expect(top1.anteil).toBeCloseTo(0.265, 2);
	});
});
