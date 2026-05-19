import * as XLSX from 'xlsx';
import { defaultHeaders } from '../../lib/user-agent.js';
import { assertAllowed } from '../../lib/allowlist.js';
import { withRetry } from '../../lib/retry.js';

export type SheetRow = (string | number | null)[];

export type SheetData = {
	name: string;
	headers: string[];
	rows: SheetRow[];
};

export async function fetchSbbXlsx(url: string): Promise<Buffer> {
	assertAllowed(url);
	return withRetry(async () => {
		const res = await fetch(url, { headers: defaultHeaders() });
		if (!res.ok) throw new Error(`SBB XLSX ${url} HTTP ${res.status}`);
		const arrBuf = await res.arrayBuffer();
		return Buffer.from(arrBuf);
	});
}

export function loadWorkbook(xlsx: Buffer): XLSX.WorkBook {
	return XLSX.read(xlsx, { type: 'buffer' });
}

export function listSheetNames(wb: XLSX.WorkBook): string[] {
	return wb.SheetNames.slice();
}

function normalizeHeader(value: unknown): string {
	if (value == null) return '';
	return String(value).replace(/\r?\n/g, ' ').trim();
}

export function extractSheet(wb: XLSX.WorkBook, sheetName: string): SheetData {
	const ws = wb.Sheets[sheetName];
	if (!ws) throw new Error(`SBB XLSX: sheet "${sheetName}" not found`);
	const raw = XLSX.utils.sheet_to_json<SheetRow>(ws, {
		header: 1,
		raw: true,
		defval: null
	}) as SheetRow[];
	if (raw.length === 0) {
		return { name: sheetName, headers: [], rows: [] };
	}
	const headers = (raw[0] ?? []).map(normalizeHeader);
	const rows = raw.slice(1);
	return { name: sheetName, headers, rows };
}

export function rowToObject(row: SheetRow, headers: readonly string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (let i = 0; i < headers.length; i++) {
		const v = row[i];
		out[headers[i]] = v == null ? '' : String(v);
	}
	return out;
}
