import { describe, expect, it } from 'vitest';
import { buildScaleFamily, BACKGROUND_TOKEN } from './check-scale-contrast.js';
import { contrastRatio } from './oklch-interpolate.js';

describe('buildScaleFamily', () => {
	it('liefert 5 Hex-Werte pro Familie', () => {
		const out = buildScaleFamily('#F5DDD5', '#8C2A14', BACKGROUND_TOKEN);
		expect(out).toHaveLength(5);
	});

	it('Stufe-1 jeder Familie ≥ 3:1 Kontrast gegen Bg', () => {
		const last = buildScaleFamily('#F5DDD5', '#8C2A14', BACKGROUND_TOKEN);
		const gut = buildScaleFamily('#DDEDDE', '#1F5A2E', BACKGROUND_TOKEN);
		const strukturell = buildScaleFamily('#DDE1ED', '#2A3F7C', BACKGROUND_TOKEN);
		expect(contrastRatio(last[0], BACKGROUND_TOKEN)).toBeGreaterThanOrEqual(3.0);
		expect(contrastRatio(gut[0], BACKGROUND_TOKEN)).toBeGreaterThanOrEqual(3.0);
		expect(contrastRatio(strukturell[0], BACKGROUND_TOKEN)).toBeGreaterThanOrEqual(3.0);
	});

	it('Stufe-5 = Endpoint-Token unverändert', () => {
		const last = buildScaleFamily('#F5DDD5', '#8C2A14', BACKGROUND_TOKEN);
		expect(last[4].toLowerCase()).toBe('#8c2a14');
	});

	it('Snapshot Last (Vermillion) — 5 Werte mit ≥3:1 stage-1', () => {
		const last = buildScaleFamily('#F5DDD5', '#8C2A14', BACKGROUND_TOKEN);
		expect(last).toMatchInlineSnapshot(`
			[
			  "#8f7972",
			  "#90675b",
			  "#905545",
			  "#8f412e",
			  "#8c2a14",
			]
		`);
	});

	it('Snapshot Gut (Grün) — 5 Werte mit ≥3:1 stage-1', () => {
		const gut = buildScaleFamily('#DDEDDE', '#1F5A2E', BACKGROUND_TOKEN);
		expect(gut).toMatchInlineSnapshot(`
			[
			  "#79887a",
			  "#647c66",
			  "#4f7153",
			  "#396641",
			  "#1f5a2e",
			]
		`);
	});

	it('Snapshot Strukturell (Indigo) — 5 Werte mit ≥3:1 stage-1', () => {
		const strukturell = buildScaleFamily('#DDE1ED', '#2A3F7C', BACKGROUND_TOKEN);
		expect(strukturell).toMatchInlineSnapshot(`
			[
			  "#797d88",
			  "#656e86",
			  "#515e83",
			  "#3d4f80",
			  "#2a3f7c",
			]
		`);
	});
});
