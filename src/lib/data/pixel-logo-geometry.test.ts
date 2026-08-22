import { describe, expect, it } from 'vitest';
import {
	buildGeometry,
	coverageAt,
	initialFills,
	PALETTE,
	PALETTE_STRONG,
	PRESET,
	SILHOUETTE_PATH_D,
	seededRandom
} from './pixel-logo-geometry';

describe('buildGeometry', () => {
	it('liefert die eingefrorenen 296 Zellen des Master-Presets', () => {
		expect(buildGeometry().cells).toHaveLength(296);
	});

	it('deckt mit jeder Zelle mindestens die Schwelle der Silhouette ab', () => {
		const step = 100 / PRESET.grid;
		const inset = (PRESET.gap / 100) * step;
		const outside = buildGeometry().cells.filter(
			(cell) => coverageAt(cell.x - inset / 2, cell.y - inset / 2, step) < PRESET.threshold / 100
		);
		expect(outside).toEqual([]);
	});

	it('hält jede Zelle vollständig in der viewBox 0..100', () => {
		const { cells, size } = buildGeometry();
		const escaped = cells.filter(
			(cell) => cell.x < 0 || cell.y < 0 || cell.x + size > 100 || cell.y + size > 100
		);
		expect(escaped).toEqual([]);
	});

	it('leitet Kantenlänge und Eckenradius aus Fugen- und Eckenwert ab', () => {
		const { size, radius } = buildGeometry();
		const step = 100 / PRESET.grid;
		expect(size).toBeCloseTo(step * (1 - PRESET.gap / 100), 3);
		expect(radius).toBeCloseTo((size * PRESET.round) / 200, 3);
	});

	it('bleibt bei jeder Rendergröße dasselbe Raster, es wird nur kleiner gezeichnet', () => {
		expect(buildGeometry().cells).toEqual(buildGeometry(PRESET).cells);
	});

	it('verwirft bei voller Deckungs-Schwelle die Randzellen', () => {
		const strict = buildGeometry({ ...PRESET, threshold: 100 });
		expect(strict.cells.length).toBeLessThan(buildGeometry().cells.length);
		expect(strict.cells.length).toBeGreaterThan(0);
	});

	it('liefert kein Raster, wenn keine Zelle die Schwelle erreicht', () => {
		expect(buildGeometry({ ...PRESET, grid: 1, threshold: 100 }).cells).toEqual([]);
	});
});

describe('seededRandom', () => {
	it('liefert für denselben Seed dieselbe Folge', () => {
		const a = seededRandom(PRESET.seed);
		const b = seededRandom(PRESET.seed);
		expect(Array.from({ length: 8 }, a)).toEqual(Array.from({ length: 8 }, b));
	});

	it('liefert für andere Seeds eine andere Folge', () => {
		const a = seededRandom(PRESET.seed);
		const b = seededRandom(PRESET.seed + 1);
		expect(Array.from({ length: 8 }, a)).not.toEqual(Array.from({ length: 8 }, b));
	});

	it('bleibt im Intervall [0, 1)', () => {
		const next = seededRandom(PRESET.seed);
		const values = Array.from({ length: 500 }, next);
		expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
	});
});

describe('initialFills', () => {
	it('liefert für jede Zelle eine Farbe aus der Palette', () => {
		const fills = initialFills(buildGeometry().cells.length);
		expect(fills).toHaveLength(296);
		expect(fills.every((fill) => PALETTE.includes(fill))).toBe(true);
	});

	it('ist über zwei Aufrufe reproduzierbar, damit SSR und Hydration übereinstimmen', () => {
		expect(initialFills(296)).toEqual(initialFills(296));
	});

	it('reagiert auf einen abweichenden Seed', () => {
		expect(initialFills(296)).not.toEqual(initialFills(296, PRESET.seed + 1));
	});

	it('liefert für null Zellen eine leere Liste', () => {
		expect(initialFills(0)).toEqual([]);
	});
});

describe('PALETTE_STRONG', () => {
	it('ist eine Teilmenge der Palette ohne die blassen Tints', () => {
		expect(PALETTE_STRONG.length).toBeLessThan(PALETTE.length);
		expect(PALETTE_STRONG.every((color) => PALETTE.includes(color))).toBe(true);
		expect(PALETTE_STRONG).not.toContain('#F7F7F7');
		expect(PALETTE_STRONG).not.toContain('#FDDBC7');
	});

	it('hält jede Farbe dunkel genug, damit sie auf hellem Grund trägt', () => {
		const luminance = (hex: string): number => {
			const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		};
		expect(PALETTE_STRONG.every((color) => luminance(color) < 0.62)).toBe(true);
	});
});

describe('initialFills mit eigener Palette', () => {
	it('zieht die Farben aus der übergebenen Palette', () => {
		const fills = initialFills(200, PRESET.seed, PALETTE_STRONG);
		expect(fills).toHaveLength(200);
		expect(fills.every((fill) => PALETTE_STRONG.includes(fill))).toBe(true);
	});

	it('liefert mit anderer Palette ein anderes Bild', () => {
		expect(initialFills(200, PRESET.seed, PALETTE_STRONG)).not.toEqual(initialFills(200));
	});
});

describe('SILHOUETTE_PATH_D', () => {
	it('ist die geschlossene 32-Punkte-Kontur in der viewBox 0..100', () => {
		expect(SILHOUETTE_PATH_D.startsWith('M ')).toBe(true);
		expect(SILHOUETTE_PATH_D.endsWith(' Z')).toBe(true);
		const pairs = SILHOUETTE_PATH_D.match(/[\d.]+,[\d.]+/g)!;
		expect(pairs).toHaveLength(32);
		for (const pair of pairs) {
			const [x, y] = pair.split(',').map(Number);
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThanOrEqual(100);
			expect(y).toBeGreaterThanOrEqual(0);
			expect(y).toBeLessThanOrEqual(100);
		}
	});
});
