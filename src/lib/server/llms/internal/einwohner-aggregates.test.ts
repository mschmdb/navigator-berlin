import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { loadEinwohnerAggregates } from './einwohner-aggregates.js';

describe('loadEinwohnerAggregates', () => {
	it('liest slug-gekeyte Kiez- und Bezirks-Einwohner aus dem Demografie-Payload', async () => {
		const agg = await loadEinwohnerAggregates(process.cwd());
		expect(agg.kiez.get('regierungsviertel')).toBe(13637);
		expect(agg.bezirk.get('mitte')).toBeGreaterThan(300000);
		expect(agg.kiez.size).toBe(143);
		expect(agg.bezirk.size).toBe(12);
	});

	it('liefert leere Maps für ein Verzeichnis ohne Payload', async () => {
		const agg = await loadEinwohnerAggregates('/nonexistent-root');
		expect(agg.kiez.size).toBe(0);
		expect(agg.bezirk.size).toBe(0);
	});
});

describe('loadEinwohnerAggregates · Fehlerklassen', () => {
	const scratchRoot = path.join(
		process.env.TMPDIR ?? '/tmp',
		`einwohner-aggregates-test-${process.pid}`
	);

	it('warnt bei kaputtem JSON, statt Korruption still als leer auszugeben', async () => {
		const dir = path.join(scratchRoot, 'corrupt', 'static', 'data');
		await mkdir(dir, { recursive: true });
		await writeFile(path.join(dir, 'einwohner-lor.json'), 'das ist kein json', 'utf-8');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const agg = await loadEinwohnerAggregates(path.join(scratchRoot, 'corrupt'));
		expect(agg.kiez.size).toBe(0);
		expect(warn).toHaveBeenCalledOnce();
		expect(String(warn.mock.calls[0][0])).toContain('einwohner-aggregates');
		warn.mockRestore();
	});

	it('bleibt bei fehlender Datei still (ENOENT ist der erwartete Leer-Fall)', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const agg = await loadEinwohnerAggregates(path.join(scratchRoot, 'missing-root'));
		expect(agg.kiez.size).toBe(0);
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	it('behält eine echte 0 als bekannten Wert in der Map', async () => {
		const dir = path.join(scratchRoot, 'zero', 'static', 'data');
		await mkdir(dir, { recursive: true });
		await writeFile(
			path.join(dir, 'einwohner-lor.json'),
			JSON.stringify({ kiez: { leerer_kiez: { gesamt: 0 } }, bezirk: {} }),
			'utf-8'
		);
		const agg = await loadEinwohnerAggregates(path.join(scratchRoot, 'zero'));
		expect(agg.kiez.get('leerer_kiez')).toBe(0);
	});
});
