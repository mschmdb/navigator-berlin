import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildTippecanoeArgs, TippecanoeMissingError } from './tippecanoe.js';

describe('buildTippecanoeArgs', () => {
	it('Default-Flags: -z14 -Z10, no-feature-limit, extend-zooms, force', () => {
		const args = buildTippecanoeArgs('/tmp/in.geojson', '/tmp/out.pmtiles', {
			layerName: 'test-layer'
		});
		expect(args).toContain('-o');
		expect(args[args.indexOf('-o') + 1]).toBe('/tmp/out.pmtiles');
		expect(args).toContain('-z');
		expect(args[args.indexOf('-z') + 1]).toBe('14');
		expect(args).toContain('-Z');
		expect(args[args.indexOf('-Z') + 1]).toBe('10');
		expect(args).toContain('-l');
		expect(args[args.indexOf('-l') + 1]).toBe('test-layer');
		expect(args).toContain('--no-feature-limit');
		expect(args).toContain('--no-tile-size-limit');
		expect(args).toContain('--extend-zooms-if-still-dropping');
		expect(args).toContain('--force');
		expect(args).not.toContain('--drop-densest-as-needed');
		expect(args[args.length - 1]).toBe('/tmp/in.geojson');
	});

	it('Custom-Zoom-Range', () => {
		const args = buildTippecanoeArgs('/in', '/out', {
			layerName: 'x',
			minZoom: 12,
			maxZoom: 18
		});
		expect(args[args.indexOf('-z') + 1]).toBe('18');
		expect(args[args.indexOf('-Z') + 1]).toBe('12');
	});

	it('includeProperties → -y pro Property', () => {
		const args = buildTippecanoeArgs('/in', '/out', {
			layerName: 'x',
			includeProperties: ['wol', 'strasse']
		});
		const yArgs = args.reduce<string[]>((acc, a, i) => {
			if (a === '-y') acc.push(args[i + 1]);
			return acc;
		}, []);
		expect(yArgs).toEqual(['wol', 'strasse']);
	});

	it('extraFlags werden angehängt', () => {
		const args = buildTippecanoeArgs('/in', '/out', {
			layerName: 'x',
			extraFlags: ['--read-parallel']
		});
		expect(args).toContain('--read-parallel');
	});

	it('Reihenfolge: Output zuerst, Input zuletzt (tippecanoe-Konvention)', () => {
		const args = buildTippecanoeArgs('/path/to/input.geojson', '/path/to/output.pmtiles', {
			layerName: 'foo'
		});
		const outIdx = args.indexOf('-o');
		const inputIdx = args.indexOf('/path/to/input.geojson');
		expect(outIdx).toBeLessThan(inputIdx);
		expect(inputIdx).toBe(args.length - 1);
	});
});

describe('TippecanoeMissingError', () => {
	it('hat sprechenden Install-Hint', () => {
		const e = new TippecanoeMissingError();
		expect(e.message).toMatch(/brew install tippecanoe/);
		expect(e.message).toMatch(/apt install tippecanoe/);
		expect(e.name).toBe('TippecanoeMissingError');
	});
});

describe('isTippecanoeAvailable', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('true wenn tippecanoe --version exit 0', async () => {
		vi.doMock('node:child_process', () => ({
			execFile: (cmd: string, args: string[], cb: (err: Error | null, stdout: string) => void) => {
				cb(null, 'tippecanoe v2.81.0');
			},
			spawn: vi.fn()
		}));
		vi.doMock('node:util', () => ({
			promisify: (_fn: unknown) => async () => 'tippecanoe v2.81.0'
		}));
		const mod = await import('./tippecanoe.js');
		const ok = await mod.isTippecanoeAvailable();
		expect(ok).toBe(true);
	});

	it('false wenn tippecanoe --version wirft (nicht installiert)', async () => {
		vi.doMock('node:util', () => ({
			promisify: (_fn: unknown) => async () => {
				throw new Error('command not found');
			}
		}));
		const mod = await import('./tippecanoe.js');
		const ok = await mod.isTippecanoeAvailable();
		expect(ok).toBe(false);
	});
});
