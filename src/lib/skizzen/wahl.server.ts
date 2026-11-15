import type { WahlArt, WahlBundle, WahlEbene, WahlPunkt } from './wahl-types';

const STIMMTYP = { btw: 'zweitstimme', agh: 'zweitstimme', bvv: 'einstimme' } as const;

/** Zeitreihe der stärksten Parteien eines Gebiets, Anteil in Prozent. Leer ohne DB. */
export async function loadWahlSeries(
	ebene: WahlEbene,
	slug: string | null,
	typ: WahlArt
): Promise<WahlPunkt[]> {
	if (!process.env.DATABASE_URL) return [];
	try {
		const { getSeriesForGebiet } =
			await import('$lib/server/db/queries/wahl/get-series-for-gebiet.js');
		const rows = await getSeriesForGebiet(slug, ebene, typ, STIMMTYP[typ], 6);
		return rows.map((r) => ({
			jahr: r.jahr,
			partei: r.parteiKurzname,
			farbe: r.farbeHex,
			anteil: r.anteil * 100
		}));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[skizze] WARN: wahl series failed (${msg})\n`);
		return [];
	}
}

export async function loadWahlBundle(ebene: WahlEbene, slug: string | null): Promise<WahlBundle> {
	const [btw, agh, bvv] = await Promise.all(
		(['btw', 'agh', 'bvv'] as const).map((t) => loadWahlSeries(ebene, slug, t))
	);
	return { btw, agh, bvv };
}
