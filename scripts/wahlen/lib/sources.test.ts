import { describe, expect, it } from 'vitest';
import { WAHL_SOURCES, WB_AGH2026, WB_BVV2026 } from './sources';

describe('WAHL_SOURCES: AGH/BVV 2026 Endergebnis', () => {
	it('markiert AGH und BVV 2026 nicht mehr als vorläufig (Endergebnis 12.10.2026)', () => {
		expect(WB_AGH2026.vorlaeufig ?? false).toBe(false);
		expect(WB_BVV2026.vorlaeufig ?? false).toBe(false);
	});

	it('führt keine Quelle mehr als vorläufig', () => {
		expect(WAHL_SOURCES.filter((s) => s.vorlaeufig).map((s) => s.slug)).toEqual([]);
	});
});
