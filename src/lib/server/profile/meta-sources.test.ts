import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import {
	readBezirkComposite,
	readEinwohnerStichtag,
	readLayerAggregatesFile
} from './meta-sources.js';

describe('meta-sources', () => {
	it('liest den Stichtag als ISO-Datum', async () => {
		expect(await readEinwohnerStichtag()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('liest den Bezirks-Composite als Zahl', async () => {
		expect(typeof (await readBezirkComposite('reinickendorf'))).toBe('number');
	});

	it('liefert null für unbekannte Bezirke', async () => {
		expect(await readBezirkComposite('gibt-es-nicht')).toBeNull();
	});

	it('liest die Layer-Aggregate mit Berlin-Wert für die Kachel-Layer', async () => {
		const file = await readLayerAggregatesFile();
		expect(file?.schemaVersion).toBe(1);
		expect(file?.aggregates['zensus-bestandsmiete-2022']?.berlin).toBeDefined();
	});

	it('liefert null für fehlende Datei, falsche schemaVersion und aggregates null', async () => {
		expect(await readLayerAggregatesFile('static/gibt-es-nicht.json')).toBeNull();
		const dir = await mkdtemp(join(tmpdir(), 'agg-'));
		const write = async (name: string, body: unknown): Promise<string> => {
			const abs = join(dir, name);
			await writeFile(abs, JSON.stringify(body));
			return relative(process.cwd(), abs);
		};
		expect(
			await readLayerAggregatesFile(await write('v2.json', { schemaVersion: 2, aggregates: {} }))
		).toBeNull();
		expect(
			await readLayerAggregatesFile(
				await write('null.json', { schemaVersion: 1, aggregates: null })
			)
		).toBeNull();
	});

	it('cached den Standardpfad (gleiches Promise)', () => {
		expect(readLayerAggregatesFile()).toBe(readLayerAggregatesFile());
	});
});
