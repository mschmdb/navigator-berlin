import AdmZip from 'adm-zip';
import { defaultHeaders } from '../../lib/user-agent.js';
import { assertAllowed } from '../../lib/allowlist.js';
import { withRetry } from '../../lib/retry.js';

/**
 * Wahlbezirks-Shapefile-Pack im ZIP. SBB nutzt zwei Filename-Konventionen:
 * - Neuere Wahlen: `RBS_OD_UWB_<typ><jj>.shp` (z.B. RBS_OD_UWB_BT25.shp)
 * - Ältere Wahlen: `UWB.shp` oder `RBS_OD_UWB.shp` (kein Jahres-Suffix)
 */
export type ShapefilePack = {
	shp: Buffer;
	dbf: Buffer;
	prj: Buffer;
	cpg?: Buffer;
	shx?: Buffer;
	baseName: string;
};

const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export function isZipBuffer(buf: Buffer): boolean {
	if (buf.length < 4) return false;
	return buf.subarray(0, 4).equals(ZIP_MAGIC);
}

export async function fetchSbbGeoZip(downloadUrl: string): Promise<Buffer> {
	assertAllowed(downloadUrl);
	return withRetry(async () => {
		const res = await fetch(downloadUrl, { headers: defaultHeaders() });
		if (!res.ok) throw new Error(`SBB geo ${downloadUrl} HTTP ${res.status}`);
		const arrBuf = await res.arrayBuffer();
		const buf = Buffer.from(arrBuf);
		if (!isZipBuffer(buf)) {
			throw new Error(
				`SBB geo ${downloadUrl}: response is not a ZIP (got ${res.headers.get('content-type')}, size ${buf.byteLength}). ` +
					`Hash-URL may be stale; re-run Playwright recon against the /opendata/ live URL.`
			);
		}
		return buf;
	});
}

export function extractShapefilePack(zip: Buffer): ShapefilePack {
	const archive = new AdmZip(zip);
	const entries = archive.getEntries();
	const shpEntry = entries.find((e) => /\.shp$/i.test(e.entryName) && !/\.shp\.xml$/i.test(e.entryName));
	if (!shpEntry) throw new Error('SBB geo ZIP: no .shp file found');
	const baseName = shpEntry.entryName.replace(/\.shp$/i, '');

	const pick = (suffix: string): Buffer | undefined => {
		const re = new RegExp(`${escapeRegex(baseName)}\\.${suffix}$`, 'i');
		return entries.find((e) => re.test(e.entryName))?.getData();
	};

	const dbf = pick('dbf');
	const prj = pick('prj');
	if (!dbf) throw new Error(`SBB geo ZIP: missing ${baseName}.dbf`);
	if (!prj) throw new Error(`SBB geo ZIP: missing ${baseName}.prj`);

	return {
		shp: shpEntry.getData(),
		dbf,
		prj,
		cpg: pick('cpg'),
		shx: pick('shx'),
		baseName
	};
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
