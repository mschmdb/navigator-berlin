import { describe, it, expect } from 'vitest';
import { getMobilityRating } from './mobility-rating.js';
import type { NearestStop, Modus } from './nearest-oepnv-stop.js';

function stop(distanceM: number, name = 'X'): NearestStop {
	return { name, lat: 0, lng: 0, distanceM, walkingMin: Math.ceil(distanceM / 80) };
}

function nearest(opts: Partial<Record<Modus, NearestStop | null>>) {
	return {
		ubahn: opts.ubahn ?? null,
		sbahn: opts.sbahn ?? null,
		tram: opts.tram ?? null,
		bus: opts.bus ?? null
	};
}

describe('getMobilityRating', () => {
	it('rates Top when U-Bahn ≤300m', () => {
		const r = getMobilityRating(nearest({ ubahn: stop(200) }));
		expect(r.key).toBe('top');
		expect(r.severity).toBe('success');
	});

	it('rates Top when U-Bahn 220m + Bus nearby (combined score)', () => {
		const r = getMobilityRating(
			nearest({ ubahn: stop(220), bus: stop(116) })
		);
		expect(r.key).toBe('top');
	});

	it('rates Gut when only U-Bahn 400m', () => {
		const r = getMobilityRating(nearest({ ubahn: stop(400) }));
		expect(r.key).toBe('gut');
		expect(r.severity).toBe('success');
	});

	it('rates Solide when only Schnellbahn 580m', () => {
		const r = getMobilityRating(nearest({ ubahn: stop(580) }));
		expect(r.key).toBe('solide');
		expect(r.severity).toBe('success-soft');
	});

	it('rates Solide when Bus very close (118m) alone', () => {
		// Bus 118m → 1.5 → solide (was eingeschränkt before)
		const r = getMobilityRating(nearest({ bus: stop(118) }));
		expect(r.key).toBe('solide');
		expect(r.severity).toBe('success-soft');
	});

	it('rates Solide when Tram ≤300m', () => {
		const r = getMobilityRating(nearest({ tram: stop(200) }));
		expect(r.key).toBe('solide');
	});

	it('rates Ausreichend when only Bus 400m', () => {
		const r = getMobilityRating(nearest({ bus: stop(400) }));
		expect(r.key).toBe('ausreichend');
		expect(r.severity).toBe('neutral');
	});

	it('rates Ausreichend when only Tram 580m', () => {
		const r = getMobilityRating(nearest({ tram: stop(580) }));
		expect(r.key).toBe('ausreichend');
	});

	it('rates Keine when nothing within range', () => {
		const r = getMobilityRating(nearest({}));
		expect(r.key).toBe('keine');
		expect(r.severity).toBe('danger');
	});

	it('rates Gut combining Schnellbahn 580m + Bus 100m (score 3.5)', () => {
		const r = getMobilityRating(
			nearest({ ubahn: stop(580), bus: stop(100) })
		);
		expect(r.key).toBe('gut');
	});

	it('picks minimum of U and S for Schnellbahn distance', () => {
		const r = getMobilityRating(nearest({ ubahn: stop(450), sbahn: stop(200) }));
		expect(r.key).toBe('top');
	});

	it('labels use consistent "angebunden" suffix across all levels', () => {
		expect(getMobilityRating(nearest({ ubahn: stop(100) })).label).toBe('Sehr gut angebunden');
		expect(getMobilityRating(nearest({ ubahn: stop(400) })).label).toBe('Gut angebunden');
		expect(getMobilityRating(nearest({ ubahn: stop(580) })).label).toBe('Solide angebunden');
		expect(getMobilityRating(nearest({ bus: stop(400) })).label).toBe('Ausreichend angebunden');
		expect(getMobilityRating(nearest({})).label).toBe('Nicht angebunden');
	});
});

describe('getMobilityRating residential soft-cutoff', () => {
	function soft(distanceM: number, name = 'X'): NearestStop {
		return {
			name,
			lat: 0,
			lng: 0,
			distanceM,
			walkingMin: Math.ceil(distanceM / 80),
			soft: true
		};
	}

	it('rates "schwach" when residential + only soft stops present', () => {
		const r = getMobilityRating(
			nearest({ sbahn: soft(900) }),
			{ isResidential: true }
		);
		expect(r.key).toBe('schwach');
		expect(r.severity).toBe('warning');
		expect(r.label).toBe('Schwach angebunden');
	});

	it('rates "keine" when NOT residential, even with soft stops', () => {
		const r = getMobilityRating(
			nearest({ sbahn: soft(900) }),
			{ isResidential: false }
		);
		expect(r.key).toBe('keine');
		expect(r.severity).toBe('danger');
	});

	it('rates "keine" when residential but no soft stops either', () => {
		const r = getMobilityRating(nearest({}), { isResidential: true });
		expect(r.key).toBe('keine');
	});

	it('ignores soft stops in scoring when hard stop exists', () => {
		const r = getMobilityRating(
			nearest({ ubahn: stop(200), sbahn: soft(1200) }),
			{ isResidential: true }
		);
		expect(r.key).toBe('top');
	});

	it('isResidential default false: no schwach upgrade', () => {
		const r = getMobilityRating(nearest({ sbahn: soft(900) }));
		expect(r.key).toBe('keine');
	});

	it('schwach score is 0 (soft stops contribute no score)', () => {
		const r = getMobilityRating(
			nearest({ sbahn: soft(900), bus: soft(800) }),
			{ isResidential: true }
		);
		expect(r.key).toBe('schwach');
		expect(r.score).toBe(0);
	});
});
