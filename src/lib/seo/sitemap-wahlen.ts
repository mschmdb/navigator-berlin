import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { isStrictBuild } from '$lib/build/strict-build.js';
import type { SitemapSourceContext } from './sitemap-builder.js';

type SitemapWahlen = NonNullable<SitemapSourceContext['wahlen']>;

const PROD_HINT =
	'Der strikte Build bricht ab, damit die Wahl-Seiten nicht still aus der Sitemap verschwinden.';

function failOrWarn(message: string): SitemapWahlen {
	if (isStrictBuild()) {
		throw new Error(`[sitemap] ${message} ${PROD_HINT}`);
	}
	console.warn(
		`[sitemap] ${message} Sitemap entsteht ohne Wahl-Seiten (nur der strikte Build bricht ab).`
	);
	return [];
}

/**
 * Lädt die Wahlen für die Sitemap-Detailseiten.
 *
 * Strikter Build (`NAVIGATOR_STRICT_BUILD=1`, Dockerfile): fehlende `DATABASE_URL`, DB-Fehler oder
 * eine leere Liste werfen. Lokale Builds warnen laut und liefern `[]`.
 */
export async function loadWahlenForSitemap(): Promise<SitemapWahlen> {
	if (!process.env.DATABASE_URL) {
		return failOrWarn('DATABASE_URL fehlt, die Wahl-Daten sind nicht ladbar.');
	}
	let list: Awaited<ReturnType<typeof getWahlList>>;
	try {
		list = await getWahlList();
	} catch (err) {
		// Nur Code bzw. Typ: Fehlermeldungen der DB-Treiber können Verbindungsdaten enthalten.
		const reason =
			err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
				? err.code
				: err instanceof Error
					? err.name
					: 'unbekannter Fehler';
		return failOrWarn(`Wahl-Daten konnten nicht geladen werden (${reason}).`);
	}
	if (list.length === 0) return failOrWarn('Die DB liefert keine Wahl-Daten.');
	return list.map((w) => ({
		jahr: w.jahr,
		typ: w.typ,
		stimmtyp: w.stimmtyp,
		sourceUpdatedAt: w.sourceUpdatedAt ? w.sourceUpdatedAt.toISOString() : null
	}));
}
